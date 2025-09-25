"""
Validation Test Runner
Executes comprehensive backtesting validation tests and generates reports
"""

import pytest
import sys
import os
import json
import time
from datetime import datetime
from typing import Dict, List, Any, Optional
import traceback

# Add the backend directory to the path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from test_comprehensive_validation import TestComprehensiveValidation
from test_config import get_test_config, get_tolerance_level
from test_enhanced_fixtures import EnhancedTestDataGenerator

class ValidationTestRunner:
    """Main test runner for comprehensive validation tests"""
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or get_test_config()
        self.tolerance = get_tolerance_level('return_tolerance')
        self.test_suite = TestComprehensiveValidation()
        self.data_generator = EnhancedTestDataGenerator(seed=42)
        self.results = {}
        self.start_time = None
        self.end_time = None
    
    def run_all_tests(self) -> Dict[str, Any]:
        """Run all validation tests"""
        print("\n" + "="*80)
        print("🚀 COMPREHENSIVE BACKTEST VALIDATION TEST SUITE")
        print("="*80)
        print(f"📋 Configuration: {self.config}")
        print(f"🎯 Tolerance Level: {self.tolerance}")
        print(f"🔢 Test Data Seed: 42")
        print("="*80)
        
        self.start_time = time.time()
        
        try:
            # Generate test data
            print("\n📊 Generating test data...")
            test_data = self.data_generator.generate_comprehensive_test_dataset()
            print(f"✅ Generated {len(test_data['ohlcv'])} OHLCV records")
            print(f"✅ Generated {len(test_data['signals'])} signal records")
            
            # Run all tests
            self.results = self.test_suite.run_all_tests()
            
        except Exception as e:
            print(f"❌ Error running tests: {e}")
            print(f"🔍 Traceback: {traceback.format_exc()}")
            self.results = {'error': str(e), 'traceback': traceback.format_exc()}
        
        self.end_time = time.time()
        
        # Generate final report
        report = self.generate_final_report()
        print("\n" + report)
        
        # Save detailed results
        self.save_results()
        
        return self.results
    
    def run_specific_tests(self, test_names: List[str]) -> Dict[str, Any]:
        """Run specific tests"""
        print(f"\n🧪 Running specific tests: {test_names}")
        
        self.start_time = time.time()
        
        results = {}
        for test_name in test_names:
            try:
                results[test_name] = self.test_suite.run_specific_test(test_name)
            except Exception as e:
                print(f"❌ Error running {test_name}: {e}")
                results[test_name] = {'error': str(e)}
        
        self.end_time = time.time()
        
        # Generate report
        report = self.generate_specific_test_report(test_names, results)
        print("\n" + report)
        
        # Save results
        self.save_specific_test_results(test_names, results)
        
        return results
    
    def generate_final_report(self) -> str:
        """Generate comprehensive final report"""
        duration = self.end_time - self.start_time if self.end_time and self.start_time else 0
        
        report = f"""
{'='*80}
📊 COMPREHENSIVE VALIDATION TEST REPORT
{'='*80}
📅 Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
⏱️  Duration: {duration:.2f} seconds
🎯 Tolerance: {self.tolerance}
{'='*80}

"""
        
        # Overall summary
        total_tests = 0
        passed_tests = 0
        failed_tests = 0
        
        for category, tests in self.results.items():
            if category == 'error' or not isinstance(tests, dict):
                continue
                
            report += f"📁 {category.upper().replace('_', ' ')}\n"
            report += "-" * 40 + "\n"
            
            for test_name, test_results in tests.items():
                if not isinstance(test_results, dict):
                    continue
                    
                total_tests += len(test_results)
                passed = sum(1 for v in test_results.values() if v)
                failed = len(test_results) - passed
                
                passed_tests += passed
                failed_tests += failed
                
                status = "✅ PASS" if passed == len(test_results) else "❌ FAIL"
                report += f"  • {test_name}: {status} ({passed}/{len(test_results)})\n"
                
                if failed > 0:
                    for check, passed in test_results.items():
                        if not passed:
                            report += f"    - ❌ {check}: FAILED\n"
            
            report += "\n"
        
        # Overall summary
        report += f"{'='*80}\n"
        report += f"📈 OVERALL SUMMARY\n"
        report += f"{'='*80}\n"
        report += f"Total Test Cases: {total_tests}\n"
        report += f"✅ Passed: {passed_tests}\n"
        report += f"❌ Failed: {failed_tests}\n"
        report += f"📊 Success Rate: {(passed_tests/total_tests)*100:.1f}%\n"
        
        if failed_tests == 0:
            report += f"\n🎉 ALL TESTS PASSED! 🎉\n"
        else:
            report += f"\n⚠️  {failed_tests} test cases failed\n"
        
        report += f"{'='*80}\n"
        
        return report
    
    def generate_specific_test_report(self, test_names: List[str], results: Dict[str, Any]) -> str:
        """Generate report for specific tests"""
        duration = self.end_time - self.start_time if self.end_time and self.start_time else 0
        
        report = f"""
{'='*80}
📊 SPECIFIC VALIDATION TEST REPORT
{'='*80}
📅 Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
⏱️  Duration: {duration:.2f} seconds
🎯 Tests Run: {', '.join(test_names)}
{'='*80}

"""
        
        total_tests = 0
        passed_tests = 0
        failed_tests = 0
        
        for test_name, test_results in results.items():
            if isinstance(test_results, dict) and 'error' not in test_results:
                total_tests += len(test_results)
                passed = sum(1 for v in test_results.values() if v)
                failed = len(test_results) - passed
                
                passed_tests += passed
                failed_tests += failed
                
                status = "✅ PASS" if passed == len(test_results) else "❌ FAIL"
                report += f"🧪 {test_name}: {status} ({passed}/{len(test_results)})\n"
                
                if failed > 0:
                    for check, passed in test_results.items():
                        if not passed:
                            report += f"  - ❌ {check}: FAILED\n"
            else:
                report += f"❌ {test_name}: ERROR - {test_results.get('error', 'Unknown error')}\n"
        
        report += f"\n{'='*80}\n"
        report += f"📈 SPECIFIC TESTS SUMMARY\n"
        report += f"{'='*80}\n"
        report += f"Total Test Cases: {total_tests}\n"
        report += f"✅ Passed: {passed_tests}\n"
        report += f"❌ Failed: {failed_tests}\n"
        report += f"📊 Success Rate: {(passed_tests/max(total_tests,1))*100:.1f}%\n"
        report += f"{'='*80}\n"
        
        return report
    
    def save_results(self):
        """Save detailed results to files"""
        # Save JSON results
        json_results = {
            'timestamp': datetime.now().isoformat(),
            'config': self.config,
            'tolerance': self.tolerance,
            'duration': self.end_time - self.start_time if self.end_time and self.start_time else 0,
            'results': self.results
        }
        
        with open('backend/tests/validation_results.json', 'w') as f:
            json.dump(json_results, f, indent=2, default=str)
        
        # Save text report
        report = self.generate_final_report()
        with open('backend/tests/validation_report.txt', 'w') as f:
            f.write(report)
        
        print(f"📁 Results saved to:")
        print(f"  • backend/tests/validation_results.json")
        print(f"  • backend/tests/validation_report.txt")
    
    def save_specific_test_results(self, test_names: List[str], results: Dict[str, Any]):
        """Save specific test results"""
        json_results = {
            'timestamp': datetime.now().isoformat(),
            'config': self.config,
            'tolerance': self.tolerance,
            'duration': self.end_time - self.start_time if self.end_time and self.start_time else 0,
            'test_names': test_names,
            'results': results
        }
        
        filename = f"backend/tests/validation_results_{'_'.join(test_names)}.json"
        with open(filename, 'w') as f:
            json.dump(json_results, f, indent=2, default=str)
        
        print(f"📁 Specific test results saved to: {filename}")
    
    def run_ci_tests(self) -> bool:
        """Run CI-optimized tests (faster, focused on critical functionality)"""
        print("\n🏃 Running CI-optimized tests...")
        
        ci_test_names = [
            'single_backtest_consistency',
            'leverage_constraints',
            'parameter_optimization_consistency',
            'deterministic_results'
        ]
        
        results = self.run_specific_tests(ci_test_names)
        
        # Check if all CI tests passed
        all_passed = True
        for test_name, test_results in results.items():
            if isinstance(test_results, dict) and 'error' not in test_results:
                if not all(test_results.values()):
                    all_passed = False
                    break
            else:
                all_passed = False
                break
        
        return all_passed
    
    def run_performance_benchmark(self) -> Dict[str, Any]:
        """Run performance benchmarks"""
        print("\n⚡ Running performance benchmarks...")
        
        benchmark_results = {}
        
        try:
            # Generate test data
            test_data = self.data_generator.generate_comprehensive_test_dataset()
            
            # Benchmark single backtest
            start_time = time.time()
            for i in range(5):  # Run 5 times for average
                self.test_suite.run_specific_test('single_backtest_consistency')
            single_backtest_time = (time.time() - start_time) / 5
            
            benchmark_results['single_backtest_avg_time'] = single_backtest_time
            
            # Benchmark optimization
            start_time = time.time()
            self.test_suite.run_specific_test('parameter_optimization_consistency')
            optimization_time = time.time() - start_time
            
            benchmark_results['optimization_time'] = optimization_time
            
            print(f"📊 Performance Benchmarks:")
            print(f"  • Single Backtest: {single_backtest_time:.3f}s avg")
            print(f"  • Parameter Optimization: {optimization_time:.3f}s")
            
        except Exception as e:
            print(f"❌ Error running benchmarks: {e}")
            benchmark_results['error'] = str(e)
        
        return benchmark_results

def main():
    """Main entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Backtest Validation Test Runner')
    parser.add_argument('--tests', nargs='+', help='Specific tests to run')
    parser.add_argument('--ci', action='store_true', help='Run CI-optimized tests')
    parser.add_argument('--benchmark', action='store_true', help='Run performance benchmarks')
    parser.add_argument('--config', help='Path to config file')
    
    args = parser.parse_args()
    
    # Initialize runner
    runner = ValidationTestRunner()
    
    # Run based on arguments
    if args.ci:
        success = runner.run_ci_tests()
        exit(0 if success else 1)
    elif args.benchmark:
        benchmark_results = runner.run_performance_benchmark()
        exit(0 if 'error' not in benchmark_results else 1)
    elif args.tests:
        results = runner.run_specific_tests(args.tests)
        # Check if all tests passed
        all_passed = True
        for test_name, test_results in results.items():
            if isinstance(test_results, dict) and 'error' not in test_results:
                if not all(test_results.values()):
                    all_passed = False
                    break
            else:
                all_passed = False
                break
        exit(0 if all_passed else 1)
    else:
        # Run all tests
        results = runner.run_all_tests()
        # Check if all tests passed
        all_passed = True
        for category, tests in results.items():
            if category == 'error' or not isinstance(tests, dict):
                continue
            for test_name, test_results in tests.items():
                if not isinstance(test_results, dict):
                    continue
                if not all(test_results.values()):
                    all_passed = False
                    break
            if not all_passed:
                break
        exit(0 if all_passed else 1)

if __name__ == "__main__":
    main()