"""
Backtesting Validation Test Data Fixtures
========================================

This module generates realistic test data for backtesting validation tests.
It creates OHLCV data and trading signals with various market conditions
and edge cases to thoroughly test the backtesting engine.
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional, Any
import random
from scipy import stats

from test_config import TEST_DATA_CONFIG, POSITION_SIZING_CONFIG


class TestDataGenerator:
    """Generates realistic test data for backtesting validation."""

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """Initialize the test data generator."""
        self.config = config or TEST_DATA_CONFIG
        self.instruments = self.config['instruments']
        self.start_date = datetime.strptime(self.config['date_range']['start_date'], '%Y-%m-%d')
        self.end_date = datetime.strptime(self.config['date_range']['end_date'], '%Y-%m-%d')
        self.date_range = pd.date_range(start=self.start_date, end=self.end_date, freq='D')

        # Set random seed for reproducibility
        np.random.seed(42)
        random.seed(42)

    def generate_ohlcv_data(self) -> pd.DataFrame:
        """Generate realistic OHLCV data for all instruments."""
        all_data = []

        for instrument in self.instruments:
            # Determine volatility level for this instrument
            volatility_level = self._get_instrument_volatility(instrument)

            # Generate base price series
            base_price = self._generate_base_price_series(volatility_level)

            # Generate OHLCV data
            instrument_data = self._generate_instrument_ohlcv(
                instrument, base_price, volatility_level
            )
            all_data.append(instrument_data)

        # Combine all instruments
        ohlcv_df = pd.concat(all_data, ignore_index=True)

        # Sort by date and ticker
        ohlcv_df = ohlcv_df.sort_values(['Date', 'Ticker']).reset_index(drop=True)

        return ohlcv_df

    def generate_signals_data(self) -> pd.DataFrame:
        """Generate realistic trading signals."""
        all_signals = []

        for instrument in self.instruments:
            # Generate signals for this instrument
            instrument_signals = self._generate_instrument_signals(instrument)
            all_signals.append(instrument_signals)

        # Combine all signals
        signals_df = pd.concat(all_signals, ignore_index=True)

        # Sort by date and ticker
        signals_df = signals_df.sort_values(['Date', 'Ticker']).reset_index(drop=True)

        return signals_df

    def _get_instrument_volatility(self, instrument: str) -> str:
        """Determine volatility level for an instrument."""
        # Map instruments to volatility levels
        volatility_map = {
            'RELIANCE': 'medium',
            'TCS': 'low',
            'INFY': 'medium',
            'HDFC': 'low',
            'ICICI': 'medium',
            'KOTAK': 'low',
            'AXIS': 'medium',
            'MARUTI': 'high',
            'BAJAJ-AUTO': 'high',
            'HINDUNILVR': 'low'
        }
        return volatility_map.get(instrument, 'medium')

    def _generate_base_price_series(self, volatility_level: str) -> pd.Series:
        """Generate base price series with realistic characteristics."""
        # Base parameters for different volatility levels
        volatility_params = {
            'low': {'daily_std': 0.01, 'trend_strength': 0.3, 'noise_factor': 0.5},
            'medium': {'daily_std': 0.02, 'trend_strength': 0.5, 'noise_factor': 1.0},
            'high': {'daily_std': 0.04, 'trend_strength': 0.7, 'noise_factor': 1.5}
        }

        params = volatility_params[volatility_level]

        # Generate random walk with trend and noise
        n_days = len(self.date_range)
        daily_returns = []

        # Add trend component
        trend_returns = np.random.normal(0, params['trend_strength'] * params['daily_std'], n_days)

        # Add random noise
        noise_returns = np.random.normal(0, params['noise_factor'] * params['daily_std'], n_days)

        # Combine trend and noise
        total_returns = trend_returns + noise_returns

        # Generate price series
        initial_price = np.random.uniform(500, 3000)
        price_series = [initial_price]

        for ret in total_returns:
            new_price = price_series[-1] * (1 + ret)
            price_series.append(new_price)

        return pd.Series(price_series[:-1], index=self.date_range)

    def _generate_instrument_ohlcv(self, instrument: str, base_price: pd.Series,
                                 volatility_level: str) -> pd.DataFrame:
        """Generate OHLCV data for a single instrument."""
        data = []

        for date, close_price in base_price.items():
            # Generate OHLC from close price
            daily_range = abs(np.random.normal(0.02, 0.01))  # 2% average daily range
            open_price = close_price * (1 + np.random.normal(0, daily_range/4))
            high_price = max(open_price, close_price) * (1 + abs(np.random.normal(0, daily_range/2)))
            low_price = min(open_price, close_price) * (1 - abs(np.random.normal(0, daily_range/2)))

            # Generate volume
            base_volume = np.random.uniform(100000, 2000000)
            volume_multiplier = {'low': 0.8, 'medium': 1.0, 'high': 1.2}[volatility_level]
            volume = int(base_volume * volume_multiplier)

            data.append({
                'Ticker': instrument,
                'Date': date,
                'Open': round(open_price, 2),
                'High': round(high_price, 2),
                'Low': round(low_price, 2),
                'Close': round(close_price, 2),
                'Volume': volume
            })

        return pd.DataFrame(data)

    def _generate_instrument_signals(self, instrument: str) -> pd.DataFrame:
        """Generate trading signals for a single instrument."""
        signals = []
        signal_frequency = self.config['signal_patterns']['long_signals_per_month']

        # Generate signals across the date range
        current_date = self.start_date
        while current_date <= self.end_date:
            # Check if we should generate a signal this month
            if random.random() < 0.3:  # 30% chance of signal in any given month
                # Generate 1-3 signals per month
                num_signals = random.randint(1, 3)

                for _ in range(num_signals):
                    # Random date within the month
                    if current_date.month == 12:
                        next_month = current_date.replace(year=current_date.year + 1, month=1, day=1)
                    else:
                        next_month = current_date.replace(month=current_date.month + 1, day=1)

                    signal_date = current_date + timedelta(days=random.randint(0, 15))

                    # Determine signal type (70% long, 30% short)
                    signal_type = 'long' if random.random() < 0.7 else 'short'

                    signals.append({
                        'Ticker': instrument,
                        'Date': signal_date,
                        'Signal_Type': signal_type
                    })

            # Move to next month
            if current_date.month == 12:
                current_date = current_date.replace(year=current_date.year + 1, month=1, day=1)
            else:
                current_date = current_date.replace(month=current_date.month + 1, day=1)

        return pd.DataFrame(signals)

    def generate_edge_case_scenarios(self) -> Dict[str, pd.DataFrame]:
        """Generate edge case scenarios for testing."""
        scenarios = {}

        # Insufficient capital scenario
        scenarios['insufficient_capital'] = self._generate_insufficient_capital_scenario()

        # Extreme volatility scenario
        scenarios['extreme_volatility'] = self._generate_extreme_volatility_scenario()

        # Low liquidity scenario
        scenarios['low_liquidity'] = self._generate_low_liquidity_scenario()

        # Market gap scenario
        scenarios['market_gaps'] = self._generate_market_gap_scenario()

        return scenarios

    def _generate_insufficient_capital_scenario(self) -> pd.DataFrame:
        """Generate scenario with very low capital requirements."""
        # Create a copy of normal OHLCV data but with very low prices
        ohlcv_df = self.generate_ohlcv_data()

        # Reduce prices by factor of 100 to simulate very low capital needs
        price_columns = ['Open', 'High', 'Low', 'Close']
        for col in price_columns:
            ohlcv_df[col] = ohlcv_df[col] / 100

        return ohlcv_df

    def _generate_extreme_volatility_scenario(self) -> pd.DataFrame:
        """Generate scenario with extreme price volatility."""
        ohlcv_df = self.generate_ohlcv_data()

        # Increase volatility by modifying price ranges
        volatility_multiplier = 3.0

        for idx, row in ohlcv_df.iterrows():
            base_price = row['Close']
            daily_range = abs(np.random.normal(0.10, 0.05)) * volatility_multiplier

            new_open = base_price * (1 + np.random.normal(0, daily_range/4))
            new_high = max(new_open, base_price) * (1 + abs(np.random.normal(0, daily_range/2)))
            new_low = min(new_open, base_price) * (1 - abs(np.random.normal(0, daily_range/2)))

            ohlcv_df.loc[idx, 'Open'] = new_open
            ohlcv_df.loc[idx, 'High'] = new_high
            ohlcv_df.loc[idx, 'Low'] = new_low

        return ohlcv_df

    def _generate_low_liquidity_scenario(self) -> pd.DataFrame:
        """Generate scenario with very low trading volume."""
        ohlcv_df = self.generate_ohlcv_data()

        # Reduce volume by factor of 100
        ohlcv_df['Volume'] = (ohlcv_df['Volume'] / 100).astype(int)

        return ohlcv_df

    def _generate_market_gap_scenario(self) -> pd.DataFrame:
        """Generate scenario with significant price gaps."""
        ohlcv_df = self.generate_ohlcv_data()

        # Create gaps by modifying close prices
        gap_indices = random.sample(range(len(ohlcv_df)), len(ohlcv_df) // 20)  # 5% gaps

        for idx in gap_indices:
            if idx < len(ohlcv_df) - 1:
                # Create gap between current and next day
                gap_size = np.random.choice([-0.15, -0.10, 0.10, 0.15])  # ±10-15% gaps
                current_close = ohlcv_df.loc[idx, 'Close']
                ohlcv_df.loc[idx + 1, 'Open'] = current_close * (1 + gap_size)

        return ohlcv_df


class TestDataValidator:
    """Validates generated test data for quality and consistency."""

    def __init__(self):
        """Initialize the data validator."""
        pass

    def validate_ohlcv_data(self, ohlcv_df: pd.DataFrame) -> Dict[str, Any]:
        """Validate OHLCV data quality."""
        validation_results = {
            'total_records': len(ohlcv_df),
            'unique_instruments': ohlcv_df['Ticker'].nunique(),
            'date_range': {
                'min': ohlcv_df['Date'].min(),
                'max': ohlcv_df['Date'].max()
            },
            'price_ranges': {},
            'volume_stats': {},
            'data_quality': {}
        }

        # Check price relationships
        price_valid = (
            (ohlcv_df['High'] >= ohlcv_df['Low']) &
            (ohlcv_df['High'] >= ohlcv_df['Open']) &
            (ohlcv_df['High'] >= ohlcv_df['Close']) &
            (ohlcv_df['Low'] <= ohlcv_df['Open']) &
            (ohlcv_df['Low'] <= ohlcv_df['Close'])
        )

        validation_results['data_quality']['price_relationships'] = price_valid.mean()

        # Check for missing values
        validation_results['data_quality']['missing_values'] = ohlcv_df.isnull().sum().sum()

        # Check volume is positive
        validation_results['data_quality']['positive_volume'] = (ohlcv_df['Volume'] > 0).mean()

        # Price ranges by instrument
        for instrument in ohlcv_df['Ticker'].unique():
            inst_data = ohlcv_df[ohlcv_df['Ticker'] == instrument]
            validation_results['price_ranges'][instrument] = {
                'min_price': inst_data['Low'].min(),
                'max_price': inst_data['High'].max(),
                'avg_price': inst_data['Close'].mean()
            }

        # Volume statistics
        validation_results['volume_stats'] = {
            'min_volume': ohlcv_df['Volume'].min(),
            'max_volume': ohlcv_df['Volume'].max(),
            'avg_volume': ohlcv_df['Volume'].mean()
        }

        return validation_results

    def validate_signals_data(self, signals_df: pd.DataFrame) -> Dict[str, Any]:
        """Validate signals data quality."""
        validation_results = {
            'total_signals': len(signals_df),
            'unique_instruments': signals_df['Ticker'].nunique(),
            'signal_types': signals_df['Signal_Type'].value_counts().to_dict(),
            'date_range': {
                'min': signals_df['Date'].min(),
                'max': signals_df['Date'].max()
            },
            'signal_frequency': {},
            'data_quality': {}
        }

        # Signal frequency by instrument
        for instrument in signals_df['Ticker'].unique():
            inst_signals = signals_df[signals_df['Ticker'] == instrument]
            validation_results['signal_frequency'][instrument] = len(inst_signals)

        # Check for missing values
        validation_results['data_quality']['missing_values'] = signals_df.isnull().sum().sum()

        # Check date validity
        try:
            pd.to_datetime(signals_df['Date'], errors='coerce')
            validation_results['data_quality']['valid_dates'] = 1.0
        except Exception:
            validation_results['data_quality']['valid_dates'] = 0.0

        return validation_results


def generate_complete_test_dataset() -> Dict[str, Any]:
    """Generate complete test dataset with all scenarios."""
    generator = TestDataGenerator()

    # Generate main test data
    ohlcv_data = generator.generate_ohlcv_data()
    signals_data = generator.generate_signals_data()

    # Generate edge case scenarios
    edge_cases = generator.generate_edge_case_scenarios()

    return {
        'main_ohlcv': ohlcv_data,
        'main_signals': signals_data,
        'edge_cases': edge_cases
    }


def validate_test_dataset(dataset: Dict[str, pd.DataFrame]) -> Dict[str, Any]:
    """Validate the complete test dataset."""
    validator = TestDataValidator()

    validation_results = {
        'ohlcv_validation': validator.validate_ohlcv_data(dataset['main_ohlcv']),
        'signals_validation': validator.validate_signals_data(dataset['main_signals']),
        'edge_cases_count': len(dataset['edge_cases'])
    }

    return validation_results


if __name__ == "__main__":
    # Generate and validate test data
    print("Generating test data...")
    dataset = generate_complete_test_dataset()

    print("Validating test data...")
    validation = validate_test_dataset(dataset)

    print("✅ Test data generation completed successfully!")
    print(f"OHLCV records: {validation['ohlcv_validation']['total_records']}")
    print(f"Signal records: {validation['signals_validation']['total_signals']}")
    print(f"Edge case scenarios: {validation['edge_cases_count']}")

    # Save test data to files
    dataset['main_ohlcv'].to_csv('backend/tests/test_data_ohlcv.csv', index=False)
    dataset['main_signals'].to_csv('backend/tests/test_data_signals.csv', index=False)

    print("✅ Test data saved to CSV files")