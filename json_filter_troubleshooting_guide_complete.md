# JSON-Based Filtering System Troubleshooting Guide

## Overview

This comprehensive troubleshooting guide provides specific scenarios and solutions for common issues encountered when using the JSON-Based Filtering System. Each scenario includes detailed problem descriptions, root cause analysis, step-by-step solutions, and preventive measures.

## Troubleshooting Framework

### Issue Classification

1.  **JSON Syntax Errors**: Malformed JSON structure
2.  **Schema Validation Errors**: Invalid JSON format or content
3.  **Data Processing Errors**: Issues with data handling and transformation
4.  **Performance Issues**: Slow execution or resource problems
5.  **Indicator Calculation Errors**: Problems with technical indicators
6.  **UI Integration Issues**: User interface and interaction problems
7.  **Memory and Resource Issues**: System resource limitations
8.  **Integration Problems**: Issues with external systems and APIs

### Troubleshooting Methodology

1.  **Identify the Problem**: Recognize symptoms and categorize the issue
2.  **Gather Information**: Collect relevant logs, error messages, and system information
3.  **Analyze Root Cause**: Determine the underlying cause of the issue
4.  **Implement Solution**: Apply the appropriate fix or workaround
5.  **Verify Resolution**: Confirm the issue is resolved and no new problems are introduced
6.  **Document Prevention**: Record preventive measures for future reference

## Scenario 1: JSON Syntax Errors

### Problem Description
Users encounter JSON syntax errors when trying to create or edit filters. The error messages are often cryptic and don't provide clear guidance on how to fix the issue.

**Symptoms:**
- "JSONDecodeError: Expecting value: line X column Y"
- "Invalid JSON format" error messages
- JSON editor shows red highlighting but unclear what's wrong
- Filter application fails with syntax-related errors

**Example Error:**
```
JSONDecodeError: Expecting value: line 3 column 5 (char 42)
```

### Root Cause Analysis
1.  **Missing Commas**: Forgetting to add commas between JSON elements
2.  **Extra Commas**: Adding trailing commas in invalid positions
3.  **Quotation Issues**: Using single quotes instead of double quotes
4.  **Bracket Mismatches**: Unclosed or mismatched brackets/braces
5.  **Invalid Escape Sequences**: Improper handling of special characters

### Step-by-Step Solutions

#### Solution 1: JSON Syntax Validation

```python
import json
from json.decoder import JSONDecodeError

def validate_json_syntax(json_string: str) -> dict:
    """
    Validate JSON syntax with detailed error reporting.
    
    Args:
        json_string (str): JSON string to validate
        
    Returns:
        dict: Validation result with detailed error information
    """
    try:
        # Basic syntax validation
        parsed_json = json.loads(json_string)
        
        # Additional structural validation
        if not isinstance(parsed_json, dict):
            return {
                "valid": False,
                "error": "JSON must be an object (dictionary)",
                "error_type": "invalid_structure",
                "suggestion": "Wrap your JSON in curly braces {}"
            }
        
        # Check required fields
        required_fields = ["logic", "conditions"]
        missing_fields = [field for field in required_fields if field not in parsed_json]
        
        if missing_fields:
            return {
                "valid": False,
                "error": f"Missing required fields: {', '.join(missing_fields)}",
                "error_type": "missing_fields",
                "suggestion": f"Add the missing field(s): {', '.join(missing_fields)}"
            }
        
        return {
            "valid": True,
            "message": "JSON syntax is valid",
            "parsed_json": parsed_json
        }
        
    except JSONDecodeError as e:
        return {
            "valid": False,
            "error": f"JSON syntax error: {str(e)}",
            "error_type": "syntax_error",
            "line": e.lineno,
            "column": e.colno,
            "position": e.pos,
            "suggestion": get_syntax_suggestion(str(e))
        }

def get_syntax_suggestion(error_msg: str) -> str:
    """Get specific suggestion based on error message."""
    error_lower = error_msg.lower()
    
    if "expecting value" in error_lower:
        return "Check for missing values or incomplete expressions"
    elif "expecting property name" in error_lower:
        return "Check for missing property names or quotes"
    elif "expecting ':' delimiter" in error_lower:
        return "Check for missing colons between keys and values"
    elif "expecting ',' delimiter" in error_lower:
        return "Check for missing commas between elements"
    elif "invalid escape sequence" in error_lower:
        return "Check for invalid escape sequences in strings"
    else:
        return "Review your JSON syntax carefully"

# Usage example
def json_syntax_validation_example():
    """Example of JSON syntax validation."""
    # Test cases
    test_cases = [
        '{"logic": "AND", "conditions": [{"left": {"type": "column", "name": "close"}, "operator": ">", "right": {"type": "constant", "value": 100}}]}',  # Valid
        '{"logic": "AND", "conditions": [{"left": {"type": "column", "name": "close"}, "operator": ">", "right": {"type": "constant", "value": 100}]}',  # Missing closing brace
        '{"logic": "AND", "conditions": [{"left": {"type": "column", "name": "close"}, "operator": ">", "right": {"type": "constant", "value": 100},}',  # Extra comma
        "{'logic': 'AND', 'conditions': []}",  # Single quotes instead of double
        '{"logic": "AND", "conditions": [{"left": {"type": "column", "name": "close"}, "operator": ">", "right": {"type": "constant", "value": 100}}'  # Missing closing bracket
    ]
    
    for i, test_json in enumerate(test_cases):
        print(f"\nTest Case {i + 1}:")
        print(f"Input: {test_json[:50]}...")
        
        result = validate_json_syntax(test_json)
        
        if result["valid"]:
            print("✅ Valid JSON")
        else:
            print(f"❌ Error: {result['error']}")
            print(f"📍 Line: {result.get('line')}, Column: {result.get('column')}")
            print(f"💡 Suggestion: {result['suggestion']}")
```

#### Solution 2: JSON Auto-Correction

```python
import re

class JSONAutoCorrector:
    """Auto-correct common JSON syntax errors."""
    
    def __init__(self):
        self.correction_rules = [
            (r',\s*}', '}'),  # Remove trailing commas before closing braces
            (r',\s*]', ']'),  # Remove trailing commas before closing brackets
            (r"'([^']*)'", r'"\1"'),  # Convert single quotes to double quotes
            (r'([a-zA-Z_][a-zA-Z0-9_]*)\s*:', r'"\1":'),  # Add quotes to unquoted keys
            (r':\s*([a-zA-Z_][a-zA-Z0-9_]*)', r': "\1"'),  # Add quotes to unquoted string values
            (r'([0-9]+)\s*([,}\]])', r'\1\2'),  # Remove spaces before commas/braces
            (r'([,}\]])\s*([0-9]+)', r'\1\2'),  # Remove spaces after commas/braces
        ]
    
    def auto_correct(self, json_string: str) -> str:
        """
        Auto-correct common JSON syntax errors.
        
        Args:
            json_string (str): JSON string to correct
            
        Returns:
            str: Corrected JSON string
        """
        corrected = json_string
        
        # Apply correction rules
        for pattern, replacement in self.correction_rules:
            corrected = re.sub(pattern, replacement, corrected)
        
        # Try to parse to validate
        try:
            json.loads(corrected)
            return corrected
        except json.JSONDecodeError:
            # If still invalid, return original with detailed error
            return json_string
    
    def suggest_corrections(self, json_string: str) -> List[str]:
        """
        Suggest possible corrections for JSON errors.
        
        Args:
            json_string (str): JSON string with errors
            
        Returns:
            List[str]: List of suggested corrections
        """
        suggestions = []
        
        # Check for common issues
        if "'" in json_string and '"' not in json_string:
            suggestions.append("Convert single quotes to double quotes")
        
        if json_string.count('{') != json_string.count('}'):
            suggestions.append("Check for mismatched curly braces")
        
        if json_string.count('[') != json_string.count(']'):
            suggestions.append("Check for mismatched square brackets")
        
        if json_string.strip().endswith(','):
            suggestions.append("Remove trailing comma at the end")
        
        # Count commas and brackets
        comma_count = json_string.count(',')
        brace_count = json_string.count('}')
        if comma_count > brace_count * 2:
            suggestions.append("Check for extra commas")
        
        return suggestions if suggestions else ["Review your JSON syntax carefully"]

# Usage example
def json_auto_correction_example():
    """Example of JSON auto-correction."""
    corrector = JSONAutoCorrector()
    
    # Test cases with common errors
    test_cases = [
        ('{"logic": "AND", "conditions": [{"left": {"type": "column", "name": "close"}, "operator": ">", "right": {"type": "constant", "value": 100}},]}', "Extra comma"),
        ("{'logic': 'AND', 'conditions': []}", "Single quotes"),
        ('{"logic": "AND", "conditions": [{"left": {"type": "column", "name": "close"}, "operator": ">", "right": {"type": "constant", "value": 100}}', "Missing closing bracket"),
        ('{"logic": "AND", "conditions": [{"left": {"type": "column", "name": "close"}, "operator": ">", "right": {"type": "constant", "value": 100}]}', "Missing closing brace")
    ]
    
    for json_str, description in test_cases:
        print(f"\n{description}:")
        print(f"Original: {json_str}")
        
        # Auto-correct
        corrected = corrector.auto_correct(json_str)
        print(f"Corrected: {corrected}")
        
        # Get suggestions
        suggestions = corrector.suggest_corrections(json_str)
        print(f"Suggestions: {', '.join(suggestions)}")
        
        # Validate
        try:
            json.loads(corrected)
            print("✅ Auto-correction successful!")
        except json.JSONDecodeError:
            print("❌ Auto-correction failed - manual intervention required")
```

### Preventive Measures

1.  **Use JSON Editors**: Provide syntax-highlighted JSON editors with real-time validation
2.  **Template System**: Offer pre-built templates to reduce manual JSON writing
3.  **Auto-completion**: Implement JSON schema-based auto-completion
4.  **Live Validation**: Validate JSON as users type, not just on submission
5.  **Visual Indicators**: Use color coding and icons to highlight syntax issues

## Scenario 2: Schema Validation Errors

### Problem Description
JSON passes syntax validation but fails schema validation due to incorrect structure, missing required fields, or invalid values.

**Symptoms:**
- "Schema validation failed" errors
- "Invalid operator" or "Invalid operand type" messages
- Missing required field warnings
- Invalid value type errors

**Example Error:**
```
Schema validation error: 'logic' is not one of ['AND', 'OR']
```

### Root Cause Analysis
1.  **Invalid Logic Operator**: Using logic values other than "AND" or "OR"
2.  **Missing Required Fields**: Omitting required fields like "conditions" or "operator"
3.  **Invalid Operator Values**: Using unsupported operators like "=" instead of "=="
4.  **Wrong Operand Types**: Using invalid operand types or missing required fields
5.  **Invalid Indicator Parameters**: Providing incorrect parameters for indicators

### Step-by-Step Solutions

#### Solution 1: Enhanced Schema Validation

```python
from jsonschema import validate, ValidationError
from typing import Dict, Any, List, Tuple

class EnhancedSchemaValidator:
    """Enhanced JSON schema validator with detailed error reporting."""
    
    def __init__(self):
        self.schema = self._get_enhanced_schema()
        self.error_messages = {
            "invalid_logic": "Logic must be either 'AND' or 'OR'",
            "missing_conditions": "Filter must have at least one condition",
            "too_many_conditions": "Maximum 50 conditions allowed",
            "invalid_operator": "Operator must be one of: >, <, >=, <=, ==, !=",
            "invalid_operand_type": "Operand type must be 'column', 'indicator', or 'constant'",
            "missing_column_name": "Column operand requires 'name' field",
            "missing_indicator_name": "Indicator operand requires 'name' field",
            "missing_indicator_column": "Indicator operand requires 'column' field",
            "invalid_constant_value": "Constant operand requires numeric 'value' field",
            "invalid_indicator_params": "Indicator 'params' must be an array of numbers"
        }
    
    def _get_enhanced_schema(self) -> Dict[str, Any]:
        """Get enhanced JSON schema with detailed validation rules."""
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
                            "required": ["type", "name"],
                            "additionalProperties": False
                        },
                        {
                            "properties": {
                                "type": {"const": "indicator"},
                                "name": {"type": "string"},
                                "column": {"type": "string"},
                                "params": {"type": "array"}
                            },
                            "required": ["type", "name", "column"],
                            "additionalProperties": False
                        },
                        {
                            "properties": {
                                "type": {"const": "constant"},
                                "value": {"type": "number"}
                            },
                            "required": ["type", "value"],
                            "additionalProperties": False
                        }
                    ]
                }
            }
        }
    
    def validate_with_details(self, json_data: Dict[str, Any]) -> Tuple[bool, str, Dict[str, Any]]:
        """
        Validate JSON with detailed error reporting.
        
        Args:
            json_data (Dict[str, Any]): JSON data to validate
            
        Returns:
            Tuple[bool, str, Dict[str, Any]]: (is_valid, error_message, error_details)
        """
        try:
            # Basic structure validation
            validation_result = self._validate_basic_structure(json_data)
            if not validation_result["valid"]:
                return False, validation_result["error"], validation_result["details"]
            
            # Schema validation
            validate(instance=json_data, schema=self.schema)
            
            return True, "Validation successful", {}
            
        except ValidationError as e:
            return self._handle_validation_error(e)
        except Exception as e:
            return False, f"Unexpected validation error: {str(e)}", {"error": str(e)}
    
    def _validate_basic_structure(self, json_data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate basic JSON structure before schema validation."""
        if not isinstance(json_data, dict):
            return {
                "valid": False,
                "error": "JSON must be an object",
                "details": {"type": "invalid_json_type", "provided": type(json_data).__name__}
            }
        
        # Check required fields
        required_fields = ["logic", "conditions"]
        missing_fields = [field for field in required_fields if field not in json_data]
        
        if missing_fields:
            return {
                "valid": False,
                "error": f"Missing required fields: {', '.join(missing_fields)}",
                "details": {"type": "missing_fields", "fields": missing_fields}
            }
        
        # Validate logic operator
        logic = json_data.get("logic")
        if logic not in ["AND", "OR"]:
            return {
                "valid": False,
                "error": self.error_messages["invalid_logic"],
                "details": {"type": "invalid_logic", "provided": logic}
            }
        
        # Validate conditions
        conditions = json_data.get("conditions", [])
        if not isinstance(conditions, list):
            return {
                "valid": False,
                "error": "Conditions must be an array",
                "details": {"type": "invalid_conditions_type"}
            }
        
        if len(conditions) == 0:
            return {
                "valid": False,
                "error": self.error_messages["missing_conditions"],
                "details": {"type": "missing_conditions"}
            }
        
        if len(conditions) > 50:
            return {
                "valid": False,
                "error": self.error_messages["too_many_conditions"],
                "details": {"type": "too_many_conditions", "provided": len(conditions)}
            }
        
        return {"valid": True}
    
    def _handle_validation_error(self, error: ValidationError) -> Tuple[bool, str, Dict[str, Any]]:
        """Handle JSON schema validation errors with detailed reporting."""
        error_path = list(error.path)
        error_message = error.message
        
        # Determine error type and provide helpful message
        if "logic" in error_path:
            return False, self.error_messages["invalid_logic"], {
                "type": "invalid_logic",
                "provided": error.instance,
                "expected": ["AND", "OR"]
            }
        
        elif "operator" in error_path:
            return False, self.error_messages["invalid_operator"], {
                "type": "invalid_operator",
                "provided": error.instance,
                "expected": [">", "<", ">=", "<=", "==", "!="]
            }
        
        elif "conditions" in error_path and "minItems" in error.validator_value:
            return False, self.error_messages["missing_conditions"], {
                "type": "missing_conditions",
                "provided": len(error.instance),
                "minimum": error.validator_value["minItems"]
            }
        
        elif "conditions" in error_path and "maxItems" in error.validator_value:
            return False, self.error_messages["too_many_conditions"], {
                "type": "too_many_conditions",
                "provided": len(error.instance),
                "maximum": error.validator_value["maxItems"]
            }
        
        elif "type" in error.path and error.validator_value["enum"]:
            enum_values = error.validator_value["enum"]
            return False, f"Invalid value: {error.instance}. Must be one of: {', '.join(enum_values)}", {
                "type": "invalid_enum_value",
                "provided": error.instance,
                "expected": enum_values
            }
        
        # Handle operand-specific errors
        elif len(error_path) >= 2 and error_path[-2] in ["left", "right"]:
            operand_type = error.instance.get("type")
            return self._handle_operand_error(operand_type, error)
        
        # Generic validation error
        else:
            return False, f"Schema validation error: {error_message}", {
                "type": "schema_error",
                "path": error_path,
                "message": error_message
            }
    
    def _handle_operand_error(self, operand_type: str, error: ValidationError) -> Tuple[bool, str, Dict[str, Any]]:
        """Handle operand-specific validation errors."""
        if operand_type == "column":
            if "name" in error.path:
                return False, self.error_messages["missing_column_name"], {
                    "type": "missing_column_name",
                    "operand_type": "column"
                }
        
        elif operand_type == "indicator":
            if "name" in error.path:
                return False, self.error_messages["missing_indicator_name"], {
                    "type": "missing_indicator_name",
                    "operand_type": "indicator"
                }
            elif "column" in error.path:
                return False, self.error_messages["missing_indicator_column"], {
                    "type": "missing_indicator_column",
                    "operand_type": "indicator"
                }
            elif "params" in error.path:
                return False, self.error_messages["invalid_indicator_params"], {
                    "type": "invalid_indicator_params",
                    "operand_type": "indicator"
                }
        
        elif operand_type == "constant":
            if "value" in error.path:
                return False, self.error_messages["invalid_constant_value"], {
                    "type": "invalid_constant_value",
                    "operand_type": "constant"
                }
        
        return False, f"Operand validation error: {error.message}", {
            "type": "operand_error",
            "operand_type": operand_type,
            "path": list(error.path)
        }

# Usage example
def enhanced_schema_validation_example():
    """Example of enhanced schema validation."""
    validator = EnhancedSchemaValidator()
    
    # Test cases with various schema errors
    test_cases = [
        # Invalid logic
        {
            "logic": "INVALID",
            "conditions": [{"left": {"type": "column", "name": "close"}, "operator": ">", "right": {"type": "constant", "value": 100}}]
        },
        # Missing conditions
        {
            "logic": "AND",
            "conditions": []
        },
        # Too many conditions
        {"logic": "AND", "conditions": [{"left": {"type": "column", "name": "close"}, "operator": ">", "right": {"type": "constant", "value": 100}}] * 51},
        # Invalid operator
        {
            "logic": "AND",
            "conditions": [{"left": {"type": "column", "name": "close"}, "operator": "INVALID", "right": {"type": "constant", "value": 100}}]
        },
        # Missing column name
        {
            "logic": "AND",
            "conditions": [{"left": {"type": "column"}, "operator": ">", "right": {"type": "constant", "value": 100}}]
        },
        # Missing indicator column
        {
            "logic": "AND",
            "conditions": [{"left": {"type": "indicator", "name": "sma", "params": [20]}, "operator": ">", "right": {"type": "constant", "value": 100}}]
        },
        # Invalid constant value
        {
            "logic": "AND",
            "conditions": [{"left": {"type": "column", "name": "close"}, "operator": ">", "right": {"type": "constant", "value": "not_a_number"}}]
        }
    ]
    
    for i, test_json in enumerate(test_cases):
        print(f"\nTest Case {i + 1}:")
        print(f"Input: {test_json}")
        
        is_valid, error_msg, details = validator.validate_with_details(test_json)
        
        if is_valid:
            print("✅ Valid JSON")
        else:
            print(f"❌ Error: {error_msg}")
            print(f"📋 Details: {details}")
            
            # Provide specific suggestions
            if details.get("type") == "invalid_logic":
                print(f"💡 Suggestion: Change '{test_json['logic']}' to either 'AND' or 'OR'")
            elif details.get("type") == "missing_conditions":
                print("💡 Suggestion: Add at least one condition to your filter")
            elif details.get("type") == "too_many_conditions":
                print(f"💡 Suggestion: Reduce conditions to {details['maximum']} or fewer")
            elif details.get("type") == "invalid_operator":
                print(f"💡 Suggestion: Use one of: >, <, >=, <=, ==, !=")
            elif details.get("type") == "missing_column_name":
                print("💡 Suggestion: Add a 'name' field to your column operand")
            elif details.get("type") == "missing_indicator_column":
                print("💡 Suggestion: Add a 'column' field to your indicator operand")
            elif details.get("type") == "invalid_constant_value":
                print("💡 Suggestion: Use a numeric value for constant operands")
```

### Preventive Measures

1.  **Schema Documentation**: Provide clear documentation of the JSON schema with examples
2.  **Interactive Validation**: Validate JSON in real-time as users build filters
3.  **Field Validation**: Validate individual fields as they are entered
4.  **Template System**: Provide templates that guarantee valid JSON structure
5.  **Auto-completion**: Use schema-based auto-completion for JSON editors

## Scenario 3: Data Processing Errors

### Problem Description
Filters fail to execute due to issues with data processing, such as missing columns, incorrect data types, or data format problems.

**Symptoms:**
- "Column not found" errors
- "Data type mismatch" errors
- "Empty data" warnings
- "Invalid date format" errors
- Memory or performance issues with large datasets

**Example Error:**
```
ColumnNotFoundError: Required column 'close' not found in data
```

### Root Cause Analysis
1.  **Missing Columns**: Required OHLCV columns not present in input data
2.  **Incorrect Data Types**: Columns have wrong data types (e.g., strings instead of numbers)
3.  **Date Format Issues**: Date columns are not in the expected format
4.  **Data Quality Problems**: Missing values, duplicates, or outliers
5.  **Memory Issues**: Large datasets causing memory problems

### Step-by-Step Solutions

#### Solution 1: Comprehensive Data Validation

```python
import pandas as pd
import numpy as np
from typing import Dict, Any, List, Tuple, Optional
from datetime import datetime

class DataValidator:
    """Comprehensive data validator for JSON filter input."""
    
    def __init__(self):
        self.required_columns = ['date', 'symbol', 'open', 'high', 'low', 'close', 'volume']
        self.optional_columns = ['sma_5', 'sma_10', 'sma_20', 'sma_50', 'sma_200', 'rsi', 'macd']
        self.column_types = {
            'date': 'datetime',
            'symbol': 'string',
            'open': 'numeric',
            'high': 'numeric',
            'low': 'numeric',
            'close': 'numeric',
            'volume': 'numeric'
        }
    
    def validate_data(self, data: pd.DataFrame) -> Dict[str, Any]:
        """
        Validate input data for JSON filter processing.
        
        Args:
            data (pd.DataFrame): Input data to validate
            
        Returns:
            Dict[str, Any]: Validation results with detailed information
        """
        validation_result = {
            "valid": True,
            "errors": [],
            "warnings": [],
            "suggestions": [],
            "data_info": {},
            "processing_recommendations": []
        }
        
        try:
            # Check if data is empty
            if data.empty:
                validation_result["valid"] = False
                validation_result["errors"].append("Input data is empty")
                return validation_result
            
            # Get basic data information
            validation_result["data_info"] = self._get_data_info(data)
            
            # Validate required columns
            self._validate_required_columns(data, validation_result)
            
            # Validate column data types
            self._validate_column_types(data, validation_result)
            
            # Validate data quality
            self._validate_data_quality(data, validation_result)
            
            # Validate date range
            self._validate_date_range(data, validation_result)
            
            # Validate data size
            self._validate_data_size(data, validation_result)
            
            # Generate processing recommendations
            validation_result["processing_recommendations"] = self._generate_recommendations(data)
            
        except Exception as e:
            validation_result["valid"] = False
            validation_result["errors"].append(f"Data validation error: {str(e)}")
        
        return validation_result
    
    def _get_data_info(self, data: pd.DataFrame) -> Dict[str, Any]:
        """Get basic information about the data."""
        return {
            "shape": data.shape,
            "columns": list(data.columns),
            "memory_usage_mb": data.memory_usage(deep=True).sum() / 1024 / 1024,
            "dtypes": data.dtypes.to_dict(),
            "null_counts": data.isnull().sum().to_dict(),
            "duplicate_count": data.duplicated().sum()
        }
    
    def _validate_required_columns(self, data: pd.DataFrame, result: Dict[str, Any]) -> None:
        """Validate that all required columns are present."""
        missing_columns = [col for col in self.required_columns if col not in data.columns]
        
        if missing_columns:
            result["valid"] = False
            result["errors"].append(f"Missing required columns: {', '.join(missing_columns)}")
            
            # Provide suggestions
            available_columns = [col for col in self.required_columns if col in data.columns]
            if available_columns:
                result["suggestions"].append(f"Available required columns: {', '.join(available_columns)}")
            
            # Check for similar column names
            similar_columns = self._find_similar_columns(missing_columns, data.columns)
            if similar_columns:
                result["suggestions"].append(f"Did you mean: {', '.join(similar_columns)}?")
    
    def _validate_column_types(self, data: pd.DataFrame, result: Dict[str, Any]) -> None:
        """Validate column data types."""
        for col, expected_type in self.column_types.items():
            if col in data.columns:
                actual_type = str(data[col].dtype)
                
                if expected_type == "datetime" and not pd.api.types.is_datetime64_any_dtype(data[col]):
                    result["warnings"].append(f"Column '{col}' is not in datetime format")
                    result["suggestions"].append(f"Convert '{col}' to datetime using: pd.to_datetime(data['{col}'])")
                
                elif expected_type == "numeric" and not pd.api.types.is_numeric_dtype(data[col]):
                    result["warnings"].append(f"Column '{col}' is not numeric")
                    result["suggestions"].append(f"Convert '{col}' to numeric using: pd.to_numeric(data['{col}'])")
                
                elif expected_type == "string" and not pd.api.types.is_string_dtype(data[col]):
                    result["warnings"].append(f"Column '{col}' is not string type")
                    result["suggestions"].append(f"Convert '{col}' to string using: data['{col}'] = data['{col}'].astype(str)")
    
    def _validate_data_quality(self, data: pd.DataFrame, result: Dict[str, Any]) -> None:
        """Validate data quality issues."""
        # Check for null values
        null_columns = data.columns[data.isnull().any()].tolist()
        if null_columns:
            null_counts = data[null_columns].isnull().sum().to_dict()
            result["warnings"].append(f"Null values found in columns: {', '.join(null_columns)}")
            
            for col, count in null_counts.items():
                percentage = (count / len(data)) * 100
                if percentage > 10:
                    result["suggestions"].append(f"Column '{col}' has {percentage:.1f}% null values - consider data cleaning")
        
        # Check for duplicate rows
        duplicate_count = data.duplicated().sum()
        if duplicate_count > 0:
            result["warnings"].append(f"Found {duplicate_count} duplicate rows")
            result["suggestions"].append("Remove duplicates using: data = data.drop_duplicates()")
        
        # Check for negative values in numeric columns
        numeric_columns = data.select_dtypes(include=[np.number]).columns
        for col in numeric_columns:
            if col in ['open', 'high', 'low', 'close', 'volume']:
                negative_count = (data[col] < 0).sum()
                if negative_count > 0:
                    result["warnings"].append(f"Column '{col}' has {negative_count} negative values")
                    result["suggestions"].append(f"Check data quality for column '{col}'")
    
    def _validate_date_range(self, data: pd.DataFrame, result: Dict[str, Any]) -> None:
        """Validate date range and consistency."""
        if 'date' in data.columns:
            try:
                date_col = pd.to_datetime(data['date'])
                
                # Check date range
                date_range = date_col.max() - date_col.min()
                result["data_info"]["date_range_days"] = date_range.days
                
                # Check for future dates
                future_dates = (date_col > datetime.now()).sum()
                if future_dates > 0:
                    result["warnings"].append(f"Found {future_dates} future dates")
                    result["suggestions"].append("Consider filtering out future dates")
                
                # Check for very old dates
                old_threshold = datetime.now() - pd.DateOffset(years=10)
                old_dates = (date_col < old_threshold).sum()
                if old_dates > 0:
                    result["warnings"].append(f"Found {old_dates} dates older than 10 years")
                    result["suggestions"].append("Consider filtering out very old data")
                
                # Check date sorting
                if not date_col.is_monotonic_increasing:
                    result["warnings"].append("Dates are not sorted in ascending order")
                    result["suggestions"].append("Sort data by date: data = data.sort_values('date')")
                
            except Exception as e:
                result["warnings"].append(f"Date validation error: {str(e)}")
    
    def _validate_data_size(self, data: pd.DataFrame, result: Dict[str, Any]) -> None:
        """Validate data size and memory usage."""
        row_count = len(data)
        memory_mb = result["data_info"]["memory_usage_mb"]
        
        # Check row count
        if row_count > 1000000:
            result["warnings"].append(f"Large dataset: {row_count:,} rows")
            result["suggestions"].append("Consider processing in chunks or filtering by date range")
        
        # Check memory usage
        if memory_mb > 500:
            result["warnings"].append(f"High memory usage: {memory_mb:.1f}MB")
            result["suggestions"].append("Consider optimizing data types or using chunked processing")
    
    def _find_similar_columns(self, missing_columns: List[str], available_columns: List[str]) -> List[str]:
        """Find similar column names for suggestions."""
        similar = []
        
        for missing in missing_columns:
            for available in available_columns:
                # Simple similarity check
                if missing.lower() in available.lower() or available.lower() in missing.lower():
                    similar.append(f"{available} (for {missing})")
        
        return similar
    
    def _generate_recommendations(self, data: pd.DataFrame) -> List[str]:
        """Generate processing recommendations based on data characteristics."""
        recommendations = []
        
        # Data type optimization
        if len(data) > 10000:
            recommendations.append("Consider downcasting numeric columns to reduce memory usage")
        
        # Date filtering
        if 'date' in data.columns:
            date_col = pd.to_datetime(data['date'])
            date_range = date_col.max() - date_col.min()
            if date_range.days > 365:
                recommendations.append("Consider filtering to a recent date range for faster processing")
        
        # Column selection
        column_count = len(data.columns)
        if column_count > 20:
            recommendations.append("Consider selecting only needed columns to reduce memory usage")
        
        # Missing value handling
        null_columns = data.columns[data.isnull().any()].tolist()
        if null_columns:
            recommendations.append("Handle missing values before filtering")
        
        return recommendations

# Usage example
def data_validation_example():
    """Example of comprehensive data validation."""
    # Create sample data with various issues
    data = pd.DataFrame({
        'date': pd.date_range('2020-01-01', periods=1000, freq='D'),
        'symbol': ['AAPL'] * 1000,
        'open': [100 + i for i in range(1000)],
        'high': [105 + i for i in range(1000)],
        'low': [95 + i for i in range(1000)],
        'close': [102 + i for i in range(1000)],
        'volume': [1000000 + i * 10000 for i in range(1000)],
        'extra_column': ['unused'] * 1000  # Extra column
    })
    
    # Add some data quality issues
    data.loc[10:15, 'close'] = np.nan  # Null values
    data = pd.concat([data, data.iloc[0:5]])  # Duplicates
    data.loc[20, 'volume'] = -100000  # Negative value
    
    # Validate data
    validator = DataValidator()
    result = validator.validate_data(data)
    
    print("Data Validation Results:")
    print(f"Valid: {result['valid']}")
    print(f"Data Shape: {result['data_info']['shape']}")
    print(f"Memory Usage: {result['data_info']['memory_usage_mb']:.1f}MB")
    
    if result['errors']:
        print("\n❌ Errors:")
        for error in result['errors']:
            print(f"  - {error}")
    
    if result['warnings']:
        print("\n⚠️ Warnings:")
        for warning in result['warnings']:
            print(f"  - {warning}")
    
    if result['suggestions']:
        print("\n💡 Suggestions:")
        for suggestion in result['suggestions']:
            print(f"  - {suggestion}")
    
    if result['processing_recommendations']:
        print("\n📋 Processing Recommendations:")
        for rec in result['processing_recommendations']:
            print(f"  - {rec}")
```

### Preventive Measures

1.  **Data Quality Checks**: Implement automated data quality validation
2.  **Column Mapping**: Provide column mapping tools for different data formats
3.  **Data Type Optimization**: Automatically optimize data types for better performance
4.  **Memory Management**: Implement chunked processing for large datasets
5.  **Data Profiling**: Provide data profiling reports before processing

## Scenario 4: Performance Issues

### Problem Description
Filters execute slowly or consume excessive resources, especially with large datasets or complex filters.

**Symptoms:**
- Slow filter execution (taking seconds or minutes)
- High memory usage
- CPU spikes during processing
- Timeouts or application freezing
- Poor user experience

**Example Error:**
```
PerformanceWarning: Filter execution took 45.2 seconds - consider optimization
```

### Root Cause Analysis
1.  **Large Dataset Processing**: Processing too many rows at once
2.  **Complex Indicator Calculations**: Expensive indicator computations
3.  **Inefficient Data Structures**: Using inappropriate data structures
4.  **Lack of Caching**: Repeated calculations without caching
5.  **Memory Leaks**: Memory not properly released during processing

### Step-by-Step Solutions

#### Solution 1: Performance Monitoring and Optimization

```python
import time
import psutil
import pandas as pd
import numpy as np
from typing import Dict, Any, List, Optional, Callable
from functools import wraps
import threading
import gc

class PerformanceMonitor:
    """Performance monitoring and optimization for JSON filter processing."""
    
    def __init__(self):
        self.performance_log = []
        self.thresholds = {
            "max_execution_time": 30.0,  # seconds
            "max_memory_usage": 500.0,   # MB
            "max_cpu_usage": 80.0,       # percentage
            "max_rows_per_second": 10000 # rows per second
        }
        self.monitoring_active = False
        self.monitoring_thread = None
    
    def monitor_performance(self, func: Callable) -> Callable:
        """Decorator to monitor function performance."""
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Start monitoring
            start_time = time.time()
            start_memory = self._get_memory_usage()
            start_cpu = self._get_cpu_usage()
            
            try:
                # Execute function
                result = func(*args, **kwargs)
                
                # Calculate metrics
                end_time = time.time()
                end_memory = self._get_memory_usage()
                end_cpu = self._get_cpu_usage()
                
                execution_time = end_time - start_time
                memory_delta = end_memory - start_memory
                cpu_delta = end_cpu - start_cpu
                
                # Log performance
                performance_data = {
                    "function": func.__name__,
                    "execution_time": execution_time,
                    "memory_delta_mb": memory_delta,
                    "cpu_delta_percent": cpu_delta,
                    "start_memory_mb": start_memory,
                    "end_memory_mb": end_memory,
                    "start_cpu_percent": start_cpu,
                    "end_cpu_percent": end_cpu,
                    "timestamp": time.time(),
                    "success": True
                }
                
                self.performance_log.append(performance_data)
                
                # Check performance thresholds
                self._check_performance_thresholds(performance_data)
                
                return result
                
            except Exception as e:
                # Handle errors
                execution_time = time.time() - start_time
                
                performance_data = {
                    "function": func.__name__,
                    "execution_time": execution_time,
                    "memory_delta_mb": self._get_memory_usage() - start_memory,
                    "cpu_delta_percent": self._get_cpu_usage() - start_cpu,
                    "error": str(e),
                    "error_type": type(e).__name__,
                    "timestamp": time.time(),
                    "success": False
                }
                
                self.performance_log.append(performance_data)
                raise
        
        return wrapper
    
    def _get_memory_usage(self) -> float:
        """Get current memory usage in MB."""
        process = psutil.Process()
        return process.memory_info().rss / 1024 / 1024
    
    def _get_cpu_usage(self) -> float:
        """Get current CPU usage percentage."""
        return psutil.cpu_percent()
    
    def _check_performance_thresholds(self, performance_data: Dict[str, Any]) -> None:
        """Check if performance metrics exceed thresholds."""
        alerts = []
        
        # Check execution time
        if performance_data["execution_time"] > self.thresholds["max_execution_time"]:
            alerts.append(f"High execution time: {performance_data['execution_time']:.1f}s")
        
        # Check memory usage
        if performance_data["memory_delta_mb"] > self.thresholds["max_memory_usage"]:
            alerts.append(f"High memory usage: {performance_data['memory_delta_mb']:.1f}MB")
        
        # Check CPU usage
        if performance_data["cpu_delta_percent"] > self.thresholds["max_cpu_usage"]:
            alerts.append(f"High CPU usage: {performance_data['cpu_delta_percent']:.1f}%")
        
        # Log alerts
        if alerts:
            alert_msg = f"Performance Alert for {performance_data['function']}: {'; '.join(alerts)}"
            print(f"⚠️ {alert_msg}")
    
    def get_performance_report(self) -> Dict[str, Any]:
        """Generate performance report."""
        if not self.performance_log:
            return {"message": "No performance data available"}
        
        # Calculate statistics
        execution_times = [log["execution_time"] for log in self.performance_log if log["success"]]
        memory_usage = [log["memory_delta_mb"] for log in self.performance_log if log["success"]]
        cpu_usage = [log["cpu_delta_percent"] for log in self.performance_log if log["success"]]
        
        report = {
            "total_operations": len(self.performance_log),
            "successful_operations": len(execution_times),
            "failed_operations": len(self.performance_log) - len(execution_times),
            "execution_time_stats": {
                "mean": np.mean(execution_times) if execution_times else 0,
                "median": np.median(execution_times) if execution_times else 0,
                "max": np.max(execution_times) if execution_times else 0,
                "min": np.min(execution_times) if execution_times else 0,
                "std": np.std(execution_times) if execution_times else 0
            },
            "memory_usage_stats": {
                "mean": np.mean(memory_usage) if memory_usage else 0,
                "median": np.median(memory_usage) if memory_usage else 0,
                "max": np.max(memory_usage) if memory_usage else 0,
                "min": np.min(memory_usage) if memory_usage else 0
            },
            "cpu_usage_stats": {
                "mean": np.mean(cpu_usage) if cpu_usage else 0,
                "median": np.median(cpu_usage) if cpu_usage else 0,
                "max": np.max(cpu_usage) if cpu_usage else 0,
                "min": np.min(cpu_usage) if cpu_usage else 0
            }
        }
        
        return report

# Usage example
def performance_monitoring_example():
    """Example of performance monitoring."""
    monitor = PerformanceMonitor()
    
    @monitor.monitor_performance
    def slow_filter_operation(data, filter_config):
        """Simulate a slow filter operation."""
        # Simulate processing time
        time.sleep(0.1)
        
        # Simulate memory usage
        dummy_data = [i for i in range(100000)]
        
        # Simulate filtering
        result = data[data['close'] > filter_config['threshold']]
        
        # Clean up
        del dummy_data
        
        return result
    
    # Create sample data
    data = pd.DataFrame({
        'date': pd.date_range('2020-01-01', periods=10000, freq='D'),
        'symbol': np.random.choice(['AAPL', 'GOOGL', 'MSFT'], 10000),
        'close': np.random.uniform(50, 500, 10000),
        'volume': np.random.uniform(1000000, 10000000, 10000)
    })
    
    # Apply filter multiple times
    for i in range(5):
        filter_config = {"threshold": 100 + i * 50}
        result = slow_filter_operation(data, filter_config)
        print(f"Iteration {i+1}: Processed {len(result)} rows")
    
    # Generate performance report
    report = monitor.get_performance_report()
    print("\nPerformance Report:")
    print(f"Total Operations: {report['total_operations']}")
    print(f"Successful Operations: {report['successful_operations']}")
    print(f"Failed Operations: {report['failed_operations']}")
    print(f"Average Execution Time: {report['execution_time_stats']['mean']:.2f}s")
    print(f"Max Memory Usage: {report['memory_usage_stats']['max']:.1f}MB")

#### Solution 2: Memory Optimization

```python
import pandas as pd
import numpy as np
from typing import Dict, Any

class MemoryOptimizer:
    """Memory optimization for large datasets."""
    
    def __init__(self):
        self.optimization_log = []
    
    def optimize_dataframe(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Optimize DataFrame memory usage.
        
        Args:
            df (pd.DataFrame): DataFrame to optimize
            
        Returns:
            pd.DataFrame: Optimized DataFrame
        """
        start_memory = df.memory_usage(deep=True).sum() / 1024**2
        optimized_df = df.copy()
        
        # Optimize numeric columns
        for col in optimized_df.select_dtypes(include=['int64']).columns:
            optimized_df[col] = pd.to_numeric(optimized_df[col], downcast='integer')
        
        for col in optimized_df.select_dtypes(include=['float64']).columns:
            optimized_df[col] = pd.to_numeric(optimized_df[col], downcast='float')
        
        # Optimize object columns
        for col in optimized_df.select_dtypes(include=['object']).columns:
            if optimized_df[col].nunique() / len(optimized_df) < 0.5:  # If cardinality < 50%
                optimized_df[col] = optimized_df[col].astype('category')
        
        end_memory = optimized_df.memory_usage(deep=True).sum() / 1024**2
        reduction = (start_memory - end_memory) / start_memory * 100
        
        self.optimization_log.append({
            "original_memory_mb": start_memory,
            "optimized_memory_mb": end_memory,
            "reduction_percent": reduction,
            "timestamp": pd.Timestamp.now()
        })
        
        print(f"Memory optimization: {start_memory:.1f}MB → {end_memory:.1f}MB ({reduction:.1f}% reduction)")
        
        return optimized_df
    
    def get_optimization_report(self) -> Dict[str, Any]:
        """Get memory optimization report."""
        if not self.optimization_log:
            return {"message": "No optimization performed"}
        
        latest = self.optimization_log[-1]
        return {
            "latest_optimization": latest,
            "total_optimizations": len(self.optimization_log),
            "average_reduction_percent": np.mean([log["reduction_percent"] for log in self.optimization_log])
        }

# Usage example
def memory_optimization_example():
    """Example of memory optimization."""
    optimizer = MemoryOptimizer()
    
    # Create large DataFrame
    data = pd.DataFrame({
        'col1': np.random.randint(0, 1000000, 1000000),
        'col2': np.random.rand(1000000),
        'col3': np.random.choice(['A', 'B', 'C', 'D', 'E'], 1000000)
    })
    
    # Optimize DataFrame
    optimized_data = optimizer.optimize_dataframe(data)
    
    # Get report
    report = optimizer.get_optimization_report()
    print("\nMemory Optimization Report:")
    print(report)

#### Solution 3: Chunked Processing

```python
import pandas as pd
from typing import Dict, Any, List, Callable

class ChunkedProcessor:
    """Process large datasets in chunks to manage memory usage."""
    
    def __init__(self, chunk_size: int = 50000):
        self.chunk_size = chunk_size
        self.processing_log = []
    
    def process_in_chunks(self, 
                          file_path: str, 
                          filter_function: Callable[[pd.DataFrame, Dict[str, Any]], pd.DataFrame],
                          json_filter: Dict[str, Any]) -> pd.DataFrame:
        """
        Process large dataset from file in chunks.
        
        Args:
            file_path (str): Path to the data file
            filter_function (Callable): Function to apply filter to each chunk
            json_filter (Dict[str, Any]): JSON filter to apply
            
        Returns:
            pd.DataFrame: Combined filtered results
        """
        all_results = []
        total_rows_processed = 0
        
        for i, chunk in enumerate(pd.read_csv(file_path, chunksize=self.chunk_size)):
            chunk_start_time = pd.Timestamp.now()
            
            try:
                # Apply filter to chunk
                filtered_chunk = filter_function(chunk, json_filter)
                all_results.append(filtered_chunk)
                
                chunk_end_time = pd.Timestamp.now()
                processing_time = (chunk_end_time - chunk_start_time).total_seconds()
                
                self.processing_log.append({
                    "chunk_number": i + 1,
                    "rows_in_chunk": len(chunk),
                    "filtered_rows": len(filtered_chunk),
                    "processing_time_seconds": processing_time,
                    "status": "completed"
                })
                
                total_rows_processed += len(chunk)
                print(f"Processed chunk {i+1}: {len(chunk)} rows, {len(filtered_chunk)} matches in {processing_time:.2f}s")
                
            except Exception as e:
                self.processing_log.append({
                    "chunk_number": i + 1,
                    "rows_in_chunk": len(chunk),
                    "filtered_rows": 0,
                    "processing_time_seconds": (pd.Timestamp.now() - chunk_start_time).total_seconds(),
                    "status": "failed",
                    "error": str(e)
                })
                print(f"Error processing chunk {i+1}: {str(e)}")
                continue
        
        if all_results:
            final_results = pd.concat(all_results, ignore_index=True)
            print(f"\nTotal rows processed: {total_rows_processed}")
            print(f"Total filtered results: {len(final_results)}")
            return final_results
        else:
            return pd.DataFrame()
    
    def get_processing_report(self) -> Dict[str, Any]:
        """Get chunked processing report."""
        if not self.processing_log:
            return {"message": "No chunked processing performed"}
        
        total_chunks = len(self.processing_log)
        completed_chunks = len([log for log in self.processing_log if log["status"] == "completed"])
        failed_chunks = total_chunks - completed_chunks
        
        total_processing_time = sum([log["processing_time_seconds"] for log in self.processing_log])
        
        return {
            "total_chunks": total_chunks,
            "completed_chunks": completed_chunks,
            "failed_chunks": failed_chunks,
            "total_processing_time_seconds": total_processing_time,
            "average_chunk_time_seconds": total_processing_time / total_chunks if total_chunks > 0 else 0
        }

# Usage example
def chunked_processing_example():
    """Example of chunked processing."""
    # Create a dummy large CSV file
    dummy_data = pd.DataFrame({
        'date': pd.date_range('2020-01-01', periods=200000, freq='D'),
        'symbol': np.random.choice(['AAPL', 'GOOGL', 'MSFT'], 200000),
        'close': np.random.uniform(50, 500, 200000),
        'volume': np.random.uniform(1000000, 10000000, 200000)
    })
    dummy_file_path = "large_stock_data.csv"
    dummy_data.to_csv(dummy_file_path, index=False)
    
    # Define a simple filter function
    def simple_filter_function(data_chunk: pd.DataFrame, json_filter_config: Dict[str, Any]) -> pd.DataFrame:
        threshold = json_filter_config.get("threshold", 100)
        return data_chunk[data_chunk['close'] > threshold]
    
    # Define JSON filter config
    json_filter_config = {"threshold": 250}
    
    # Process in chunks
    processor = ChunkedProcessor(chunk_size=20000)
    filtered_results = processor.process_in_chunks(
        file_path=dummy_file_path,
        filter_function=simple_filter_function,
        json_filter=json_filter_config
    )
    
    print("\nChunked Processing Report:")
    print(processor.get_processing_report())
    
    # Clean up dummy file
    import os
    os.remove(dummy_file_path)

### Preventive Measures

1.  **Profile Regularly**: Use profiling tools to identify performance bottlenecks
2.  **Optimize Data Access**: Minimize I/O operations and use efficient data loading
3.  **Implement Caching**: Cache frequently accessed data and computed results
4.  **Vectorize Operations**: Use vectorized operations instead of loops
5.  **Scale Resources**: Increase CPU, memory, or use distributed computing for very large datasets

## Scenario 5: Indicator Calculation Errors

### Problem Description
Technical indicators fail to calculate correctly or produce unexpected results.

**Symptoms:**
- Indicator columns contain NaN values
- Incorrect indicator values
- Errors during indicator calculation
- Filters based on indicators return no results or unexpected results

**Example Error:**
```
IndicatorCalculationError: Error calculating SMA: window size must be less than or equal to the number of observations
```

### Root Cause Analysis
1.  **Insufficient Data**: Not enough data points for indicator calculation (e.g., SMA(20) on less than 20 data points)
2.  **Missing Base Column**: The base column for indicator calculation is missing
3.  **Invalid Parameters**: Incorrect parameters provided for indicators (e.g., negative period)
4.  **Data Quality Issues**: Null values or non-numeric data in the base column
5.  **Incorrect Implementation**: Bugs in the indicator calculation logic

### Step-by-Step Solutions

#### Solution 1: Robust Indicator Calculation

```python
import pandas as pd
import numpy as np
from typing import Dict, Any, List, Optional

class RobustTechnicalIndicators:
    """Robust technical indicator calculations with error handling."""
    
    def __init__(self):
        self.indicator_log = []
    
    def _log_indicator_calculation(self, 
                                   indicator_name: str, 
                                   column: str, 
                                   params: List[Any], 
                                   status: str, 
                                   error: Optional[str] = None) -> None:
        """Log indicator calculation details."""
        self.indicator_log.append({
            "timestamp": pd.Timestamp.now(),
            "indicator": indicator_name,
            "column": column,
            "params": params,
            "status": status,
            "error": error
        })
    
    def sma(self, series: pd.Series, period: int) -> pd.Series:
        """
        Calculate Simple Moving Average (SMA) with robust error handling.
        
        Args:
            series (pd.Series): Input data series
            period (int): SMA period
            
        Returns:
            pd.Series: SMA values
        """
        indicator_name = "sma"
        column_name = series.name if series.name else "unknown_column"
        
        try:
            # Validate input
            if not isinstance(series, pd.Series):
                raise TypeError("Input must be a pandas Series")
            if not pd.api.types.is_numeric_dtype(series):
                raise ValueError("Series must contain numeric data")
            if not isinstance(period, int) or period <= 0:
                raise ValueError("Period must be a positive integer")
            if len(series) < period:
                raise ValueError(f"Insufficient data for SMA({period}): need at least {period} observations, got {len(series)}")
            
            # Calculate SMA
            result = series.rolling(window=period).mean()
            self._log_indicator_calculation(indicator_name, column_name, [period], "success")
            return result
            
        except Exception as e:
            self._log_indicator_calculation(indicator_name, column_name, [period], "failed", str(e))
            print(f"❌ Error calculating SMA for '{column_name}' (period={period}): {str(e)}")
            return pd.Series(np.nan, index=series.index)
    
    def ema(self, series: pd.Series, period: int) -> pd.Series:
        """
        Calculate Exponential Moving Average (EMA) with robust error handling.
        
        Args:
            series (pd.Series): Input data series
            period (int): EMA period
            
        Returns:
            pd.Series: EMA values
        """
        indicator_name = "ema"
        column_name = series.name if series.name else "unknown_column"
        
        try:
            # Validate input
            if not isinstance(series, pd.Series):
                raise TypeError("Input must be a pandas Series")
            if not pd.api.types.is_numeric_dtype(series):
                raise ValueError("Series must contain numeric data")
            if not isinstance(period, int) or period <= 0:
                raise ValueError("Period must be a positive integer")
            if len(series) < period:
                raise ValueError(f"Insufficient data for EMA({period}): need at least {period} observations, got {len(series)}")
            
            # Calculate EMA
            result = series.ewm(span=period, adjust=False).mean()
            self._log_indicator_calculation(indicator_name, column_name, [period], "success")
            return result
            
        except Exception as e:
            self._log_indicator_calculation(indicator_name, column_name, [period], "failed", str(e))
            print(f"❌ Error calculating EMA for '{column_name}' (period={period}): {str(e)}")
            return pd.Series(np.nan, index=series.index)
    
    def rsi(self, series: pd.Series, period: int = 14) -> pd.Series:
        """
        Calculate Relative Strength Index (RSI) with robust error handling.
        
        Args:
            series (pd.Series): Input data series (typically 'close' prices)
            period (int): RSI period
            
        Returns:
            pd.Series: RSI values
        """
        indicator_name = "rsi"
        column_name = series.name if series.name else "unknown_column"
        
        try:
            # Validate input
            if not isinstance(series, pd.Series):
                raise TypeError("Input must be a pandas Series")
            if not pd.api.types.is_numeric_dtype(series):
                raise ValueError("Series must contain numeric data")
            if not isinstance(period, int) or period <= 0:
                raise ValueError("Period must be a positive integer")
            if len(series) < period + 1: # Need at least period + 1 for first delta
                raise ValueError(f"Insufficient data for RSI({period}): need at least {period + 1} observations, got {len(series)}")
            
            # Calculate RSI
            delta = series.diff()
            gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
            loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
            
            rs = gain / loss
            rsi = 100 - (100 / (1 + rs))
            
            self._log_indicator_calculation(indicator_name, column_