import pandas as pd
import numpy as np
from advanced_filter_engine import AdvancedFilterEngine


def create_sample_data():
    """Create sample stock data for demonstration"""
    dates = pd.date_range('2023-01-01', periods=20, freq='D')
    np.random.seed(42)
    
    data = pd.DataFrame({
        'date': dates,
        'symbol': ['AAPL'] * 20,
        'open': np.random.uniform(150, 160, 20),
        'high': np.random.uniform(155, 165, 20),
        'low': np.random.uniform(145, 155, 20),
        'close': np.random.uniform(148, 162, 20),
        'volume': np.random.randint(1000000, 5000000, 20)
    })
    
    # Add some indicators for demonstration
    data['sma_20'] = data['close'].rolling(window=5).mean()
    data['rsi'] = np.random.uniform(30, 70, 20)
    
    return data


def demo_basic_filter():
    """Demonstrate basic filter functionality"""
    print("=== Basic Filter Demo ===")
    
    # Create sample data
    data = create_sample_data()
    print(f"Original data shape: {data.shape}")
    print(f"Sample data:\n{data.head()}\n")
    
    # Create filter engine
    engine = AdvancedFilterEngine()
    
    # Define a simple filter
    json_filter = {
        "logic": "AND",
        "conditions": [
            {
                "left": {"type": "column", "name": "close"},
                "operator": ">",
                "right": {"type": "constant", "value": 155}
            }
        ]
    }
    
    # Apply filter
    result = engine.apply_filter(data, json_filter)
    print(f"Filtered data shape: {result.shape}")
    print(f"Filtered data (close > 155):\n{result[['date', 'close', 'volume']]}\n")


def demo_multiple_conditions():
    """Demonstrate multiple conditions with AND logic"""
    print("=== Multiple Conditions (AND) Demo ===")
    
    # Create sample data
    data = create_sample_data()
    
    # Create filter engine
    engine = AdvancedFilterEngine()
    
    # Define filter with multiple conditions
    json_filter = {
        "logic": "AND",
        "conditions": [
            {
                "left": {"type": "column", "name": "close"},
                "operator": ">",
                "right": {"type": "constant", "value": 155}
            },
            {
                "left": {"type": "column", "name": "volume"},
                "operator": ">",
                "right": {"type": "constant", "value": 2500000}
            }
        ]
    }
    
    # Apply filter
    result = engine.apply_filter(data, json_filter)
    print(f"Filtered data shape: {result.shape}")
    print(f"Filtered data (close > 155 AND volume > 2,500,000):\n{result[['date', 'close', 'volume']]}\n")


def demo_or_conditions():
    """Demonstrate multiple conditions with OR logic"""
    print("=== Multiple Conditions (OR) Demo ===")
    
    # Create sample data
    data = create_sample_data()
    
    # Create filter engine
    engine = AdvancedFilterEngine()
    
    # Define filter with OR conditions
    json_filter = {
        "logic": "OR",
        "conditions": [
            {
                "left": {"type": "column", "name": "close"},
                "operator": ">",
                "right": {"type": "constant", "value": 160}
            },
            {
                "left": {"type": "column", "name": "close"},
                "operator": "<",
                "right": {"type": "constant", "value": 150}
            }
        ]
    }
    
    # Apply filter
    result = engine.apply_filter(data, json_filter)
    print(f"Filtered data shape: {result.shape}")
    print(f"Filtered data (close > 160 OR close < 150):\n{result[['date', 'close', 'volume']]}\n")


def demo_column_comparison():
    """Demonstrate column comparison"""
    print("=== Column Comparison Demo ===")
    
    # Create sample data
    data = create_sample_data()
    
    # Create filter engine
    engine = AdvancedFilterEngine()
    
    # Define filter comparing columns
    json_filter = {
        "logic": "AND",
        "conditions": [
            {
                "left": {"type": "column", "name": "close"},
                "operator": ">",
                "right": {"type": "column", "name": "open"}
            }
        ]
    }
    
    # Apply filter
    result = engine.apply_filter(data, json_filter)
    print(f"Filtered data shape: {result.shape}")
    print(f"Filtered data (close > open):\n{result[['date', 'open', 'close', 'volume']]}\n")


def demo_indicator_filter():
    """Demonstrate indicator-based filter"""
    print("=== Indicator Filter Demo ===")
    
    # Create sample data
    data = create_sample_data()
    
    # Create filter engine
    engine = AdvancedFilterEngine()
    
    # Define filter with indicator
    json_filter = {
        "logic": "AND",
        "conditions": [
            {
                "left": {"type": "indicator", "name": "sma", "column": "close", "params": [5]},
                "operator": ">",
                "right": {"type": "constant", "value": 155}
            }
        ]
    }
    
    # Apply filter
    result = engine.apply_filter(data, json_filter)
    print(f"Filtered data shape: {result.shape}")
    print(f"Filtered data (SMA(5) > 155):\n{result[['date', 'close', 'sma_20', 'volume']]}\n")


def demo_validation():
    """Demonstrate filter validation"""
    print("=== Filter Validation Demo ===")
    
    # Create filter engine
    engine = AdvancedFilterEngine()
    
    # Valid filter
    valid_filter = {
        "logic": "AND",
        "conditions": [
            {
                "left": {"type": "column", "name": "close"},
                "operator": ">",
                "right": {"type": "constant", "value": 150}
            }
        ]
    }
    
    is_valid, error_msg = engine.validate_filter(valid_filter)
    print(f"Valid filter: {is_valid}")
    print(f"Message: {error_msg}")
    
    # Invalid filter
    invalid_filter = {
        "logic": "INVALID",
        "conditions": []
    }
    
    is_valid, error_msg = engine.validate_filter(invalid_filter)
    print(f"\nInvalid filter: {is_valid}")
    print(f"Message: {error_msg}")
    
    # Show supported operators
    print(f"\nSupported operators: {engine.get_supported_operators()}")


if __name__ == "__main__":
    print("Advanced Filter Engine Demo")
    print("=" * 50)
    
    demo_basic_filter()
    demo_multiple_conditions()
    demo_or_conditions()
    demo_column_comparison()
    demo_indicator_filter()
    demo_validation()
    
    print("\nDemo completed successfully!")