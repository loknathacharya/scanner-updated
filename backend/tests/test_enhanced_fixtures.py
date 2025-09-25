"""
Enhanced test fixtures for comprehensive backtesting validation
Provides deterministic test data for validation testing
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import pytest
from typing import Dict, List, Tuple, Optional
import random
from dataclasses import dataclass

@dataclass
class TestScenarioConfig:
    """Configuration for test scenarios"""
    name: str
    num_tickers: int
    num_days: int
    signal_frequency: float  # 0.0 to 1.0
    volatility_level: float  # 0.0 to 1.0
    trend_strength: float  # -1.0 to 1.0 (negative for downtrend)
    noise_level: float  # 0.0 to 1.0
    initial_price: float
    seed: int

class EnhancedTestDataGenerator:
    """Enhanced test data generator with comprehensive scenarios"""
    
    def __init__(self, seed: int = 42):
        self.seed = seed
        random.seed(seed)
        np.random.seed(seed)
        
    def generate_ohlcv_data(self, config: TestScenarioConfig) -> pd.DataFrame:
        """Generate realistic OHLCV data based on configuration"""
        dates = pd.date_range(
            start=datetime(2023, 1, 1),
            periods=config.num_days,
            freq='D'
        )
        
        data = []
        
        for ticker in range(config.num_tickers):
            ticker_name = f"TICKER_{ticker:03d}"
            
            # Generate price series with trend and volatility
            base_price = config.initial_price * (1 + ticker * 0.05)  # Slight variation between tickers
            
            # Generate price path
            prices = self._generate_price_path(
                base_price, 
                config.num_days,
                config.trend_strength,
                config.volatility_level,
                config.noise_level
            )
            
            # Generate OHLCV data
            for i, date in enumerate(dates):
                open_price = prices[i]
                
                # Generate intraday movement
                daily_range = base_price * config.volatility_level * 0.02
                high = open_price + abs(np.random.normal(0, daily_range * 0.6))
                low = open_price - abs(np.random.normal(0, daily_range * 0.6))
                close = prices[i] + np.random.normal(0, daily_range * 0.1)
                
                # Ensure OHLC ordering
                high = max(high, open_price, close)
                low = min(low, open_price, close)
                
                # Generate volume (correlated with volatility)
                base_volume = 1000000
                volume = base_volume * (1 + config.volatility_level) * np.random.lognormal(0, 0.3)
                
                data.append({
                    'Ticker': ticker_name,
                    'Date': date,
                    'Open': round(open_price, 2),
                    'High': round(high, 2),
                    'Low': round(low, 2),
                    'Close': round(close, 2),
                    'Volume': int(volume)
                })
        
        return pd.DataFrame(data)
    
    def _generate_price_path(self, base_price: float, num_days: int, 
                           trend_strength: float, volatility_level: float, 
                           noise_level: float) -> np.ndarray:
        """Generate realistic price path with trend and volatility"""
        # Generate random walk with drift
        daily_returns = np.random.normal(0, volatility_level * 0.02, num_days)
        
        # Add trend
        trend_component = np.linspace(0, trend_strength * 0.001 * num_days, num_days)
        
        # Add noise
        noise = np.random.normal(0, noise_level * 0.001, num_days)
        
        # Combine components
        total_returns = daily_returns + trend_component + noise
        
        # Generate price path
        prices = base_price * np.exp(np.cumsum(total_returns))
        
        return prices
    
    def generate_signals_data(self, ohlcv_df: pd.DataFrame, config: TestScenarioConfig) -> pd.DataFrame:
        """Generate trading signals based on configuration"""
        signals = []
        
        # Group by ticker
        for ticker in ohlcv_df['Ticker'].unique():
            ticker_data = ohlcv_df[ohlcv_df['Ticker'] == ticker].copy()
            ticker_data = ticker_data.sort_values('Date').reset_index(drop=True)
            
            # Generate signals based on price patterns
            for i in range(len(ticker_data)):
                if np.random.random() < config.signal_frequency:
                    # Generate signal based on price momentum
                    if i > 5:  # Need some history
                        recent_momentum = (ticker_data.iloc[i-5:i]['Close'].mean() - 
                                         ticker_data.iloc[i-10:i-5]['Close'].mean()) / ticker_data.iloc[i-10:i-5]['Close'].mean()
                        
                        # Signal logic based on momentum and trend
                        if recent_momentum > 0.02:  # Strong upward momentum
                            signal_type = 'long'
                        elif recent_momentum < -0.02:  # Strong downward momentum
                            signal_type = 'short'
                        else:
                            # Random signal for neutral momentum
                            signal_type = 'long' if np.random.random() > 0.5 else 'short'
                    else:
                        # Random signal for early period
                        signal_type = 'long' if np.random.random() > 0.5 else 'short'
                    
                    signals.append({
                        'Ticker': ticker,
                        'Date': ticker_data.iloc[i]['Date'],
                        'Signal Type': signal_type
                    })
        
        return pd.DataFrame(signals)
    
    def generate_edge_case_scenarios(self) -> Dict[str, pd.DataFrame]:
        """Generate edge case scenarios for testing"""
        scenarios = {}
        
        # Scenario 1: Insufficient capital
        config = TestScenarioConfig(
            name="insufficient_capital",
            num_tickers=1,
            num_days=100,
            signal_frequency=0.1,
            volatility_level=0.1,
            trend_strength=0.0,
            noise_level=0.1,
            initial_price=1000.0,
            seed=123
        )
        
        ohlcv_data = self.generate_ohlcv_data(config)
        signals_data = self.generate_signals_data(ohlcv_data, config)
        
        # Modify signals to create positions that would require more capital than available
        signals_data['Position Size'] = 200000  # Larger than typical initial capital
        scenarios['insufficient_capital'] = {
            'ohlcv': ohlcv_data,
            'signals': signals_data
        }
        
        # Scenario 2: Extreme volatility
        config = TestScenarioConfig(
            name="extreme_volatility",
            num_tickers=3,
            num_days=200,
            signal_frequency=0.05,
            volatility_level=2.0,  # High volatility
            trend_strength=0.0,
            noise_level=0.5,
            initial_price=100.0,
            seed=456
        )
        
        ohlcv_data = self.generate_ohlcv_data(config)
        signals_data = self.generate_signals_data(ohlcv_data, config)
        scenarios['extreme_volatility'] = {
            'ohlcv': ohlcv_data,
            'signals': signals_data
        }
        
        # Scenario 3: Low liquidity
        config = TestScenarioConfig(
            name="low_liquidity",
            num_tickers=2,
            num_days=150,
            signal_frequency=0.08,
            volatility_level=0.3,
            trend_strength=-0.5,  # Downtrend
            noise_level=0.2,
            initial_price=50.0,
            seed=789
        )
        
        ohlcv_data = self.generate_ohlcv_data(config)
        # Modify volume to be very low
        ohlcv_data['Volume'] = ohlcv_data['Volume'] * 0.1
        signals_data = self.generate_signals_data(ohlcv_data, config)
        scenarios['low_liquidity'] = {
            'ohlcv': ohlcv_data,
            'signals': signals_data
        }
        
        # Scenario 4: Market gaps
        config = TestScenarioConfig(
            name="market_gaps",
            num_tickers=1,
            num_days=100,
            signal_frequency=0.1,
            volatility_level=0.5,
            trend_strength=0.0,
            noise_level=0.3,
            initial_price=100.0,
            seed=101
        )
        
        ohlcv_data = self.generate_ohlcv_data(config)
        
        # Introduce artificial gaps
        gap_indices = np.random.choice(len(ohlcv_data), size=10, replace=False)
        for idx in gap_indices:
            if idx < len(ohlcv_data) - 1:
                gap_size = np.random.uniform(-0.15, 0.15)  # 15% gap
                ohlcv_data.iloc[idx + 1, ohlcv_data.columns.get_loc('Open')] = ohlcv_data.iloc[idx + 1, ohlcv_data.columns.get_loc('Open')] * (1 + gap_size)
                ohlcv_data.iloc[idx + 1, ohlcv_data.columns.get_loc('High')] = ohlcv_data.iloc[idx + 1, ohlcv_data.columns.get_loc('High')] * (1 + gap_size)
                ohlcv_data.iloc[idx + 1, ohlcv_data.columns.get_loc('Low')] = ohlcv_data.iloc[idx + 1, ohlcv_data.columns.get_loc('Low')] * (1 + gap_size)
                ohlcv_data.iloc[idx + 1, ohlcv_data.columns.get_loc('Close')] = ohlcv_data.iloc[idx + 1, ohlcv_data.columns.get_loc('Close')] * (1 + gap_size)
        
        signals_data = self.generate_signals_data(ohlcv_data, config)
        scenarios['market_gaps'] = {
            'ohlcv': ohlcv_data,
            'signals': signals_data
        }
        
        return scenarios
    
    def generate_comprehensive_test_dataset(self) -> Dict[str, pd.DataFrame]:
        """Generate a comprehensive test dataset for validation"""
        # Base scenario
        config = TestScenarioConfig(
            name="comprehensive_test",
            num_tickers=5,
            num_days=365,
            signal_frequency=0.08,
            volatility_level=0.3,
            trend_strength=0.1,
            noise_level=0.2,
            initial_price=100.0,
            seed=42
        )
        
        ohlcv_data = self.generate_ohlcv_data(config)
        signals_data = self.generate_signals_data(ohlcv_data, config)
        
        return {
            'ohlcv': ohlcv_data,
            'signals': signals_data
        }

class TestResultValidator:
    """Enhanced test result validator with comprehensive comparison"""
    
    def __init__(self, tolerance: float = 1e-10, metric_tolerances: Optional[Dict[str, float]] = None):
        self.tolerance = tolerance
        # Default metric-specific tolerances
        self.metric_tolerances = metric_tolerances or {
            'Total Return (%)': 0.015,      # 1.5% tolerance
            'Max Drawdown (%)': 0.015,      # 1.5% tolerance
            'Profit Factor': 0.02,          # 2% tolerance
            'Win Rate (%)': 0.001,          # 0.1% tolerance
            'Sharpe Ratio': 0.05,           # 0.05 tolerance
            'Total Trades': 0,              # Exact match
            'Final Portfolio Value': 100    # $100 tolerance
        }
    
    def validate_numerical_parity(self, result1: Dict, result2: Dict, 
                                metrics: List[str]) -> Dict[str, bool]:
        """Validate numerical parity between two results"""
        validation_results = {}
        
        for metric in metrics:
            # Handle tuple results from backtest functions (trades_df, performance_metrics_list)
            if isinstance(result1, tuple) and len(result1) >= 2:
                trades_df1, performance_metrics_list1 = result1
                performance_metrics1 = performance_metrics_list1[0] if performance_metrics_list1 else {}
                val1 = performance_metrics1.get(metric, 0)
            elif isinstance(result1, dict):
                val1 = result1.get(metric, 0)
            else:
                val1 = result1
            
            if isinstance(result2, tuple) and len(result2) >= 2:
                trades_df2, performance_metrics_list2 = result2
                performance_metrics2 = performance_metrics_list2[0] if performance_metrics_list2 else {}
                val2 = performance_metrics2.get(metric, 0)
            elif isinstance(result2, dict):
                val2 = result2.get(metric, 0)
            else:
                val2 = result2
            
            # Handle different data types
            if isinstance(val1, (int, float)) and isinstance(val2, (int, float)):
                # Use metric-specific tolerance if available, otherwise use default
                metric_tolerance = self.metric_tolerances.get(metric, self.tolerance)
                
                # For percentage values, check if the difference is within tolerance
                if metric in ['Total Return (%)', 'Max Drawdown (%)', 'Win Rate (%)']:
                    # For percentages, use relative tolerance
                    if abs(val1 - val2) <= metric_tolerance:
                        validation_results[metric] = True
                    else:
                        validation_results[metric] = False
                        print(f"❌ Mismatch in {metric}: {val1} vs {val2} (tolerance: {metric_tolerance})")
                elif metric == 'Profit Factor':
                    # For profit factor, use relative tolerance
                    if abs(val1 - val2) <= metric_tolerance * max(abs(val1), abs(val2)):
                        validation_results[metric] = True
                    else:
                        validation_results[metric] = False
                        print(f"❌ Mismatch in {metric}: {val1} vs {val2} (tolerance: {metric_tolerance})")
                elif metric == 'Total Trades':
                    # For total trades, exact match
                    if val1 == val2:
                        validation_results[metric] = True
                    else:
                        validation_results[metric] = False
                        print(f"❌ Mismatch in {metric}: {val1} vs {val2} (exact match required)")
                elif metric == 'Final Portfolio Value':
                    # For portfolio value, use absolute tolerance
                    if abs(val1 - val2) <= metric_tolerance:
                        validation_results[metric] = True
                    else:
                        validation_results[metric] = False
                        print(f"❌ Mismatch in {metric}: {val1} vs {val2} (tolerance: ${metric_tolerance})")
                else:
                    # For other metrics, use default tolerance
                    if abs(val1 - val2) <= self.tolerance:
                        validation_results[metric] = True
                    else:
                        validation_results[metric] = False
                        print(f"❌ Mismatch in {metric}: {val1} vs {val2}")
            elif isinstance(val1, list) and isinstance(val2, list):
                # Compare lists (e.g., trades)
                if len(val1) == len(val2):
                    list_match = all(
                        abs(a - b) <= self.tolerance
                        for a, b in zip(val1, val2)
                        if isinstance(a, (int, float)) and isinstance(b, (int, float))
                    )
                    validation_results[metric] = list_match
                else:
                    validation_results[metric] = False
                    print(f"❌ List length mismatch in {metric}: {len(val1)} vs {len(val2)}")
            elif isinstance(val1, pd.DataFrame) and isinstance(val2, pd.DataFrame):
                # Compare DataFrames (e.g., performance metrics)
                try:
                    # Compare DataFrames with tolerance for floating point differences
                    if val1.shape == val2.shape:
                        # Compare numeric columns with tolerance
                        numeric_match = True
                        for col in val1.columns:
                            if col in val2.columns:
                                if pd.api.types.is_numeric_dtype(val1[col]) and pd.api.types.is_numeric_dtype(val2[col]):
                                    if not np.allclose(val1[col].values, val2[col].values, rtol=self.tolerance, atol=self.tolerance):
                                        numeric_match = False
                                        print(f"❌ DataFrame mismatch in column {col}")
                                        break
                                else:
                                    # Non-numeric columns - exact match
                                    if not val1[col].equals(val2[col]):
                                        numeric_match = False
                                        print(f"❌ DataFrame mismatch in column {col}")
                                        break
                            else:
                                numeric_match = False
                                print(f"❌ Column {col} missing in second DataFrame")
                                break
                        
                        validation_results[metric] = numeric_match
                    else:
                        validation_results[metric] = False
                        print(f"❌ DataFrame shape mismatch: {val1.shape} vs {val2.shape}")
                except Exception as e:
                    validation_results[metric] = False
                    print(f"❌ Error comparing DataFrames: {e}")
            elif isinstance(val1, pd.Series) and isinstance(val2, pd.Series):
                # Compare Series
                try:
                    if val1.shape == val2.shape:
                        series_match = np.allclose(val1.values, val2.values, rtol=self.tolerance, atol=self.tolerance)
                        validation_results[metric] = series_match
                    else:
                        validation_results[metric] = False
                        print(f"❌ Series shape mismatch: {val1.shape} vs {val2.shape}")
                except Exception as e:
                    validation_results[metric] = False
                    print(f"❌ Error comparing Series: {e}")
            else:
                # Direct comparison for other types
                try:
                    validation_results[metric] = val1 == val2
                except Exception as e:
                    validation_results[metric] = False
                    print(f"❌ Error comparing {type(val1)} and {type(val2)}: {e}")
        
        return validation_results
    
    def validate_leverage_correctness(self, result: Dict, allow_leverage: bool) -> Dict[str, bool]:
        """Validate leverage correctness in results"""
        validation_results = {}
        
        if 'trades' in result and result['trades']:
            trades_df = pd.DataFrame(result['trades'])
            
            # Check leverage constraints
            if allow_leverage:
                # Leverage should be reasonable (not excessively high)
                max_leverage = trades_df.get('Leverage Used', pd.Series([1.0])).max()
                validation_results['reasonable_leverage'] = max_leverage <= 10.0
            else:
                # No leverage should be used
                leverage_used = trades_df.get('Leverage Used', pd.Series([1.0]))
                validation_results['no_leverage_violation'] = (leverage_used <= 1.0).all()
            
            # Check position sizing consistency
            validation_results['position_sizing_consistency'] = self._validate_position_sizing(trades_df)
        
        return validation_results
    
    def _validate_position_sizing(self, trades_df: pd.DataFrame) -> bool:
        """Validate position sizing consistency"""
        if trades_df.empty:
            return True
        
        # Check that position values are reasonable
        position_values = trades_df['Position Value']
        portfolio_values = trades_df['Portfolio Value']
        
        # Position should not exceed portfolio value (unless leverage is allowed)
        reasonable_positions = (position_values <= portfolio_values * 2).all()
        
        # Position sizes should be positive
        positive_positions = (position_values > 0).all()
        
        return reasonable_positions and positive_positions
    
    def validate_optimizer_parity(self, optimization_result: pd.DataFrame, 
                                single_backtest_result: Dict) -> Dict[str, bool]:
        """Validate that optimizer results match single backtest results"""
        validation_results = {}
        
        if not optimization_result.empty:
            # Find the best parameter combination
            best_params = optimization_result.loc[optimization_result['Total Return (%)'].idxmax()]
            
            # Compare key metrics
            key_metrics = ['Total Return (%)', 'Win Rate (%)', 'Max Drawdown (%)', 
                          'Sharpe Ratio', 'Profit Factor', 'Total Trades']
            
            for metric in key_metrics:
                if metric in best_params and metric in single_backtest_result:
                    val1 = best_params[metric]
                    val2 = single_backtest_result[metric]
                    
                    # Use metric-specific tolerance if available, otherwise use default
                    metric_tolerance = self.metric_tolerances.get(metric, self.tolerance)
                    
                    # Apply appropriate tolerance based on metric type
                    if metric in ['Total Return (%)', 'Max Drawdown (%)', 'Win Rate (%)']:
                        # For percentages, use absolute tolerance
                        if abs(val1 - val2) <= metric_tolerance:
                            validation_results[metric] = True
                        else:
                            validation_results[metric] = False
                            print(f"❌ Optimizer parity mismatch in {metric}: {val1} vs {val2} (tolerance: {metric_tolerance})")
                    elif metric == 'Profit Factor':
                        # For profit factor, use relative tolerance
                        if abs(val1 - val2) <= metric_tolerance * max(abs(val1), abs(val2)):
                            validation_results[metric] = True
                        else:
                            validation_results[metric] = False
                            print(f"❌ Optimizer parity mismatch in {metric}: {val1} vs {val2} (tolerance: {metric_tolerance})")
                    elif metric == 'Total Trades':
                        # For total trades, exact match
                        if val1 == val2:
                            validation_results[metric] = True
                        else:
                            validation_results[metric] = False
                            print(f"❌ Optimizer parity mismatch in {metric}: {val1} vs {val2} (exact match required)")
                    else:
                        # For other metrics, use default tolerance
                        if abs(val1 - val2) <= self.tolerance:
                            validation_results[metric] = True
                        else:
                            validation_results[metric] = False
                            print(f"❌ Optimizer parity mismatch in {metric}: {val1} vs {val2}")
                else:
                    validation_results[metric] = False
        
        return validation_results
    
    def generate_validation_report(self, validation_results: Dict[str, Dict]) -> str:
        """Generate comprehensive validation report"""
        report = []
        report.append("=" * 60)
        report.append("BACKTEST VALIDATION REPORT")
        report.append("=" * 60)
        
        for test_name, results in validation_results.items():
            report.append(f"\n📋 Test: {test_name}")
            report.append("-" * 40)
            
            passed = sum(1 for v in results.values() if v)
            total = len(results)
            
            report.append(f"✅ Passed: {passed}/{total}")
            
            for metric, passed in results.items():
                status = "✅ PASS" if passed else "❌ FAIL"
                report.append(f"  {metric}: {status}")
        
        overall_passed = all(
            all(results.values()) 
            for results in validation_results.values()
        )
        
        report.append(f"\n🎯 Overall Result: {'✅ ALL TESTS PASSED' if overall_passed else '❌ SOME TESTS FAILED'}")
        report.append("=" * 60)
        
        return "\n".join(report)

# Pytest fixtures
@pytest.fixture
def enhanced_test_data_generator():
    """Enhanced test data generator fixture"""
    return EnhancedTestDataGenerator(seed=42)

@pytest.fixture
def test_result_validator():
    """Test result validator fixture"""
    return TestResultValidator(tolerance=1e-10)

@pytest.fixture
def comprehensive_test_dataset(enhanced_test_data_generator):
    """Comprehensive test dataset fixture"""
    return enhanced_test_data_generator.generate_comprehensive_test_dataset()

@pytest.fixture
def edge_case_scenarios(enhanced_test_data_generator):
    """Edge case scenarios fixture"""
    return enhanced_test_data_generator.generate_edge_case_scenarios()

@pytest.fixture
def sample_ohlcv_data(enhanced_test_data_generator):
    """Sample OHLCV data fixture"""
    config = TestScenarioConfig(
        name="sample",
        num_tickers=3,
        num_days=100,
        signal_frequency=0.1,
        volatility_level=0.2,
        trend_strength=0.0,
        noise_level=0.1,
        initial_price=100.0,
        seed=42
    )
    return enhanced_test_data_generator.generate_ohlcv_data(config)

@pytest.fixture
def sample_signals_data(enhanced_test_data_generator, sample_ohlcv_data):
    """Sample signals data fixture"""
    config = TestScenarioConfig(
        name="sample",
        num_tickers=3,
        num_days=100,
        signal_frequency=0.1,
        volatility_level=0.2,
        trend_strength=0.0,
        noise_level=0.1,
        initial_price=100.0,
        seed=42
    )
    return enhanced_test_data_generator.generate_signals_data(sample_ohlcv_data, config)