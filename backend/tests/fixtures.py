"""
Test fixtures and mock data for backtest integration tests

This module provides reusable test fixtures and mock data for unit, integration,
and end-to-end tests, including:
- Mock backtest engine components
- Sample signals and OHLCV data
- Mock cache and monitoring services
- Test data generators
"""

import pytest
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from unittest.mock import Mock, MagicMock

# Mock Backtest Engine Components
@pytest.fixture
def mock_backtest_engine():
    """Mock backtest engine with predefined behavior"""
    engine = Mock()
    engine.run_backtest.return_value = (
        pd.DataFrame({
            "symbol": ["AAPL"],
            "entry_date": [datetime(2023, 1, 1)],
            "exit_date": [datetime(2023, 1, 15)],
            "pnl": [1000.0]
        }),
        []
    )
    engine.run_vectorized_parameter_optimization.return_value = pd.DataFrame({
        "stop_loss": [5.0],
        "take_profit": [10.0],
        "total_return": [15.0]
    })
    return engine

@pytest.fixture
def mock_performance_metrics():
    """Mock performance metrics calculator"""
    metrics = Mock()
    metrics.calculate_performance_metrics.return_value = {
        "total_return": 10.5,
        "sharpe_ratio": 1.2,
        "max_drawdown": -5.0,
        "win_rate": 65.0
    }
    return metrics

# Sample Signals and OHLCV Data
@pytest.fixture
def sample_signals_data():
    """Sample signals data for testing"""
    return [
        {"Ticker": "AAPL", "Date": "2023-01-01", "Signal": "BUY"},
        {"Ticker": "GOOGL", "Date": "2023-01-02", "Signal": "BUY"},
        {"Ticker": "MSFT", "Date": "2023-01-03", "Signal": "SELL"}
    ]

@pytest.fixture
def sample_ohlcv_data():
    """Sample OHLCV data for testing"""
    return [
        {"Ticker": "AAPL", "Date": "2023-01-01", "Open": 150, "High": 155, "Low": 148, "Close": 152, "Volume": 1000000},
        {"Ticker": "GOOGL", "Date": "2023-01-02", "Open": 100, "High": 105, "Low": 98, "Close": 102, "Volume": 500000},
        {"Ticker": "MSFT", "Date": "2023-01-03", "Open": 200, "High": 205, "Low": 198, "Close": 202, "Volume": 800000}
    ]

# Mock Cache and Monitoring Services
@pytest.fixture
def mock_backtest_cache():
    """Mock backtest cache service"""
    cache = Mock()
    cache.get_backtest_result.return_value = None  # Default to cache miss
    cache.set_backtest_result.return_value = True
    cache.is_available.return_value = True
    return cache

@pytest.fixture
def mock_backtest_monitor():
    """Mock backtest monitoring service"""
    monitor = Mock()
    monitor.track_execution.return_value.__enter__ = Mock(return_value="test_execution_id")
    monitor.track_execution.return_value.__exit__ = Mock(return_value=None)
    return monitor

# Test Data Generators
def generate_signals_data(num_signals=100):
    """Generate a larger set of signals data"""
    signals = []
    stocks = ["AAPL", "GOOGL", "MSFT", "AMZN", "TSLA"]
    
    for i in range(num_signals):
        date = datetime(2023, 1, 1) + timedelta(days=i)
        signals.append({
            "Ticker": stocks[i % len(stocks)],
            "Date": date.strftime("%Y-%m-%d"),
            "Signal": "BUY" if i % 2 == 0 else "SELL"
        })
    return signals

def generate_ohlcv_data(num_days=100):
    """Generate a larger set of OHLCV data"""
    ohlcv = []
    stocks = ["AAPL", "GOOGL", "MSFT", "AMZN", "TSLA"]
    
    for i in range(num_days):
        date = datetime(2023, 1, 1) + timedelta(days=i)
        for stock in stocks:
            ohlcv.append({
                "Ticker": stock,
                "Date": date.strftime("%Y-%m-%d"),
                "Open": 100 + i,
                "High": 105 + i,
                "Low": 98 + i,
                "Close": 102 + i,
                "Volume": 1000000 + i * 10000
            })
    return ohlcv

# Pytest Fixtures for Data Generators
@pytest.fixture
def large_signals_data():
    """Fixture for large signals dataset"""
    return generate_signals_data(500)

@pytest.fixture
def large_ohlcv_data():
    """Fixture for large OHLCV dataset"""
    return generate_ohlcv_data(200)

# Mock FastAPI Dependencies
@pytest.fixture
def mock_get_backtest_adapter(mock_backtest_engine):
    """Mock dependency for getting backtest adapter"""
    adapter = Mock()
    adapter.run_backtest.return_value = {
        'trades': [],
        'performance_metrics': {'total_return': 10.5},
        'equity_curve': [],
        'summary': {},
        'execution_time': 1.5,
        'signals_processed': 100
    }
    return adapter

# Mock Pydantic Models
@pytest.fixture
def backtest_request_model():
    """Fixture for BacktestRequest model"""
    from backtest_api import BacktestRequest
    return BacktestRequest

@pytest.fixture
def backtest_response_model():
    """Fixture for BacktestResponse model"""
    from backtest_api import BacktestResponse
    return BacktestResponse

# Mock External Services
@pytest.fixture
def mock_redis_client():
    """Mock Redis client"""
    redis_client = Mock()
    redis_client.get.return_value = None
    redis_client.setex.return_value = True
    redis_client.delete.return_value = 1
    redis_client.keys.return_value = []
    return redis_client

@pytest.fixture
def mock_psutil():
    """Mock psutil for system health monitoring"""
    psutil_mock = Mock()
    psutil_mock.virtual_memory.return_value.percent = 50.0
    psutil_mock.cpu_percent.return_value = 30.0
    psutil_mock.disk_usage.return_value.percent = 40.0
    psutil_mock.net_io_counters.return_value.bytes_sent = 1000000
    psutil_mock.net_io_counters.return_value.bytes_recv = 2000000
    psutil_mock.pids.return_value = [1, 2, 3]
    return psutil_mock

# Utility Fixtures
@pytest.fixture
def temp_output_dir():
    """Create a temporary directory for test outputs"""
    import tempfile
    import shutil
    
    temp_dir = tempfile.mkdtemp()
    yield temp_dir
    shutil.rmtree(temp_dir)

@pytest.fixture
def event_loop():
    """Create an instance of the default event loop for async tests"""
    import asyncio
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()