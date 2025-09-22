#!/usr/bin/env python3
"""
Debug script to check the best performance data structure
"""

import sys
import os
sys.path.append('backend')

def simulate_api_response():
    """Simulate what the actual API returns for optimization results"""
    print("=== Simulating API Response Structure ===")
    
    # This is what the API actually returns based on the backtest_optimizer.py code
    api_response = {
        "best_params": {
            "holding_period": 40,
            "stop_loss": 3.0,
            "take_profit": 30.0
        },
        "best_performance": {
            # This is the original performance object from run_single_parameter_combo
            "Holding Period": 40,
            "Stop Loss (%)": 3.0,
            "Take Profit (%)": 30.0,
            "Total Return (%)": 15.5,
            "Total P&L ($)": 15500.0,
            "Win Rate (%)": 65.2,
            "Max Drawdown (%)": -12.3,
            "Sharpe Ratio": 1.45,
            "Total Trades": 361,
            "trades": [],
            "performance_metrics": {},
            "summary": {}
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
                # These are the flattened fields that the optimizer creates
                "total_return": 15.5,
                "win_rate": 65.2,
                "sharpe_ratio": 1.45,
                "max_drawdown": -12.3,
                "total_trades": 361
            }
        ],
        "execution_time": 2.45,
        "signals_processed": 100,
        "optimization_stats": {
            "total_combinations": 3,
            "successful_combinations": 3,
            "failed_combinations": 0
        }
    }
    
    print("API Response Structure:")
    print(f"  best_performance keys: {list(api_response['best_performance'].keys())}")
    print(f"  best_performance.total_return: {api_response['best_performance'].get('total_return', 'N/A')}")
    print(f"  best_performance['Total Return (%)']: {api_response['best_performance'].get('Total Return (%)', 'N/A')}")
    
    print(f"\nall_results[0] structure:")
    print(f"  result.performance.total_return: {api_response['all_results'][0]['performance'].get('total_return', 'N/A')}")
    print(f"  result.total_return: {api_response['all_results'][0]['total_return']}")
    
    return api_response

def test_frontend_best_performance_access():
    """Test how the frontend accesses best performance data"""
    print(f"\n=== Testing Frontend Best Performance Access ===")
    
    api_response = simulate_api_response()
    
    # Current frontend logic for best performance
    best_total_return = (api_response.get('optimization_results', {}).get('best_performance', {}).get('total_return') or 
                        api_response.get('best_performance', {}).get('total_return') or
                        api_response.get('optimization_results', {}).get('total_return') or
                        api_response.get('total_return'))
    
    best_win_rate = (api_response.get('optimization_results', {}).get('best_performance', {}).get('win_rate') or
                    api_response.get('best_performance', {}).get('win_rate') or
                    api_response.get('optimization_results', {}).get('win_rate') or
                    api_response.get('win_rate'))
    
    best_sharpe_ratio = (api_response.get('optimization_results', {}).get('best_performance', {}).get('sharpe_ratio') or
                        api_response.get('best_performance', {}).get('sharpe_ratio') or
                        api_response.get('optimization_results', {}).get('sharpe_ratio') or
                        api_response.get('sharpe_ratio'))
    
    best_max_drawdown = (api_response.get('optimization_results', {}).get('best_performance', {}).get('max_drawdown') or
                        api_response.get('best_performance', {}).get('max_drawdown') or
                        api_response.get('optimization_results', {}).get('max_drawdown') or
                        api_response.get('max_drawdown'))
    
    print(f"Current frontend logic results:")
    print(f"  - best_total_return: {best_total_return}")
    print(f"  - best_win_rate: {best_win_rate}")
    print(f"  - best_sharpe_ratio: {best_sharpe_ratio}")
    print(f"  - best_max_drawdown: {best_max_drawdown}")
    
    # The correct way to access best performance data
    print(f"\nCorrect access patterns:")
    print(f"  - best_performance['Total Return (%)']: {api_response['best_performance'].get('Total Return (%)')}")
    print(f"  - best_performance['Win Rate (%)']: {api_response['best_performance'].get('Win Rate (%)')}")
    print(f"  - best_performance['Sharpe Ratio']: {api_response['best_performance'].get('Sharpe Ratio')}")
    print(f"  - best_performance['Max Drawdown (%)']: {api_response['best_performance'].get('Max Drawdown (%)')}")
    
    # Alternative: extract from all_results[0] since it contains the flattened fields
    if api_response['all_results']:
        first_result = api_response['all_results'][0]
        print(f"\nAlternative: Extract from all_results[0]:")
        print(f"  - total_return: {first_result.get('total_return')}")
        print(f"  - win_rate: {first_result.get('win_rate')}")
        print(f"  - sharpe_ratio: {first_result.get('sharpe_ratio')}")
        print(f"  - max_drawdown: {first_result.get('max_drawdown')}")

if __name__ == "__main__":
    test_frontend_best_performance_access()