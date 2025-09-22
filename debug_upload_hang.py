#!/usr/bin/env python3
"""
Debug script to identify where the file upload process hangs
"""

import sys
import os
import time
import pandas as pd
import numpy as np

# Add backend directory to path
sys.path.append('backend')

def create_test_data(rows=1000, symbols=10):
    """Create test data for debugging"""
    print(f"Creating test data with {rows} rows and {symbols} symbols")
    
    # Generate test data
    dates = pd.date_range('2023-01-01', periods=rows//symbols, freq='D')
    symbols_list = [f'STOCK{i:02d}' for i in range(symbols)]
    
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

def test_file_loading():
    """Test file loading functionality"""
    print("\n=== Testing File Loading ===")
    
    try:
        from utils_module import DataProcessor
        processor = DataProcessor()
        
        # Create test data
        test_df = create_test_data(1000, 10)
        
        # Save to CSV for testing
        test_file = 'test_upload.csv'
        test_df.to_csv(test_file, index=False)
        print(f"Saved test data to {test_file}")
        
        # Test loading
        print("Starting file loading test...")
        start_time = time.time()
        
        # Create a mock file object
        class MockFile:
            def __init__(self, filename):
                self.filename = filename
                self.file = open(filename, 'rb')
            
            def seek(self, pos):
                self.file.seek(pos)
            
            def read(self):
                return self.file.read()
            
            def close(self):
                self.file.close()
        
        mock_file = MockFile(test_file)
        
        loaded_df = processor.load_file(mock_file, test_file)
        end_time = time.time()
        
        print(f"File loading completed in {end_time - start_time:.2f}s")
        print(f"Loaded data shape: {loaded_df.shape}")
        
        # Clean up
        mock_file.close()
        os.remove(test_file)
        
        return loaded_df
        
    except Exception as e:
        print(f"File loading test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return None

def test_column_detection():
    """Test column detection functionality"""
    print("\n=== Testing Column Detection ===")
    
    try:
        from utils_module import DataProcessor
        processor = DataProcessor()
        
        # Create test data
        test_df = create_test_data(1000, 10)
        
        print("Starting column detection test...")
        start_time = time.time()
        
        detected_cols = processor.detect_columns(test_df)
        end_time = time.time()
        
        print(f"Column detection completed in {end_time - start_time:.2f}s")
        print(f"Detected columns: {detected_cols}")
        
        return detected_cols
        
    except Exception as e:
        print(f"Column detection test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return None

def test_date_processing():
    """Test date processing functionality"""
    print("\n=== Testing Date Processing ===")
    
    try:
        from utils_module import DataProcessor
        processor = DataProcessor()
        
        # Create test data
        test_df = create_test_data(1000, 10)
        
        print("Starting date processing test...")
        start_time = time.time()
        
        processed_dates = processor._process_date_column(test_df['date'])
        end_time = time.time()
        
        print(f"Date processing completed in {end_time - start_time:.2f}s")
        print(f"Processed dates dtype: {processed_dates.dtype}")
        print(f"Sample processed dates: {processed_dates.head().tolist()}")
        
        return processed_dates
        
    except Exception as e:
        print(f"Date processing test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return None

def test_memory_optimization():
    """Test memory optimization functionality"""
    print("\n=== Testing Memory Optimization ===")
    
    try:
        from performance_optimizer import PerformanceOptimizer
        optimizer = PerformanceOptimizer()
        
        # Create test data
        test_df = create_test_data(10000, 50)  # Larger dataset for memory test
        
        print(f"Starting memory optimization test for {len(test_df)} rows...")
        start_time = time.time()
        
        optimized_df = optimizer.optimize_memory_usage(test_df)
        end_time = time.time()
        
        print(f"Memory optimization completed in {end_time - start_time:.2f}s")
        
        original_memory = test_df.memory_usage(deep=True).sum() / 1024 / 1024
        optimized_memory = optimized_df.memory_usage(deep=True).sum() / 1024 / 1024
        
        print(f"Original memory: {original_memory:.2f}MB")
        print(f"Optimized memory: {optimized_memory:.2f}MB")
        print(f"Memory saved: {original_memory - optimized_memory:.2f}MB")
        
        return optimized_df
        
    except Exception as e:
        print(f"Memory optimization test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return None

def test_full_processing():
    """Test the full data processing pipeline"""
    print("\n=== Testing Full Data Processing Pipeline ===")
    
    try:
        from utils_module import DataProcessor
        processor = DataProcessor()
        
        # Create test data
        test_df = create_test_data(5000, 20)
        
        print(f"Starting full processing test for {len(test_df)} rows...")
        start_time = time.time()
        
        # Detect columns
        detected_cols = processor.detect_columns(test_df)
        print(f"Detected columns: {detected_cols}")
        
        # Process data (without indicators)
        processed_df = processor.process_data(
            test_df, 
            detected_cols['date'], 
            detected_cols['symbol'], 
            detected_cols, 
            calculate_indicators=False
        )
        
        end_time = time.time()
        
        print(f"Full processing completed in {end_time - start_time:.2f}s")
        print(f"Processed data shape: {processed_df.shape}")
        
        return processed_df
        
    except Exception as e:
        print(f"Full processing test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return None

def main():
    """Run all tests to identify the hang point"""
    print("Starting upload hang debugging...")
    print("=" * 50)
    
    # Test each component individually
    test_file_loading()
    test_column_detection()
    test_date_processing()
    test_memory_optimization()
    test_full_processing()
    
    print("\n" + "=" * 50)
    print("Debugging completed. Check the output above to identify where the hang occurs.")

if __name__ == "__main__":
    main()