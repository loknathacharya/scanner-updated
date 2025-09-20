import requests
import json

# Test the actual API response format with data that should generate trades
url = "http://127.0.0.1:8000/api/backtest/run"

# Sample data that should generate trades - need more price data after signal
sample_data = {
    "signals_data": [
        {
            "symbol": "RELIANCE",
            "date": "2023-01-03"  # Signal on day 3, so we have days 4-7 for holding period
        }
    ],
    "ohlcv_data": [
        # Day 1-2: Before signal
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
        },
        # Signal day
        {
            "symbol": "RELIANCE",
            "date": "2023-01-03",
            "open": 2550.0,
            "high": 2600.0,
            "low": 2540.0,
            "close": 2580.0,
            "volume": 1200000
        },
        # Days after signal for holding period (5 days = need until 2023-01-08)
        {
            "symbol": "RELIANCE",
            "date": "2023-01-04",
            "open": 2580.0,
            "high": 2650.0,
            "low": 2570.0,
            "close": 2620.0,
            "volume": 1300000
        },
        {
            "symbol": "RELIANCE",
            "date": "2023-01-05",
            "open": 2620.0,
            "high": 2700.0,
            "low": 2610.0,
            "close": 2680.0,
            "volume": 1400000
        },
        {
            "symbol": "RELIANCE",
            "date": "2023-01-06",
            "open": 2680.0,
            "high": 2750.0,
            "low": 2670.0,
            "close": 2720.0,
            "volume": 1500000
        },
        {
            "symbol": "RELIANCE",
            "date": "2023-01-07",
            "open": 2720.0,
            "high": 2800.0,
            "low": 2710.0,
            "close": 2780.0,
            "volume": 1600000
        },
        # Add one more day to cover the 5-day holding period
        {
            "symbol": "RELIANCE",
            "date": "2023-01-08",
            "open": 2780.0,
            "high": 2850.0,
            "low": 2770.0,
            "close": 2820.0,
            "volume": 1700000
        }
    ],
    "initial_capital": 100000,
    "stop_loss": 5.0,
    "take_profit": 10.0,
    "holding_period": 5,  # 5 day hold
    "signal_type": "long",
    "position_sizing": "equal_weight",
    "allow_leverage": False,
    "risk_management": {}
}

print("Testing API with data that should generate trades...")
print(f"URL: {url}")
print(f"Signal date: {sample_data['signals_data'][0]['date']}")
print(f"Price data available: {len(sample_data['ohlcv_data'])} days")
print(f"Holding period: {sample_data['holding_period']} days")

try:
    response = requests.post(url, json=sample_data, timeout=30)
    print(f"\nStatus Code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        
        print("\n=== API Response Keys ===")
        print(f"Top-level keys: {list(data.keys())}")
        
        if 'performance_metrics' in data and data['performance_metrics']:
            print(f"\n=== Performance Metrics Keys ===")
            print(f"Performance metrics keys: {list(data['performance_metrics'].keys())}")
            
            print(f"\n=== Sample Performance Metrics ===")
            for key, value in data['performance_metrics'].items():
                print(f"{key}: {value}")
        else:
            print(f"\n=== Performance Metrics ===")
            print("No performance metrics returned (empty or None)")
        
        print(f"\n=== Trades Data ===")
        print(f"Number of trades: {len(data.get('trades', []))}")
        
        if data.get('trades'):
            print(f"First trade keys: {list(data['trades'][0].keys()) if data['trades'] else 'No trades'}")
            print(f"Sample trade: {data['trades'][0] if data['trades'] else 'No trades'}")
        
        print(f"\n=== Summary Data ===")
        print(f"Summary: {data.get('summary', {})}")
        
        print(f"\n=== Execution Info ===")
        print(f"Execution time: {data.get('execution_time', 0)} seconds")
        print(f"Signals processed: {data.get('signals_processed', 0)}")
        
    else:
        print(f"Error: {response.text}")
        
except requests.exceptions.RequestException as e:
    print(f"Request failed: {e}")
except Exception as e:
    print(f"Unexpected error: {e}")