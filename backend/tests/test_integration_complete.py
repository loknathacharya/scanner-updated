
"""
Complete integration tests for backtest API endpoints

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
        
       