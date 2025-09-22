import requests
import json

# Test the chart API
try:
    response = requests.get('http://localhost:8000/api/charts/AAPL/ohlcv?timeframe=1D&limit=10')
    if response.status_code == 200:
        data = response.json()
        print("API Response:")
        print(json.dumps(data, indent=2))

        # Check the data structure
        if 'data' in data:
            print(f"\nData points: {len(data['data'])}")
            if len(data['data']) > 0:
                print("First data point:")
                print(json.dumps(data['data'][0], indent=2))
                print("Last data point:")
                print(json.dumps(data['data'][-1], indent=2))
        else:
            print("No 'data' field in response")
    else:
        print(f"API Error: {response.status_code}")
        print(response.text)
except Exception as e:
    print(f"Connection error: {e}")