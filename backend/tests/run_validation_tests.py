#!/usr/bin/env python3
"""
Comprehensive Validation Test Execution Script
Runs all validation tests and generates detailed reports
"""

import sys
import os
import json
import time
import argparse
import logging
from datetime import datetime
from typing import Dict, List, Any, Optional

# Add the backend directory to the path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from test_validation_runner import ValidationTestRunner
from test_comprehensive_validation import TestComprehensiveValidation
from test_enhanced_fixtures import EnhancedTestDataGenerator
from test_config import get_test_config, get_tolerance_level

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('validation_test_execution.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class ValidationTestExecutor:
    """Main test executor with comprehensive reporting"""
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or get_test_config()
        self.tolerance = get_tolerance_level('return_tolerance')
        self.runner = ValidationTestRunner(config)
        self.data_generator = EnhancedTestDataGenerator(seed=42)
        self.results = {}
        self.execution_summary = {}
        
    def run_complete_validation(self) -> Dict[str, Any]:
        """Run complete validation suite with comprehensive reporting"""
        logger.info("🚀 Starting complete validation suite...")
        
        start_time = time.time()
        
        try:
            # Generate test data
            logger.info("📊 Generating test data...")
            test_data = self.data_generator.generate_comprehensive_test_dataset()
            logger.info(f"✅ Generated {len(test_data['ohlcv'])} OHLCV records")
            logger.info(f"✅ Generated {len(test_data['signals'])} signal records")
            
            # Run all tests
            self.results = self.runner.run_all_tests()
            
            # Generate execution summary
            self.execution_summary = self.generate_execution_summary()
            
        except Exception as e:
            logger.error(f"❌ Error during validation: {e}")
            self.execution_summary['error'] = str(e)
            self.execution_summary['status'] = 'FAILED'
        
        end_time = time.time()
        self.execution_summary['execution_time'] = end_time - start_time
        self.execution_summary['timestamp'] = datetime.now().isoformat()
        
        # Save comprehensive results
        self.save_comprehensive_results()
        
        # Generate final report
        self.generate_final_report()
        
        return self.results
    
    def run_targeted_validation(self, test_categories: List[str]) -> Dict[str, Any]:
        """Run targeted validation for specific categories"""
        logger.info(f"🎯 Running targeted validation for: {test_categories}")
        
        start_time = time.time()
        
        try:
            # Generate test data
            test_data = self.data_generator.generate_comprehensive_test_dataset()
            
            # Run specific test categories
            targeted_results = {}
            
            for category in test_categories:
                if category == 'numerical_parity':
                    targeted_results[category] = self.run_numerical_parity_tests()
                elif category == 'leverage_correctness':
                    targeted_results[category] = self.run_leverage_correctness_tests()
                elif category == 'optimizer_parity':
                    targeted_results[category] = self.run_optimizer_parity_tests()
                elif category == 'trade_concurrency':
                    targeted_results[category] = self.run_trade_concurrency_tests()
                elif category == 'stability':
                    targeted_results[category] = self.run_stability_tests()
                else:
                    logger.warning(f"Unknown test category: {category}")
            
            self.results = targeted_results
            
        except Exception as e:
            logger.error(f"❌ Error during targeted validation: {e}")
            self.execution_summary['error'] = str(e)
            self.execution_summary['status'] = 'FAILED'
        
        end_time = time.time()
        self.execution_summary['execution_time'] = end_time - start_time
        self.execution_summary['timestamp'] = datetime.now().isoformat()
        self.execution_summary['targeted_categories'] = test_categories
        
        # Save results
        self.save_targeted_results(test_categories)
        
        return self.results
    
    def run_numerical_parity_tests(self) -> Dict[str, Any]:
        """Run numerical parity tests"""
        logger.info("🔢 Running numerical parity tests...")
        
        test_suite = TestComprehensiveValidation()
        
        results = {
            'single_backtest_consistency': test_suite.numerical_parity.test_single_backtest_consistency(),
            'position_sizing_consistency': test_suite.numerical_parity.test_position_sizing_consistency(),
            'signal_type_consistency': test_suite.numerical_parity.test_signal_type_consistency()
        }
        
        return results
    
    def run_leverage_correctness_tests(self) -> Dict[str, Any]:
        """Run leverage correctness tests"""
        logger.info("⚖️ Running leverage correctness tests...")
        
        test_suite = TestComprehensiveValidation()
        
        results = {
            'leverage_constraints': test_suite.leverage_correctness.test_leverage_constraints(),
            'margin_calculations': test_suite.leverage_correctness.test_margin_calculations()
        }
        
        return results
    
    def run_optimizer_parity_tests(self) -> Dict[str, Any]:
        """Run optimizer parity tests"""
        logger.info("🎯 Running optimizer parity tests...")
        
        test_suite = TestComprehensiveValidation()
        
        results = {
            'parameter_optimization_consistency': test_suite.optimizer_parity.test_parameter_optimization_consistency()
        }
        
        return results
    
    def run_trade_concurrency_tests(self) -> Dict[str, Any]:
        """Run trade concurrency tests"""
        logger.info("🔄 Running trade concurrency tests...")
        
        test_suite = TestComprehensiveValidation()
        
        results = {
            'single_trade_per_instrument': test_suite.trade_concurrency.test_single_trade_per_instrument(),
            'multiple_trades_per_instrument': test_suite.trade_concurrency.test_multiple_trades_per_instrument()
        }
        
        return results
    
    def run_stability_tests(self) -> Dict[str, Any]:
        """Run stability tests"""
        logger.info("🔒 Running stability tests...")
        
        test_suite = TestComprehensiveValidation()
        
        results = {
            'deterministic_results': test_suite.stability.test_deterministic_results(),
            'floating_point_tolerance': test_suite.stability.test_floating_point_tolerance()
        }
        
        return results
    
    def generate_execution_summary(self) -> Dict[str, Any]:
        """Generate execution summary"""
        summary = {
            'status': 'COMPLETED',
            'timestamp': datetime.now().isoformat(),
            'config': self.config,
            'tolerance': self.tolerance,
            'test_categories': {},
            'overall_results': {
                'total_tests': 0,
                'passed_tests': 0,
                'failed_tests': 0,
                'success_rate': 0.0
            }
        }
        
        # Analyze results by category
        for category, tests in self.results.items():
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
    
    def save_comprehensive_results(self):
        """Save comprehensive results"""
        # Save JSON results
        results_data = {
            'execution_summary': self.execution_summary,
            'detailed_results': self.results,
            'config': self.config,
            'tolerance': self.tolerance
        }
        
        with open('backend/tests/comprehensive_validation_results.json', 'w') as f:
            json.dump(results_data, f, indent=2, default=str)
        
        logger.info("📁 Comprehensive results saved to: backend/tests/comprehensive_validation_results.json")
    
    def save_targeted_results(self, test_categories: List[str]):
        """Save targeted test results"""
        results_data = {
            'execution_summary': self.execution_summary,
            'detailed_results': self.results,
            'config': self.config,
            'tolerance': self.tolerance,
            'targeted_categories': test_categories
        }
        
        filename = f"backend/tests/targeted_validation_results_{'_'.join(test_categories)}.json"
        with open(filename, 'w') as f:
            json.dump(results_data, f, indent=2, default=str)
        
        logger.info(f"📁 Targeted results saved to: {filename}")
    
    def generate_final_report(self):
        """Generate final report"""
        report = f"""
{'='*80}
📊 COMPREHENSIVE VALIDATION TEST EXECUTION REPORT
{'='*80}
📅 Execution Time: {self.execution_summary.get('timestamp', 'N/A')}
⏱️  Duration: {self.execution_summary.get('execution_time', 0):.2f} seconds
🎯 Tolerance: {self.tolerance}
📋 Configuration: {self.config}
{'='*80}

"""
        
        # Overall summary
        overall = self.execution_summary.get('overall_results', {})
        report += f"📈 OVERALL SUMMARY\n"
        report += f"{'='*40}\n"
        report += f"Status: {self.execution_summary.get('status', 'N/A')}\n"
        report += f"Total Test Cases: {overall.get('total_tests', 0)}\n"
        report += f"✅ Passed: {overall.get('passed_tests', 0)}\n"
        report += f"❌ Failed: {overall.get('failed_tests', 0)}\n"
        report += f"📊 Success Rate: {overall.get('success_rate', 0):.1f}%\n"
        report += f"\n"
        
        # Category breakdown
        report += f"📁 CATEGORY BREAKDOWN\n"
        report += f"{'='*40}\n"
        
        for category, category_data in self.execution_summary.get('test_categories', {}).items():
            report += f"\n📂 {category.upper().replace('_', ' ')}\n"
            report += f"  Total Tests: {category_data['total_tests']}\n"
            report += f"  Passed: {category_data['passed_tests']}\n"
            report += f"  Failed: {category_data['failed_tests']}\n"
            report += f"  Success Rate: {category_data['success_rate']:.1f}%\n"
            
            # Test details
            for test_name, test_data in category_data.get('test_details', {}).items():
                status = "✅" if test_data['success_rate'] == 100 else "⚠️"
                report += f"  {status} {test_name}: {test_data['passed']}/{test_data['total']} ({test_data['success_rate']:.1f}%)\n"
        
        report += f"\n{'='*80}\n"
        
        # Save report
        with open('backend/tests/validation_execution_report.txt', 'w') as f:
            f.write(report)
        
        logger.info("📄 Final report saved to: backend/tests/validation_execution_report.txt")
        
        # Print summary
        print(report)
        
        # Return exit code
        if overall.get('failed_tests', 0) > 0:
            logger.error("❌ Some tests failed!")
            return 1
        else:
            logger.info("🎉 All tests passed!")
            return 0

def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description='Comprehensive Validation Test Executor')
    parser.add_argument('--categories', nargs='+', 
                       choices=['numerical_parity', 'leverage_correctness', 'optimizer_parity', 
                               'trade_concurrency', 'stability'],
                       help='Specific test categories to run')
    parser.add_argument('--complete', action='store_true', 
                       help='Run complete validation suite')
    parser.add_argument('--ci', action='store_true', 
                       help='Run CI-optimized tests')
    parser.add_argument('--config', help='Path to configuration file')
    parser.add_argument('--verbose', '-v', action='store_true', 
                       help='Enable verbose logging')
    
    args = parser.parse_args()
    
    # Configure logging level
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    # Initialize executor
    executor = ValidationTestExecutor()
    
    # Execute based on arguments
    if args.ci:
        # Run CI-optimized tests
        success = executor.runner.run_ci_tests()
        exit(0 if success else 1)
    elif args.categories:
        # Run targeted validation
        results = executor.run_targeted_validation(args.categories)
        exit_code = executor.generate_final_report()
        exit(exit_code)
    elif args.complete:
        # Run complete validation
        results = executor.run_complete_validation()
        exit_code = executor.generate_final_report()
        exit(exit_code)
    else:
        # Default: run complete validation
        results = executor.run_complete_validation()
        exit_code = executor.generate_final_report()
        exit(exit_code)

if __name__ == "__main__":
    main()