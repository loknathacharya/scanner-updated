import requests
import json

url = 'http://127.0.0.1:8000/api/backtest/run'
data = {
    'ohlcv_data': [
        {'symbol': 'AAPL', 'date': '2024-01-01', 'open': 150, 'high': 155, 'low': 149, 'close': 154, 'volume': 1000000},
        {'symbol': 'AAPL', 'date': '2024-01-02', 'open': 154, 'high': 158, 'low': 153, 'close': 157, 'volume': 1200000},
        {'symbol': 'AAPL', 'date': '2024-01-03', 'open': 157, 'high': 160, 'low': 156, 'close': 159, 'volume': 1100000}
    ],
    'signals_data': [
        {'symbol': 'AAPL', 'date': '2024-01-01'},
        {'symbol': 'AAPL', 'date': '2024-01-02'}
    ],
    'holding_period': 1,
    'stop_loss_pct': 2.0,
    'take_profit_pct': 5.0,
    'initial_capital': 100000,
    'sizing_method': 'equal_weight',
    'signal_type': 'long',
    'allow_leverage': False
}

try:
    response = requests.post(url, json=data)
    print(f'Status Code: {response.status_code}')
    print(f'Response: {response.text}')
    
    if response.status_code == 200:
        response_data = response.json()
        print(f'Trades count: {len(response_data.get("trades", []))}')
        print(f'Performance metrics: {response_data.get("performance_metrics", {})}')
except Exception as e:
    print(f'Error: {e}')