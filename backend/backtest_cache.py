"""
Redis-based caching layer for backtest results

This module provides a caching system to avoid recalculating identical backtest requests,
improving performance by storing and retrieving results based on signals data and parameters.
"""

import redis
import json
import hashlib
import logging
import time
from datetime import timedelta
from typing import Optional, Dict, Any, Union, List
from datetime import datetime
import pandas as pd

# Import monitoring with proper error handling
try:
    from .backtest_monitoring import get_backtest_monitor
    MONITORING_AVAILABLE = True
except ImportError:
    MONITORING_AVAILABLE = False
    get_backtest_monitor = None

logger = logging.getLogger(__name__)


class BacktestCache:
    """
    Redis-based caching system for backtest results.
    
    Provides methods to cache and retrieve backtest results using MD5 hashing
    to generate cache keys based on signals data and parameters.
    """
    
    def __init__(self, redis_url: str = 'redis://localhost:6379', 
                 default_ttl_hours: int = 24, 
                 connection_timeout: int = 5,
                 retry_attempts: int = 3):
        """
        Initialize the backtest cache.
        
        Args:
            redis_url: Redis connection URL
            default_ttl_hours: Default time-to-live in hours for cached results
            connection_timeout: Redis connection timeout in seconds
            retry_attempts: Number of retry attempts for Redis operations
        """
        self.redis_url = redis_url
        self.default_ttl = timedelta(hours=default_ttl_hours)
        self.connection_timeout = connection_timeout
        self.retry_attempts = retry_attempts
        self.redis_client: Optional[redis.Redis] = None
        self._is_connected = False
        
        # TTL configurations for different result types
        self.ttl_configs = {
            'standard': timedelta(hours=24),
            'optimization': timedelta(hours=48),
            'montecarlo': timedelta(hours=12),
            'quick_scan': timedelta(hours=6)
        }
        
        self._initialize_redis()
    
    def _initialize_redis(self):
        """Initialize Redis connection with error handling."""
        try:
            self.redis_client = redis.from_url(
                self.redis_url,
                socket_timeout=self.connection_timeout,
                socket_connect_timeout=self.connection_timeout,
                retry_on_timeout=True
            )
            
            # Test connection
            self.redis_client.ping()
            self._is_connected = True
            logger.info(f"Successfully connected to Redis at {self.redis_url}")
            
        except redis.ConnectionError as e:
            logger.warning(f"Redis connection failed: {e}. Running without caching.")
            self._is_connected = False
            self.redis_client = None
            
        except Exception as e:
            logger.error(f"Unexpected error initializing Redis: {e}. Running without caching.")
            self._is_connected = False
            self.redis_client = None
    
    async def _execute_with_retry(self, operation, *args, **kwargs):
        """
        Execute Redis operation with retry logic.
        
        Args:
            operation: Redis operation function
            *args, **kwargs: Arguments for the operation
            
        Returns:
            Operation result or None if failed
        """
        if not self._is_connected or not self.redis_client:
            return None
            
        for attempt in range(self.retry_attempts):
            try:
                return await operation(*args, **kwargs)
            except (redis.ConnectionError, redis.TimeoutError) as e:
                logger.warning(f"Redis operation failed (attempt {attempt + 1}/{self.retry_attempts}): {e}")
                if attempt < self.retry_attempts - 1:
                    continue
                logger.error(f"Redis operation failed after {self.retry_attempts} attempts")
                return None
            except Exception as e:
                logger.error(f"Unexpected Redis error: {e}")
                return None
    
    async def get_backtest_result(self, cache_key: str) -> Optional[Dict[str, Any]]:
        """
        Get cached backtest result.
        
        Args:
            cache_key: Cache key for the backtest result
            
        Returns:
            Cached result as dictionary or None if not found or error occurred
        """
        if not self._is_connected or not self.redis_client:
            logger.debug("Redis not connected, skipping cache get")
            return None
            
        start_time = time.time()
        hit = False
        
        async def _get_operation():
            nonlocal hit
            logger.debug(f"Attempting to get cache for key: {cache_key}")
            if not self.redis_client:
                logger.error("redis_client is not initialized in _get_operation.")
                return None
            cached_result = await self.redis_client.get(cache_key)
            logger.debug(f"Raw cached result for key {cache_key}: {cached_result}")
            if cached_result:
                hit = True
                try:
                    # Handle both string and bytes responses
                    if isinstance(cached_result, bytes):
                        cached_result = cached_result.decode('utf-8')
                    logger.debug(f"Decoded cached result for key {cache_key}: {cached_result}")
                    return json.loads(cached_result)
                except json.JSONDecodeError as e:
                    logger.error(f"Failed to decode cached JSON for key {cache_key}: {e}")
                    return None
            return None
        
        result = await self._execute_with_retry(_get_operation)
        duration_ms = (time.time() - start_time) * 1000
        
        # Record cache operation with monitoring if available
        if MONITORING_AVAILABLE:
            try:
                # Import here to avoid circular import issues
                from .backtest_monitoring import get_backtest_monitor
                monitor = get_backtest_monitor()
                if monitor:
                    monitor.record_cache_operation('get', duration_ms, hit=hit)
            except Exception as e:
                logger.debug(f"Monitoring integration failed: {e}")
        
        if result is not None:
            logger.info(f"Cache HIT for key: {cache_key[:16]}...")
        else:
            logger.debug(f"Cache MISS for key: {cache_key[:16]}...")
            
        return result
    
    async def set_backtest_result(self, cache_key: str, result: Dict[str, Any],
                          result_type: str = 'standard', ttl: Optional[timedelta] = None) -> bool:
        """
        Cache backtest result.
        
        Args:
            cache_key: Cache key for the backtest result
            result: Backtest result dictionary to cache
            result_type: Type of result (affects TTL)
            ttl: Custom time-to-live, uses default if None
            
        Returns:
            True if successfully cached, False otherwise
        """
        if not self._is_connected or not self.redis_client:
            logger.debug("Redis not connected, skipping cache set")
            return False
            
        start_time = time.time()
        
        # Use TTL based on result type if no custom TTL provided
        if ttl is None:
            ttl = self.ttl_configs.get(result_type, self.default_ttl)
        
        async def _set_operation():
            if not self.redis_client:
                return False
            # Convert datetime objects to strings for JSON serialization
            serializable_result = self._make_json_serializable(result)
            
            await self.redis_client.setex(
                cache_key,
                int(ttl.total_seconds()),
                json.dumps(serializable_result, default=str)
            )
            return True
        
        success = await self._execute_with_retry(_set_operation)
        duration_ms = (time.time() - start_time) * 1000
        
        # Record cache operation with monitoring if available
        if MONITORING_AVAILABLE:
            try:
                # Import here to avoid circular import issues
                from .backtest_monitoring import get_backtest_monitor
                monitor = get_backtest_monitor()
                if monitor:
                    monitor.record_cache_operation('set', duration_ms)
            except Exception as e:
                logger.debug(f"Monitoring integration failed: {e}")
        
        if success:
            logger.info(f"Successfully cached result for key: {cache_key[:16]}... (TTL: {ttl})")
        else:
            logger.warning(f"Failed to cache result for key: {cache_key[:16]}...")
            
        return success if success is not None else False
    
    def generate_cache_key(self, signals_data: Union[List[Dict[str, Any]], pd.DataFrame],
                          params: Dict[str, Any]) -> str:
        """
        Generate cache key based on signals data and parameters using MD5 hashing.
        
        Args:
            signals_data: Signals data (list of dicts or DataFrame)
            params: Backtest parameters dictionary
            
        Returns:
            MD5 hash string as cache key
        """
        try:
            # Convert signals data to string representation
            if isinstance(signals_data, pd.DataFrame):  # DataFrame check first
                signals_str = signals_data.to_json()
            elif isinstance(signals_data, list):  # List of dicts
                signals_str = json.dumps(signals_data, sort_keys=True, default=str)
            else:  # Fallback
                signals_str = str(signals_data)
            
            # Convert parameters to sorted JSON string
            params_str = json.dumps(params, sort_keys=True, default=str)
            
            # Combine and hash
            key_data = f"{signals_str}_{params_str}"
            return hashlib.md5(key_data.encode()).hexdigest()
            
        except Exception as e:
            logger.error(f"Failed to generate cache key: {e}")
            # Fallback to simple hash of combined data
            fallback_data = str(signals_data) + str(params)
            return hashlib.md5(fallback_data.encode()).hexdigest()
    
    def generate_signals_hash(self, signals_data: Union[List[Dict[str, Any]], pd.DataFrame]) -> str:
        """
        Generate hash of signals data only.
        
        Args:
            signals_data: Signals data (list of dicts or DataFrame)
            
        Returns:
            MD5 hash string of signals data
        """
        try:
            if isinstance(signals_data, pd.DataFrame):  # DataFrame check first
                signals_str = signals_data.to_json()
            elif isinstance(signals_data, list):  # List of dicts
                signals_str = json.dumps(signals_data, sort_keys=True, default=str)
            else:  # Fallback
                signals_str = str(signals_data)
            
            return hashlib.md5(signals_str.encode()).hexdigest()
            
        except Exception as e:
            logger.error(f"Failed to generate signals hash: {e}")
            return hashlib.md5(str(signals_data).encode()).hexdigest()
    
    def _make_json_serializable(self, obj: Any) -> Any:
        """
        Convert non-JSON-serializable objects to serializable format.
        
        Args:
            obj: Object to make JSON serializable
            
        Returns:
            JSON serializable version of the object
        """
        if isinstance(obj, dict):
            return {k: self._make_json_serializable(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [self._make_json_serializable(item) for item in obj]
        elif isinstance(obj, (datetime, pd.Timestamp)):
            return obj.isoformat()
        elif hasattr(obj, 'item'):  # numpy data types
            return obj.item()
        else:
            return obj
    
    async def clear_cache(self, pattern: str = "*") -> int:
        """
        Clear cached results matching a pattern.
        
        Args:
            pattern: Redis key pattern to match (default: all keys)
            
        Returns:
            Number of keys deleted
        """
        if not self._is_connected or not self.redis_client:
            logger.debug("Redis not connected, skipping cache clear")
            return 0
            
        async def _clear_operation():
            try:
                if not self.redis_client:
                    return 0
                keys = await self.redis_client.keys(pattern)
                if keys:
                    # Convert list of keys to bytes if needed
                    keys_bytes = [key if isinstance(key, bytes) else key.encode() for key in keys]
                    return await self.redis_client.delete(*keys_bytes)
                return 0
            except Exception as e:
                logger.error(f"Error clearing cache: {e}")
                return 0
        
        deleted_count = await self._execute_with_retry(_clear_operation)
        if deleted_count is not None:
            logger.info(f"Cleared {deleted_count} cache entries matching pattern: {pattern}")
        return deleted_count or 0
    
    async def get_cache_stats(self) -> Dict[str, Any]:
        """
        Get cache statistics.
        
        Returns:
            Dictionary with cache statistics
        """
        if not self._is_connected or not self.redis_client:
            return {"status": "disconnected", "connected": False}
            
        async def _stats_operation():
            try:
                if not self.redis_client:
                    return {"status": "error", "connected": False, "error": "Redis client not initialized"}
                info = await self.redis_client.info()
                return {
                    "status": "connected",
                    "connected": True,
                    "used_memory": info.get('used_memory_human', 'N/A'),
                    "connected_clients": info.get('connected_clients', 0),
                    "total_commands_processed": info.get('total_commands_processed', 0),
                    "keyspace_hits": info.get('keyspace_hits', 0),
                    "keyspace_misses": info.get('keyspace_misses', 0)
                }
            except Exception as e:
                logger.error(f"Error getting cache stats: {e}")
                return {"status": "error", "connected": False, "error": str(e)}
        
        stats = await self._execute_with_retry(_stats_operation)
        if stats is None:
            return {"status": "error", "connected": False}
        return stats
    
    def is_available(self) -> bool:
        """
        Check if Redis cache is available.
        
        Returns:
            True if Redis is available and connected
        """
        return self._is_connected and self.redis_client is not None
    
    def __del__(self):
        """Cleanup Redis connection."""
        if self.redis_client:
            try:
                self.redis_client.close()
            except Exception as e:
                logger.warning(f"Error closing Redis connection: {e}")


# Global cache instance
_cache_instance: Optional[BacktestCache] = None


def get_backtest_cache(redis_url: str = 'redis://localhost:6379', 
                      default_ttl_hours: int = 24) -> BacktestCache:
    """
    Get global backtest cache instance (singleton pattern).
    
    Args:
        redis_url: Redis connection URL
        default_ttl_hours: Default time-to-live in hours
        
    Returns:
        BacktestCache instance
    """
    global _cache_instance
    if _cache_instance is None:
        _cache_instance = BacktestCache(redis_url, default_ttl_hours)
    return _cache_instance


async def clear_backtest_cache(pattern: str = "*") -> int:
    """
    Clear global backtest cache.
    
    Args:
        pattern: Redis key pattern to match
        
    Returns:
        Number of keys deleted
    """
    cache = get_backtest_cache()
    return await cache.clear_cache(pattern)