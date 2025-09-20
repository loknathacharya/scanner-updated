import requests
import json

# Test the API to see the actual response format
url = "http://127.0.0.1:8000/api/backtest/run"

# Simple test data
data = {
    "signals_data": [
        {"symbol": "AAPL", "date": "2024-01-01"},
        {"symbol": "AAPL", "date": "2024-01-02"}
    ],
    "ohlcv_data": [
        {"symbol": "AAPL", "date": "2024-01-01", "open": 150, "high": 155, "low": 149, "close": 154, "volume": 1000000},
        {"symbol": "AAPL", "date": "2024-01-02", "open": 154, "high": 158, "low": 153, "close": 157, "volume": 1200000}
    ]
}

try:
    response = requests.post(url, json=data)
    print(f"Status Code: {response.status_code}")
    print(f"Response Headers: {dict(response.headers)}")
    
    if response.status_code == 200:
        result = response.json()
        print("\n=== FULL RESPONSE ===")
        print(json.dumps(result, indent=2, default=str))
        
        print("\n=== PERFORMANCE METRICS ===")
        if 'performance_metrics' in result:
            metrics = result['performance_metrics']
            for key, value in metrics.items():
                print(f"{key}: {value}")
        else:
            print("No performance_metrics key found")
            
        print("\n=== TRADES ===")
        if 'trades' in result:
            trades = result['trades']
            print(f"Number of trades: {len(trades)}")
            if trades:
                print("First trade:")
                for key, value in trades[0].items():
                    print(f"  {key}: {value}")
        else:
            print("No trades key found")
            
    else:
        print(f"Error: {response.text}")
        
except Exception as e:
    print(f"Exception occurred: {e}")