#!/usr/bin/env python3
"""
Debug script to test optimization API request format
"""
import requests
import json
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

def create_test_data():
    """Create test data for debugging"""
    # Create sample signals data
    signals_data = pd.DataFrame({
        'Ticker': ['RELIANCE', 'TCS', 'INFY', 'HDFC', 'ICICIBANK'] * 10,
        'Date': pd.date_range('2023-01-01', periods=50, freq='D').strftime('%Y-%m-%d').tolist(),
        'symbol': ['RELIANCE', 'TCS', 'INFY', 'HDFC', 'ICICIBANK'] * 10,
        'date': pd.date_range('2023-01-01', periods=50, freq='D').strftime('%Y-%m-%d').tolist()
    })

    # Create sample OHLCV data
    base_date = datetime(2023, 1, 1)
    ohlcv_data = []

    for i in range(50):
        for ticker in ['RELIANCE', 'TCS', 'INFY', 'HDFC', 'ICICIBANK']:
            date = base_date + timedelta(days=i)
            base_price = {'RELIANCE': 2500, 'TCS': 3200, 'INFY': 1400, 'HDFC': 1600, 'ICICIBANK': 900}[ticker]

            ohlcv_data.append({
                'Ticker': ticker,
                'Date': date.strftime('%Y-%m-%d'),
                'Open': base_price * (0.95 + np.random.random() * 0.1),
                'High': base_price * (1.0 + np.random.random() * 0.1),
                'Low': base_price * (0.9 + np.random.random() * 0.1),
                'Close': base_price * (0.95 + np.random.random() * 0.1),
                'Volume': np.random.randint(100000, 1000000),
                'symbol': ticker,
                'date': date.strftime('%Y-%m-%d')
            })

    ohlcv_df = pd.DataFrame(ohlcv_data)

    return signals_data, ohlcv_df

def test_optimization_request():
    """Test the optimization API request format"""
    print("=== TESTING OPTIMIZATION API REQUEST ===")

    # Create test data
    signals_data, ohlcv_data = create_test_data()

    # Test request data
    request_data = {
        "signals_data": signals_data.to_dict('records'),
        "ohlcv_data": ohlcv_data.to_dict('records'),
        "initial_capital": 100000,
        "stop_loss": 5.0,
        "take_profit": None,
        "holding_period": 20,
        "signal_type": "long",
        "position_sizing": "equal_weight",
        "allow_leverage": False
    }

    # Test parameter ranges
    param_ranges = {
        "holding_periods": [5, 10, 15, 20],
        "stop_losses": [2.0, 5.0, 8.0, 10.0],
        "take_profits": [None, 10.0, 15.0, 20.0]
    }

    print("Request Data Keys:", list(request_data.keys()))
    print("Signals Data Shape:", len(request_data['signals_data']))
    print("OHLCV Data Shape:", len(request_data['ohlcv_data']))
    print("Param Ranges:", param_ranges)

    # Test the API call
    try:
        print("\n=== MAKING API REQUEST ===")
        response = requests.post(
            "http://localhost:8000/api/backtest/optimize",
            json={
                "signals_data": signals_data.to_dict('records'),
                "ohlcv_data": ohlcv_data.to_dict('records'),
                "initial_capital": 100000,
                "stop_loss": 5.0,
                "take_profit": None,
                "holding_period": 20,
                "signal_type": "long",
                "position_sizing": "equal_weight",
                "allow_leverage": False,
                "param_ranges": param_ranges,
                "use_multiprocessing": True,
                "use_vectorized": True,
                "max_workers": None
            },
            timeout=30
        )

        print(f"Response Status: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")

        if response.status_code == 200:
            print("✅ SUCCESS!")
            result = response.json()
            print(f"Result Keys: {list(result.keys()) if isinstance(result, dict) else 'Not a dict'}")
            if isinstance(result, dict) and 'results' in result:
                print(f"Number of results: {len(result['results'])}")
        else:
            print("❌ ERROR!")
            print(f"Response Text: {response.text}")

    except requests.exceptions.ConnectionError:
        print("❌ Connection Error - Is the backend running on port 8000?")
    except requests.exceptions.Timeout:
        print("❌ Timeout Error - Request took too long")
    except Exception as e:
        print(f"❌ Unexpected Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_optimization_request()