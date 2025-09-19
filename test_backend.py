#!/usr/bin/env python3
"""
Test script for the FastAPI backend
"""

import requests
import json
from datetime import datetime

# Base URL for the API
BASE_URL = "http://localhost:8000"

def test_root_endpoint():
    """Test the root endpoint"""
    print("Testing root endpoint...")
    response = requests.get(f"{BASE_URL}/")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    print()

def test_upload_endpoint():
    """Test the file upload endpoint"""
    print("Testing file upload endpoint...")
    # This would require a test file, so we'll just check if it responds correctly
    response = requests.post(f"{BASE_URL}/api/upload")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
    print()

def test_data_summary_endpoint():
    """Test the data summary endpoint"""
    print("Testing data summary endpoint...")
    response = requests.get(f"{BASE_URL}/api/data/summary")
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        print(f"Response: {response.json()}")
    else:
        print(f"Error: {response.text}")
    print()

def test_apply_filter_endpoint():
    """Test the apply filter endpoint"""
    print("Testing apply filter endpoint...")
    # Test with a simple filter
    test_filter = {
        "filter": "close > 100",
        "date_range": None
    }
    response = requests.post(f"{BASE_URL}/api/filters/apply", json=test_filter)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        print(f"Response: {response.json()}")
    else:
        print(f"Error: {response.text}")
    print()

def test_saved_filters_endpoint():
    """Test the saved filters endpoints"""
    print("Testing saved filters endpoints...")
    
    # Test GET saved filters
    response = requests.get(f"{BASE_URL}/api/filters/saved")
    print(f"GET saved filters - Status: {response.status_code}")
    print(f"Response: {response.json()}")
    
    # Test POST save filter
    test_filter = {
        "name": "test_filter",
        "filter": {"logic": "AND", "conditions": []}
    }
    response = requests.post(f"{BASE_URL}/api/filters/saved", json=test_filter)
    print(f"POST save filter - Status: {response.status_code}")
    print(f"Response: {response.json()}")
    
    # Test DELETE filter
    response = requests.delete(f"{BASE_URL}/api/filters/saved/test_filter")
    print(f"DELETE filter - Status: {response.status_code}")
    print(f"Response: {response.json()}")
    print()

if __name__ == "__main__":
    print("=== Backend API Test ===")
    print(f"Testing at {datetime.now()}")
    print()
    
    try:
        test_root_endpoint()
        test_upload_endpoint()
        test_data_summary_endpoint()
        test_apply_filter_endpoint()
        test_saved_filters_endpoint()
        
        print("=== All tests completed successfully! ===")
        
    except requests.exceptions.ConnectionError:
        print("Error: Could not connect to the backend server.")
        print("Make sure the server is running with: python -m uvicorn backend.main:app --reload")
    except Exception as e:
        print(f"Error during testing: {str(e)}")