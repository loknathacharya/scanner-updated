import json
import jsonschema
from typing import Dict, List, Tuple, Any, Union
from jsonschema import validate, ValidationError


class JSONFilterParser:
    """
    JSON Filter Parser for validating and parsing JSON-based filter expressions.
    
    This class provides functionality to:
    - Validate JSON filter structure against a schema
    - Parse operands into structured format
    - Build executable filter expressions
    """
    
    def __init__(self):
        """Initialize the JSONFilterParser with schema validation."""
        self.schema = self._load_schema()
    
    def validate_json(self, json_data: dict) -> Tuple[bool, str]:
        """
        Validate JSON data against the schema.
        
        Args:
            json_data (dict): JSON data to validate
            
        Returns:
            Tuple[bool, str]: (is_valid, error_message)
        """
        try:
            validate(instance=json_data, schema=self.schema)
            return True, "JSON validation successful"
        except ValidationError as e:
            return False, f"JSON validation error: {e.message}"
        except json.JSONDecodeError as e:
            return False, f"JSON syntax error: {str(e)}"
        except Exception as e:
            return False, f"Unexpected validation error: {str(e)}"
    
    def parse_operands(self, operand_data: dict) -> dict:
        """
        Parse operand into structured format.
        
        Args:
            operand_data (dict): Operand data to parse
            
        Returns:
            dict: Parsed operand structure
            
        Raises:
            ValueError: If operand type is invalid or required fields are missing
        """
        operand_type = operand_data.get("type")
        
        if operand_type not in ["column", "indicator", "constant"]:
            raise ValueError(f"Invalid operand type: {operand_type}. Must be 'column', 'indicator', or 'constant'")
        
        parsed_operand = {
            "type": operand_type,
            "original_data": operand_data
        }
        
        if operand_type == "column":
            parsed_operand.update({
                "name": operand_data.get("name"),
                "timeframe": operand_data.get("timeframe", "daily"),
                "offset": operand_data.get("offset", 0)
            })
            
            # Validate required fields for column
            if not parsed_operand["name"]:
                raise ValueError("Column operand requires 'name' field")
                
        elif operand_type == "indicator":
            parsed_operand.update({
                "name": operand_data.get("name"),
                "params": operand_data.get("params", []),
                "column": operand_data.get("column"),
                "timeframe": operand_data.get("timeframe", "daily"),
                "offset": operand_data.get("offset", 0)
            })
            
            # Validate required fields for indicator
            if not parsed_operand["name"]:
                raise ValueError("Indicator operand requires 'name' field")
            if not parsed_operand["column"]:
                raise ValueError("Indicator operand requires 'column' field")
            if not isinstance(parsed_operand["params"], list):
                raise ValueError("Indicator 'params' must be an array")
                
        elif operand_type == "constant":
            parsed_operand.update({
                "value": operand_data.get("value")
            })
            
            # Validate required fields for constant
            if "value" not in operand_data:
                raise ValueError("Constant operand requires 'value' field")
            if not isinstance(parsed_operand["value"], (int, float)):
                raise ValueError("Constant 'value' must be a number")
        
        return parsed_operand
    
    def build_filter_expression(self, conditions: list, logic: str) -> str:
        """
        Build executable filter expression from conditions.
        
        Args:
            conditions (list): List of parsed conditions
            logic (str): Logic operator ("AND" or "OR")
            
        Returns:
            str: Executable filter expression
            
        Raises:
            ValueError: If logic operator is invalid or conditions are empty
        """
        if logic not in ["AND", "OR"]:
            raise ValueError(f"Invalid logic operator: {logic}. Must be 'AND' or 'OR'")
        
        if not conditions:
            raise ValueError("Cannot build expression with empty conditions")
        
        # Build individual condition expressions
        condition_expressions = []
        for i, condition in enumerate(conditions):
            try:
                left_expr = self._build_operand_expression(condition["left"])
                right_expr = self._build_operand_expression(condition["right"])
                operator = condition["operator"]
                
                condition_expr = f"({left_expr} {operator} {right_expr})"
                condition_expressions.append(condition_expr)
                
            except Exception as e:
                raise ValueError(f"Error building condition {i + 1}: {str(e)}")
        
        # Combine conditions with logic operator
        if len(condition_expressions) == 1:
            return condition_expressions[0]
        else:
            return f" {logic} ".join(condition_expressions)
    
    def _build_operand_expression(self, operand: dict) -> str:
        """
        Build expression string for a single operand.
        
        Args:
            operand (dict): Parsed operand
            
        Returns:
            str: Expression string for the operand
        """
        operand_type = operand["type"]
        
        if operand_type == "column":
            return f"data['{operand['name']}'].iloc[{operand['offset']}]"
            
        elif operand_type == "indicator":
            # Build indicator calculation expression
            params_str = ", ".join(str(p) for p in operand["params"])
            timeframe_offset = f".iloc[{operand['offset']}]" if operand["offset"] != 0 else ""
            return f"self._calculate_indicator('{operand['name']}', data['{operand['column']}'], [{params_str}]){timeframe_offset}"
            
        elif operand_type == "constant":
            return str(operand["value"])
        
        else:
            raise ValueError(f"Unknown operand type: {operand_type}")
    
    def _load_schema(self) -> dict:
        """
        Load JSON validation schema.
        
        Returns:
            dict: JSON schema for validation
        """
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
                    "items": {
                        "type": "object",
                        "properties": {
                            "left": {
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
                                    "column": {"type": "string"}
                                },
                                "required": ["type"],
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
                            },
                            "operator": {
                                "type": "string",
                                "enum": [">", "<", ">=", "<=", "==", "!="]
                            },
                            "right": {
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
                                "required": ["type"],
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
                        },
                        "required": ["left", "operator", "right"]
                    }
                }
            },
            "required": ["logic", "conditions"],
            "additionalProperties": False
        }
    
    def _calculate_indicator(self, indicator_name: str, data_series, params: list) -> Any:
        """
        Calculate indicator value (placeholder implementation).
        
        Args:
            indicator_name (str): Name of the indicator
            data_series (pd.Series): Data series for calculation
            params (list): Indicator parameters
            
        Returns:
            Any: Calculated indicator value
            
        Note:
            This is a placeholder implementation. In a real implementation,
            this would call the actual indicator calculation functions.
        """
        # This is a placeholder - actual implementation would use TechnicalIndicators
        if indicator_name == "sma":
            period = params[0] if params else 20
            # Simple moving average calculation
            return data_series.rolling(window=period).mean()
        elif indicator_name == "ema":
            period = params[0] if params else 20
            # Exponential moving average calculation
            return data_series.ewm(span=period).mean()
        else:
            raise ValueError(f"Unsupported indicator: {indicator_name}")
    
    def get_supported_operators(self) -> List[str]:
        """
        Get list of supported operators.
        
        Returns:
            List[str]: List of supported operators
        """
        return [">", "<", ">=", "<=", "==", "!="]
    
    def get_supported_indicators(self) -> List[str]:
        """
        Get list of supported indicators.
        
        Returns:
            List[str]: List of supported indicators
        """
        return ["sma", "ema"]
    
    def get_supported_timeframes(self) -> List[str]:
        """
        Get list of supported timeframes.
        
        Returns:
            List[str]: List of supported timeframes
        """
        return ["daily", "weekly", "intraday"]