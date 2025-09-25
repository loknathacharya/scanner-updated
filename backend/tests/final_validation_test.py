#!/usr/bin/env python3
"""
Final Comprehensive Validation Test Suite
Executes all validation tests and provides comprehensive reporting
"""

import sys
import os
import json
import time
import logging
from datetime import datetime
from typing import Dict, List, Any, Optional

# Add the backend directory to the path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import test modules
from test_comprehensive_validation import TestComprehensiveValidation
from test_enhanced_fixtures import EnhancedTestDataGenerator
from test_config import get_test_config, get_tolerance_level

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('final_validation_test.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class FinalValidationTestSuite:
    """Final comprehensive validation test suite"""
    
    def __init__(self):
        self.test_results = {}
        self.execution_summary = {}
        self.start_time = None
        self.end_time = None
        
    def run_complete_validation(self) -> Dict[str, Any]:
        """Run complete validation suite"""
        logger.info("🚀 Starting Final Comprehensive Validation Test Suite...")
        
        self.start_time = time.time()
        
        try:
            # Initialize components
            test_suite = TestComprehensiveValidation()
            data_generator = EnhancedTestDataGenerator(seed=42)
            config = get_test_config()
            tolerance = get_tolerance_level('return_tolerance')
            
            logger.info("📊 Generating test data...")
            test_data = data_generator.generate_comprehensive_test_dataset()
            logger.info(f"✅ Generated {len(test_data['ohlcv'])} OHLCV records")
            logger.info(f"✅ Generated {len(test_data['signals'])} signal records")
            
            # Run all test categories
            self.test_results = {
                'numerical_parity': self.run_numerical_parity_tests(test_suite),
                'leverage_correctness': self.run_leverage_correctness_tests(test_suite),
                'optimizer_parity': self.run_optimizer_parity_tests(test_suite),
                'trade_concurrency': self.run_trade_concurrency_tests(test_suite),
                'stability': self.run_stability_tests(test_suite)
            }
            
            # Generate execution summary
            self.execution_summary = self.generate_execution_summary(config, tolerance)
            
        except Exception as e:
            logger.error(f"❌ Error during validation: {e}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            self.execution_summary['error'] = str(e)
            self.execution_summary['status'] = 'FAILED'
        
        self.end_time = time.time()
        self.execution_summary['execution_time'] = self.end_time - self.start_time
        self.execution_summary['timestamp'] = datetime.now().isoformat()
        
        # Save results
        self.save_results()
        
        # Generate final report
        self.generate_final_report()
        
        return self.test_results
    
    def run_numerical_parity_tests(self, test_suite: TestComprehensiveValidation) -> Dict[str, Any]:
        """Run numerical parity tests"""
        logger.info("🔢 Running numerical parity tests...")
        
        results = {}
        
        try:
            results['single_backtest_consistency'] = test_suite.numerical_parity.test_single_backtest_consistency()
            logger.info("✅ Single backtest consistency test completed")
        except Exception as e:
            logger.error(f"❌ Single backtest consistency test failed: {e}")
            results['single_backtest_consistency'] = {'error': str(e)}
        
        try:
            results['position_sizing_consistency'] = test_suite.numerical_parity.test_position_sizing_consistency()
            logger.info("✅ Position sizing consistency test completed")
        except Exception as e:
            logger.error(f"❌ Position sizing consistency test failed: {e}")
            results['position_sizing_consistency'] = {'error': str(e)}
        
        try:
            results['signal_type_consistency'] = test_suite.numerical_parity.test_signal_type_consistency()
            logger.info("✅ Signal type consistency test completed")
        except Exception as e:
            logger.error(f"❌ Signal type consistency test failed: {e}")
            results['signal_type_consistency'] = {'error': str(e)}
        
        return results
    
    def run_leverage_correctness_tests(self, test_suite: TestComprehensiveValidation) -> Dict[str, Any]:
        """Run leverage correctness tests"""
        logger.info("⚖️ Running leverage correctness tests...")
        
        results = {}
        
        try:
            results['leverage_constraints'] = test_suite.leverage_correctness.test_leverage_constraints()
            logger.info("✅ Leverage constraints test completed")
        except Exception as e:
            logger.error(f"❌ Leverage constraints test failed: {e}")
            results['leverage_constraints'] = {'error': str(e)}
        
        try:
            results['margin_calculations'] = test_suite.leverage_correctness.test_margin_calculations()
            logger.info("✅ Margin calculations test completed")
        except Exception as e:
            logger.error(f"❌ Margin calculations test failed: {e}")
            results['margin_calculations'] = {'error': str(e)}
        
        return results
    
    def run_optimizer_parity_tests(self, test_suite: TestComprehensiveValidation) -> Dict[str, Any]:
        """Run optimizer parity tests"""
        logger.info("🎯 Running optimizer parity tests...")
        
        results = {}
        
        try:
            results['parameter_optimization_consistency'] = test_suite.optimizer_parity.test_parameter_optimization_consistency()
            logger.info("✅ Parameter optimization consistency test completed")
        except Exception as e:
            logger.error(f"❌ Parameter optimization consistency test failed: {e}")
            results['parameter_optimization_consistency'] = {'error': str(e)}
        
        return results
    
    def run_trade_concurrency_tests(self, test_suite: TestComprehensiveValidation) -> Dict[str, Any]:
        """Run trade concurrency tests"""
        logger.info("🔄 Running trade concurrency tests...")
        
        results = {}
        
        try:
            results['single_trade_per_instrument'] = test_suite.trade_concurrency.test_single_trade_per_instrument()
            logger.info("✅ Single trade per instrument test completed")
        except Exception as e:
            logger.error(f"❌ Single trade per instrument test failed: {e}")
            results['single_trade_per_instrument'] = {'error': str(e)}
        
        try:
            results['multiple_trades_per_instrument'] = test_suite.trade_concurrency.test_multiple_trades_per_instrument()
            logger.info("✅ Multiple trades per instrument test completed")
        except Exception as e:
            logger.error(f"❌ Multiple trades per instrument test failed: {e}")
            results['multiple_trades_per_instrument'] = {'error': str(e)}
        
        return results
    
    def run_stability_tests(self, test_suite: TestComprehensiveValidation) -> Dict[str, Any]:
        """Run stability tests"""
        logger.info("🔒 Running stability tests...")
        
        results = {}
        
        try:
            results['deterministic_results'] = test_suite.stability.test_deterministic_results()
            logger.info("DETERMINISTIC RESULTS TEST COMPLETED")
        except Exception as e:
            logger.error(f"DETERMINISTIC RESULTS TEST FAILED: {e}")
            results['deterministic_results'] = {'error': str(e)}
        
        try:
            results['floating_point_tolerance'] = test_suite.stability.test_floating_point_tolerance()
            logger.info("FLOATING POINT TOLERANCE TEST COMPLETED")
        except Exception as e:
            logger.error(f"FLOATING POINT TOLERANCE TEST FAILED: {e}")
            results['floating_point_tolerance'] = {'error': str(e)}
        
        return results
    
    def generate_execution_summary(self, config: Dict[str, Any], tolerance: float) -> Dict[str, Any]:
        """Generate execution summary"""
        summary = {
            'status': 'COMPLETED',
            'timestamp': datetime.now().isoformat(),
            'config': config,
            'tolerance': tolerance,
            'test_categories': {},
            'overall_results': {
                'total_tests': 0,
                'passed_tests': 0,
                'failed_tests': 0,
                'success_rate': 0.0
            }
        }
        
        # Analyze results by category
        for category, tests in self.test_results.items():
            if category == 'error':
                continue
                
            category_summary = {
                'total_tests': 0,
                'passed_tests': 0,
                'failed_tests': 0,
                'success_rate': 0.0,
                'test_details': {}
            }
            
            for test_name, test_results in tests.items():
                if isinstance(test_results, dict) and 'error' not in test_results:
                    category_summary['total_tests'] += len(test_results)
                    passed = sum(1 for v in test_results.values() if v)
                    failed = len(test_results) - passed
                    
                    category_summary['passed_tests'] += passed
                    category_summary['failed_tests'] += failed
                    category_summary['test_details'][test_name] = {
                        'total': len(test_results),
                        'passed': passed,
                        'failed': failed,
                        'success_rate': (passed / len(test_results)) * 100 if test_results else 0
                    }
                else:
                    # Handle test errors
                    category_summary['total_tests'] += 1
                    category_summary['failed_tests'] += 1
                    category_summary['test_details'][test_name] = {
                        'total': 1,
                        'passed': 0,
                        'failed': 1,
                        'success_rate': 0,
                        'error': test_results.get('error', 'Unknown error')
                    }
            
            category_summary['success_rate'] = (
                (category_summary['passed_tests'] / category_summary['total_tests']) * 100
                if category_summary['total_tests'] > 0 else 0
            )
            
            summary['test_categories'][category] = category_summary
            
            # Update overall results
            summary['overall_results']['total_tests'] += category_summary['total_tests']
            summary['overall_results']['passed_tests'] += category_summary['passed_tests']
            summary['overall_results']['failed_tests'] += category_summary['failed_tests']
        
        # Calculate overall success rate
        if summary['overall_results']['total_tests'] > 0:
            summary['overall_results']['success_rate'] = (
                (summary['overall_results']['passed_tests'] / summary['overall_results']['total_tests']) * 100
            )
        
        return summary
    
    def save_results(self):
        """Save comprehensive results"""
        # Save JSON results
        results_data = {
            'execution_summary': self.execution_summary,
            'detailed_results': self.test_results,
            'timestamp': datetime.now().isoformat()
        }
        
        with open('final_validation_results.json', 'w') as f:
            json.dump(results_data, f, indent=2, default=str)
        
        logger.info("FINAL VALIDATION RESULTS SAVED TO: final_validation_results.json")
    
    def generate_final_report(self):
        """Generate final comprehensive report"""
        report = f"""
{'='*100}
FINAL COMPREHENSIVE VALIDATION TEST REPORT
{'='*100}
Execution Time: {self.execution_summary.get('timestamp', 'N/A')}
Duration: {self.execution_summary.get('execution_time', 0):.2f} seconds
Tolerance: {self.execution_summary.get('tolerance', 'N/A')}
Configuration: {self.execution_summary.get('config', 'N/A')}
{'='*100}

"""
        
        # Overall summary
        overall = self.execution_summary.get('overall_results', {})
        report += f"OVERALL SUMMARY\n"
        report += f"{'='*50}\n"
        report += f"Status: {self.execution_summary.get('status', 'N/A')}\n"
        report += f"Total Test Cases: {overall.get('total_tests', 0)}\n"
        report += f"PASSED: {overall.get('passed_tests', 0)}\n"
        report += f"FAILED: {overall.get('failed_tests', 0)}\n"
        report += f"Success Rate: {overall.get('success_rate', 0):.1f}%\n"
        report += f"\n"
        
        # Category breakdown
        report += f"CATEGORY BREAKDOWN\n"
        report += f"{'='*50}\n"
        
        for category, category_data in self.execution_summary.get('test_categories', {}).items():
            report += f"\n{category.upper().replace('_', ' ')}\n"
            report += f"  Total Tests: {category_data['total_tests']}\n"
            report += f"  Passed: {category_data['passed_tests']}\n"
            report += f"  Failed: {category_data['failed_tests']}\n"
            report += f"  Success Rate: {category_data['success_rate']:.1f}%\n"
            
            # Test details
            for test_name, test_data in category_data.get('test_details', {}).items():
                if 'error' in test_data:
                    report += f"  FAILED {test_name}: ERROR - {test_data['error']}\n"
                else:
                    status = "PASSED" if test_data['success_rate'] == 100 else "PARTIAL"
                    report += f"  {status} {test_name}: {test_data['passed']}/{test_data['total']} ({test_data['success_rate']:.1f}%)\n"
        
        report += f"\n{'='*100}\n"
        
        # Success/failure assessment
        if overall.get('failed_tests', 0) > 0:
            report += f"VALIDATION STATUS: PARTIAL SUCCESS\n"
            report += f"   Some tests failed. Please review the detailed results above.\n"
        else:
            report += f"VALIDATION STATUS: FULL SUCCESS\n"
            report += f"   All tests passed! The backtesting engine is working correctly.\n"
        
        report += f"{'='*100}\n"
        
        # Save report
        with open('final_validation_report.txt', 'w') as f:
            f.write(report)
        
        logger.info("FINAL VALIDATION REPORT SAVED TO: final_validation_report.txt")
        
        # Print summary
        print(report)
        
        # Return exit code
        if overall.get('failed_tests', 0) > 0:
            logger.error("SOME TESTS FAILED!")
            return 1
        else:
            logger.info("ALL TESTS PASSED!")
            return 0

def main():
    """Main entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Final Comprehensive Validation Test Suite')
    parser.add_argument('--verbose', '-v', action='store_true', 
                       help='Enable verbose logging')
    
    args = parser.parse_args()
    
    # Configure logging level
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    # Initialize test suite
    test_suite = FinalValidationTestSuite()
    
    # Run complete validation
    results = test_suite.run_complete_validation()
    
    # Generate final report and get exit code
    exit_code = test_suite.generate_final_report()
    
    exit(exit_code)

if __name__ == "__main__":
    main()