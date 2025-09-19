# JSON-Based Filtering System Specification

## Overview
This document specifies the implementation of a JSON-based filtering system for the stock scanner application. The new system will provide advanced filtering capabilities with structured JSON format, supporting complex conditions with indicators, timeframes, and offsets.

## Architecture

### 1. JSON Filter Schema

```json
{
  "logic": "AND" | "OR",
  "conditions": [
    {
      "left": {
        "type": "column" | "indicator" | "constant",
        "name": "string",
        "timeframe": "daily" | "weekly" | "intraday",
        "offset": integer,
        "params": array,
        "column": "string"
      },
      "operator": ">" | "<" | ">=" | "<=" | "==" | "!=",
      "right": {
        "type": "column" | "indicator" | "constant",
        "name": "string",
        "timeframe": "daily" | "weekly" | "intraday",
        "offset": integer,
        "params": array,
        "column": "string"
      }
    }
  ]
}
```

### 2. Component Architecture

#### JSONFilterParser
- **Purpose**: Parse and validate JSON filter structure
- **Methods**:
  - `validate_schema(json_data)`: Validate JSON against schema
  - `parse_operands(operand_data)`: Parse individual operands
  - `build_expression(conditions, logic)`: Build executable filter expression

#### OperandCalculator
- **Purpose**: Calculate values for different operand types
- **Methods**:
  - `calculate_column(data, operand)`: Get column value with offset
  - `calculate_indicator(data, operand)`: Calculate indicator value
  - `apply_offset(series, offset)`: Apply timeframe offset

#### AdvancedFilterEngine
- **Purpose**: Execute JSON-based filters
- **Methods**:
  - `apply_filter(data, json_filter)`: Main filter application
  - `evaluate_condition(data, condition)`: Evaluate single condition
  - `combine_results(results, logic)`: Combine condition results

### 3. Operand Types

#### Column Operand
```json
{
  "type": "column",
  "name": "close",
  "timeframe": "daily",
  "offset": 0
}
```
- **name**: Column name (close, open, high, low, volume)
- **timeframe**: Data timeframe (daily only for now)
- **offset**: Number of periods to offset (0 = current, -1 = previous)

#### Indicator Operand
```json
{
  "type": "indicator",
  "name": "sma",
  "params": [50],
  "column": "close",
  "timeframe": "daily",
  "offset": 0
}
```
- **name**: Indicator name (sma, ema)
- **params**: Indicator parameters (period for SMA/EMA)
- **column**: Base column for indicator calculation
- **timeframe**: Data timeframe
- **offset**: Offset for the indicator result

#### Constant Operand
```json
{
  "type": "constant",
  "value": 50.0
}
```
- **value**: Fixed numeric value

### 4. Supported Operators

| Operator | Description | Example |
|----------|-------------|---------|
| > | Greater than | close > sma_20 |
| < | Less than | rsi < 30 |
| >= | Greater than or equal | volume >= 1000000 |
| <= | Less than or equal | macd <= 0 |
| == | Equal | close == open |
| != | Not equal | close != open |

### 5. Logic Operators

- **AND**: All conditions must be true
- **OR**: At least one condition must be true

### 6. Implementation Details

#### JSON Validation
- Use `jsonschema` library for strict validation
- Provide detailed error messages for invalid JSON
- Validate operand types and supported indicators

#### Indicator Calculation
- Extend existing `TechnicalIndicators` class
- Support offset-based calculations
- Cache calculated indicators for performance

#### Offset Handling
- For daily data: offset = -1 means previous trading day
- Handle market holidays and missing data
- Provide boundary checks (no offset beyond data availability)

#### Performance Optimization
- Lazy evaluation of operands
- Caching of indicator calculations
- Vectorized operations where possible

### 7. UI Integration

#### JSON Editor
- Streamlit `st.text_area` for JSON input
- Real-time validation with feedback
- Syntax highlighting (if possible)
- Example templates

#### Filter Preview
- Show parsed filter structure
- Display sample evaluation results
- Performance metrics

#### Integration Points
- Replace existing filter builders in "Build Filters" tab
- Add JSON filter option alongside existing filters
- Maintain backward compatibility

### 8. Error Handling

#### JSON Errors
- Malformed JSON syntax
- Missing required fields
- Invalid operator values
- Unsupported indicator names

#### Evaluation Errors
- Missing columns in data
- Invalid indicator parameters
- Offset beyond data range
- Division by zero in calculations

#### User Feedback
- Clear error messages
- Suggest corrections
- Highlight problematic areas in JSON

### 9. Testing Strategy

#### Unit Tests
- JSON schema validation
- Operand calculation accuracy
- Indicator computation with offsets
- Logic operator combinations

#### Integration Tests
- End-to-end filter application
- Performance with large datasets
- Error handling scenarios
- UI component interactions

#### Acceptance Criteria
- JSON filters work correctly with sample data
- Performance meets requirements
- Error handling is robust
- User experience is intuitive

### 10. Migration Path

#### Phase 1: Core Implementation
- Basic JSON parser
- Column and constant operands
- Simple operators
- UI integration

#### Phase 2: Advanced Features
- Indicator operands
- Offset support
- Performance optimization
- Enhanced error handling

#### Phase 3: Production Ready
- Comprehensive testing
- Documentation
- User guides
- Performance tuning

This specification provides a comprehensive foundation for implementing the JSON-based filtering system while maintaining compatibility with the existing application architecture.