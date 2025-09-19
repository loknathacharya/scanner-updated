#!/usr/bin/env python3
"""
Comprehensive test to verify the complete React frontend and FastAPI backend integration
"""

import requests
import json
import time
from datetime import datetime

# Base URL for the API
BASE_URL = "http://localhost:8000"

def test_frontend_accessibility():
    """Test if the React frontend is accessible"""
    print("Testing React frontend accessibility...")
    try:
        response = requests.get("http://localhost:3000/")
        if response.status_code == 200:
            print("✅ React frontend is accessible")
            return True
        else:
            print(f"❌ React frontend returned status code {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to React frontend")
        return False
    except Exception as e:
        print(f"❌ Error testing React frontend: {str(e)}")
        return False

def test_backend_root():
    """Test the backend root endpoint"""
    print("Testing backend root endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/")
        if response.status_code == 200 and "message" in response.json():
            print("✅ Backend root endpoint is working")
            return True
        else:
            print(f"❌ Backend root endpoint returned unexpected response: {response.text}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to backend")
        return False
    except Exception as e:
        print(f"❌ Error testing backend root: {str(e)}")
        return False

def test_complete_workflow():
    """Test the complete workflow from file upload to filtering"""
    print("Testing complete workflow...")
    
    try:
        # Step 1: Upload test data
        print("  1. Uploading test data...")
        with open('test_data.csv', 'rb') as f:
            files = {'file': ('test_data.csv', f, 'text/csv')}
            response = requests.post(f"{BASE_URL}/api/upload", files=files)
        
        if response.status_code != 200:
            print(f"  ❌ Upload failed with status {response.status_code}: {response.text}")
            return False
            
        print("  ✅ Data uploaded successfully")
        
        # Step 2: Get data summary
        print("  2. Getting data summary...")
        response = requests.get(f"{BASE_URL}/api/data/summary")
        if response.status_code != 200:
            print(f"  ❌ Data summary failed with status {response.status_code}: {response.text}")
            return False
            
        summary = response.json()
        print(f"  ✅ Data summary retrieved ({summary['shape'][0]} records)")
        
        # Step 3: Apply a simple filter
        print("  3. Applying simple filter...")
        filter_request = {
            "filter": "close > 1000",
            "date_range": None
        }
        response = requests.post(f"{BASE_URL}/api/filters/apply", json=filter_request)
        if response.status_code != 200:
            print(f"  ❌ Simple filter failed with status {response.status_code}: {response.text}")
            return False
            
        filter_result = response.json()
        print(f" ✅ Simple filter applied ({len(filter_result['results'])} results)")
        
        # Step 4: Apply a JSON filter
        print("  4. Applying JSON filter...")
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
                            "value": 10
                        }
                    }
                ]
            },
            "date_range": None
        }
        response = requests.post(f"{BASE_URL}/api/filters/apply", json=json_filter)
        if response.status_code != 200:
            print(f"  ❌ JSON filter failed with status {response.status_code}: {response.text}")
            return False
            
        json_filter_result = response.json()
        print(f"  ✅ JSON filter applied ({len(json_filter_result['results'])} results)")
        
        # Step 5: Save a filter
        print("  5. Saving a filter...")
        save_filter_request = {
            "name": "comprehensive_test_filter",
            "filter": "close > 150"
        }
        response = requests.post(f"{BASE_URL}/api/filters/saved", json=save_filter_request)
        if response.status_code != 200:
            print(f"  ❌ Save filter failed with status {response.status_code}: {response.text}")
            return False
            
        print("  ✅ Filter saved successfully")
        
        # Step 6: Get saved filters
        print("  6. Getting saved filters...")
        response = requests.get(f"{BASE_URL}/api/filters/saved")
        if response.status_code != 200:
            print(f"  ❌ Get saved filters failed with status {response.status_code}: {response.text}")
            return False
            
        saved_filters = response.json()
        if "comprehensive_test_filter" not in saved_filters["saved_filters"]:
            print("  ❌ Saved filter not found in retrieved filters")
            return False
            
        print("  ✅ Saved filters retrieved successfully")
        
        # Step 7: Delete the saved filter
        print("  7. Deleting the saved filter...")
        response = requests.delete(f"{BASE_URL}/api/filters/saved/comprehensive_test_filter")
        if response.status_code != 200:
            print(f"  ❌ Delete filter failed with status {response.status_code}: {response.text}")
            return False
            
        print("  ✅ Filter deleted successfully")
        
        print("✅ Complete workflow test passed")
        return True
        
    except FileNotFoundError:
        print("❌ test_data.csv not found")
        return False
    except Exception as e:
        print(f"❌ Error during workflow test: {str(e)}")
        return False

def main():
    print("=== Comprehensive Integration Test ===")
    print(f"Testing at {datetime.now()}")
    print()
    
    # Test individual components
    frontend_ok = test_frontend_accessibility()
    backend_ok = test_backend_root()
    
    # Test complete workflow
    workflow_ok = False
    if frontend_ok and backend_ok:
        workflow_ok = test_complete_workflow()
    
    print()
    print("=== Test Results ===")
    print(f"Frontend accessibility: {'✅ PASS' if frontend_ok else '❌ FAIL'}")
    print(f"Backend root endpoint: {'✅ PASS' if backend_ok else '❌ FAIL'}")
    print(f"Complete workflow: {'✅ PASS' if workflow_ok else '❌ FAIL'}")
    
    if frontend_ok and backend_ok and workflow_ok:
        print()
        print("🎉 All tests passed! The React frontend and FastAPI backend are successfully integrated.")
        return True
    else:
        print()
        print("❌ Some tests failed. Please check the output above for details.")
        return False

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)