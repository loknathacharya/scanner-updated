#!/usr/bin/env python3
"""
Debug script to test the actual field names returned by the backtest API
"""

import requests
import json

def test_backtest_api():
    """Test the backtest API and examine the response structure"""
    
    # Sample test data
    test_request = {
        "signals_data": [
            {"symbol": "RELIANCE", "date": "2023-01-02"},
            {"symbol": "TCS", "date": "2023-01-03"},
            {"symbol": "INFY", "date": "2023-01-04"}
        ],
        "ohlcv_data": [
            {
                "symbol": "RELIANCE", "date": "2023-01-02",
                "open": 2500.0, "high": 2550.0, "low": 2480.0, "close": 2520.0, "volume": 1000000
            },
            {
                "symbol": "TCS", "date": "2023-01-03", 
                "open": 3200.0, "high": 3250.0, "low": 3180.0, "close": 3220.0, "volume": 800000
            },
            {
                "symbol": "INFY", "date": "2023-01-04",
                "open": 1400.0, "high": 1450.0, "low": 1380.0, "close": 1420.0, "volume": 1200000
            }
        ],
        "initial_capital": 100000,
        "stop_loss": 5.0,
        "take_profit": 10.0,
        "holding_period": 10,
        "signal_type": "long",
        "position_sizing": "equal_weight",
        "allow_leverage": False
    }
    
    try:
        # Make API request
        response = requests.post(
            "http://127.0.0.1:8000/api/backtest/run",
            json=test_request,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            result = response.json()
            
            print("=== API Response Structure ===")
            print(json.dumps(result, indent=2))
            
            print("\n=== Performance Metrics Keys ===")
            if 'performance_metrics' in result:
                metrics = result['performance_metrics']
                print("Available keys in performance_metrics:")
                for key in metrics.keys():
                    print(f"  - '{key}'")
                
                print(f"\nPerformance metrics found: {len(metrics)}")
                
                # Check for specific expected keys
                expected_frontend_keys = ['total_return', 'win_rate', 'sharpe_ratio', 'max_drawdown', 'profit_factor']
                found_frontend_keys = [key for key in expected_frontend_keys if key in metrics]
                
                print(f"\nFrontend-compatible keys found: {found_frontend_keys}")
                print(f"Missing frontend keys: {set(expected_frontend_keys) - set(found_frontend_keys)}")
                
                # Check for descriptive keys that might need mapping
                descriptive_keys = [key for key in metrics.keys() if any(desc in key.lower() for desc in ['return', 'win rate', 'sharpe', 'drawdown', 'profit'])]
                print(f"\nDescriptive keys that might need mapping: {descriptive_keys}")
                
            else:
                print("No 'performance_metrics' key found in response")
                
        else:
            print(f"API request failed with status {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"Error testing API: {e}")

if __name__ == "__main__":
    test_backtest_api()