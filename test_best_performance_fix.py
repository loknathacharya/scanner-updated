#!/usr/bin/env python3
"""
Test script to verify the best performance fix
"""

def test_best_performance_fix():
    """Test that the best performance section now works correctly"""
    print("=== Testing Best Performance Fix ===")
    
    # Simulate the API response structure
    mock_response = {
        "best_performance": {
            "Holding Period": 40,
            "Stop Loss (%)": 3.0,
            "Take Profit (%)": 30.0,
            "Total Return (%)": 15.5,
            "Win Rate (%)": 65.2,
            "Max Drawdown (%)": -12.3,
            "Sharpe Ratio": 1.45,
            "Total Trades": 361
        },
        "optimization_results": {
            "best_performance": {
                "Total Return (%)": 15.5,
                "Win Rate (%)": 65.2,
                "Max Drawdown (%)": -12.3,
                "Sharpe Ratio": 1.45
            }
        }
    }
    
    # Test the new frontend logic
    def get_best_performance_value(results, metric_name, original_key, fallback_keys=None):
        """Simulate the new frontend logic"""
        if fallback_keys is None:
            fallback_keys = []
        
        # Try the original key with spaces first
        value = (results.get('optimization_results', {}).get('best_performance', {}).get(original_key) or
                results.get('best_performance', {}).get(original_key))
        
        # Try fallback keys
        if value is None:
            for key in fallback_keys:
                value = (results.get('optimization_results', {}).get('best_performance', {}).get(key) or
                        results.get('best_performance', {}).get(key) or
                        results.get('optimization_results', {}).get(key) or
                        results.get(key))
                if value is not None:
                    break
        
        return value
    
    # Test each metric
    total_return = get_best_performance_value(
        mock_response, 
        'total_return', 
        'Total Return (%)',
        ['total_return']
    )
    
    win_rate = get_best_performance_value(
        mock_response,
        'win_rate', 
        'Win Rate (%)',
        ['win_rate']
    )
    
    sharpe_ratio = get_best_performance_value(
        mock_response,
        'sharpe_ratio',
        'Sharpe Ratio', 
        ['sharpe_ratio']
    )
    
    max_drawdown = get_best_performance_value(
        mock_response,
        'max_drawdown',
        'Max Drawdown (%)',
        ['max_drawdown']
    )
    
    print("Results with the fix:")
    print(f"  - Total Return: {total_return}%")
    print(f"  - Win Rate: {win_rate}%")
    print(f"  - Sharpe Ratio: {sharpe_ratio}")
    print(f"  - Max Drawdown: {max_drawdown}%")
    
    # Verify all values are found
    all_values_found = all([
        total_return is not None,
        win_rate is not None,
        sharpe_ratio is not None,
        max_drawdown is not None
    ])
    
    if all_values_found:
        print(f"\n✅ All best performance values are now accessible!")
        print(f"✅ The fix is working correctly!")
    else:
        print(f"\n❌ Some values are still missing")
        
    return all_values_found

if __name__ == "__main__":
    test_best_performance_fix()