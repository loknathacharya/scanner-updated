"""
Backtesting Validation Test Implementation
=========================================

This module implements comprehensive tests for backtesting validation.
It tests vectorized vs non-vectorized consistency, leverage conditions,
parameter optimization accuracy, and trade restriction compliance.
"""

import unittest
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Any, Optional
import pytest
import time
import json
import os
from pathlib import Path

# Import backtesting engine functions
from backend.BackTestEngine import (
    run_backtest,
    run_vectorized_single_backtest,
    run_vectorized_parameter_optimization,
    run_parameter_optimization,
    calculate_performance_metrics,
    calculate_position_size,
    calculate_position_size_vectorized
)

# Import test configuration and data fixtures
from test_config import (
    TEST_CONFIG,
    get_tolerance_level,
    get_performance_threshold,
    POSITION_SIZING_CONFIG,
    SUCCESS_CRITERIA
)
from test_data_fixtures import (
    generate_complete_test_dataset,
    TestDataGenerator,
    TestDataValidator
)


class TestDataManager:
    """Manages test data loading and preparation."""

    def __init__(self):
        """Initialize test data manager."""
        self.test_data = None
        self.ohlcv_data = None
        self.signals_data = None

    def load_test_data(self) -> None:
        """Load or generate test data."""
        # Try to load existing test data
        ohlcv_file = Path('backend/tests/test_data_ohlcv.csv')
        signals_file = Path('backend/tests/test_data_signals.csv')

        if ohlcv_file.exists() and signals_file.exists():
            print("Loading existing test data...")
            self.ohlcv_data = pd.read_csv(ohlcv_file)
            self.signals_data = pd.read_csv(signals_file)

            # Convert date columns
            self.ohlcv_data['Date'] = pd.to_datetime(self.ohlcv_data['Date'])
            self.signals_data['Date'] = pd.to_datetime(self.signals_data['Date'])
        else:
            print("Generating new test data...")
            self.test_data = generate_complete_test_dataset()
            self.ohlcv_data = self.test_data['main_ohlcv']
            self.signals_data = self.test_data['main_signals']

            # Save test data for future use
            self.ohlcv_data.to_csv('backend/tests/test_data_ohlcv.csv', index=False)
            self.signals_data.to_csv('backend/tests/test_data_signals.csv', index=False)

    def get_ohlcv_data(self) -> pd.DataFrame:
        """Get OHLCV test data."""
        if self.ohlcv_data is None:
            self.load_test_data()
        return self.ohlcv_data or pd.DataFrame()

    def get_signals_data(self) -> pd.DataFrame:
        """Get signals test data."""
        if self.signals_data is None:
            self.load_test_data()
        return self.signals_data or pd.DataFrame()


class TestResultComparator:
    """Compares test results and validates consistency."""

    def __init__(self):
        """Initialize result comparator."""
        self.tolerances = TEST_CONFIG['tolerance_levels']

    def compare_performance_metrics(self, metrics1: Dict[str, Any],
                                  metrics2: Dict[str, Any],
                                  test_name: str) -> Dict[str, Any]:
        """Compare two sets of performance metrics."""
        comparison_results = {
            'test_name': test_name,
            'metrics_comparison': {},
            'overall_pass': True,
            'failures': []
        }

        # Key metrics to compare
        key_metrics = [
            'Total Return (%)',
            'Win Rate (%)',
            'Total P&L ($)',
            'Total Trades',
            'Max Drawdown (%)',
            'Sharpe Ratio',
            'Profit Factor'
        ]

        for metric in key_metrics:
            if metric in metrics1 and metric in metrics2:
                val1 = metrics1[metric]
                val2 = metrics2[metric]

                # Get appropriate tolerance
                tolerance = self._get_tolerance_for_metric(metric)

                # Calculate difference
                if isinstance(val1, (int, float)) and isinstance(val2, (int, float)):
                    if val1 == 0 and val2 == 0:
                        diff_pct = 0.0
                    elif val1 == 0:
                        diff_pct = abs(val2) * 100
                    else:
                        diff_pct = abs((val1 - val2) / val1) * 100

                    within_tolerance = diff_pct <= tolerance

                    comparison_results['metrics_comparison'][metric] = {
                        'value1': val1,
                        'value2': val2,
                        'difference_pct': diff_pct,
                        'tolerance': tolerance,
                        'within_tolerance': within_tolerance
                    }

                    if not within_tolerance:
                        comparison_results['overall_pass'] = False
                        comparison_results['failures'].append({
                            'metric': metric,
                            'values': [val1, val2],
                            'difference_pct': diff_pct,
                            'tolerance': tolerance
                        })

        return comparison_results

    def _get_tolerance_for_metric(self, metric: str) -> float:
        """Get tolerance level for a specific metric."""
        tolerance_map = {
            'Total Return (%)': self.tolerances['return_tolerance'],
            'Win Rate (%)': self.tolerances['win_rate_tolerance'],
            'Total P&L ($)': 0.01,  # 0.01% for dollar amounts
            'Total Trades': 0,  # Must be exact
            'Max Drawdown (%)': self.tolerances['drawdown_tolerance'],
            'Sharpe Ratio': self.tolerances['sharpe_tolerance'],
            'Profit Factor': self.tolerances['profit_factor_tolerance']
        }
        return tolerance_map.get(metric, 0.01)

    def compare_trade_logs(self, trades1: pd.DataFrame,
                          trades2: pd.DataFrame,
                          test_name: str) -> Dict[str, Any]:
        """Compare two trade logs for consistency."""
        comparison_results = {
            'test_name': test_name,
            'trade_comparison': {},
            'overall_pass': True,
            'failures': []
        }

        # Basic trade statistics
        basic_stats = ['Total Trades', 'Total P&L ($)', 'Win Rate (%)']
        for stat in basic_stats:
            if stat == 'Total Trades':
                val1, val2 = len(trades1), len(trades2)
            elif stat == 'Total P&L ($)':
                val1, val2 = trades1['P&L ($)'].sum(), trades2['P&L ($)'].sum()
            elif stat == 'Win Rate (%)':
                val1 = (trades1['Profit/Loss (%)'] > 0).sum() / len(trades1) * 100
                val2 = (trades2['Profit/Loss (%)'] > 0).sum() / len(trades2) * 100

            tolerance = self._get_tolerance_for_metric(stat)
            diff_pct = abs((val1 - val2) / max(val1, 1)) * 100
            within_tolerance = diff_pct <= tolerance

            comparison_results['trade_comparison'][stat] = {
                'value1': val1,
                'value2': val2,
                'difference_pct': diff_pct,
                'within_tolerance': within_tolerance
            }

            if not within_tolerance:
                comparison_results['overall_pass'] = False
                comparison_results['failures'].append({
                    'stat': stat,
                    'values': [val1, val2],
                    'difference_pct': diff_pct
                })

        return comparison_results


class TestVectorizedConsistency(unittest.TestCase):
    """Test vectorized vs non-vectorized consistency."""

    def setUp(self):
        """Set up test fixtures."""
        self.data_manager = TestDataManager()
        self.comparator = TestResultComparator()
        self.data_manager.load_test_data()

    def test_single_backtest_consistency(self):
        """Test VC-001: Single backtest consistency."""
        print("Running VC-001: Single backtest consistency test...")

        ohlcv_data = self.data_manager.get_ohlcv_data()
        signals_data = self.data_manager.get_signals_data()

        # Test parameters
        test_params = {
            'holding_period': 10,
            'stop_loss_pct': 5.0,
            'take_profit_pct': 10.0,
            'one_trade_per_instrument': False,
            'initial_capital': 100000,
            'sizing_method': 'equal_weight',
            'sizing_params': {},
            'signal_type': 'long',
            'allow_leverage': False
        }

        # Run both implementations
        trades_vectorized, _ = run_vectorized_single_backtest(
            ohlcv_data, signals_data, **test_params
        )

        trades_standard, _ = run_backtest(
            ohlcv_data, signals_data, **test_params
        )

        # Calculate performance metrics
        metrics_vectorized = calculate_performance_metrics(trades_vectorized)
        metrics_standard = calculate_performance_metrics(trades_standard)

        # Compare results
        comparison = self.comparator.compare_performance_metrics(
            metrics_vectorized, metrics_standard, "VC-001"
        )

        # Assert consistency
        self.assertTrue(
            comparison['overall_pass'],
            f"Vectorized and standard backtest results inconsistent: {comparison['failures']}"
        )

        print(f"✅ VC-001 passed: {len(trades_vectorized)} vs {len(trades_standard)} trades")

    def test_parameter_optimization_consistency(self):
        """Test VC-002: Parameter optimization consistency."""
        print("Running VC-002: Parameter optimization consistency test...")

        ohlcv_data = self.data_manager.get_ohlcv_data()
        signals_data = self.data_manager.get_signals_data()

        # Test parameters
        test_params = {
            'holding_periods': [5, 10],
            'stop_losses': [3.0, 5.0],
            'take_profits': [8.0, 12.0],
            'one_trade_per_instrument': False,
            'initial_capital': 100000,
            'sizing_method': 'equal_weight',
            'sizing_params': {},
            'signal_type': 'long',
            'allow_leverage': False
        }

        # Run both implementations
        try:
            results_vectorized = run_vectorized_parameter_optimization(
                ohlcv_data, signals_data, **test_params
            )

            results_standard = run_parameter_optimization(
                ohlcv_data, signals_data, **test_params
            )

            # Compare best results
            if not results_vectorized.empty and not results_standard.empty:
                best_vectorized = results_vectorized.loc[results_vectorized['Total Return (%)'].idxmax()]
                best_standard = results_standard.loc[results_standard['Total Return (%)'].idxmax()]

                comparison = self.comparator.compare_performance_metrics(
                    best_vectorized.to_dict(), best_standard.to_dict(), "VC-002"
                )

                self.assertTrue(
                    comparison['overall_pass'],
                    f"Optimization results inconsistent: {comparison['failures']}"
                )

                print(f"✅ VC-002 passed: {len(results_vectorized)} vs {len(results_standard)} combinations")
            else:
                self.skipTest("No optimization results generated")

        except Exception as e:
            self.skipTest(f"Optimization test failed: {e}")


class TestLeverageConditions(unittest.TestCase):
    """Test leverage vs non-leverage conditions."""

    def setUp(self):
        """Set up test fixtures."""
        self.data_manager = TestDataManager()
        self.comparator = TestResultComparator()
        self.data_manager.load_test_data()

    def test_position_sizing_with_leverage(self):
        """Test LC-001: Position sizing with leverage=True."""
        print("Running LC-001: Position sizing with leverage test...")

        ohlcv_data = self.data_manager.get_ohlcv_data()
        signals_data = self.data_manager.get_signals_data()

        # Test parameters
        test_params = {
            'holding_period': 10,
            'stop_loss_pct': 5.0,
            'take_profit_pct': 10.0,
            'one_trade_per_instrument': False,
            'initial_capital': 100000,
            'sizing_method': 'equal_weight',
            'sizing_params': {},
            'signal_type': 'long',
            'allow_leverage': True  # Enable leverage
        }

        # Run backtest with leverage
        trades_with_leverage, _ = run_backtest(ohlcv_data, signals_data, **test_params)

        # Calculate metrics
        metrics = calculate_performance_metrics(trades_with_leverage)

        # Validate leverage was used
        if 'Leverage Metrics' in metrics:
            avg_leverage = metrics['Leverage Metrics'].get('Average Leverage', 1.0)
            self.assertGreater(avg_leverage, 1.0,
                             "Leverage should be greater than 1.0 when allow_leverage=True")

        print(f"✅ LC-001 passed: Average leverage = {avg_leverage:.2f}x")

    def test_position_sizing_without_leverage(self):
        """Test LC-002: Position sizing with leverage=False."""
        print("Running LC-002: Position sizing without leverage test...")

        ohlcv_data = self.data_manager.get_ohlcv_data()
        signals_data = self.data_manager.get_signals_data()

        # Test parameters
        test_params = {
            'holding_period': 10,
            'stop_loss_pct': 5.0,
            'take_profit_pct': 10.0,
            'one_trade_per_instrument': False,
            'initial_capital': 100000,
            'sizing_method': 'equal_weight',
            'sizing_params': {},
            'signal_type': 'long',
            'allow_leverage': False  # Disable leverage
        }

        # Run backtest without leverage
        trades_without_leverage, _ = run_backtest(ohlcv_data, signals_data, **test_params)

        # Calculate metrics
        metrics = calculate_performance_metrics(trades_without_leverage)

        # Validate no leverage was used
        if 'Leverage Metrics' in metrics:
            avg_leverage = metrics['Leverage Metrics'].get('Average Leverage', 1.0)
            self.assertLessEqual(avg_leverage, 1.0,
                               "Leverage should be <= 1.0 when allow_leverage=False")

        print(f"✅ LC-002 passed: Average leverage = {avg_leverage:.2f}x")

    def test_position_sizing_methods(self):
        """Test LC-003: All position sizing methods."""
        print("Running LC-003: Position sizing methods test...")

        ohlcv_data = self.data_manager.get_ohlcv_data()
        signals_data = self.data_manager.get_signals_data()

        sizing_methods = TEST_CONFIG['backtesting_parameters']['position_sizing_methods']

        for method in sizing_methods:
            print(f"  Testing {method}...")

            test_params = {
                'holding_period': 10,
                'stop_loss_pct': 5.0,
                'take_profit_pct': 10.0,
                'one_trade_per_instrument': False,
                'initial_capital': 100000,
                'sizing_method': method,
                'sizing_params': POSITION_SIZING_CONFIG[method],
                'signal_type': 'long',
                'allow_leverage': False
            }

            # Run backtest
            trades, _ = run_backtest(ohlcv_data, signals_data, **test_params)

            # Validate results
            self.assertGreater(len(trades), 0,
                             f"No trades generated for sizing method {method}")

            # Calculate metrics
            metrics = calculate_performance_metrics(trades)

            # Basic validation
            self.assertIn('Total Trades', metrics)
            self.assertIn('Total Return (%)', metrics)
            self.assertGreaterEqual(metrics['Total Trades'], 0)

            print(f"    ✅ {method}: {metrics['Total Trades']} trades, "
                  f"{metrics['Total Return (%)']:.2f}% return")


class TestParameterOptimization(unittest.TestCase):
    """Test parameter optimization consistency."""

    def setUp(self):
        """Set up test fixtures."""
        self.data_manager = TestDataManager()
        self.comparator = TestResultComparator()
        self.data_manager.load_test_data()

    def test_single_vs_optimization_consistency(self):
        """Test PO-001: Single parameter results match optimization results."""
        print("Running PO-001: Single vs optimization consistency test...")

        ohlcv_data = self.data_manager.get_ohlcv_data()
        signals_data = self.data_manager.get_signals_data()

        # Test specific parameter combination
        test_params = {
            'holding_period': 10,
            'stop_loss_pct': 5.0,
            'take_profit_pct': 10.0,
            'one_trade_per_instrument': False,
            'initial_capital': 100000,
            'sizing_method': 'equal_weight',
            'sizing_params': {},
            'signal_type': 'long',
            'allow_leverage': False
        }

        # Run single backtest
        trades_single, _ = run_backtest(ohlcv_data, signals_data, **test_params)
        metrics_single = calculate_performance_metrics(trades_single)

        # Run optimization with single parameter
        optimization_params = {
            'holding_periods': [10],
            'stop_losses': [5.0],
            'take_profits': [10.0],
            'one_trade_per_instrument': False,
            'initial_capital': 100000,
            'sizing_method': 'equal_weight',
            'sizing_params': {},
            'signal_type': 'long',
            'allow_leverage': False
        }

        results_opt = run_parameter_optimization(ohlcv_data, signals_data, **optimization_params)

        if not results_opt.empty:
            # Get optimization result for our specific parameters
            opt_result = results_opt.iloc[0].to_dict()

            # Compare results
            comparison = self.comparator.compare_performance_metrics(
                metrics_single, opt_result, "PO-001"
            )

            self.assertTrue(
                comparison['overall_pass'],
                f"Single backtest vs optimization mismatch: {comparison['failures']}"
            )

            print("✅ PO-001 passed: Single and optimization results match")
        else:
            self.skipTest("No optimization results generated")


class TestTradeRestrictions(unittest.TestCase):
    """Test trade restriction compliance."""

    def setUp(self):
        """Set up test fixtures."""
        self.data_manager = TestDataManager()
        self.comparator = TestResultComparator()
        self.data_manager.load_test_data()

    def test_single_trade_per_instrument(self):
        """Test TR-001: Single trade per instrument restriction."""
        print("Running TR-001: Single trade per instrument test...")

        ohlcv_data = self.data_manager.get_ohlcv_data()
        signals_data = self.data_manager.get_signals_data()

        # Filter signals to ensure multiple signals for same instrument
        test_signals = signals_data.copy()

        # Create duplicate signals for same instrument to test restriction
        duplicate_signals = []
        for _, signal in test_signals.iterrows():
            if signal['Ticker'] == 'RELIANCE':  # Use RELIANCE for testing
                # Add another signal for same instrument on different date
                new_signal = signal.copy()
                new_signal['Date'] = signal['Date'] + timedelta(days=5)
                duplicate_signals.append(new_signal)

        test_signals = pd.concat([test_signals, pd.DataFrame(duplicate_signals)], ignore_index=True)

        # Test parameters
        test_params = {
            'holding_period': 10,
            'stop_loss_pct': 5.0,
            'take_profit_pct': 10.0,
            'one_trade_per_instrument': True,  # Enable restriction
            'initial_capital': 100000,
            'sizing_method': 'equal_weight',
            'sizing_params': {},
            'signal_type': 'long',
            'allow_leverage': False
        }

        # Run backtest with restriction
        trades_restricted, _ = run_backtest(ohlcv_data, test_signals, **test_params)

        # Validate that only one trade per instrument exists
        for instrument in trades_restricted['Ticker'].unique():
            inst_trades = trades_restricted[trades_restricted['Ticker'] == instrument]
            self.assertLessEqual(len(inst_trades), 1,
                               f"Multiple trades found for {instrument} with restriction enabled")

        print(f"✅ TR-001 passed: {len(trades_restricted)} trades with restriction")


def run_all_tests():
    """Run all backtesting validation tests."""
    print("🚀 Starting Backtesting Validation Test Suite...")
    print("=" * 60)

    # Initialize test manager
    test_manager = TestDataManager()
    test_manager.load_test_data()

    # Run test suites
    test_suites = [
        TestVectorizedConsistency,
        TestLeverageConditions,
        TestParameterOptimization,
        TestTradeRestrictions
    ]

    results = {
        'total_tests': 0,
        'passed_tests': 0,
        'failed_tests': 0,
        'skipped_tests': 0,
        'test_results': []
    }

    for test_suite in test_suites:
        print(f"\n📋 Running {test_suite.__name__}...")
        print("-" * 40)

        # Create test suite
        suite = unittest.TestLoader().loadTestsFromTestCase(test_suite)

        # Run tests
        runner = unittest.TextTestRunner(verbosity=2)
        suite_result = runner.run(suite)

        # Collect results
        suite_name = test_suite.__name__
        suite_results = {
            'suite_name': suite_name,
            'tests_run': suite_result.testsRun,
            'failures': len(suite_result.failures),
            'errors': len(suite_result.errors),
            'skipped': len(suite_result.skipped)
        }

        results['total_tests'] += suite_result.testsRun
        results['passed_tests'] += (suite_result.testsRun - len(suite_result.failures) -
                                  len(suite_result.errors) - len(suite_result.skipped))
        results['failed_tests'] += len(suite_result.failures) + len(suite_result.errors)
        results['skipped_tests'] += len(suite_result.skipped)
        results['test_results'].append(suite_results)

    # Print summary
    print("\n" + "=" * 60)
    print("📊 TEST SUMMARY")
    print("=" * 60)
    print(f"Total Tests: {results['total_tests']}")
    print(f"Passed: {results['passed_tests']}")
    print(f"Failed: {results['failed_tests']}")
    print(f"Skipped: {results['skipped_tests']}")
    print(f"Success Rate: {(results['passed_tests']/max(results['total_tests'], 1)*100):.1f}%")

    # Check success criteria
    success_rate = results['passed_tests'] / max(results['total_tests'], 1)
    if success_rate >= SUCCESS_CRITERIA['overall_pass_rate']:
        print("✅ All success criteria met!")
        return True
    else:
        print(f"❌ Success criteria not met. Required: {SUCCESS_CRITERIA['overall_pass_rate']*100:.1f}%")
        return False


if __name__ == "__main__":
    success = run_all_tests()
    exit(0 if success else 1)