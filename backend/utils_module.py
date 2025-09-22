import pandas as pd
import numpy as np
import streamlit as st
from typing import Dict, Any, Optional, Union, Mapping
import io
from datetime import datetime
import sys
try:
    from .indicators_module import TechnicalIndicators
except Exception:
    from indicators_module import TechnicalIndicators

try:
    from .performance_optimizer import PerformanceOptimizer
except Exception:
    from performance_optimizer import PerformanceOptimizer

class DataProcessor:
    """Handle data loading, processing, and validation"""
    
    def __init__(self):
        self.required_columns = ['open', 'high', 'low', 'close', 'volume']
        self.date_formats = [
            '%Y-%m-%d', '%d-%m-%Y', '%m-%d-%Y',
            '%Y/%m/%d', '%d/%m/%Y', '%m/%d/%Y',
            '%Y-%m-%d %H:%M:%S', '%d-%m-%Y %H:%M:%S'
        ]
    
    def load_file(self, uploaded_file, filename: str = "") -> pd.DataFrame:
        """Load file based on its extension"""
        import time
        start_time = time.time()
        print(f"DEBUG: Starting file loading")
        
        # Handle both Streamlit and FastAPI file upload objects
        if hasattr(uploaded_file, 'name'):
            # Streamlit file
            file_extension = uploaded_file.name.split('.')[-1].lower()
            print(f"DEBUG: Detected file extension from name: {file_extension}")
        elif filename:
            # FastAPI file with explicit filename
            file_extension = filename.split('.')[-1].lower()
            print(f"DEBUG: Detected file extension from filename: {file_extension}")
        else:
            # FastAPI file without filename, try to get from content-type or default to csv
            file_extension = 'csv'  # Default assumption
            print(f"DEBUG: Using default file extension: {file_extension}")
        
        try:
            # For FastAPI, we need to read the file content
            if not hasattr(uploaded_file, 'name'):
                # Reset file pointer to beginning
                print(f"DEBUG: Resetting file pointer for FastAPI upload")
                uploaded_file.file.seek(0)
                file_content = uploaded_file.file
            else:
                file_content = uploaded_file
            
            print(f"DEBUG: Starting file reading for extension: {file_extension}")
            read_start = time.time()
            
            if file_extension == 'csv':
                # Try different encodings
                print(f"DEBUG: Trying CSV with utf-8 encoding")
                try:
                    df = pd.read_csv(file_content, encoding='utf-8')
                    print(f"DEBUG: CSV read successfully with utf-8")
                except UnicodeDecodeError:
                    print(f"DEBUG: UnicodeDecodeError with utf-8, trying latin-1")
                    if hasattr(file_content, 'seek'):
                        file_content.seek(0)
                    df = pd.read_csv(file_content, encoding='latin-1')
                    print(f"DEBUG: CSV read successfully with latin-1")
            
            elif file_extension in ['xlsx', 'xls']:
                print(f"DEBUG: Reading Excel file with engine: {'openpyxl' if file_extension == 'xlsx' else 'xlrd'}")
                try:
                    # Try openpyxl first for xlsx files
                    if file_extension == 'xlsx':
                        print(f"DEBUG: Trying openpyxl engine")
                        df = pd.read_excel(file_content, engine='openpyxl')
                        print(f"DEBUG: Excel file read successfully with openpyxl")
                    else:
                        print(f"DEBUG: Using xlrd engine for .xls files")
                        df = pd.read_excel(file_content, engine='xlrd')
                        print(f"DEBUG: Excel file read successfully with xlrd")
                except Exception as e:
                    print(f"DEBUG: Primary Excel engine failed, trying alternatives: {str(e)}")
                    # Try alternative engines
                    try:
                        if file_extension == 'xlsx':
                            print(f"DEBUG: Trying xlrd engine as fallback")
                            df = pd.read_excel(file_content, engine='xlrd')
                            print(f"DEBUG: Excel file read successfully with xlrd fallback")
                        else:
                            print(f"DEBUG: Trying openpyxl engine as fallback")
                            df = pd.read_excel(file_content, engine='openpyxl')
                            print(f"DEBUG: Excel file read successfully with openpyxl fallback")
                    except Exception as fallback_e:
                        print(f"DEBUG: All Excel engines failed: {str(fallback_e)}")
                        raise fallback_e
            
            elif file_extension == 'parquet':
                print(f"DEBUG: Reading Parquet file")
                df = pd.read_parquet(file_content)
                print(f"DEBUG: Parquet file read successfully")
            
            else:
                raise ValueError(f"Unsupported file format: {file_extension}")
            
            read_end = time.time()
            print(f"DEBUG: File reading completed in {read_end - read_start:.2f}s, shape: {df.shape}")
            
            # Basic validation
            print(f"DEBUG: Starting file validation")
            validate_start = time.time()
            if df.empty:
                raise ValueError("File is empty")
            
            if len(df.columns) < 5:
                raise ValueError("File must have at least 5 columns (Date, Symbol, OHLC, Volume)")
            
            validate_end = time.time()
            print(f"DEBUG: File validation completed in {validate_end - validate_start:.2f}s")
            
            total_end = time.time()
            print(f"DEBUG: Total file loading completed in {total_end - start_time:.2f}s")
            
            return df
        
        except Exception as e:
            print(f"DEBUG: File loading failed with error: {str(e)}")
            # For FastAPI, we don't have st.error
            if 'st' in globals():
                st.error(f"Error loading file: {str(e)}")
            raise e
    
    def detect_columns(self, df: pd.DataFrame) -> Dict[str, Optional[str]]:
        """Automatically detect OHLCV columns"""
        detected: Dict[str, Optional[str]] = {
            'date': None,
            'symbol': None,
            'open': None,
            'high': None,
            'low': None,
            'close': None,
            'volume': None
        }
        
        # Convert column names to lowercase for matching
        lower_cols = {col.lower(): col for col in df.columns}
        
        # Date column detection
        date_keywords = ['date', 'datetime', 'time', 'timestamp', 'day']
        for keyword in date_keywords:
            for lower_col, original_col in lower_cols.items():
                if keyword in lower_col:
                    detected['date'] = original_col
                    break
            if detected['date']:
                break
        
        # Symbol column detection
        symbol_keywords = ['symbol', 'ticker', 'stock', 'code', 'instrument']
        for keyword in symbol_keywords:
            for lower_col, original_col in lower_cols.items():
                if keyword in lower_col:
                    detected['symbol'] = original_col
                    break
            if detected['symbol']:
                break
        
        # OHLCV column detection
        ohlcv_mapping = {
            'open': ['open', 'o'],
            'high': ['high', 'h'],
            'low': ['low', 'l'],
            'close': ['close', 'c', 'adj_close', 'adjusted_close'],
            'volume': ['volume', 'vol', 'v']
        }
        
        for col_type, keywords in ohlcv_mapping.items():
            for keyword in keywords:
                for lower_col, original_col in lower_cols.items():
                    if keyword == lower_col or keyword in lower_col:
                        detected[col_type] = original_col
                        break
                if detected[col_type]:
                    break
        
        return detected
    
    def validate_data(self, df: pd.DataFrame, column_mapping: Dict[str, str]) -> tuple[bool, str]:
        """Validate the processed data"""
        try:
            # Check if required columns are present
            missing_cols = []
            for col_type, col_name in column_mapping.items():
                if col_name is None or col_name not in df.columns:
                    missing_cols.append(col_type)
            
            if missing_cols:
                return False, f"Missing required columns: {', '.join(missing_cols)}"
            
            # Check data types
            numeric_cols = ['open', 'high', 'low', 'close', 'volume']
            for col_type in numeric_cols:
                col_name = column_mapping[col_type]
                if not pd.api.types.is_numeric_dtype(df[col_name]):
                    try:
                        df[col_name] = pd.to_numeric(df[col_name], errors='coerce')
                        if df[col_name].isna().all():
                            return False, f"Column '{col_name}' cannot be converted to numeric"
                    except Exception:
                        return False, f"Column '{col_name}' must be numeric"
            
            # Check for negative values in OHLC
            for col_type in ['open', 'high', 'low', 'close']:
                col_name = column_mapping[col_type]
                if (df[col_name] < 0).any():
                    return False, f"Column '{col_name}' contains negative values"
            
            # Check OHLC relationships
            open_col = column_mapping['open']
            high_col = column_mapping['high']
            low_col = column_mapping['low']
            close_col = column_mapping['close']
            
            # High should be >= Open, Low, Close
            if not (df[high_col] >= df[open_col]).all() or not (df[high_col] >= df[close_col]).all():
                st.warning("Some high values are less than open/close values")
            
            # Low should be <= Open, High, Close
            if not (df[low_col] <= df[open_col]).all() or not (df[low_col] <= df[close_col]).all():
                st.warning("Some low values are greater than open/close values")
            
            return True, "Data validation passed"
        
        except Exception as e:
            return False, f"Validation error: {str(e)}"
    
    def process_data(self, df: pd.DataFrame, date_col: str, symbol_col: str, detected_cols: Dict[str, Optional[str]], calculate_indicators: bool = True) -> pd.DataFrame:
        """Process and clean the data"""
        import time
        start_time = time.time()
        print(f"DEBUG: Starting data processing for {len(df)} rows, calculate_indicators: {calculate_indicators}")
        
        processed_df = df.copy()
        
        # Rename columns to standard names
        column_mapping = {
            'date': date_col,
            'symbol': symbol_col,
            'open': detected_cols.get('open'),
            'high': detected_cols.get('high'),
            'low': detected_cols.get('low'),
            'close': detected_cols.get('close'),
            'volume': detected_cols.get('volume')
        }
        
        # Create new dataframe with standard column names
        standard_df = pd.DataFrame()
        for standard_name, original_name in column_mapping.items():
            if original_name and original_name in processed_df.columns:
                standard_df[standard_name] = processed_df[original_name]
        
        print(f"DEBUG: Column mapping completed, shape: {standard_df.shape}")
        
        # Process date column
        print(f"DEBUG: Starting date column processing")
        date_start = time.time()
        standard_df['date'] = self._process_date_column(standard_df['date'])
        date_end = time.time()
        print(f"DEBUG: Date column processing completed in {date_end - date_start:.2f}s")
        
        # Convert numeric columns
        print(f"DEBUG: Starting numeric conversion")
        numeric_start = time.time()
        numeric_cols = ['open', 'high', 'low', 'close', 'volume']
        for col in numeric_cols:
            if col in standard_df.columns:
                standard_df[col] = pd.to_numeric(standard_df[col], errors='coerce')
        numeric_end = time.time()
        print(f"DEBUG: Numeric conversion completed in {numeric_end - numeric_start:.2f}s")
        
        # Remove rows with missing critical data
        print(f"DEBUG: Starting data cleaning")
        clean_start = time.time()
        original_rows = len(standard_df)
        standard_df = standard_df.dropna(subset=['date', 'symbol', 'close'])
        cleaned_rows = len(standard_df)
        clean_end = time.time()
        print(f"DEBUG: Data cleaning completed in {clean_end - clean_start:.2f}s, removed {original_rows - cleaned_rows} rows")
        
        # Sort by symbol and date
        print(f"DEBUG: Starting data sorting")
        sort_start = time.time()
        standard_df = standard_df.sort_values(['symbol', 'date']).reset_index(drop=True)
        sort_end = time.time()
        print(f"DEBUG: Data sorting completed in {sort_end - sort_start:.2f}s")
        
        # Add technical indicators only if requested (this is the bottleneck)
        if calculate_indicators:
            print(f"DEBUG: Starting technical indicators calculation")
            indicators_start = time.time()
            
            try:
                # Check if we're in a Streamlit environment
                if 'streamlit' in sys.modules:
                    with st.spinner("Calculating technical indicators..."):
                        # Create TechnicalIndicators instance and call the updated method
                        indicator_calculator = TechnicalIndicators()
                        
                        # Initialize performance optimizer
                        perf_optimizer = PerformanceOptimizer()
                        
                        # Optimize memory usage before calculating indicators
                        print(f"DEBUG: Starting memory optimization before indicators")
                        mem_opt_start = time.time()
                        optimized_df = perf_optimizer.optimize_memory_usage(standard_df)
                        mem_opt_end = time.time()
                        print(f"DEBUG: Memory optimization completed in {mem_opt_end - mem_opt_start:.2f}s")
                        
                        # Calculate indicators
                        print(f"DEBUG: Starting indicators calculation for {len(optimized_df)} rows, {optimized_df['symbol'].nunique()} symbols")
                        calc_start = time.time()
                        standard_df = indicator_calculator.add_all_indicators(optimized_df)
                        calc_end = time.time()
                        print(f"DEBUG: Indicators calculation completed in {calc_end - calc_start:.2f}s")
                        
                        # Apply final memory optimization
                        print(f"DEBUG: Starting final memory optimization")
                        final_mem_start = time.time()
                        standard_df = perf_optimizer.optimize_memory_usage(standard_df)
                        final_mem_end = time.time()
                        print(f"DEBUG: Final memory optimization completed in {final_mem_end - final_mem_start:.2f}s")
                else:
                    # Create TechnicalIndicators instance and call the updated method
                    indicator_calculator = TechnicalIndicators()
                    
                    # Initialize performance optimizer
                    perf_optimizer = PerformanceOptimizer()
                    
                    # Optimize memory usage before calculating indicators
                    print(f"DEBUG: Starting memory optimization before indicators")
                    mem_opt_start = time.time()
                    optimized_df = perf_optimizer.optimize_memory_usage(standard_df)
                    mem_opt_end = time.time()
                    print(f"DEBUG: Memory optimization completed in {mem_opt_end - mem_opt_start:.2f}s")
                    
                    # Calculate indicators
                    print(f"DEBUG: Starting indicators calculation for {len(optimized_df)} rows, {optimized_df['symbol'].nunique()} symbols")
                    calc_start = time.time()
                    standard_df = indicator_calculator.add_all_indicators(optimized_df)
                    calc_end = time.time()
                    print(f"DEBUG: Indicators calculation completed in {calc_end - calc_start:.2f}s")
                    
                    # Apply final memory optimization
                    print(f"DEBUG: Starting final memory optimization")
                    final_mem_start = time.time()
                    standard_df = perf_optimizer.optimize_memory_usage(standard_df)
                    final_mem_end = time.time()
                    print(f"DEBUG: Final memory optimization completed in {final_mem_end - final_mem_start:.2f}s")
                
                indicators_end = time.time()
                print(f"DEBUG: Technical indicators calculation completed in {indicators_end - indicators_start:.2f}s")
                
            except Exception as e:
                print(f"DEBUG: Technical indicators calculation failed: {str(e)}")
                print(f"DEBUG: Continuing without indicators")
                # Continue without indicators if calculation fails
        else:
            print(f"DEBUG: Skipping technical indicators calculation (set to False)")
        
        total_end = time.time()
        print(f"DEBUG: Total data processing completed in {total_end - start_time:.2f}s, final shape: {standard_df.shape}")
        
        return standard_df
    
    def _process_date_column(self, date_series: pd.Series) -> pd.Series:
        """Process and standardize date column"""
        import time
        start_time = time.time()
        print(f"DEBUG _process_date_column: Starting date processing for {len(date_series)} rows")
        
        # DEBUG: Log input date series info
        print(f"DEBUG _process_date_column: Input dtype: {date_series.dtype}")
        print(f"DEBUG _process_date_column: Sample values: {date_series.head().tolist()}")
        if hasattr(date_series, 'dt') and hasattr(date_series.dt, 'tz'):
            print(f"DEBUG _process_date_column: Input timezone: {date_series.dt.tz}")
        
        if pd.api.types.is_datetime64_any_dtype(date_series):
            print(f"DEBUG _process_date_column: Already datetime, converting")
            convert_start = time.time()
            result = pd.to_datetime(date_series)
            convert_end = time.time()
            print(f"DEBUG _process_date_column: Already datetime, converted dtype: {result.dtype}, took {convert_end - convert_start:.2f}s")
            if hasattr(result, 'dt') and hasattr(result.dt, 'tz'):
                print(f"DEBUG _process_date_column: Result timezone: {result.dt.tz}")
            return result
        
        # Try different date formats
        print(f"DEBUG _process_date_column: Trying {len(self.date_formats)} date formats")
        for i, date_format in enumerate(self.date_formats):
            format_start = time.time()
            try:
                result = pd.to_datetime(date_series, format=date_format)
                format_end = time.time()
                print(f"DEBUG _process_date_column: Successfully parsed with format {date_format} (attempt {i+1}), dtype: {result.dtype}, took {format_end - format_start:.2f}s")
                if hasattr(result, 'dt') and hasattr(result.dt, 'tz'):
                    print(f"DEBUG _process_date_column: Result timezone: {result.dt.tz}")
                return result
            except (ValueError, TypeError) as e:
                format_end = time.time()
                print(f"DEBUG _process_date_column: Format {date_format} failed (attempt {i+1}), took {format_end - format_start:.2f}s, error: {str(e)}")
                continue
        
        # If all formats fail, use pandas infer
        print(f"DEBUG _process_date_column: All formats failed, trying pandas infer")
        infer_start = time.time()
        try:
            result = pd.to_datetime(date_series)
            infer_end = time.time()
            print(f"DEBUG _process_date_column: Pandas infer successful, dtype: {result.dtype}, took {infer_end - infer_start:.2f}s")
            if hasattr(result, 'dt') and hasattr(result.dt, 'tz'):
                print(f"DEBUG _process_date_column: Result timezone: {result.dt.tz}")
            return result
        except Exception as e:
            infer_end = time.time()
            print(f"DEBUG _process_date_column: Pandas infer failed, took {infer_end - infer_start:.2f}s, error: {str(e)}")
            st.error("Could not parse date column. Please check date format.")
            raise ValueError("Invalid date format")
        
        total_end = time.time()
        print(f"DEBUG _process_date_column: Total date processing completed in {total_end - start_time:.2f}s")
    
    def get_data_summary(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Get summary statistics of the data"""
        if df.empty:
            return {}
        
        summary = {
            'total_records': len(df),
            'unique_symbols': df['symbol'].nunique() if 'symbol' in df.columns else 0,
            'date_range': {
                'start': df['date'].min() if 'date' in df.columns else None,
                'end': df['date'].max() if 'date' in df.columns else None
            },
            'missing_data': df.isnull().sum().to_dict(),
            'numeric_summary': df.select_dtypes(include=[np.number]).describe().to_dict()
        }
        
        return summary
    
    def clean_outliers(self, df: pd.DataFrame, method: str = 'iqr') -> pd.DataFrame:
        """Remove outliers from the data"""
        cleaned_df = df.copy()
        
        if method == 'iqr':
            numeric_cols = ['open', 'high', 'low', 'close', 'volume']
            
            for col in numeric_cols:
                if col in cleaned_df.columns:
                    Q1 = cleaned_df[col].quantile(0.25)
                    Q3 = cleaned_df[col].quantile(0.75)
                    IQR = Q3 - Q1
                    
                    lower_bound = Q1 - 1.5 * IQR
                    upper_bound = Q3 + 1.5 * IQR
                    
                    # Remove outliers
                    mask = (cleaned_df[col] >= lower_bound) & (cleaned_df[col] <= upper_bound)
                    cleaned_df = cleaned_df[mask]
        
        return cleaned_df.reset_index(drop=True)

class DataValidator:
    """Additional data validation utilities"""
    
    @staticmethod
    def check_data_completeness(df: pd.DataFrame) -> Dict[str, float]:
        """Check completeness of data for each symbol"""
        completeness = {}
        
        if 'symbol' in df.columns:
            for symbol, group in df.groupby('symbol'):
                total_possible_cols = len(['open', 'high', 'low', 'close', 'volume'])
                available_cols = len([col for col in ['open', 'high', 'low', 'close', 'volume'] if col in group.columns])
                
                # Calculate completeness percentage
                missing_percentage = group[['open', 'high', 'low', 'close', 'volume']].isnull().sum().sum()
                total_values = len(group) * available_cols
                
                completeness[symbol] = ((total_values - missing_percentage) / total_values) * 100 if total_values > 0 else 0
        
        return completeness
    
    @staticmethod
    def detect_data_issues(df: pd.DataFrame) -> Dict[str, list]:
        """Detect common data quality issues"""
        issues = {
            'duplicate_dates': [],
            'zero_volume': [],
            'price_gaps': [],
            'invalid_ohlc': []
        }
        
        if 'symbol' in df.columns:
            for symbol, group in df.groupby('symbol'):
                group = group.sort_values('date')
                
                # Check for duplicate dates
                duplicates = group[group.duplicated(['date'], keep=False)]
                if len(duplicates) > 0:
                    issues['duplicate_dates'].append(symbol)
                
                # Check for zero volume
                if 'volume' in group.columns:
                    if (group['volume'] == 0).any():
                        issues['zero_volume'].append(symbol)
                
                # Check for large price gaps
                if 'close' in group.columns and len(group) > 1:
                    price_change = group['close'].pct_change().abs()
                    if (price_change > 0.5).any():  # 50% price change
                        issues['price_gaps'].append(symbol)
                
                # Check OHLC validity
                ohlc_cols = ['open', 'high', 'low', 'close']
                if all(col in group.columns for col in ohlc_cols):
                    invalid_high = (group['high'] < group[['open', 'low', 'close']].max(axis=1)).any()
                    invalid_low = (group['low'] > group[['open', 'high', 'close']].min(axis=1)).any()
                    
                    if invalid_high or invalid_low:
                        issues['invalid_ohlc'].append(symbol)
        
        return issues

class FileExporter:
    """Handle file export functionality"""
    
    @staticmethod
    def to_csv(df: pd.DataFrame) -> str:
        """Export dataframe to CSV string"""
        return df.to_csv(index=False)
    
    @staticmethod
    def to_excel(df: pd.DataFrame) -> bytes:
        """Export dataframe to Excel bytes"""
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
            df.to_excel(writer, sheet_name='Scan_Results', index=False)
            
            # Get the workbook and worksheet
            workbook = writer.book
            worksheet = writer.sheets['Scan_Results']
            
            # Add formatting
            header_format = workbook.add_format({  # type: ignore
                'bold': True,
                'text_wrap': True,
                'valign': 'top',
                'fg_color': '#D7E4BC',
                'border': 1
            })
            
            # Apply header formatting
            for col_num, value in enumerate(df.columns.values):
                worksheet.write(0, col_num, value, header_format)
            
            # Auto-adjust column widths
            for i, col in enumerate(df.columns):
                max_len = max(
                    df[col].astype(str).apply(len).max(),
                    len(str(col))
                ) + 2
                worksheet.set_column(i, i, min(max_len, 50))
        
        return output.getvalue()
    
    @staticmethod
    def to_json(df: pd.DataFrame) -> str:
        """Export dataframe to JSON string"""
        return df.to_json(orient='records', date_format='iso', indent=2)

# PerformanceOptimizer class moved to performance_optimizer.py
# Import the new PerformanceOptimizer class from the dedicated module

class MarketDataUtils:
    """Utilities specific to market data"""
    
    @staticmethod
    def calculate_returns(df: pd.DataFrame) -> pd.DataFrame:
        """Calculate various return metrics"""
        result_df = df.copy()
        
        def add_returns(group):
            group = group.sort_values('date')
            
            # Daily returns
            group['daily_return'] = group['close'].pct_change()
            
            # Cumulative returns
            group['cumulative_return'] = (1 + group['daily_return']).cumprod() - 1
            
            # Rolling returns
            group['return_5d'] = group['close'].pct_change(5)
            group['return_10d'] = group['close'].pct_change(10)
            group['return_20d'] = group['close'].pct_change(20)
            
            # Rolling volatility (standard deviation of returns)
            group['volatility_20d'] = group['daily_return'].rolling(20).std() * np.sqrt(252)
            
            return group
        
        if 'symbol' in result_df.columns:
            # Apply returns calculation
            applied_result = result_df.groupby('symbol', group_keys=False).apply(add_returns)
            if isinstance(applied_result, pd.Series):
                # If it returns a Series, convert back to DataFrame
                result_df = applied_result.reset_index()
            else:
                # If it returns a DataFrame, use it directly
                result_df = applied_result.reset_index(drop=True)
        
        return result_df
    
    @staticmethod
    def add_market_cap_data(df: pd.DataFrame, shares_outstanding: Dict[str, float]) -> pd.DataFrame:
        """Add market cap calculation if shares outstanding data is provided"""
        result_df = df.copy()
        
        if 'symbol' in result_df.columns and shares_outstanding:
            def add_market_cap(group):
                symbol = group['symbol'].iloc[0]
                if symbol in shares_outstanding:
                    group['market_cap'] = group['close'] * shares_outstanding[symbol]
                return group
            
            # Apply market cap calculation
            applied_result = result_df.groupby('symbol', group_keys=False).apply(add_market_cap)
            if isinstance(applied_result, pd.Series):
                # If it returns a Series, convert back to DataFrame
                result_df = applied_result.reset_index()
            else:
                # If it returns a DataFrame, use it directly
                result_df = applied_result.reset_index(drop=True)
        
        return result_df
    
    @staticmethod
    def detect_trading_sessions(df: pd.DataFrame) -> pd.DataFrame:
        """Detect and mark trading sessions (useful for intraday data)"""
        result_df = df.copy()
        
        if 'date' in result_df.columns:
            # Extract hour from datetime
            result_df['hour'] = pd.to_datetime(result_df['date']).dt.hour
            
            # Mark trading sessions (assuming NYSE hours)
            def get_session(hour):
                if 9 <= hour < 16:
                    return 'regular'
                elif 4 <= hour < 9:
                    return 'premarket'
                elif 16 <= hour < 20:
                    return 'aftermarket'
                else:
                    return 'closed'
            
            result_df['trading_session'] = result_df['hour'].apply(get_session)
        
        return result_df