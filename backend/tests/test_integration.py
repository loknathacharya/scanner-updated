
"""
Integration tests for backtest API endpoints

This module provides comprehensive integration tests for the backtest API,
including:
- API endpoint integration with backend components
- Data flow between frontend and backend
- Caching integration with API calls
- Monitoring integration with execution tracking
- Error handling and graceful degradation
- Performance testing under load
"""

import pytest
import json
import time
import asyncio
from unittest.mock import Mock, patch, AsyncMock
from fastapi.testclient import TestClient
from datetime import datetime, timedelta
import pandas as pd
import numpy as np

# Import the modules to test
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backtest_api import router, BacktestEngineAdapter, BacktestRequest, BacktestResponse
from backtest_cache import get_backtest_cache, BacktestCache
from backtest_monitoring import get_backtest_monitor, BacktestMonitor
from main import app


class TestBacktestAPIIntegration:
    """Integration tests for backtest API endpoints"""

    def setup_method(self):
        """Set up test fixtures before each test method"""
        # Reset global instances
        import backtest_cache
        import backtest_monitoring
        backtest_cache._cache_instance = None
        backtest_monitoring._monitor_instance = None
        
        # Create test client
        self.client = TestClient(app)
        
        # Test data
        self.test_signals_data = [
            {
                "Ticker": "AAPL",
                "Date": "2023-01-01",
                "Signal": "BUY",
                "Price": 150.0,
                "Volume": 1000000
            },
            {
                "Ticker": "GOOGL",
                "Date": "2023-01-02",
                "Signal": "BUY",
                "Price": 100.0,
                "Volume": 500000
            }
        ]
        
        self.test_ohlcv_data = [
            {
                "Ticker": "AAPL",
                "Date": "2023-01-01",
                "Open": 150.0,
                "High": 155.0,
                "Low": 148.0,
                "Close": 152.0,
                "Volume": 1000000
            },
            {
                "Ticker": "GOOGL",
                "Date": "2023-01-02",
                "Open": 100.0,
                "High": 105.0,
                "Low": 98.0,
                "Close": 102.0,
                "Volume": 500000
            }
        ]

    def teardown_method(self):
        """Clean up after each test method"""
        # Clean up global instances
        import backtest_cache
        import backtest_monitoring
        backtest_cache._cache_instance = None
        backtest_monitoring._monitor_instance = None

    def test_health_check_endpoint(self):
        """Test health check endpoint"""
        response = self.client.get("/api/backtest/health")
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "timestamp" in data

    def test_cache_stats_endpoint(self):
        """Test cache statistics endpoint"""
        response = self.client.get("/api/backtest/cache/stats")
        
        assert response.status_code == 200
        data = response.json()
        assert "hits" in data
        assert "misses" in data
        assert "hit_rate" in data
        assert "total_operations" in data

    def test_run_backtest_endpoint_success(self):
        """Test successful backtest execution"""
        request_data = {
            "signals_data": self.test_signals_data,
            "ohlcv_data": self.test_ohlcv_data,
            "initial_capital": 100000,
            "stop_loss": 5.0,
            "take_profit": 10.0,
            "holding_period": 20,
            "signal_type": "long",
            "position_sizing": "equal_weight",
            "allow_leverage": False
        }
        
        response = self.client.post("/api/backtest/run", json=request_data)
        
        assert response.status_code == 200
        data = response.json()
        
        # Validate response structure
        assert "trades" in data
        assert "performance_metrics" in data
        assert "equity_curve" in data
        assert "summary" in data
        assert "execution_time" in data
        assert "signals_processed" in data
        assert "monitoring" in data
        
        # Validate data types
        assert isinstance(data["trades"], list)
        assert isinstance(data["performance_metrics"], dict)
        assert isinstance(data["equity_curve"], list)
        assert isinstance(data["summary"], dict)
        assert isinstance(data["execution_time"], (int, float))
        assert isinstance(data["signals_processed"], int)
        assert isinstance(data["monitoring"], dict)

    def test_run_backtest_with_cache(self):
        """Test backtest execution with caching enabled"""
        request_data = {
            "signals_data": self.test_signals_data,
            "ohlcv_data": self.test_ohlcv_data,
            "initial_capital": 100000,
            "stop_loss": 5.0,
            "take_profit": 10.0,
            "holding_period": 20,
            "signal_type": "long",
            "position_sizing": "equal_weight",
            "allow_leverage": False
        }
        
        # First request (should miss cache)
        response1 = self.client.post("/api/backtest/run", json=request_data)
        assert response1.status_code == 200
        
        # Second request (should hit cache)
        response2 = self.client.post("/api/backtest/run", json=request_data)
        assert response2.status_code == 200
        
        # Verify cache hit in monitoring
        monitor = get_backtest_monitor()
        cache_performance = monitor.get_cache_performance()
        assert cache_performance["hits"] > 0

    def test_run_backtest_with_user_tracking(self):
        """Test backtest execution with user tracking"""
        request_data = {
            "signals_data": self.test_signals_data,
            "ohlcv_data": self.test_ohlcv_data,
            "initial_capital": 100000,
            "stop_loss": 5.0,
            "take_profit": 10.0,
            "holding_period": 20,
            "signal_type": "long",
            "position_sizing": "equal_weight",
            "allow_leverage": False
        }
        
        response = self.client.post("/api/backtest/run", 
                                  json=request_data,
                                  headers={"X-User-ID": "test_user"})
        
        assert response.status_code == 200
        
        # Verify user activity tracking
        monitor = get_backtest_monitor()
        user_activity = monitor.get_user_activity(user_id="test_user")
        assert len(user_activity) > 0
        assert user_activity[0]["user_id"] == "test_user"

    def test_run_backtest_with_correlation_id(self):
        """Test backtest execution with correlation ID"""
        request_data = {
            "signals_data": self.test_signals_data,
            "ohlcv_data": self.test_ohlcv_data,
            "initial_capital": 100000,
            "stop_loss": 5.0,
            "take_profit": 10.0,
            "holding_period": 20,
            "signal_type": "long",
            "position_sizing": "equal_weight",
            "allow_leverage": False
        }
        
        correlation_id = "test_correlation_123"
        response = self.client.post("/api/backtest/run", 
                                  json=request_data,
                                  headers={"X-Correlation-ID": correlation_id})
        
        assert response.status_code == 200
        
        # Verify correlation ID in monitoring
        monitor = get_backtest_monitor()
        active_executions = monitor.get_active_executions()
        assert any(exec["execution_id"] == correlation_id for exec in active_executions)

    def test_run_backtest_with_risk_management(self):
        """Test backtest execution with risk management"""
        request_data = {
            "signals_data": self.test_signals_data,
            "ohlcv_data": self.test_ohlcv_data,
            "initial_capital": 100000,
            "stop_loss": 5.0,
            "take_profit": 10.0,
            "holding_period": 20,
            "signal_type": "long",
            "position_sizing": "equal_weight",
            "allow_leverage": False,
            "risk_management": {
                "one_trade_per_instrument": True,
                "sizing_params": {
                    "max_position_size": 0.1,
                    "risk_per_trade": 0.02
                }
            }
        }
        
        response = self.client.post("/api/backtest/run", json=request_data)
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify risk management warnings in summary
        if "risk_warnings" in data["summary"]:
            assert isinstance(data["summary"]["risk_warnings"], list)

    def test_run_backtest_error_handling(self):
        """Test backtest execution error handling"""
        # Invalid request data
        request_data = {
            "signals_data": [],  # Empty signals
            "ohlcv_data": self.test_ohlcv_data,
            "initial_capital": 100000,
            "stop_loss": 5.0,
            "take_profit": 10.0,
            "holding_period": 20,
            "signal_type": "long",
            "position_sizing": "equal_weight",
            "allow_leverage": False
        }
        
        response = self.client.post("/api/backtest/run", json=request_data)
        
        # Should handle gracefully and return empty result
        assert response.status_code == 200
        data = response.json()
        assert data["trades"] == []
        assert data["signals_processed"] == 0

    def test_run_backtest_with_invalid_parameters(self):
        """Test backtest execution with invalid parameters"""
        request_data = {
            "signals_data": self.test_signals_data,
            "ohlcv_data": self.test_ohlcv_data,
            "initial_capital": -100000,  # Invalid negative capital
            "stop_loss": 5.0,
            "take_profit": 10.0,
            "holding_period": 20,
            "signal_type": "long",
            "position_sizing": "equal_weight",
            "allow_leverage": False
        }
        
        response = self.client.post("/api/backtest/run", json=request_data)
        
        # Should handle gracefully
        assert response.status_code == 200
        data = response.json()
        assert "trades" in data
        assert "performance_metrics" in data

    def test_optimize_parameters_endpoint(self):
        """Test parameter optimization endpoint"""
        request_data = {
            "signals_data": self.test_signals_data,
            "ohlcv_data": self.test_ohlcv_data,
            "param_ranges": {
                "stop_loss": [3.0, 5.0, 7.0],
                "take_profit": [8.0, 10.0, 12.0],
                "holding_period": [10, 20, 30]
            },
            "initial_capital": 100000,
            "stop_loss": 5.0,
            "take_profit": 10.0,
            "holding_period": 20,
            "signal_type": "long",
            "position_sizing": "equal_weight",
            "allow_leverage": False
        }
        
        response = self.client.post("/api/backtest/optimize", json=request_data)
        
        assert response.status_code == 200
        data = response.json()
        
        # Validate response structure
        assert "best_params" in data
        assert "best_performance" in data
        assert "all_results" in data
        assert "execution_time" in data
        assert "signals_processed" in data
        assert "risk_warnings" in data
        
        # Validate data types
        assert isinstance(data["best_params"], dict)
        assert isinstance(data["best_performance"], dict)
        assert isinstance(data["all_results"], list)
        assert isinstance(data["execution_time"], (int, float))
        assert isinstance(data["signals_processed"], int)
        assert isinstance(data["risk_warnings"], list)

    def test_optimize_parameters_with_cache(self):
        """Test parameter optimization with caching"""
        request_data = {
            "signals_data": self.test_signals_data,
            "ohlcv_data": self.test_ohlcv_data,
            "param_ranges": {
                "stop_loss": [3.0, 5.0, 7.0],
                "take_profit": [8.0, 10.0, 12.0],
                "holding_period": [10, 20, 30]
            },
            "initial_capital": 100000,
            "stop_loss": 5.0,
            "take_profit": 10.0,
            "holding_period": 20,
            "signal_type": "long",
            "position_sizing": "equal_weight",
            "allow_leverage": False
        }
        
        # First optimization request
        response1 = self.client.post("/api/backtest/optimize", json=request_data)
        assert response1.status_code == 200
        
        # Second optimization request (should be faster due to caching)
        response2 = self.client.post("/api/backtest/optimize", json=request_data)
        assert response2.status_code == 200
        
        # Verify performance improvement
        time1 = response1.json()["execution_time"]
        time2 = response2.json()["execution_time"]
        
        # Second request should be faster (though not guaranteed due to system variability)
        assert time2 <= time1 * 1.5  # Allow some variance

    def test_optimize_parameters_error_handling(self):
        """Test parameter optimization error handling"""
        # Empty param ranges
        request_data = {
            "signals_data": self.test_signals_data,
            "ohlcv_data": self.test_ohlcv_data,
            "param_ranges": {},
            "initial_capital": 100000,
            "stop_loss": 5.0,
            "take_profit": 10.0,
            "holding_period": 20,
            "signal_type": "long",
            "position_sizing": "equal_weight",
            "allow_leverage": False
        }
        
        response = self.client.post("/api/backtest/optimize", json=request_data)
        
        # Should handle gracefully
        assert response.status_code == 200
        data = response.json()
        assert "best_params" in data
        assert "best_performance" in data

    def test_api_with_cache_failure(self):
        """Test API behavior when cache fails"""
        # Mock cache failure
        with patch('backtest_cache.get_backtest_cache') as mock_cache:
            mock_cache.return_value.is_available.return_value = False
            
            request_data = {
                "signals_data": self.test_signals_data,
                "ohlcv_data": self.test_ohlcv_data,
                "initial_capital": 100000,
                "stop_loss": 5.0,
                "take_profit": 10.0,
                "holding_period": 20,
                "signal_type": "long",
                "position_sizing": "equal_weight",
                "allow_leverage": False
            }
            
            response = self.client.post("/api/backtest/run", json=request_data)
            
            # Should still work without cache
            assert response.status_code == 200
            data = response.json()
            assert "trades" in data
            assert "performance_metrics" in data

    def test_api_with_monitoring_failure(self):
        """Test API behavior when monitoring fails"""
        # Mock monitoring failure
        with patch('backtest_monitoring.get_backtest_monitor') as mock_monitor:
            mock_monitor.return_value.track_execution.side_effect = Exception("Monitoring failed")
            
            request_data = {
                "signals_data": self.test_signals_data,
                "ohlcv_data": self.test_ohlcv_data,
                "initial_capital": 100000,
                "stop_loss": 5.0,
                "take_profit": 10.0,
                "holding_period": 20,
                "signal_type": "long",
                "position_sizing": "equal_weight",
                "allow_leverage": False
            }
            
            response = self.client.post("/api/backtest/run", json=request_data)
            
            # Should still work without monitoring
            assert response.status_code == 200
            data = response.json()
            assert "trades" in data
            assert "performance_metrics" in data

    def test_api_with_backtest_engine_failure(self):
        """Test API behavior when backtest engine fails"""
        # Mock backtest engine failure
        with patch('backtest_api._import_backtest_functions') as mock_import:
            mock_import.return_value = {
                'run_backtest': Mock(side_effect=Exception("Engine failed")),
                'run_vectorized_single_backtest': Mock(side_effect=Exception("Engine failed")),
                'run_vectorized_parameter_optimization': Mock(side_effect=Exception("Engine failed")),
                'calculate_performance_metrics': Mock(side_effect=Exception("Engine failed")),
                'calculate_leverage_metrics': Mock(side_effect=Exception("Engine failed")),
                'calculate_invested_value_over_time': Mock(side_effect=Exception("Engine failed")),
                'run_single_parameter_combo': Mock(side_effect=Exception("Engine failed"))
            }
            
            request_data = {
                "signals_data": self.test_signals_data,
                "ohlcv_data": self.test_ohlcv_data,
                "initial_capital": 100000,
                "stop_loss": 5.0,
                "take_profit": 10.0,
                "holding_period": 20,
                "signal_type": "long",
                "position_sizing": "equal_weight",
                "allow_leverage": False
            }
            
            response = self.client.post("/api/backtest/run", json=request_data)
            
            # Should return error
            assert response.status_code == 500

    def test_api_concurrent_requests(self):
        """Test API behavior under concurrent load"""
        request_data = {
            "signals_data": self.test_signals_data,
            "ohlcv_data": self.test_ohlcv_data,
            "initial_capital": 100000,
            "stop_loss": 5.0,
            "take_profit": 10.0,
            "holding_period": 20,
            "signal_type": "long",
            "position_sizing": "equal_weight",
            "allow_leverage": False
        }
        
        # Make multiple concurrent requests
        async def make_request():
            return self.client.post("/api/backtest/run", json=request_data)
        
        async def make_concurrent_requests():
            tasks = [make_request() for _ in range(5)]
            responses = await asyncio.gather(*tasks)
            return responses
        
        # Run concurrent requests
        responses = asyncio.run(make_concurrent_requests())
        
        # All requests should succeed
        for response in responses:
            assert response.status_code == 200
        
        # Verify monitoring handled concurrent executions
        monitor = get_backtest_monitor()
        active_executions = monitor.get_active_executions()
        assert len(active_executions) <= 5  # May be less if some completed

    def test_api_large_dataset_handling(self):
        """Test API behavior with large datasets"""
        # Generate large test data
        large_signals_data = []
        large_ohlcv_data = []
        
        for i in range(1000):
            large_signals_data.append({
                "Ticker": f"STOCK{i % 100}",  # 100 unique stocks
                "Date": f"2023-01-{str(i % 31 + 1).zfill(2)}",
                "Signal": "BUY",
                "Price": 100.0 + (i % 50),
                "Volume": 1000000 + (i % 500000)
            })
            
            large_ohlcv_data.append({
                "Ticker": f"STOCK{i % 100}",
                "Date": f"2023-01-{str(i % 31 + 1).zfill(2)}",
                "Open": 100.0 + (i % 50),
                "High": 105.0 + (i % 50),
                "Low": 95.0 + (i % 50),
                "Close": 102.0 + (i % 50),
                "Volume": 1000000 + (i % 500000)
            })
        
        request_data = {
            "signals_data": large_signals_data,
            "ohlcv_data": large_ohlcv_data,
            "initial_capital": 100000,
            "stop_loss": 5.0,
            "take_profit": 10.0,
            "holding_period": 20,
            "signal_type": "long",
            "position_sizing": "equal_weight",
            "allow_leverage": False
        }
        
        start_time = time.time()
        response = self.client.post("/api/backtest/run", json=request_data)
        end_time = time.time()
        
        assert response.status_code == 200
        data = response.json()
        
        # Should process large dataset
        assert data["signals_processed"] > 0
        assert data["execution_time"] > 0
        
        # Should complete in reasonable time (less than 30 seconds)
        assert end_time - start_time < 30

    def test_api_memory_usage_monitoring(self):
        """Test API memory usage monitoring"""
        request_data = {
            "signals_data": self.test_signals_data,
            "ohlcv_data": self.test_ohlcv_data,
            "initial_capital": 100000,
            "stop_loss": 5.0,
            "take_profit": 10.0,
            "holding_period": 20,
            "signal_type": "long",
            "position_sizing": "equal_weight",
            "allow_leverage": False
        }
        
        # Get initial memory usage
        import psutil
        process = psutil.Process()
        initial_memory = process.memory_info().rss / 1024 / 1024  # MB
        
        # Make API request
        response = self.client.post("/api/backtest/run", json=request_data)
        
        # Get final memory usage
        final_memory = process.memory_info().rss / 1024 / 1024  # MB
        memory_increase = final_memory - initial_memory
        
        # Memory increase should be reasonable (less than 100MB)
        assert memory_increase < 100

    def test_api_performance_metrics_accuracy(self):
        """Test API performance metrics accuracy"""
        request_data = {
            "signals_data": self.test_signals_data,
            "ohlcv_data": self.test_ohlcv_data,
            "initial_capital": 100000,
            "stop_loss": 5.0,
            "take_profit": 10.0,
            "holding_period": 20,
            "signal_type": "long",
            "position_sizing": "equal_weight",
            "allow_leverage": False
        }
        
        response = self.client.post("/api/backtest/run", json=request_data)
        
        assert response.status_code == 200
        data = response.json()
        
        # Validate performance metrics
        metrics = data["performance_metrics"]
        
        # Check for expected metrics
        expected_metrics = [
            "total_return", "win_rate", "sharpe_ratio", "max_drawdown",
            "profit_factor", "avg_trade_return", "total_trades"
        ]
        
        for metric in expected_metrics:
            assert metric in metrics, f"Missing metric: {metric}"
        
        # Validate metric ranges
        if "total_return" in metrics:
            assert isinstance(metrics["total_return"], (int, float))
        
        if "win_rate" in metrics:
            assert 0 <= metrics["win_rate"] <= 100
        
        if "sharpe_ratio" in metrics:
            assert isinstance(metrics["sharpe_ratio"], (int, float))
        
        if "max_drawdown" in metrics:
            assert metrics["max_drawdown"] <= 0  # Drawdown should be negative or zero

    def test_api_equity_curve_data_integrity(self):
        """Test API equity curve data integrity"""
        request_data = {
            "signals_data": self.test_signals_data,
            "ohlcv_data": self.test_ohlcv_data,
            "initial_capital": 100000,
            "stop_loss": 5.0,
            "take_profit": 10.0,
            "holding_period": 20,
            "signal_type": "long",
            "position_sizing": "equal_weight",
            "allow_leverage": False
        }
        
        response = self.client.post("/api/backtest/run", json=request_data)
        
        assert response.status_code == 200
        data = response.json()
        
        # Validate equity curve
        equity_curve = data["equity_curve"]
        assert isinstance(equity_curve, list)
        
        if equity_curve:
            # Check each point has required fields
            for point in equity_curve:
                assert "date" in point
                assert "value" in point
                assert isinstance(point["date"], str)
                assert isinstance(point["value"], (int, float))
                assert point["value"] > 0  # Value should be positive

    def test_api_trade_data_integrity(self):
        """Test API trade data integrity"""
        request_data = {
            "signals_data": self.test_signals_data,
            "ohlcv_data": self.test_ohlcv_data,
            "initial_capital": 100000,
            "stop_loss": 5.0,
            "take_profit": 10.0,
            "holding_period": 20,
            "signal_type": "long",
            "position_sizing": "equal_weight",
            "allow_leverage": False
        }
        
        response = self.client.post("/api/backtest/run", json=request_data)
        
        assert response.status_code == 200
        data = response.json()
        
        # Validate trades
        trades = data["trades"]
        assert isinstance(trades, list)
        
        for trade in trades:
            # Check required fields
            required_fields = ["symbol", "entry_date", "entry_price"]
            for field in required_fields:
                assert field in trade, f"Missing field in trade: {field}"
            
            # Check data types
            assert isinstance(trade["symbol"], str)
            assert isinstance(trade["entry_date"], str)
            assert isinstance(trade["entry_price"], (int, float))
            assert trade["entry_price"] > 0  # Entry price should be positive

    def test_api_monitoring_data_integrity(self):
        """Test API monitoring data integrity"""
        request_data = {
            "signals_data": self.test_signals_data,
            "ohlcv_data": self.test_ohlcv_data,
            "initial_capital": 100000,
            "stop_loss": 5.0,
            "take_profit": 10.0,
            "holding_period": 20,
            "signal_type": "long",
            "position_sizing": "equal_weight",
            "allow_leverage": False
        }
        
        response = self.client.post("/api/backtest/run", json=request_data)
        
        assert response.status_code == 200
        data = response.json()
        
        # Validate monitoring data
        monitoring = data["monitoring"]
        assert isinstance(monitoring, dict)
        
        # Check required fields
        required_fields = ["execution_id", "cache_hit", "from_cache"]
        for field in required_fields:
            assert field in monitoring, f"Missing monitoring field: {field}"
        
        # Check data types
        assert isinstance(monitoring["execution_id"], str)
        assert isinstance(monitoring["cache_hit"], bool)
        assert isinstance(monitoring["from_cache"], bool)
        
        # Verify execution ID in monitoring system
        monitor = get_backtest_monitor()
        execution_summary = monitor.get_execution_summary(monitoring["execution_id"])
        assert execution_summary is not None

    def test_api_caching_consistency(self):
        """Test API caching consistency"""
        request_data = {
            "signals_data": self.test_signals_data,
            "ohlcv_data": self.test_ohlcv_data,
            "initial_capital": 100000,
            "stop_loss": 5.0,
            "take_profit": 10.0,
            "holding_period": 20,
            "signal_type": "long",
            "position_sizing": "equal_weight",
            "allow_leverage": False
        }
        
        # Make first request
        response1 = self.client.post("/api/backtest/run", json=request_data)
        assert response1.status_code == 200
        data1 = response1.json()
        
        # Make second request (should hit cache)
        response2 = self.client.post("/api/backtest/run", json=request_data)
        assert response2.status_code == 200
        data2 = response2.json()
        
        # Results should be identical
        assert data1["trades"] == data2["trades"]
        assert data1["performance_metrics"] == data2["performance_metrics"]
        assert data1["equity_curve"] == data2["equity_curve"]
        assert data1["summary"] == data2["summary"]
        assert data1["signals_processed"] == data2["signals_processed"]
        
        # Monitoring should show cache hit
        monitor = get_backtest_monitor()
        cache_performance = monitor.get_cache_performance()
        assert cache_performance["hits"] > 0

    def test_api_parameter_validation(self):
        """Test API parameter validation"""
        # Test various invalid parameter combinations
        test_cases = [
            # Invalid signal type
            {
                "signals_data": self.test_signals_data,
                "ohlcv_data": self.test_ohlcv_data,
                "signal_type": "invalid_type"
            },
            # Invalid position sizing
            {
                "signals_data": self.test_signals_data,
                "ohlcv_data": self.test_ohlcv_data,
                "position_sizing": "invalid_sizing"
            },
            # Invalid stop loss
            {
                "signals_data": self.test_signals_data,
                "ohlcv_data": self.test_ohlcv_data,
                "stop_loss": -1.0
            },
            # Invalid take profit
            {
                "signals_data": self.test_signals_data,
                "ohlcv_data": self.test_ohlcv_data,
                "take_profit": -1.0
            },
            # Invalid holding period
            {
                "signals_data": self.test_signals_data,
                "ohlcv_data": self.test_ohlcv_data,
                "holding_period": -1
            }
        ]
        
        for test_case in test_cases:
            request_data = {
                "signals_data": self.test_signals_data,
                "ohlcv_data": self.test_ohlcv_data,
                "initial_capital": 100000,
                "stop_loss": 5.0,
                "take_profit": 10.0,
                "holding_period": 20,
                "signal_type": "long",
                "position_sizing": "equal_weight",
                "allow_leverage": False,
                **test_case
            }
            
            response = self.client.post("/api/backtest/run", json=request_data)
            
            # Should handle invalid parameters gracefully
            assert response.status_code in [200, 422]

    def test_api_cross_request_isolation(self):
        """Test API cross-request isolation"""
        # Different requests should not interfere with each other
        request_data1 = {
            "signals_data": self.test_signals_data,
            "ohlcv_data": self.test_ohlcv_data,
            "initial_capital": 100000,
            "stop_loss": 5.0,
            "take_profit": 10.0,
            "holding_period": 20,
            "signal_type": "long",
            "position_sizing": "equal_weight",
            "allow_leverage": False
        }
        
        request_data2 = {
            "signals_data": self.test_signals_data,
            "ohlcv_data": self.test_ohlcv_data,
            "initial_capital": 200000,  # Different initial capital
            "stop_loss": 3.0,  # Different stop loss
            "take_profit": 8.0,  # Different take profit
            "holding_period": 10,  # Different holding period
            "signal_type": "short",  # Different signal type
            "position_sizing": "kelly",  # Different position sizing
            "allow_leverage": True  # Different leverage setting
        }
        
        # Make both requests
        response1 = self.client.post("/api/backtest/run", json=request_data1)
        response2 = self.client.post("/api/backtest/run", json=request_data2)
        
        assert response1.status_code == 200
        assert response2.status_code == 200
        
        data1 = response1.json()
        data2 = response2.json()
        
        # Results should be different due to different parameters
        assert data1["performance_metrics"] != data2["performance_metrics"]
        assert data1["summary"] != data2["summary"]
        
        # Monitoring should track both executions separately
        monitor = get_backtest_monitor()
        active_executions = monitor.get_active_executions()
        assert len(active_executions) >= 2


class TestBacktestCacheIntegration:
    """Integration tests for backtest caching system"""

    def setup_method(self):
        """Set up test fixtures before each test method"""
        # Reset global cache instance
        import backtest_cache
        backtest_cache._cache_instance = None
        
        self.cache = get_backtest_cache()
        self.test_data = {
            "trades": [],
            "performance_metrics": {"total_return": 10.5},
            "equity_curve": [],
            "summary": {},
            "execution_time": 1.5
        }
