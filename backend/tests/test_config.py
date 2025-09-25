"""
Backtesting Validation Test Configuration
=====================================

Configuration parameters for the comprehensive backtesting validation test suite.
This file contains all configurable parameters, tolerance levels, and test settings.
"""

import os
from datetime import datetime, timedelta
from typing import Dict, List, Any

# Test Configuration
TEST_CONFIG = {
    'tolerance_levels': {
        'return_tolerance': 0.5,       # 0.5% tolerance for returns
        'win_rate_tolerance': 0.1,     # 0.1% tolerance for win rates
        'position_tolerance': 1.0,     # $1 tolerance for position values
        'drawdown_tolerance': 1.5,     # 1.5% tolerance for drawdown
        'sharpe_tolerance': 0.5,       # 0.5 tolerance for Sharpe ratio
        'profit_factor_tolerance': 0.02, # 2% tolerance for profit factor
        'leverage_tolerance': 0.01,    # 0.01 tolerance for leverage ratios
    },
    'performance_thresholds': {
        'min_acceptable_return': -10.0, # -10% minimum return threshold
        'max_acceptable_drawdown': 25.0, # 25% maximum drawdown threshold
        'min_sharpe_ratio': -1.0,      # -1.0 minimum Sharpe ratio
        'min_profit_factor': 0.5,      # 0.5 minimum profit factor
        'max_leverage_ratio': 5.0,     # 5.0 maximum leverage ratio
    },
    'test_data_parameters': {
        'num_instruments': 10,
        'date_range_days': 252,
        'signal_frequency': 'medium',
        'volatility_levels': ['low', 'medium', 'high'],
        'price_range': {'min': 500, 'max': 3000},
        'volume_range': {'min': 100000, 'max': 2000000},
    },
    'backtesting_parameters': {
        'initial_capital': 100000,
        'holding_periods': [5, 10, 15, 20],
        'stop_losses': [2.0, 5.0, 8.0, 10.0],
        'take_profits': [5.0, 10.0, 15.0, 20.0],
        'position_sizing_methods': [
            'equal_weight',
            'fixed_amount',
            'percent_risk',
            'volatility_target',
            'atr_based',
            'kelly_criterion'
        ],
        'signal_types': ['long', 'short'],
        'leverage_settings': [True, False],
        'trade_restrictions': [True, False],  # one_trade_per_instrument
    },
    'statistical_validation': {
        'confidence_level': 0.95,
        'min_sample_size': 10,
        'max_p_value': 0.05,
        'effect_size_threshold': 0.01,
    }
}

# Test Data Configuration
TEST_DATA_CONFIG = {
    'instruments': [
        'RELIANCE', 'TCS', 'INFY', 'HDFC', 'ICICI',
        'KOTAK', 'AXIS', 'MARUTI', 'BAJAJ-AUTO', 'HINDUNILVR'
    ],
    'date_range': {
        'start_date': '2023-01-01',
        'end_date': '2023-12-31'
    },
    'signal_patterns': {
        'long_signals_per_month': {'min': 2, 'max': 5},
        'short_signals_per_month': {'min': 1, 'max': 3},
        'signal_quality_distribution': {
            'high_probability': 0.4,
            'medium_probability': 0.4,
            'low_probability': 0.2
        }
    },
    'market_conditions': {
        'volatility_scenarios': {
            'low': {'daily_return_std': 0.01, 'trend_strength': 0.3},
            'medium': {'daily_return_std': 0.02, 'trend_strength': 0.5},
            'high': {'daily_return_std': 0.04, 'trend_strength': 0.7}
        },
        'trend_scenarios': ['bullish', 'bearish', 'sideways', 'volatile'],
        'correlation_matrix': {
            'high_correlation_pairs': [('RELIANCE', 'HDFC'), ('TCS', 'INFY')],
            'low_correlation_pairs': [('MARUTI', 'BAJAJ-AUTO'), ('ICICI', 'KOTAK')]
        }
    }
}

# Position Sizing Parameters
POSITION_SIZING_CONFIG = {
    'equal_weight': {
        'portfolio_percentage': 0.02,
        'description': 'Fixed 2% of portfolio per position'
    },
    'fixed_amount': {
        'fixed_amount': 10000,
        'description': 'Fixed $10,000 per trade'
    },
    'percent_risk': {
        'risk_per_trade': 2.0,
        'stop_loss_assumption': 0.05,
        'description': 'Risk 2% of portfolio per trade'
    },
    'volatility_target': {
        'target_volatility': 0.15,
        'volatility_window': 20,
        'description': 'Target 15% portfolio volatility'
    },
    'atr_based': {
        'risk_per_trade': 2.0,
        'atr_window': 14,
        'atr_multiplier': 2.0,
        'description': 'ATR-based position sizing'
    },
    'kelly_criterion': {
        'win_rate': 55,
        'avg_win_pct': 8,
        'avg_loss_pct': -4,
        'kelly_fraction_cap': 0.25,
        'description': 'Kelly criterion optimization'
    }
}

# Test Execution Configuration
EXECUTION_CONFIG = {
    'parallel_execution': {
        'enabled': True,
        'max_workers': min(os.cpu_count() or 4, 4),
        'chunk_size': 10
    },
    'memory_management': {
        'max_memory_usage_mb': 1024,
        'cleanup_interval': 100,
        'enable_garbage_collection': True
    },
    'timing_constraints': {
        'single_backtest_timeout': 300,  # 5 minutes
        'optimization_timeout': 1800,    # 30 minutes
        'test_suite_timeout': 7200       # 2 hours
    },
    'retry_configuration': {
        'max_retries': 3,
        'retry_delay': 1.0,
        'backoff_factor': 2.0,
        'retry_on_exceptions': ['MemoryError', 'TimeoutError']
    }
}

# Reporting Configuration
REPORTING_CONFIG = {
    'output_formats': ['html', 'json', 'xml'],
    'report_sections': [
        'test_summary',
        'detailed_results',
        'performance_metrics',
        'failure_analysis',
        'statistical_validation',
        'execution_timing'
    ],
    'charts_enabled': True,
    'chart_types': [
        'equity_curve',
        'drawdown_analysis',
        'monthly_returns',
        'position_sizing_distribution',
        'leverage_analysis'
    ],
    'alert_thresholds': {
        'critical_failure_rate': 0.05,   # 5% critical failures
        'warning_failure_rate': 0.15,    # 15% warning failures
        'performance_degradation': 0.10   # 10% performance drop
    }
}

# Validation Rules
VALIDATION_RULES = {
    'critical_validations': [
        'total_return_consistency',
        'trade_count_accuracy',
        'portfolio_value_progression'
    ],
    'high_priority_validations': [
        'win_rate_consistency',
        'position_sizing_accuracy',
        'leverage_constraints'
    ],
    'medium_priority_validations': [
        'risk_metrics_consistency',
        'performance_attribution',
        'timing_accuracy'
    ],
    'statistical_tests': [
        't_test_returns',
        'chi_square_win_rate',
        'correlation_analysis',
        'regression_analysis'
    ]
}

# Edge Cases Configuration
EDGE_CASES_CONFIG = {
    'insufficient_capital': {
        'capital_reduction_factor': 0.1,
        'expected_behavior': 'trade_rejection'
    },
    'extreme_volatility': {
        'volatility_multiplier': 3.0,
        'expected_behavior': 'smaller_positions'
    },
    'low_liquidity': {
        'volume_reduction_factor': 0.01,
        'expected_behavior': 'position_limits'
    },
    'market_gaps': {
        'gap_size_multiplier': 2.0,
        'expected_behavior': 'gap_handling'
    },
    'corporate_actions': {
        'split_ratios': [0.5, 2.0],
        'dividend_yields': [0.02, 0.05],
        'expected_behavior': 'price_adjustment'
    }
}

# Test Categories and Their Weights
TEST_CATEGORY_WEIGHTS = {
    'vectorized_consistency': 0.30,
    'leverage_conditions': 0.25,
    'parameter_optimization': 0.25,
    'trade_restrictions': 0.20
}

# Success Criteria
SUCCESS_CRITERIA = {
    'overall_pass_rate': 0.95,           # 95% overall pass rate
    'critical_test_pass_rate': 1.0,      # 100% critical tests pass
    'performance_threshold': 0.90,       # 90% performance consistency
    'statistical_significance': 0.95      # 95% statistical confidence
}

def get_test_config() -> Dict[str, Any]:
    """Get the complete test configuration."""
    return {
        'test_config': TEST_CONFIG,
        'test_data_config': TEST_DATA_CONFIG,
        'position_sizing_config': POSITION_SIZING_CONFIG,
        'execution_config': EXECUTION_CONFIG,
        'reporting_config': REPORTING_CONFIG,
        'validation_rules': VALIDATION_RULES,
        'edge_cases_config': EDGE_CASES_CONFIG,
        'test_category_weights': TEST_CATEGORY_WEIGHTS,
        'success_criteria': SUCCESS_CRITERIA
    }

def get_tolerance_level(metric_name: str) -> float:
    """Get tolerance level for a specific metric."""
    return TEST_CONFIG['tolerance_levels'].get(metric_name, 0.01)

def get_performance_threshold(threshold_name: str) -> float:
    """Get performance threshold for a specific metric."""
    return TEST_CONFIG['performance_thresholds'].get(threshold_name, 0.0)

def validate_config() -> List[str]:
    """Validate the test configuration for consistency."""
    errors = []

    # Validate tolerance levels
    for tolerance_name, tolerance_value in TEST_CONFIG['tolerance_levels'].items():
        if tolerance_value < 0:
            errors.append(f"Negative tolerance level for {tolerance_name}")

    # Validate performance thresholds
    if TEST_CONFIG['performance_thresholds']['max_acceptable_drawdown'] <= 0:
        errors.append("Max acceptable drawdown must be positive")

    # Validate date range
    start_date = TEST_DATA_CONFIG['date_range']['start_date']
    end_date = TEST_DATA_CONFIG['date_range']['end_date']

    try:
        start = datetime.strptime(start_date, '%Y-%m-%d')
        end = datetime.strptime(end_date, '%Y-%m-%d')

        if end <= start:
            errors.append("End date must be after start date")

        days_diff = (end - start).days
        if days_diff < 30:
            errors.append("Date range should be at least 30 days")

    except ValueError:
        errors.append("Invalid date format in test data configuration")

    return errors

if __name__ == "__main__":
    # Validate configuration on import
    config_errors = validate_config()
    if config_errors:
        print("Configuration validation errors:")
        for error in config_errors:
            print(f"  - {error}")
        exit(1)
    else:
        print("✅ Test configuration validated successfully")