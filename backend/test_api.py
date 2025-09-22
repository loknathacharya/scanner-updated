import requests
import json

# Test the optimization endpoint with the same data from the frontend
signals_data = [
    {
        'date': '2025-04-30 00:00:00+05:30',
        'symbol': 'AARTIIND',
        'open': 430,
        'high': 430.6499938964844,
        'low': 418.6000061035156,
        'close': 421.25,
        'volume': 724695
    }
]

ohlcv_data = [
    {
        'symbol': 'AARTIIND',
        'date': '2025-04-30 00:00:00+05:30',
        'open': 430,
        'high': 430.6499938964844,
        'low': 418.6000061035156,
        'close': 421.25,
        'volume': 724695
    }
]

param_ranges = {
    'holding_period': [5, 10, 15, 20, 25, 30, 35, 40, 45, 50],
    'stop_loss': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    'take_profit': [None, 5, 10, 15, 20, 25, 30]
}

request_data = {
    'signals_data': signals_data,
    'ohlcv_data': ohlcv_data,
    'param_ranges': param_ranges
}

try:
    response = requests.post('http://localhost:8000/api/backtest/optimize', json=request_data)
    print(f'Status Code: {response.status_code}')
    print(f'Headers: {dict(response.headers)}')
    if response.status_code == 200:
        result = response.json()
        print(f'Success! Best params: {result["best_params"]}')
        print(f'Execution time: {result["execution_time"]} seconds')
    else:
        print(f'Error response: {response.text}')
except Exception as e:
    print(f'Error: {e}')