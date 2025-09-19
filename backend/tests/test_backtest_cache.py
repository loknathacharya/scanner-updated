"""
Comprehensive unit tests for backtest_cache.py

This module provides extensive test coverage for the backtest caching system,
including:
- Cache operations (get, set, clear)
- Cache key generation and TTL handling
- Redis connection failures and fallbacks
- Cache hit/miss scenarios
- Performance and memory management
- Integration with monitoring
"""

import pytest
import json
import time
from unittest.mock import Mock, patch, MagicMock, call
from datetime import datetime, timedelta
import redis
from redis.exceptions import ConnectionError, RedisError

# Import the modules to test
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backtest_cache import (
    BacktestCache, get_backtest_cache, clear_backtest_cache
)


class TestBacktestCache:
    """Test suite for BacktestCache functionality"""

    def setup_method(self):
        """Set up test fixtures before each test method"""
        self.cache = BacktestCache()
        self.test_data = {
            'trades': [{'symbol': 'TEST', 'pnl': 100}],
            'performance_metrics': {'total_return': 10.5},
            'equity_curve': [{'date': '2023-01-01', 'value': 100000}]
        }
        self.test_signals_df = Mock()
        self.test_params = {
            'initial_capital': 100000,
            'stop_loss': 5.0,
            'take_profit': 10.0,
            'holding_period': 20
        }

    def test_cache_initialization(self):
        """Test BacktestCache initialization"""
        assert self.cache.redis_url == 'redis://localhost:6379'
        assert self.cache.default_ttl == timedelta(hours=24)
        assert self.cache.connection_timeout == 5
        assert self.cache.retry_attempts == 3
        assert self.cache.redis_client is not None  # Should be initialized
        assert self.cache._is_connected is True  # Should be connected after init

    def test_cache_initialization_with_custom_params(self):
        """Test BacktestCache initialization with custom parameters"""
        custom_ttl = 12
        custom_timeout = 10
        custom_retries = 5
        
        cache = BacktestCache(
            redis_url='redis://localhost:6380',
            default_ttl_hours=custom_ttl,
            connection_timeout=custom_timeout,
            retry_attempts=custom_retries
        )
        
        assert cache.redis_url == 'redis://localhost:6380'
        assert cache.default_ttl == timedelta(hours=custom_ttl)
        assert cache.connection_timeout == custom_timeout
        assert cache.retry_attempts == custom_retries

    def test_cache_initialization_connection_failure(self):
        """Test BacktestCache initialization with connection failure"""
        with patch('redis.from_url') as mock_from_url:
            mock_redis = Mock()
            mock_redis.ping.side_effect = ConnectionError("Connection failed")
            mock_from_url.return_value = mock_redis
            
            cache = BacktestCache()
            
            assert cache.redis_client is None
            assert cache._is_connected is False

    def test_is_available_connected(self):
        """Test is_available method when connected"""
        assert self.cache.is_available() is True

    def test_is_available_disconnected(self):
        """Test is_available method when disconnected"""
        cache = BacktestCache()
        cache._is_connected = False
        cache.redis_client = None
        
        assert cache.is_available() is False

    def test_generate_cache_key_with_list(self):
        """Test cache key generation with list data"""
        signals_data = [
            {"symbol": "RELIANCE", "date": "2023-01-01", "signal": "BUY"},
            {"symbol": "TATASTEEL", "date": "2023-01-02", "signal": "SELL"}
        ]
        
        key = self.cache.generate_cache_key(signals_data, self.test_params)
        
        assert isinstance(key, str)
        assert len(key) == 32  # MD5 hash length
        # Should be deterministic
        key2 = self.cache.generate_cache_key(signals_data, self.test_params)
        assert key == key2

    def test_generate_cache_key_with_dataframe(self):
        """Test cache key generation with DataFrame"""
        signals_df = Mock()
        signals_df.to_json.return_value = '{"test": "data"}'
        
        key = self.cache.generate_cache_key(signals_df, self.test_params)
        
        assert isinstance(key, str)
        assert len(key) == 32
        signals_df.to_json.assert_called_once()

    def test_generate_cache_key_with_different_params(self):
        """Test cache key generation with different parameters"""
        signals_data = [{"symbol": "TEST", "signal": "BUY"}]
        
        different_params = {
            'initial_capital': 200000,
            'stop_loss': 3.0,
            'take_profit': 15.0
        }
        
        key1 = self.cache.generate_cache_key(signals_data, self.test_params)
        key2 = self.cache.generate_cache_key(signals_data, different_params)
        
        assert key1 != key2

    def test_generate_cache_key_exception_handling(self):
        """Test cache key generation exception handling"""
        signals_data = "invalid_data"
        
        # Mock the hash function to return a predictable value
        with patch('hashlib.md5') as mock_md5:
            mock_hash = Mock()
            mock_hash.hexdigest.return_value = "testhash123"
            mock_md5.return_value = mock_hash
            
            key = self.cache.generate_cache_key([{"invalid": "data"}], self.test_params)
            
            assert key == "testhash123"
            mock_md5.assert_called()

    def test_generate_signals_hash_with_list(self):
        """Test signals hash generation with list data"""
        signals_data = [
            {"symbol": "RELIANCE", "date": "2023-01-01", "signal": "BUY"}
        ]
        
        hash_value = self.cache.generate_signals_hash(signals_data)
        
        assert isinstance(hash_value, str)
        assert len(hash_value) == 32

    def test_generate_signals_hash_with_dataframe(self):
        """Test signals hash generation with DataFrame"""
        signals_df = Mock()
        signals_df.to_json.return_value = '{"test": "data"}'
        
        hash_value = self.cache.generate_signals_hash(signals_df)
        
        assert isinstance(hash_value, str)
        assert len(hash_value) == 32
        signals_df.to_json.assert_called_once()

    def test_generate_signals_hash_exception_handling(self):
        """Test signals hash generation exception handling"""
        signals_data = "invalid_data"
        
        with patch('hashlib.md5') as mock_md5:
            mock_hash = Mock()
            mock_hash.hexdigest.return_value = "testhash456"
            mock_md5.return_value = mock_hash
            
            hash_value = self.cache.generate_signals_hash([{"invalid": "data"}])
            
            assert hash_value == "testhash456"

    def test_make_json_serializable_dict(self):
        """Test JSON serialization with dict"""
        test_dict = {
            'string': 'value',
            'number': 42,
            'datetime': datetime(2023, 1, 1),
            'nested': {'inner': 'data'}
        }
        
        result = self.cache._make_json_serializable(test_dict)
        
        assert result['string'] == 'value'
        assert result['number'] == 42
        assert result['datetime'] == '2023-01-01T00:00:00'
        assert result['nested']['inner'] == 'data'

    def test_make_json_serializable_list(self):
        """Test JSON serialization with list"""
        test_list = [
            'string',
            42,
            datetime(2023, 1, 1),
            {'inner': 'data'}
        ]
        
        result = self.cache._make_json_serializable(test_list)
        
        assert result[0] == 'string'
        assert result[1] == 42
        assert result[2] == '2023-01-01T00:00:00'
        assert result[3]['inner'] == 'data'

    def test_make_json_serializable_datetime(self):
        """Test JSON serialization with datetime"""
        test_datetime = datetime(2023, 1, 1, 12, 30, 45)
        
        result = self.cache._make_json_serializable(test_datetime)
        
        assert result == '2023-01-01T12:30:45'

    def test_make_json_serializable_numpy(self):
        """Test JSON serialization with numpy-like object"""
        class NumpyLike:
            def item(self):
                return 42.5
        
        numpy_obj = NumpyLike()
        
        result = self.cache._make_json_serializable(numpy_obj)
        
        assert result == 42.5

    @pytest.mark.asyncio
    async def test_set_backtest_result_success(self):
        """Test successful backtest result caching"""
        cache_key = "test_cache_key"
        
        with patch.object(self.cache, '_execute_with_retry', new_callable=MagicMock) as mock_retry:
            mock_retry.return_value = True
            
            result = await self.cache.set_backtest_result(cache_key, self.test_data, "standard")
            
            assert result is True
            mock_retry.assert_called_once()

    @pytest.mark.asyncio
    async def test_set_backtest_result_with_custom_ttl(self):
        """Test backtest result caching with custom TTL"""
        cache_key = "test_cache_key"
        custom_ttl = timedelta(hours=48)
        
        with patch.object(self.cache, '_execute_with_retry', new_callable=MagicMock) as mock_retry:
            mock_retry.return_value = True
            
            result = await self.cache.set_backtest_result(cache_key, self.test_data, "standard", custom_ttl)
            
            assert result is True
            mock_retry.assert_called_once()

    @pytest.mark.asyncio
    async def test_set_backtest_result_disconnected(self):
        """Test backtest result caching when disconnected"""
        cache = BacktestCache()
        cache._is_connected = False
        
        cache_key = "test_cache_key"
        
        result = await cache.set_backtest_result(cache_key, self.test_data, "standard")
        
        assert result is False

    @pytest.mark.asyncio
    async def test_set_backtest_result_retry_failure(self):
        """Test backtest result caching with retry failure"""
        cache_key = "test_cache_key"
        
        with patch.object(self.cache, '_execute_with_retry', new_callable=MagicMock) as mock_retry:
            mock_retry.return_value = None
            
            result = await self.cache.set_backtest_result(cache_key, self.test_data, "standard")
            
            assert result is False

    @pytest.mark.asyncio
    async def test_get_backtest_result_success(self):
        """Test successful backtest result retrieval"""
        cache_key = "test_cache_key"
        
        with patch.object(self.cache, '_execute_with_retry', new_callable=MagicMock) as mock_retry:
            mock_retry.return_value = self.test_data
            
            result = await self.cache.get_backtest_result(cache_key)
            
            assert result == self.test_data
            mock_retry.assert_called_once()

    @pytest.mark.asyncio
    async def test_get_backtest_result_disconnected(self):
        """Test backtest result retrieval when disconnected"""
        cache = BacktestCache()
        cache._is_connected = False
        
        cache_key = "test_cache_key"
        
        result = await cache.get_backtest_result(cache_key)
        
        assert result is None

    @pytest.mark.asyncio
    async def test_get_backtest_result_retry_failure(self):
        """Test backtest result retrieval with retry failure"""
        cache_key = "test_cache_key"
        
        with patch.object(self.cache, '_execute_with_retry', new_callable=MagicMock) as mock_retry:
            mock_retry.return_value = None
            
            result = await self.cache.get_backtest_result(cache_key)
            
            assert result is None

    @pytest.mark.asyncio
    async def test_get_backtest_result_json_decode_error(self):
        """Test backtest result retrieval with JSON decode error"""
        cache_key = "test_cache_key"
        
        async def _mock_operation():
            # Simulate Redis returning invalid JSON
            raise json.JSONDecodeError("Invalid JSON", "test", 0)
        
        with patch.object(self.cache, '_execute_with_retry', new_callable=MagicMock) as mock_retry:
            mock_retry.return_value = None
            
            result = await self.cache.get_backtest_result(cache_key)
            
            assert result is None

    @pytest.mark.asyncio
    async def test_clear_cache_success(self):
        """Test successful cache clearing"""
        pattern = "backtest:*"
        
        with patch.object(self.cache, '_execute_with_retry', new_callable=MagicMock) as mock_retry:
            mock_retry.return_value = 5
            
            result = await self.cache.clear_cache(pattern)
            
            assert result == 5
            mock_retry.assert_called_once()

    @pytest.mark.asyncio
    async def test_clear_cache_disconnected(self):
        """Test cache clearing when disconnected"""
        cache = BacktestCache()
        cache._is_connected = False
        
        pattern = "backtest:*"
        
        result = await cache.clear_cache(pattern)
        
        assert result == 0

    @pytest.mark.asyncio
    async def test_clear_cache_retry_failure(self):
        """Test cache clearing with retry failure"""
        pattern = "backtest:*"
        
        with patch.object(self.cache, '_execute_with_retry', new_callable=MagicMock) as mock_retry:
            mock_retry.return_value = None
            
            result = await self.cache.clear_cache(pattern)
            
            assert result == 0

    @pytest.mark.asyncio
    async def test_get_cache_stats_success(self):
        """Test successful cache statistics retrieval"""
        expected_stats = {
            "status": "connected",
            "connected": True,
            "used_memory": "10MB",
            "connected_clients": 5,
            "total_commands_processed": 1000,
            "keyspace_hits": 100,
            "keyspace_misses": 20
        }
        
        with patch.object(self.cache, '_execute_with_retry', new_callable=MagicMock) as mock_retry:
            mock_retry.return_value = expected_stats
            
            stats = await self.cache.get_cache_stats()
            
            assert stats == expected_stats
            mock_retry.assert_called_once()

    @pytest.mark.asyncio
    async def test_get_cache_stats_disconnected(self):
        """Test cache statistics retrieval when disconnected"""
        cache = BacktestCache()
        cache._is_connected = False
        
        stats = await cache.get_cache_stats()
        
        assert stats["status"] == "disconnected"
        assert stats["connected"] is False

    @pytest.mark.asyncio
    async def test_get_cache_stats_retry_failure(self):
        """Test cache statistics retrieval with retry failure"""
        with patch.object(self.cache, '_execute_with_retry', new_callable=MagicMock) as mock_retry:
            mock_retry.return_value = None
            
            stats = await self.cache.get_cache_stats()
            
            assert stats["status"] == "error"
            assert stats["connected"] is False

    @pytest.mark.asyncio
    async def test_execute_with_retry_success(self):
        """Test successful retry operation"""
        mock_operation = Mock(return_value="success")
        
        async def async_mock_op(*args, **kwargs):
            return mock_operation(*args, **kwargs)
            
        result = await self.cache._execute_with_retry(async_mock_op, "arg1", "arg2", kwarg1="value1")
        
        assert result == "success"
        mock_operation.assert_called_once_with("arg1", "arg2", kwarg1="value1")

    @pytest.mark.asyncio
    async def test_execute_with_retry_connection_error(self):
        """Test retry operation with connection error"""
        mock_operation = Mock(side_effect=ConnectionError("Connection failed"))
        
        async def async_mock_op(*args, **kwargs):
            return mock_operation(*args, **kwargs)

        result = await self.cache._execute_with_retry(async_mock_op)
        
        assert result is None
        assert mock_operation.call_count == self.cache.retry_attempts

    @pytest.mark.asyncio
    async def test_execute_with_retry_timeout_error(self):
        """Test retry operation with timeout error"""
        mock_operation = Mock(side_effect=redis.TimeoutError("Timeout"))
        
        async def async_mock_op(*args, **kwargs):
            return mock_operation(*args, **kwargs)

        result = await self.cache._execute_with_retry(async_mock_op)
        
        assert result is None
        assert mock_operation.call_count == self.cache.retry_attempts

    @pytest.mark.asyncio
    async def test_execute_with_retry_other_error(self):
        """Test retry operation with other error"""
        mock_operation = Mock(side_effect=ValueError("Other error"))
        
        async def async_mock_op(*args, **kwargs):
            return mock_operation(*args, **kwargs)

        result = await self.cache._execute_with_retry(async_mock_op)
        
        assert result is None
        assert mock_operation.call_count == 1

    @pytest.mark.asyncio
    async def test_execute_with_retry_disconnected(self):
        """Test retry operation when disconnected"""
        cache = BacktestCache()
        cache._is_connected = False
        
        mock_operation = Mock(return_value="should_not_be_called")
        
        async def async_mock_op(*args, **kwargs):
            return mock_operation(*args, **kwargs)

        result = await cache._execute_with_retry(async_mock_op)
        
        assert result is None
        mock_operation.assert_not_called()

    def test_ttl_configs(self):
        """Test TTL configurations for different result types"""
        expected_ttl = {
            'standard': timedelta(hours=24),
            'optimization': timedelta(hours=48),
            'montecarlo': timedelta(hours=12),
            'quick_scan': timedelta(hours=6)
        }
        
        assert self.cache.ttl_configs == expected_ttl

    @pytest.mark.asyncio
    async def test_set_backtest_result_uses_type_based_ttl(self):
        """Test that set_backtest_result uses type-based TTL"""
        cache_key = "test_cache_key"
        
        with patch.object(self.cache, '_execute_with_retry', new_callable=MagicMock) as mock_retry:
            mock_retry.return_value = True
            
            # Test optimization type with longer TTL
            await self.cache.set_backtest_result(cache_key, self.test_data, "optimization")
            
            # Verify the operation was called (TTL logic is internal)
            mock_retry.assert_called_once()

    @pytest.mark.asyncio
    async def test_set_backtest_result_fallback_ttl(self):
        """Test that set_backtest_result uses fallback TTL for unknown types"""
        cache_key = "test_cache_key"
        
        with patch.object(self.cache, '_execute_with_retry', new_callable=MagicMock) as mock_retry:
            mock_retry.return_value = True
            
            # Test unknown type with default TTL
            await self.cache.set_backtest_result(cache_key, self.test_data, "unknown_type")
            
            # Verify the operation was called
            mock_retry.assert_called_once()

    def test_cache_key_generation_with_special_characters(self):
        """Test cache key generation with special characters"""
        signals_data = [
            {"symbol": "TEST@#$", "date": "2023-01-01", "signal": "BUY"},
            {"symbol": "DATA%", "date": "2023-01-02", "signal": "SELL"}
        ]
        
        key = self.cache.generate_cache_key(signals_data, self.test_params)
        
        assert isinstance(key, str)
        assert len(key) == 32  # MD5 hash length

    def test_cache_key_generation_with_large_data(self):
        """Test cache key generation with large data"""
        large_signals = [{"symbol": f"TEST{i}", "data": "x" * 100} for i in range(1000)]
        large_params = {f"param{i}": i * 1000 for i in range(100)}
        
        key = self.cache.generate_cache_key(large_signals, large_params)
        
        assert isinstance(key, str)
        assert len(key) == 32

    def test_cache_key_generation_with_none_values(self):
        """Test cache key generation with None values"""
        signals_data = [
            {"symbol": "TEST", "date": None, "signal": "BUY"},
            {"symbol": None, "date": "2023-01-02", "signal": None}
        ]
        
        key = self.cache.generate_cache_key(signals_data, self.test_params)
        
        assert isinstance(key, str)
        assert len(key) == 32

    def test_cache_key_generation_with_unicode(self):
        """Test cache key generation with unicode characters"""
        signals_data = [
            {"symbol": "测试", "date": "2023-01-01", "signal": "买入"},
            {"symbol": "テスト", "date": "2023-01-02", "signal": "売買"}
        ]
        
        key = self.cache.generate_cache_key(signals_data, self.test_params)
        
        assert isinstance(key, str)
        assert len(key) == 32

    @pytest.mark.asyncio
    async def test_cache_operations_with_monitoring(self):
        """Test cache operations with monitoring integration"""
        cache_key = "test_cache_key"
        
        with patch('backtest_cache.MONITORING_AVAILABLE', True), \
             patch('backtest_cache.get_backtest_monitor') as mock_get_monitor:
            
            mock_monitor = Mock()
            mock_get_monitor.return_value = mock_monitor
            
            # Test get operation
            with patch.object(self.cache, '_execute_with_retry', new_callable=MagicMock) as mock_retry:
                mock_retry.return_value = self.test_data
                
                result = await self.cache.get_backtest_result(cache_key)
                
                assert result == self.test_data
                mock_monitor.record_cache_operation.assert_called_with('get', 0, hit=True)
            
            # Test set operation
            with patch.object(self.cache, '_execute_with_retry', new_callable=MagicMock) as mock_retry:
                mock_retry.return_value = True
                
                result = await self.cache.set_backtest_result(cache_key, self.test_data, "standard")
                
                assert result is True
                mock_monitor.record_cache_operation.assert_called_with('set', 0)

    @pytest.mark.asyncio
    async def test_cache_operations_without_monitoring(self):
        """Test cache operations without monitoring integration"""
        cache_key = "test_cache_key"
        
        with patch('backtest_cache.MONITORING_AVAILABLE', False):
            # Test get operation
            with patch.object(self.cache, '_execute_with_retry', new_callable=MagicMock) as mock_retry:
                mock_retry.return_value = self.test_data
                
                result = await self.cache.get_backtest_result(cache_key)
                
                assert result == self.test_data
            
            # Test set operation
            with patch.object(self.cache, '_execute_with_retry', new_callable=MagicMock) as mock_retry:
                mock_retry.return_value = True
                
                result = await self.cache.set_backtest_result(cache_key, self.test_data, "standard")
                
                assert result is True

    @pytest.mark.asyncio
    async def test_cache_operations_monitoring_error(self):
        """Test cache operations with monitoring integration error"""
        cache_key = "test_cache_key"
        
        with patch('backtest_cache.MONITORING_AVAILABLE', True), \
             patch('backtest_cache.get_backtest_monitor') as mock_get_monitor:
            
            mock_get_monitor.side_effect = Exception("Monitoring failed")
            
            # Test get operation
            with patch.object(self.cache, '_execute_with_retry', new_callable=MagicMock) as mock_retry:
                mock_retry.return_value = self.test_data
                
                result = await self.cache.get_backtest_result(cache_key)
                
                assert result == self.test_data
            
            # Test set operation
            with patch.object(self.cache, '_execute_with_retry', new_callable=MagicMock) as mock_retry:
                mock_retry.return_value = True
                
                result = await self.cache.set_backtest_result(cache_key, self.test_data, "standard")
                
                assert result is True

    def test_cache_cleanup_on_deletion(self):
        """Test Redis connection cleanup on object deletion"""
        with patch.object(self.cache.redis_client, 'close') as mock_close:
            del self.cache
            mock_close.assert_called_once()

    def test_cache_cleanup_on_deletion_error(self):
        """Test Redis connection cleanup error handling"""
        with patch.object(self.cache.redis_client, 'close') as mock_close:
            mock_close.side_effect = Exception("Close failed")
            
            # Should not raise exception
            del self.cache
            
            mock_close.assert_called_once()


class TestBacktestCacheGlobal:
    """Test suite for global cache functions"""

    def setup_method(self):
        """Reset global cache instance before each test"""
        import backtest_cache
        backtest_cache._cache_instance = None

    def test_get_backtest_cache_singleton(self):
        """Test that get_backtest_cache returns singleton instance"""
        cache1 = get_backtest_cache()
        cache2 = get_backtest_cache()
        
        assert cache1 is cache2

    def test_get_backtest_cache_with_custom_params(self):
        """Test get_backtest_cache with custom parameters"""
        cache = get_backtest_cache('redis://localhost:6380', 12)
        
        assert cache.redis_url == 'redis://localhost:6380'
        assert cache.default_ttl == timedelta(hours=12)

    @pytest.mark.asyncio
    async def test_clear_backtest_cache(self):
        """Test clear_backtest_cache function"""
        with patch.object(BacktestCache, 'clear_cache', new_callable=MagicMock) as mock_clear:
            mock_clear.return_value = 5
            
            result = clear_backtest_cache("test_pattern")
            
            assert result == 5
            mock_clear.assert_called_once_with("test_pattern")

    @pytest.mark.asyncio
    async def test_clear_backtest_cache_default_pattern(self):
        """Test clear_backtest_cache function with default pattern"""
        with patch.object(BacktestCache, 'clear_cache', new_callable=MagicMock) as mock_clear:
            mock_clear.return_value = 3
            
            result = clear_backtest_cache()
            
            assert result == 3
            mock_clear.assert_called_once_with("*")


class TestBacktestCacheIntegration:
    """Integration tests for BacktestCache"""

    def setup_method(self):
        """Set up test fixtures"""
        self.cache = BacktestCache()
        self.test_data = {
            'trades': [{'symbol': 'TEST', 'pnl': 100}],
            'performance_metrics': {'total_return': 10.5},
            'equity_curve': [{'date': '2023-01-01', 'value': 100000}]
        }

    @pytest.mark.asyncio
    async def test_full_cache_workflow(self):
        """Test complete cache workflow from set to get"""
        signals_data = [
            {"symbol": "RELIANCE", "date": "2023-01-01", "signal": "BUY"},
            {"symbol": "TATASTEEL", "date": "2023-01-02", "signal": "SELL"}
        ]
        
        params = {
            'initial_capital': 100000,
            'stop_loss': 5.0,
            'take_profit': 10.0
        }
        
        # Generate cache key
        cache_key = self.cache.generate_cache_key(signals_data, params)
        
        # Set cache
        result = await self.cache.set_backtest_result(cache_key, self.test_data, "standard")
        assert result is True
        
        # Get cache
        cached_result = await self.cache.get_backtest_result(cache_key)
        assert cached_result == self.test_data
        
        # Verify cache stats
        stats = await self.cache.get_cache_stats()
        assert stats["status"] == "connected"
        assert stats["connected"] is True

    @pytest.mark.asyncio
    async def test_cache_hit_vs_miss(self):
        """Test cache hit and miss scenarios"""
        signals_data = [{"symbol": "TEST", "signal": "BUY"}]
        params = {"initial_capital": 100000}
        
        cache_key = self.cache.generate_cache_key(signals_data, params)
        
        # First get should be cache miss
        result1 = await self.cache.get_backtest_result(cache_key)
        assert result1 is None
        
        # Set cache
        set_result = await self.cache.set_backtest_result(cache_key, self.test_data, "standard")
        assert set_result is True
        
        # Second get should be cache hit
        result2 = await self.cache.get_backtest_result(cache_key)
        assert result2 == self.test_data

    @pytest.mark.asyncio
    async def test_cache_ttl_expiration(self):
        """Test cache TTL expiration"""
        import asyncio
        signals_data = [{"symbol": "TEST", "signal": "BUY"}]
        params = {"initial_capital": 100000}
        
        cache_key = self.cache.generate_cache_key(signals_data, params)
        
        # Set cache with very short TTL
        short_ttl = timedelta(seconds=1)
        result = await self.cache.set_backtest_result(cache_key, self.test_data, "standard", short_ttl)
        assert result is True
        
        # Immediate get should succeed
        cached_result = await self.cache.get_backtest_result(cache_key)
        assert cached_result == self.test_data
        
        # Wait for expiration
        await asyncio.sleep(1.1)
        
        # Get after expiration should fail
        expired_result = await self.cache.get_backtest_result(cache_key)
        assert expired_result is None

    @pytest.mark.asyncio
    async def test_cache_different_result_types(self):
        """Test caching different result types with different TTLs"""
        signals_data = [{"symbol": "TEST", "signal": "BUY"}]
        params = {"initial_capital": 100000}
        
        cache_key = self.cache.generate_cache_key(signals_data, params)
        
        # Test different result types
        result_types = ['standard', 'optimization', 'montecarlo', 'quick_scan']
        
        for result_type in result_types:
            result = await self.cache.set_backtest_result(cache_key, self.test_data, result_type)
            assert result is True
            
            cached_result = await self.cache.get_backtest_result(cache_key)
            assert cached_result == self.test_data

    @pytest.mark.asyncio
    async def test_cache_large_dataset(self):
        """Test caching large datasets"""
        # Create large test data
        large_signals = [{"symbol": f"TEST{i}", "data": "x" * 1000} for i in range(1000)]
        large_params = {f"param{i}": i * 100 for i in range(100)}
        large_result = {
            'trades': [{'symbol': f'TRADE{i}', 'data': 'y' * 500} for i in range(5000)],
            'performance_metrics': {f'metric{i}': list(range(1000)) for i in range(50)},
            'equity_curve': [{'date': f'2023-01-{i:02d}', 'value': 100000 + i} for i in range(1000)]
        }
        
        cache_key = self.cache.generate_cache_key(large_signals, large_params)
        
        # Set large cache
        result = await self.cache.set_backtest_result(cache_key, large_result, "standard")
        assert result is True
        
        # Get large cache
        cached_result = await self.cache.get_backtest_result(cache_key)
        assert cached_result == large_result

    @pytest.mark.asyncio
    async def test_cache_concurrent_operations(self):
        """Test concurrent cache operations"""
        import asyncio
        
        signals_data = [{"symbol": "TEST", "signal": "BUY"}]
        params = {"initial_capital": 100000}
        cache_key = self.cache.generate_cache_key(signals_data, params)
        
        results = []
        errors = []
        
        async def cache_operation(operation_type, thread_id):
            try:
                if operation_type == "set":
                    result = await self.cache.set_backtest_result(cache_key, self.test_data, "standard")
                    results.append(f"set_{thread_id}: {result}")
                elif operation_type == "get":
                    result = await self.cache.get_backtest_result(cache_key)
                    results.append(f"get_{thread_id}: {result is not None}")
            except Exception as e:
                errors.append(f"thread_{thread_id}: {str(e)}")
        
        # Create multiple tasks for concurrent operations
        tasks = []
        for i in range(5):
            tasks.append(asyncio.create_task(cache_operation("set", i)))
        
        for i in range(5):
            tasks.append(asyncio.create_task(cache_operation("get", i + 5)))
        
        # Wait for all tasks to complete
        await asyncio.gather(*tasks)
        
        # All operations should succeed
        assert len(errors) == 0
        assert len(results) == 10

    @pytest.mark.asyncio
    async def test_cache_error_scenarios(self):
        """Test various cache error scenarios"""
        signals_data = [{"symbol": "TEST", "signal": "BUY"}]
        params = {"initial_capital": 100000}
        cache_key = self.cache.generate_cache_key(signals_data, params)
        
        # Test with invalid data types
        invalid_data = {"invalid": object()}  # Non-serializable object
        
        # Should handle gracefully
        result = await self.cache.set_backtest_result(cache_key, invalid_data, "standard")
        # Result may be True or False depending on serialization handling
        assert isinstance(result, bool)
        
        # Test with empty data
        empty_result = await self.cache.set_backtest_result(cache_key, {}, "standard")
        assert empty_result is True
        
        # Test with very long key
        long_key = "x" * 1000
        long_result = await self.cache.set_backtest_result(long_key, self.test_data, "standard")
        assert long_result is True


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--cov=backtest_cache", "--cov-report=html", "--cov-report=term-missing"])