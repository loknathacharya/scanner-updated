#!/usr/bin/env python3
"""
Test script to simulate FastAPI file upload process
"""

import sys
import os
import time
import pandas as pd
import numpy as np
from fastapi import UploadFile
import io

# Add backend directory to path
sys.path.append('backend')

def create_large_test_data(rows=50000, symbols=100):
    """Create larger test data to stress test the system"""
    print(f"Creating large test data with {rows} rows and {symbols} symbols")
    
    # Generate test data
    dates = pd.date_range('2023-01-01', periods=rows//symbols, freq='D')
    symbols_list = [f'STOCK{i:03d}' for i in range(symbols)]
    
    data = []
    for symbol in symbols_list:
        symbol_data = []
        for date in dates:
            # Generate realistic price data
            base_price = np.random.uniform(50, 500)
            open_price = base_price * np.random.uniform(0.98, 1.02)
            high_price = open_price * np.random.uniform(1.0, 1.05)
            low_price = open_price * np.random.uniform(0.95, 1.0)
            close_price = low_price + np.random.uniform(0, high_price - low_price)
            volume = np.random.randint(10000, 1000000)
            
            symbol_data.append({
                'date': date,
                'symbol': symbol,
                'open': open_price,
                'high': high_price,
                'low': low_price,
                'close': close_price,
                'volume': volume
            })
        data.extend(symbol_data)
    
    df = pd.DataFrame(data)
    print(f"Created test data with shape: {df.shape}")
    return df

def test_fastapi_upload_simulation():
    """Test the actual FastAPI upload process"""
    print("\n=== Testing FastAPI Upload Simulation ===")
    
    try:
        from utils_module import DataProcessor
        processor = DataProcessor()
        
        # Create larger test data
        test_df = create_large_test_data(50000, 100)
        
        # Save to CSV for testing
        test_file = 'test_large_upload.csv'
        test_df.to_csv(test_file, index=False)
        print(f"Saved large test data to {test_file} ({os.path.getsize(test_file)/1024/1024:.2f}MB)")
        
        # Create a FastAPI UploadFile object
        class FastAPIUploadFile:
            def __init__(self, filename, content):
                self.filename = filename
                self.file = io.BytesIO(content)
                self.content_type = "text/csv"
            
            def seek(self, pos):
                self.file.seek(pos)
            
            def read(self, size=-1):
                return self.file.read(size)
            
            def close(self):
                self.file.close()
        
        # Read file content
        with open(test_file, 'rb') as f:
            file_content = f.read()
        
        # Create FastAPI upload file
        upload_file = FastAPIUploadFile(test_file, file_content)
        
        print("Starting FastAPI upload simulation...")
        start_time = time.time()
        
        # Test the actual upload process
        loaded_df = processor.load_file(upload_file, test_file)
        
        # Test column detection
        detected_cols = processor.detect_columns(loaded_df)
        
        # Test full processing
        processed_df = processor.process_data(
            loaded_df, 
            detected_cols['date'], 
            detected_cols['symbol'], 
            detected_cols, 
            calculate_indicators=False
        )
        
        end_time = time.time()
        
        print(f"FastAPI upload simulation completed in {end_time - start_time:.2f}s")
        print(f"Final processed data shape: {processed_df.shape}")
        
        # Clean up
        upload_file.close()
        os.remove(test_file)
        
        return processed_df
        
    except Exception as e:
        print(f"FastAPI upload simulation failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return None

def test_problematic_file_formats():
    """Test different file formats that might cause issues"""
    print("\n=== Testing Problematic File Formats ===")
    
    try:
        from utils_module import DataProcessor
        processor = DataProcessor()
        
        # Create test data
        test_df = create_large_test_data(10000, 50)
        
        formats_to_test = ['csv', 'xlsx', 'parquet']
        
        for file_format in formats_to_test:
            print(f"\n--- Testing {file_format.upper()} format ---")
            
            test_file = f'test_upload.{file_format}'
            
            try:
                # Save in different formats
                if file_format == 'csv':
                    test_df.to_csv(test_file, index=False)
                elif file_format == 'xlsx':
                    test_df.to_excel(test_file, index=False)
                elif file_format == 'parquet':
                    test_df.to_parquet(test_file, index=False)
                
                print(f"Saved test data to {test_file} ({os.path.getsize(test_file)/1024/1024:.2f}MB)")
                
                # Create FastAPI upload file
                class FastAPIUploadFile:
                    def __init__(self, filename, content):
                        self.filename = filename
                        self.file = io.BytesIO(content)
                        self.content_type = f"application/{file_format}"
                    
                    def seek(self, pos):
                        self.file.seek(pos)
                    
                    def read(self, size=-1):
                        return self.file.read(size)
                    
                    def close(self):
                        self.file.close()
                
                # Read file content
                with open(test_file, 'rb') as f:
                    file_content = f.read()
                
                upload_file = FastAPIUploadFile(test_file, file_content)
                
                # Test loading
                format_start = time.time()
                loaded_df = processor.load_file(upload_file, test_file)
                format_end = time.time()
                
                print(f"{file_format.upper()} loading completed in {format_end - format_start:.2f}s")
                print(f"Loaded data shape: {loaded_df.shape}")
                
                upload_file.close()
                os.remove(test_file)
                
            except Exception as e:
                print(f"{file_format.upper()} format test failed: {str(e)}")
                if os.path.exists(test_file):
                    os.remove(test_file)
        
    except Exception as e:
        print(f"File format testing failed: {str(e)}")
        import traceback
        traceback.print_exc()

def test_edge_cases():
    """Test edge cases that might cause hanging"""
    print("\n=== Testing Edge Cases ===")
    
    try:
        from utils_module import DataProcessor
        processor = DataProcessor()
        
        # Test 1: Data with problematic date formats
        print("\n--- Test 1: Problematic date formats ---")
        problematic_dates = [
            '2023/01/01', '01-01-2023', '2023.01.01', 'Jan 1, 2023',
            '01/01/23', '20230101', 'invalid_date', '', None
        ]
        
        test_data = pd.DataFrame({
            'date': problematic_dates * 100,
            'symbol': ['TEST'] * len(problematic_dates),
            'open': [100.0] * len(problematic_dates),
            'high': [105.0] * len(problematic_dates),
            'low': [95.0] * len(problematic_dates),
            'close': [102.0] * len(problematic_dates),
            'volume': [100000] * len(problematic_dates)
        })
        
        print("Testing date processing with problematic formats...")
        date_start = time.time()
        processed_dates = processor._process_date_column(test_data['date'])
        date_end = time.time()
        
        print(f"Date processing completed in {date_end - date_start:.2f}s")
        print(f"Non-null dates: {processed_dates.notna().sum()}/{len(processed_dates)}")
        
        # Test 2: Data with mixed data types
        print("\n--- Test 2: Mixed data types ---")
        mixed_data = pd.DataFrame({
            'date': pd.date_range('2023-01-01', periods=1000),
            'symbol': [f'STOCK{i%10}' for i in range(1000)],
            'open': [100.0 if i % 2 == 0 else '100.0' for i in range(1000)],
            'high': [105.0 if i % 3 == 0 else '105.0' for i in range(1000)],
            'low': [95.0 if i % 5 == 0 else '95.0' for i in range(1000)],
            'close': [102.0 if i % 7 == 0 else '102.0' for i in range(1000)],
            'volume': [100000] * 1000
        })
        
        print("Testing processing with mixed data types...")
        mixed_start = time.time()
        detected_cols = processor.detect_columns(mixed_data)
        processed_mixed = processor.process_data(
            mixed_data, 
            detected_cols['date'], 
            detected_cols['symbol'], 
            detected_cols, 
            calculate_indicators=False
        )
        mixed_end = time.time()
        
        print(f"Mixed data processing completed in {mixed_end - mixed_start:.2f}s")
        print(f"Processed data shape: {processed_mixed.shape}")
        
    except Exception as e:
        print(f"Edge case testing failed: {str(e)}")
        import traceback
        traceback.print_exc()

def main():
    """Run all FastAPI upload tests"""
    print("Starting FastAPI upload debugging...")
    print("=" * 60)
    
    test_fastapi_upload_simulation()
    test_problematic_file_formats()
    test_edge_cases()
    
    print("\n" + "=" * 60)
    print("FastAPI upload debugging completed.")

if __name__ == "__main__":
    main()