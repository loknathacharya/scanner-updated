import pandas as pd
import numpy as np
from typing import Dict, Any, Optional, Union
try:
    from .indicators_module import TechnicalIndicators
except Exception:
    from indicators_module import TechnicalIndicators


class OperandCalculator:
    """
    Calculator for handling different types of operands in JSON-based filters.
    
    This class provides functionality to:
    - Calculate column values with offset support
    - Calculate technical indicators with offset support
    - Apply timeframe offsets to time series data
    - Return constant values for constant operands
    - Handle missing data and edge cases
    """
    
    def __init__(self, data: pd.DataFrame):
        """
        Initialize the OperandCalculator with data.
        
        Args:
            data (pd.DataFrame): DataFrame containing the stock data
        """
        self.data = data
        self.indicators = TechnicalIndicators()
        
        # Validate that required columns exist
        required_columns = ['open', 'high', 'low', 'close', 'volume']
        missing_columns = [col for col in required_columns if col not in data.columns]
        
        if missing_columns:
            raise ValueError(f"Missing required columns: {', '.join(missing_columns)}")
    
    def calculate_column(self, operand: dict) -> pd.Series:
        """
        Calculate column value with offset support.
        
        Args:
            operand (dict): Operand dictionary with column information
                Expected format: {
                    "type": "column",
                    "name": str,  # Column name
                    "timeframe": str,  # Optional: "daily", "weekly", "intraday"
                    "offset": int  # Optional: Timeframe offset
                }
        
        Returns:
            pd.Series: Column values with offset applied
            
        Raises:
            ValueError: If column name is invalid or offset is out of bounds
        """
        column_name = operand.get('name')
        offset = operand.get('offset', 0)
        
        if not column_name:
            raise ValueError("Column operand requires 'name' field")
        
        if column_name not in self.data.columns:
            raise ValueError(f"Column '{column_name}' not found in data")
        
        # Get the column data
        column_data = self.data[column_name]
        
        # Apply offset if specified
        if offset != 0:
            return self.apply_offset(column_data, offset)
        
        return column_data
    
    def calculate_indicator(self, operand: dict) -> pd.Series:
        """
        Calculate indicator value with offset support.
        
        Args:
            operand (dict): Operand dictionary with indicator information
                Expected format: {
                    "type": "indicator",
                    "name": str,  # Indicator name (e.g., "sma", "ema")
                    "column": str,  # Base column for calculation
                    "params": list,  # Indicator parameters
                    "timeframe": str,  # Optional: "daily", "weekly", "intraday"
                    "offset": int  # Optional: Timeframe offset
                }
        
        Returns:
            pd.Series: Indicator values with offset applied
            
        Raises:
            ValueError: If indicator name, column, or parameters are invalid
        """
        indicator_name = operand.get('name')
        column_name = operand.get('column')
        params = operand.get('params', [])
        offset = operand.get('offset', 0)
        
        if not indicator_name:
            raise ValueError("Indicator operand requires 'name' field")
        
        if not column_name:
            raise ValueError("Indicator operand requires 'column' field")
        
        if column_name not in self.data.columns:
            raise ValueError(f"Column '{column_name}' not found in data")
        
        # Get the base column data
        base_data = self.data[column_name]
        
        # Calculate the indicator
        try:
            if indicator_name.lower() == 'sma':
                period = int(params[0]) if params else 20
                indicator_values = self.indicators.sma(base_data, period)
            elif indicator_name.lower() == 'ema':
                period = int(params[0]) if params else 20
                indicator_values = self.indicators.ema(base_data, period)
            elif indicator_name.lower() == 'rsi':
                period = int(params[0]) if params else 14
                indicator_values = self.indicators.rsi(base_data, period)
            elif indicator_name.lower() == 'macd':
                fast = int(params[0]) if params and len(params) > 0 else 12
                slow = int(params[1]) if params and len(params) > 1 else 26
                signal = int(params[2]) if params and len(params) > 2 else 9
                macd_line, _, _ = self.indicators.macd(base_data, fast, slow, signal)
                indicator_values = macd_line
            elif indicator_name.lower() == 'bollinger_bands':
                period = int(params[0]) if params else 20
                num_std = float(params[1]) if params and len(params) > 1 else 2.0
                _, middle, _ = self.indicators.bollinger_bands(base_data, period, num_std)
                indicator_values = middle
            else:
                raise ValueError(f"Unsupported indicator: {indicator_name}")
        except Exception as e:
            raise ValueError(f"Error calculating indicator '{indicator_name}': {str(e)}")
        
        # Apply offset if specified
        if offset != 0:
            return self.apply_offset(indicator_values, offset)
        
        return indicator_values
    
    def apply_offset(self, series: pd.Series, offset: int) -> pd.Series:
        """
        Apply timeframe offset to series.
        
        Args:
            series (pd.Series): Input data series
            offset (int): Number of periods to offset (positive = future, negative = past)
        
        Returns:
            pd.Series: Offset series with NaN values for out-of-bounds positions
            
        Raises:
            ValueError: If offset is not an integer
        """
        if not isinstance(offset, int):
            raise ValueError("Offset must be an integer")
        
        if offset == 0:
            return series

        # Use pandas shift with a consistent convention:
        # - offset > 0 means "future" (value at t+offset) => shift by -offset
        # - offset < 0 means "past" (value at t+offset where offset is negative) => shift by -offset as well
        # This keeps semantics simple: return series.shift(-offset)
        try:
            shifted = series.shift(-offset)
            return shifted
        except Exception as e:
            raise ValueError(f"Failed to apply offset {offset}: {e}")
    
    def calculate_constant(self, operand: dict) -> float:
        """
        Return constant value.
        
        Args:
            operand (dict): Operand dictionary with constant value
                Expected format: {
                    "type": "constant",
                    "value": float  # Constant value
                }
        
        Returns:
            float: Constant value
            
        Raises:
            ValueError: If value is not a number
        """
        value = operand.get('value')
        
        if value is None:
            raise ValueError("Constant operand requires 'value' field")
        
        if not isinstance(value, (int, float)):
            raise ValueError("Constant 'value' must be a number")
        
        return float(value)
    
    def calculate_operand(self, operand: dict) -> Union[pd.Series, float]:
        """
        Calculate operand based on its type.
        
        Args:
            operand (dict): Operand dictionary
        
        Returns:
            Union[pd.Series, float]: Calculated operand value
            
        Raises:
            ValueError: If operand type is invalid or required fields are missing
        """
        operand_type = operand.get('type')
        
        if operand_type == 'column':
            return self.calculate_column(operand)
        elif operand_type == 'indicator':
            return self.calculate_indicator(operand)
        elif operand_type == 'constant':
            return self.calculate_constant(operand)
        else:
            raise ValueError(f"Invalid operand type: {operand_type}. Must be 'column', 'indicator', or 'constant'")
    
    def get_supported_indicators(self) -> list:
        """
        Get list of supported indicators.
        
        Returns:
            list: List of supported indicator names
        """
        return ['sma', 'ema', 'rsi', 'macd', 'bollinger_bands']
    
    def get_supported_columns(self) -> list:
        """
        Get list of supported columns.
        
        Returns:
            list: List of supported column names
        """
        return list(self.data.columns)
    
    def validate_operand(self, operand: dict) -> tuple[bool, str]:
        """
        Validate operand structure and values.
        
        Args:
            operand (dict): Operand dictionary to validate
        
        Returns:
            tuple[bool, str]: (is_valid, error_message)
        """
        try:
            operand_type = operand.get('type')
            
            if operand_type not in ['column', 'indicator', 'constant']:
                return False, f"Invalid operand type: {operand_type}"
            
            if operand_type == 'column':
                if 'name' not in operand:
                    return False, "Column operand requires 'name' field"
                if operand['name'] not in self.data.columns:
                    return False, f"Column '{operand['name']}' not found in data"
                if 'offset' in operand and not isinstance(operand['offset'], int):
                    return False, "Column 'offset' must be an integer"
            
            elif operand_type == 'indicator':
                if 'name' not in operand:
                    return False, "Indicator operand requires 'name' field"
                if 'column' not in operand:
                    return False, "Indicator operand requires 'column' field"
                if operand['column'] not in self.data.columns:
                    return False, f"Column '{operand['column']}' not found in data"
                if 'params' in operand and not isinstance(operand['params'], list):
                    return False, "Indicator 'params' must be an array"
                if 'offset' in operand and not isinstance(operand['offset'], int):
                    return False, "Indicator 'offset' must be an integer"
            
            elif operand_type == 'constant':
                if 'value' not in operand:
                    return False, "Constant operand requires 'value' field"
                if not isinstance(operand['value'], (int, float)):
                    return False, "Constant 'value' must be a number"
            
            return True, "Operand validation successful"
            
        except Exception as e:
            return False, f"Validation error: {str(e)}"