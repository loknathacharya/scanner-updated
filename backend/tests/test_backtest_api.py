"""
Comprehensive unit tests for backtest_api.py

This module provides extensive test coverage for the backtest API endpoints,
including:
- API endpoint testing
- Request validation and error handling
- Response formats and data integrity
- Integration with caching and monitoring
- Edge cases and performance scenarios
"""

import pytest
import json
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from unittest.mock import Mock, patch, MagicMock, AsyncMock
from fastapi.testclient import TestClient
from fastapi import HTTPException

# Import the modules to test
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backtest_api import (
    router, BacktestRequest, BacktestResponse, BacktestOptimizationRequest,
    BacktestOptimizationResponse, BacktestEngineAdapter, get_backtest_adapter
)
from backtest_cache import BacktestCache
from backtest_monitoring import BacktestMonitor


class TestBacktestAPI:
    """Test suite for backtest API endpoints and functionality"""

    def setup_method(self):
        """Set up test fixtures before each test method"""
        self.client = TestClient(router)
        
        # Sample test data
        self.sample_signals = [
            {"symbol": "RELIANCE", "date": "2023-01-02", "signal": "BUY"},
            {"symbol": "TATASTEEL", "date": "2023-01-03", "signal": "SELL"}
        ]
        
        self.sample_ohlcv = [
            {
                "symbol": "RELIANCE", "date": "2023-01-02",
                "open": 2500.0, "high": 2550.0, "low": 2480.0, "close": 2520.0, "volume": 1000000
            },
            {
                "symbol": "TATASTEEL", "date": "2023-01-03",
                "open": 120.0, "high": 125.0, "low": 118.0, "close": 122.0, "volume": 500000
            }
        ]
        
        self.sample_backtest_request = {
            "signals_data": self.sample_signals,
            "ohlcv_data": self.sample_ohlcv,
            "initial_capital": 100000,
            "stop_loss": 5.0,
            "take_profit": 10.0,
            "holding_period": 20,
            "signal_type": "long",
            "position_sizing": "equal_weight",
            "allow_leverage": False,
            "risk_management": {}
        }

    def test_health_check_endpoint(self):
        """Test the health check endpoint"""
        response = self.client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert data["status"] == "healthy"
        assert "timestamp" in data

    def test_cache_stats_endpoint_success(self):
        """Test cache stats endpoint when Redis is available"""
        with patch('backtest_api.get_backtest_cache') as mock_cache:
            mock_cache_instance = Mock()
            mock_cache_instance.get_cache_stats.return_value = {
                "status": "connected",
                "connected": True,
                "used_memory": "10MB",
                "keyspace_hits": 100,
                "keyspace_misses": 20
            }
            mock_cache.return_value = mock_cache_instance
            
            response = self.client.get("/cache/stats")
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "connected"
            assert data["connected"] is True
            assert "used_memory" in data

    def test_cache_stats_endpoint_failure(self):
        """Test cache stats endpoint when Redis fails"""
        with patch('backtest_api.get_backtest_cache') as mock_cache:
            mock_cache_instance = Mock()
            mock_cache_instance.get_cache_stats.side_effect = Exception("Redis connection failed")
            mock_cache.return_value = mock_cache_instance
            
            response = self.client.get("/cache/stats")
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "error"

    def test_clear_cache_endpoint_success(self):
        """Test clear cache endpoint success"""
        with patch('backtest_api.get_backtest_cache') as mock_cache:
            mock_cache_instance = Mock()
            mock_cache_instance.clear_cache.return_value = 5
            mock_cache.return_value = mock_cache_instance
            
            response = self.client.delete("/cache?pattern=test*")
            assert response.status_code == 200
            data = response.json()
            assert "message" in data
            assert "Cleared 5 cache entries" in data["message"]

    def test_clear_cache_endpoint_failure(self):
        """Test clear cache endpoint failure"""
        with patch('backtest_api.get_backtest_cache') as mock_cache:
            mock_cache_instance = Mock()
            mock_cache_instance.clear_cache.side_effect = Exception("Clear failed")
            mock_cache.return_value = mock_cache_instance
            
            response = self.client.delete("/cache")
            assert response.status_code == 500

    def test_run_backtest_success(self):
        """Test successful backtest execution"""
        with patch('backtest_api.BacktestEngineAdapter') as mock_adapter_class:
            mock_adapter = Mock()
            mock_adapter.run_backtest.return_value = {
                'trades': [],
                'performance_metrics': {'total_return': 10.5},
                'equity_curve': [],
                'summary': {'holding_period': 20},
                'execution_time': 2.5,
                'signals_processed': 2
            }
            mock_adapter_class.return_value = mock_adapter
            
            response = self.client.post("/run", json=self.sample_backtest_request)
            assert response.status_code == 200
            data = response.json()
            assert "trades" in data
            assert "performance_metrics" in data
            assert "equity_curve" in data
            assert "summary" in data
            assert "execution_time" in data
            assert "signals_processed" in data

    def test_run_backtest_empty_signals(self):
        """Test backtest with empty signals data"""
        request = self.sample_backtest_request.copy()
        request["signals_data"] = []
        
        response = self.client.post("/run", json=request)
        assert response.status_code == 200
        data = response.json()
        assert data["trades"] == []
        assert data["signals_processed"] == 0

    def test_run_backtest_invalid_request(self):
        """Test backtest with invalid request data"""
        invalid_request = self.sample_backtest_request.copy()
        invalid_request["initial_capital"] = "invalid"  # Should be float
        
        response = self.client.post("/run", json=invalid_request)
        assert response.status_code == 422  # Validation error

    def test_run_backtest_cache_hit(self):
        """Test backtest with cache hit"""
        with patch('backtest_api.BacktestEngineAdapter') as mock_adapter_class, \
             patch('backtest_api.get_backtest_cache') as mock_cache:
            
            mock_cache_instance = Mock()
            mock_cache_instance.is_available.return_value = True
            mock_cache_instance.get_backtest_result.return_value = {
                'trades': [],
                'performance_metrics': {'total_return': 15.0},
                'equity_curve': [],
                'summary': {'holding_period': 20},
                'execution_time': 1.0,
                'signals_processed': 2,
                'from_cache': True
            }
            mock_cache.return_value = mock_cache_instance
            
            mock_adapter = Mock()
            mock_adapter.run_backtest.return_value = {}  # Should not be called
            mock_adapter_class.return_value = mock_adapter
            
            response = self.client.post("/run", json=self.sample_backtest_request)
            assert response.status_code == 200
            data = response.json()
            assert data.get("from_cache") is True

    def test_run_backtest_cache_miss(self):
        """Test backtest with cache miss"""
        with patch('backtest_api.BacktestEngineAdapter') as mock_adapter_class, \
             patch('backtest_api.get_backtest_cache') as mock_cache:
            
            mock_cache_instance = Mock()
            mock_cache_instance.is_available.return_value = True
            mock_cache_instance.get_backtest_result.return_value = None  # Cache miss
            mock_cache.return_value = mock_cache_instance
            
            mock_adapter = Mock()
            mock_adapter.run_backtest.return_value = {
                'trades': [],
                'performance_metrics': {'total_return': 10.5},
                'equity_curve': [],
                'summary': {'holding_period': 20},
                'execution_time': 2.5,
                'signals_processed': 2
            }
            mock_adapter_class.return_value = mock_adapter
            
            response = self.client.post("/run", json=self.sample_backtest_request)
            assert response.status_code == 200
            data = response.json()
            assert data.get("from_cache") is False

    def test_run_backtest_cache_disabled(self):
        """Test backtest with caching disabled"""
        with patch('backtest_api.BacktestEngineAdapter') as mock_adapter_class:
            mock_adapter = Mock()
            mock_adapter.run_backtest.return_value = {
                'trades': [],
                'performance_metrics': {'total_return': 10.5},
                'equity_curve': [],
                'summary': {'holding_period': 20},
                'execution_time': 2.5,
                'signals_processed': 2
            }
            mock_adapter_class.return_value = mock_adapter
            
            response = self.client.post("/run?use_cache=false", json=self.sample_backtest_request)
            assert response.status_code == 200

    def test_run_backtest_with_risk_warnings(self):
        """Test backtest with risk management warnings"""
        with patch('backtest_api.BacktestEngineAdapter') as mock_adapter_class, \
             patch('backtest_api.RiskManager') as mock_risk_manager:
            
            mock_risk_mgr = Mock()
            mock_risk_mgr.validate_config.return_value = ["High leverage warning"]
            mock_risk_manager.return_value = mock_risk_mgr
            
            mock_adapter = Mock()
            mock_adapter.run_backtest.return_value = {
                'trades': [],
                'performance_metrics': {'total_return': 10.5},
                'equity_curve': [],
                'summary': {'holding_period': 20},
                'execution_time': 2.5,
                'signals_processed': 2
            }
            mock_adapter_class.return_value = mock_adapter
            
            response = self.client.post("/run", json=self.sample_backtest_request)
            assert response.status_code == 200
            data = response.json()
            assert "risk_warnings" in data["summary"]
            assert "High leverage warning" in data["summary"]["risk_warnings"]

    def test_run_backtest_exception_handling(self):
        """Test backtest exception handling"""
        with patch('backtest_api.BacktestEngineAdapter') as mock_adapter_class:
            mock_adapter = Mock()
            mock_adapter.run_backtest.side_effect = Exception("Backtest failed")
            mock_adapter_class.return_value = mock_adapter
            
            response = self.client.post("/run", json=self.sample_backtest_request)
            assert response.status_code == 500
            data = response.json()
            assert "detail" in data
            assert "Backtest execution failed" in data["detail"]

    def test_optimize_backtest_parameters_success(self):
        """Test successful parameter optimization"""
        with patch('backtest_api.BacktestEngineAdapter') as mock_adapter_class:
            mock_adapter = Mock()
            mock_adapter.optimize_memory_usage = Mock(return_value=pd.DataFrame())
            mock_adapter_class.return_value = mock_adapter
            
            optimization_request = {
                "signals_data": self.sample_signals,
                "ohlcv_data": self.sample_ohlcv,
                "param_ranges": {
                    "stop_loss": [2.0, 5.0, 8.0],
                    "take_profit": [5.0, 10.0, 15.0]
                },
                "initial_capital": 100000,
                "holding_period": 20
            }
            
            with patch('backtest_api.BacktestOptimizer') as mock_optimizer:
                mock_optimizer_instance = Mock()
                mock_optimizer_instance.optimize_parameters.return_value = {
                    'best_params': {'stop_loss': 5.0, 'take_profit': 10.0},
                    'best_performance': {'total_return': 15.0},
                    'all_results': []
                }
                mock_optimizer.return_value = mock_optimizer_instance
                
                response = self.client.post("/optimize", json=optimization_request)
                assert response.status_code == 200
                data = response.json()
                assert "best_params" in data
                assert "best_performance" in data
                assert "all_results" in data

    def test_optimize_backtest_invalid_params(self):
        """Test parameter optimization with invalid parameters"""
        invalid_request = {
            "signals_data": self.sample_signals,
            "ohlcv_data": self.sample_ohlcv,
            "param_ranges": "invalid",  # Should be dict
            "initial_capital": 100000
        }
        
        response = self.client.post("/optimize", json=invalid_request)
        assert response.status_code == 422

    def test_optimize_backtest_exception(self):
        """Test parameter optimization exception handling"""
        with patch('backtest_api.BacktestEngineAdapter') as mock_adapter_class:
            mock_adapter = Mock()
            mock_adapter.optimize_memory_usage = Mock(return_value=pd.DataFrame())
            mock_adapter_class.return_value = mock_adapter
            
            optimization_request = {
                "signals_data": self.sample_signals,
                "ohlcv_data": self.sample_ohlcv,
                "param_ranges": {"stop_loss": [2.0, 5.0]},
                "initial_capital": 100000
            }
            
            with patch('backtest_api.BacktestOptimizer') as mock_optimizer:
                mock_optimizer_instance = Mock()
                mock_optimizer_instance.optimize_parameters.side_effect = Exception("Optimization failed")
                mock_optimizer.return_value = mock_optimizer_instance
                
                response = self.client.post("/optimize", json=optimization_request)
                assert response.status_code == 500

    def test_monte_carlo_simulation_success(self):
        """Test successful Monte Carlo simulation"""
        monte_carlo_request = {
            "trade_log": [
                {"Profit/Loss (%)": 5.0},
                {"Profit/Loss (%)": -2.0},
                {"Profit/Loss (%)": 3.0}
            ],
            "n_simulations": 100,
            "n_trades": 50
        }
        
        with patch('backtest_api.MonteCarloSimulator') as mock_simulator:
            mock_sim_instance = Mock()
            mock_sim_instance.run_simulation.return_value = {
                "simulation_results": [],
                "statistics": {}
            }
            mock_simulator.return_value = mock_sim_instance
            
            response = self.client.post("/montecarlo", json=monte_carlo_request)
            assert response.status_code == 200
            data = response.json()
            assert "simulation_results" in data

    def test_monte_carlo_invalid_request(self):
        """Test Monte Carlo with invalid request"""
        invalid_request = {
            "trade_log": "invalid",  # Should be list
            "n_simulations": "invalid"  # Should be int
        }
        
        response = self.client.post("/montecarlo", json=invalid_request)
        assert response.status_code == 422

    def test_schema_endpoint(self):
        """Test schema endpoint returns expected structure"""
        response = self.client.get("/schema")
        assert response.status_code == 200
        data = response.json()
        assert "run.request" in data
        assert "optimize.request" in data
        assert "signals_data" in data["run.request"]
        assert "ohlcv_data" in data["run.request"]

    # Monitoring endpoints tests
    def test_monitoring_health_endpoint(self):
        """Test monitoring health endpoint"""
        with patch('backtest_api.get_backtest_monitor') as mock_monitor:
            mock_monitor_instance = Mock()
            mock_monitor_instance.get_system_health.return_value = {
                "memory_usage_percent": 50.0,
                "cpu_usage_percent": 30.0
            }
            mock_monitor.return_value = mock_monitor_instance
            
            response = self.client.get("/monitoring/health")
            assert response.status_code == 200
            data = response.json()
            assert "system_health" in data

    def test_monitoring_cache_endpoint(self):
        """Test monitoring cache endpoint"""
        with patch('backtest_api.get_backtest_monitor') as mock_monitor:
            mock_monitor_instance = Mock()
            mock_monitor_instance.get_cache_performance.return_value = {
                "hit_rate": 75.0,
                "total_operations": 100
            }
            mock_monitor.return_value = mock_monitor_instance
            
            response = self.client.get("/monitoring/cache")
            assert response.status_code == 200
            data = response.json()
            assert "cache_performance" in data

    def test_monitoring_execution_summary_endpoint(self):
        """Test monitoring execution summary endpoint"""
        with patch('backtest_api.get_backtest_monitor') as mock_monitor:
            mock_monitor_instance = Mock()
            mock_monitor_instance.get_execution_summary.return_value = {
                "execution_id": "test123",
                "duration": 2.5,
                "trades_count": 10
            }
            mock_monitor.return_value = mock_monitor_instance
            
            response = self.client.get("/monitoring/execution/test123")
            assert response.status_code == 200
            data = response.json()
            assert "execution_summary" in data

    def test_monitoring_execution_not_found(self):
        """Test monitoring execution summary for non-existent execution"""
        with patch('backtest_api.get_backtest_monitor') as mock_monitor:
            mock_monitor_instance = Mock()
            mock_monitor_instance.get_execution_summary.return_value = None
            mock_monitor.return_value = mock_monitor_instance
            
            response = self.client.get("/monitoring/execution/nonexistent")
            assert response.status_code == 404

    def test_monitoring_active_executions_endpoint(self):
        """Test monitoring active executions endpoint"""
        with patch('backtest_api.get_backtest_monitor') as mock_monitor:
            mock_monitor_instance = Mock()
            mock_monitor_instance.get_active_executions.return_value = [
                {"execution_id": "active1", "duration_seconds": 10.5}
            ]
            mock_monitor.return_value = mock_monitor_instance
            
            response = self.client.get("/monitoring/active")
            assert response.status_code == 200
            data = response.json()
            assert "active_executions" in data

    def test_monitoring_analytics_endpoint(self):
        """Test monitoring analytics endpoint"""
        with patch('backtest_api.get_backtest_monitor') as mock_monitor:
            mock_monitor_instance = Mock()
            mock_monitor_instance.get_performance_analytics.return_value = {
                "total_executions": 10,
                "success_rate": 90.0
            }
            mock_monitor_instance.get_user_activity.return_value = []
            mock_monitor.return_value = mock_monitor_instance
            
            response = self.client.get("/monitoring/analytics")
            assert response.status_code == 200
            data = response.json()
            assert "analytics" in data

    def test_monitoring_user_activity_endpoint(self):
        """Test monitoring user activity endpoint"""
        with patch('backtest_api.get_backtest_monitor') as mock_monitor:
            mock_monitor_instance = Mock()
            mock_monitor_instance.get_user_activity.return_value = [
                {"timestamp": "2023-01-01T00:00:00", "execution_id": "user123"}
            ]
            mock_monitor.return_value = mock_monitor_instance
            
            response = self.client.get("/monitoring/user/testuser")
            assert response.status_code == 200
            data = response.json()
            assert "activity" in data

    def test_monitoring_cleanup_endpoint_success(self):
        """Test monitoring data cleanup endpoint with confirmation"""
        with patch('backtest_api.get_backtest_monitor') as mock_monitor:
            mock_monitor_instance = Mock()
            mock_monitor_instance.cleanup_old_data.return_value = None
            mock_monitor.return_value = mock_monitor_instance
            
            response = self.client.delete("/monitoring/data?confirm=true&days=30")
            assert response.status_code == 200
            data = response.json()
            assert "message" in data

    def test_monitoring_cleanup_endpoint_no_confirmation(self):
        """Test monitoring data cleanup endpoint without confirmation"""
        response = self.client.delete("/monitoring/data?days=30")
        assert response.status_code == 400
        data = response.json()
        assert "Set confirm=true" in data["detail"]

    def test_monitoring_export_endpoint_success(self):
        """Test monitoring data export endpoint"""
        with patch('backtest_api.get_backtest_monitor') as mock_monitor:
            mock_monitor_instance = Mock()
            mock_monitor_instance.export_monitoring_data.return_value = '{"test": "data"}'
            mock_monitor.return_value = mock_monitor_instance
            
            response = self.client.get("/monitoring/export?format=json")
            assert response.status_code == 200
            data = response.json()
            assert "data" in data
            assert data["data"] == '{"test": "data"}'

    def test_monitoring_export_invalid_format(self):
        """Test monitoring data export with invalid format"""
        response = self.client.get("/monitoring/export?format=xml")
        assert response.status_code == 400
        data = response.json()
        assert "Unsupported format" in data["detail"]

    def test_monitoring_stats_endpoint(self):
        """Test monitoring statistics endpoint"""
        with patch('backtest_api.get_backtest_monitor') as mock_monitor:
            mock_monitor_instance = Mock()
            mock_monitor_instance.get_system_health.return_value = {"memory": 50.0}
            mock_monitor_instance.get_cache_performance.return_value = {"hit_rate": 75.0}
            mock_monitor_instance.get_active_executions.return_value = []
            mock_monitor_instance.get_performance_analytics.return_value = {"total": 10}
            mock_monitor_instance.executions_history = [Mock()]
            mock_monitor_instance.user_activity = {"user1": []}
            mock_monitor.return_value = mock_monitor_instance
            
            response = self.client.get("/monitoring/stats")
            assert response.status_code == 200
            data = response.json()
            assert "statistics" in data

    # BacktestEngineAdapter tests
    def test_backtest_engine_adapter_initialization(self):
        """Test BacktestEngineAdapter initialization"""
        adapter = BacktestEngineAdapter()
        assert adapter.performance_optimizer is not None
        assert adapter.functions is not None

    def test_backtest_engine_adapter_optimize_backtest_operations(self):
        """Test BacktestEngineAdapter optimize_backtest_operations method"""
        adapter = BacktestEngineAdapter()
        
        with patch.object(adapter.performance_optimizer, 'vectorize_operations') as mock_vectorize:
            mock_vectorize.return_value = pd.DataFrame({'test': [1, 2, 3]})
            
            result = adapter.optimize_backtest_operations([{'op': 'test'}], pd.DataFrame())
            assert isinstance(result, pd.DataFrame)

    def test_backtest_engine_adapter_optimize_memory_usage(self):
        """Test BacktestEngineAdapter optimize_memory_usage method"""
        adapter = BacktestEngineAdapter()
        
        test_data = pd.DataFrame({'col1': [1, 2, 3], 'col2': [4, 5, 6]})
        
        with patch.object(adapter.performance_optimizer, 'optimize_memory_usage') as mock_optimize:
            mock_optimize.return_value = test_data
            
            result = adapter.optimize_memory_usage(test_data)
            assert result is test_data

    def test_backtest_engine_adapter_optimize_backtest_operations_exception(self):
        """Test BacktestEngineAdapter optimize_backtest_operations with exception"""
        adapter = BacktestEngineAdapter()
        
        with patch.object(adapter.performance_optimizer, 'vectorize_operations') as mock_vectorize:
            mock_vectorize.side_effect = Exception("Optimization failed")
            
            result = adapter.optimize_backtest_operations([{'op': 'test'}], pd.DataFrame())
            assert isinstance(result, pd.DataFrame)  # Should return original data

    def test_backtest_engine_adapter_optimize_memory_usage_exception(self):
        """Test BacktestEngineAdapter optimize_memory_usage with exception"""
        adapter = BacktestEngineAdapter()
        
        test_data = pd.DataFrame({'col1': [1, 2, 3], 'col2': [4, 5, 6]})
        
        with patch.object(adapter.performance_optimizer, 'optimize_memory_usage') as mock_optimize:
            mock_optimize.side_effect = Exception("Memory optimization failed")
            
            result = adapter.optimize_memory_usage(test_data)
            assert result is test_data  # Should return original data

    # Performance tests
    def test_backtest_performance_large_dataset(self):
        """Test backtest performance with large dataset"""
        # Generate large test data
        large_signals = [{"symbol": f"TEST{i}", "date": "2023-01-01", "signal": "BUY"} for i in range(1000)]
        large_ohlcv = [{"symbol": f"TEST{i}", "date": "2023-01-01", "open": 100, "high": 105, "low": 95, "close": 102, "volume": 10000} for i in range(1000)]
        
        large_request = self.sample_backtest_request.copy()
        large_request["signals_data"] = large_signals
        large_request["ohlcv_data"] = large_ohlcv
        
        with patch('backtest_api.BacktestEngineAdapter') as mock_adapter_class:
            mock_adapter = Mock()
            mock_adapter.run_backtest.return_value = {
                'trades': [],
                'performance_metrics': {'total_return': 10.5},
                'equity_curve': [],
                'summary': {'holding_period': 20},
                'execution_time': 2.5,
                'signals_processed': 1000
            }
            mock_adapter_class.return_value = mock_adapter
            
            start_time = datetime.now()
            response = self.client.post("/run", json=large_request)
            end_time = datetime.now()
            
            assert response.status_code == 200
            # Should complete in reasonable time (less than 30 seconds for 1000 signals)
            assert (end_time - start_time).total_seconds() < 30

    # Edge case tests
    def test_backtest_with_null_values(self):
        """Test backtest with null/None values in request"""
        request_with_nulls = self.sample_backtest_request.copy()
        request_with_nulls["take_profit"] = None
        request_with_nulls["risk_management"] = None
        
        response = self.client.post("/run", json=request_with_nulls)
        assert response.status_code == 200

    def test_backtest_with_extreme_values(self):
        """Test backtest with extreme parameter values"""
        extreme_request = self.sample_backtest_request.copy()
        extreme_request["stop_loss"] = 0.1  # Very small stop loss
        extreme_request["holding_period"] = 1000  # Very long holding period
        extreme_request["initial_capital"] = 1000000  # Large capital
        
        response = self.client.post("/run", json=extreme_request)
        assert response.status_code == 200

    def test_backtest_with_invalid_ticker_names(self):
        """Test backtest with invalid ticker names"""
        invalid_signals = [
            {"symbol": "INVALID@TICKER", "date": "2023-01-02", "signal": "BUY"},
            {"symbol": "", "date": "2023-01-03", "signal": "SELL"}
        ]
        
        invalid_request = self.sample_backtest_request.copy()
        invalid_request["signals_data"] = invalid_signals
        
        response = self.client.post("/run", json=invalid_request)
        assert response.status_code == 200  # Should handle gracefully

    def test_concurrent_backtest_requests(self):
        """Test handling of concurrent backtest requests"""
        import threading
        import time
        
        results = []
        errors = []
        
        def make_request():
            try:
                response = self.client.post("/run", json=self.sample_backtest_request)
                results.append(response.status_code)
            except Exception as e:
                errors.append(str(e))
        
        # Make multiple concurrent requests
        threads = []
        for _ in range(5):
            thread = threading.Thread(target=make_request)
            threads.append(thread)
            thread.start()
        
        # Wait for all threads to complete
        for thread in threads:
            thread.join()
        
        # All requests should succeed
        assert len(errors) == 0
        assert all(status == 200 for status in results)


class TestBacktestAPIIntegration:
    """Integration tests for backtest API components"""

    def setup_method(self):
        """Set up test fixtures"""
        self.client = TestClient(router)

    def test_full_backtest_workflow(self):
        """Test complete backtest workflow from request to response"""
        # Create realistic test data
        signals = []
        ohlcv_data = []
        
        for i in range(10):
            date = datetime(2023, 1, 1) + timedelta(days=i)
            symbol = f"TEST{i % 3}"  # Repeat symbols to test filtering
            
            signals.append({
                "symbol": symbol,
                "date": date.strftime("%Y-%m-%d"),
                "signal": "BUY"
            })
            
            ohlcv_data.append({
                "symbol": symbol,
                "date": date.strftime("%Y-%m-%d"),
                "open": 100 + i,
                "high": 105 + i,
                "low": 95 + i,
                "close": 102 + i,
                "volume": 10000 + i * 1000
            })
        
        request = {
            "signals_data": signals,
            "ohlcv_data": ohlcv_data,
            "initial_capital": 50000,
            "stop_loss": 3.0,
            "take_profit": 6.0,
            "holding_period": 10,
            "signal_type": "long",
            "position_sizing": "equal_weight",
            "allow_leverage": False,
            "risk_management": {"maxDrawdown": 15, "maxPositions": 5}
        }
        
        # Execute backtest
        response = self.client.post("/run", json=request)
        assert response.status_code == 200
        
        data = response.json()
        
        # Validate response structure
        required_fields = ["trades", "performance_metrics", "equity_curve", "summary", "execution_time", "signals_processed"]
        for field in required_fields:
            assert field in data, f"Missing required field: {field}"
        
        # Validate data types
        assert isinstance(data["trades"], list)
        assert isinstance(data["performance_metrics"], dict)
        assert isinstance(data["equity_curve"], list)
        assert isinstance(data["summary"], dict)
        assert isinstance(data["execution_time"], (int, float))
        assert isinstance(data["signals_processed"], int)
        
        # Validate business logic
        assert data["signals_processed"] <= len(signals)  # May be filtered
        assert data["execution_time"] > 0
        assert "holding_period" in data["summary"]

    def test_caching_integration(self):
        """Test integration between backtest API and caching"""
        request = {
            "signals_data": [
                {"symbol": "RELIANCE", "date": "2023-01-02", "signal": "BUY"},
                {"symbol": "TATASTEEL", "date": "2023-01-03", "signal": "SELL"}
            ],
            "ohlcv_data": [
                {
                    "symbol": "RELIANCE", "date": "2023-01-02",
                    "open": 2500.0, "high": 2550.0, "low": 2480.0, "close": 2520.0, "volume": 1000000
                },
                {
                    "symbol": "TATASTEEL", "date": "2023-01-03",
                    "open": 120.0, "high": 125.0, "low": 118.0, "close": 122.0, "volume": 500000
                }
            ],
            "initial_capital": 100000,
            "stop_loss": 5.0,
            "take_profit": 10.0,
            "holding_period": 20
        }
        
        # First request - should be cached
        with patch('backtest_api.get_backtest_cache') as mock_cache:
            mock_cache_instance = Mock()
            mock_cache_instance.is_available.return_value = True
            mock_cache_instance.get_backtest_result.return_value = None  # Cache miss
            mock_cache_instance.generate_cache_key.return_value = "test_key"
            mock_cache.return_value = mock_cache_instance
            
            response1 = self.client.post("/run", json=request)
            assert response1.status_code == 200
            
            # Verify cache was called
            mock_cache_instance.get_backtest_result.assert_called_once()
            mock_cache_instance.set_backtest_result.assert_called_once()

    def test_monitoring_integration(self):
        """Test integration between backtest API and monitoring"""
        request = {
            "signals_data": [
                {"symbol": "RELIANCE", "date": "2023-01-02", "signal": "BUY"},
                {"symbol": "TATASTEEL", "date": "2023-01-03", "signal": "SELL"}
            ],
            "ohlcv_data": [
                {
                    "symbol": "RELIANCE", "date": "2023-01-02",
                    "open": 2500.0, "high": 2550.0, "low": 2480.0, "close": 2520.0, "volume": 1000000
                },
                {
                    "symbol": "TATASTEEL", "date": "2023-01-03",
                    "open": 120.0, "high": 125.0, "low": 118.0, "close": 122.0, "volume": 500000
                }
            ],
            "initial_capital": 100000,
            "stop_loss": 5.0,
            "take_profit": 10.0,
            "holding_period": 20
        }
        
        with patch('backtest_api.get_backtest_monitor') as mock_monitor:
            mock_monitor_instance = Mock()
            mock_monitor_instance.track_execution.return_value.__enter__ = Mock(return_value="test_execution_id")
            mock_monitor_instance.track_execution.return_value.__exit__ = Mock(return_value=None)
            mock_monitor_instance.log_backtest_start = Mock()
            mock_monitor_instance.log_backtest_complete = Mock()
            mock_monitor_instance.log_performance_metrics = Mock()
            mock_monitor_instance.record_cache_operation = Mock()
            mock_monitor.return_value = mock_monitor_instance
            
            response = self.client.post("/run", json=request)
            assert response.status_code == 200
            
            # Verify monitoring was called
            mock_monitor_instance.track_execution.assert_called_once()
            mock_monitor_instance.log_backtest_start.assert_called_once()
            mock_monitor_instance.log_backtest_complete.assert_called_once()
            mock_monitor_instance.log_performance_metrics.assert_called_once()

    def test_error_handling_integration(self):
        """Test comprehensive error handling across components"""
        # Test with missing required fields
        incomplete_request = {
            "signals_data": [
                {"symbol": "RELIANCE", "date": "2023-01-02", "signal": "BUY"},
                {"symbol": "TATASTEEL", "date": "2023-01-03", "signal": "SELL"}
            ],
            # Missing ohlcv_data
        }
        
        response = self.client.post("/run", json=incomplete_request)
        assert response.status_code == 422  # Validation error
        
        # Test with invalid data types
        invalid_request = {
            "signals_data": "invalid",  # Should be list
            "ohlcv_data": [
                {
                    "symbol": "RELIANCE", "date": "2023-01-02",
                    "open": 2500.0, "high": 2550.0, "low": 2480.0, "close": 2520.0, "volume": 1000000
                }
            ],
            "initial_capital": "invalid"  # Should be number
        }
        
        response = self.client.post("/run", json=invalid_request)
        assert response.status_code == 422

    def test_parameter_optimization_integration(self):
        """Test parameter optimization workflow integration"""
        request = {
            "signals_data": [
                {"symbol": "RELIANCE", "date": "2023-01-02", "signal": "BUY"},
                {"symbol": "TATASTEEL", "date": "2023-01-03", "signal": "SELL"}
            ],
            "ohlcv_data": [
                {
                    "symbol": "RELIANCE", "date": "2023-01-02",
                    "open": 2500.0, "high": 2550.0, "low": 2480.0, "close": 2520.0, "volume": 1000000
                },
                {
                    "symbol": "TATASTEEL", "date": "2023-01-03",
                    "open": 120.0, "high": 125.0, "low": 118.0, "close": 122.0, "volume": 500000
                }
            ],
            "param_ranges": {
                "stop_loss": [2.0, 5.0, 8.0],
                "take_profit": [5.0, 10.0, 15.0],
                "holding_period": [10, 20, 30]
            },
            "initial_capital": 100000,
            "holding_period": 20
        }
        
        with patch('backtest_api.BacktestOptimizer') as mock_optimizer:
            mock_optimizer_instance = Mock()
            mock_optimizer_instance.optimize_parameters.return_value = {
                'best_params': {'stop_loss': 5.0, 'take_profit': 10.0, 'holding_period': 20},
                'best_performance': {'total_return': 15.0, 'sharpe_ratio': 1.5},
                'all_results': [
                    {'params': {'stop_loss': 2.0}, 'performance': {'total_return': 10.0}},
                    {'params': {'stop_loss': 5.0}, 'performance': {'total_return': 15.0}}
                ]
            }
            mock_optimizer.return_value = mock_optimizer_instance
            
            response = self.client.post("/optimize", json=request)
            assert response.status_code == 200
            
            data = response.json()
            assert "best_params" in data
            assert "best_performance" in data
            assert "all_results" in data
            assert len(data["all_results"]) == 2


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--cov=backtest_api", "--cov-report=html", "--cov-report=term-missing"])