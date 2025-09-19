import pandas as pd
import numpy as np
from typing import Dict, List, Any, Union, Tuple
try:
    from .json_filter_parser import JSONFilterParser
except Exception:
    from json_filter_parser import JSONFilterParser

try:
    from .operand_calculator import OperandCalculator
except Exception:
    from operand_calculator import OperandCalculator


class AdvancedFilterEngine:
    """
    Advanced Filter Engine for applying JSON-based filters to pandas DataFrames.
    
    This class provides functionality to:
    - Parse and validate JSON filter expressions
    - Apply complex filters with multiple conditions and logic operators
    - Evaluate individual conditions and return boolean masks
    - Combine multiple conditions using AND/OR logic
    - Handle errors gracefully with informative messages
    - Support the full range of operand types and operators
    """
    
    def __init__(self):
        """Initialize the AdvancedFilterEngine with JSONFilterParser and OperandCalculator."""
        self.parser = JSONFilterParser()
        self.calculator = None
    
    def apply_filter(self, data: pd.DataFrame, json_filter: dict) -> pd.DataFrame:
        """
        Apply JSON filter to data.
        
        Args:
            data (pd.DataFrame): DataFrame containing the data to filter
            json_filter (dict): JSON filter expression to apply
                
        Returns:
            pd.DataFrame: Filtered DataFrame containing only matching rows
            
        Raises:
            ValueError: If JSON filter is invalid or data is incompatible
            TypeError: If input types are incorrect
        """
        # Input validation
        if not isinstance(data, pd.DataFrame):
            raise TypeError("data must be a pandas DataFrame")
        
        if not isinstance(json_filter, dict):
            raise TypeError("json_filter must be a dictionary")
        
        if data.empty:
            return data.copy()
        
        # Initialize calculator with data
        self.calculator = OperandCalculator(data)
        
        try:
            # Validate JSON filter structure
            is_valid, error_msg = self.parser.validate_json(json_filter)
            if not is_valid:
                raise ValueError(f"Invalid JSON filter: {error_msg}")
            
            # Extract filter components
            logic = json_filter.get('logic', 'AND')
            conditions = json_filter.get('conditions', [])
            
            if not conditions:
                return data.copy()
            
            # Evaluate each condition
            condition_results = []
            for i, condition in enumerate(conditions):
                try:
                    result = self.evaluate_condition(data, condition)
                    condition_results.append(result)
                except Exception as e:
                    raise ValueError(f"Error evaluating condition {i + 1}: {str(e)}")
            
            # Combine results with logic operator
            if len(condition_results) == 1:
                combined_mask = condition_results[0]
            else:
                combined_mask = self.combine_results(condition_results, logic)
            
            # Apply mask to filter data
            filtered_data = data[combined_mask].copy()
            
            return filtered_data
            
        except Exception as e:
            # Re-raise with more context
            raise ValueError(f"Filter application failed: {str(e)}")
    
    def evaluate_condition(self, data: pd.DataFrame, condition: dict) -> pd.Series:
        """
        Evaluate single condition and return boolean mask.
        
        Args:
            data (pd.DataFrame): DataFrame containing the data
            condition (dict): Condition dictionary with left operand, operator, and right operand
                
        Returns:
            pd.Series: Boolean series indicating which rows satisfy the condition
            
        Raises:
            ValueError: If condition structure is invalid or operands cannot be evaluated
            KeyError: If required fields are missing from condition
        """
        # Validate condition structure
        if not isinstance(condition, dict):
            raise ValueError("Condition must be a dictionary")
        
        required_fields = ['left', 'operator', 'right']
        for field in required_fields:
            if field not in condition:
                raise KeyError(f"Missing required field '{field}' in condition")
        
        left_operand = condition['left']
        operator = condition['operator']
        right_operand = condition['right']
        
        # Validate operator
        supported_operators = self.parser.get_supported_operators()
        if operator not in supported_operators:
            raise ValueError(f"Unsupported operator '{operator}'. Supported operators: {supported_operators}")
        
        try:
            # Calculate left operand value
            left_value = self._calculate_operand_value(left_operand, data)
            
            # Calculate right operand value
            right_value = self._calculate_operand_value(right_operand, data)
            
            # Apply operator
            result = self._apply_operator(left_value, right_value, operator)
            
            return result
            
        except Exception as e:
            raise ValueError(f"Error evaluating condition with operator '{operator}': {str(e)}")
    
    def combine_results(self, results: list, logic: str) -> pd.Series:
        """
        Combine condition results with logic operator.
        
        Args:
            results (list): List of boolean Series from individual conditions
            logic (str): Logic operator ("AND" or "OR")
                
        Returns:
            pd.Series: Combined boolean series
            
        Raises:
            ValueError: If logic operator is invalid or results list is empty
        """
        if not results:
            raise ValueError("Cannot combine empty results list")
        
        if not isinstance(logic, str):
            raise ValueError("Logic operator must be a string")
        
        logic = logic.upper()
        if logic not in ['AND', 'OR']:
            raise ValueError(f"Invalid logic operator '{logic}'. Must be 'AND' or 'OR'")
        
        if len(results) == 1:
            return results[0]
        
        # Ensure all results have the same index
        base_index = results[0].index
        aligned_results = []
        
        for result in results:
            if not isinstance(result, pd.Series):
                raise ValueError("All results must be pandas Series")
            
            # Align indices
            if result.index.equals(base_index):
                aligned_results.append(result)
            else:
                # Reindex to match the base index
                aligned_result = result.reindex(base_index, fill_value=False)
                aligned_results.append(aligned_result)
        
        # Apply logic operator
        if logic == 'AND':
            combined = pd.concat(aligned_results).groupby(level=0).all()
        else:  # OR
            combined = pd.concat(aligned_results).groupby(level=0).any()
        
        return combined.astype(bool)
    
    def _calculate_operand_value(self, operand: dict, data: pd.DataFrame) -> Union[pd.Series, float]:
        """
        Calculate operand value using the parser or calculator.
        
        Args:
            operand (dict): Operand dictionary
            data (pd.DataFrame): DataFrame containing the data
                
        Returns:
            Union[pd.Series, float]: Calculated operand value
            
        Raises:
            ValueError: If operand type is invalid or calculation fails
        """
        if not isinstance(operand, dict):
            raise ValueError("Operand must be a dictionary")
        
        operand_type = operand.get('type')
        
        if operand_type == 'constant':
            # Use parser for constants
            parsed_operand = self.parser.parse_operands(operand)
            return self.parser._build_operand_expression(parsed_operand)
        else:
            # Use calculator for columns and indicators
            if self.calculator is None:
                raise ValueError("OperandCalculator not initialized. Call apply_filter first.")
            return self.calculator.calculate_operand(operand)
    
    def _apply_operator(self, left_value: Union[pd.Series, float], 
                       right_value: Union[pd.Series, float], 
                       operator: str) -> pd.Series:
        """
        Apply operator to left and right values.
        
        Args:
            left_value (Union[pd.Series, float]): Left operand value
            right_value (Union[pd.Series, float]): Right operand value
            operator (str): Operator to apply
                
        Returns:
            pd.Series: Boolean series indicating the result of the operation
            
        Raises:
            ValueError: If operator application fails
        """
        try:
            # Handle string expressions (constants from parser)
            if isinstance(left_value, str) and isinstance(right_value, str):
                # Both are string expressions, need to evaluate them
                # Create a temporary evaluation environment
                if self.calculator is None:
                    raise ValueError("OperandCalculator not initialized. Call apply_filter first.")
                eval_env = {'data': self.calculator.data, 'np': np}
                
                # Evaluate left and right expressions
                left_eval = eval(left_value, eval_env)
                right_eval = eval(right_value, eval_env)
                
                # Apply operator
                return self._apply_numeric_operator(left_eval, right_eval, operator)
            
            elif isinstance(left_value, str):
                # Left is string expression, right is calculated value
                if self.calculator is None:
                    raise ValueError("OperandCalculator not initialized. Call apply_filter first.")
                eval_env = {'data': self.calculator.data, 'np': np}
                left_eval = eval(left_value, eval_env)
                return self._apply_numeric_operator(left_eval, right_value, operator)
            
            elif isinstance(right_value, str):
                # Right is string expression, left is calculated value
                if self.calculator is None:
                    raise ValueError("OperandCalculator not initialized. Call apply_filter first.")
                eval_env = {'data': self.calculator.data, 'np': np}
                right_eval = eval(right_value, eval_env)
                return self._apply_numeric_operator(left_value, right_eval, operator)
            
            else:
                # Both are calculated values
                return self._apply_numeric_operator(left_value, right_value, operator)
                
        except Exception as e:
            raise ValueError(f"Error applying operator '{operator}': {str(e)}")
    
    def _apply_numeric_operator(self, left_value: Union[pd.Series, float], 
                               right_value: Union[pd.Series, float], 
                               operator: str) -> pd.Series:
        """
        Apply numeric operator to values.
        
        Args:
            left_value (Union[pd.Series, float]): Left operand value
            right_value (Union[pd.Series, float]): Right operand value
            operator (str): Operator to apply
                
        Returns:
            pd.Series: Boolean series indicating the result of the operation
        """
        # Convert to numpy arrays for consistent handling
        if isinstance(left_value, pd.Series):
            left_array = left_value.values
        else:
            left_array = np.array([left_value] * len(right_value)) if isinstance(right_value, pd.Series) else np.array([left_value])
        
        if isinstance(right_value, pd.Series):
            right_array = right_value.values
        else:
            right_array = np.array([right_value] * len(left_value)) if isinstance(left_value, pd.Series) else np.array([right_value])
        
        # Ensure arrays have the same length
        if len(left_array) != len(right_array):
            # If one is scalar, broadcast it
            if len(left_array) == 1:
                left_array = np.full_like(right_array, left_array[0])
            elif len(right_array) == 1:
                right_array = np.full_like(left_array, right_array[0])
            else:
                raise ValueError("Operand arrays have incompatible lengths")
        
        # Apply operator
        if operator == '>':
            return pd.Series(np.greater(left_array, right_array), index=left_value.index if isinstance(left_value, pd.Series) else None)
        elif operator == '<':
            return pd.Series(np.less(left_array, right_array), index=left_value.index if isinstance(left_value, pd.Series) else None)
        elif operator == '>=':
            return pd.Series(np.greater_equal(left_array, right_array), index=left_value.index if isinstance(left_value, pd.Series) else None)
        elif operator == '<=':
            return pd.Series(np.less_equal(left_array, right_array), index=left_value.index if isinstance(left_value, pd.Series) else None)
        elif operator == '==':
            return pd.Series(np.equal(left_array, right_array), index=left_value.index if isinstance(left_value, pd.Series) else None)
        elif operator == '!=':
            return pd.Series(np.not_equal(left_array, right_array), index=left_value.index if isinstance(left_value, pd.Series) else None)
        else:
            raise ValueError(f"Unsupported operator '{operator}'")
    
    def validate_filter(self, json_filter: dict) -> Tuple[bool, str]:
        """
        Validate JSON filter structure.
        
        Args:
            json_filter (dict): JSON filter to validate
                
        Returns:
            Tuple[bool, str]: (is_valid, error_message)
        """
        try:
            return self.parser.validate_json(json_filter)
        except Exception as e:
            return False, f"Validation error: {str(e)}"
    
    def get_supported_operators(self) -> List[str]:
        """
        Get list of supported operators.
        
        Returns:
            List[str]: List of supported operators
        """
        return self.parser.get_supported_operators()
    
    def get_supported_indicators(self) -> List[str]:
        """
        Get list of supported indicators.
        
        Returns:
            List[str]: List of supported indicators
        """
        return self.calculator.get_supported_indicators() if self.calculator else []
    
    def get_supported_columns(self) -> List[str]:
        """
        Get list of supported columns.
        
        Returns:
            List[str]: List of supported column names
        """
        return self.calculator.get_supported_columns() if self.calculator else []