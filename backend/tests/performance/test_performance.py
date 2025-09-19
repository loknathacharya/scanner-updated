"""
Performance tests for backtest API endpoints

This module provides performance tests for the backtest API using Locust,
including:
- Backtest execution endpoint
- Parameter optimization endpoint
- High-concurrency scenarios
- Large dataset handling
"""

import json
from locust import HttpUser, task, between

class BacktestApiUser(HttpUser):
    wait_time = between(1, 5)  # Wait 1-5 seconds between tasks
    
    def on_start(self):
        """Generate test data on user start"""
        self.generate_test_data()

    def generate_test_data(self):
        """Generate test data for performance testing"""
        self.signals_data = []
        self.ohlcv_data = []
        
        stocks = ["AAPL", "GOOGL", "MSFT", "AMZN", "TSLA"]
        
        for day in range(1, 32):
            date_str = f"2023-01-{str(day).zfill(2)}"
            
            for stock in stocks:
                # Generate signals
                if day % 5 == 0:  # Generate signals every 5 days
                    self.signals_data.append({
                        "Ticker": stock,
                        "Date": date_str,
                        "Signal": "BUY",
                        "Price": 100 + day * 2,
                        "Volume": 1000000 + day * 10000
                    })
                
                # Generate OHLCV data
                self.ohlcv_data.append({
                    "Ticker": stock,
                    "Date": date_str,
                    "Open": 100 + day * 2,
                    "High": 105 + day * 2,
                    "Low": 98 + day * 2,
                    "Close": 102 + day * 2,
                    "Volume": 1000000 + day * 10000
                })

    @task(10)
    def run_backtest(self):
        """Performance test for backtest execution endpoint"""
        request_data = {
            "signals_data": self.signals_data,
            "ohlcv_data": self.ohlcv_data,
            "initial_capital": 100000,
            "stop_loss": 5.0,
            "take_profit": 10.0,
            "holding_period": 20,
            "signal_type": "long",
            "position_sizing": "equal_weight",
            "allow_leverage": False
        }
        
        self.client.post("/api/backtest/run", 
                         json=request_data,
                         name="/api/backtest/run")

    @task(2)
    def run_optimization(self):
        """Performance test for parameter optimization endpoint"""
        request_data = {
            "signals_data": self.signals_data[:20],  # Smaller dataset for optimization
            "ohlcv_data": self.ohlcv_data[:20],
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
        
        self.client.post("/api/backtest/optimize", 
                         json=request_data,
                         name="/api/backtest/optimize")

    @task(5)
    def get_health_check(self):
        """Performance test for health check endpoint"""
        self.client.get("/api/backtest/health", name="/api/backtest/health")

    @task(3)
    def get_cache_stats(self):
        """Performance test for cache statistics endpoint"""
        self.client.get("/api/backtest/cache/stats", name="/api/backtest/cache/stats")

    @task(1)
    def run_backtest_with_large_dataset(self):
        """Performance test with large dataset"""
        # Generate larger dataset
        large_signals = []
        large_ohlcv = []
        
        for i in range(500):
            large_signals.append({
                "Ticker": f"STOCK{i % 50}",
                "Date": f"2023-01-{str(i % 31 + 1).zfill(2)}",
                "Signal": "BUY",
                "Price": 100.0 + (i % 50),
                "Volume": 1000000 + (i % 500000)
            })
            
            large_ohlcv.append({
                "Ticker": f"STOCK{i % 50}",
                "Date": f"2023-01-{str(i % 31 + 1).zfill(2)}",
                "Open": 100.0 + (i % 50),
                "High": 105.0 + (i % 50),
                "Low": 95.0 + (i % 50),
                "Close": 102.0 + (i % 50),
                "Volume": 1000000 + (i % 500000)
            })
        
        request_data = {
            "signals_data": large_signals,
            "ohlcv_data": large_ohlcv,
            "initial_capital": 100000,
            "stop_loss": 5.0,
            "take_profit": 10.0,
            "holding_period": 20,
            "signal_type": "long",
            "position_sizing": "equal_weight",
            "allow_leverage": False
        }
        
        self.client.post("/api/backtest/run", 
                         json=request_data,
                         name="/api/backtest/run_large")

    @task(1)
    def run_backtest_with_cache_hit(self):
        """Performance test with cache hit"""
        # This request should hit the cache after the first run
        request_data = {
            "signals_data": self.signals_data[:10],
            "ohlcv_data": self.ohlcv_data[:10],
            "initial_capital": 100000,
            "stop_loss": 5.0,
            "take_profit": 10.0,
            "holding_period": 20,
            "signal_type": "long",
            "position_sizing": "equal_weight",
            "allow_leverage": False
        }
        
        self.client.post("/api/backtest/run", 
                         json=request_data,
                         name="/api/backtest/run_cache_hit")

    @task(1)
    def run_backtest_with_cache_miss(self):
        """Performance test with cache miss"""
        # This request should miss the cache due to different parameters
        request_data = {
            "signals_data": self.signals_data[:10],
            "ohlcv_data": self.ohlcv_data[:10],
            "initial_capital": 100000,
            "stop_loss": 5.0 + self.environment.runner.stats.total.num_requests % 5,  # Vary stop loss
            "take_profit": 10.0,
            "holding_period": 20,
            "signal_type": "long",
            "position_sizing": "equal_weight",
            "allow_leverage": False
        }
        
        self.client.post("/api/backtest/run", 
                         json=request_data,
                         name="/api/backtest/run_cache_miss")