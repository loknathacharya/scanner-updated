#!/usr/bin/env python3
"""
Integration test for the complete frontend-backend data flow
"""

import requests
import json
from datetime import datetime

# Base URL for the API
BASE_URL = "http://localhost:8000"

def test_complete_flow():
    """Test the complete data flow from upload to filtering"""
    print("=== Integration Test: Complete Data Flow ===")
    print(f"Testing at {datetime.now()}")
    print()
    
    try:
        # Step 1: Upload test data
        print("Step 1: Uploading test data...")
        with open('test_data.csv', 'rb') as f:
            files = {'file': ('test_data.csv', f, 'text/csv')}
            response = requests.post(f"{BASE_URL}/api/upload", files=files)
        
        print(f"Upload Status: {response.status_code}")
        if response.status_code != 200:
            print(f"Upload Error: {response.text}")
            return
            
        upload_response = response.json()
        print(f"Upload Response: {upload_response}")
        print()
        
        # Step 2: Get data summary
        print("Step 2: Getting data summary...")
        response = requests.get(f"{BASE_URL}/api/data/summary")
        print(f"Summary Status: {response.status_code}")
        if response.status_code == 200:
            summary_response = response.json()
            print(f"Summary Response: {summary_response}")
        else:
            print(f"Summary Error: {response.text}")
        print()
        
        # Step 3: Apply a simple filter
        print("Step 3: Applying filter (close > 1000)...")
        filter_request = {
            "filter": "close > 1000",
            "date_range": None
        }
        response = requests.post(f"{BASE_URL}/api/filters/apply", json=filter_request)
        print(f"Filter Status: {response.status_code}")
        if response.status_code == 200:
            filter_response = response.json()
            print(f"Filter Response: {filter_response}")
            print(f"Number of results: {len(filter_response.get('results', []))}")
        else:
            print(f"Filter Error: {response.text}")
        print()
        
        # Step 4: Apply a JSON filter
        print("Step 4: Applying JSON filter...")
        json_filter = {
            "filter": {
                "logic": "AND",
                "conditions": [
                    {
                        "left": {
                            "type": "column",
                            "name": "close"
                        },
                        "operator": ">",
                        "right": {
                            "type": "constant",
                            "value": 100
                        }
                    }
                ]
            },
            "date_range": None
        }
        response = requests.post(f"{BASE_URL}/api/filters/apply", json=json_filter)
        print(f"JSON Filter Status: {response.status_code}")
        if response.status_code == 200:
            json_filter_response = response.json()
            print(f"JSON Filter Response: {json_filter_response}")
            print(f"Number of results: {len(json_filter_response.get('results', []))}")
        else:
            print(f"JSON Filter Error: {response.text}")
        print()
        
        # Step 5: Save a filter
        print("Step 5: Saving a filter...")
        save_filter_request = {
            "name": "integration_test_filter",
            "filter": "close > 150"
        }
        response = requests.post(f"{BASE_URL}/api/filters/saved", json=save_filter_request)
        print(f"Save Filter Status: {response.status_code}")
        if response.status_code == 200:
            save_response = response.json()
            print(f"Save Filter Response: {save_response}")
        else:
            print(f"Save Filter Error: {response.text}")
        print()
        
        # Step 6: Get saved filters
        print("Step 6: Getting saved filters...")
        response = requests.get(f"{BASE_URL}/api/filters/saved")
        print(f"Get Saved Filters Status: {response.status_code}")
        if response.status_code == 200:
            saved_filters_response = response.json()
            print(f"Saved Filters Response: {saved_filters_response}")
        else:
            print(f"Get Saved Filters Error: {response.text}")
        print()
        
        # Step 7: Delete the saved filter
        print("Step 7: Deleting the saved filter...")
        response = requests.delete(f"{BASE_URL}/api/filters/saved/integration_test_filter")
        print(f"Delete Filter Status: {response.status_code}")
        if response.status_code == 200:
            delete_response = response.json()
            print(f"Delete Filter Response: {delete_response}")
        else:
            print(f"Delete Filter Error: {response.text}")
        print()
        
        print("=== Integration test completed successfully! ===")
        
    except requests.exceptions.ConnectionError:
        print("Error: Could not connect to the backend server.")
        print("Make sure the server is running with: python -m uvicorn backend.main:app --reload")
    except FileNotFoundError:
        print("Error: test_data.csv not found. Please run this script from the correct directory.")
    except Exception as e:
        print(f"Error during integration test: {str(e)}")

if __name__ == "__main__":
    test_complete_flow()