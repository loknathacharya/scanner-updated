"""
Comprehensive unit tests for backtest_monitoring.py

This module provides extensive test coverage for the backtest monitoring system,
including:
- Execution tracking and metrics collection
- System health monitoring
- Cache performance monitoring
- Historical data storage and retrieval
- Background monitoring threads
- Performance analytics
- User activity tracking
"""

import pytest
import time
import json
import threading
from unittest.mock import Mock, patch, MagicMock, call
from datetime import datetime, timedelta
from collections import deque
import uuid

# Import the modules to test
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backtest_monitoring import (
    BacktestMonitor, get_backtest_monitor, shutdown_backtest_monitor,
    BacktestExecution, SystemHealthMetrics, CacheMetrics
)


class TestBacktestExecution:
    """Test suite for BacktestExecution dataclass"""

    def test_execution_initialization(self):
        """Test BacktestExecution initialization"""
        execution_id = "test_execution_123"
        user_id = "test_user"
        start_time = datetime.now()
        
        execution = BacktestExecution(
            execution_id=execution_id,
            user_id=user_id,
            start_time=start_time,
            signals_count=100,
            trades_count=50
        )
        
        assert execution.execution_id == execution_id
        assert execution.user_id == user_id
        assert execution.start_time == start_time
        assert execution.signals_count == 100
        assert execution.trades_count == 50
        assert execution.end_time is None
        assert execution.duration is None
        assert execution.performance_metrics == {}
        assert execution.parameters == {}
        assert execution.cache_hit is False
        assert execution.cache_key is None
        assert execution.error_message is None

    def test_execution_with_performance_metrics(self):
        """Test BacktestExecution with performance metrics"""
        execution = BacktestExecution(
            execution_id="test",
            user_id="user",
            start_time=datetime.now(),
            performance_metrics={"total_return": 10.5}
        )
        
        assert execution.performance_metrics == {"total_return": 10.5}

    def test_execution_with_parameters(self):
        """Test BacktestExecution with parameters"""
        execution = BacktestExecution(
            execution_id="test",
            user_id="user",
            start_time=datetime.now(),
            parameters={"stop_loss": 5.0, "take_profit": 10.0}
        )
        
        assert execution.parameters == {"stop_loss": 5.0, "take_profit": 10.0}

    def test_execution_post_init_initialization(self):
        """Test that post_init initializes empty dicts properly"""
        execution = BacktestExecution(
            execution_id="test",
            user_id="user",
            start_time=datetime.now()
        )
        
        assert isinstance(execution.performance_metrics, dict)
        assert isinstance(execution.parameters, dict)
        assert execution.performance_metrics == {}
        assert execution.parameters == {}


class TestSystemHealthMetrics:
    """Test suite for SystemHealthMetrics dataclass"""

    def test_health_metrics_initialization(self):
        """Test SystemHealthMetrics initialization"""
        timestamp = datetime.now()
        memory_usage = 45.2
        cpu_usage = 23.5
        disk_usage = 67.8
        network_io = {"bytes_sent": 1000, "bytes_recv": 2000}
        process_count = 50
        thread_count = 200
        
        metrics = SystemHealthMetrics(
            timestamp=timestamp,
            memory_usage_percent=memory_usage,
            cpu_usage_percent=cpu_usage,
            disk_usage_percent=disk_usage,
            network_io_bytes=network_io,
            process_count=process_count,
            thread_count=thread_count
        )
        
        assert metrics.timestamp == timestamp
        assert metrics.memory_usage_percent == memory_usage
        assert metrics.cpu_usage_percent == cpu_usage
        assert metrics.disk_usage_percent == disk_usage
        assert metrics.network_io_bytes == network_io
        assert metrics.process_count == process_count
        assert metrics.thread_count == thread_count
        assert metrics.load_average is None

    def test_health_metrics_to_dict(self):
        """Test SystemHealthMetrics to_dict conversion"""
        timestamp = datetime.now()
        metrics = SystemHealthMetrics(
            timestamp=timestamp,
            memory_usage_percent=45.2,
            cpu_usage_percent=23.5,
            disk_usage_percent=67.8,
            network_io_bytes={"bytes_sent": 1000, "bytes_recv": 2000},
            process_count=50,
            thread_count=200
        )
        
        result = metrics.to_dict()
        
        assert result['timestamp'] == timestamp.isoformat()
        assert result['memory_usage_percent'] == 45.2
        assert result['cpu_usage_percent'] == 23.5
        assert result['disk_usage_percent'] == 67.8
        assert result['network_io_bytes'] == {"bytes_sent": 1000, "bytes_recv": 2000}
        assert result['process_count'] == 50
        assert result['thread_count'] == 200
        assert result['load_average'] is None

    def test_health_metrics_with_load_average(self):
        """Test SystemHealthMetrics with load average"""
        timestamp = datetime.now()
        load_avg = [0.5, 0.7, 1.2]
        
        metrics = SystemHealthMetrics(
            timestamp=timestamp,
            memory_usage_percent=45.2,
            cpu_usage_percent=23.5,
            disk_usage_percent=67.8,
            network_io_bytes={"bytes_sent": 1000, "bytes_recv": 2000},
            process_count=50,
            thread_count=200,
            load_average=load_avg
        )
        
        assert metrics.load_average == load_avg
        
        result = metrics.to_dict()
        assert result['load_average'] == load_avg


class TestCacheMetrics:
    """Test suite for CacheMetrics dataclass"""

    def test_cache_metrics_initialization(self):
        """Test CacheMetrics initialization"""
        timestamp = datetime.now()
        hits = 100
        misses = 20
        hit_rate = 83.3
        memory_usage = 25.5
        key_count = 500
        avg_get_time = 2.5
        avg_set_time = 5.0
        
        metrics = CacheMetrics(
            timestamp=timestamp,
            hits=hits,
            misses=misses,
            hit_rate=hit_rate,
            memory_usage_mb=memory_usage,
            key_count=key_count,
            average_get_time_ms=avg_get_time,
            average_set_time_ms=avg_set_time
        )
        
        assert metrics.timestamp == timestamp
        assert metrics.hits == hits
        assert metrics.misses == misses
        assert metrics.hit_rate == hit_rate
        assert metrics.memory_usage_mb == memory_usage
        assert metrics.key_count == key_count
        assert metrics.average_get_time_ms == avg_get_time
        assert metrics.average_set_time_ms == avg_set_time

    def test_cache_metrics_to_dict(self):
        """Test CacheMetrics to_dict conversion"""
        timestamp = datetime.now()
        metrics = CacheMetrics(
            timestamp=timestamp,
            hits=100,
            misses=20,
            hit_rate=83.3,
            memory_usage_mb=25.5,
            key_count=500,
            average_get_time_ms=2.5,
            average_set_time_ms=5.0
        )
        
        result = metrics.to_dict()
        
        assert result['timestamp'] == timestamp.isoformat()
        assert result['hits'] == 100
        assert result['misses'] == 20
        assert result['hit_rate'] == 83.3
        assert result['memory_usage_mb'] == 25.5
        assert result['key_count'] == 500
        assert result['average_get_time_ms'] == 2.5
        assert result['average_set_time_ms'] == 5.0


class TestBacktestMonitor:
    """Test suite for BacktestMonitor functionality"""

    def setup_method(self):
        """Set up test fixtures before each test method"""
        # Reset global monitor instance
        import backtest_monitoring
        backtest_monitoring._monitor_instance = None
        
        self.monitor = BacktestMonitor(max_history_size=100, health_check_interval=1)
        self.test_execution_id = "test_execution_123"
        self.test_user_id = "test_user"
        self.test_correlation_id = "test_corr_789"

    def teardown_method(self):
        """Clean up after each test method"""
        self.monitor.shutdown()

    def test_monitor_initialization(self):
        """Test BacktestMonitor initialization"""
        assert self.monitor.max_history_size == 100
        assert self.monitor.health_check_interval == 1
        assert isinstance(self.monitor.executions, dict)
        assert isinstance(self.monitor.executions_history, deque)
        assert isinstance(self.monitor.system_health_history, deque)
        assert isinstance(self.monitor.cache_metrics_history, deque)
        assert isinstance(self.monitor.active_executions, dict)
        assert isinstance(self.monitor.performance_metrics_history, deque)
        assert isinstance(self.monitor.cache_stats, dict)
        assert isinstance(self.monitor.user_activity, dict)
        assert self.monitor._monitoring_thread is not None
        assert self.monitor._monitoring_thread.is_alive()

    def test_track_execution_context_manager(self):
        """Test execution tracking with context manager"""
        with self.monitor.track_execution(user_id=self.test_user_id) as execution_id:
            assert execution_id is not None
            assert isinstance(execution_id, str)
            assert len(execution_id) > 0
            assert execution_id in self.monitor.active_executions
            
            # Test that execution data is being tracked
            exec_data = self.monitor.active_executions[execution_id]
            assert exec_data['user_id'] == self.test_user_id
            assert 'start_time' in exec_data
            assert 'memory_start' in exec_data
            assert 'cpu_start' in exec_data
        
        # After context, execution should be completed and moved to history
        assert execution_id not in self.monitor.active_executions
        assert execution_id in self.monitor.executions
        assert len(self.monitor.executions_history) > 0

    def test_track_execution_with_correlation_id(self):
        """Test execution tracking with correlation ID"""
        with self.monitor.track_execution(
            user_id=self.test_user_id,
            correlation_id=self.test_correlation_id
        ) as execution_id:
            assert execution_id == self.test_correlation_id

    def test_track_execution_exception_handling(self):
        """Test execution tracking with exception"""
        test_exception = ValueError("Test exception")
        execution_id = None
        
        try:
            with self.monitor.track_execution(user_id=self.test_user_id) as exec_id:
                execution_id = exec_id
                assert execution_id in self.monitor.active_executions
                raise test_exception
        except ValueError as e:
            assert str(e) == str(test_exception)
        
        # Check that execution was recorded with error
        assert execution_id is not None
        assert execution_id in self.monitor.executions
        execution = self.monitor.executions[execution_id]
        assert execution.error_message == str(test_exception)

    def test_log_backtest_start(self):
        """Test backtest start logging"""
        execution_id = "test_execution_123"
        params = {"initial_capital": 100000, "stop_loss": 5.0}
        signals_count = 100
        
        # Create execution first
        with self.monitor.track_execution(user_id=self.test_user_id, correlation_id=execution_id):
            pass
        
        self.monitor.log_backtest_start(execution_id, params, signals_count)
        
        # Check that parameters and signals count were recorded
        assert execution_id in self.monitor.executions
        execution = self.monitor.executions[execution_id]
        assert execution.parameters == params
        assert execution.signals_count == signals_count

    def test_log_backtest_complete(self):
        """Test backtest completion logging"""
        execution_id = "test_execution_123"
        trades_count = 50
        performance_metrics = {"total_return": 10.5, "sharpe_ratio": 1.2}
        
        # Create execution first
        with self.monitor.track_execution(user_id=self.test_user_id, correlation_id=execution_id):
            pass
        
        self.monitor.log_backtest_complete(execution_id, trades_count, performance_metrics)
        
        # Check that trades count and performance metrics were recorded
        assert execution_id in self.monitor.executions
        execution = self.monitor.executions[execution_id]
        assert execution.trades_count == trades_count
        assert execution.performance_metrics == performance_metrics

    def test_log_performance_metrics(self):
        """Test performance metrics logging"""
        execution_id = "test_execution_123"
        metrics = {"total_return": 10.5, "sharpe_ratio": 1.2, "max_drawdown": -5.0}
        
        self.monitor.log_performance_metrics(execution_id, metrics)
        
        # Check that metrics were recorded
        assert len(self.monitor.performance_metrics_history) > 0
        recorded_metrics = self.monitor.performance_metrics_history[-1]
        assert recorded_metrics['execution_id'] == execution_id
        assert recorded_metrics['metrics'] == metrics
        assert 'timestamp' in recorded_metrics

    def test_record_cache_operation(self):
        """Test cache operation recording"""
        operation = "get"
        duration_ms = 15.5
        hit = True
        
        self.monitor.record_cache_operation(operation, duration_ms, hit)
        
        # Check that cache stats were updated
        assert self.monitor.cache_stats['total_operations'] == 1
        assert len(self.monitor.cache_stats['get_times']) == 1
        assert self.monitor.cache_stats['get_times'][0] == duration_ms
        assert self.monitor.cache_stats['hits'] == 1
        assert self.monitor.cache_stats['misses'] == 0

    def test_record_cache_operation_set(self):
        """Test cache operation recording for set operation"""
        operation = "set"
        duration_ms = 25.0
        hit = False
        
        self.monitor.record_cache_operation(operation, duration_ms, hit)
        
        # Check that cache stats were updated
        assert self.monitor.cache_stats['total_operations'] == 1
        assert len(self.monitor.cache_stats['set_times']) == 1
        assert self.monitor.cache_stats['set_times'][0] == duration_ms
        assert self.monitor.cache_stats['hits'] == 0
        assert self.monitor.cache_stats['misses'] == 0

    def test_record_cache_operation_multiple(self):
        """Test multiple cache operations"""
        # Record multiple operations
        self.monitor.record_cache_operation("get", 10.0, True)
        self.monitor.record_cache_operation("get", 15.0, False)
        self.monitor.record_cache_operation("set", 5.0, False)
        self.monitor.record_cache_operation("get", 20.0, True)
        
        # Check totals
        assert self.monitor.cache_stats['total_operations'] == 4
        assert self.monitor.cache_stats['hits'] == 2
        assert self.monitor.cache_stats['misses'] == 1
        assert len(self.monitor.cache_stats['get_times']) == 3
        assert len(self.monitor.cache_stats['set_times']) == 1

    def test_get_execution_summary(self):
        """Test execution summary generation"""
        execution_id = "test_execution_123"
        
        # Create and complete execution
        with self.monitor.track_execution(user_id=self.test_user_id, correlation_id=execution_id) as exec_id:
            pass
        
        self.monitor.log_backtest_start(execution_id, {"test": "params"}, 100)
        self.monitor.log_backtest_complete(execution_id, 50, {"total_return": 10.5})
        
        summary = self.monitor.get_execution_summary(execution_id)
        
        assert summary is not None
        assert summary['execution_id'] == execution_id
        assert summary['user_id'] == self.test_user_id
        assert summary['signals_count'] == 100
        assert summary['trades_count'] == 50
        assert summary['performance_metrics'] == {"total_return": 10.5}
        assert 'start_time' in summary
        assert 'end_time' in summary
        assert 'duration' in summary

    def test_get_execution_summary_not_found(self):
        """Test execution summary for non-existent execution"""
        summary = self.monitor.get_execution_summary("non_existent")
        assert summary is None

    def test_get_system_health(self):
        """Test system health retrieval"""
        # Wait for at least one health check to complete
        time.sleep(2)
        
        health = self.monitor.get_system_health()
        
        assert isinstance(health, dict)
        assert 'timestamp' in health
        assert 'memory_usage_percent' in health
        assert 'cpu_usage_percent' in health
        assert 'disk_usage_percent' in health
        assert 'network_io_bytes' in health
        assert 'process_count' in health
        assert 'thread_count' in health

    def test_get_cache_performance(self):
        """Test cache performance retrieval"""
        # Record some cache operations
        self.monitor.record_cache_operation("get", 10.0, True)
        self.monitor.record_cache_operation("get", 15.0, False)
        self.monitor.record_cache_operation("set", 5.0, False)
        
        performance = self.monitor.get_cache_performance()
        
        assert isinstance(performance, dict)
        assert 'timestamp' in performance
        assert 'hits' in performance
        assert 'misses' in performance
        assert 'hit_rate' in performance
        assert 'total_operations' in performance
        assert 'average_get_time_ms' in performance
        assert 'average_set_time_ms' in performance
        assert performance['hits'] == 1
        assert performance['misses'] == 1
        assert performance['total_operations'] == 3

    def test_get_user_activity(self):
        """Test user activity retrieval"""
        # Create some executions for the user
        for i in range(3):
            with self.monitor.track_execution(user_id=self.test_user_id) as exec_id:
                pass
        
        activity = self.monitor.get_user_activity(user_id=self.test_user_id)
        
        assert isinstance(activity, list)
        assert len(activity) == 3
        for record in activity:
            assert record['user_id'] == self.test_user_id
            assert 'execution_id' in record
            assert 'timestamp' in record
            assert 'duration' in record
            assert 'success' in record

    def test_get_user_activity_all_users(self):
        """Test user activity retrieval for all users"""
        # Create executions for different users
        with self.monitor.track_execution(user_id="user1") as exec_id1:
            pass
        with self.monitor.track_execution(user_id="user2") as exec_id2:
            pass
        
        activity = self.monitor.get_user_activity()
        
        assert isinstance(activity, list)
        assert len(activity) == 2
        # Should be sorted by timestamp (most recent first)
        assert activity[0]['timestamp'] >= activity[1]['timestamp']

    def test_get_performance_analytics(self):
        """Test performance analytics"""
        # Create some recent executions
        for i in range(5):
            with self.monitor.track_execution(user_id=self.test_user_id) as exec_id:
                pass
        
        analytics = self.monitor.get_performance_analytics(days=7)
        
        assert isinstance(analytics, dict)
        assert 'period_days' in analytics
        assert 'total_executions' in analytics
        assert 'successful_executions' in analytics
        assert 'success_rate' in analytics
        assert 'average_duration' in analytics
        assert 'average_signals' in analytics
        assert 'average_trades' in analytics
        assert 'cache_hit_rate' in analytics
        assert 'executions_by_day' in analytics
        assert analytics['period_days'] == 7
        assert analytics['total_executions'] == 5

    def test_get_performance_analytics_no_data(self):
        """Test performance analytics with no data"""
        analytics = self.monitor.get_performance_analytics(days=7)
        
        assert analytics['total_executions'] == 0
        assert analytics['successful_executions'] == 0
        assert analytics['success_rate'] == 0
        assert analytics['average_duration'] == 0
        assert analytics['average_signals'] == 0
        assert analytics['average_trades'] == 0
        assert analytics['cache_hit_rate'] == 0

    def test_get_active_executions(self):
        """Test active executions retrieval"""
        # Start an execution
        with self.monitor.track_execution(user_id=self.test_user_id) as exec_id:
            active = self.monitor.get_active_executions()
            
            assert isinstance(active, list)
            assert len(active) == 1
            assert active[0]['execution_id'] == exec_id
            assert active[0]['user_id'] == self.test_user_id
            assert 'start_time' in active[0]
            assert 'duration_seconds' in active[0]
            assert 'memory_start_mb' in active[0]

    def test_get_active_executions_none(self):
        """Test active executions when none are active"""
        active = self.monitor.get_active_executions()
        assert isinstance(active, list)
        assert len(active) == 0

    def test_cleanup_old_data(self):
        """Test cleanup of old data"""
        # Create some old and recent data
        old_date = datetime.now() - timedelta(days=35)
        recent_date = datetime.now() - timedelta(days=5)
        
        # Add old execution
        old_execution = BacktestExecution(
            execution_id="old_exec",
            user_id="user",
            start_time=old_date
        )
        self.monitor.executions_history.append(old_execution)
        
        # Add recent execution
        recent_execution = BacktestExecution(
            execution_id="recent_exec",
            user_id="user",
            start_time=recent_date
        )
        self.monitor.executions_history.append(recent_execution)
        
        # Cleanup data older than 30 days
        self.monitor.cleanup_old_data(days=30)
        
        # Check that only recent data remains
        assert len(self.monitor.executions_history) == 1
        assert self.monitor.executions_history[0].execution_id == "recent_exec"

    def test_export_monitoring_data(self):
        """Test monitoring data export"""
        # Add some test data
        with self.monitor.track_execution(user_id=self.test_user_id) as exec_id:
            pass
        
        exported_data = self.monitor.export_monitoring_data()
        
        assert isinstance(exported_data, str)
        
        # Parse as JSON to verify structure
        try:
            parsed_data = json.loads(exported_data)
            assert 'export_timestamp' in parsed_data
            assert 'executions' in parsed_data
            assert 'system_health' in parsed_data
            assert 'cache_metrics' in parsed_data
            assert 'performance_metrics' in parsed_data
            assert 'user_activity' in parsed_data
            assert 'cache_stats' in parsed_data
        except json.JSONDecodeError:
            pytest.fail("Exported data is not valid JSON")

    def test_export_monitoring_data_format_error(self):
        """Test export with unsupported format"""
        with pytest.raises(ValueError, match="Unsupported export format"):
            self.monitor.export_monitoring_data(format="xml")

    def test_background_monitoring(self):
        """Test background health monitoring"""
        # Wait for at least one health check cycle
        time.sleep(2)
        
        # Check that system health data was collected
        assert len(self.monitor.system_health_history) > 0
        
        latest_health = self.monitor.system_health_history[-1]
        assert isinstance(latest_health, SystemHealthMetrics)
        assert latest_health.timestamp is not None
        assert latest_health.memory_usage_percent >= 0
        assert latest_health.cpu_usage_percent >= 0

    def test_background_monitoring_stopped(self):
        """Test background monitoring when stopped"""
        # Stop the monitoring
        self.monitor._stop_monitoring.set()
        
        # Wait a bit to ensure thread stops
        time.sleep(0.5)
        
        # Check that monitoring thread is no longer active
        assert self.monitor._monitoring_thread is not None
        assert not self.monitor._monitoring_thread.is_alive()

    def test_monitoring_with_psutil_error(self):
        """Test monitoring behavior when psutil fails"""
        with patch('psutil.virtual_memory') as mock_memory:
            mock_memory.side_effect = Exception("psutil error")
            
            # This should not crash the monitor
            health = self.monitor._collect_system_health()
            
            assert health.memory_usage_percent == 0.0
            assert health.cpu_usage_percent == 0.0
            assert health.disk_usage_percent == 0.0

    def test_concurrent_monitoring_operations(self):
        """Test concurrent monitoring operations"""
        results = []
        errors = []
        
        def monitoring_operation(operation_id):
            try:
                with self.monitor.track_execution(user_id=f"user_{operation_id}") as exec_id:
                    self.monitor.log_performance_metrics(exec_id, {"test_metric": operation_id})
                    self.monitor.record_cache_operation("get", 10.0, True)
                    results.append(f"op_{operation_id}_success")
            except Exception as e:
                errors.append(f"op_{operation_id}_error: {str(e)}")
        
        # Create multiple threads for concurrent operations
        threads = []
        for i in range(10):
            thread = threading.Thread(target=monitoring_operation, args=(i,))
            threads.append(thread)
            thread.start()
        
        # Wait for all threads to complete
        for thread in threads:
            thread.join()
        
        # All operations should succeed
        assert len(errors) == 0
        assert len(results) == 10
        
        # Check that data was collected
        assert len(self.monitor.performance_metrics_history) == 10
        assert self.monitor.cache_stats['total_operations'] == 10


class TestBacktestMonitorGlobal:
    """Test suite for global monitor functions"""

    def setup_method(self):
        """Reset global monitor instance before each test"""
        import backtest_monitoring
        backtest_monitoring._monitor_instance = None

    def test_get_backtest_monitor_singleton(self):
        """Test that get_backtest_monitor returns singleton instance"""
        monitor1 = get_backtest_monitor()
        monitor2 = get_backtest_monitor()
        
        assert monitor1 is monitor2

    def test_get_backtest_monitor_custom_params(self):
        """Test get_backtest_monitor with custom parameters"""
        # Create a new monitor instance with custom parameters
        monitor = BacktestMonitor(max_history_size=200, health_check_interval=5)
        
        assert monitor.max_history_size == 200
        assert monitor.health_check_interval == 5

    def test_shutdown_backtest_monitor(self):
        """Test shutdown_backtest_monitor function"""
        monitor = get_backtest_monitor()
        
        # Shutdown should work without errors
        shutdown_backtest_monitor()
        
        # Check that global instance is None
        import backtest_monitoring
        assert backtest_monitoring._monitor_instance is None

    def test_shutdown_backtest_monitor_already_none(self):
        """Test shutdown when monitor is already None"""
        # Should not raise an error
        shutdown_backtest_monitor()


class TestBacktestMonitorIntegration:
    """Integration tests for BacktestMonitor"""

    def setup_method(self):
        """Set up test fixtures"""
        import backtest_monitoring
        backtest_monitoring._monitor_instance = None
        
        self.monitor = BacktestMonitor(max_history_size=50, health_check_interval=1)

    def teardown_method(self):
        """Clean up after each test method"""
        self.monitor.shutdown()

    def test_complete_workflow(self):
        """Test complete monitoring workflow"""
        execution_id = "integration_test_123"
        user_id = "integration_user"
        
        # Start execution tracking
        with self.monitor.track_execution(user_id=user_id, correlation_id=execution_id):
            # Simulate some work
            time.sleep(0.1)
            
            # Log backtest start
            params = {"initial_capital": 100000, "stop_loss": 5.0}
            signals_count = 100
            self.monitor.log_backtest_start(execution_id, params, signals_count)
            
            # Log performance metrics
            performance_metrics = {"total_return": 10.5, "sharpe_ratio": 1.2}
            self.monitor.log_performance_metrics(execution_id, performance_metrics)
        
        # Log completion
        trades_count = 50
        self.monitor.log_backtest_complete(execution_id, trades_count, performance_metrics)
        
        # Record some cache operations
        self.monitor.record_cache_operation("get", 10.0, True)
        self.monitor.record_cache_operation("get", 15.0, False)
        self.monitor.record_cache_operation("set", 5.0, False)
        
        # Verify all data was recorded
        assert execution_id in self.monitor.executions
        execution = self.monitor.executions[execution_id]
        assert execution.signals_count == signals_count
        assert execution.trades_count == trades_count
        assert execution.performance_metrics == performance_metrics
        
        assert len(self.monitor.performance_metrics_history) > 0
        assert self.monitor.cache_stats['total_operations'] == 3
        assert self.monitor.cache_stats['hits'] == 1
        assert self.monitor.cache_stats['misses'] == 1

    def test_monitoring_data_retention(self):
        """Test that monitoring data respects retention limits"""
        # Create more executions than max_history_size
        for i in range(60):  # More than max_history_size of 50
            with self.monitor.track_execution(user_id=f"user_{i}") as exec_id:
                pass
        
        # Check that history is limited
        assert len(self.monitor.executions_history) <= 50

    def test_system_health_monitoring_integration(self):
        """Test system health monitoring integration"""
        # Wait for health monitoring to collect data
        time.sleep(2)
        
        # Check that health data was collected
        assert len(self.monitor.system_health_history) > 0
        
        # Get current health
        health = self.monitor.get_system_health()
        assert isinstance(health, dict)
        assert 'memory_usage_percent' in health
        assert 'cpu_usage_percent' in health

    def test_cache_performance_integration(self):
        """Test cache performance monitoring integration"""
        # Record various cache operations
        operations = [
            ("get", 10.0, True),
            ("get", 15.0, False),
            ("set", 5.0, False),
            ("get", 8.0, True),
            ("set", 12.0, False)
        ]
        
        for op, duration, hit in operations:
            self.monitor.record_cache_operation(op, duration, hit)
        
        # Check performance metrics
        performance = self.monitor.get_cache_performance()
        assert performance['hits'] == 2
        assert performance['misses'] == 2
        assert performance['total_operations'] == 5
        assert performance['hit_rate'] == 50.0  # 2 hits out of 4 cache operations
        assert performance['average_get_time_ms'] > 0
        assert performance['average_set_time_ms'] > 0

    def test_user_activity_tracking_integration(self):
        """Test user activity tracking integration"""
        user_id = "test_user"
        
        # Create multiple executions for the same user
        for i in range(5):
            with self.monitor.track_execution(user_id=user_id) as exec_id:
                pass
        
        # Check user activity
        activity = self.monitor.get_user_activity(user_id=user_id)
        assert len(activity) == 5
        
        # Check that all records belong to the user
        for record in activity:
            assert record['user_id'] == user_id
        
        # Check that activity is sorted by timestamp (most recent first)
        for i in range(len(activity) - 1):
            assert activity[i]['timestamp'] >= activity[i + 1]['timestamp']

    def test_export_functionality_integration(self):
        """Test export functionality integration"""
        # Add some test data
        with self.monitor.track_execution(user_id="test_user") as exec_id:
            pass
        
        self.monitor.log_performance_metrics(exec_id, {"test": "metrics"})
        self.monitor.record_cache_operation("get", 10.0, True)
        
        # Export data
        exported_data = self.monitor.export_monitoring_data()
        
        # Verify exported data contains all components
        parsed_data = json.loads(exported_data)
        assert 'executions' in parsed_data
        assert 'performance_metrics' in parsed_data
        assert 'cache_stats' in parsed_data
        assert len(parsed_data['executions']) > 0
        assert len(parsed_data['performance_metrics']) > 0


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--cov=backtest_monitoring", "--cov-report=html", "--cov-report=term-missing"])