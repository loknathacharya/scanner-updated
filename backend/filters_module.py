import pandas as pd
import numpy as np
import re
from typing import List, Dict, Any, Optional
import streamlit as st

class FilterEngine:
    """Engine for building and applying filters on stock data"""
    
    def __init__(self):
        self.operators_map = {
            '>': lambda a, b: a > b,
            '<': lambda a, b: a < b,
            '>=': lambda a, b: a >= b,
            '<=': lambda a, b: a <= b,
            '==': lambda a, b: a == b,
            '!=': lambda a, b: a != b,
            'crosses_above': self._crosses_above,
            'crosses_below': self._crosses_below
        }
    
    def build_filter_string(self, conditions: List[Dict[str, Any]]) -> str:
        """Build a filter string from conditions"""
        if not conditions:
            return ""
        
        filter_parts = []
        for i, condition in enumerate(conditions):
            column = condition['column']
            operator = condition['operator']
            value = condition['value']
            value_type = condition.get('value_type', 'value')  # Default to 'value' for backward compatibility
            
            # Handle special operators
            if operator in ['crosses_above', 'crosses_below']:
                filter_part = f"{column} {operator} {value}"
            else:
                # Use explicit value_type if available
                if value_type == 'column':
                    filter_part = f"{column} {operator} {value}"
                else:
                    try:
                        # Try to convert to float
                        float_val = float(value)
                        filter_part = f"{column} {operator} {float_val}"
                    except ValueError:
                        filter_part = f"{column} {operator} '{value}'"
            
            # Add parentheses to ensure proper operator precedence
            filter_part = f"({filter_part})"
            
            if i > 0:
                logic = condition.get('logic', 'AND')
                filter_parts.append(f" {logic} {filter_part}")
            else:
                filter_parts.append(filter_part)
        
        return ''.join(filter_parts)
    
    @st.cache_data
    def apply_filter(_self, df: pd.DataFrame, filter_string: str, date_range: Optional[tuple] = None) -> pd.DataFrame:
        """Apply filter to dataframe with caching"""
        try:
            return _self._execute_filter(df, filter_string, date_range)
        except Exception as e:
            st.error(f"Filter execution error: {str(e)}")
            return pd.DataFrame()
    
    def _execute_filter(self, df: pd.DataFrame, filter_string: str, date_range: Optional[tuple] = None) -> pd.DataFrame:
        """Execute filter on dataframe"""
        if not filter_string and not date_range:
            return df
        
        # Apply date range filter if provided
        filtered_df = df.copy()
        if date_range:
            start_date, end_date = date_range
            
            # DEBUG: Log datetime information
            print("DEBUG: Date range filter information:")
            print(f"  - DataFrame date column dtype: {df['date'].dtype}")
            print(f"  - DataFrame date sample: {df['date'].iloc[0] if len(df) > 0 else 'N/A'}")
            print(f"  - Start date type: {type(start_date)}, value: {start_date}")
            print(f"  - End date type: {type(end_date)}, value: {end_date}")
            print(f"  - Start date timezone: {start_date.tzinfo if hasattr(start_date, 'tzinfo') else 'None'}")
            print(f"  - End date timezone: {end_date.tzinfo if hasattr(end_date, 'tzinfo') else 'None'}")
            
            if start_date:
                print(f"DEBUG: Applying start_date filter: {df['date'].dtype} >= {type(start_date)}")
                
                # Ensure timezone compatibility - make both dates timezone-aware
                if hasattr(df['date'], 'dt') and hasattr(df['date'].dt, 'tz') and df['date'].dt.tz is not None:
                    # DataFrame has timezone, make sure start_date has the same timezone
                    if hasattr(start_date, 'tzinfo') and start_date.tzinfo is None:
                        start_date = start_date.tz_localize(df['date'].dt.tz)
                else:
                    # DataFrame doesn't have timezone, make sure start_date doesn't have timezone
                    if hasattr(start_date, 'tzinfo') and start_date.tzinfo is not None:
                        start_date = start_date.tz_localize(None)
                
                filtered_df = filtered_df[filtered_df['date'] >= start_date]
                
            if end_date:
                print(f"DEBUG: Applying end_date filter: {df['date'].dtype} <= {type(end_date)}")
                
                # Ensure timezone compatibility - make both dates timezone-aware
                if hasattr(df['date'], 'dt') and hasattr(df['date'].dt, 'tz') and df['date'].dt.tz is not None:
                    # DataFrame has timezone, make sure end_date has the same timezone
                    if hasattr(end_date, 'tzinfo') and end_date.tzinfo is None:
                        end_date = end_date.tz_localize(df['date'].dt.tz)
                else:
                    # DataFrame doesn't have timezone, make sure end_date doesn't have timezone
                    if hasattr(end_date, 'tzinfo') and end_date.tzinfo is not None:
                        end_date = end_date.tz_localize(None)
                
                filtered_df = filtered_df[filtered_df['date'] <= end_date]
        
        if not filter_string:
            return filtered_df
        
        # Group by symbol and apply filter
        results = []
        
        for symbol, group in filtered_df.groupby('symbol'):
            # Sort by date
            group = group.sort_values('date').reset_index(drop=True)
            
            try:
                # Handle special operators first
                processed_filter = self._process_special_operators(group, filter_string)
                
                # Convert logical operators to element-wise operators for numpy arrays
                # We use spaces around the operators to avoid affecting column names
                processed_filter = processed_filter.replace(" AND ", " & ").replace(" OR ", " | ")
                
                # Create evaluation environment
                eval_env = self._create_eval_environment(group)
                
                # Evaluate filter
                mask = eval(processed_filter, {"__builtins__": {}}, eval_env)
                
                if isinstance(mask, bool):
                    if mask:
                        results.append(group)  # All rows if condition is true
                elif hasattr(mask, '__iter__'):
                    filtered_group = group[mask]
                    if len(filtered_group) > 0:
                        results.append(filtered_group)  # All matching rows
                
            except Exception as e:
                # Skip symbols that cause errors
                continue
        
        if results:
            return pd.concat(results, ignore_index=True)
        else:
            return pd.DataFrame()
    
    def _process_special_operators(self, group: pd.DataFrame, filter_string: str) -> str:
        """Process special operators like crosses_above, crosses_below"""
        processed = filter_string
        
        # Handle crosses_above
        crosses_above_pattern = r'(\w+)\s+crosses_above\s+(\w+|\d+\.?\d*)'
        for match in re.finditer(crosses_above_pattern, processed):
            col1, col2 = match.groups()
            replacement = f"_crosses_above('{col1}', '{col2}')"
            processed = processed.replace(match.group(), replacement)
        
        # Handle crosses_below
        crosses_below_pattern = r'(\w+)\s+crosses_below\s+(\w+|\d+\.?\d*)'
        for match in re.finditer(crosses_below_pattern, processed):
            col1, col2 = match.groups()
            replacement = f"_crosses_below('{col1}', '{col2}')"
            processed = processed.replace(match.group(), replacement)
        
        return processed
    
    def _create_eval_environment(self, group: pd.DataFrame) -> dict:
        """Create evaluation environment with data and functions"""
        env = {}
        
        # Add column data
        for col in group.columns:
            if col not in ['symbol', 'date']:
                env[col] = group[col].values
        
        # Add helper functions
        env['_crosses_above'] = lambda col1, col2: self._crosses_above_series(group, col1, col2)
        env['_crosses_below'] = lambda col1, col2: self._crosses_below_series(group, col1, col2)
        
        # Add numpy functions
        env['np'] = np
        
        return env
    
    def _crosses_above(self, series1: pd.Series, series2: pd.Series) -> pd.Series:
        """Check if series1 crosses above series2"""
        if len(series1) < 2:
            return pd.Series([False] * len(series1))
        
        prev_below = (series1.shift(1) <= series2.shift(1))
        curr_above = (series1 > series2)
        
        return prev_below & curr_above
    
    def _crosses_below(self, series1: pd.Series, series2: pd.Series) -> pd.Series:
        """Check if series1 crosses below series2"""
        if len(series1) < 2:
            return pd.Series([False] * len(series1))
        
        prev_above = (series1.shift(1) >= series2.shift(1))
        curr_below = (series1 < series2)
        
        return prev_above & curr_below
    
    def _crosses_above_series(self, group: pd.DataFrame, col1: str, col2: str) -> np.ndarray:
        """Helper function for crosses_above in eval environment"""
        try:
            # Try to get numeric value
            val2 = float(col2)
            series2 = pd.Series([val2] * len(group))
        except ValueError:
            # It's a column name
            if col2 in group.columns:
                series2 = group[col2]
            else:
                return np.array([False] * len(group))
        
        if col1 in group.columns:
            series1 = group[col1]
            crosses = self._crosses_above(series1, series2)
            return np.array(crosses.values)
        else:
            return np.array([False] * len(group))
    
    def _crosses_below_series(self, group: pd.DataFrame, col1: str, col2: str) -> np.ndarray:
        """Helper function for crosses_below in eval environment"""
        try:
            # Try to get numeric value
            val2 = float(col2)
            series2 = pd.Series([val2] * len(group))
        except ValueError:
            # It's a column name
            if col2 in group.columns:
                series2 = group[col2]
            else:
                return np.array([False] * len(group))
        
        if col1 in group.columns:
            series1 = group[col1]
            crosses = self._crosses_below(series1, series2)
            return np.array(crosses.values)
        else:
            return np.array([False] * len(group))

class PrebuiltFilters:
    """Collection of pre-built filter templates"""
    
    @staticmethod
    def get_templates() -> Dict[str, str]:
        """Get all available filter templates"""
        return {
            # Price-based filters
            "Price Above SMA(20)": "close > sma_20",
            "Price Above SMA(50)": "close > sma_50",
            "Price Above EMA(20)": "close > ema_20",
            "Price Breaking SMA(20)": "close crosses_above sma_20",
            "Price Near 52W High": "close > high_52w * 0.95",
            "Price Near 52W Low": "close < low_52w * 1.05",
            
            # Volume filters
            "High Volume (2x Average)": "volume > volume_sma_20 * 2",
            "Volume Breakout": "volume > volume_sma_50 * 1.5",
            "Above Average Volume": "volume > volume_sma_20",
            
            # Technical indicator filters
            "RSI Overbought": "rsi > 70",
            "RSI Oversold": "rsi < 30",
            "RSI Bullish Reversal": "rsi > 30 AND rsi < 50",
            "MACD Bullish": "macd > macd_signal",
            "MACD Bearish": "macd < macd_signal",
            "MACD Bullish Crossover": "macd crosses_above macd_signal",
            
            # Bollinger Band filters
            "Bollinger Upper Break": "close > bb_upper",
            "Bollinger Lower Break": "close < bb_lower",
            "Bollinger Squeeze": "bb_upper - bb_lower < atr * 2",
            
            # Combination filters
            "Bullish Momentum": "close > sma_20 AND rsi > 50 AND volume > volume_sma_20",
            "Bearish Momentum": "close < sma_20 AND rsi < 50 AND volume > volume_sma_20",
            "Breakout Pattern": "close > high_20 AND volume > volume_sma_20 * 1.5",
            "Oversold Bounce": "rsi < 30 AND close > sma_5",
        }
    
    @staticmethod
    def get_filter_description(filter_name: str) -> str:
        """Get description for a filter"""
        descriptions = {
            "Price Above SMA(20)": "Stock price is above 20-day simple moving average",
            "High Volume (2x Average)": "Trading volume is twice the 20-day average",
            "RSI Overbought": "RSI indicator shows overbought condition (>70)",
            "MACD Bullish": "MACD line is above signal line (bullish)",
            "Bollinger Upper Break": "Price has broken above upper Bollinger Band",
            "Bullish Momentum": "Multiple bullish indicators aligned",
            # Add more descriptions as needed
        }
        return descriptions.get(filter_name, "Custom filter condition")

class FilterValidator:
    """Validates filter expressions before execution"""
    
    def __init__(self):
        self.allowed_columns = [
            'open', 'high', 'low', 'close', 'volume',
            'sma_5', 'sma_10', 'sma_20', 'sma_50', 'sma_200',
            'ema_12', 'ema_26', 'ema_20', 'ema_50',
            'rsi', 'macd', 'macd_signal', 'macd_histogram',
            'bb_upper', 'bb_middle', 'bb_lower', 'bb_width',
            'atr', 'volume_sma_20', 'volume_sma_50',
            'high_20', 'low_20', 'high_52w', 'low_52w'
        ]
        self.allowed_operators = [
            '>', '<', '>=', '<=', '==', '!=',
            'crosses_above', 'crosses_below', 'AND', 'OR'
        ]
    
    def validate_filter(self, filter_string: str) -> tuple[bool, str]:
        """Validate filter expression"""
        try:
            # Basic syntax check
            if not filter_string or filter_string.strip() == "":
                return False, "Filter cannot be empty"
            
            # Check for dangerous functions
            dangerous_keywords = ['import', 'exec', 'eval', 'open', 'file', '__']
            for keyword in dangerous_keywords:
                if keyword in filter_string.lower():
                    return False, f"Dangerous keyword '{keyword}' not allowed"
            
            # Check column names
            tokens = self._tokenize_filter(filter_string)
            for token in tokens:
                if token.replace('.', '').replace('_', '').isalpha():
                    if token not in self.allowed_columns and token not in ['AND', 'OR']:
                        return False, f"Unknown column '{token}'"
            
            return True, "Valid filter"
        
        except Exception as e:
            return False, f"Validation error: {str(e)}"
    
    def _tokenize_filter(self, filter_string: str) -> list:
        """Extract tokens from filter string"""
        import re
        # Split by operators and whitespace, keep non-empty tokens
        tokens = re.findall(r'\w+|\d+\.?\d*', filter_string)
        return [token for token in tokens if token]