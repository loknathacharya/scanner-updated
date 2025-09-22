#!/usr/bin/env python3
"""
Debug script to test the optimization key mismatch issue
"""

import sys
import os
sys.path.append('backend')

# Mock the run_single_parameter_combo function to return what it actually returns
def mock_run_single_parameter_combo(args):
    """Mock function that returns what the actual run_single_parameter_combo returns"""
    return {
        'Holding Period': 40,
        'Stop Loss (%)': 3.0,
        'Take Profit (%)': 30.0,
        'Total Return (%)': 15.5,
        'Total P&L ($)': 15500.0,
        'Win Rate (%)': 65.2,
        'Max Drawdown (%)': -12.3,
        'Sharpe Ratio': 1.45,
        'Total Trades': 361,
        'trades': [],
        'performance_metrics': {},
        'summary': {}
    }

# Test the optimizer logic
def test_optimizer_logic():
    """Test the optimizer's key extraction logic"""
    print("=== Testing Optimizer Key Extraction Logic ===")
    
    # Mock result from run_single_parameter_combo
    result = mock_run_single_parameter_combo(None)
    
    print("Original result keys:")
    for key in result.keys():
        print(f"  - '{key}'")
    
    # Test the optimizer's extraction logic
    total_return = (
        result.get("Total Return (%)")
        if result.get("Total Return (%)") is not None
        else result.get("total_return", 0)
    )
    
    win_rate = (
        result.get("Win Rate (%)")
        if result.get("Win Rate (%)") is not None
        else result.get("win_rate", 0)
    )
    
    max_drawdown = (
        result.get("Max Drawdown (%)")
        if result.get("Max Drawdown (%)") is not None
        else result.get("max_drawdown", 0)
    )
    
    sharpe_ratio = (
        result.get("Sharpe Ratio")
        if result.get("Sharpe Ratio") is not None
        else result.get("sharpe_ratio", 0)
    )
    
    total_trades = (
        result.get("Total Trades")
        if result.get("Total Trades") is not None
        else result.get("total_trades", 0)
    )
    
    print(f"\nExtracted values:")
    print(f"  - Total Return: {total_return}")
    print(f"  - Win Rate: {win_rate}")
    print(f"  - Max Drawdown: {max_drawdown}")
    print(f"  - Sharpe Ratio: {sharpe_ratio}")
    print(f"  - Total Trades: {total_trades}")
    
    # Test the frontend expectation
    print(f"\nFrontend expectation:")
    print(f"  - result.performance.total_return: {result.get('total_return', 'N/A')}")
    print(f"  - result.performance.win_rate: {result.get('win_rate', 'N/A')}")
    print(f"  - result.performance.max_drawdown: {result.get('max_drawdown', 'N/A')}")
    print(f"  - result.performance.sharpe_ratio: {result.get('sharpe_ratio', 'N/A')}")
    print(f"  - result.performance.total_trades: {result.get('total_trades', 'N/A')}")
    
    # Simulate the optimizer's all_results structure
    all_result = {
        "params": {"holding_period": 40, "stop_loss": 3.0, "take_profit": 30.0},
        "performance": result,  # This is the problem - contains original keys
        "total_return": total_return,
        "total_trades": total_trades,
        "sharpe_ratio": sharpe_ratio,
        "max_drawdown": max_drawdown,
        "win_rate": win_rate,
    }
    
    print(f"\nSimulated all_results structure:")
    print(f"  - result.performance.total_return: {all_result['performance'].get('total_return', 'N/A')}")
    print(f"  - result.performance.win_rate: {all_result['performance'].get('win_rate', 'N/A')}")
    print(f"  - result.performance.max_drawdown: {all_result['performance'].get('max_drawdown', 'N/A')}")
    print(f"  - result.performance.sharpe_ratio: {all_result['performance'].get('sharpe_ratio', 'N/A')}")
    print(f"  - result.performance.total_trades: {all_result['performance'].get('total_trades', 'N/A')}")
    
    print(f"\nBut the optimizer also provides flattened values:")
    print(f"  - result.total_return: {all_result['total_return']}")
    print(f"  - result.win_rate: {all_result['win_rate']}")
    print(f"  - result.max_drawdown: {all_result['max_drawdown']}")
    print(f"  - result.sharpe_ratio: {all_result['sharpe_ratio']}")
    print(f"  - result.total_trades: {all_result['total_trades']}")
    
    return all_result

if __name__ == "__main__":
    test_optimizer_logic()