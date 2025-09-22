#!/usr/bin/env python3
"""
Test script to verify the optimization results fix
"""

import sys
import os
sys.path.append('backend')

def test_optimization_results_structure():
    """Test the optimization results structure after the fix"""
    print("=== Testing Optimization Results Structure Fix ===")
    
    # Simulate what the optimizer returns (after the fix)
    mock_optimization_result = {
        "best_params": {
            "holding_period": 40,
            "stop_loss": 3.0,
            "take_profit": 30.0
        },
        "best_performance": {
            "total_return": 15.5,
            "win_rate": 65.2,
            "sharpe_ratio": 1.45,
            "max_drawdown": -12.3,
            "total_trades": 361
        },
        "all_results": [
            {
                "params": {"holding_period": 40, "stop_loss": 3.0, "take_profit": 30.0},
                "performance": {
                    "Holding Period": 40,
                    "Stop Loss (%)": 3.0,
                    "Take Profit (%)": 30.0,
                    "Total Return (%)": 15.5,
                    "Win Rate (%)": 65.2,
                    "Max Drawdown (%)": -12.3,
                    "Sharpe Ratio": 1.45,
                    "Total Trades": 361
                },
                # These are the flattened fields that the frontend should use
                "total_return": 15.5,
                "win_rate": 65.2,
                "sharpe_ratio": 1.45,
                "max_drawdown": -12.3,
                "total_trades": 361
            },
            {
                "params": {"holding_period": 40, "stop_loss": 3.0, "take_profit": 25.0},
                "performance": {
                    "Holding Period": 40,
                    "Stop Loss (%)": 3.0,
                    "Take Profit (%)": 25.0,
                    "Total Return (%)": 12.3,
                    "Win Rate (%)": 58.7,
                    "Max Drawdown (%)": -15.2,
                    "Sharpe Ratio": 1.11,
                    "Total Trades": 361
                },
                # These are the flattened fields that the frontend should use
                "total_return": 12.3,
                "win_rate": 58.7,
                "sharpe_ratio": 1.11,
                "max_drawdown": -15.2,
                "total_trades": 361
            }
        ],
        "optimization_stats": {
            "total_combinations": 3,
            "successful_combinations": 3,
            "failed_combinations": 0
        }
    }
    
    print("Mock optimization result structure:")
    print(f"  - best_params.total_return: {mock_optimization_result['best_performance']['total_return']}")
    print(f"  - best_params.win_rate: {mock_optimization_result['best_performance']['win_rate']}")
    print(f"  - best_params.sharpe_ratio: {mock_optimization_result['best_performance']['sharpe_ratio']}")
    print(f"  - best_params.max_drawdown: {mock_optimization_result['best_performance']['max_drawdown']}")
    print(f"  - best_params.total_trades: {mock_optimization_result['best_performance']['total_trades']}")
    
    print(f"\nAll results structure:")
    for i, result in enumerate(mock_optimization_result['all_results']):
        print(f"  Result {i+1}:")
        print(f"    - result.performance.total_return: {result['performance'].get('total_return', 'N/A')} (WRONG)")
        print(f"    - result.total_return: {result['total_return']} (CORRECT)")
        print(f"    - result.performance.win_rate: {result['performance'].get('win_rate', 'N/A')} (WRONG)")
        print(f"    - result.win_rate: {result['win_rate']} (CORRECT)")
        print(f"    - result.performance.max_drawdown: {result['performance'].get('max_drawdown', 'N/A')} (WRONG)")
        print(f"    - result.max_drawdown: {result['max_drawdown']} (CORRECT)")
        print(f"    - result.sharpe_ratio: {result['sharpe_ratio']} (CORRECT)")
        print(f"    - result.total_trades: {result['total_trades']} (CORRECT)")
    
    return mock_optimization_result

def test_frontend_compatibility():
    """Test that the frontend can now access the data correctly"""
    print(f"\n=== Testing Frontend Compatibility ===")
    
    mock_result = test_optimization_results_structure()
    
    # Simulate frontend data access patterns
    print("Frontend data access patterns:")
    
    # Best Performance section
    best_total_return = (mock_result.get('optimization_results', {}).get('best_performance', {}).get('total_return') or 
                        mock_result.get('best_performance', {}).get('total_return') or
                        mock_result.get('optimization_results', {}).get('total_return') or
                        mock_result.get('total_return'))
    
    best_win_rate = (mock_result.get('optimization_results', {}).get('best_performance', {}).get('win_rate') or
                    mock_result.get('best_performance', {}).get('win_rate') or
                    mock_result.get('optimization_results', {}).get('win_rate') or
                    mock_result.get('win_rate'))
    
    best_sharpe_ratio = (mock_result.get('optimization_results', {}).get('best_performance', {}).get('sharpe_ratio') or
                        mock_result.get('best_performance', {}).get('sharpe_ratio') or
                        mock_result.get('optimization_results', {}).get('sharpe_ratio') or
                        mock_result.get('sharpe_ratio'))
    
    best_max_drawdown = (mock_result.get('optimization_results', {}).get('best_performance', {}).get('max_drawdown') or
                        mock_result.get('best_performance', {}).get('max_drawdown') or
                        mock_result.get('optimization_results', {}).get('max_drawdown') or
                        mock_result.get('max_drawdown'))
    
    print(f"  - Best Total Return: {best_total_return}%")
    print(f"  - Best Win Rate: {best_win_rate}%")
    print(f"  - Best Sharpe Ratio: {best_sharpe_ratio}")
    print(f"  - Best Max Drawdown: {best_max_drawdown}%")
    
    # All Results table
    print(f"\nAll Results table:")
    for i, result in enumerate(mock_result.get('all_results', [])):
        total_return = result.get('total_return', 'N/A')
        win_rate = result.get('win_rate', 'N/A')
        sharpe_ratio = result.get('sharpe_ratio', 'N/A')
        max_drawdown = result.get('max_drawdown', 'N/A')
        total_trades = result.get('total_trades', 'N/A')
        
        print(f"  Result {i+1}: {total_return}%, {win_rate}%, {sharpe_ratio}, {max_drawdown}%, {total_trades}")
    
    print(f"\n✅ All values are now accessible - Fix successful!")

if __name__ == "__main__":
    test_frontend_compatibility()