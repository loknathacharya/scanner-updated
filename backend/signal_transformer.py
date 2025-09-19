"""
Signal Transformer Module for BackTestEngine Integration

This module provides data transformation capabilities to convert scanner output
into the format expected by BackTestEngine, eliminating the need for manual file uploads.
"""

import pandas as pd
import numpy as np
from typing import List, Dict, Any, Optional
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SignalTransformer:
    """Transform scanner output to BackTestEngine format"""
    
    def __init__(self):
        """Initialize signal transformer"""
        self.column_mapping = {
            'symbol': 'Ticker',
            'date': 'Date',
            'open': 'Open',
            'high': 'High',
            'low': 'Low',
            'close': 'Close',
            'volume': 'Volume'
        }
    
    def transform_scanner_signals(self, scanner_results: List[Dict[str, Any]]) -> pd.DataFrame:
        """
        Convert scanner output to BackTestEngine format
        
        Args:
            scanner_results: List of dictionaries containing scanner results
            
        Returns:
            pd.DataFrame: Transformed DataFrame with BackTestEngine column names
            
        Raises:
            ValueError: If required columns are missing
        """
        try:
            # Convert list of dicts to DataFrame
            df = pd.DataFrame(scanner_results)
            
            # Validate required columns
            required_columns = ['symbol', 'date']
            missing_columns = [col for col in required_columns if col not in df.columns]
            if missing_columns:
                raise ValueError(f"Missing required columns: {missing_columns}")
            
            # Log transformation details
            logger.info(f"Transforming {len(df)} scanner signals")
            
            # Map column names: symbol → Ticker, date → Date
            df['Ticker'] = df['symbol'].astype(str).str.upper()

            # Robust date parsing: many feeds are DD-MM-YYYY for signals
            df['Date'] = pd.to_datetime(df['date'], errors='coerce', dayfirst=True)
            # Fallback: if most are NaT, try month-first
            if df['Date'].isna().mean() > 0.5:
                alt = pd.to_datetime(df['date'], errors='coerce', dayfirst=False)
                # prefer whichever yields fewer NaT
                if alt.notna().sum() > df['Date'].notna().sum():
                    df['Date'] = alt

            # Standardize OHLCV column names if they exist
            for old_name, new_name in self.column_mapping.items():
                if old_name in df.columns and old_name not in ['symbol', 'date']:
                    df[new_name] = df[old_name]

            # Coerce numeric types if present
            for col in ['Open', 'High', 'Low', 'Close', 'Volume']:
                if col in df.columns:
                    df[col] = pd.to_numeric(df[col], errors='coerce')

            # Return only the columns needed by BackTestEngine
            required_columns = ['Ticker', 'Date', 'Open', 'High', 'Low', 'Close', 'Volume']
            available_columns = [col for col in required_columns if col in df.columns]

            if 'Ticker' not in available_columns or 'Date' not in available_columns:
                raise ValueError(f"Insufficient columns available. Required at least Ticker and Date. Found: {available_columns}")

            result_df = df[available_columns].copy()

            # Drop invalid dates
            result_df.dropna(subset=['Date'], inplace=True)

            # Log transformation summary
            logger.info(f"Transformed signals shape: {result_df.shape}")
            logger.info(f"Available columns: {list(result_df.columns)}")

            return result_df
        
        except Exception as e:
            logger.error(f"Error transforming scanner signals: {str(e)}")
            raise ValueError(f"Signal transformation failed: {str(e)}")
    
    def transform_ohlcv_data(self, ohlcv_data: List[Dict[str, Any]]) -> pd.DataFrame:
        """
        Transform OHLCV data to BackTestEngine format
        
        Args:
            ohlcv_data: List of dictionaries containing OHLCV data
            
        Returns:
            pd.DataFrame: Transformed DataFrame with standardized column names
            
        Raises:
            ValueError: If required columns are missing
        """
        try:
            # Convert list of dicts to DataFrame
            df = pd.DataFrame(ohlcv_data)
            
            # Validate required columns
            required_columns = ['symbol', 'date', 'open', 'high', 'low', 'close', 'volume']
            missing_columns = [col for col in required_columns if col not in df.columns]
            if missing_columns:
                raise ValueError(f"Missing required OHLCV columns: {missing_columns}")
            
            # Log transformation details
            logger.info(f"Transforming {len(df)} OHLCV records")
            
            # Map column names: symbol → Ticker, date → Date
            df['Ticker'] = df['symbol']
            df['Date'] = pd.to_datetime(df['date'])
            
            # Standardize OHLCV column names
            for old_name, new_name in self.column_mapping.items():
                if old_name in df.columns:
                    df[new_name] = df[old_name]

            # Coerce dtypes robustly
            df['Date'] = pd.to_datetime(df['Date'], errors='coerce')
            for col in ['Open', 'High', 'Low', 'Close', 'Volume']:
                if col in df.columns:
                    df[col] = pd.to_numeric(df[col], errors='coerce')

            # Return only the columns needed by BackTestEngine
            result_df = df[['Ticker', 'Date', 'Open', 'High', 'Low', 'Close', 'Volume']].copy()

            # Drop rows with invalid dates or required price fields
            result_df.dropna(subset=['Date', 'High', 'Low', 'Close'], inplace=True)

            # Log transformation summary
            logger.info(f"Transformed OHLCV shape: {result_df.shape}")
            logger.info(f"Date range: {result_df['Date'].min()} to {result_df['Date'].max()}")
            logger.info(f"Unique tickers: {result_df['Ticker'].nunique()}")

            return result_df
        
        except Exception as e:
            logger.error(f"Error transforming OHLCV data: {str(e)}")
            raise ValueError(f"OHLCV transformation failed: {str(e)}")
    
    def prepare_vectorized_data(self, ohlcv_df: pd.DataFrame) -> Dict[str, np.ndarray]:
        """
        Prepare OHLCV data in vectorized format for faster processing
        
        Args:
            ohlcv_df: DataFrame containing OHLCV data
            
        Returns:
            Dict[str, np.ndarray]: Dictionary mapping tickers to vectorized data arrays
            
        Raises:
            ValueError: If data preparation fails
        """
        try:
            vectorized_data = {}

            # Ensure correct dtypes globally
            ohlcv_df = ohlcv_df.copy()
            # Use pandas dtype checker for extension dtypes as well
            if not pd.api.types.is_datetime64_any_dtype(ohlcv_df['Date']):
                ohlcv_df['Date'] = pd.to_datetime(ohlcv_df['Date'], errors='coerce')
            for col in ['High', 'Low', 'Close', 'Volume']:
                if col in ohlcv_df.columns:
                    ohlcv_df[col] = pd.to_numeric(ohlcv_df[col], errors='coerce')

            # Group by ticker and prepare vectorized data
            for ticker in ohlcv_df['Ticker'].unique():
                td = ohlcv_df[ohlcv_df['Ticker'] == ticker].sort_values('Date').copy()
                # Drop invalid rows
                td.dropna(subset=['Date', 'High', 'Low', 'Close'], inplace=True)

                if len(td) < 2:  # Need at least 2 data points for meaningful analysis
                    logger.warning(f"Skipping ticker {ticker}: insufficient data ({len(td)} records)")
                    continue

                # Create numpy array: [Date_ordinal, High, Low, Close, Volume]
                # Convert Date -> ordinal safely
                date_py = td['Date'].dt.to_pydatetime()
                dates = np.array([d.toordinal() for d in date_py], dtype=np.int64)
                prices = td[['High', 'Low', 'Close']].to_numpy(dtype=float)
                volume = td['Volume'].to_numpy(dtype=float) if 'Volume' in td.columns else np.zeros(len(td), dtype=float)

                # Combine dates, prices, and volume
                combined = np.column_stack([dates, prices, volume])
                vectorized_data[ticker] = combined
                
                logger.debug(f"Prepared vectorized data for {ticker}: {combined.shape}")
            
            logger.info(f"Prepared vectorized data for {len(vectorized_data)} tickers")
            return vectorized_data
        
        except Exception as e:
            logger.error(f"Error preparing vectorized data: {str(e)}")
            raise ValueError(f"Vectorized data preparation failed: {str(e)}")
    
    def validate_data_compatibility(self, signals_df: pd.DataFrame, ohlcv_df: pd.DataFrame) -> Dict[str, Any]:
        """
        Validate compatibility between signals and OHLCV data
        
        Args:
            signals_df: DataFrame containing signals
            ohlcv_df: DataFrame containing OHLCV data
            
        Returns:
            Dict[str, Any]: Validation results with any issues found
        """
        validation_result = {
            'valid': True,
            'issues': [],
            'warnings': [],
            'summary': {}
        }
        
        try:
            # Check for common tickers
            signal_tickers = set(signals_df['Ticker'].unique())
            ohlcv_tickers = set(ohlcv_df['Ticker'].unique())
            common_tickers = signal_tickers.intersection(ohlcv_tickers)
            
            validation_result['summary']['signal_tickers'] = len(signal_tickers)
            validation_result['summary']['ohlcv_tickers'] = len(ohlcv_tickers)
            validation_result['summary']['common_tickers'] = len(common_tickers)
            
            if len(common_tickers) == 0:
                validation_result['valid'] = False
                validation_result['issues'].append("No common tickers found between signals and OHLCV data")
            elif len(common_tickers) < len(signal_tickers):
                missing_tickers = signal_tickers - common_tickers
                validation_result['warnings'].append(
                    f"Missing OHLCV data for {len(missing_tickers)} signal tickers: {list(missing_tickers)[:5]}"
                )
            
            # Check date ranges
            signals_date_range = (signals_df['Date'].min(), signals_df['Date'].max())
            ohlcv_date_range = (ohlcv_df['Date'].min(), ohlcv_df['Date'].max())
            
            validation_result['summary']['signals_date_range'] = signals_date_range
            validation_result['summary']['ohlcv_date_range'] = ohlcv_date_range
            
            # Check if OHLCV data covers signal dates
            if signals_date_range[0] < ohlcv_date_range[0]:
                validation_result['warnings'].append(
                    f"Signals start before OHLCV data: {signals_date_range[0]} vs {ohlcv_date_range[0]}"
                )
            
            if signals_date_range[1] > ohlcv_date_range[1]:
                validation_result['warnings'].append(
                    f"Signals end after OHLCV data: {signals_date_range[1]} vs {ohlcv_date_range[1]}"
                )
            
            # Check for missing OHLCV data
            for ticker in common_tickers:
                ticker_signals = signals_df[signals_df['Ticker'] == ticker]
                ticker_ohlcv = ohlcv_df[ohlcv_df['Ticker'] == ticker]
                
                if len(ticker_signals) > len(ticker_ohlcv):
                    validation_result['warnings'].append(
                        f"More signals than OHLCV records for {ticker}: {len(ticker_signals)} vs {len(ticker_ohlcv)}"
                    )
            
            logger.info(f"Data validation completed: {validation_result}")
            return validation_result
        
        except Exception as e:
            logger.error(f"Error validating data compatibility: {str(e)}")
            validation_result['valid'] = False
            validation_result['issues'].append(f"Validation failed: {str(e)}")
            return validation_result
    
    def merge_signals_with_ohlcv(self, signals_df: pd.DataFrame, ohlcv_df: pd.DataFrame) -> pd.DataFrame:
        """
        Merge signals with OHLCV data based on ticker and date
        
        Args:
            signals_df: DataFrame containing signals
            ohlcv_df: DataFrame containing OHLCV data
            
        Returns:
            pd.DataFrame: Merged DataFrame with signals and OHLCV data
        """
        try:
            # Validate data compatibility first
            validation = self.validate_data_compatibility(signals_df, ohlcv_df)
            if not validation['valid']:
                raise ValueError(f"Data validation failed: {validation['issues']}")
            
            # Merge on Ticker and Date
            merged_df = pd.merge(
                signals_df,
                ohlcv_df,
                on=['Ticker', 'Date'],
                how='inner',
                suffixes=('_signal', '_ohlcv')
            )
            
            logger.info(f"Merged {len(merged_df)} signal records with OHLCV data")
            logger.info(f"Merged shape: {merged_df.shape}")
            
            return merged_df
        
        except Exception as e:
            logger.error(f"Error merging signals with OHLCV data: {str(e)}")
            raise ValueError(f"Data merge failed: {str(e)}")
    
    def generate_signal_hash(self, signals_df: pd.DataFrame) -> str:
        """
        Generate a hash for signals data to use as cache key
        
        Args:
            signals_df: DataFrame containing signals
            
        Returns:
            str: MD5 hash of the signals data
        """
        try:
            import hashlib
            
            # Create a string representation of the signals data
            signals_str = f"{len(signals_df)}_{','.join(signals_df['Ticker'].unique())[:100]}"
            
            # Generate hash
            hash_obj = hashlib.md5(signals_str.encode())
            return hash_obj.hexdigest()
        
        except Exception as e:
            logger.error(f"Error generating signal hash: {str(e)}")
            return ""
    
    def export_transformed_data(self, data: pd.DataFrame, filename: str) -> str:
        """
        Export transformed data to CSV file
        
        Args:
            data: DataFrame to export
            filename: Output filename
            
        Returns:
            str: Path to exported file
        """
        try:
            # Add timestamp to filename if not present
            if not filename.endswith('.csv'):
                filename = f"{filename}.csv"
            
            # Export to CSV
            data.to_csv(filename, index=False)
            
            logger.info(f"Exported transformed data to {filename}")
            return filename
        
        except Exception as e:
            logger.error(f"Error exporting transformed data: {str(e)}")
            raise ValueError(f"Data export failed: {str(e)}")