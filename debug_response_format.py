import requests
import json

# Test the actual API response format
url = "http://127.0.0.1:8000/api/backtest/run"

# Sample data that matches the expected format
sample_data = {
    "signals_data": [
        {
            "symbol": "RELIANCE",
            "date": "2023-01-01"
        }
    ],
    "ohlcv_data": [
        {
            "symbol": "RELIANCE",
            "date": "2023-01-01",
            "open": 2500.0,
            "high": 2550.0,
            "low": 2480.0,
            "close": 2520.0,
            "volume": 1000000
        },
        {
            "symbol": "RELIANCE",
            "date": "2023-01-02",
            "open": 2520.0,
            "high": 2580.0,
            "low": 2510.0,
            "close": 2550.0,
            "volume": 1100000
        }
    ],
    "initial_capital": 100000,
    "stop_loss": 5.0,
    "take_profit": 10.0,
    "holding_period": 5,
    "signal_type": "long",
    "position_sizing": "equal_weight",
    "allow_leverage": False,
    "risk_management": {}
}

try:
    response = requests.post(url, json=sample_data)
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        print("\n=== API Response Keys ===")
        print("Top-level keys:", list(result.keys()))
        
        if 'performance_metrics' in result:
            print("\n=== Performance Metrics Keys ===")
            perf_keys = list(result['performance_metrics'].keys())
            print("Performance metrics keys:", perf_keys)
            
            print("\n=== Sample Performance Metrics ===")
            for key in perf_keys[:5]:  # Show first 5 keys
                value = result['performance_metrics'].key(key)
                print(f"{key}: {value}")
        else:
            print("\nNo 'performance_metrics' key found in response")
            
        if 'trades' in result:
            print(f"\n=== Trades Data ===")
            print(f"Number of trades: {len(result['trades'])}")
            if result['trades']:
                print("First trade keys:", list(result['trades'][0].keys()))
    else:
        print(f"Error: {response.text}")
        
except Exception as e:
    print(f"Request failed: {e}")