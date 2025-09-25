#!/usr/bin/env python3
"""
Comprehensive numerical analysis to identify potential sources of differences
between vectorized and non-vectorized implementations across various scenarios.
"""

import pandas as pd
import numpy as np
import sys
import os
from datetime import datetime, timedelta

# Add the parent directory to the path to import BackTestEngine
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from BackTestEngine import (
    run_backtest, 
    run_vectorized_single_backtest,
    calculate_performance_metrics,
    calculate_leverage_metrics
)

def create_test_data_with_edge_cases():
    """Create test data that might expose differences between implementations"""
    print("Creating test data with edge cases...")
    
    # Create OHLCV data with more realistic price movements
    dates = pd.date_range('2023-01-01', periods=200, freq='D')
    ohlcv_data = []
    
    for i, date in enumerate(dates):
        # Create more volatile price movement
        base_price = 100 + i * 0.3 + np.sin(i * 0.1) * 5
        volatility = 0.02 + 0.01 * np.sin(i * 0.05)
        
        ohlcv_data.append({
            'Ticker': 'TEST',
            'Date': date,
            'Open': base_price * (1 + np.random.normal(0, volatility)),
            'High': base_price * (1 + np.random.normal(0.5, volatility)),
            'Low': base_price * (1 + np.random.normal(-0.5, volatility)),
            'Close': base_price * (1 + np.random.normal(0.1, volatility)),
            'Volume': 1000000 + np.random.normal(0, 200000)
        })
    
    ohlcv_df = pd.DataFrame(ohlcv_data)
    
    # Create signals data with varying timing
    signal_dates = [dates[15], dates[45], dates[75], dates[105], dates[135], dates[165]]
    signals_data = []
    
    for date in signal_dates:
        signals_data.append({
            'Ticker': 'TEST',
            'Date': date
        })
    
    signals_df = pd.DataFrame(signals_data)
    
    return ohlcv_df, signals_df

def analyze_parameter_impact():
    """Analyze how different parameters affect numerical differences"""
    print("=" * 80)
    print("COMPREHENSIVE NUMERICAL ANALYSIS")
    print("=" * 80)
    
    # Create test data
    ohlcv_df, signals_df = create_test_data_with_edge_cases()
    
    # Test different parameter combinations
    test_scenarios = [
        {
            'name': 'Basic Long Trades',
            'params': {
                'holding_period': 5,
                'stop_loss_pct': 5.0,
                'take_profit_pct': 10.0,
                'one_trade_per_instrument': False,
                'initial_capital': 100000,
                'sizing_method': 'equal_weight',
                'sizing_params': {},
                'signal_type': 'long',
                'allow_leverage': False
            }
        },
        {
            'name': 'Short Trades',
            'params': {
                'holding_period': 5,
                'stop_loss_pct': 5.0,
                'take_profit_pct': 10.0,
                'one_trade_per_instrument': False,
                'initial_capital': 100000,
                'sizing_method': 'equal_weight',
                'sizing_params': {},
                'signal_type': 'short',
                'allow_leverage': False
            }
        },
        {
            'name': 'Fixed Amount Sizing',
            'params': {
                'holding_period': 5,
                'stop_loss_pct': 5.0,
                'take_profit_pct': 10.0,
                'one_trade_per_instrument': False,
                'initial_capital': 100000,
                'sizing_method': 'fixed_amount',
                'sizing_params': {'fixed_amount': 5000},
                'signal_type': 'long',
                'allow_leverage': False
            }
        },
        {
            'name': 'Percent Risk Sizing',
            'params': {
                'holding_period': 5,
                'stop_loss_pct': 5.0,
                'take_profit_pct': 10.0,
                'one_trade_per_instrument': False,
                'initial_capital': 100000,
                'sizing_method': 'percent_risk',
                'sizing_params': {'risk_per_trade': 2.0},
                'signal_type': 'long',
                'allow_leverage': False
            }
        },
        {
            'name': 'Kelly Criterion Sizing',
            'params': {
                'holding_period': 5,
                'stop_loss_pct': 5.0,
                'take_profit_pct': 10.0,
                'one_trade_per_instrument': False,
                'initial_capital': 100000,
                'sizing_method': 'kelly_criterion',
                'sizing_params': {
                    'kelly_win_rate': 60,
                    'kelly_avg_win': 8,
                    'kelly_avg_loss': -5
                },
                'signal_type': 'long',
                'allow_leverage': False
            }
        },
        {
            'name': 'One Trade Per Instrument',
            'params': {
                'holding_period': 5,
                'stop_loss_pct': 5.0,
                'take_profit_pct': 10.0,
                'one_trade_per_instrument': True,
                'initial_capital': 100000,
                'sizing_method': 'equal_weight',
                'sizing_params': {},
                'signal_type': 'long',
                'allow_leverage': False
            }
        },
        {
            'name': 'With Leverage',
            'params': {
                'holding_period': 5,
                'stop_loss_pct': 5.0,
                'take_profit_pct': 10.0,
                'one_trade_per_instrument': False,
                'initial_capital': 100000,
                'sizing_method': 'equal_weight',
                'sizing_params': {},
                'signal_type': 'long',
                'allow_leverage': True
            }
        },
        {
            'name': 'Long Holding Period',
            'params': {
                'holding_period': 20,
                'stop_loss_pct': 5.0,
                'take_profit_pct': 15.0,
                'one_trade_per_instrument': False,
                'initial_capital': 100000,
                'sizing_method': 'equal_weight',
                'sizing_params': {},
                'signal_type': 'long',
                'allow_leverage': False
            }
        }
    ]
    
    all_results = []
    
    for scenario in test_scenarios:
        print(f"\n{'='*60}")
        print(f"SCENARIO: {scenario['name']}")
        print(f"{'='*60}")
        
        params = scenario['params']
        print(f"Parameters: {params}")
        
        # Run both implementations
        try:
            non_vec_trades, non_vec_warnings = run_backtest(
                ohlcv_df=ohlcv_df,
                signals_df=signals_df,
                **params
            )
            
            vec_trades, vec_warnings = run_vectorized_single_backtest(
                ohlcv_df=ohlcv_df,
                signals_df=signals_df,
                **params
            )
            
            # Compare results
            comparison = compare_implementations(non_vec_trades, vec_trades, scenario['name'])
            all_results.append(comparison)
            
            # Print summary
            print_comparison_summary(comparison)
            
        except Exception as e:
            print(f"❌ Error in scenario '{scenario['name']}': {e}")
            import traceback
            traceback.print_exc()
    
    # Overall analysis
    print(f"\n{'='*80}")
    print("OVERALL ANALYSIS SUMMARY")
    print(f"{'='*80}")
    
    analyze_overall_results(all_results)

def compare_implementations(non_vec_trades, vec_trades, scenario_name):
    """Compare two implementations and return detailed analysis"""
    comparison = {
        'scenario': scenario_name,
        'non_vec_trades_count': len(non_vec_trades),
        'vec_trades_count': len(vec_trades),
        'trade_count_match': len(non_vec_trades) == len(vec_trades),
        'numerical_differences': [],
        'performance_differences': [],
        'structural_differences': []
    }
    
    # Check if both have trades
    if non_vec_trades.empty and vec_trades.empty:
        comparison['status'] = 'no_trades'
        return comparison
    
    if non_vec_trades.empty:
        comparison['status'] = 'only_vectorized'
        return comparison
    
    if vec_trades.empty:
        comparison['status'] = 'only_non_vectorized'
        return comparison
    
    # Align trades by index
    max_trades = max(len(non_vec_trades), len(vec_trades))
    non_vec_trades = non_vec_trades.reindex(range(max_trades))
    vec_trades = vec_trades.reindex(range(max_trades))
    
    # Compare numerical columns
    numerical_columns = [
        'Entry Price', 'Exit Price', 'Shares', 'Position Value', 
        'P&L ($)', 'Profit/Loss (%)', 'Days Held', 'Portfolio Value'
    ]
    
    for col in numerical_columns:
        if col in non_vec_trades.columns and col in vec_trades.columns:
            non_vec_values = pd.to_numeric(non_vec_trades[col], errors='coerce')
            vec_values = pd.to_numeric(vec_trades[col], errors='coerce')
            
            # Calculate differences
            differences = non_vec_values - vec_values
            
            # Find significant differences
            if col in ['P&L ($)', 'Position Value', 'Portfolio Value']:
                mask = np.abs(differences) > 0.01
            else:
                mask = np.abs(differences) > 0.0001
            
            significant_diffs = differences[mask]
            
            if not significant_diffs.empty:
                comparison['numerical_differences'].append({
                    'column': col,
                    'differences': significant_diffs.to_dict(),
                    'max_diff': significant_diffs.abs().max(),
                    'mean_diff': significant_diffs.abs().mean(),
                    'count': len(significant_diffs)
                })
    
    # Compare performance metrics
    try:
        non_vec_metrics = calculate_performance_metrics(non_vec_trades, 100000)
        vec_metrics = calculate_performance_metrics(vec_trades, 100000)
        
        for key in non_vec_metrics:
            if key in vec_metrics:
                non_vec_val = non_vec_metrics[key]
                vec_val = vec_metrics[key]
                
                if isinstance(non_vec_val, (int, float)) and isinstance(vec_val, (int, float)):
                    diff = abs(non_vec_val - vec_val)
                    if diff > 0.01:
                        comparison['performance_differences'].append({
                            'metric': key,
                            'non_vectorized': non_vec_val,
                            'vectorized': vec_val,
                            'difference': diff
                        })
    except Exception as e:
        comparison['structural_differences'].append(f"Performance metrics error: {e}")
    
    # Check structural differences
    if len(non_vec_trades) != len(vec_trades):
        comparison['structural_differences'].append(
            f"Trade count mismatch: {len(non_vec_trades)} vs {len(vec_trades)}"
        )
    
    # Check column differences
    non_vec_cols = set(non_vec_trades.columns)
    vec_cols = set(vec_trades.columns)
    
    if non_vec_cols != vec_cols:
        comparison['structural_differences'].append(
            f"Column mismatch: Non-Vec has {non_vec_cols - vec_cols}, Vec has {vec_cols - non_vec_cols}"
        )
    
    comparison['status'] = 'complete'
    return comparison

def print_comparison_summary(comparison):
    """Print a summary of comparison results"""
    print(f"Status: {comparison['status']}")
    print(f"Trade Count: Non-Vec={comparison['non_vec_trades_count']}, Vec={comparison['vec_trades_count']}")
    
    if comparison['numerical_differences']:
        print(f"❌ Numerical Differences ({len(comparison['numerical_differences'])} columns):")
        for diff in comparison['numerical_differences']:
            print(f"   - {diff['column']}: Max diff={diff['max_diff']:.6f}, Mean diff={diff['mean_diff']:.6f}, Count={diff['count']}")
    else:
        print("✅ No numerical differences")
    
    if comparison['performance_differences']:
        print(f"❌ Performance Differences ({len(comparison['performance_differences'])} metrics):")
        for diff in comparison['performance_differences']:
            print(f"   - {diff['metric']}: Diff={diff['difference']:.6f}")
    else:
        print("✅ No performance differences")
    
    if comparison['structural_differences']:
        print(f"❌ Structural Differences ({len(comparison['structural_differences'])} issues):")
        for diff in comparison['structural_differences']:
            print(f"   - {diff}")
    else:
        print("✅ No structural differences")

def analyze_overall_results(all_results):
    """Analyze all results and provide insights"""
    scenarios_with_differences = [r for r in all_results if r['status'] == 'complete' and 
                                 (r['numerical_differences'] or r['performance_differences'])]
    
    scenarios_without_differences = [r for r in all_results if r['status'] == 'complete' and 
                                    not r['numerical_differences'] and not r['performance_differences']]
    
    print(f"Total scenarios tested: {len(all_results)}")
    print(f"Scenarios with differences: {len(scenarios_with_differences)}")
    print(f"Scenarios without differences: {len(scenarios_without_differences)}")
    
    if scenarios_with_differences:
        print(f"\n🔍 SCENARIOS WITH DIFFERENCES:")
        for result in scenarios_with_differences:
            print(f"   - {result['scenario']}")
            if result['numerical_differences']:
                print(f"     Numerical: {len(result['numerical_differences'])} columns")
            if result['performance_differences']:
                print(f"     Performance: {len(result['performance_differences'])} metrics")
    
    if scenarios_without_differences:
        print(f"\n✅ SCENARIOS WITHOUT DIFFERENCES:")
        for result in scenarios_without_differences:
            print(f"   - {result['scenario']}")
    
    # Analyze difference patterns
    print(f"\n📊 DIFFERENCE PATTERNS:")
    
    all_numerical_diffs = []
    for result in all_results:
        all_numerical_diffs.extend(result['numerical_differences'])
    
    if all_numerical_diffs:
        column_counts = {}
        for diff in all_numerical_diffs:
            col = diff['column']
            column_counts[col] = column_counts.get(col, 0) + 1
        
        print("Most affected columns:")
        for col, count in sorted(column_counts.items(), key=lambda x: x[1], reverse=True):
            print(f"   - {col}: {count} scenarios")
    
    # Recommendations
    print(f"\n🔧 RECOMMENDATIONS:")
    
    if scenarios_with_differences:
        print("1. Focus on scenarios with differences for detailed debugging")
        print("2. Check position sizing calculations in affected scenarios")
        print("3. Verify portfolio value update logic")
        print("4. Examine date matching and trade execution logic")
    else:
        print("✅ All scenarios show perfect numerical parity!")
        print("The implementations are consistent across all tested scenarios.")
    
    print("\n📝 SUGGESTED NEXT STEPS:")
    print("1. Run with real market data to test in realistic conditions")
    print("2. Test with edge cases (missing data, extreme values)")
    print("3. Add more detailed logging to track calculation steps")
    print("4. Consider adding unit tests for specific calculation functions")

if __name__ == "__main__":
    analyze_parameter_impact()