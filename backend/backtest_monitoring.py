"""
Comprehensive monitoring and analytics system for backtest integration

This module provides a sophisticated monitoring system to track backtest execution,
performance metrics, system health, and user activity. It integrates with the
existing backtest API and caching system to provide operational insights.
"""

import logging
import time
import psutil
import threading
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional, Union
from dataclasses import dataclass, asdict
from collections import defaultdict, deque
import json
import uuid
from contextlib import contextmanager
import pandas as pd
import numpy as np

logger = logging.getLogger(__name__)


@dataclass
class BacktestExecution:
    """Data class for tracking backtest execution details"""
    execution_id: str
    user_id: Optional[str]
    start_time: datetime
    end_time: Optional[datetime] = None
    duration: Optional[float] = None
    signals_count: int = 0
    trades_count: int = 0
    performance_metrics: Optional[Dict[str, Any]] = None
    parameters: Optional[Dict[str, Any]] = None
    cache_hit: bool = False
    cache_key: Optional[str] = None
    error_message: Optional[str] = None
    memory_usage_mb: float = 0.0
    cpu_usage_percent: float = 0.0
    
    def __post_init__(self):
        if self.performance_metrics is None:
            self.performance_metrics = {}
        if self.parameters is None:
            self.parameters = {}


@dataclass
class SystemHealthMetrics:
    """Data class for system health monitoring"""
    timestamp: datetime
    memory_usage_percent: float
    cpu_usage_percent: float
    disk_usage_percent: float
    network_io_bytes: Dict[str, int]
    process_count: int
    thread_count: int
    load_average: Optional[List[float]] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization"""
        result = asdict(self)
        result['timestamp'] = self.timestamp.isoformat()
        return result


@dataclass
class CacheMetrics:
    """Data class for cache performance monitoring"""
    timestamp: datetime
    hits: int = 0
    misses: int = 0
    hit_rate: float = 0.0
    memory_usage_mb: float = 0.0
    key_count: int = 0
    average_get_time_ms: float = 0.0
    average_set_time_ms: float = 0.0
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization"""
        result = asdict(self)
        result['timestamp'] = self.timestamp.isoformat()
        return result


class BacktestMonitor:
    """
    Comprehensive monitoring and analytics system for backtest operations.
    
    Provides real-time monitoring, performance analytics, system health tracking,
    and historical data storage for backtest operations.
    """
    
    def __init__(self, max_history_size: int = 10000, health_check_interval: int = 60):
        """
        Initialize the backtest monitor.
        
        Args:
            max_history_size: Maximum number of execution records to keep in memory
            health_check_interval: Interval in seconds for system health checks
        """
        self.logger = logging.getLogger(__name__)
        
        # Configuration
        self.max_history_size = max_history_size
        self.health_check_interval = health_check_interval
        
        # Data storage
        self.executions: Dict[str, BacktestExecution] = {}
        self.executions_history: deque = deque(maxlen=max_history_size)
        self.system_health_history: deque = deque(maxlen=1000)
        self.cache_metrics_history: deque = deque(maxlen=1000)
        
        # Performance tracking
        self.active_executions: Dict[str, Dict[str, Any]] = {}
        self.performance_metrics_history: deque = deque(maxlen=5000)
        
        # Cache monitoring
        self.cache_stats = {
            'hits': 0,
            'misses': 0,
            'total_operations': 0,
            'get_times': deque(maxlen=100),
            'set_times': deque(maxlen=100)
        }
        
        # User activity tracking
        self.user_activity: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
        
        # Threading
        self._monitoring_thread = None
        self._stop_monitoring = threading.Event()
        
        # Start background monitoring
        self._start_background_monitoring()
        
        self.logger.info("BacktestMonitor initialized successfully")
    
    def _start_background_monitoring(self):
        """Start background system health monitoring thread"""
        if self._monitoring_thread is None or not self._monitoring_thread.is_alive():
            self._stop_monitoring.clear()
            self._monitoring_thread = threading.Thread(
                target=self._background_health_monitor,
                daemon=True
            )
            self._monitoring_thread.start()
            self.logger.info("Background health monitoring started")
    
    def _background_health_monitor(self):
        """Background thread for continuous system health monitoring"""
        while not self._stop_monitoring.wait(self.health_check_interval):
            try:
                health_metrics = self._collect_system_health()
                self.system_health_history.append(health_metrics)
                
                # Log critical health issues
                if health_metrics.memory_usage_percent > 90:
                    self.logger.warning(f"High memory usage: {health_metrics.memory_usage_percent:.1f}%")
                if health_metrics.cpu_usage_percent > 80:
                    self.logger.warning(f"High CPU usage: {health_metrics.cpu_usage_percent:.1f}%")
                    
            except Exception as e:
                self.logger.error(f"Error in background health monitoring: {e}")
    
    def _collect_system_health(self) -> SystemHealthMetrics:
        """Collect current system health metrics"""
        try:
            # Memory usage
            memory = psutil.virtual_memory()
            memory_usage_percent = memory.percent
            
            # CPU usage
            cpu_usage_percent = psutil.cpu_percent(interval=1)
            
            # Disk usage
            disk = psutil.disk_usage('/')
            disk_usage_percent = disk.percent
            
            # Network I/O
            network_io = psutil.net_io_counters()
            network_io_bytes = {
                'bytes_sent': network_io.bytes_sent,
                'bytes_recv': network_io.bytes_recv
            }
            
            # Process and thread counts
            process_count = len(psutil.pids())
            thread_count = sum(p.num_threads() for p in psutil.process_iter(['num_threads']) if p.info['num_threads'])
            
            # Load average (Unix-like systems)
            load_average = None
            try:
                load_average = list(psutil.getloadavg())
            except (AttributeError, OSError):
                pass  # Not available on Windows
            
            return SystemHealthMetrics(
                timestamp=datetime.now(),
                memory_usage_percent=memory_usage_percent,
                cpu_usage_percent=cpu_usage_percent,
                disk_usage_percent=disk_usage_percent,
                network_io_bytes=network_io_bytes,
                process_count=process_count,
                thread_count=thread_count,
                load_average=load_average
            )
            
        except Exception as e:
            self.logger.error(f"Error collecting system health: {e}")
            # Return fallback metrics
            return SystemHealthMetrics(
                timestamp=datetime.now(),
                memory_usage_percent=0.0,
                cpu_usage_percent=0.0,
                disk_usage_percent=0.0,
                network_io_bytes={'bytes_sent': 0, 'bytes_recv': 0},
                process_count=0,
                thread_count=0
            )
    
    @contextmanager
    def track_execution(self, user_id: Optional[str] = None, correlation_id: Optional[str] = None):
        """
        Context manager for tracking backtest execution.
        
        Args:
            user_id: User identifier for activity tracking
            correlation_id: Correlation ID for request tracing
            
        Yields:
            execution_id: Unique identifier for this execution
        """
        execution_id = correlation_id or str(uuid.uuid4())
        start_time = datetime.now()
        
        # Track start of execution
        self.active_executions[execution_id] = {
            'start_time': start_time,
            'user_id': user_id,
            'memory_start': psutil.Process().memory_info().rss / 1024 / 1024,  # MB
            'cpu_start': psutil.cpu_percent()
        }
        
        self.logger.info(f"Starting backtest execution: {execution_id}, user: {user_id}")
        
        try:
            yield execution_id
        except Exception as e:
            self.logger.error(f"Execution {execution_id} failed: {str(e)}")
            self._record_execution_end(
                execution_id=execution_id,
                end_time=datetime.now(),
                error_message=str(e),
                success=False
            )
            raise
        finally:
            # Record successful completion
            self._record_execution_end(
                execution_id=execution_id,
                end_time=datetime.now(),
                success=True
            )
    
    def _record_execution_end(self, execution_id: str, end_time: datetime, 
                            success: bool = True, error_message: Optional[str] = None):
        """Record the end of a backtest execution"""
        try:
            if execution_id not in self.active_executions:
                self.logger.warning(f"Execution {execution_id} not found in active executions")
                return
            
            execution_data = self.active_executions[execution_id]
            start_time = execution_data['start_time']
            
            # Calculate duration
            duration = (end_time - start_time).total_seconds()
            
            # Get current memory and CPU usage
            current_process = psutil.Process()
            memory_usage_mb = current_process.memory_info().rss / 1024 / 1024
            cpu_usage_percent = psutil.cpu_percent()
            
            # Create execution record
            execution = BacktestExecution(
                execution_id=execution_id,
                user_id=execution_data['user_id'],
                start_time=start_time,
                end_time=end_time,
                duration=duration,
                memory_usage_mb=memory_usage_mb,
                cpu_usage_percent=cpu_usage_percent,
                error_message=error_message if not success else None
            )
            
            # Store execution
            self.executions[execution_id] = execution
            self.executions_history.append(execution)
            
            # Update user activity
            if execution.user_id:
                activity_record = {
                    'timestamp': end_time.isoformat(),
                    'execution_id': execution_id,
                    'duration': duration,
                    'success': success,
                    'signals_count': execution.signals_count,
                    'trades_count': execution.trades_count
                }
                self.user_activity[execution.user_id].append(activity_record)
            
            # Log completion
            if success:
                self.logger.info(
                    f"Backtest execution completed: {execution_id}, "
                    f"duration={duration:.2f}s, "
                    f"signals={execution.signals_count}, "
                    f"trades={execution.trades_count}, "
                    f"memory={memory_usage_mb:.1f}MB"
                )
            else:
                self.logger.error(
                    f"Backtest execution failed: {execution_id}, "
                    f"duration={duration:.2f}s, "
                    f"error={error_message}"
                )
                
        except Exception as e:
            self.logger.error(f"Error recording execution end: {e}")
        finally:
            # Clean up active execution
            self.active_executions.pop(execution_id, None)
    
    def log_backtest_start(self, execution_id: str, params: Dict[str, Any], signals_count: int):
        """Log backtest execution start with parameters"""
        if execution_id in self.executions:
            self.executions[execution_id].signals_count = signals_count
            self.executions[execution_id].parameters = params
            
            self.logger.info(
                f"Backtest started: {execution_id}, "
                f"signals: {signals_count}, "
                f"params: {params}"
            )
    
    def log_backtest_complete(self, execution_id: str, trades_count: int, performance_metrics: Dict[str, Any]):
        """Log backtest execution completion with results"""
        if execution_id in self.executions:
            self.executions[execution_id].trades_count = trades_count
            self.executions[execution_id].performance_metrics = performance_metrics
            
            self.logger.info(
                f"Backtest completed: {execution_id}, "
                f"trades: {trades_count}, "
                f"return: {performance_metrics.get('total_return', 0)}%"
            )
    
    def log_performance_metrics(self, execution_id: str, metrics: Dict[str, Any]):
        """Log performance metrics for analytics"""
        timestamp = datetime.now()
        log_entry = {
            'timestamp': timestamp.isoformat(),
            'execution_id': execution_id,
            'metrics': metrics
        }
        
        self.performance_metrics_history.append(log_entry)
        self.logger.info(f"Performance metrics logged for {execution_id}")
    
    def record_cache_operation(self, operation: str, duration_ms: float, hit: bool = False):
        """Record cache operation for performance monitoring"""
        self.cache_stats['total_operations'] += 1
        
        if operation == 'get':
            self.cache_stats['get_times'].append(duration_ms)
            if hit:
                self.cache_stats['hits'] += 1
            else:
                self.cache_stats['misses'] += 1
        elif operation == 'set':
            self.cache_stats['set_times'].append(duration_ms)
        
        # Calculate hit rate
        if self.cache_stats['total_operations'] > 0:
            total_cache_ops = self.cache_stats['hits'] + self.cache_stats['misses']
            if total_cache_ops > 0:
                hit_rate = (self.cache_stats['hits'] / total_cache_ops) * 100
            else:
                hit_rate = 0.0
        else:
            hit_rate = 0.0
        
        # Record cache metrics periodically
        if len(self.cache_stats['get_times']) % 10 == 0:  # Every 10 operations
            cache_metrics = CacheMetrics(
                timestamp=datetime.now(),
                hits=self.cache_stats['hits'],
                misses=self.cache_stats['misses'],
                hit_rate=hit_rate,
                memory_usage_mb=0.0,  # Would need Redis info for this
                key_count=0,  # Would need Redis info for this
                average_get_time_ms=np.mean(self.cache_stats['get_times']) if self.cache_stats['get_times'] else 0.0,
                average_set_time_ms=np.mean(self.cache_stats['set_times']) if self.cache_stats['set_times'] else 0.0
            )
            self.cache_metrics_history.append(cache_metrics)
    
    def get_execution_summary(self, execution_id: str) -> Optional[Dict[str, Any]]:
        """Get summary of a specific execution"""
        if execution_id in self.executions:
            execution = self.executions[execution_id]
            return {
                'execution_id': execution.execution_id,
                'user_id': execution.user_id,
                'start_time': execution.start_time.isoformat(),
                'end_time': execution.end_time.isoformat() if execution.end_time else None,
                'duration': execution.duration,
                'signals_count': execution.signals_count,
                'trades_count': execution.trades_count,
                'performance_metrics': execution.performance_metrics,
                'parameters': execution.parameters,
                'cache_hit': execution.cache_hit,
                'memory_usage_mb': execution.memory_usage_mb,
                'cpu_usage_percent': execution.cpu_usage_percent,
                'error_message': execution.error_message
            }
        return None
    
    def get_system_health(self) -> Dict[str, Any]:
        """Get current system health metrics"""
        if self.system_health_history:
            latest = self.system_health_history[-1]
            return latest.to_dict()
        return {}
    
    def get_cache_performance(self) -> Dict[str, Any]:
        """Get cache performance metrics"""
        if self.cache_metrics_history:
            latest = self.cache_metrics_history[-1]
            return latest.to_dict()
        
        # Calculate current stats
        total_cache_ops = self.cache_stats['hits'] + self.cache_stats['misses']
        hit_rate = (self.cache_stats['hits'] / total_cache_ops * 100) if total_cache_ops > 0 else 0.0
        
        return {
            'timestamp': datetime.now().isoformat(),
            'hits': self.cache_stats['hits'],
            'misses': self.cache_stats['misses'],
            'hit_rate': hit_rate,
            'total_operations': self.cache_stats['total_operations'],
            'average_get_time_ms': np.mean(self.cache_stats['get_times']) if self.cache_stats['get_times'] else 0.0,
            'average_set_time_ms': np.mean(self.cache_stats['set_times']) if self.cache_stats['set_times'] else 0.0
        }
    
    def get_user_activity(self, user_id: Optional[str] = None, limit: int = 100) -> List[Dict[str, Any]]:
        """Get user activity history"""
        if user_id:
            return self.user_activity.get(user_id, [])[-limit:]
        else:
            # Return activity for all users (limited)
            all_activity = []
            for user_activities in self.user_activity.values():
                all_activity.extend(user_activities)
            return sorted(all_activity, key=lambda x: x['timestamp'], reverse=True)[:limit]
    
    def get_performance_analytics(self, days: int = 7) -> Dict[str, Any]:
        """Get performance analytics for the specified number of days"""
        cutoff_date = datetime.now() - timedelta(days=days)
        
        # Filter executions by date
        recent_executions = [
            exec for exec in self.executions_history 
            if exec.start_time >= cutoff_date
        ]
        
        if not recent_executions:
            return {
                'period_days': days,
                'total_executions': 0,
                'average_duration': 0,
                'success_rate': 0,
                'average_signals': 0,
                'average_trades': 0,
                'cache_hit_rate': 0
            }
        
        # Calculate metrics
        total_executions = len(recent_executions)
        successful_executions = len([e for e in recent_executions if e.error_message is None])
        success_rate = (successful_executions / total_executions) * 100 if total_executions > 0 else 0
        
        durations = [e.duration for e in recent_executions if e.duration is not None]
        average_duration = np.mean(durations) if durations else 0
        
        signals_counts = [e.signals_count for e in recent_executions]
        average_signals = np.mean(signals_counts) if signals_counts else 0
        
        trades_counts = [e.trades_count for e in recent_executions]
        average_trades = np.mean(trades_counts) if trades_counts else 0
        
        # Cache hit rate
        cache_hits = len([e for e in recent_executions if e.cache_hit])
        cache_hit_rate = (cache_hits / total_executions) * 100 if total_executions > 0 else 0
        
        return {
            'period_days': days,
            'total_executions': total_executions,
            'successful_executions': successful_executions,
            'success_rate': success_rate,
            'average_duration': average_duration,
            'average_signals': average_signals,
            'average_trades': average_trades,
            'cache_hit_rate': cache_hit_rate,
            'executions_by_day': self._get_executions_by_day(recent_executions)
        }
    
    def _get_executions_by_day(self, executions: List[BacktestExecution]) -> Dict[str, int]:
        """Group executions by day"""
        executions_by_day = defaultdict(int)
        for execution in executions:
            day_key = execution.start_time.strftime('%Y-%m-%d')
            executions_by_day[day_key] += 1
        return dict(executions_by_day)
    
    def get_active_executions(self) -> List[Dict[str, Any]]:
        """Get currently active executions"""
        active = []
        for exec_id, exec_data in self.active_executions.items():
            duration = (datetime.now() - exec_data['start_time']).total_seconds()
            active.append({
                'execution_id': exec_id,
                'user_id': exec_data['user_id'],
                'start_time': exec_data['start_time'].isoformat(),
                'duration_seconds': duration,
                'memory_start_mb': exec_data['memory_start']
            })
        return active
    
    def cleanup_old_data(self, days: int = 30):
        """Clean up old monitoring data"""
        cutoff_date = datetime.now() - timedelta(days=days)
        
        # Clean up executions history
        self.executions_history = deque(
            [exec for exec in self.executions_history if exec.start_time >= cutoff_date],
            maxlen=self.max_history_size
        )
        
        # Clean up performance metrics
        self.performance_metrics_history = deque(
            [metric for metric in self.performance_metrics_history 
             if datetime.fromisoformat(metric['timestamp']) >= cutoff_date],
            maxlen=5000
        )
        
        # Clean up user activity (keep only recent activity per user)
        for user_id in self.user_activity:
            self.user_activity[user_id] = [
                activity for activity in self.user_activity[user_id]
                if datetime.fromisoformat(activity['timestamp']) >= cutoff_date
            ]
        
        self.logger.info(f"Cleaned up monitoring data older than {days} days")
    
    def export_monitoring_data(self, format: str = 'json') -> str:
        """Export monitoring data in specified format"""
        data = {
            'export_timestamp': datetime.now().isoformat(),
            'executions': [asdict(exec) for exec in self.executions_history],
            'system_health': [health.to_dict() for health in self.system_health_history],
            'cache_metrics': [cache.to_dict() for cache in self.cache_metrics_history],
            'performance_metrics': [asdict(metric) for metric in self.performance_metrics_history],
            'user_activity': dict(self.user_activity),
            'cache_stats': self.cache_stats
        }
        
        if format.lower() == 'json':
            return json.dumps(data, indent=2, default=str)
        else:
            raise ValueError(f"Unsupported export format: {format}")
    
    def shutdown(self):
        """Shutdown the monitoring system"""
        self._stop_monitoring.set()
        if self._monitoring_thread and self._monitoring_thread.is_alive():
            self._monitoring_thread.join(timeout=5)
        
        self.logger.info("BacktestMonitor shutdown completed")


# Global monitor instance
_monitor_instance = None


def get_backtest_monitor() -> BacktestMonitor:
    """Get global backtest monitor instance (singleton pattern)"""
    global _monitor_instance
    if _monitor_instance is None:
        _monitor_instance = BacktestMonitor()
    return _monitor_instance


def shutdown_backtest_monitor():
    """Shutdown global backtest monitor"""
    global _monitor_instance
    if _monitor_instance:
        _monitor_instance.shutdown()
        _monitor_instance = None