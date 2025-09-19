# JSON-Based Filtering System Error Handling Guide

## Overview

This guide provides comprehensive error handling examples and best practices for the JSON-Based Filtering System. Proper error handling is essential for building robust applications that can gracefully handle various failure scenarios.

## Error Types and Categories

### 1. JSON Schema Errors
- **ValidationError**: JSON structure doesn't match schema
- **JSONDecodeError**: Invalid JSON syntax
- **TypeError**: Wrong data types in JSON

### 2. Operand Errors
- **InvalidOperandTypeError**: Unsupported operand type
- **MissingRequiredFieldError**: Required field missing from operand
- **InvalidParameterValueError**: Invalid parameter values
- **OffsetRangeError**: Offset beyond data range

### 3. Filter Application Errors
- **EmptyDataError**: Empty input data
- **ColumnNotFoundError**: Required column not found in data
- **IndicatorCalculationError**: Error calculating technical indicators
- **OperatorError**: Invalid operator or operator application

### 4. Data Processing Errors
- **DataTypeError**: Incompatible data types
- **MemoryError**: Insufficient memory for processing
- **PerformanceError**: Processing timeout or performance threshold exceeded

## Error Handling Examples

### Example 1: Comprehensive JSON Validation

```python
import json
from jsonschema import validate, ValidationError
from typing import Tuple, Dict, Any

class JSONValidationError(Exception):
    """Custom exception for JSON validation errors."""
    pass

class JSONValidator:
    """Comprehensive JSON validator with detailed error reporting."""
    
    def __init__(self):
        self.schema = self._get_validation_schema()
    
    def _get_validation_schema(self) -> Dict[str, Any]:
        """Get JSON validation schema."""
        return {
            "type": "object",
            "properties": {
                "logic": {
                    "type": "string",
                    "enum": ["AND", "OR"],
                    "description": "Logic operator for combining conditions"
                },
                "conditions": {
                    "type": "array",
                    "minItems": 1,
                    "maxItems": 50,
                    "items": {
                        "type": "object",
                        "properties": {
                            "left": {"$ref": "#/definitions/operand"},
                            "operator": {
                                "type": "string",
                                "enum": [">", "<", ">=", "<=", "==", "!="]
                            },
                            "right": {"$ref": "#/definitions/operand"}
                        },
                        "required": ["left", "operator", "right"],
                        "additionalProperties": False
                    }
                }
            },
            "required": ["logic", "conditions"],
            "additionalProperties": False,
            "definitions": {
                "operand": {
                    "type": "object",
                    "properties": {
                        "type": {
                            "type": "string",
                            "enum": ["column", "indicator", "constant"]
                        },
                        "name": {"type": "string"},
                        "timeframe": {
                            "type": "string",
                            "enum": ["daily", "weekly", "intraday"]
                        },
                        "offset": {"type": "integer", "minimum": 0},
                        "params": {
                            "type": "array",
                            "items": {"type": "number"}
                        },
                        "column": {"type": "string"},
                        "value": {"type": "number"}
                    },
                    "oneOf": [
                        {
                            "properties": {
                                "type": {"const": "column"},
                                "name": {"type": "string"}
                            },
                            "required": ["type", "name"]
                        },
                        {
                            "properties": {
                                "type": {"const": "indicator"},
                                "name": {"type": "string"},
                                "column": {"type": "string"},
                                "params": {"type": "array"}
                            },
                            "required": ["type", "name", "column"]
                        },
                        {
                            "properties": {
                                "type": {"const": "constant"},
                                "value": {"type": "number"}
                            },
                            "required": ["type", "value"]
                        }
                    ]
                }
            }
        }
    
    def validate_json(self, json_data: Dict[str, Any]) -> Tuple[bool, str, Dict[str, Any]]:
        """
        Validate JSON data with detailed error reporting.
        
        Args:
            json_data (Dict[str, Any]): JSON data to validate
            
        Returns:
            Tuple[bool, str, Dict[str, Any]]: (is_valid, error_message, error_details)
        """
        try:
            # Basic JSON structure validation
            if not isinstance(json_data, dict):
                return False, "JSON must be an object", {"type": "type_error"}
            
            # Check required fields
            required_fields = ["logic", "conditions"]
            missing_fields = [field for field in required_fields if field not in json_data]
            
            if missing_fields:
                return False, f"Missing required fields: {', '.join(missing_fields)}", {
                    "type": "missing_fields",
                    "fields": missing_fields
                }
            
            # Validate logic operator
            logic = json_data.get("logic")
            if logic not in ["AND", "OR"]:
                return False, f"Invalid logic operator: {logic}. Must be 'AND' or 'OR'", {
                    "type": "invalid_logic",
                    "provided": logic,
                    "expected": ["AND", "OR"]
                }
            
            # Validate conditions
            conditions = json_data.get("conditions", [])
            if not isinstance(conditions, list):
                return False, "Conditions must be an array", {
                    "type": "invalid_type",
                    "field": "conditions",
                    "expected": "array"
                }
            
            if len(conditions) == 0:
                return False, "At least one condition is required", {
                    "type": "empty_conditions"
                }
            
            if len(conditions) > 50:
                return False, "Maximum 50 conditions allowed", {
                    "type": "too_many_conditions",
                    "provided": len(conditions),
                    "max_allowed": 50
                }
            
            # Validate individual conditions
            condition_errors = []
            for i, condition in enumerate(conditions):
                error = self._validate_condition(condition, i)
                if error:
                    condition_errors.append(error)
            
            if condition_errors:
                return False, f"Validation errors in {len(condition_errors)} conditions", {
                    "type": "condition_errors",
                    "errors": condition_errors
                }
            
            # Full schema validation
            validate(instance=json_data, schema=self.schema)
            
            return True, "JSON validation successful", {}
            
        except ValidationError as e:
            return False, f"Schema validation error: {e.message}", {
                "type": "schema_error",
                "path": list(e.path),
                "message": e.message,
                "validator": e.validator,
                "validator_value": e.validator_value
            }
        except json.JSONDecodeError as e:
            return False, f"JSON syntax error: {str(e)}", {
                "type": "json_syntax_error",
                "position": e.pos,
                "lineno": e.lineno,
                "colno": e.colno
            }
        except Exception as e:
            return False, f"Unexpected validation error: {str(e)}", {
                "type": "unexpected_error",
                "error": str(e),
                "error_type": type(e).__name__
            }
    
    def _validate_condition(self, condition: Dict[str, Any], index: int) -> Dict[str, Any]:
        """Validate a single condition."""
        errors = []
        
        # Check required fields
        required_fields = ["left", "operator", "right"]
        missing_fields = [field for field in required_fields if field not in condition]
        
        if missing_fields:
            errors.append({
                "field": "condition",
                "index": index,
                "error": f"Missing required fields: {', '.join(missing_fields)}",
                "type": "missing_fields"
            })
            return errors
        
        # Validate operator
        operator = condition["operator"]
        valid_operators = [">", "<", ">=", "<=", "==", "!="]
        if operator not in valid_operators:
            errors.append({
                "field": "operator",
                "index": index,
                "error": f"Invalid operator: {operator}",
                "type": "invalid_operator",
                "provided": operator,
                "expected": valid_operators
            })
        
        # Validate operands
        for operand_name in ["left", "right"]:
            operand = condition[operand_name]
            operand_error = self._validate_operand(operand, operand_name, index)
            if operand_error:
                errors.append(operand_error)
        
        return errors if errors else None
    
    def _validate_operand(self, operand: Dict[str, Any], operand_name: str, condition_index: int) -> Dict[str, Any]:
        """Validate a single operand."""
        errors = []
        
        # Check required type
        if "type" not in operand:
            return {
                "field": f"{operand_name}.type",
                "index": condition_index,
                "error": "Operand type is required",
                "type": "missing_type"
            }
        
        operand_type = operand["type"]
        
        # Validate based on type
        if operand_type == "column":
            required_fields = ["name"]
            optional_fields = ["timeframe", "offset"]
        elif operand_type == "indicator":
            required_fields = ["name", "column"]
            optional_fields = ["params", "timeframe", "offset"]
        elif operand_type == "constant":
            required_fields = ["value"]
            optional_fields = []
        else:
            return {
                "field": f"{operand_name}.type",
                "index": condition_index,
                "error": f"Invalid operand type: {operand_type}",
                "type": "invalid_operand_type",
                "provided": operand_type,
                "expected": ["column", "indicator", "constant"]
            }
        
        # Check required fields
        missing_fields = [field for field in required_fields if field not in operand]
        if missing_fields:
            errors.append({
                "field": f"{operand_name}.{missing_fields[0]}",
                "index": condition_index,
                "error": f"Missing required field: {missing_fields[0]}",
                "type": "missing_required_field"
            })
        
        # Validate field values
        if operand_type == "column" and "name" in operand:
            if not isinstance(operand["name"], str) or not operand["name"].strip():
                errors.append({
                    "field": f"{operand_name}.name",
                    "index": condition_index,
                    "error": "Column name must be a non-empty string",
                    "type": "invalid_value"
                })
        
        elif operand_type == "indicator":
            if "name" in operand and not isinstance(operand["name"], str):
                errors.append({
                    "field": f"{operand_name}.name",
                    "index": condition_index,
                    "error": "Indicator name must be a string",
                    "type": "invalid_value"
                })
            
            if "column" in operand and not isinstance(operand["column"], str):
                errors.append({
                    "field": f"{operand_name}.column",
                    "index": condition_index,
                    "error": "Indicator column must be a string",
                    "type": "invalid_value"
                })
            
            if "params" in operand:
                if not isinstance(operand["params"], list):
                    errors.append({
                        "field": f"{operand_name}.params",
                        "index": condition_index,
                        "error": "Indicator params must be an array",
                        "type": "invalid_type"
                    })
                else:
                    for i, param in enumerate(operand["params"]):
                        if not isinstance(param, (int, float)):
                            errors.append({
                                "field": f"{operand_name}.params[{i}]",
                                "index": condition_index,
                                "error": f"Parameter {i} must be a number",
                                "type": "invalid_value"
                            })
        
        elif operand_type == "constant":
            if "value" in operand and not isinstance(operand["value"], (int, float)):
                errors.append({
                    "field": f"{operand_name}.value",
                    "index": condition_index,
                    "error": "Constant value must be a number",
                    "type": "invalid_value"
                })
        
        return errors[0] if errors else None

# Usage example
def validate_json_filter_example():
    """Example of using the JSON validator."""
    validator = JSONValidator()
    
    # Test case 1: Valid JSON
    valid_json = {
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
            }
        ]
    }
    
    is_valid, error_msg, details = validator.validate_json(valid_json)
    print(f"Valid JSON: {is_valid}")
    if not is_valid:
        print(f"Error: {error_msg}")
        print(f"Details: {details}")
    
    # Test case 2: Invalid JSON
    invalid_json = {
        "logic": "INVALID",
        "conditions": [
            {
                "left": {
                    "type": "column"
                    # Missing required 'name' field
                },
                "operator": ">",
                "right": {
                    "type": "constant",
                    "value": "not_a_number"  # Invalid value type
                }
            }
        ]
    }
    
    is_valid, error_msg, details = validator.validate_json(invalid_json)
    print(f"\nInvalid JSON: {is_valid}")
    if not is_valid:
        print(f"Error: {error_msg}")
        print(f"Details: {details}")
```

### Example 2: Robust Filter Application with Error Handling

```python
import pandas as pd
from typing import Dict, Any, Optional, Tuple
import traceback

class FilterApplicationError(Exception):
    """Base exception for filter application errors."""
    pass

class EmptyDataError(FilterApplicationError):
    """Raised when input data is empty."""
    pass

class ColumnNotFoundError(FilterApplicationError):
    """Raised when required column is not found."""
    pass

class IndicatorCalculationError(FilterApplicationError):
    """Raised when indicator calculation fails."""
    pass

class OperatorApplicationError(FilterApplicationError):
    """Raised when operator application fails."""
    pass

class RobustFilterEngine:
    """Filter engine with comprehensive error handling."""
    
    def __init__(self):
        self.parser = JSONFilterParser()
        self.calculator = None
    
    def apply_filter_with_error_handling(self, data: pd.DataFrame, json_filter: Dict[str, Any]) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """
        Apply filter with comprehensive error handling and detailed reporting.
        
        Args:
            data (pd.DataFrame): Input data
            json_filter (Dict[str, Any]): JSON filter
            
        Returns:
            Tuple[pd.DataFrame, Dict[str, Any]]: (filtered_data, error_report)
        """
        error_report = {
            "success": False,
            "error_type": None,
            "error_message": None,
            "error_details": {},
            "performance_metrics": {},
            "warnings": [],
            "data_info": {}
        }
        
        try:
            # Validate input data
            data_validation = self._validate_input_data(data)
            if not data_validation["valid"]:
                error_report.update({
                    "error_type": "data_validation_error",
                    "error_message": data_validation["error"],
                    "error_details": data_validation["details"]
                })
                return pd.DataFrame(), error_report
            
            # Store data info
            error_report["data_info"] = {
                "original_rows": len(data),
                "original_columns": list(data.columns),
                "memory_usage_mb": data.memory_usage(deep=True).sum() / 1024 / 1024,
                "date_range": {
                    "start": data['date'].min() if 'date' in data.columns else None,
                    "end": data['date'].max() if 'date' in data.columns else None
                }
            }
            
            # Validate JSON filter
            json_validator = JSONValidator()
            is_valid, error_msg, details = json_validator.validate_json(json_filter)
            
            if not is_valid:
                error_report.update({
                    "error_type": "json_validation_error",
                    "error_message": error_msg,
                    "error_details": details
                })
                return pd.DataFrame(), error_report
            
            # Initialize calculator
            self.calculator = OperandCalculator(data)
            
            # Apply filter with performance monitoring
            import time
            start_time = time.time()
            
            filtered_data = self.apply_filter(data, json_filter)
            
            end_time = time.time()
            
            # Update performance metrics
            error_report["performance_metrics"] = {
                "execution_time_seconds": end_time - start_time,
                "filtered_rows": len(filtered_data),
                "filter_efficiency": len(filtered_data) / len(data) * 100 if len(data) > 0 else 0,
                "memory_usage_after_mb": filtered_data.memory_usage(deep=True).sum() / 1024 / 1024 if not filtered_data.empty else 0
            }
            
            # Check for warnings
            if len(filtered_data) == 0:
                error_report["warnings"].append("Filter returned no results - consider adjusting filter criteria")
            
            if len(filtered_data) / len(data) > 0.9:
                error_report["warnings"].append("Filter is very broad - consider adding more specific conditions")
            
            # Success
            error_report["success"] = True
            error_report["error_type"] = None
            error_report["error_message"] = None
            
            return filtered_data, error_report
            
        except EmptyDataError as e:
            error_report.update({
                "error_type": "empty_data_error",
                "error_message": str(e),
                "error_details": {"data_shape": data.shape if hasattr(data, 'shape') else None}
            })
            return pd.DataFrame(), error_report
            
        except ColumnNotFoundError as e:
            error_report.update({
                "error_type": "column_not_found_error",
                "error_message": str(e),
                "error_details": {"missing_column": str(e).split("'")[1] if "'" in str(e) else None}
            })
            return pd.DataFrame(), error_report
            
        except IndicatorCalculationError as e:
            error_report.update({
                "error_type": "indicator_calculation_error",
                "error_message": str(e),
                "error_details": {"indicator": str(e).split("'")[1] if "'" in str(e) else None}
            })
            return pd.DataFrame(), error_report
            
        except OperatorApplicationError as e:
            error_report.update({
                "error_type": "operator_application_error",
                "error_message": str(e),
                "error_details": {"operator": str(e).split("'")[1] if "'" in str(e) else None}
            })
            return pd.DataFrame(), error_report
            
        except Exception as e:
            error_report.update({
                "error_type": "unexpected_error",
                "error_message": f"Unexpected error: {str(e)}",
                "error_details": {
                    "error_type": type(e).__name__,
                    "traceback": traceback.format_exc(),
                    "line_number": traceback.extract_tb(e.__traceback__)[-1].lineno if traceback.extract_tb(e.__traceback__) else None
                }
            })
            return pd.DataFrame(), error_report
    
    def _validate_input_data(self, data: pd.DataFrame) -> Dict[str, Any]:
        """Validate input data and return validation result."""
        if not isinstance(data, pd.DataFrame):
            return {
                "valid": False,
                "error": "Input must be a pandas DataFrame",
                "details": {"provided_type": type(data).__name__}
            }
        
        if data.empty:
            return {
                "valid": False,
                "error": "Input data is empty",
                "details": {"data_shape": data.shape}
            }
        
        # Check for required columns
        required_columns = ['date', 'symbol', 'close']
        missing_columns = [col for col in required_columns if col not in data.columns]
        
        if missing_columns:
            return {
                "valid": False,
                "error": f"Missing required columns: {', '.join(missing_columns)}",
                "details": {"missing_columns": missing_columns, "available_columns": list(data.columns)}
            }
        
        return {"valid": True}
    
    def apply_filter(self, data: pd.DataFrame, json_filter: Dict[str, Any]) -> pd.DataFrame:
        """Apply filter with basic error handling."""
        # Basic validation
        if data.empty:
            raise EmptyDataError("Cannot apply filter to empty data")
        
        # Check for required columns
        required_columns = ['date', 'symbol', 'close']
        for col in required_columns:
            if col not in data.columns:
                raise ColumnNotFoundError(f"Required column '{col}' not found in data")
        
        # Initialize calculator
        self.calculator = OperandCalculator(data)
        
        # Apply filter logic
        logic = json_filter.get('logic', 'AND')
        conditions = json_filter.get('conditions', [])
        
        if not conditions:
            return data.copy()
        
        # Evaluate conditions
        condition_results = []
        for i, condition in enumerate(conditions):
            try:
                result = self.evaluate_condition(data, condition)
                condition_results.append(result)
            except Exception as e:
                raise IndicatorCalculationError(f"Error evaluating condition {i + 1}: {str(e)}")
        
        # Combine results
        if len(condition_results) == 1:
            combined_mask = condition_results[0]
        else:
            combined_mask = self.combine_results(condition_results, logic)
        
        # Apply mask
        filtered_data = data[combined_mask].copy()
        
        return filtered_data
    
    def evaluate_condition(self, data: pd.DataFrame, condition: Dict[str, Any]) -> pd.Series:
        """Evaluate single condition with error handling."""
        try:
            left_operand = condition['left']
            operator = condition['operator']
            right_operand = condition['right']
            
            # Calculate operand values
            left_value = self._calculate_operand_value(left_operand, data)
            right_value = self._calculate_operand_value(right_operand, data)
            
            # Apply operator
            return self._apply_operator(left_value, right_value, operator)
            
        except Exception as e:
            raise OperatorApplicationError(f"Error applying operator '{operator}': {str(e)}")
    
    def _calculate_operand_value(self, operand: Dict[str, Any], data: pd.DataFrame):
        """Calculate operand value with error handling."""
        operand_type = operand.get('type')
        
        if operand_type == 'constant':
            return operand['value']
        else:
            if self.calculator is None:
                raise ValueError("OperandCalculator not initialized")
            return self.calculator.calculate_operand(operand)
    
    def _apply_operator(self, left_value, right_value, operator: str):
        """Apply operator with error handling."""
        try:
            if operator == '>':
                return left_value > right_value
            elif operator == '<':
                return left_value < right_value
            elif operator == '>=':
                return left_value >= right_value
            elif operator == '<=':
                return left_value <= right_value
            elif operator == '==':
                return left_value == right_value
            elif operator == '!=':
                return left_value != right_value
            else:
                raise ValueError(f"Unsupported operator: {operator}")
        except Exception as e:
            raise OperatorApplicationError(f"Error applying operator '{operator}': {str(e)}")
    
    def combine_results(self, results: list, logic: str) -> pd.Series:
        """Combine condition results with error handling."""
        if not results:
            raise ValueError("Cannot combine empty results list")
        
        logic = logic.upper()
        if logic not in ['AND', 'OR']:
            raise ValueError(f"Invalid logic operator: {logic}")
        
        if len(results) == 1:
            return results[0]
        
        # Ensure all results have the same index
        base_index = results[0].index
        aligned_results = []
        
        for result in results:
            if not isinstance(result, pd.Series):
                raise ValueError("All results must be pandas Series")
            
            if result.index.equals(base_index):
                aligned_results.append(result)
            else:
                aligned_result = result.reindex(base_index, fill_value=False)
                aligned_results.append(aligned_result)
        
        # Apply logic operator
        if logic == 'AND':
            combined = pd.concat(aligned_results).groupby(level=0).all()
        else:  # OR
            combined = pd.concat(aligned_results).groupby(level=0).any()
        
        return combined.astype(bool)

# Usage example
def robust_filter_application_example():
    """Example of using the robust filter engine."""
    # Create sample data
    data = pd.DataFrame({
        'date': pd.date_range('2020-01-01', periods=100, freq='D'),
        'symbol': ['AAPL'] * 100,
        'open': [100 + i for i in range(100)],
        'high': [105 + i for i in range(100)],
        'low': [95 + i for i in range(100)],
        'close': [102 + i for i in range(100)],
        'volume': [1000000 + i * 10000 for i in range(100)]
    })
    
    # Test filter
    test_filter = {
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
                    "value": 150.0
                }
            }
        ]
    }
    
    # Apply filter with error handling
    filter_engine = RobustFilterEngine()
    filtered_data, error_report = filter_engine.apply_filter_with_error_handling(data, test_filter)
    
    print(f"Filter Application Result:")
    print(f"Success: {error_report['success']}")
    print(f"Error Type: {error_report['error_type']}")
    print(f"Error Message: {error_report['error_message']}")
    print(f"Filtered Rows: {error_report['performance_metrics']['filtered_rows']}")
    print(f"Execution Time: {error_report['performance_metrics']['execution_time_seconds']:.3f} seconds")
    
    if error_report['warnings']:
        print(f"Warnings: {error_report['warnings']}")
```

### Example 3: Streamlit Error Handling Integration

```python
import streamlit as st
import pandas as pd
from typing import Dict, Any, Optional

class StreamlitErrorHandler:
    """Streamlit-specific error handling with user-friendly messages."""
    
    def __init__(self):
        self.error_styles = {
            "error": "❌",
            "warning": "⚠️",
            "info": "ℹ️",
            "success": "✅"
        }
    
    def handle_json_validation_error(self, error_details: Dict[str, Any]) -> None:
        """Display JSON validation error in Streamlit."""
        error_type = error_details.get("type", "unknown_error")
        
        if error_type == "missing_fields":
            missing_fields = error_details.get("fields", [])
            st.error(f"{self.error_styles['error']} Missing required fields: {', '.join(missing_fields)}")
            
        elif error_type == "invalid_logic":
            provided = error_details.get("provided")
            expected = error_details.get("expected", [])
            st.error(f"{self.error_styles['error']} Invalid logic operator: '{provided}'. Must be one of: {', '.join(expected)}")
            
        elif error_type == "condition_errors":
            errors = error_details.get("errors", [])
            st.error(f"{self.error_styles['error']} Found {len(errors)} validation errors in conditions:")
            
            for error in errors:
                field = error.get("field", "unknown")
                index = error.get("index", "unknown")
                error_msg = error.get("error", "unknown error")
                
                with st.expander(f"Condition {index + 1} - {field}", expanded=False):
                    st.error(f"{self.error_styles['error']} {error_msg}")
                    
                    # Show helpful suggestions
                    if error.get("type") == "missing_required_field":
                        field_name = error.get("field", "").split(".")[-1]
                        st.info(f"{self.error_styles['info']} Suggestion: Add the '{field_name}' field to your operand")
                        
                    elif error.get("type") == "invalid_value":
                        st.info(f"{self.error_styles['info']} Suggestion: Check the data type and value format")
                        
        elif error_type == "schema_error":
            path = error_details.get("path", [])
            message = error_details.get("message", "Unknown schema error")
            st.error(f"{self.error_styles['error']} Schema validation error at {'.'.join(str(p) for p in path)}: {message}")
            
        elif error_type == "json_syntax_error":
            position = error_details.get("position", 0)
            st.error(f"{self.error_styles['error')} JSON syntax error at position {position}")
            st.info(f"{self.error_styles['info']} Tip: Use a JSON validator like JSONLint to check your syntax")
            
        else:
            st.error(f"{self.error_styles['error']} JSON validation failed: {error_details.get('message', 'Unknown error')}")
    
    def handle_filter_application_error(self, error_report: Dict[str, Any]) -> None:
        """Display filter application error in Streamlit."""
        if not error_report.get("success", False):
            error_type = error_report.get("error_type")
            
            if error_type == "data_validation_error":
                error_msg = error_report.get("error_message", "Unknown data error")
                st.error(f"{self.error_styles['error']} Data validation failed: {error_msg}")
                
            elif error_type == "json_validation_error":
                self.handle_json_validation_error(error_report.get("error_details", {}))
                
            elif error_type == "empty_data_error":
                st.error(f"{self.error_styles['error']} Cannot apply filter: No data available")
                st.info(f"{self.error_styles['info']} Please upload and process data first")
                
            elif error_type == "column_not_found_error":
                missing_column = error_report.get("error_details", {}).get("missing_column")
                st.error(f"{self.error_styles['error']} Column not found: '{missing_column}'")
                st.info(f"{self.error_styles['info']} Available columns: {', '.join(error_report.get('data_info', {}).get('original_columns', []))}")
                
            elif error_type == "indicator_calculation_error":
                st.error(f"{self.error_styles['error']} Indicator calculation failed")
                st.info(f"{self.error_styles['info']} Check your indicator parameters and data availability")
                
            elif error_type == "operator_application_error":
                st.error(f"{self.error_styles['error']} Operator application failed")
                st.info(f"{self.error_styles['info']} Check your operator and operand types")
                
            elif error_type == "unexpected_error":
                st.error(f"{self.error_styles['error']} Unexpected error occurred")
                st.error(f"Error: {error_report.get('error_message', 'Unknown error')}")
                
                # Show detailed error for debugging (in development mode)
                if st.secrets.get("DEBUG_MODE", False):
                    with st.expander("Technical Details"):
                        st.code(error_report.get('error_details', {}).get('traceback', 'No traceback available'))
                        
            else:
                st.error(f"{self.error_styles['error']} Filter application failed")
                st.error(f"Error: {error_report.get('error_message', 'Unknown error')}")
        
        # Display warnings
        warnings = error_report.get("warnings", [])
        if warnings:
            st.warning(f"{self.error_styles['warning']} Filter warnings:")
            for warning in warnings:
                st.write(f"• {warning}")
    
    def display_performance_metrics(self, error_report: Dict[str, Any]) -> None:
        """Display performance metrics in Streamlit."""
        metrics = error_report.get("performance_metrics", {})
        
        if metrics:
            col1, col2, col3 = st.columns(3)
            
            with col1:
                st.metric(
                    "Execution Time",
                    f"{metrics.get('execution_time_seconds', 0):.3f}s",
                    delta=None
                )
            
            with col2:
                st.metric(
                    "Filtered Rows",
                    metrics.get('filtered_rows', 0),
                    delta=f"{metrics.get('filter_efficiency', 0):.1f}%"
                )
            
            with col3:
                st.metric(
                    "Memory Usage",
                    f"{metrics.get('memory_usage_after_mb', 0):.1f}MB",
                    delta=None
                )
    
    def display_data_info(self, error_report: Dict[str, Any]) -> None:
        """Display data information in Streamlit."""
        data_info = error_report.get("data_info", {})
        
        if data_info:
            with st.expander("Data Information", expanded=False):
                st.write(f"**Original Rows:** {data_info.get('original_rows', 0)}")
                st.write(f"**Original Columns:** {', '.join(data_info.get('original_columns', []))}")
                st.write(f"**Memory Usage:** {data_info.get('memory_usage_mb', 0):.1f}MB")
                
                date_range = data_info.get('date_range', {})
                if date_range.get('start') and date_range.get('end'):
                    st.write(f"**Date Range:** {date_range['start'].date()} to {date_range['end'].date()}")

# Usage example in Streamlit
def streamlit_error_handling_example():
    """Example of Streamlit error handling integration."""
    
    # Initialize error handler
    error_handler = StreamlitErrorHandler()
    
    # Create sample data
    data = pd.DataFrame({
        'date': pd.date_range('2020-01-01', periods=100, freq='D'),
        'symbol': ['AAPL'] * 100,
        'open': [100 + i for i in range(100)],
        'high': [105 + i for i in range(100)],
        'low': [95 + i for i in range(100)],
        'close': [102 + i for i in range(100)],
        'volume': [1000000 + i * 10000 for i in range(100)]
    })
    
    # Test filter with various error scenarios
    test_filters = {
        "valid_filter": {
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
                        "value": 150.0
                    }
                }
            ]
        },
        
        "invalid_logic": {
            "logic": "INVALID",
            "conditions": [
                {
                    "left": {"type": "column", "name": "close"},
                    "operator": ">",
                    "right": {"type": "constant", "value": 100}
                }
            ]
        },
        
        "missing_field": {
            "logic": "AND",
            "conditions": [
                {
                    "left": {"type": "column"},  # Missing 'name' field
                    "operator": ">",
                    "right": {"type": "constant", "value": 100}
                }
            ]
        }
    }
    
    # Create filter selector
    filter_option = st.selectbox("Select Filter Type", list(test_filters.keys()))
    
    # Apply filter
    filter_engine = RobustFilterEngine()
    filtered_data, error_report = filter_engine.apply_filter_with_error_handling(
        data, test_filters[filter_option]
    )
    
    # Display results with error handling
    if error_report.get("success"):
        st.success(f"{error_handler.error_styles['success']} Filter applied successfully!")
        
        # Display performance metrics
        error_handler.display_performance_metrics(error_report)
        
        # Display filtered data
        st.write("Filtered Data:")
        st.dataframe(filtered_data)
        
    else:
        # Handle errors
        error_handler.handle_filter_application_error(error_report)
        
        # Display data info
        error_handler.display_data_info(error_report)
```

### Example 4: Logging and Monitoring

```python
import logging
import json
from datetime import datetime
from typing import Dict, Any, Optional

class FilterLogger:
    """Comprehensive logging for filter operations."""
    
    def __init__(self, log_file: str = "filter_operations.log"):
        self.log_file = log_file
        self._setup_logging()
    
    def _setup_logging(self):
        """Setup logging configuration."""
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(self.log_file),
                logging.StreamHandler()
            ]
        )
        
        self.logger = logging.getLogger('FilterLogger')
    
    def log_filter_application(self, 
                             data_info: Dict[str, Any],
                             json_filter: Dict[str, Any],
                             error_report: Dict[str, Any]) -> None:
        """Log filter application attempt."""
        log_entry = {
            "timestamp": datetime.now().isoformat(),
            "operation": "filter_application",
            "data_info": data_info,
            "filter_summary": self._get_filter_summary(json_filter),
            "error_report": error_report,
            "performance_metrics": error_report.get("performance_metrics", {}),
            "success": error_report.get("success", False)
        }
        
        if error_report.get("success"):
            self.logger.info(f"Filter applied successfully: {log_entry}")
        else:
            self.logger.error(f"Filter application failed: {log_entry}")
    
    def log_json_validation(self, 
                          json_data: Dict[str, Any],
                          validation_result: Dict[str, Any]) -> None:
        """Log JSON validation attempt."""
        log_entry = {
            "timestamp": datetime.now().isoformat(),
            "operation": "json_validation",
            "filter_summary": self._get_filter_summary(json_data),
            "validation_result": validation_result,
            "is_valid": validation_result.get("is_valid", False)
        }
        
        if validation_result.get("is_valid"):
            self.logger.info(f"JSON validation successful: {log_entry}")
        else:
            self.logger.warning(f"JSON validation failed: {log_entry}")
    
    def log_performance_issue(self, 
                            operation: str,
                            metrics: Dict[str, Any],
                            threshold: Dict[str, float]) -> None:
        """Log performance issues."""
        issues = []
        
        if metrics.get("execution_time_seconds", 0) > threshold.get("max_execution_time", 10):
            issues.append(f"Execution time {metrics['execution_time_seconds']:.2f}s exceeds threshold {threshold['max_execution_time']}s")
        
        if metrics.get("memory_usage_mb", 0) > threshold.get("max_memory_usage", 100):
            issues.append(f"Memory usage {metrics['memory_usage_mb']:.2f}MB exceeds threshold {threshold['max_memory_usage']}MB")
        
        if issues:
            log_entry = {
                "timestamp": datetime.now().isoformat(),
                "operation": "performance_issue",
                "operation_type": operation,
                "metrics": metrics,
                "thresholds": threshold,
                "issues": issues
            }
            self.logger.warning(f"Performance issue detected: {log_entry}")
    
    def _get_filter_summary(self, json_filter: Dict[str, Any]) -> Dict[str, Any]:
        """Get summary of filter for logging."""
        return {
            "logic": json_filter.get("logic"),
            "condition_count": len(json_filter.get("conditions", [])),
            "has_indicators": any(
                cond.get("left", {}).get("type") == "indicator" or 
                cond.get("right", {}).get("type") == "indicator"
                for cond in json_filter.get("conditions", [])
            ),
            "has_constants": any(
                cond.get("left", {}).get("type") == "constant" or 
                cond.get("right", {}).get("type") == "constant"
                for cond in json_filter.get("conditions", [])
            )
        }

# Usage example
def logging_example():
    """Example of using the filter logger."""
    logger = FilterLogger()
    
    # Sample data and filter
    data_info = {
        "original_rows": 1000,
        "original_columns": ["date", "symbol", "close", "volume"],
        "memory_usage_mb": 45.2
    }
    
    json_filter = {
        "logic": "AND",
        "conditions": [
            {
                "left": {"type": "column", "name": "close"},
                "operator": ">",
                "right": {"type": "constant", "value": 100}
            }
        ]
    }
    
    error_report = {
        "success": True,
        "performance_metrics": {
            "execution_time_seconds": 0.5,
            "filtered_rows": 150,
            "memory_usage_after_mb": 6.8
        }
    }
    
    # Log filter application
    logger.log_filter_application(data_info, json_filter, error_report)
    
    # Log performance issue
    performance_metrics = {
        "execution_time_seconds": 15.2,
        "memory_usage_mb": 150.5
    }
    
    threshold = {
        "max_execution_time": 10,
        "max_memory_usage": 100
    }
    
    logger.log_performance_issue("filter_application", performance_metrics, threshold)
```

## Error Recovery Strategies

### 1. Graceful Degradation

```python
class GracefulFilterEngine:
    """Filter engine that gracefully handles errors and provides fallbacks."""
    
    def __init__(self):
        self.parser = JSONFilterParser()
        self.calculator = None
        self.fallback_filters = self._create_fallback_filters()
    
    def _create_fallback_filters(self) -> Dict[str, str]:
        """Create simple fallback filters for common scenarios."""
        return {
            "price_above_sma": "close > sma_20",
            "high_volume": "volume > volume_sma_20 * 1.5",
            "rsi_overbought": "rsi > 70",
            "price_increase": "close > close_1d"
        }
    
    def apply_filter_with_fallback(self, data: pd.DataFrame, json_filter: Dict[str, Any]) -> Tuple[pd.DataFrame, str]:
        """
        Apply filter with fallback to simple filters if complex filter fails.
        
        Args:
            data (pd.DataFrame): Input data
            json_filter (Dict[str, Any]): JSON filter
            
        Returns:
            Tuple[pd.DataFrame, str]: (filtered_data, filter_used)
        """
        try:
            # Try to apply the complex JSON filter
            filtered_data = self.apply_filter(data, json_filter)
            filter_used = "json_filter"
            
        except Exception as e:
            # Fallback to simple filters
            self.logger.warning(f"Complex filter failed: {str(e)}. Trying fallback filters...")
            
            filtered_data = None
            filter_used = "fallback"
            
            # Try each fallback filter
            for filter_name, filter_string in self.fallback_filters.items():
                try:
                    filtered_data = self.apply_simple_filter(data, filter_string)
                    if len(filtered_data) > 0:
                        filter_used = f"fallback_{filter_name}"
                        break
                except Exception:
                    continue
            
            if filtered_data is None:
                # Last resort: return all data
                filtered_data = data.copy()
                filter_used = "no_filter"
        
        return filtered_data, filter_used
    
    def apply_simple_filter(self, data: pd.DataFrame, filter_string: str) -> pd.DataFrame:
        """Apply simple string-based filter as fallback."""
        # This would use the existing filter engine
        from filters_module import FilterEngine
        filter_engine = FilterEngine()
        return filter_engine.apply_filter(data, filter_string)
```

### 2. User-Friendly Error Messages

```python
class UserFriendlyErrorHandler:
    """Provide user-friendly error messages and suggestions."""
    
    def __init__(self):
        self.error_suggestions = {
            "missing_column": {
                "message": "The specified column was not found in your data.",
                "suggestions": [
                    "Check the column name spelling",
                    "Ensure the column exists in your dataset",
                    "Use the column selector to see available columns"
                ]
            },
            "invalid_json": {
                "message": "Your JSON filter has syntax errors.",
                "suggestions": [
                    "Use a JSON validator to check your syntax",
                    "Copy examples from the documentation",
                    "Check for missing commas or brackets"
                ]
            },
            "no_results": {
                "message": "Your filter returned no results.",
                "suggestions": [
                    "Try less restrictive conditions",
                    "Check if your data contains the expected values",
                    "Use the preview feature to test individual conditions"
                ]
            },
            "performance_issue": {
                "message": "Filter processing is taking longer than expected.",
                "suggestions": [
                    "Try filtering on a smaller date range",
                    "Use simpler conditions",
                    "Consider using pre-calculated indicators"
                ]
            }
        }
    
    def get_user_friendly_error(self, error_type: str, context: Dict[str, Any] = None) -> Dict[str, str]:
        """Get user-friendly error message and suggestions."""
        error_info = self.error_suggestions.get(error_type, {
            "message": "An unexpected error occurred.",
            "suggestions": ["Please try again or contact support."]
        })
        
        result = {
            "title": error_info["message"],
            "suggestions": error_info["suggestions"]
        }
        
        # Add context-specific information
        if context:
            if error_type == "missing_column" and "available_columns" in context:
                result["available_columns"] = context["available_columns"]
            elif error_type == "no_results" and "total_rows" in context:
                result["data_summary"] = f"Your dataset contains {context['total_rows']} rows"