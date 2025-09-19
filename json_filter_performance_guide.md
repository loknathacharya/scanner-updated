# JSON-Based Filtering System Performance Optimization Guide

## Overview

This guide provides comprehensive performance optimization strategies for the JSON-Based Filtering System. The system is designed to handle large datasets efficiently, but proper optimization is essential for achieving optimal performance with very large datasets or complex filters.

## Performance Architecture

### Key Performance Components

1. **JSONFilterParser**: Lightweight parsing with schema validation
2. **OperandCalculator**: Efficient operand calculation with caching
3. **AdvancedFilterEngine**: Optimized filter application with vectorized operations
4. **PerformanceOptimizer**: Advanced caching and memory management

### Performance Bottlenecks

1. **Large Dataset Processing**: Memory usage and computation time
2. **Complex Indicator Calculations**: Repeated calculations for the same indicators
3. **Multiple Condition Evaluation**: Sequential vs parallel processing
4. **Data Type Inefficiencies**: Inappropriate data types for large datasets

## Optimization Strategies

### 1. Data Optimization

#### Data Type Optimization

```python
import pandas as pd
import numpy as np

def optimize_data_types(df):
    """
    Optimize data types for better performance and memory usage.
    
    Args:
        df (pd.DataFrame): Input DataFrame
        
    Returns:
        pd.DataFrame: Optimized DataFrame
    """
    # Make a copy to avoid modifying original
    optimized_df = df.copy()
    
    # Optimize numeric columns
    for col in optimized_df.select_dtypes(include=['int64']).columns:
        optimized_df[col] = pd.to_numeric(optimized_df[col], downcast='integer')
    
    for col in optimized_df.select_dtypes(include=['float64']).columns:
        optimized_df[col] = pd.to_numeric(optimized_df[col], downcast='float')
    
    # Optimize object columns (strings)
    for col in optimized_df.select_dtypes(include=['object']).columns:
        if optimized_df[col].nunique() / len(optimized_df) < 0.5:  # If cardinality < 50%
            optimized_df[col] = optimized_df[col].astype('category')
    
    return optimized_df
```

#### Memory Usage Monitoring

```python
def get_memory_usage(df):
    """
    Get detailed memory usage information.
    
    Args:
        df (pd.DataFrame): Input DataFrame
        
    Returns:
        dict: Memory usage statistics
    """
    memory_usage = df.memory_usage(deep=True)
    total_memory = memory_usage.sum()
    
    return {
        'total_memory_mb': total_memory / (1024 * 1024),
        'memory_by_column': memory_usage.to_dict(),
        'dtypes': df.dtypes.to_dict(),
        'shape': df.shape
    }

# Example usage
memory_info = get_memory_usage(data)
print(f"Total memory usage: {memory_info['total_memory_mb']:.2f} MB")
```

### 2. Caching Strategies

#### Indicator Caching

```python
from functools import lru_cache
import pandas as pd

class CachedIndicators:
    """Cached indicator calculations for improved performance."""
    
    def __init__(self):
        self.cache = {}
    
    @lru_cache(maxsize=128)
    def calculate_sma_cached(self, data_hash, period, column_name):
        """
        Calculate SMA with caching based on data hash.
        
        Args:
            data_hash (str): Hash of the data series
            period (int): SMA period
            column_name (str): Column name
            
        Returns:
            pd.Series: SMA values
        """
        # In practice, you would need to implement proper data hashing
        # This is a simplified example
        pass
    
    def get_cache_key(self, data, indicator_name, params, column_name):
        """
        Generate cache key for indicator calculation.
        
        Args:
            data (pd.Series): Data series
            indicator_name (str): Indicator name
            params (tuple): Indicator parameters
            column_name (str): Column name
            
        Returns:
            str: Cache key
        """
        # Create a hash based on data and parameters
        data_hash = hash(tuple(data.values))
        params_hash = hash(tuple(params))
        
        return f"{indicator_name}_{data_hash}_{params_hash}_{column_name}"
```

#### Filter Result Caching

```python
import hashlib
import json

class FilterCache:
    """Cache for filter results to avoid recomputation."""
    
    def __init__(self, max_size=1000):
        self.cache = {}
        self.max_size = max_size
    
    def get_cache_key(self, data_hash, json_filter):
        """
        Generate cache key for filter application.
        
        Args:
            data_hash (str): Hash of the data
            json_filter (dict): JSON filter
            
        Returns:
            str: Cache key
        """
        filter_str = json.dumps(json_filter, sort_keys=True)
        combined_key = f"{data_hash}_{hashlib.md5(filter_str.encode()).hexdigest()}"
        return combined_key
    
    def get_cached_result(self, cache_key):
        """Get cached result if available."""
        return self.cache.get(cache_key)
    
    def cache_result(self, cache_key, result):
        """Cache filter result."""
        if len(self.cache) >= self.max_size:
            # Remove oldest entry (simple FIFO)
            oldest_key = next(iter(self.cache))
            del self.cache[oldest_key]
        
        self.cache[cache_key] = result
```

### 3. Vectorized Operations

#### Optimized Filter Application

```python
import numpy as np

class VectorizedFilterEngine:
    """Optimized filter engine using vectorized operations."""
    
    def apply_vectorized_filter(self, data, json_filter):
        """
        Apply filter using vectorized operations for better performance.
        
        Args:
            data (pd.DataFrame): Input data
            json_filter (dict): JSON filter
            
        Returns:
            pd.DataFrame: Filtered data
        """
        # Convert conditions to vectorized operations
        conditions = self._vectorize_conditions(data, json_filter)
        
        # Combine conditions using vectorized operations
        if json_filter.get('logic') == 'AND':
            mask = np.logical_and.reduce(conditions)
        else:  # OR
            mask = np.logical_or.reduce(conditions)
        
        return data[mask].copy()
    
    def _vectorize_conditions(self, data, json_filter):
        """Convert JSON conditions to vectorized operations."""
        conditions = []
        
        for condition in json_filter.get('conditions', []):
            left_val = self._get_vectorized_value(data, condition['left'])
            right_val = self._get_vectorized_value(data, condition['right'])
            operator = condition['operator']
            
            if operator == '>':
                conditions.append(left_val > right_val)
            elif operator == '<':
                conditions.append(left_val < right_val)
            elif operator == '>=':
                conditions.append(left_val >= right_val)
            elif operator == '<=':
                conditions.append(left_val <= right_val)
            elif operator == '==':
                conditions.append(left_val == right_val)
            elif operator == '!=':
                conditions.append(left_val != right_val)
        
        return conditions
    
    def _get_vectorized_value(self, data, operand):
        """Get vectorized value for operand."""
        if operand['type'] == 'column':
            return data[operand['name']].values
        elif operand['type'] == 'constant':
            return np.full(len(data), operand['value'])
        elif operand['type'] == 'indicator':
            # For indicators, you would need to calculate them first
            # This is a simplified example
            indicator_values = self._calculate_indicator(data, operand)
            return indicator_values.values
```

### 4. Chunked Processing

#### Large Dataset Processing

```python
class ChunkedProcessor:
    """Process large datasets in chunks to manage memory usage."""
    
    def __init__(self, chunk_size=10000):
        self.chunk_size = chunk_size
    
    def process_large_dataset(self, data, json_filter, filter_engine):
        """
        Process large dataset in chunks.
        
        Args:
            data (pd.DataFrame): Large dataset
            json_filter (dict): JSON filter
            filter_engine: Filter engine instance
            
        Returns:
            pd.DataFrame: Combined filtered results
        """
        results = []
        
        for i in range(0, len(data), self.chunk_size):
            chunk = data.iloc[i:i + self.chunk_size]
            
            try:
                filtered_chunk = filter_engine.apply_filter(chunk, json_filter)
                results.append(filtered_chunk)
                
                # Progress reporting
                progress = (i + self.chunk_size) / len(data) * 100
                print(f"Processed {min(i + self.chunk_size, len(data))}/{len(data)} rows ({progress:.1f}%)")
                
            except Exception as e:
                print(f"Error processing chunk {i}-{i + self.chunk_size}: {str(e)}")
                continue
        
        # Combine results
        if results:
            return pd.concat(results, ignore_index=True)
        else:
            return pd.DataFrame()
```

### 5. Performance Monitoring

#### Performance Metrics

```python
import time
import psutil
from contextlib import contextmanager

class PerformanceMonitor:
    """Monitor and track performance metrics."""
    
    @contextmanager
    def monitor_performance(self, operation_name):
        """
        Context manager for monitoring performance.
        
        Args:
            operation_name (str): Name of the operation being monitored
            
        Yields:
            dict: Performance metrics
        """
        start_time = time.time()
        start_memory = psutil.Process().memory_info().rss / 1024 / 1024  # MB
        
        yield
        
        end_time = time.time()
        end_memory = psutil.Process().memory_info().rss / 1024 / 1024  # MB
        
        metrics = {
            'operation': operation_name,
            'execution_time_seconds': end_time - start_time,
            'memory_usage_mb': end_memory - start_memory,
            'peak_memory_mb': end_memory
        }
        
        print(f"Performance Metrics for {operation_name}:")
        print(f"  Execution Time: {metrics['execution_time_seconds']:.2f} seconds")
        print(f"  Memory Usage: {metrics['memory_usage_mb']:.2f} MB")
        print(f"  Peak Memory: {metrics['peak_memory_mb']:.2f} MB")
        
        return metrics
```

#### Performance Profiling

```python
import cProfile
import pstats
from io import StringIO

def profile_function(func, *args, **kwargs):
    """
    Profile function performance.
    
    Args:
        func: Function to profile
        *args: Function arguments
        **kwargs: Function keyword arguments
        
    Returns:
        dict: Performance statistics
    """
    pr = cProfile.Profile()
    pr.enable()
    
    result = func(*args, **kwargs)
    
    pr.disable()
    
    # Create string buffer for stats
    s = StringIO()
    ps = pstats.Stats(pr, stream=s).sort_stats('cumulative')
    ps.print_stats()
    
    return {
        'result': result,
        'stats': s.getvalue()
    }

# Example usage
def example_filter_application():
    # Your filter application code here
    pass

# Profile the function
profile_result = profile_function(example_filter_application)
print(profile_result['stats'])
```

## Optimization Examples

### Example 1: Optimized Filter Application

```python
def optimized_filter_application(data, json_filter):
    """
    Optimized filter application with multiple optimization techniques.
    
    Args:
        data (pd.DataFrame): Input data
        json_filter (dict): JSON filter
        
    Returns:
        pd.DataFrame: Filtered data
    """
    # Initialize performance monitor
    monitor = PerformanceMonitor()
    
    with monitor.monitor_performance("Optimized Filter Application"):
        # Step 1: Optimize data types
        optimized_data = optimize_data_types(data)
        
        # Step 2: Initialize cached components
        filter_cache = FilterCache()
        cached_indicators = CachedIndicators()
        
        # Step 3: Generate cache key
        data_hash = hash(tuple(optimized_data.values.tobytes()))
        cache_key = filter_cache.get_cache_key(data_hash, json_filter)
        
        # Step 4: Check cache
        cached_result = filter_cache.get_cached_result(cache_key)
        if cached_result is not None:
            print("Using cached result")
            return cached_result
        
        # Step 5: Apply filter with vectorized operations
        vectorized_engine = VectorizedFilterEngine()
        filtered_data = vectorized_engine.apply_vectorized_filter(optimized_data, json_filter)
        
        # Step 6: Cache result
        filter_cache.cache_result(cache_key, filtered_data)
        
        return filtered_data
```

### Example 2: Large Dataset Processing

```python
def process_large_stock_data(file_path, json_filter):
    """
    Process large stock data file with optimized techniques.
    
    Args:
        file_path (str): Path to data file
        json_filter (dict): JSON filter
        
    Returns:
        pd.DataFrame: Filtered results
    """
    # Initialize components
    chunked_processor = ChunkedProcessor(chunk_size=50000)
    filter_engine = AdvancedFilterEngine()
    
    # Process in chunks
    results = []
    
    for chunk in pd.read_csv(file_path, chunksize=chunked_processor.chunk_size):
        # Optimize chunk data types
        optimized_chunk = optimize_data_types(chunk)
        
        try:
            # Apply filter
            filtered_chunk = filter_engine.apply_filter(optimized_chunk, json_filter)
            results.append(filtered_chunk)
            
            print(f"Processed chunk: {len(chunk)} rows, {len(filtered_chunk)} matches")
            
        except Exception as e:
            print(f"Error processing chunk: {str(e)}")
            continue
    
    # Combine results
    if results:
        final_results = pd.concat(results, ignore_index=True)
        print(f"Total matches: {len(final_results)}")
        return final_results
    else:
        return pd.DataFrame()
```

## Performance Best Practices

### 1. Data Preparation

- **Always optimize data types** before processing
- **Remove unnecessary columns** to reduce memory usage
- **Use appropriate data types** (e.g., `category` for low-cardinality strings)
- **Consider data sampling** for initial testing

### 2. Filter Design

- **Keep filters simple** when possible
- **Use column references** instead of complex indicators when feasible
- **Avoid nested conditions** unless necessary
- **Pre-calculate indicators** that are used frequently

### 3. Memory Management

- **Monitor memory usage** regularly
- **Use chunked processing** for large datasets
- **Implement proper caching** for repeated operations
- **Clean up temporary variables** when no longer needed

### 4. Performance Testing

- **Profile your code** regularly to identify bottlenecks
- **Benchmark different approaches** for complex operations
- **Test with realistic data sizes** to ensure performance
- **Monitor performance over time** to detect degradation

## Common Performance Issues and Solutions

### Issue 1: High Memory Usage

**Symptoms**: Memory errors, slow performance, system instability

**Causes**: 
- Large datasets with inefficient data types
- Multiple copies of data in memory
- Lack of proper cleanup

**Solutions**:
```python
# Use efficient data types
def reduce_memory_usage(df):
    """Reduce memory usage of DataFrame."""
    start_mem = df.memory_usage().sum() / 1024**2
    print(f"Memory usage of dataframe is {start_mem:.2f} MB")
    
    for col in df.columns:
        col_type = df[col].dtype
        
        if col_type != object:
            c_min = df[col].min()
            c_max = df[col].max()
            if str(col_type)[:3] == 'int':
                if c_min > np.iinfo(np.int8).min and c_max < np.iinfo(np.int8).max:
                    df[col] = df[col].astype(np.int8)
                elif c_min > np.iinfo(np.int16).min and c_max < np.iinfo(np.int16).max:
                    df[col] = df[col].astype(np.int16)
                elif c_min > np.iinfo(np.int32).min and c_max < np.iinfo(np.int32).max:
                    df[col] = df[col].astype(np.int32)
                elif c_min > np.iinfo(np.int64).min and c_max < np.iinfo(np.int64).max:
                    df[col] = df[col].astype(np.int64)
            else:
                if c_min > np.finfo(np.float16).min and c_max < np.finfo(np.float16).max:
                    df[col] = df[col].astype(np.float16)
                elif c_min > np.finfo(np.float32).min and c_max < np.finfo(np.float32).max:
                    df[col] = df[col].astype(np.float32)
                else:
                    df[col] = df[col].astype(np.float64)
        else:
            df[col] = df[col].astype('category')
    
    end_mem = df.memory_usage().sum() / 1024**2
    print(f"Memory usage after optimization is {end_mem:.2f} MB")
    print(f"Reduced by {100 * (start_mem - end_mem) / start_mem:.1f}%")
    
    return df
```

### Issue 2: Slow Filter Application

**Symptoms**: Filters take a long time to apply, especially with complex conditions

**Causes**:
- Complex indicator calculations
- Inefficient data structures
- Lack of caching

**Solutions**:
```python
# Use pre-calculated indicators
def precalculate_indicators(data, indicator_config):
    """
    Pre-calculate indicators to improve filter performance.
    
    Args:
        data (pd.DataFrame): Input data
        indicator_config (dict): Indicator configuration
        
    Returns:
        pd.DataFrame: Data with pre-calculated indicators
    """
    result_data = data.copy()
    
    for indicator_name, params in indicator_config.items():
        if indicator_name == 'sma':
            for period in params['periods']:
                col_name = f'sma_{period}'
                result_data[col_name] = data['close'].rolling(window=period).mean()
        elif indicator_name == 'ema':
            for period in params['periods']:
                col_name = f'ema_{period}'
                result_data[col_name] = data['close'].ewm(span=period).mean()
        # Add more indicators as needed
    
    return result_data
```

### Issue 3: Cache Inefficiency

**Symptoms**: Cache doesn't improve performance, memory usage grows

**Causes**:
- Poor cache key generation
- Cache size too small or too large
- Cache invalidation issues

**Solutions**:
```python
# Implement smart caching
class SmartCache:
    """Smart caching with size management and invalidation."""
    
    def __init__(self, max_size=1000, ttl_seconds=3600):
        self.cache = {}
        self.max_size = max_size
        self.ttl = ttl_seconds
        self.access_times = {}
    
    def get(self, key):
        """Get value from cache with TTL check."""
        if key in self.cache:
            # Check TTL
            import time
            if time.time() - self.access_times[key] < self.ttl:
                self.access_times[key] = time.time()
                return self.cache[key]
            else:
                # Remove expired entry
                del self.cache[key]
                del self.access_times[key]
        return None
    
    def set(self, key, value):
        """Set value in cache with size management."""
        import time
        
        # Remove expired entries
        current_time = time.time()
        expired_keys = [k for k, v in self.access_times.items() 
                       if current_time - v > self.ttl]
        for k in expired_keys:
            del self.cache[k]
            del self.access_times[k]
        
        # Manage cache size
        if len(self.cache) >= self.max_size:
            # Remove least recently used
            oldest_key = min(self.access_times.keys(), 
                           key=lambda k: self.access_times[k])
            del self.cache[oldest_key]
            del self.access_times[oldest_key]
        
        # Add new entry
        self.cache[key] = value
        self.access_times[key] = current_time
```

## Performance Testing Framework

```python
import unittest
import time
import pandas as pd
import numpy as np

class PerformanceTestCase(unittest.TestCase):
    """Test case for performance testing."""
    
    def setUp(self):
        """Set up test data."""
        # Create test data
        np.random.seed(42)
        dates = pd.date_range('2020-01-01', periods=100000, freq='D')
        symbols = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'META'] * 20000
        
        self.test_data = pd.DataFrame({
            'date': dates,
            'symbol': symbols,
            'open': np.random.uniform(50, 500, 100000),
            'high': np.random.uniform(50, 500, 100000),
            'low': np.random.uniform(50, 500, 100000),
            'close': np.random.uniform(50, 500, 100000),
            'volume': np.random.uniform(1000000, 10000000, 100000)
        })
        
        # Test filter
        self.test_filter = {
            "logic": "AND",
            "conditions": [
                {
                    "left": {
                        "type": "column",
                        "name": "close",
                        "timeframe": "daily",
                        "offset": 0
                    },
                    "operator": ">",
                    "right": {
                        "type": "constant",
                        "value": 100.0
                    }
                },
                {
                    "left": {
                        "type": "indicator",
                        "name": "sma",
                        "params": [20],
                        "column": "close",
                        "timeframe": "daily",
                        "offset": 0
                    },
                    "operator": ">",
                    "right": {
                        "type": "constant",
                        "value": 0.0
                    }
                }
            ]
        }
    
    def test_basic_filter_performance(self):
        """Test basic filter performance."""
        from advanced_filter_engine import AdvancedFilterEngine
        
        filter_engine = AdvancedFilterEngine()
        
        start_time = time.time()
        result = filter_engine.apply_filter(self.test_data, self.test_filter)
        end_time = time.time()
        
        execution_time = end_time - start_time
        print(f"Basic filter execution time: {execution_time:.3f} seconds")
        print(f"Result size: {len(result)} rows")
        
        # Assert reasonable performance
        self.assertLess(execution_time, 10.0)  # Should complete in under 10 seconds
        self.assertGreater(len(result), 0)  # Should have some results
    
    def test_optimized_filter_performance(self):
        """Test optimized filter performance."""
        from advanced_filter_engine import AdvancedFilterEngine
        
        # Optimize data first
        optimized_data = optimize_data_types(self.test_data)
        
        filter_engine = AdvancedFilterEngine()
        
        start_time = time.time()
        result = filter_engine.apply_filter(optimized_data, self.test_filter)
        end_time = time.time()
        
        execution_time = end_time - start_time
        print(f"Optimized filter execution time: {execution_time:.3f} seconds")
        print(f"Result size: {len(result)} rows")
        
        # Assert better performance
        self.assertLess(execution_time, 5.0)  # Should be faster than basic
        self.assertGreater(len(result), 0)

if __name__ == '__main__':
    unittest.main()
```

## Conclusion

The JSON-Based Filtering System is designed for performance, but proper optimization is essential for handling large datasets and complex filters. By following the strategies outlined in this guide, you can achieve significant performance improvements:

1. **Data Optimization**: Use appropriate data types and memory-efficient structures
2. **Caching**: Implement smart caching for repeated operations
3. **Vectorization**: Use vectorized operations for better performance
4. **Chunked Processing**: Handle large datasets in manageable chunks
5. **Monitoring**: Regularly monitor and profile performance

Remember to test your optimizations with realistic data sizes and workloads to ensure they provide the expected benefits.