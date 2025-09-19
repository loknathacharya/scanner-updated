import pandas as pd
import numpy as np
import time
import sys
import os
from datetime import datetime, timedelta

# Add the current directory to the path to import modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from performance_optimizer import PerformanceOptimizer
from indicators_module import TechnicalIndicators

def generate_test_data(num_rows=100000, num_symbols=100) -> pd.DataFrame:
    """Generate synthetic stock data for testing"""
    print(f"Generating test data with {num_rows} rows and {num_symbols} symbols...")
    
    # Generate date range
    end_date = datetime.now()
    start_date = end_date - timedelta(days=365)
    date_range = pd.date_range(start=start_date, end=end_date, freq='D')
    
    # Generate symbols
    symbols = [f"SYMBOL_{i:03d}" for i in range(1, num_symbols + 1)]
    
    data = []
    
    for symbol in symbols:
        # Generate random walk for price
        np.random.seed(hash(symbol) % 1000)  # Deterministic but different for each symbol
        base_price = 100 + (hash(symbol) % 200)  # Base price between 100-300
        
        prices = [base_price]
        for _ in range(len(date_range) - 1):
            # Random walk with slight upward bias
            change = np.random.normal(0.001, 0.02)  # Small daily changes
            new_price = prices[-1] * (1 + change)
            prices.append(max(new_price, 1.0))  # Ensure positive price
        
        # Create OHLC data
        for i, date in enumerate(date_range):
            open_price = prices[i]
            close_price = prices[i]
            high_price = open_price * (1 + abs(np.random.normal(0, 0.01)))
            low_price = open_price * (1 - abs(np.random.normal(0, 0.01)))
            volume = np.random.randint(10000, 1000000)
            
            data.append({
                'date': date,
                'symbol': symbol,
                'open': round(open_price, 2),
                'high': round(high_price, 2),
                'low': round(low_price, 2),
                'close': round(close_price, 2),
                'volume': volume
            })
    
    df = pd.DataFrame(data)
    print(f"Generated test data: {df.shape}")
    return df

def test_memory_optimization():
    """Test memory optimization functionality"""
    print("\n=== Testing Memory Optimization ===")
    
    # Generate test data
    test_data = generate_test_data(50000, 50)
    
    # Initialize performance optimizer
    optimizer = PerformanceOptimizer()
    
    # Get initial memory usage
    initial_memory = test_data.memory_usage(deep=True).sum() / 1024 / 1024
    print(f"Initial memory usage: {initial_memory:.2f} MB")
    
    # Apply memory optimization
    optimized_data = optimizer.optimize_memory_usage(test_data)
    
    # Get optimized memory usage
    optimized_memory = optimized_data.memory_usage(deep=True).sum() / 1024 / 1024
    print(f"Optimized memory usage: {optimized_memory:.2f} MB")
    
    # Calculate savings
    memory_saved = initial_memory - optimized_memory
    savings_percentage = (memory_saved / initial_memory) * 100
    
    print(f"Memory saved: {memory_saved:.2f} MB ({savings_percentage:.1f}%)")
    
    # Verify data integrity
    print(f"Data shape preserved: {test_data.shape} -> {optimized_data.shape}")
    print(f"Data types optimized: {test_data.dtypes.equals(optimized_data.dtypes)}")
    
    return memory_saved > 0

def test_vectorized_operations():
    """Test vectorized operations functionality"""
    print("\n=== Testing Vectorized Operations ===")
    
    # Generate test data
    test_data = generate_test_data(20000, 20)
    
    # Initialize performance optimizer
    optimizer = PerformanceOptimizer()
    
    # Define vectorized operations
    operations = [
        # Arithmetic operations
        {'type': 'arithmetic', 'target': 'price_change', 'source': ['close'], 'operation': 'pct_change'},
        {'type': 'arithmetic', 'target': 'price_double', 'source': ['close'], 'operation': 'multiply', 'value': 2},
        {'type': 'arithmetic', 'target': 'price_half', 'source': ['close'], 'operation': 'divide', 'value': 2},
        
        # Comparison operations
        {'type': 'comparison', 'target': 'high_price', 'source': ['close'], 'operation': 'gt', 'value': 150},
        {'type': 'comparison', 'target': 'price_vs_volume', 'source': ['close', 'volume'], 'operation': 'gt'},
        
        # Function operations
        {'type': 'function', 'target': 'log_price', 'source': ['close'], 'operation': 'log'},
        {'type': 'function', 'target': 'sqrt_volume', 'source': ['volume'], 'operation': 'sqrt'},
    ]
    
    # Apply vectorized operations
    start_time = time.time()
    result_data = optimizer.vectorize_operations(operations, test_data)
    execution_time = time.time() - start_time
    
    print(f"Applied {len(operations)} vectorized operations in {execution_time:.3f} seconds")
    print(f"Result shape: {result_data.shape}")
    print(f"New columns: {set(result_data.columns) - set(test_data.columns)}")
    
    # Verify some operations
    if 'price_change' in result_data.columns:
        print(f"Price change range: [{result_data['price_change'].min():.4f}, {result_data['price_change'].max():.4f}]")
    
    if 'high_price' in result_data.columns:
        print(f"High price count: {result_data['high_price'].sum()}")
    
    return execution_time < 1.0  # Should complete in under 1 second

def test_batch_processing():
    """Test batch processing functionality"""
    print("\n=== Testing Batch Processing ===")
    
    # Generate test data
    test_data = generate_test_data(100000, 100)
    
    # Initialize performance optimizer
    optimizer = PerformanceOptimizer()
    
    # Define a simple processing function
    def process_batch(batch):
        # Add some simple calculations
        batch['processed'] = batch['close'] * batch['volume']
        batch['normalized'] = (batch['close'] - batch['close'].mean()) / batch['close'].std()
        return batch
    
    # Test batch processing
    start_time = time.time()
    batches = optimizer.batch_process_data(test_data, batch_size=10000, process_func=process_batch)
    execution_time = time.time() - start_time
    
    print(f"Processed {len(test_data)} rows in {len(batches)} batches")
    print(f"Batch processing time: {execution_time:.3f} seconds")
    
    # Verify results
    total_rows = sum(len(batch) for batch in batches)
    print(f"Total rows processed: {total_rows}")
    
    # Check if all batches have the new columns
    all_have_processed = all('processed' in batch.columns for batch in batches)
    print(f"All batches have processed column: {all_have_processed}")
    
    return execution_time < 5.0 and all_have_processed

def test_indicator_calculation():
    """Test indicator calculation with caching"""
    print("\n=== Testing Indicator Calculation with Caching ===")
    
    # Generate test data
    test_data = generate_test_data(10000, 10)
    
    # Initialize performance optimizer
    optimizer = PerformanceOptimizer()
    
    # Test cached indicator calculation
    indicator_configs = [
        {'indicator_type': 'sma', 'column': 'close', 'window': 20},
        {'indicator_type': 'ema', 'column': 'close', 'window': 12},
        {'indicator_type': 'rsi', 'column': 'close', 'window': 14},
    ]
    
    # Generate data hash for caching
    data_hash = optimizer._generate_data_hash(test_data)
    
    # Test cached calculations
    start_time = time.time()
    results = []
    
    for config in indicator_configs:
        result = optimizer.cached_indicator_calculation(data_hash, config)
        results.append(result)
        print(f"Calculated {config['indicator_type']} for {config['column']} with window={config['window']}")
    
    execution_time = time.time() - start_time
    print(f"Cached indicator calculation time: {execution_time:.3f} seconds")
    
    # Test with same data (should use cache)
    start_time_cached = time.time()
    for config in indicator_configs:
        result = optimizer.cached_indicator_calculation(data_hash, config)
    
    cached_time = time.time() - start_time_cached
    print(f"Cached calculation time (second run): {cached_time:.3f} seconds")
    
    return execution_time > 0 and cached_time <= execution_time

def test_performance_monitoring():
    """Test performance monitoring and metrics"""
    print("\n=== Testing Performance Monitoring ===")
    
    # Initialize performance optimizer
    optimizer = PerformanceOptimizer()
    
    # Generate test data
    test_data = generate_test_data(5000, 5)
    
    # Perform some operations to generate metrics
    optimizer.optimize_memory_usage(test_data)
    optimizer.vectorize_operations([{'type': 'arithmetic', 'target': 'test', 'source': ['close'], 'operation': 'multiply', 'value': 2}], test_data)
    
    # Get performance summary
    summary = optimizer.get_performance_summary()
    
    print("Performance Summary:")
    for key, value in summary.items():
        if isinstance(value, (int, float)):
            print(f"  {key}: {value:.3f}")
        else:
            print(f"  {key}: {value}")
    
    # Test performance report export
    report_file = optimizer.export_performance_report()
    print(f"Performance report exported to: {report_file}")
    
    # Verify metrics were recorded
    has_metrics = len(optimizer.metrics_history) > 0
    print(f"Performance metrics recorded: {has_metrics}")
    
    return has_metrics and report_file is not None

def test_parallel_processing():
    """Test parallel processing functionality"""
    print("\n=== Testing Parallel Processing ===")
    
    # Generate test data
    test_data = generate_test_data(50000, 50)
    
    # Initialize performance optimizer
    optimizer = PerformanceOptimizer()
    
    # Define a simple processing function
    def process_chunk(chunk):
        # Add some calculations
        chunk['chunk_id'] = hash(str(chunk.index[0])) % 1000
        chunk['processed'] = chunk['close'] * chunk['volume']
        return chunk
    
    # Test parallel processing
    start_time = time.time()
    result = optimizer.parallel_process_data(test_data, process_chunk, num_workers=2, chunk_size=10000)
    execution_time = time.time() - start_time
    
    print(f"Parallel processed {len(test_data)} rows in {execution_time:.3f} seconds")
    print(f"Result shape: {result.shape}")
    
    # Verify results
    has_chunk_id = 'chunk_id' in result.columns
    has_processed = 'processed' in result.columns
    
    print(f"Has chunk_id column: {has_chunk_id}")
    print(f"Has processed column: {has_processed}")
    
    return execution_time < 3.0 and has_chunk_id and has_processed

def run_performance_tests():
    """Run all performance tests"""
    print("🚀 Starting Performance Optimization Tests")
    print("=" * 50)
    
    tests = [
        ("Memory Optimization", test_memory_optimization),
        ("Vectorized Operations", test_vectorized_operations),
        ("Batch Processing", test_batch_processing),
        ("Indicator Calculation", test_indicator_calculation),
        ("Performance Monitoring", test_performance_monitoring),
        ("Parallel Processing", test_parallel_processing),
    ]
    
    results = {}
    
    for test_name, test_func in tests:
        try:
            print(f"\n📋 Running {test_name}...")
            result = test_func()
            results[test_name] = result
            print(f"✅ {test_name}: {'PASSED' if result else 'FAILED'}")
        except Exception as e:
            print(f"❌ {test_name}: FAILED - {str(e)}")
            results[test_name] = False
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 Test Results Summary:")
    passed = sum(results.values())
    total = len(results)
    
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"  {test_name}: {status}")
    
    print(f"\nOverall: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Performance optimization is working correctly.")
    else:
        print("⚠️  Some tests failed. Please check the implementation.")
    
    return passed == total

if __name__ == "__main__":
    success = run_performance_tests()
    sys.exit(0 if success else 1)