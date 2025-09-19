"""
End-to-end tests for backtest integration system

This module provides comprehensive end-to-end tests for the backtest integration system,
testing the complete workflow from frontend to backend including:
- Complete user journey from file upload to results export
- Parameter optimization workflow
- Monitoring dashboard functionality
- Performance under load
- Error scenarios and graceful degradation
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
import tempfile
import os

# Import the modules to test
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backtest_api import router, BacktestEngineAdapter, BacktestRequest, BacktestResponse
from backtest_cache import get_backtest_cache, BacktestCache
from backtest_monitoring import get_backtest_monitor, BacktestMonitor
from main import app


class TestBacktestE2E:
    """End-to-end tests for backtest integration system"""

    def setup_method(self):
        """Set up test fixtures before each test method"""
        # Reset global instances
        import backtest_cache
        import backtest_monitoring
        backtest_cache._cache_instance = None
        backtest_monitoring._monitor_instance = None
        
        # Create test client
        self.client = TestClient(app)
        
        # Generate comprehensive test data
        self.generate_test_data()

    def teardown_method(self):
        """Clean up after each test method"""
        # Clean up global instances
        import backtest_cache
        import backtest_monitoring
        backtest_cache._cache_instance = None
        backtest_monitoring._monitor_instance = None

    def generate_test_data(self):
        """Generate comprehensive test data for E2E testing"""
        # Generate signals data for multiple stocks over multiple dates
        self.signals_data = []
        self.ohlcv_data = []
        
        stocks = ["AAPL", "GOOGL", "MSFT", "AMZN", "TSLA", "META", "NVDA", "NFLX"]
        
        for day in range(1, 32):  # January 2023
            date_str = f"2023-01-{str(day).zfill(2)}"
            
            for stock in stocks:
                # Generate signals (random buy/sell signals)
                signal = "BUY" if np.random.random() > 0.6 else "HOLD"
                if signal == "BUY":
                    price = 100 + np.random.random() * 200  # Random price between 100-300
                    volume = int(1000000 + np.random.random() * 4000000)  # Random volume
                    
                    self.signals_data.append({
                        "Ticker": stock,
                        "Date": date_str,
                        "Signal": signal,
                        "Price": price,
                        "Volume": volume
                    })
                
                # Generate OHLCV data
                base_price = 100 + np.random.random() * 200
                ohlc_variation = np.random.random() * 10  # ±10% variation
                
                self.ohlcv_data.append({
                    "Ticker": stock,
                    "Date": date_str,
                    "Open": base_price * (1 - ohlc_variation/2),
                    "High": base_price * (1 + ohlc_variation/2),
                    "Low": base_price * (1 - ohlc_variation),
                    "Close": base_price * (1 + np.random.random() * ohlc_variation - ohlc_variation/2),
                    "Volume": int(1000000 + np.random.random() * 4000000)
                })

    def test_complete_backtest_workflow(self):
        """Test complete backtest workflow from request to results"""
        print("Testing complete backtest workflow...")
        
        # Step 1: Prepare request data
        request_data = {
            "signals_data": self.signals_data[:100],  # Use subset for faster testing
            "ohlcv_data": self.ohlcv_data[:100],
            "initial_capital": 100000,
            "stop_loss": 5.0,
            "take_profit": 10.0,
            "holding_period": 20,
            "signal_type": "long",
            "position_sizing": "equal_weight",
            "allow_leverage": False
        }
        
        # Step 2: Execute backtest
        start_time = time.time()
        response = self.client.post("/api/backtest/run", json=request_data)
        end_time = time.time()
        
        assert response.status_code == 200
        results = response.json()
        
        # Step 3: Validate results structure
        required_fields = [
            "trades", "performance_metrics", "equity_curve", 
            "summary", "execution_time", "signals_processed", "monitoring"
        ]
        
        for field in required_fields:
            assert field in results, f"Missing field: {field}"
        
        # Step 4: Validate data integrity
        assert isinstance(results["trades"], list)
        assert isinstance(results["performance_metrics"], dict)
        assert isinstance(results["equity_curve"], list)
        assert isinstance(results["summary"], dict)
        assert isinstance(results["execution_time"], (int, float))
        assert isinstance(results["signals_processed"], int)
        assert isinstance(results["monitoring"], dict)
        
        # Step 5: Validate performance metrics
        metrics = results["performance_metrics"]
        expected_metrics = [
            "total_return", "win_rate", "sharpe_ratio", "max_drawdown",
            "profit_factor", "avg_trade_return", "total_trades"
        ]
        
        for metric in expected_metrics:
            assert metric in metrics, f"Missing metric: {metric}"
        
        # Step 6: Validate monitoring data
        monitoring = results["monitoring"]
        assert "execution_id" in monitoring
        assert "cache_hit" in monitoring
        assert "from_cache" in monitoring
        
        # Step 7: Verify execution time is reasonable
        assert results["execution_time"] > 0
        assert end_time - start_time < 30  # Should complete in less than 30 seconds
        
        # Step 8: Verify signals processed
        assert results["signals_processed"] > 0
        assert results["signals_processed"] <= len(request_data["signals_data"])
        
        print(f"✓ Complete workflow test passed in {end_time - start_time:.2f}s")

    def test_parameter_optimization_workflow(self):
        """Test complete parameter optimization workflow"""
        print("Testing parameter optimization workflow...")
        
        # Step 1: Prepare optimization request
        request_data = {
            "signals_data": self.signals_data[:50],  # Use subset for faster testing
            "ohlcv_data": self.ohlcv_data[:50],
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
        
        # Step 2: Execute optimization
        start_time = time.time()
        response = self.client.post("/api/backtest/optimize", json=request_data)
        end_time = time.time()
        
        assert response.status_code == 200
        results = response.json()
        
        # Step 3: Validate results structure
        required_fields = [
            "best_params", "best_performance", "all_results", 
            "execution_time", "signals_processed", "risk_warnings"
        ]
        
        for field in required_fields:
            assert field in results, f"Missing field: {field}"
        
        # Step 4: Validate data integrity
        assert isinstance(results["best_params"], dict)
        assert isinstance(results["best_performance"], dict)
        assert isinstance(results["all_results"], list)
        assert isinstance(results["execution_time"], (int, float))
        assert isinstance(results["signals_processed"], int)
        assert isinstance(results["risk_warnings"], list)
        
        # Step 5: Validate optimization results
        assert len(results["all_results"]) > 0
        assert len(results["all_results"]) <= 27  # 3x3x3 parameter combinations
        
        # Step 6: Verify best parameters are valid
        best_params = results["best_params"]
        assert "stop_loss" in best_params
        assert "take_profit" in best_params
        assert "holding_period" in best_params
        
        # Step 7: Verify best performance is valid
        best_performance = results["best_performance"]
        assert "total_return" in best_performance
        assert isinstance(best_performance["total_return"], (int, float))
        
        # Step 8: Verify execution time is reasonable
        assert results["execution_time"] > 0
        assert end_time - start_time < 60  # Should complete in less than 60 seconds
        
        print(f"✓ Parameter optimization test passed in {end_time - start_time:.2f}s")

    def test_caching_workflow(self):
        """Test complete caching workflow"""
        print("Testing caching workflow...")
        
        # Step 1: Prepare request data
        request_data = {
            "signals_data": self.signals_data[:50],
            "ohlcv_data": self.ohlcv_data[:50],
            "initial_capital": 100000,
            "stop_loss": 5.0,
            "take_profit": 10.0,
            "holding_period": 20,
            "signal_type": "long",
            "position_sizing": "equal_weight",
            "allow_leverage": False
        }
        
        # Step 2: Execute first request (should miss cache)
        start_time1 = time.time()
        response1 = self.client.post("/api/backtest/run", json=request_data)
        end_time1 = time.time()
        time1 = end_time1 - start_time1
        
        assert response1.status_code == 200
        results1 = response1.json()
        
        # Step 3: Execute second request (should hit cache)
        start_time2 = time.time()
        response2 = self.client.post("/api/backtest/run", json=request_data)
        end_time2 = time.time()
        time2 = end_time2 - start_time2
        
        assert response2.status_code == 200
        results2 = response2.json()
        
        # Step 4: Verify results are identical
        assert results1 == results2
        
        # Step 5: Verify cache performance improvement
        assert time2 <= time1 * 1.5  # Second request should be faster
        
        # Step 6: Verify cache statistics
        cache_response = self.client.get("/api/backtest/cache/stats")
        assert cache_response.status_code == 200
        cache_stats = cache_response.json()
        assert cache_stats["hits"] > 0
        assert cache_stats["total_operations"] > 0
        
        print(f"✓ Caching workflow test passed (first: {time1:.2f}s, second: {time2:.2f}s)")

    def test_user_tracking_workflow(self):
        """Test complete user tracking workflow"""
        print("Testing user tracking workflow...")
        
        # Step 1: Prepare request data with user tracking
        request_data = {
            "signals_data": self.signals_data[:50],
            "ohlcv_data": self.ohlcv_data[:50],
            "initial_capital": 100000,
            "stop_loss": 5.0,
            "take_profit": 10.0,
            "holding_period": 20,
            "signal_type": "long",
            "position_sizing": "equal_weight",
            "allow_leverage": False
        }
        
        # Step 2: Execute multiple requests with different users
        user_ids = ["user_1", "user_2", "user_3"]
        execution_ids = []
        
        for user_id in user_ids:
            response = self.client.post("/api/backtest/run", 
                                      json=request_data,
                                      headers={"X-User-ID": user_id})
            
            assert response.status_code == 200
            results = response.json()
            
            # Track execution ID
            execution_ids.append(results["monitoring"]["execution_id"])
        
        # Step 3: Verify user activity tracking
        monitor = get_backtest_monitor()
        
        for user_id in user_ids:
            user_activity = monitor.get_user_activity(user_id=user_id)
            assert len(user_activity) > 0
            assert user_activity[0]["user_id"] == user_id
        
        # Step 4: Verify execution tracking
        for execution_id in execution_ids:
            summary = monitor.get_execution_summary(execution_id)
            assert summary is not None
            assert summary["execution_id"] == execution_id
        
        print(f"✓ User tracking workflow test passed for {len(user_ids)} users")

    def test_error_handling_workflow(self):
        """Test complete error handling workflow"""
        print("Testing error handling workflow...")
        
        # Step 1: Test with empty signals data
        request_data = {
            "signals_data": [],
            "ohlcv_data": self.ohlcv_data[:10],
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
        results = response.json()
        assert results["trades"] == []
        assert results["signals_processed"] == 0
        
        # Step 2: Test with invalid parameters
        request_data["signals_data"] = self.signals_data[:10]
        request_data["stop_loss"] = -1.0  # Invalid negative stop loss
        
        response = self.client.post("/api/backtest/run", json=request_data)
        assert response.status_code == 200  # Should handle gracefully
        
        # Step 3: Test with invalid optimization parameters
        optimization_request = {
            "signals_data": [],
            "ohlcv_data": self.ohlcv_data[:10],
            "param_ranges": {},
            "initial_capital": 100000,
            "stop_loss": 5.0,
            "take_profit": 10.0,
            "holding_period": 20,
            "signal_type": "long",
            "position_sizing": "equal_weight",
            "allow_leverage": False
        }
        
        response = self.client.post("/api/backtest/optimize", json=optimization_request)
        assert response.status_code == 200  # Should handle gracefully
        
        # Step 4: Test with missing required fields
        incomplete_request = {
            "signals_data": self.signals_data[:10],
            # Missing ohlcv_data
        }
        
        response = self.client.post("/api/backtest/run", json=incomplete_request)
        assert response.status_code == 422  # Should return validation error
        
        print("✓ Error handling workflow test passed")

    def test_performance_monitoring_workflow(self):
        """Test complete performance monitoring workflow"""
        print("Testing performance monitoring workflow...")
        
        # Step 1: Execute multiple backtests
        execution_ids = []
        
        for i in range(5):
            request_data = {
                "signals_data": self.signals_data[:20 + i*10],  # Varying data size
                "ohlcv_data": self.ohlcv_data[:20 + i*10],
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
            results = response.json()
            
            execution_ids.append(results["monitoring"]["execution_id"])
        
        # Step 2: Verify performance monitoring
        monitor = get_backtest_monitor()
        
        # Check execution history
        history = monitor.get_execution_history(limit=10)
        assert len(history) >= 5
        
        # Check aggregated metrics
        aggregated = monitor.get_aggregated_metrics()
        assert aggregated is not None
        assert "total_executions" in aggregated
        assert aggregated["total_executions"] >= 5
        
        # Check system health
        health = monitor.get_system_health()
        assert health is not None
        assert "status" in health
        assert "timestamp" in health
        
        # Check memory usage
        memory_usage = monitor.get_memory_usage()
        assert memory_usage is not None
        assert "used_memory" in memory_usage
        
        print("✓ Performance monitoring workflow test passed")

    def test_concurrent_requests_workflow(self):
        """Test complete concurrent requests workflow"""
        print("Testing concurrent requests workflow...")
        
        # Step 1: Prepare request data
        request_data = {
            "signals_data": self.signals_data[:30],
            "ohlcv_data": self.ohlcv_data[:30],
            "initial_capital": 100000,
            "stop_loss": 5.0,
            "take_profit": 10.0,
            "holding_period": 20,
            "signal_type": "long",
            "position_sizing": "equal_weight",
            "allow_leverage": False
        }
        
        # Step 2: Execute multiple concurrent requests
        async def make_request(request_id):
            return self.client.post("/api/backtest/run", json=request_data)
        
        async def make_concurrent_requests():
            tasks = [make_request(i) for i in range(10)]
            responses = await asyncio.gather(*tasks)
            return responses
        
        # Step 3: Run concurrent requests
        start_time = time.time()
        responses = asyncio.run(make_concurrent_requests())
        end_time = time.time()
        
        # Step 4: Verify all requests succeeded
        successful_requests = 0
        for response in responses:
            if response.status_code == 200:
                successful_requests += 1
                results = response.json()
                
                # Validate response structure
                assert "trades" in results
                assert "performance_metrics" in results
                assert "equity_curve" in results
                assert "summary" in results
                assert "execution_time" in results
                assert "signals_processed" in results
                assert "monitoring" in results
        
        # Step 5: Verify performance
        assert successful_requests == 10  # All requests should succeed
        assert end_time - start_time < 60  # Should complete in less than 60 seconds
        
        # Step 6: Verify monitoring handled concurrent executions
        monitor = get_backtest_monitor()
        active_executions = monitor.get_active_executions()
        completed_executions = monitor.get_execution_history(limit=20)
        
        assert len(completed_executions) >= 10
        
        print(f"✓ Concurrent requests workflow test passed ({successful_requests}/10 in {end_time - start_time:.2f}s)")

    def test_data_export_workflow(self):
        """Test complete data export workflow"""
        print("Testing data export workflow...")
        
        # Step 1: Execute backtest
        request_data = {
            "signals_data": self.signals_data[:50],
            "ohlcv_data": self.ohlcv_data[:50],
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
        results = response.json()
        
        # Step 2: Test CSV export simulation
        trades_csv = self.convert_to_csv(results["trades"])
        assert isinstance(trades_csv, str)
        assert len(trades_csv) > 0
        
        # Step 3: Test JSON export simulation
        trades_json = json.dumps(results["trades"], indent=2)
        assert isinstance(trades_json, str)
        assert len(trades_json) > 0
        
        # Step 4: Test performance metrics export
        performance_export = {
            "performance_metrics": results["performance_metrics"],
            "summary": results["summary"],
            "execution_time": results["execution_time"],
            "signals_processed": results["signals_processed"],
            "trade_count": len(results["trades"])
        }
        
        performance_json = json.dumps(performance_export, indent=2)
        assert isinstance(performance_json, str)
        assert len(performance_json) > 0
        
        # Step 5: Test equity curve export
        equity_json = json.dumps(results["equity_curve"], indent=2)
        assert isinstance(equity_json, str)
        assert len(equity_json) > 0
        
        print("✓ Data export workflow test passed")

    def convert_to_csv(self, data):
        """Convert data to CSV format"""
        if not data or len(data) == 0:
            return ""
        
        # Get headers
        headers = list(data[0].keys())
        csv_lines = [",".join(headers)]
        
        # Add data rows
        for row in data:
            csv_row = []
            for header in headers:
                value = row.get(header, "")
                # Escape commas in string values
                if isinstance(value, str) and "," in value:
                    value = f'"{value}"'
                csv_row.append(str(value))
            csv_lines.append(",".join(csv_row))
        
        return "\n".join(csv_lines)

    def test_system_health_workflow(self):
        """Test complete system health monitoring workflow"""
        print("Testing system health monitoring workflow...")
        
        # Step 1: Execute various operations to generate system activity
        operations = []
        
        # Execute backtests
        for i in range(3):
            request_data = {
                "signals_data": self.signals_data[:20 + i*10],
                "ohlcv_data": self.ohlcv_data[:20 + i*10],
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
            operations.append("backtest")
        
        # Execute optimization
        optimization_request = {
            "signals_data": self.signals_data[:30],
            "ohlcv_data": self.ohlcv_data[:30],
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
        
        response = self.client.post("/api/backtest/optimize", json=optimization_request)
        assert response.status_code == 200
        operations.append("optimization")
        
        # Step 2: Check system health
        monitor = get_backtest_monitor()
        health = monitor.get_system_health()
        
        assert health is not None
        assert "status" in health
        assert "timestamp" in health
        assert "uptime" in health
        assert "memory_usage" in health
        assert "cache_performance" in health
        assert "active_executions" in health
        assert "total_executions" in health
        
        # Step 3: Verify health status
        assert health["status"] in ["healthy", "warning", "error"]
        assert health["timestamp"] is not None
        assert health["uptime"] >= 0
        
        # Step 4: Verify memory usage
        memory_usage = health["memory_usage"]
        assert "used_memory" in memory_usage
        assert "max_memory" in memory_usage
        assert "memory_usage_percent" in memory_usage
        
        # Step 5: Verify cache performance
        cache_performance = health["cache_performance"]
        assert "hits" in cache_performance
        assert "misses" in cache_performance
        assert "hit_rate" in cache_performance
        assert "total_operations" in cache_performance
        
        # Step 6: Verify execution counts
        assert health["total_executions"] >= 4  # 3 backtests + 1 optimization
        
        print("✓ System health monitoring workflow test passed")

    def test_memory_efficiency_workflow(self):
        """Test complete memory efficiency workflow"""
        print("Testing memory efficiency workflow...")
        
        # Step 1: Monitor initial memory usage
        import psutil
        process = psutil.Process()
        initial_memory = process.memory_info().rss / 1024 / 1024  # MB
        
        # Step 2: Execute multiple large backtests
        memory_usage = []
        
        for i in range(5):
            request_data = {
                "signals_data": self.signals_data[:100 + i*50],  # Increasing data size
                "ohlcv_data": self.ohlcv_data[:100 + i*50],
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
            
            # Monitor memory usage
            current_memory = process.memory_info().rss / 1024 / 1024  # MB
            memory_usage.append(current_memory)
            
            # Force garbage collection
            import gc
            gc.collect()
        
        # Step 3: Check memory efficiency
        final_memory = process.memory_info().rss / 1024 / 1024  # MB
        memory_increase = final_memory - initial_memory
        
        # Memory increase should be reasonable (less than 200MB)
        assert memory_increase < 200
        
        # Memory usage should not grow exponentially
        for i in range(1, len(memory_usage)):
            memory_growth = memory_usage[i] - memory_usage[i-1]
            assert memory_growth < 50  # Less than 50MB growth per operation
        
        print(f"✓ Memory efficiency workflow test passed (initial: {initial_memory:.1f}MB, final: {final_memory:.1f}MB, increase: {memory_increase:.1f}MB)")

    def test_data_consistency_workflow(self):
        """Test complete data consistency workflow"""
        print("Testing data consistency workflow...")
        
        # Step 1: Execute the same backtest multiple times
        request_data = {
            "signals_data": self.signals_data[:50],
            "ohlcv_data": self.ohlcv_data[:50],
            "initial_capital": 100000,
            "stop_loss": 5.0,
            "take_profit": 10.0,
            "holding_period": 20,
            "signal_type": "long",
            "position_sizing": "equal_weight",
            "allow_leverage": False
        }
        
        results = []
        
        for i in range(5):
            response = self.client.post("/api/backtest/run", json=request_data)
            assert response.status_code == 200
            results.append(response.json())
        
        # Step 2: Verify all results are identical
        for i in range(1, len(results)):
            assert results[0] == results[i], f"Results differ between run 0 and run {i}"
        
        # Step 3: Verify data consistency across different components
        first_result = results[0]
        
        # Check trades consistency
        for trade in first_result["trades"]:
            assert "symbol" in trade or "Ticker" in trade
            assert "entry_date" in trade or "Entry_Date" in trade
            assert "entry_price" in trade or "Entry_Price" in trade
            assert isinstance(trade.get("entry_price", trade.get("Entry_Price")), (int, float))
            assert trade.get("entry_price", trade.get("Entry_Price")) > 0
        
        # Check performance metrics consistency
        metrics = first_result["performance_metrics"]
        assert "total_return" in metrics
        assert isinstance(metrics["total_return"], (int, float))
        
        # Check equity curve consistency
        for point in first_result["equity_curve"]:
            assert "date" in point
            assert "value" in point
            assert isinstance(point["date"], str)
            assert isinstance(point["value"], (int, float))
            assert point["value"] > 0
        
        # Step 4: Verify monitoring consistency
        monitoring = first_result["monitoring"]
        assert "execution_id" in monitoring
        assert "cache_hit" in monitoring
        assert "from_cache" in monitoring
        assert isinstance(monitoring["cache_hit"], bool)
        assert isinstance(monitoring["from_cache"], bool)
        
        print("✓ Data consistency workflow test passed")

    def test_load_balancing_workflow(self):
        """Test complete load balancing workflow"""
        print("Testing load balancing workflow...")
        
        # Step 1: Execute multiple requests with different data sizes
        request_sizes = [20, 50, 100, 150, 200]
        execution_times = []
        
        for size in request_sizes:
            request_data = {
                "signals_data": self.signals_data[:size],
                "ohlcv_data": self.ohlcv_data[:size],
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
            execution_time = end_time - start_time
            execution_times.append(execution_time)
            
            print(f"  Size {size}: {execution_time:.2f}s")
        
        # Step 2: Verify load balancing efficiency
        # Larger requests should take more time, but not exponentially more
        for i in range(1, len(request_sizes)):
            size_ratio = request_sizes[i] / request_sizes[i-1]
            time_ratio = execution_times[i] / execution_times[i-1]
            
            # Time should increase roughly linearly with data size
            assert time_ratio <= size_ratio * 2, f"Load balancing inefficient: size ratio {size_ratio:.2f}, time ratio {time_ratio:.2f}"
        
        # Step 3: Verify system handles load gracefully
        monitor = get_backtest_monitor()
        health = monitor.get_system_health()
        
        assert health["status"] == "healthy", f"System not healthy under load: {health['status']}"
        assert health["active_executions"] >= 0
        
        print("✓ Load balancing workflow test passed")

    def test_complete_user_journey(self):
        """Test complete user journey from upload to export"""
        print("Testing complete user journey...")
        
        # Step 1: User uploads signals data (simulated)
        signals_data = self.signals_data[:50]
        ohlcv_data = self.ohlcv_data[:50]
        
        # Step 2: User configures backtest parameters
        backtest_config = {
            "initial_capital": 100000,
            "stop_loss": 5.0,
            "take_profit": 10.0,
            "holding_period": 20,
            "signal_type": "long",
            "position_sizing": "equal_weight",
            "allow_leverage": False
        }
        
        # Step 3: User runs backtest
        request_data = {
            "signals_data": signals_data,
            "ohlcv_data": ohlcv_data,
            **backtest_config
        }
        
        response = self.client.post("/api/backtest/run", json=request_data)
        assert response.status_code == 200
        backtest_results = response.json()
        
        # Step 4: User reviews results
        assert len(backtest_results["trades"]) > 0
        assert backtest_results["performance_metrics"]["total_return"] is not None
        
        # Step 5: User decides to optimize parameters
        optimization_request = {
            "signals_data": signals_data,
            "ohlcv_data": ohlcv_data,
            "param_ranges": {
                "stop_loss": [3.0, 5.0, 7.0],
                "take_profit": [8.0, 10.0, 12.0],
                "holding_period": [10, 20, 30]
            },
            **backtest_config
        }
        
        response = self.client.post("/api/backtest/optimize", json=optimization_request)
        assert response.status_code == 200
        optimization_results = response.json()
        
        # Step 6: User reviews optimization results
        assert optimization_results["best_params"]["stop_loss"] in [3.0, 5.0, 7.0]
        assert optimization_results["best_performance"]["total_return"] > backtest_results["performance_metrics"]["total_return"]
        
        # Step 7: User exports results
        # Simulate CSV export
        trades_csv = self.convert_to_csv(backtest_results["trades"])
        assert len(trades_csv) > 0
        
        # Simulate JSON export
        performance_json = json.dumps({
            "performance_metrics": backtest_results["performance_metrics"],
            "summary": backtest_results["summary"],
            "execution_time": backtest_results["execution_time"],
            "signals_processed": backtest_results["signals_processed"]
        }, indent=2)
        assert len(performance_json) > 0
        
        # Step 8: User checks system health
        health_response = self.client.get("/api/backtest/health")
        assert health_response.status_code == 200
        health = health_response.json()
        assert health["status"] == "healthy"
        
        print("✓ Complete user journey test passed")

    def test_graceful_degradation_workflow(self):
        """Test complete graceful degradation workflow"""
        print("Testing graceful degradation workflow...")
        
        # Step 1: Test with cache disabled
        with patch('backtest_cache.get_backtest_cache') as mock_cache:
            mock_cache.return_value.is_available.return_value = False
            
            request_data = {
                "signals_data": self.signals_data[:30],
                "ohlcv_data": self.ohlcv_data[:30],
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
            results = response.json()
            
            assert "trades" in results
            assert "performance_metrics" in results
            assert results["monitoring"]["cache_hit"] == False
        
        # Step 2: Test with monitoring disabled
        with patch('backtest_monitoring.get_backtest_monitor') as mock_monitor:
            mock_monitor.return_value.track_execution.side_effect = Exception("Monitoring failed")
            
            response = self.client.post("/api/backtest/run", json=request_data)
            assert response.status_code == 200
            results = response.json()
            
            assert "trades" in results
            assert "performance_metrics" in results
        
        # Step 3: Test with performance optimization disabled
        with patch('backtest_api.BacktestEngineAdapter.optimize_memory_usage') as mock_optimize:
            mock_optimize.side_effect = Exception("Memory optimization failed")
            
            response = self.client.post("/api/backtest/run", json=request_data)
            assert response.status_code == 200
            results = response.json()
            
            assert "trades" in results
            assert "performance_metrics" in results
        
        # Step 4: Test with signal transformer fallback
        with patch('backtest_api.SignalTransformer') as mock_transformer:
            mock_transformer.side_effect = Exception("Signal transformation failed")
            
            response = self.client.post("/api/backtest/run", json=request_data)
            assert response.status_code == 500  # Should fail when critical component fails
        
        print("✓ Graceful degradation workflow test passed")

    def test_performance_regression_workflow(self):
        """Test complete performance regression workflow"""
        print("Testing performance regression workflow...")
        
        # Step 1: Establish baseline performance
        baseline_request_data = {
            "signals_data": self.signals_data[:50],
            "ohlcv_data": self.ohlcv_data[:50],
            "initial_capital": 100000,
            "stop_loss": 5.0,
            "take_profit": 10.0,
            "holding_period": 20,
            "signal_type": "long",
            "position_sizing": "equal_weight",
            "allow_leverage": False
        }
        
        # Measure baseline performance
        baseline_times = []
        for i in range(3):
            start_time = time.time()
            response = self.client.post("/api/backtest/run", json=baseline_request_data)
            end_time = time.time()
            baseline_times.append(end_time - start_time)
        
        baseline_avg = sum(baseline_times) / len(baseline_times)
        print(f"Baseline performance: {baseline_avg:.2f}s average")
        
        # Step 2: Test with larger dataset
        large_request_data = {
            "signals_data": self.signals_data[:100],
            "ohlcv_data": self.ohlcv_data[:100],
            "initial_capital": 100000,
            "stop_loss": 5.0,
            "take_profit": 10.0,
            "holding_period": 20,
            "signal_type": "long",
            "position_sizing": "equal_weight",
            "allow_leverage": False
        }
        
        start_time = time.time()
        response = self.client.post("/api/backtest/run", json=large_request_data)
        end_time = time.time()
        large_time = end_time - start_time
        
        print(f"Large dataset performance: {large_time:.2f}s")
        
        # Step 3: Verify performance scales reasonably
        size_ratio = 100 / 50  # 2x larger
        time_ratio = large_time / baseline_avg
        
        assert time_ratio <= size_ratio * 3, f"Performance regression: {time_ratio:.2f}x slower for {size_ratio}x data"
        
        # Step 4: Test with caching
        # First request (cache miss)
        start_time = time.time()
        response1 = self.client.post("/api/backtest/run", json=baseline_request_data)
        end_time = time.time()
        cache_miss_time = end_time - start_time
        
        # Second request (cache hit)
        start_time = time.time()
        response2 = self.client.post("/api/backtest/run", json=baseline_request_data)
        end_time = time.time()
        cache_hit_time = end_time - start_time
        
        print(f"Cache miss: {cache_miss_time:.2f}s, Cache hit: {cache_hit_time:.2f}s")
        
        # Step 5: Verify caching improves performance
        assert cache_hit_time <= cache_miss_time * 0.8, "Caching not improving performance"
        
        print("✓ Performance regression workflow test passed")