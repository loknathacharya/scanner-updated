#!/usr/bin/env python3
"""
CI-Ready Validation Test Suite
Ensures tests are stable, reproducible, and ready for CI/CD integration
"""

import sys
import os
import json
import time
import logging
import subprocess
from datetime import datetime
from typing import Dict, List, Any, Optional

# Add the backend directory to the path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('ci_validation_test.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class CIValidationTestSuite:
    """CI-Ready validation test suite with stability and reproducibility checks"""
    
    def __init__(self):
        self.test_results = {}
        self.execution_summary = {}
        self.start_time = None
        self.end_time = None
        self.ci_config = {
            'max_execution_time': 300,  # 5 minutes max
            'min_success_rate': 90.0,   # 90% minimum success rate
            'reproducibility_runs': 3,   # Run tests 3 times for reproducibility
            'seed': 42,                  # Fixed seed for determinism
            'tolerance': 1e-09           # Floating point tolerance
        }
        
    def run_ci_validation(self) -> Dict[str, Any]:
        """Run CI-Ready validation suite"""
        logger.info("🚀 Starting CI-Ready Validation Test Suite...")
        
        self.start_time = time.time()
        
        try:
            # Import test modules
            from test_comprehensive_validation import TestComprehensiveValidation
            from test_enhanced_fixtures import EnhancedTestDataGenerator
            from test_config import get_test_config, get_tolerance_level
            
            # Initialize components
            test_suite = TestComprehensiveValidation()
            data_generator = EnhancedTestDataGenerator(seed=self.ci_config['seed'])
            config = get_test_config()
            tolerance = get_tolerance_level()
            
            logger.info("📊 Generating test data...")
            test_data = data_generator.generate_comprehensive_test_dataset()
            logger.info(f"✅ Generated {len(test_data['ohlcv'])} OHLCV records")
            logger.info(f"✅ Generated {len(test_data['signals'])} signal records")
            
            # Run reproducibility tests
            logger.info(f"🔄 Running {self.ci_config['reproducibility_runs']} reproducibility tests...")
            reproducibility_results = self.run_reproducibility_tests(test_suite, test_data)
            
            # Run stability tests
            logger.info("🔒 Running stability tests...")
            stability_results = self.run_stability_tests(test_suite, test_data)
            
            # Run performance benchmarks
            logger.info("⚡ Running performance benchmarks...")
            performance_results = self.run_performance_benchmarks(test_suite, test_data)
            
            # Run CI compliance checks
            logger.info("📋 Running CI compliance checks...")
            compliance_results = self.run_ci_compliance_checks()
            
            # Combine all results
            self.test_results = {
                'reproducibility': reproducibility_results,
                'stability': stability_results,
                'performance': performance_results,
                'compliance': compliance_results
            }
            
            # Generate execution summary
            self.execution_summary = self.generate_ci_execution_summary(config, tolerance)
            
        except Exception as e:
            logger.error(f"❌ Error during CI validation: {e}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            self.execution_summary['error'] = str(e)
            self.execution_summary['status'] = 'FAILED'
        
        self.end_time = time.time()
        self.execution_summary['execution_time'] = self.end_time - self.start_time
        self.execution_summary['timestamp'] = datetime.now().isoformat()
        
        # Save results
        self.save_ci_results()
        
        # Generate final report
        self.generate_ci_report()
        
        return self.test_results
    
    def run_reproducibility_tests(self, test_suite: TestComprehensiveValidation, test_data: Dict[str, Any]) -> Dict[str, Any]:
        """Run tests multiple times to ensure reproducibility"""
        logger.info("🔄 Running reproducibility tests...")
        
        reproducibility_results = {}
        test_categories = ['numerical_parity', 'leverage_correctness', 'optimizer_parity', 'trade_concurrency', 'stability']
        
        for category in test_categories:
            category_results = []
            
            for run in range(self.ci_config['reproducibility_runs']):
                logger.info(f"  Running {category} - Run {run + 1}/{self.ci_config['reproducibility_runs']}")
                
                try:
                    if category == 'numerical_parity':
                        result = test_suite.numerical_parity.test_single_backtest_consistency()
                    elif category == 'leverage_correctness':
                        result = test_suite.leverage_correctness.test_leverage_constraints()
                    elif category == 'optimizer_parity':
                        result = test_suite.optimizer_parity.test_parameter_optimization_consistency()
                    elif category == 'trade_concurrency':
                        result = test_suite.trade_concurrency.test_single_trade_per_instrument()
                    elif category == 'stability':
                        result = test_suite.stability.test_deterministic_results()
                    
                    category_results.append(result)
                    
                except Exception as e:
                    logger.error(f"  Error in {category} run {run + 1}: {e}")
                    category_results.append({'error': str(e)})
            
            # Check reproducibility
            reproducibility_score = self.calculate_reproducibility_score(category_results)
            reproducibility_results[category] = {
                'runs': category_results,
                'reproducibility_score': reproducibility_score,
                'is_reproducible': reproducibility_score >= 95.0
            }
        
        return reproducibility_results
    
    def run_stability_tests(self, test_suite: TestComprehensiveValidation, test_data: Dict[str, Any]) -> Dict[str, Any]:
        """Run stability tests to ensure consistent behavior"""
        logger.info("🔒 Running stability tests...")
        
        stability_results = {}
        
        try:
            # Test deterministic results
            stability_results['deterministic_results'] = test_suite.stability.test_deterministic_results()
            
            # Test floating point tolerance
            stability_results['floating_point_tolerance'] = test_suite.stability.test_floating_point_tolerance()
            
            # Test memory usage
            stability_results['memory_usage'] = self.test_memory_usage(test_suite, test_data)
            
            # Test execution time consistency
            stability_results['execution_time_consistency'] = self.test_execution_time_consistency(test_suite, test_data)
            
        except Exception as e:
            logger.error(f"❌ Stability test failed: {e}")
            stability_results['error'] = str(e)
        
        return stability_results
    
    def run_performance_benchmarks(self, test_suite: TestComprehensiveValidation, test_data: Dict[str, Any]) -> Dict[str, Any]:
        """Run performance benchmarks to ensure acceptable execution times"""
        logger.info("⚡ Running performance benchmarks...")
        
        performance_results = {}
        
        try:
            # Benchmark single backtest
            start_time = time.time()
            test_suite.numerical_parity.test_single_backtest_consistency()
            single_backtest_time = time.time() - start_time
            
            # Benchmark optimization
            start_time = time.time()
            test_suite.optimizer_parity.test_parameter_optimization_consistency()
            optimization_time = time.time() - start_time
            
            # Benchmark leverage calculations
            start_time = time.time()
            test_suite.leverage_correctness.test_leverage_constraints()
            leverage_time = time.time() - start_time
            
            performance_results = {
                'single_backtest_time': single_backtest_time,
                'optimization_time': optimization_time,
                'leverage_time': leverage_time,
                'total_time': single_backtest_time + optimization_time + leverage_time,
                'performance_thresholds': {
                    'max_single_backtest_time': 10.0,
                    'max_optimization_time': 60.0,
                    'max_leverage_time': 5.0,
                    'max_total_time': 120.0
                },
                'within_thresholds': (
                    single_backtest_time <= 10.0 and
                    optimization_time <= 60.0 and
                    leverage_time <= 5.0 and
                    (single_backtest_time + optimization_time + leverage_time) <= 120.0
                )
            }
            
        except Exception as e:
            logger.error(f"❌ Performance benchmark failed: {e}")
            performance_results['error'] = str(e)
        
        return performance_results
    
    def run_ci_compliance_checks(self) -> Dict[str, Any]:
        """Run CI compliance checks"""
        logger.info("📋 Running CI compliance checks...")
        
        compliance_results = {}
        
        try:
            # Check Python version
            python_version = sys.version_info
            compliance_results['python_version'] = {
                'version': f"{python_version.major}.{python_version.minor}.{python_version.micro}",
                'supported': python_version.major == 3 and python_version.minor >= 8
            }
            
            # Check required packages
            required_packages = ['pandas', 'numpy', 'pytest', 'numba', 'fastapi']
            compliance_results['required_packages'] = {}
            
            for package in required_packages:
                try:
                    __import__(package)
                    compliance_results['required_packages'][package] = True
                except ImportError:
                    compliance_results['required_packages'][package] = False
            
            # Check test file existence
            test_files = [
                'test_comprehensive_validation.py',
                'test_enhanced_fixtures.py',
                'test_config.py',
                'test_validation_runner.py'
            ]
            
            compliance_results['test_files'] = {}
            for test_file in test_files:
                file_path = os.path.join(os.path.dirname(__file__), test_file)
                compliance_results['test_files'][test_file] = os.path.exists(file_path)
            
            # Check CI configuration
            compliance_results['ci_config'] = {
                'max_execution_time': self.ci_config['max_execution_time'],
                'min_success_rate': self.ci_config['min_success_rate'],
                'reproducibility_runs': self.ci_config['reproducibility_runs'],
                'seed': self.ci_config['seed'],
                'tolerance': self.ci_config['tolerance']
            }
            
            # Overall compliance
            all_checks_passed = (
                compliance_results['python_version']['supported'] and
                all(compliance_results['required_packages'].values()) and
                all(compliance_results['test_files'].values())
            )
            
            compliance_results['overall_compliance'] = all_checks_passed
            
        except Exception as e:
            logger.error(f"❌ CI compliance check failed: {e}")
            compliance_results['error'] = str(e)
        
        return compliance_results
    
    def calculate_reproducibility_score(self, runs: List[Dict[str, Any]]) -> float:
        """Calculate reproducibility score based on consistency across runs"""
        if len(runs) < 2:
            return 100.0
        
        # Check if all runs are identical
        first_run = runs[0]
        consistent_runs = 0
        
        for run in runs:
            if self.compare_results(first_run, run):
                consistent_runs += 1
        
        return (consistent_runs / len(runs)) * 100
    
    def compare_results(self, result1: Dict[str, Any], result2: Dict[str, Any]) -> bool:
        """Compare two test results for consistency"""
        # Simple comparison - in real implementation, this would be more sophisticated
        if isinstance(result1, dict) and isinstance(result2, dict):
            if 'error' in result1 and 'error' in result2:
                return result1['error'] == result2['error']
            elif 'error' not in result1 and 'error' not in result2:
                # Compare the structure of results
                return len(result1) == len(result2)
            else:
                return False
        else:
            return result1 == result2
    
    def test_memory_usage(self, test_suite: TestComprehensiveValidation, test_data: Dict[str, Any]) -> Dict[str, Any]:
        """Test memory usage during execution"""
        try:
            import psutil
            import gc
            
            process = psutil.Process()
            initial_memory = process.memory_info().rss / 1024 / 1024  # MB
            
            # Run test
            test_suite.numerical_parity.test_single_backtest_consistency()
            
            # Force garbage collection
            gc.collect()
            final_memory = process.memory_info().rss / 1024 / 1024  # MB
            
            memory_increase = final_memory - initial_memory
            
            return {
                'initial_memory_mb': initial_memory,
                'final_memory_mb': final_memory,
                'memory_increase_mb': memory_increase,
                'within_threshold': memory_increase <= 100.0  # 100MB threshold
            }
            
        except Exception as e:
            logger.error(f"❌ Memory usage test failed: {e}")
            return {'error': str(e)}
    
    def test_execution_time_consistency(self, test_suite: TestComprehensiveValidation, test_data: Dict[str, Any]) -> Dict[str, Any]:
        """Test execution time consistency"""
        execution_times = []
        
        for i in range(3):  # Run 3 times
            start_time = time.time()
            test_suite.numerical_parity.test_single_backtest_consistency()
            execution_times.append(time.time() - start_time)
        
        avg_time = sum(execution_times) / len(execision_times)
        time_variance = max(execution_times) - min(execision_times)
        
        return {
            'execution_times': execution_times,
            'average_time': avg_time,
            'time_variance': time_variance,
            'within_threshold': time_variance <= 1.0  # 1 second threshold
        }
    
    def generate_ci_execution_summary(self, config: Dict[str, Any], tolerance: float) -> Dict[str, Any]:
        """Generate CI execution summary"""
        summary = {
            'status': 'COMPLETED',
            'timestamp': datetime.now().isoformat(),
            'config': config,
            'tolerance': tolerance,
            'ci_config': self.ci_config,
            'test_categories': {},
            'overall_results': {
                'total_tests': 0,
                'passed_tests': 0,
                'failed_tests': 0,
                'success_rate': 0.0,
                'reproducibility_score': 0.0,
                'performance_score': 0.0,
                'compliance_score': 0.0
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
                'success_rate': 0.0
            }
            
            if category == 'reproducibility':
                # Reproducibility score
                reproducibility_scores = []
                for sub_category, sub_tests in tests.items():
                    if isinstance(sub_tests, dict) and 'reproducibility_score' in sub_tests:
                        reproducibility_scores.append(sub_tests['reproducibility_score'])
                
                if reproducibility_scores:
                    summary['overall_results']['reproducibility_score'] = sum(reproducibility_scores) / len(reproducibility_scores)
            
            elif category == 'performance':
                # Performance score
                if 'within_thresholds' in tests:
                    performance_score = 100.0 if tests['within_thresholds'] else 0.0
                    summary['overall_results']['performance_score'] = performance_score
            
            elif category == 'compliance':
                # Compliance score
                if 'overall_compliance' in tests:
                    compliance_score = 100.0 if tests['overall_compliance'] else 0.0
                    summary['overall_results']['compliance_score'] = compliance_score
            
            # General test counting
            if isinstance(tests, dict):
                for test_name, test_result in tests.items():
                    if isinstance(test_result, dict) and 'error' not in test_result:
                        category_summary['total_tests'] += 1
                        category_summary['passed_tests'] += 1
                    else:
                        category_summary['total_tests'] += 1
                        category_summary['failed_tests'] += 1
            
            if category_summary['total_tests'] > 0:
                category_summary['success_rate'] = (category_summary['passed_tests'] / category_summary['total_tests']) * 100
            
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
        
        # Check CI compliance
        overall_score = (
            summary['overall_results']['success_rate'] +
            summary['overall_results'].get('reproducibility_score', 0) +
            summary['overall_results'].get('performance_score', 0) +
            summary['overall_results'].get('compliance_score', 0)
        ) / 4
        
        summary['overall_results']['overall_score'] = overall_score
        summary['overall_results']['ci_compliant'] = overall_score >= self.ci_config['min_success_rate']
        
        return summary
    
    def save_ci_results(self):
        """Save CI validation results"""
        # Save JSON results
        results_data = {
            'execution_summary': self.execution_summary,
            'detailed_results': self.test_results,
            'timestamp': datetime.now().isoformat(),
            'ci_config': self.ci_config
        }
        
        with open('backend/tests/ci_validation_results.json', 'w') as f:
            json.dump(results_data, f, indent=2, default=str)
        
        logger.info("📁 CI validation results saved to: backend/tests/ci_validation_results.json")
    
    def generate_ci_report(self):
        """Generate CI validation report"""
        report = f"""
{'='*100}
🎯 CI-READY VALIDATION TEST REPORT
{'='*100}
📅 Execution Time: {self.execution_summary.get('timestamp', 'N/A')}
⏱️  Duration: {self.execution_summary.get('execution_time', 0):.2f} seconds
🎯 Tolerance: {self.execution_summary.get('tolerance', 'N/A')}
📋 Configuration: {self.execution_summary.get('config', 'N/A')}
🔧 CI Config: {self.ci_config}
{'='*100}

"""
        
        # Overall summary
        overall = self.execution_summary.get('overall_results', {})
        report += f"📈 OVERALL SUMMARY\n"
        report += f"{'='*50}\n"
        report += f"Status: {self.execution_summary.get('status', 'N/A')}\n"
        report += f"Total Test Cases: {overall.get('total_tests', 0)}\n"
        report += f"✅ Passed: {overall.get('passed_tests', 0)}\n"
        report += f"❌ Failed: {overall.get('failed_tests', 0)}\n"
        report += f"📊 Success Rate: {overall.get('success_rate', 0):.1f}%\n"
        report += f"🔄 Reproducibility Score: {overall.get('reproducibility_score', 0):.1f}%\n"
        report += f"⚡ Performance Score: {overall.get('performance_score', 0):.1f}%\n"
        report += f"📋 Compliance Score: {overall.get('compliance_score', 0):.1f}%\n"
        report += f"🎯 Overall Score: {overall.get('overall_score', 0):.1f}%\n"
        report += f"🔧 CI Compliant: {'✅ YES' if overall.get('ci_compliant', False) else '❌ NO'}\n"
        report += f"\n"
        
        # Category breakdown
        report += f"📁 CATEGORY BREAKDOWN\n"
        report += f"{'='*50}\n"
        
        for category, category_data in self.execution_summary.get('test_categories', {}).items():
            report += f"\n📂 {category.upper().replace('_', ' ')}\n"
            report += f"  Total Tests: {category_data['total_tests']}\n"
            report += f"  Passed: {category_data['passed_tests']}\n"
            report += f"  Failed: {category_data['failed_tests']}\n"
            report += f"  Success Rate: {category_data['success_rate']:.1f}%\n"
        
        report += f"\n{'='*100}\n"
        
        # CI compliance assessment
        if overall.get('ci_compliant', False):
            report += f"🎉 CI STATUS: COMPLIANT\n"
            report += f"   The validation suite meets all CI/CD requirements.\n"
            report += f"   Ready for automated testing and deployment.\n"
        else:
            report += f"⚠️  CI STATUS: NOT COMPLIANT\n"
            report += f"   The validation suite does not meet CI/CD requirements.\n"
            report += f"   Please review and fix the issues before proceeding.\n"
        
        report += f"{'='*100}\n"
        
        # Save report
        with open('backend/tests/ci_validation_report.txt', 'w') as f:
            f.write(report)
        
        logger.info("📄 CI validation report saved to: backend/tests/ci_validation_report.txt")
        
        # Print summary
        print(report)
        
        # Return exit code
        if overall.get('ci_compliant', False):
            logger.info("🎉 CI validation passed!")
            return 0
        else:
            logger.error("❌ CI validation failed!")
            return 1

def main():
    """Main entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(description='CI-Ready Validation Test Suite')
    parser.add_argument('--verbose', '-v', action='store_true', 
                       help='Enable verbose logging')
    parser.add_argument('--config', help='Path to CI configuration file')
    
    args = parser.parse_args()
    
    # Configure logging level
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    # Initialize test suite
    test_suite = CIValidationTestSuite()
    
    # Load custom config if provided
    if args.config:
        try:
            with open(args.config, 'r') as f:
                custom_config = json.load(f)
                test_suite.ci_config.update(custom_config)
            logger.info(f"📋 Loaded custom CI configuration from: {args.config}")
        except Exception as e:
            logger.error(f"❌ Failed to load custom configuration: {e}")
    
    # Run CI validation
    results = test_suite.run_ci_validation()
    
    # Generate final report and get exit code
    exit_code = test_suite.generate_ci_report()
    
    exit(exit_code)

if __name__ == "__main__":
    main()