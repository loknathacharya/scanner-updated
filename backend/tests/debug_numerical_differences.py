#!/usr/bin/env python3
"""
Debug script to identify exact sources of numerical differences between 
vectorized and non-vectorized backtesting implementations.
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

def create_test_data():
    """Create deterministic test data for debugging"""
    print("Creating test data...")
    
    # Create OHLCV data
    dates = pd.date_range('2023-01-01', periods=100, freq='D')
    ohlcv_data = []
    
    for i, date in enumerate(dates):
        # Create some price movement
        base_price = 100 + i * 0.5
        ohlcv_data.append({
            'Ticker': 'TEST',
            'Date': date,
            'Open': base_price + np.random.normal(0, 0.5),
            'High': base_price + np.random.normal(1, 0.5),
            'Low': base_price + np.random.normal(-1, 0.5),
            'Close': base_price + np.random.normal(0.2, 0.5),
            'Volume': 1000000 + np.random.normal(0, 100000)
        })
    
    ohlcv_df = pd.DataFrame(ohlcv_data)
    
    # Create signals data
    signal_dates = [dates[10], dates[30], dates[50], dates[70]]
    signals_data = []
    
    for date in signal_dates:
        signals_data.append({
            'Ticker': 'TEST',
            'Date': date
        })
    
    signals_df = pd.DataFrame(signals_data)
    
    return ohlcv_df, signals_df

def run_debug_comparison():
    """Run detailed comparison between vectorized and non-vectorized implementations"""
    print("=" * 80)
    print("DEBUG: Numerical Differences Analysis")
    print("=" * 80)
    
    # Create test data
    ohlcv_df, signals_df = create_test_data()
    
    # Test parameters
    test_params = {
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
    
    print(f"Test Parameters: {test_params}")
    print(f"OHLCV Data Shape: {ohlcv_df.shape}")
    print(f"Signals Data Shape: {signals_df.shape}")
    print()
    
    # Run non-vectorized implementation
    print("1. Running NON-VECTORIZED implementation...")
    print("-" * 50)
    try:
        non_vectorized_trades, non_vectorized_warnings = run_backtest(
            ohlcv_df=ohlcv_df,
            signals_df=signals_df,
            **test_params
        )
        print(f"Non-vectorized trades shape: {non_vectorized_trades.shape}")
        print(f"Non-vectorized warnings: {non_vectorized_warnings}")
    except Exception as e:
        print(f"ERROR in non-vectorized implementation: {e}")
        import traceback
        traceback.print_exc()
        return
    
    # Run vectorized implementation
    print("\n2. Running VECTORIZED implementation...")
    print("-" * 50)
    try:
        vectorized_trades, vectorized_warnings = run_vectorized_single_backtest(
            ohlcv_df=ohlcv_df,
            signals_df=signals_df,
            **test_params
        )
        print(f"Vectorized trades shape: {vectorized_trades.shape}")
        print(f"Vectorized warnings: {vectorized_warnings}")
    except Exception as e:
        print(f"ERROR in vectorized implementation: {e}")
        import traceback
        traceback.print_exc()
        return
    
    # Compare results
    print("\n3. COMPARING RESULTS...")
    print("-" * 50)
    
    if non_vectorized_trades.empty and vectorized_trades.empty:
        print("Both implementations returned no trades - this might be expected")
        return
    
    if non_vectorized_trades.empty:
        print("⚠️  Non-vectorized implementation returned no trades, but vectorized did")
        return
    
    if vectorized_trades.empty:
        print("⚠️  Vectorized implementation returned no trades, but non-vectorized did")
        return
    
    # Check if trades have the same number of rows
    if len(non_vectorized_trades) != len(vectorized_trades):
        print(f"❌ TRADE COUNT MISMATCH:")
        print(f"   Non-vectorized: {len(non_vectorized_trades)} trades")
        print(f"   Vectorized: {len(vectorized_trades)} trades")
        print()
    
    # Align trades by index for comparison
    max_trades = max(len(non_vectorized_trades), len(vectorized_trades))
    non_vectorized_trades = non_vectorized_trades.reindex(range(max_trades))
    vectorized_trades = vectorized_trades.reindex(range(max_trades))
    
    # Compare key numerical columns
    numerical_columns = [
        'Entry Price', 'Exit Price', 'Shares', 'Position Value', 
        'P&L ($)', 'Profit/Loss (%)', 'Days Held', 'Portfolio Value'
    ]
    
    print("📊 NUMERICAL COMPARISON (differences > $0.01 or 0.01%):")
    print("-" * 80)
    
    significant_differences = []
    
    for col in numerical_columns:
        if col in non_vectorized_trades.columns and col in vectorized_trades.columns:
            non_vec_values = pd.to_numeric(non_vectorized_trades[col], errors='coerce')
            vec_values = pd.to_numeric(vectorized_trades[col], errors='coerce')
            
            # Calculate differences
            differences = non_vec_values - vec_values
            
            # Find significant differences
            if col in ['P&L ($)', 'Position Value', 'Portfolio Value']:
                # For dollar amounts, use $0.01 threshold
                mask = np.abs(differences) > 0.01
            else:
                # For percentages and ratios, use 0.01% threshold
                mask = np.abs(differences) > 0.0001
            
            significant_diffs = differences[mask]
            
            if not significant_diffs.empty:
                significant_differences.append({
                    'column': col,
                    'differences': significant_diffs,
                    'max_diff': significant_diffs.abs().max(),
                    'mean_diff': significant_diffs.abs().mean()
                })
                print(f"❌ {col}:")
                for idx, diff in significant_diffs.items():
                    non_vec_val = non_vec_values.iloc[idx] if idx < len(non_vec_values) else 'N/A'
                    vec_val = vec_values.iloc[idx] if idx < len(vec_values) else 'N/A'
                    print(f"   Trade {idx}: Non-Vec={non_vec_val:.6f}, Vec={vec_val:.6f}, Diff={diff:.6f}")
            else:
                print(f"✅ {col}: No significant differences")
    
    print()
    
    # Performance metrics comparison
    print("📈 PERFORMANCE METRICS COMPARISON:")
    print("-" * 50)
    
    metric_differences = {}  # Initialize metric_differences
    
    try:
        non_vec_metrics = calculate_performance_metrics(non_vectorized_trades, test_params['initial_capital'])
        vec_metrics = calculate_performance_metrics(vectorized_trades, test_params['initial_capital'])
        
        for key in non_vec_metrics:
            if key in vec_metrics:
                non_vec_val = non_vec_metrics[key]
                vec_val = vec_metrics[key]
                
                # Handle different value types
                if isinstance(non_vec_val, (int, float)) and isinstance(vec_val, (int, float)):
                    diff = abs(non_vec_val - vec_val)
                    if diff > 0.01:  # Significant difference threshold
                        metric_differences[key] = {
                            'non_vectorized': non_vec_val,
                            'vectorized': vec_val,
                            'difference': diff
                        }
                        print(f"❌ {key}: Non-Vec={non_vec_val:.6f}, Vec={vec_val:.6f}, Diff={diff:.6f}")
                    else:
                        print(f"✅ {key}: {non_vec_val:.6f} (within tolerance)")
                else:
                    print(f"ℹ️  {key}: Non-Vec={non_vec_val}, Vec={vec_val}")
        
        if not metric_differences:
            print("✅ All performance metrics are within tolerance")
        
    except Exception as e:
        print(f"Error calculating performance metrics: {e}")
        import traceback
        traceback.print_exc()
    
    # Trade-by-trade analysis
    print("\n🔍 TRADE-BY-TRADE ANALYSIS:")
    print("-" * 50)
    
    for i in range(min(len(non_vectorized_trades), len(vectorized_trades))):
        non_vec_trade = non_vectorized_trades.iloc[i]
        vec_trade = vectorized_trades.iloc[i]
        
        print(f"\nTrade {i + 1}: {non_vec_trade.get('Ticker', 'Unknown')}")
        print(f"  Entry Date: {non_vec_trade.get('Entry Date', 'Unknown')} vs {vec_trade.get('Entry Date', 'Unknown')}")
        
        # Compare key trade attributes
        key_attrs = ['Entry Price', 'Exit Price', 'Shares', 'Position Value', 'P&L ($)']
        trade_diffs = []
        
        for attr in key_attrs:
            if attr in non_vec_trade and attr in vec_trade:
                non_val = pd.to_numeric(non_vec_trade[attr], errors='coerce')
                vec_val = pd.to_numeric(vec_trade[attr], errors='coerce')
                
                if pd.notna(non_val) and pd.notna(vec_val):
                    diff = abs(non_val - vec_val)
                    if diff > 0.01:
                        trade_diffs.append(f"{attr}: {non_val:.6f} vs {vec_val:.6f} (diff: {diff:.6f})")
        
        if trade_diffs:
            print(f"  ❌ DIFFERENCES: {', '.join(trade_diffs)}")
        else:
            print(f"  ✅ No significant differences")
    
    # Summary
    print("\n" + "=" * 80)
    print("DEBUG SUMMARY:")
    print("=" * 80)
    
    if significant_differences:
        print(f"❌ Found {len(significant_differences)} columns with significant numerical differences:")
        for diff in significant_differences:
            print(f"   - {diff['column']}: Max diff={diff['max_diff']:.6f}, Mean diff={diff['mean_diff']:.6f}")
    else:
        print("✅ No significant numerical differences found in trade data")
    
    if 'metric_differences' in locals() and metric_differences:
        print(f"❌ Found {len(metric_differences)} performance metrics with significant differences:")
        for metric, values in metric_differences.items():
            print(f"   - {metric}: Diff={values['difference']:.6f}")
    else:
        print("✅ No significant differences in performance metrics")
    
    print("\n🔧 RECOMMENDATIONS:")
    if significant_differences:
        print("1. Check position sizing calculations in both implementations")
        print("2. Verify portfolio value update logic")
        print("3. Examine date matching and trade execution logic")
        print("4. Review P&L calculation formulas")
    
    print("\n📝 DEBUGGING TIPS:")
    print("- Add more detailed logging to both implementations")
    print("- Check for floating-point precision issues")
    print("- Verify that both implementations use the same data types")
    print("- Ensure consistent handling of edge cases")

if __name__ == "__main__":
    run_debug_comparison()