# JSON-Based Filtering System API Reference

## Overview

This document provides a comprehensive API reference for the JSON-Based Filtering System. The system consists of several interconnected components that work together to provide advanced filtering capabilities for stock market data.

## Core Components

### 1. JSONFilterParser

The `JSONFilterParser` class is responsible for validating and parsing JSON filter expressions.

#### Class Definition

```python
class JSONFilterParser:
    """
    JSON Filter Parser for validating and parsing JSON-based filter expressions.
    
    This class provides functionality to:
    - Validate JSON filter structure against a schema
    - Parse operands into structured format
    - Build executable filter expressions
    """
```

#### Constructor

```python
def __init__(self):
    """Initialize the JSONFilterParser with schema validation."""
```

#### Methods

##### `validate_json(json_data: dict) -> Tuple[bool, str]`

**Description**: Validate JSON data against the schema.

**Parameters**:
- `json_data` (dict): JSON data to validate

**Returns**:
- `Tuple[bool, str]`: (is_valid, error_message)

**Example**:
```python
parser = JSONFilterParser()
is_valid, error_msg = parser.validate_json(json_filter)
if not is_valid:
    print(f"Invalid JSON: {error_msg}")
```

##### `parse_operands(operand_data: dict) -> dict`

**Description**: Parse operand into structured format.

**Parameters**:
- `operand_data` (dict): Operand data to parse

**Returns**:
- `dict`: Parsed operand structure

**Raises**:
- `ValueError`: If operand type is invalid or required fields are missing

**Example**:
```python
column_operand = {
    "type": "column",
    "name": "close",
    "timeframe": "daily",
    "offset": 0
}
parsed = parser.parse_operands(column_operand)
```

##### `build_filter_expression(conditions: list, logic: str) -> str`

**Description**: Build executable filter expression from conditions.

**Parameters**:
- `conditions` (list): List of parsed conditions
- `logic` (str): Logic operator ("AND" or "OR")

**Returns**:
- `str`: Executable filter expression

**Raises**:
- `ValueError`: If logic operator is invalid or conditions are empty

**Example**:
```python
conditions = [parsed_condition1, parsed_condition2]
expression = parser.build_filter_expression(conditions, "AND")
```

##### `get_supported_operators() -> List[str]`

**Description**: Get list of supported operators.

**Returns**:
- `List[str]`: List of supported operators

**Example**:
```python
operators = parser.get_supported_operators()
print(operators)  # ['>', '<', '>=', '<=', '==', '!=']
```

##### `get_supported_indicators() -> List[str]`

**Description**: Get list of supported indicators.

**Returns**:
- `List[str]`: List of supported indicators

**Example**:
```python
indicators = parser.get_supported_indicators()
print(indicators)  # ['sma', 'ema']
```

##### `get_supported_timeframes() -> List[str]`

**Description**: Get list of supported timeframes.

**Returns**:
- `List[str]`: List of supported timeframes

**Example**:
```python
timeframes = parser.get_supported_timeframes()
print(timeframes)  # ['daily', 'weekly', 'intraday']
```

### 2. OperandCalculator

The `OperandCalculator` class handles calculation of different types of operands.

#### Class Definition

```python
class OperandCalculator:
    """
    Calculator for handling different types of operands in JSON-based filters.
    
    This class provides functionality to:
    - Calculate column values with offset support
    - Calculate technical indicators with offset support
    - Apply timeframe offsets to time series data
    - Return constant values for constant operands
    """
```

#### Constructor

```python
def __init__(self, data: pd.DataFrame):
    """
    Initialize the OperandCalculator with data.
    
    Args:
        data (pd.DataFrame): DataFrame containing the stock data
    """
```

#### Methods

##### `calculate_column(operand: dict) -> pd.Series`

**Description**: Calculate column value with offset support.

**Parameters**:
- `operand` (dict): Operand dictionary with column information

**Returns**:
- `pd.Series`: Column values with offset applied

**Raises**:
- `ValueError`: If column name is invalid or offset is out of bounds

**Example**:
```python
column_operand = {
    "type": "column",
    "name": "close",
    "timeframe": "daily",
    "offset": 0
}
column_values = calculator.calculate_column(column_operand)
```

##### `calculate_indicator(operand: dict) -> pd.Series`

**Description**: Calculate indicator value with offset support.

**Parameters**:
- `operand` (dict): Operand dictionary with indicator information

**Returns**:
- `pd.Series`: Indicator values with offset applied

**Raises**:
- `ValueError`: If indicator name, column, or parameters are invalid

**Example**:
```python
sma_operand = {
    "type": "indicator",
    "name": "sma",
    "params": [20],
    "column": "close",
    "timeframe": "daily",
    "offset": 0
}
sma_values = calculator.calculate_indicator(sma_operand)
```

##### `calculate_constant(operand: dict) -> float`

**Description**: Return constant value.

**Parameters**:
- `operand` (dict): Operand dictionary with constant value

**Returns**:
- `float`: Constant value

**Raises**:
- `ValueError`: If value is not a number

**Example**:
```python
constant_operand = {
    "type": "constant",
    "value": 100.0
}
constant_value = calculator.calculate_constant(constant_operand)
```

##### `calculate_operand(operand: dict) -> Union[pd.Series, float]`

**Description**: Calculate operand based on its type.

**Parameters**:
- `operand` (dict): Operand dictionary

**Returns**:
- `Union[pd.Series, float]`: Calculated operand value

**Raises**:
- `ValueError`: If operand type is invalid or required fields are missing

**Example**:
```python
# Calculate any operand type
result = calculator.calculate_operand(operand)
```

##### `apply_offset(series: pd.Series, offset: int) -> pd.Series`

**Description**: Apply timeframe offset to series.

**Parameters**:
- `series` (pd.Series): Input data series
- `offset` (int): Number of periods to offset (positive = future, negative = past)

**Returns**:
- `pd.Series`: Offset series with NaN values for out-of-bounds positions

**Raises**:
- `ValueError`: If offset is not an integer

**Example**:
```python
# Get previous day's close
previous_close = calculator.apply_offset(data['close'], -1)
```

##### `get_supported_indicators() -> list`

**Description**: Get list of supported indicators.

**Returns**:
- `list`: List of supported indicator names

**Example**:
```python
indicators = calculator.get_supported_indicators()
print(indicators)  # ['sma', 'ema', 'rsi', 'macd', 'bollinger_bands']
```

##### `get_supported_columns() -> list`

**Description**: Get list of supported columns.

**Returns**:
- `list`: List of supported column names

**Example**:
```python
columns = calculator.get_supported_columns()
print(columns)  # ['open', 'high', 'low', 'close', 'volume', ...]
```

##### `validate_operand(operand: dict) -> tuple[bool, str]`

**Description**: Validate operand structure and values.

**Parameters**:
- `operand` (dict): Operand dictionary to validate

**Returns**:
- `tuple[bool, str]`: (is_valid, error_message)

**Example**:
```python
is_valid, error_msg = calculator.validate_operand(operand)
if not is_valid:
    print(f"Invalid operand: {error_msg}")
```

### 3. AdvancedFilterEngine

The `AdvancedFilterEngine` class applies JSON-based filters to pandas DataFrames.

#### Class Definition

```python
class AdvancedFilterEngine:
    """
    Advanced Filter Engine for applying JSON-based filters to pandas DataFrames.
    
    This class provides functionality to:
    - Parse and validate JSON filter expressions
    - Apply complex filters with multiple conditions and logic operators
    - Evaluate individual conditions and return boolean masks
    - Combine multiple conditions using AND/OR logic
    """
```

#### Constructor

```python
def __init__(self):
    """Initialize the AdvancedFilterEngine with JSONFilterParser and OperandCalculator."""
```

#### Methods

##### `apply_filter(data: pd.DataFrame, json_filter: dict) -> pd.DataFrame`

**Description**: Apply JSON filter to data.

**Parameters**:
- `data` (pd.DataFrame): DataFrame containing the data to filter
- `json_filter` (dict): JSON filter expression to apply

**Returns**:
- `pd.DataFrame`: Filtered DataFrame containing only matching rows

**Raises**:
- `ValueError`: If JSON filter is invalid or data is incompatible
- `TypeError`: If input types are incorrect

**Example**:
```python
filter_engine = AdvancedFilterEngine()
filtered_data = filter_engine.apply_filter(data, json_filter)
```

##### `evaluate_condition(data: pd.DataFrame, condition: dict) -> pd.Series`

**Description**: Evaluate single condition and return boolean mask.

**Parameters**:
- `data` (pd.DataFrame): DataFrame containing the data
- `condition` (dict): Condition dictionary with left operand, operator, and right operand

**Returns**:
- `pd.Series`: Boolean series indicating which rows satisfy the condition

**Raises**:
- `ValueError`: If condition structure is invalid or operands cannot be evaluated
- `KeyError`: If required fields are missing from condition

**Example**:
```python
condition = {
    "left": {"type": "column", "name": "close", "offset": 0},
    "operator": ">",
    "right": {"type": "constant", "value": 100.0}
}
mask = filter_engine.evaluate_condition(data, condition)
```

##### `combine_results(results: list, logic: str) -> pd.Series`

**Description**: Combine condition results with logic operator.

**Parameters**:
- `results` (list): List of boolean Series from individual conditions
- `logic` (str): Logic operator ("AND" or "OR")

**Returns**:
- `pd.Series`: Combined boolean series

**Raises**:
- `ValueError`: If logic operator is invalid or results list is empty

**Example**:
```python
# Combine multiple condition results
combined_mask = filter_engine.combine_results([mask1, mask2, mask3], "AND")
```

##### `validate_filter(json_filter: dict) -> Tuple[bool, str]`

**Description**: Validate JSON filter structure.

**Parameters**:
- `json_filter` (dict): JSON filter to validate

**Returns**:
- `Tuple[bool, str]`: (is_valid, error_message)

**Example**:
```python
is_valid, error_msg = filter_engine.validate_filter(json_filter)
if not is_valid:
    print(f"Invalid filter: {error_msg}")
```

##### `get_supported_operators() -> List[str]`

**Description**: Get list of supported operators.

**Returns**:
- `List[str]`: List of supported operators

**Example**:
```python
operators = filter_engine.get_supported_operators()
print(operators)  # ['>', '<', '>=', '<=', '==', '!=']
```

##### `get_supported_indicators() -> List[str]`

**Description**: Get list of supported indicators.

**Returns**:
- `List[str]`: List of supported indicators

**Example**:
```python
indicators = filter_engine.get_supported_indicators()
print(indicators)  # ['sma', 'ema', 'rsi', 'macd', 'bollinger_bands']
```

##### `get_supported_columns() -> List[str]`

**Description**: Get list of supported columns.

**Returns**:
- `List[str]`: List of supported column names

**Example**:
```python
columns = filter_engine.get_supported_columns()
print(columns)  # ['open', 'high', 'low', 'close', 'volume', ...]
```

### 4. JSONFilterUI

The `JSONFilterUI` class provides user interface components for JSON-based filter editing and validation.

#### Class Definition

```python
class JSONFilterUI:
    """UI components for JSON-based filter editing and validation"""
```

#### Constructor

```python
def __init__(self):
    """Initialize the JSONFilterUI with parser"""
```

#### Methods

##### `render_json_editor() -> Optional[dict]`

**Description**: Render JSON editor interface with syntax highlighting.

**Returns**:
- `Optional[dict]`: JSON data from editor or None if invalid

**Example**:
```python
json_filter_ui = JSONFilterUI()
json_data = json_filter_ui.render_json_editor()
```

##### `render_validation_feedback(json_data: dict) -> None`

**Description**: Show validation feedback for JSON data.

**Parameters**:
- `json_data` (dict): JSON data to validate

**Example**:
```python
json_filter_ui.render_validation_feedback(json_data)
```

##### `render_filter_preview(json_data: dict, data: pd.DataFrame) -> None`

**Description**: Show filter preview with sample results.

**Parameters**:
- `json_data` (dict): Valid JSON filter data
- `data` (pd.DataFrame): Sample data for preview

**Example**:
```python
json_filter_ui.render_filter_preview(json_data, sample_data)
```

##### `get_example_filters() -> dict`

**Description**: Get example filter templates.

**Returns**:
- `dict`: Dictionary of example filter templates

**Example**:
```python
examples = json_filter_ui.get_example_filters()
print(examples.keys())  # ['basic_filters', 'technical_indicators', 'complex_patterns', 'volume_analysis']
```

## Data Flow

### Typical Usage Pattern

```python
# 1. Initialize components
parser = JSONFilterParser()
calculator = OperandCalculator(data)
filter_engine = AdvancedFilterEngine()

# 2. Validate JSON filter
is_valid, error_msg = parser.validate_json(json_filter)
if not is_valid:
    raise ValueError(error_msg)

# 3. Apply filter
filtered_data = filter_engine.apply_filter(data, json_filter)

# 4. Display results
print(f"Found {len(filtered_data)} matching records")
```

### Integration with Streamlit

```python
# In a Streamlit application
json_filter_ui = JSONFilterUI()

# Render JSON editor
json_data = json_filter_ui.render_json_editor()

if json_data is not None:
    # Show validation feedback
    json_filter_ui.render_validation_feedback(json_data)
    
    # Show filter preview
    json_filter_ui.render_filter_preview(json_data, data)
    
    # Apply filter
    if st.button("Apply Filter"):
        filtered_data = advanced_filter_engine.apply_filter(data, json_data)
        st.success(f"Found {len(filtered_data)} matches!")
```

## Error Handling

### Common Error Types

1. **JSONValidationError**: Raised when JSON structure is invalid
2. **OperandError**: Raised when operand structure or values are invalid
3. **FilterError**: Raised when filter application fails
4. **DataError**: Raised when data is incompatible with filter

### Error Handling Best Practices

```python
try:
    # Apply filter
    filtered_data = filter_engine.apply_filter(data, json_filter)
except ValueError as e:
    # Handle validation errors
    st.error(f"Filter validation failed: {str(e)}")
except KeyError as e:
    # Handle missing columns
    st.error(f"Missing required column: {str(e)}")
except Exception as e:
    # Handle unexpected errors
    st.error(f"Unexpected error: {str(e)}")
```

## Performance Considerations

### Memory Optimization

- Use appropriate data types for large datasets
- Consider chunking for very large datasets
- Use caching for repeated calculations

### Calculation Optimization

- Pre-calculate indicators when possible
- Use vectorized operations
- Minimize data copying

### Best Practices

1. **Validate before applying**: Always validate JSON filters before applying them
2. **Use appropriate data types**: Ensure data is in the correct format
3. **Handle missing data**: Account for NaN values in calculations
4. **Test with sample data**: Test filters with small datasets first
5. **Monitor performance**: Track execution time for large datasets

## Version History

### Version 1.0.0
- Initial release with core JSON filtering functionality
- Support for basic operators and indicators
- Integration with Streamlit application

## Future Enhancements

- Support for custom indicators
- Multi-timeframe analysis
- Real-time data processing
- Advanced caching mechanisms
- Performance monitoring and reporting