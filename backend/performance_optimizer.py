import pandas as pd
import numpy as np
import streamlit as st
from typing import Dict, Any, List, Optional, Union, Tuple, Callable
import time
import logging
from functools import wraps
import hashlib
import json
from dataclasses import dataclass
from concurrent.futures import ThreadPoolExecutor, as_completed
import multiprocessing as mp
from contextlib import contextmanager

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class PerformanceMetrics:
    """Store performance metrics for operations"""
    operation_name: str
    execution_time: float
    memory_before: float
    memory_after: float
    data_size: int
    timestamp: float
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'operation': self.operation_name,
            'execution_time': self.execution_time,
            'memory_before': self.memory_before,
            'memory_after': self.memory_after,
            'memory_saved': self.memory_before - self.memory_after,
            'data_size': self.data_size,
            'timestamp': self.timestamp
        }

class PerformanceOptimizer:
    """Performance optimization class for stock data processing"""
    
    def __init__(self):
        self.metrics_history: List[PerformanceMetrics] = []
        self.cache_info = {}
        self._setup_memory_monitoring()
    
    def _setup_memory_monitoring(self):
        """Setup memory monitoring capabilities"""
        try:
            import psutil
            self.psutil_available = True
            self.process = psutil.Process()
        except ImportError:
            self.psutil_available = False
            logger.warning("psutil not available for memory monitoring")
    
    def _get_memory_usage(self) -> float:
        """Get current memory usage in MB"""
        if self.psutil_available:
            return self.process.memory_info().rss / 1024 / 1024
        else:
            # Fallback method
            import sys
            return sys.getsizeof(None) / 1024 / 1024  # Rough estimate
    
    def _log_performance(self, operation_name: str, start_time: float, 
                        data_size: int, memory_before: float) -> None:
        """Log performance metrics"""
        execution_time = time.time() - start_time
        memory_after = self._get_memory_usage()
        
        metrics = PerformanceMetrics(
            operation_name=operation_name,
            execution_time=execution_time,
            memory_before=memory_before,
            memory_after=memory_after,
            data_size=data_size,
            timestamp=time.time()
        )
        
        self.metrics_history.append(metrics)
        logger.info(f"Performance - {operation_name}: {execution_time:.3f}s, "
                   f"Memory: {memory_before:.2f}MB -> {memory_after:.2f}MB")
    
    def _generate_data_hash(self, data: Union[pd.DataFrame, pd.Series]) -> str:
        """Generate hash for data to use as cache key"""
        if isinstance(data, pd.DataFrame):
            # Use a combination of shape, columns, and first few rows for hash
            data_str = f"{data.shape}_{','.join(data.columns)}_{data.head(1000).to_csv()}"
        else:
            data_str = f"{len(data)}_{data.head(1000).to_csv()}"
        
        return hashlib.md5(data_str.encode()).hexdigest()
    
    @st.cache_data
    def cached_indicator_calculation(_self, data_hash: str, indicator_config: Dict[str, Any]) -> pd.Series:
        """
        Cached indicator calculation with Streamlit caching
        
        Args:
            data_hash: Hash of the input data for cache key
            indicator_config: Dictionary with indicator parameters
                - 'indicator_type': Type of indicator (sma, ema, rsi, etc.)
                - 'column': Column name to calculate on
                - 'window': Window size for calculation
                - 'offset': Optional offset parameter
                
        Returns:
            pd.Series: Calculated indicator values
        """
        start_time = time.time()
        
        # Extract parameters
        indicator_type = indicator_config.get('indicator_type', 'sma')
        column = indicator_config.get('column', 'close')
        window = indicator_config.get('window', 20)
        offset = indicator_config.get('offset', 0)
        
        # This would normally access the actual data from session state or passed data
        # For caching purposes, we work with the hash and config
        logger.info(f"Calculating {indicator_type} for {column} with window={window}, offset={offset}")
        
        # Simulate calculation (in real implementation, this would use actual data)
        # For now, return a placeholder series
        result = pd.Series(dtype='float64')
        
        # Log performance (using _self instead of self since we renamed the parameter)
        _self._log_performance(
            f"cached_indicator_calculation_{indicator_type}",
            start_time,
            len(result) if len(result) > 0 else 0,
            _self._get_memory_usage()
        )
        
        return result
    
    def optimize_memory_usage(self, data: pd.DataFrame) -> pd.DataFrame:
        """
        Optimize memory usage for large datasets by downcasting data types
        
        Args:
            data: Input DataFrame to optimize
            
        Returns:
            pd.DataFrame: Memory-optimized DataFrame
        """
        start_time = time.time()
        memory_before = self._get_memory_usage()
        original_memory = data.memory_usage(deep=True).sum() / 1024 / 1024
        
        optimized_df = data.copy()
        
        # Optimize numeric columns
        for col in optimized_df.select_dtypes(include=[np.number]).columns:
            col_data = optimized_df[col]
            
            if pd.api.types.is_integer_dtype(col_data):
                # Downcast integers
                optimized_df[col] = pd.to_numeric(col_data, downcast='integer')
            
            elif pd.api.types.is_float_dtype(col_data):
                # Downcast floats
                optimized_df[col] = pd.to_numeric(col_data, downcast='float')
        
        # Optimize object columns (strings)
        for col in optimized_df.select_dtypes(include=['object']).columns:
            if col != 'date':  # Don't convert date columns
                num_unique = optimized_df[col].nunique()
                num_total = len(optimized_df[col])
                
                # Convert to category if low cardinality
                if num_unique / num_total < 0.5:
                    optimized_df[col] = optimized_df[col].astype('category')
        
        # Optimize datetime columns
        for col in optimized_df.select_dtypes(include=['datetime64']).columns:
            optimized_df[col] = pd.to_datetime(optimized_df[col])
        
        final_memory = optimized_df.memory_usage(deep=True).sum() / 1024 / 1024
        memory_saved = original_memory - final_memory
        
        # Log performance
        self._log_performance(
            "optimize_memory_usage",
            start_time,
            len(optimized_df),
            memory_before
        )
        
        logger.info(f"Memory optimization: {original_memory:.2f}MB -> {final_memory:.2f}MB "
                   f"(saved {memory_saved:.2f}MB, {memory_saved/original_memory*100:.1f}%)")
        
        return optimized_df
    
    def vectorize_operations(self, operations: List[Dict[str, Any]], 
                           data: pd.DataFrame) -> pd.DataFrame:
        """
        Apply vectorized operations for better performance
        
        Args:
            operations: List of operations to apply
                Each operation is a dict with:
                - 'type': 'arithmetic', 'comparison', 'function'
                - 'target': Target column name
                - 'source': Source column(s) for operation
                - 'operation': Specific operation to perform
            data: Input DataFrame
            
        Returns:
            pd.DataFrame: DataFrame with applied operations
        """
        start_time = time.time()
        memory_before = self._get_memory_usage()
        
        result_df = data.copy()
        
        for op in operations:
            op_type = op.get('type')
            target = op.get('target')
            source = op.get('source', [])
            operation = op.get('operation')
            
            try:
                if op_type == 'arithmetic':
                    # Vectorized arithmetic operations
                    if len(source) == 1:
                        if operation == 'multiply':
                            result_df[target] = result_df[source[0]] * op.get('value', 1)
                        elif operation == 'divide':
                            result_df[target] = result_df[source[0]] / op.get('value', 1)
                        elif operation == 'add':
                            result_df[target] = result_df[source[0]] + op.get('value', 0)
                        elif operation == 'subtract':
                            result_df[target] = result_df[source[0]] - op.get('value', 0)
                    elif len(source) == 2:
                        if operation == 'multiply':
                            result_df[target] = result_df[source[0]] * result_df[source[1]]
                        elif operation == 'divide':
                            result_df[target] = result_df[source[0]] / result_df[source[1]]
                        elif operation == 'add':
                            result_df[target] = result_df[source[0]] + result_df[source[1]]
                        elif operation == 'subtract':
                            result_df[target] = result_df[source[0]] - result_df[source[1]]
                
                elif op_type == 'comparison':
                    # Vectorized comparison operations
                    if len(source) == 1:
                        if operation == 'gt':
                            result_df[target] = result_df[source[0]] > op.get('value')
                        elif operation == 'lt':
                            result_df[target] = result_df[source[0]] < op.get('value')
                        elif operation == 'eq':
                            result_df[target] = result_df[source[0]] == op.get('value')
                    elif len(source) == 2:
                        if operation == 'gt':
                            result_df[target] = result_df[source[0]] > result_df[source[1]]
                        elif operation == 'lt':
                            result_df[target] = result_df[source[0]] < result_df[source[1]]
                        elif operation == 'eq':
                            result_df[target] = result_df[source[0]] == result_df[source[1]]
                
                elif op_type == 'function':
                    # Apply numpy functions
                    if operation == 'log':
                        result_df[target] = np.log(result_df[source[0]])
                    elif operation == 'sqrt':
                        result_df[target] = np.sqrt(result_df[source[0]])
                    elif operation == 'abs':
                        result_df[target] = np.abs(result_df[source[0]])
                    elif operation == 'pct_change':
                        result_df[target] = result_df[source[0]].pct_change()
                
                logger.info(f"Applied {op_type} operation: {operation} on {source} -> {target}")
                
            except Exception as e:
                logger.error(f"Error applying operation {op}: {str(e)}")
                continue
        
        # Log performance
        self._log_performance(
            "vectorize_operations",
            start_time,
            len(result_df),
            memory_before
        )
        
        return result_df
    
    def batch_process_data(self, data: pd.DataFrame, batch_size: int = 10000,
                          process_func: Optional[Callable] = None) -> List[pd.DataFrame]:
        """
        Process data in batches for memory efficiency
        
        Args:
            data: Input DataFrame to process
            batch_size: Size of each batch
            process_func: Function to apply to each batch
            
        Returns:
            List[pd.DataFrame]: List of processed batches
        """
        start_time = time.time()
        memory_before = self._get_memory_usage()
        
        if process_func is None:
            process_func = lambda x: x  # Default: return data as-is
        
        batches = []
        total_batches = len(data) // batch_size + (1 if len(data) % batch_size > 0 else 0)
        
        logger.info(f"Processing {len(data)} rows in {total_batches} batches of size {batch_size}")
        
        for i in range(0, len(data), batch_size):
            batch = data.iloc[i:i + batch_size]
            
            try:
                processed_batch = process_func(batch)
                batches.append(processed_batch)
                
                logger.info(f"Processed batch {i//batch_size + 1}/{total_batches} "
                           f"({len(batch)} rows)")
                
            except Exception as e:
                logger.error(f"Error processing batch {i//batch_size + 1}: {str(e)}")
                # Add original batch as fallback
                batches.append(batch)
        
        # Log performance
        self._log_performance(
            "batch_process_data",
            start_time,
            len(data),
            memory_before
        )
        
        return batches
    
    def parallel_process_data(self, data: pd.DataFrame, process_func: Callable,
                            num_workers: Optional[int] = None, chunk_size: int = 10000) -> pd.DataFrame:
        """
        Process data in parallel using multiple workers
        
        Args:
            data: Input DataFrame to process
            process_func: Function to apply to each chunk
            num_workers: Number of worker processes (default: CPU count)
            chunk_size: Size of each chunk for processing
            
        Returns:
            pd.DataFrame: Combined results from all workers
        """
        start_time = time.time()
        memory_before = self._get_memory_usage()
        
        if num_workers is None:
            num_workers = min(mp.cpu_count(), 4)  # Use up to 4 workers
        
        # Split data into chunks
        chunks = [data.iloc[i:i + chunk_size] for i in range(0, len(data), chunk_size)]
        
        logger.info(f"Processing {len(data)} rows in parallel using {num_workers} workers")
        
        results = []
        
        # Use ThreadPoolExecutor for I/O bound operations, ProcessPoolExecutor for CPU bound
        try:
            with ThreadPoolExecutor(max_workers=num_workers) as executor:
                # Submit all chunks
                future_to_chunk = {
                    executor.submit(process_func, chunk): idx 
                    for idx, chunk in enumerate(chunks)
                }
                
                # Collect results as they complete
                for future in as_completed(future_to_chunk):
                    chunk_idx = future_to_chunk[future]
                    try:
                        result = future.result()
                        results.append((chunk_idx, result))
                        logger.info(f"Completed chunk {chunk_idx + 1}/{len(chunks)}")
                    except Exception as e:
                        logger.error(f"Error processing chunk {chunk_idx + 1}: {str(e)}")
                        # Add original chunk as fallback
                        results.append((chunk_idx, chunks[chunk_idx]))
            
            # Sort results by original chunk index and combine
            results.sort(key=lambda x: x[0])
            final_result = pd.concat([result for _, result in results], ignore_index=True)
            
        except Exception as e:
            logger.error(f"Parallel processing failed: {str(e)}")
            # Fallback to sequential processing
            logger.info("Falling back to sequential processing")
            final_result = process_func(data)
        
        # Log performance
        self._log_performance(
            "parallel_process_data",
            start_time,
            len(final_result),
            memory_before
        )
        
        return final_result
    
    def get_performance_summary(self) -> Dict[str, Any]:
        """Get summary of performance metrics"""
        if not self.metrics_history:
            return {"message": "No performance data available"}
        
        # Convert metrics to DataFrame for analysis
        metrics_df = pd.DataFrame([m.to_dict() for m in self.metrics_history])
        
        summary = {
            "total_operations": len(self.metrics_history),
            "total_execution_time": metrics_df['execution_time'].sum(),
            "average_execution_time": metrics_df['execution_time'].mean(),
            "total_memory_saved": metrics_df['memory_saved'].sum(),
            "average_memory_saved": metrics_df['memory_saved'].mean(),
            "operations_by_type": metrics_df['operation'].value_counts().to_dict(),
            "slowest_operations": metrics_df.nlargest(5, 'execution_time')[['operation', 'execution_time']].to_dict('records'),
            "most_memory_saved": metrics_df.nlargest(5, 'memory_saved')[['operation', 'memory_saved']].to_dict('records')
        }
        
        return summary
    
    def clear_cache(self) -> None:
        """Clear all cached data"""
        try:
            st.cache_data.clear()
            self.metrics_history.clear()
            self.cache_info.clear()
            logger.info("Cache cleared successfully")
        except Exception as e:
            logger.error(f"Error clearing cache: {str(e)}")
    
    def export_performance_report(self, filename: Optional[str] = None) -> Optional[str]:
        """Export performance metrics to JSON file"""
        if filename is None:
            filename = f"performance_report_{int(time.time())}.json"
        
        report = {
            "timestamp": time.time(),
            "summary": self.get_performance_summary(),
            "detailed_metrics": [m.to_dict() for m in self.metrics_history]
        }
        
        try:
            with open(filename, 'w') as f:
                json.dump(report, f, indent=2, default=str)
            logger.info(f"Performance report exported to {filename}")
            return filename
        except Exception as e:
            logger.error(f"Error exporting performance report: {str(e)}")
            return None

# Decorator for performance monitoring
def monitor_performance(operation_name: str):
    """Decorator to monitor function performance"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            optimizer = PerformanceOptimizer()
            start_time = time.time()
            memory_before = optimizer._get_memory_usage()
            
            try:
                result = func(*args, **kwargs)
                execution_time = time.time() - start_time
                
                logger.info(f"Performance - {operation_name}: {execution_time:.3f}s")
                return result
                
            except Exception as e:
                execution_time = time.time() - start_time
                logger.error(f"Performance - {operation_name} failed after {execution_time:.3f}s: {str(e)}")
                raise
            finally:
                memory_after = optimizer._get_memory_usage()
                logger.info(f"Memory usage - {operation_name}: {memory_before:.2f}MB -> {memory_after:.2f}MB")
        
        return wrapper
    return decorator

# Context manager for performance monitoring
@contextmanager
def performance_context(operation_name: str):
    """Context manager for performance monitoring"""
    optimizer = PerformanceOptimizer()
    start_time = time.time()
    memory_before = optimizer._get_memory_usage()
    
    try:
        yield
    finally:
        execution_time = time.time() - start_time
        memory_after = optimizer._get_memory_usage()
        
        logger.info(f"Performance - {operation_name}: {execution_time:.3f}s, "
                   f"Memory: {memory_before:.2f}MB -> {memory_after:.2f}MB")