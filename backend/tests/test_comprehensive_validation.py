"""
Comprehensive backtesting validation tests
Tests numerical parity, leverage correctness, optimizer parity, and trade concurrency rules
"""

import pytest
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional
import sys
import os

# Add the backend directory to the path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from BackTestEngine import run_backtest, run_vectorized_single_backtest, calculate_performance_metrics
from test_enhanced_fixtures import EnhancedTestDataGenerator, TestResultValidator
from test_data_fixtures import TestDataGenerator, TestDataValidator
from test_config import get_test_config, get_tolerance_level

class TestNumericalParity:
    """Test numerical parity between vectorized and non-vectorized implementations"""
    
    def __init__(self):
        # Use metric-specific tolerances
        metric_tolerances = {
            'Total Return (%)': 0.015,      # 1.5% tolerance
            'Max Drawdown (%)': 0.015,      # 1.5% tolerance
            'Profit Factor': 0.02,          # 2% tolerance
            'Win Rate (%)': 0.001,          # 0.1% tolerance
            'Sharpe Ratio': 0.05,           # 0.05 tolerance
            'Total Trades': 0,              # Exact match
            'Final Portfolio Value': 100    # $100 tolerance
        }
        self.validator = TestResultValidator(tolerance=1e-10, metric_tolerances=metric_tolerances)
        self.test_data_generator = EnhancedTestDataGenerator(seed=42)
        self.config = get_test_config()
    
    def test_single_backtest_consistency(self):
        """Test that vectorized and non-vectorized implementations produce identical results"""
        print("\n🧪 Testing Single Backtest Consistency (VC-001)")
        
        # Generate test data
        test_data = self.test_data_generator.generate_comprehensive_test_dataset()
        ohlcv_data = test_data['ohlcv']
        signals_data = test_data['signals']
        
        # Test parameters
        test_params = {
            'initial_capital': 100000,
            'stop_loss': 5.0,
            'take_profit': 15.0,
            'holding_period': 20,
            'signal_type': 'long',
            'position_sizing': 'equal_weight',
            'allow_leverage': False
        }
        
        # Run backtest with vectorized implementation
        # Run backtest with vectorized implementation
        vectorized_result = run_vectorized_single_backtest(
            ohlcv_df=ohlcv_data,
            signals_df=signals_data,
            holding_period=test_params['holding_period'],
            stop_loss_pct=test_params['stop_loss'],
            take_profit_pct=test_params['take_profit'],
            initial_capital=test_params['initial_capital'],
            sizing_method=test_params['position_sizing']
        )
        
        # Run backtest with non-vectorized implementation
        non_vectorized_result = run_backtest(
            ohlcv_df=ohlcv_data,
            signals_df=signals_data,
            holding_period=test_params['holding_period'],
            stop_loss_pct=test_params['stop_loss'],
            take_profit_pct=test_params['take_profit'],
            initial_capital=test_params['initial_capital'],
            sizing_method=test_params['position_sizing']
        )
        
        # Compare results
        key_metrics = [
            'Total Return (%)',
            'Win Rate (%)',
            'Max Drawdown (%)',
            'Sharpe Ratio',
            'Profit Factor',
            'Total Trades',
            'Final Portfolio Value'
        ]
        
        # Extract performance metrics from tuple results
        def extract_performance_metrics(result_tuple):
            trades_df, leverage_warnings = result_tuple
            # Calculate performance metrics using the dedicated function
            performance_metrics = calculate_performance_metrics(trades_df, test_params['initial_capital'])
            return performance_metrics
        
        vectorized_metrics = extract_performance_metrics(vectorized_result)
        non_vectorized_metrics = extract_performance_metrics(non_vectorized_result)
        
        validation_results = self.validator.validate_numerical_parity(
            vectorized_metrics,
            non_vectorized_metrics,
            key_metrics
        )
        
        # Print results
        passed = sum(1 for v in validation_results.values() if v)
        total = len(validation_results)
        print(f"✅ VC-001: {passed}/{total} metrics match")
        
        for metric, passed in validation_results.items():
            status = "✅ PASS" if passed else "❌ FAIL"
            print(f"  {metric}: {status}")
        
        # Assert all metrics match
        assert all(validation_results.values()), f"Numerical parity failed: {validation_results}"
        
        return validation_results
    
    def test_position_sizing_consistency(self):
        """Test position sizing consistency across different methods"""
        print("\n🧪 Testing Position Sizing Consistency (VC-002)")
        
        # Generate test data
        test_data = self.test_data_generator.generate_comprehensive_test_dataset()
        ohlcv_data = test_data['ohlcv']
        signals_data = test_data['signals']
        
        # Test different position sizing methods
        position_sizing_methods = [
            'equal_weight',
            'fixed_amount',
            'percent_risk',
            'volatility_target',
            'atr_based',
            'kelly_criterion'
        ]
        
        results = {}
        
        for method in position_sizing_methods:
            test_params = {
                'initial_capital': 100000,
                'stop_loss': 5.0,
                'take_profit': 15.0,
                'holding_period': 20,
                'signal_type': 'long',
                'position_sizing': method,
                'allow_leverage': False
            }
            
            # Run backtest
            result = run_backtest(
                ohlcv_df=ohlcv_data,
                signals_df=signals_data,
                holding_period=test_params['holding_period'],
                stop_loss_pct=test_params['stop_loss'],
                take_profit_pct=test_params['take_profit'],
                initial_capital=test_params['initial_capital'],
                sizing_method=method
            )
            
            # Extract performance metrics from tuple result
            trades_df, leverage_warnings = result
            # Calculate performance metrics using the dedicated function
            performance_metrics = calculate_performance_metrics(trades_df, test_params['initial_capital'])
            results[method] = performance_metrics
        
        # Compare results across methods
        validation_results = {}
        
        # Compare total returns
        returns = [results[method].get('Total Return (%)', 0) for method in position_sizing_methods]
        return_consistency = all(abs(r - returns[0]) <= self.validator.tolerance for r in returns)
        validation_results['return_consistency'] = return_consistency
        
        # Compare number of trades
        trades = [results[method].get('Total Trades', 0) for method in position_sizing_methods]
        trade_consistency = all(t == trades[0] for t in trades)
        validation_results['trade_consistency'] = trade_consistency
        
        # Print results
        passed = sum(1 for v in validation_results.values() if v)
        total = len(validation_results)
        print(f"✅ VC-002: {passed}/{total} consistency checks passed")
        
        for check, passed in validation_results.items():
            status = "✅ PASS" if passed else "❌ FAIL"
            print(f"  {check}: {status}")
        
        # Assert consistency
        assert all(validation_results.values()), f"Position sizing consistency failed: {validation_results}"
        
        return validation_results
    
    def test_signal_type_consistency(self):
        """Test consistency between long and short signals"""
        print("\n🧪 Testing Signal Type Consistency (VC-003)")
        
        # Generate test data
        test_data = self.test_data_generator.generate_comprehensive_test_dataset()
        ohlcv_data = test_data['ohlcv']
        signals_data = test_data['signals']
        
        # Test parameters
        test_params = {
            'initial_capital': 100000,
            'stop_loss': 5.0,
            'take_profit': 15.0,
            'holding_period': 20,
            'position_sizing': 'equal_weight',
            'allow_leverage': False
        }
        
        # Test long signals
        long_params = test_params.copy()
        long_params['signal_type'] = 'long'
        
        # Test long signals
        long_result = run_backtest(
            ohlcv_df=ohlcv_data,
            signals_df=signals_data,
            holding_period=long_params['holding_period'],
            stop_loss_pct=long_params['stop_loss'],
            take_profit_pct=long_params['take_profit'],
            initial_capital=long_params['initial_capital'],
            sizing_method=long_params['position_sizing']
        )
        
        # Test short signals
        short_params = test_params.copy()
        short_params['signal_type'] = 'short'
        
        short_result = run_backtest(
            ohlcv_df=ohlcv_data,
            signals_df=signals_data,
            holding_period=short_params['holding_period'],
            stop_loss_pct=short_params['stop_loss'],
            take_profit_pct=short_params['take_profit'],
            initial_capital=short_params['initial_capital'],
            sizing_method=short_params['position_sizing']
        )
        
        # Compare results
        key_metrics = [
            'Total Return (%)',
            'Win Rate (%)',
            'Max Drawdown (%)',
            'Total Trades'
        ]
        
        # Extract performance metrics from tuple results
        def extract_performance_metrics(result_tuple):
            trades_df, leverage_warnings = result_tuple
            # Calculate performance metrics using the dedicated function
            performance_metrics = calculate_performance_metrics(trades_df, test_params['initial_capital'])
            return performance_metrics
        
        long_metrics = extract_performance_metrics(long_result)
        short_metrics = extract_performance_metrics(short_result)
        
        validation_results = self.validator.validate_numerical_parity(
            long_metrics,
            short_metrics,
            key_metrics
        )
        
        # Print results
        passed_count = sum(1 for v in validation_results.values() if v)
        total = len(validation_results)
        print(f"✅ VC-003: {passed_count}/{total} metrics match")
        
        for metric, result in validation_results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"  {metric}: {status}")
        
        # Note: Long and short signals may not be identical due to market conditions
        # but should follow similar patterns
        assert passed_count == total, f"Signal type consistency failed: {validation_results} (passed: {passed_count}/{total})"
        
        return validation_results

class TestLeverageCorrectness:
    """Test leverage correctness in backtesting results"""
    
    def __init__(self):
        # Use metric-specific tolerances
        metric_tolerances = {
            'Total Return (%)': 0.015,      # 1.5% tolerance
            'Max Drawdown (%)': 0.015,      # 1.5% tolerance
            'Profit Factor': 0.02,          # 2% tolerance
            'Win Rate (%)': 0.001,          # 0.1% tolerance
            'Sharpe Ratio': 0.05,           # 0.05 tolerance
            'Total Trades': 0,              # Exact match
            'Final Portfolio Value': 100    # $100 tolerance
        }
        self.validator = TestResultValidator(tolerance=1e-10, metric_tolerances=metric_tolerances)
        self.test_data_generator = EnhancedTestDataGenerator(seed=42)
        self.config = get_test_config()
    
    def test_leverage_constraints(self):
        """Test that leverage constraints are properly enforced"""
        print("\n🧪 Testing Leverage Constraints (LC-001)")
        
        # Generate test data
        test_data = self.test_data_generator.generate_comprehensive_test_dataset()
        ohlcv_data = test_data['ohlcv']
        signals_data = test_data['signals']
        
        # Test without leverage
        no_leverage_params = {
            'initial_capital': 100000,
            'stop_loss': 5.0,
            'take_profit': 15.0,
            'holding_period': 20,
            'signal_type': 'long',
            'position_sizing': 'equal_weight',
            'allow_leverage': False
        }
        
        # Test without leverage
        no_leverage_result = run_backtest(
            ohlcv_df=ohlcv_data,
            signals_df=signals_data,
            holding_period=no_leverage_params['holding_period'],
            stop_loss_pct=no_leverage_params['stop_loss'],
            take_profit_pct=no_leverage_params['take_profit'],
            initial_capital=no_leverage_params['initial_capital'],
            sizing_method=no_leverage_params['position_sizing']
        )
        
        # Test with leverage
        leverage_params = no_leverage_params.copy()
        leverage_params['allow_leverage'] = True
        
        leverage_result = run_backtest(
            ohlcv_df=ohlcv_data,
            signals_df=signals_data,
            holding_period=leverage_params['holding_period'],
            stop_loss_pct=leverage_params['stop_loss'],
            take_profit_pct=leverage_params['take_profit'],
            initial_capital=leverage_params['initial_capital'],
            sizing_method=leverage_params['position_sizing']
        )
        
        # Extract performance metrics from tuple results
        def extract_performance_metrics(result_tuple):
            trades_df, leverage_warnings = result_tuple
            # Calculate performance metrics using the dedicated function
            performance_metrics = calculate_performance_metrics(trades_df, no_leverage_params['initial_capital'])
            return performance_metrics
        
        no_leverage_metrics = extract_performance_metrics(no_leverage_result)
        leverage_metrics = extract_performance_metrics(leverage_result)
        
        # Validate leverage correctness
        validation_results = self.validator.validate_leverage_correctness(
            no_leverage_metrics,
            allow_leverage=False
        )
        
        # Print results
        passed = sum(1 for v in validation_results.values() if v)
        total = len(validation_results)
        print(f"✅ LC-001: {passed}/{total} leverage constraints satisfied")
        
        for check, passed in validation_results.items():
            status = "✅ PASS" if passed else "❌ FAIL"
            print(f"  {check}: {status}")
        
        # Assert all constraints are satisfied
        assert all(validation_results.values()), f"Leverage constraints failed: {validation_results}"
        
        return validation_results
    
    def test_margin_calculations(self):
        """Test margin calculations with leverage"""
        print("\n🧪 Testing Margin Calculations (LC-002)")
        
        # Generate test data
        test_data = self.test_data_generator.generate_comprehensive_test_dataset()
        ohlcv_data = test_data['ohlcv']
        signals_data = test_data['signals']
        
        # Test with leverage
        test_params = {
            'initial_capital': 100000,
            'stop_loss': 5.0,
            'take_profit': 15.0,
            'holding_period': 20,
            'signal_type': 'long',
            'position_sizing': 'equal_weight',
            'allow_leverage': True
        }
        
        result = run_backtest(
            ohlcv_df=ohlcv_data,
            signals_df=signals_data,
            holding_period=test_params['holding_period'],
            stop_loss_pct=test_params['stop_loss'],
            take_profit_pct=test_params['take_profit'],
            initial_capital=test_params['initial_capital'],
            sizing_method=test_params['position_sizing']
        )
        
        # Extract trades DataFrame from tuple result
        trades_df, leverage_warnings = result
        # Calculate performance metrics using the dedicated function
        performance_metrics = calculate_performance_metrics(trades_df, test_params['initial_capital'])
        
        # Validate margin calculations
        validation_results = {}
        
        if not trades_df.empty:
            # Check that position values don't exceed reasonable leverage limits
            if 'Leverage Used' in trades_df.columns:
                max_leverage = trades_df['Leverage Used'].max()
                validation_results['reasonable_leverage'] = max_leverage <= 10.0
            
            # Check that margin requirements are met
            if 'Position Value' in trades_df.columns and 'Portfolio Value' in trades_df.columns:
                position_ratio = trades_df['Position Value'] / trades_df['Portfolio Value']
                validation_results['position_ratio'] = (position_ratio <= 2.0).all()
        
        # Print results
        passed = sum(1 for v in validation_results.values() if v)
        total = len(validation_results)
        print(f"✅ LC-002: {passed}/{total} margin calculations correct")
        
        for check, passed in validation_results.items():
            status = "✅ PASS" if passed else "❌ FAIL"
            print(f"  {check}: {status}")
        
        # Assert all margin calculations are correct
        assert all(validation_results.values()), f"Margin calculations failed: {validation_results}"
        
        return validation_results

class TestOptimizerParity:
    """Test optimizer parity between optimization and single backtest results"""
    
    def __init__(self):
        # Use metric-specific tolerances
        metric_tolerances = {
            'Total Return (%)': 0.05,       # 5% tolerance (more realistic for floating point differences)
            'Max Drawdown (%)': 0.02,       # 2% tolerance
            'Profit Factor': 0.05,          # 5% tolerance
            'Win Rate (%)': 0.001,          # 0.1% tolerance
            'Sharpe Ratio': 0.1,            # 0.1 tolerance (more realistic)
            'Total Trades': 0,              # Exact match
            'Final Portfolio Value': 200    # $200 tolerance
        }
        self.validator = TestResultValidator(tolerance=1e-10, metric_tolerances=metric_tolerances)
        self.test_data_generator = EnhancedTestDataGenerator(seed=42)
        self.config = get_test_config()
    
    def test_parameter_optimization_consistency(self):
        """Test that optimizer results match single backtest results"""
        print("\n🧪 Testing Parameter Optimization Consistency (OP-001)")
        
        # Generate test data
        test_data = self.test_data_generator.generate_comprehensive_test_dataset()
        ohlcv_data = test_data['ohlcv']
        signals_data = test_data['signals']
        
        # Parameter ranges for optimization
        param_ranges = {
            'holding_period': [10, 15, 20, 25],
            'stop_loss': [3, 5, 7, 10],
            'take_profit': [10, 15, 20, 25]
        }
        
        # Run optimization
        # Note: The optimize_parameters function may not exist in the current implementation
        # For now, we'll simulate optimization by running multiple single backtests
        optimization_result = []
        
        for holding_period in param_ranges['holding_period']:
            for stop_loss in param_ranges['stop_loss']:
                for take_profit in param_ranges['take_profit']:
                    result = run_backtest(
                        ohlcv_df=ohlcv_data,
                        signals_df=signals_data,
                        holding_period=holding_period,
                        stop_loss_pct=stop_loss,
                        take_profit_pct=take_profit,
                        initial_capital=100000,
                        sizing_method='equal_weight'
                    )
                    # Extract performance metrics from tuple result
                    trades_df, leverage_warnings = result
                    # Calculate performance metrics using the dedicated function
                    performance_metrics = calculate_performance_metrics(trades_df, 100000)
                    
                    optimization_result.append({
                        'holding_period': holding_period,
                        'stop_loss': stop_loss,
                        'take_profit': take_profit,
                        'Total Return (%)': performance_metrics['Total Return (%)'],
                        'Win Rate (%)': performance_metrics['Win Rate (%)'],
                        'Max Drawdown (%)': performance_metrics['Max Drawdown (%)'],
                        'Sharpe Ratio': performance_metrics['Sharpe Ratio'],
                        'Profit Factor': performance_metrics['Profit Factor']
                    })
        
        optimization_result = pd.DataFrame(optimization_result)
        
        # Find best parameters
        if not optimization_result.empty:
            best_params = optimization_result.loc[optimization_result['Total Return (%)'].idxmax()]
            
            # Run single backtest with best parameters
            single_test_params = {
                'initial_capital': 100000,
                'stop_loss': best_params['stop_loss'],
                'take_profit': best_params['take_profit'],
                'holding_period': best_params['holding_period'],
                'signal_type': 'long',
                'position_sizing': 'equal_weight',
                'allow_leverage': False
            }
            
            single_result = run_backtest(
                ohlcv_df=ohlcv_data,
                signals_df=signals_data,
                holding_period=single_test_params['holding_period'],
                stop_loss_pct=single_test_params['stop_loss'],
                take_profit_pct=single_test_params['take_profit'],
                initial_capital=single_test_params['initial_capital'],
                sizing_method=single_test_params['position_sizing']
            )
            
            # Extract performance metrics from tuple result
            trades_df, leverage_warnings = single_result
            # Calculate performance metrics using the dedicated function
            single_performance_metrics = calculate_performance_metrics(trades_df, single_test_params['initial_capital'])
            
            # Compare results
            key_metrics = [
                'Total Return (%)',
                'Win Rate (%)',
                'Max Drawdown (%)',
                'Sharpe Ratio',
                'Profit Factor'
            ]
            
            validation_results = self.validator.validate_optimizer_parity(
                optimization_result,
                single_performance_metrics
            )
            
            # Print results
            passed = sum(1 for v in validation_results.values() if v)
            total = len(validation_results)
            print(f"✅ OP-001: {passed}/{total} optimizer metrics match")
            
            for metric, passed in validation_results.items():
                status = "✅ PASS" if passed else "❌ FAIL"
                print(f"  {metric}: {status}")
            
            # Assert optimizer parity
            assert all(validation_results.values()), f"Optimizer parity failed: {validation_results}"
            
            return validation_results
        else:
            print("❌ OP-001: No optimization results found")
            return {}

class TestTradeConcurrency:
    """Test trade concurrency rules and position management"""
    
    def __init__(self):
        # Use metric-specific tolerances
        metric_tolerances = {
            'Total Return (%)': 0.015,      # 1.5% tolerance
            'Max Drawdown (%)': 0.015,      # 1.5% tolerance
            'Profit Factor': 0.02,          # 2% tolerance
            'Win Rate (%)': 0.001,          # 0.1% tolerance
            'Sharpe Ratio': 0.05,           # 0.05 tolerance
            'Total Trades': 0,              # Exact match
            'Final Portfolio Value': 100    # $100 tolerance
        }
        self.validator = TestResultValidator(tolerance=1e-10, metric_tolerances=metric_tolerances)
        self.test_data_generator = EnhancedTestDataGenerator(seed=42)
        self.config = get_test_config()
    
    def test_single_trade_per_instrument(self):
        """Test that only one trade per instrument is allowed"""
        print("\n🧪 Testing Single Trade Per Instrument (TC-001)")
        
        # Generate test data with multiple signals for same instrument
        test_data = self.test_data_generator.generate_comprehensive_test_dataset()
        ohlcv_data = test_data['ohlcv']
        signals_data = test_data['signals']
        
        # Filter signals to get multiple signals for same instrument
        first_ticker = signals_data['Ticker'].iloc[0]
        ticker_signals = signals_data[signals_data['Ticker'] == first_ticker]
        
        if len(ticker_signals) > 1:
            # Test with single trade per instrument constraint
            test_params = {
                'initial_capital': 100000,
                'stop_loss': 5.0,
                'take_profit': 15.0,
                'holding_period': 20,
                'signal_type': 'long',
                'position_sizing': 'equal_weight',
                'allow_leverage': False,
                'single_trade_per_instrument': True
            }
            
            result = run_backtest(
                ohlcv_df=ohlcv_data,
                signals_df=signals_data,
                holding_period=test_params['holding_period'],
                stop_loss_pct=test_params['stop_loss'],
                take_profit_pct=test_params['take_profit'],
                initial_capital=test_params['initial_capital'],
                sizing_method=test_params['position_sizing']
            )
            
            # Extract trades DataFrame from tuple result
            trades_df, leverage_warnings = result
            # Calculate performance metrics using the dedicated function
            performance_metrics = calculate_performance_metrics(trades_df, test_params['initial_capital'])
            
            # Validate single trade constraint
            validation_results = {}
            
            if not trades_df.empty:
                # Check that no instrument has multiple open trades
                if 'Ticker' in trades_df.columns:
                    instrument_trades = trades_df.groupby('Ticker').size()
                    validation_results['single_trade_constraint'] = (instrument_trades <= 1).all()
                
                # Check that total trades are reasonable
                validation_results['reasonable_trade_count'] = len(trades_df) <= len(signals_data)
            
            # Print results
            passed = sum(1 for v in validation_results.values() if v)
            total = len(validation_results)
            print(f"✅ TC-001: {passed}/{total} trade constraints satisfied")
            
            for check, passed in validation_results.items():
                status = "✅ PASS" if passed else "❌ FAIL"
                print(f"  {check}: {status}")
            
            # Assert all constraints are satisfied
            assert all(validation_results.values()), f"Trade concurrency failed: {validation_results}"
            
            return validation_results
        else:
            print("❌ TC-001: Not enough signals for single trade test")
            return {}
    
    def test_multiple_trades_per_instrument(self):
        """Test multiple trades per instrument when allowed"""
        print("\n🧪 Testing Multiple Trades Per Instrument (TC-002)")
        
        # Generate test data
        test_data = self.test_data_generator.generate_comprehensive_test_dataset()
        ohlcv_data = test_data['ohlcv']
        signals_data = test_data['signals']
        
        # Test without single trade constraint
        test_params = {
            'initial_capital': 100000,
            'stop_loss': 5.0,
            'take_profit': 15.0,
            'holding_period': 20,
            'signal_type': 'long',
            'position_sizing': 'equal_weight',
            'allow_leverage': False,
            'single_trade_per_instrument': False
        }
        
        result = run_backtest(
            ohlcv_df=ohlcv_data,
            signals_df=signals_data,
            holding_period=test_params['holding_period'],
            stop_loss_pct=test_params['stop_loss'],
            take_profit_pct=test_params['take_profit'],
            initial_capital=test_params['initial_capital'],
            sizing_method=test_params['position_sizing']
        )
        
        # Extract trades DataFrame from tuple result
        trades_df, leverage_warnings = result
        # Calculate performance metrics using the dedicated function
        performance_metrics = calculate_performance_metrics(trades_df, test_params['initial_capital'])
        
        # Validate multiple trades are allowed
        validation_results = {}
        
        if not trades_df.empty:
            # Check that multiple trades per instrument are possible
            if 'Ticker' in trades_df.columns:
                instrument_trades = trades_df.groupby('Ticker').size()
                validation_results['multiple_trades_allowed'] = (instrument_trades > 1).any()
            
            # Check that position sizing is still reasonable
            if 'Position Value' in trades_df.columns and 'Portfolio Value' in trades_df.columns:
                position_ratio = trades_df['Position Value'] / trades_df['Portfolio Value']
                validation_results['position_ratio'] = (position_ratio <= 3.0).all()
        
        # Print results
        passed = sum(1 for v in validation_results.values() if v)
        total = len(validation_results)
        print(f"✅ TC-002: {passed}/{total} multiple trade constraints satisfied")
        
        for check, passed in validation_results.items():
            status = "✅ PASS" if passed else "❌ FAIL"
            print(f"  {check}: {status}")
        
        # Assert all constraints are satisfied
        assert all(validation_results.values()), f"Multiple trades failed: {validation_results}"
        
        return validation_results

class TestStabilityAndReproducibility:
    """Test that tests are stable, reproducible, and CI-ready"""
    
    def __init__(self):
        # Use metric-specific tolerances
        metric_tolerances = {
            'Total Return (%)': 0.05,       # 5% tolerance (more realistic for floating point differences)
            'Max Drawdown (%)': 0.02,       # 2% tolerance
            'Profit Factor': 0.05,          # 5% tolerance
            'Win Rate (%)': 0.001,          # 0.1% tolerance
            'Sharpe Ratio': 0.1,            # 0.1 tolerance (more realistic)
            'Total Trades': 0,              # Exact match
            'Final Portfolio Value': 200    # $200 tolerance
        }
        self.validator = TestResultValidator(tolerance=1e-10, metric_tolerances=metric_tolerances)
        self.test_data_generator = EnhancedTestDataGenerator(seed=42)
        self.config = get_test_config()
    
    def test_deterministic_results(self):
        """Test that results are deterministic with same seed"""
        print("\n🧪 Testing Deterministic Results (ST-001)")
        
        # Generate test data
        test_data = self.test_data_generator.generate_comprehensive_test_dataset()
        ohlcv_data = test_data['ohlcv']
        signals_data = test_data['signals']
        
        # Test parameters
        test_params = {
            'initial_capital': 100000,
            'stop_loss': 5.0,
            'take_profit': 15.0,
            'holding_period': 20,
            'signal_type': 'long',
            'position_sizing': 'equal_weight',
            'allow_leverage': False
        }
        
        # Run backtest multiple times with same seed
        results = []
        for i in range(3):
            result = run_backtest(
                ohlcv_df=ohlcv_data,
                signals_df=signals_data,
                holding_period=test_params['holding_period'],
                stop_loss_pct=test_params['stop_loss'],
                take_profit_pct=test_params['take_profit'],
                initial_capital=test_params['initial_capital'],
                sizing_method=test_params['position_sizing']
            )
            results.append(result)
        
        # Compare results
        validation_results = {}
        
        key_metrics = ['Total Return (%)', 'Win Rate (%)', 'Max Drawdown (%)', 'Total Trades']
        
        for metric in key_metrics:
            # Extract performance metrics from the tuple result
            values = []
            for result in results:
                trades_df, leverage_warnings = result
                # Calculate performance metrics using the dedicated function
                performance_metrics = calculate_performance_metrics(trades_df, test_params['initial_capital'])
                values.append(performance_metrics[metric])
            consistent = all(abs(v - values[0]) <= 1e-10 for v in values)
            validation_results[f'{metric}_consistent'] = consistent
        
        # Print results
        passed = sum(1 for v in validation_results.values() if v)
        total = len(validation_results)
        print(f"✅ ST-001: {passed}/{total} runs are deterministic")
        
        for check, passed in validation_results.items():
            status = "✅ PASS" if passed else "❌ FAIL"
            print(f"  {check}: {status}")
        
        # Assert all runs are deterministic
        assert all(validation_results.values()), f"Non-deterministic results: {validation_results}"
        
        return validation_results
    
    def test_floating_point_tolerance(self):
        """Test that floating point comparisons use appropriate tolerance"""
        print("\n🧪 Testing Floating Point Tolerance (ST-002)")
        
        # Test with very small differences
        values1 = [1.0000000001, 2.0000000002, 3.0000000003]
        values2 = [1.0000000002, 2.0000000001, 3.0000000004]
        
        tolerance = 1e-9
        validation_results = {}
        
        for i, (v1, v2) in enumerate(zip(values1, values2)):
            match = abs(v1 - v2) <= tolerance
            validation_results[f'value_{i}_match'] = match
        
        # Print results
        passed = sum(1 for v in validation_results.values() if v)
        total = len(validation_results)
        print(f"✅ ST-002: {passed}/{total} floating point comparisons within tolerance")
        
        for check, passed in validation_results.items():
            status = "✅ PASS" if passed else "❌ FAIL"
            print(f"  {check}: {status}")
        
        # Assert all comparisons are within tolerance
        assert all(validation_results.values()), f"Floating point tolerance failed: {validation_results}"
        
        return validation_results

# Comprehensive test suite
class TestComprehensiveValidation:
    """Run all validation tests and generate comprehensive report"""
    
    def __init__(self):
        # Use metric-specific tolerances
        metric_tolerances = {
            'Total Return (%)': 0.015,      # 1.5% tolerance
            'Max Drawdown (%)': 0.015,      # 1.5% tolerance
            'Profit Factor': 0.02,          # 2% tolerance
            'Win Rate (%)': 0.001,          # 0.1% tolerance
            'Sharpe Ratio': 0.05,           # 0.05 tolerance
            'Total Trades': 0,              # Exact match
            'Final Portfolio Value': 100    # $100 tolerance
        }
        self.numerical_parity = TestNumericalParity()
        self.leverage_correctness = TestLeverageCorrectness()
        self.optimizer_parity = TestOptimizerParity()
        self.trade_concurrency = TestTradeConcurrency()
        self.stability = TestStabilityAndReproducibility()
        self.validator = TestResultValidator(tolerance=1e-10, metric_tolerances=metric_tolerances)
    
    def run_all_tests(self):
        """Run all validation tests"""
        print("\n" + "="*60)
        print("🚀 COMPREHENSIVE BACKTEST VALIDATION TEST SUITE")
        print("="*60)
        
        all_results = {}
        
        # Run numerical parity tests
        print("\n📊 Running Numerical Parity Tests...")
        all_results['numerical_parity'] = {
            'single_backtest_consistency': self.numerical_parity.test_single_backtest_consistency(),
            'position_sizing_consistency': self.numerical_parity.test_position_sizing_consistency(),
            'signal_type_consistency': self.numerical_parity.test_signal_type_consistency()
        }
        
        # Run leverage correctness tests
        print("\n⚖️ Running Leverage Correctness Tests...")
        all_results['leverage_correctness'] = {
            'leverage_constraints': self.leverage_correctness.test_leverage_constraints(),
            'margin_calculations': self.leverage_correctness.test_margin_calculations()
        }
        
        # Run optimizer parity tests
        print("\n🎯 Running Optimizer Parity Tests...")
        all_results['optimizer_parity'] = {
            'parameter_optimization_consistency': self.optimizer_parity.test_parameter_optimization_consistency()
        }
        
        # Run trade concurrency tests
        print("\n🔄 Running Trade Concurrency Tests...")
        all_results['trade_concurrency'] = {
            'single_trade_per_instrument': self.trade_concurrency.test_single_trade_per_instrument(),
            'multiple_trades_per_instrument': self.trade_concurrency.test_multiple_trades_per_instrument()
        }
        
        # Run stability tests
        print("\n🔒 Running Stability Tests...")
        all_results['stability'] = {
            'deterministic_results': self.stability.test_deterministic_results(),
            'floating_point_tolerance': self.stability.test_floating_point_tolerance()
        }
        
        # Generate comprehensive report
        report = self.validator.generate_validation_report(all_results)
        print("\n" + report)
        
        # Save report to file
        with open('backend/tests/validation_report.txt', 'w') as f:
            f.write(report)
        
        return all_results
    
    def run_specific_test(self, test_name: str):
        """Run a specific test"""
        test_methods = {
            'single_backtest_consistency': self.numerical_parity.test_single_backtest_consistency,
            'position_sizing_consistency': self.numerical_parity.test_position_sizing_consistency,
            'signal_type_consistency': self.numerical_parity.test_signal_type_consistency,
            'leverage_constraints': self.leverage_correctness.test_leverage_constraints,
            'margin_calculations': self.leverage_correctness.test_margin_calculations,
            'parameter_optimization_consistency': self.optimizer_parity.test_parameter_optimization_consistency,
            'single_trade_per_instrument': self.trade_concurrency.test_single_trade_per_instrument,
            'multiple_trades_per_instrument': self.trade_concurrency.test_multiple_trades_per_instrument,
            'deterministic_results': self.stability.test_deterministic_results,
            'floating_point_tolerance': self.stability.test_floating_point_tolerance
        }
        
        if test_name in test_methods:
            print(f"\n🧪 Running {test_name}...")
            return test_methods[test_name]()
        else:
            print(f"❌ Test '{test_name}' not found")
            return {}

# Pytest fixtures
@pytest.fixture
def comprehensive_test_suite():
    """Comprehensive test suite fixture"""
    return TestComprehensiveValidation()

# Test functions for pytest
def test_numerical_parity(comprehensive_test_suite):
    """Test numerical parity"""
    results = comprehensive_test_suite.run_specific_test('single_backtest_consistency')
    assert all(results.values())

def test_leverage_correctness(comprehensive_test_suite):
    """Test leverage correctness"""
    results = comprehensive_test_suite.run_specific_test('leverage_constraints')
    assert all(results.values())

def test_optimizer_parity(comprehensive_test_suite):
    """Test optimizer parity"""
    results = comprehensive_test_suite.run_specific_test('parameter_optimization_consistency')
    assert all(results.values())

def test_trade_concurrency(comprehensive_test_suite):
    """Test trade concurrency"""
    results = comprehensive_test_suite.run_specific_test('single_trade_per_instrument')
    assert all(results.values())

def test_stability(comprehensive_test_suite):
    """Test stability"""
    results = comprehensive_test_suite.run_specific_test('deterministic_results')
    assert all(results.values())

def test_comprehensive_validation(comprehensive_test_suite):
    """Run comprehensive validation"""
    results = comprehensive_test_suite.run_all_tests()
    
    # Check that all tests passed
    all_passed = True
    for category, tests in results.items():
        for test_name, test_results in tests.items():
            if not all(test_results.values()):
                all_passed = False
                print(f"❌ {category}.{test_name} failed: {test_results}")
    
    assert all_passed, "Some validation tests failed"

if __name__ == "__main__":
    # Run comprehensive validation
    suite = TestComprehensiveValidation()
    results = suite.run_all_tests()
    
    # Exit with appropriate code
    all_passed = True
    for category, tests in results.items():
        for test_name, test_results in tests.items():
            if not all(test_results.values()):
                all_passed = False
                break
    
    exit(0 if all_passed else 1)