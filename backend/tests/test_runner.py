"""
Backtesting Validation Test Runner
==================================

This module provides a comprehensive test runner for the backtesting validation
test suite. It includes HTML reporting, performance benchmarking, and
detailed failure analysis.
"""

import unittest
import time
import json
import os
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from collections import defaultdict

# Import test modules
from test_backtest_consistency import (
    TestVectorizedConsistency,
    TestLeverageConditions,
    TestParameterOptimization,
    TestTradeRestrictions,
    TestDataManager,
    TestResultComparator
)
from test_config import (
    TEST_CONFIG,
    SUCCESS_CRITERIA,
    REPORTING_CONFIG,
    get_tolerance_level
)


class TestResultCollector:
    """Collects and analyzes test results."""

    def __init__(self):
        """Initialize result collector."""
        self.test_results = []
        self.start_time = None
        self.end_time = None

    def start_collection(self):
        """Start collecting test results."""
        self.start_time = time.time()

    def end_collection(self):
        """End collecting test results."""
        self.end_time = time.time()

    def add_test_result(self, test_name: str, result: Dict[str, Any]):
        """Add a test result."""
        result['test_name'] = test_name
        result['timestamp'] = datetime.now().isoformat()
        result['execution_time'] = time.time()
        self.test_results.append(result)

    def get_summary(self) -> Dict[str, Any]:
        """Get summary of all test results."""
        if not self.test_results:
            return {}

        total_tests = len(self.test_results)
        passed_tests = sum(1 for r in self.test_results if r.get('passed', False))
        failed_tests = total_tests - passed_tests

        return {
            'total_tests': total_tests,
            'passed_tests': passed_tests,
            'failed_tests': failed_tests,
            'success_rate': passed_tests / total_tests if total_tests > 0 else 0,
            'execution_time': self.end_time - self.start_time if self.end_time and self.start_time else 0,
            'timestamp': datetime.now().isoformat()
        }


class HTMLTestReporter:
    """Generates HTML reports for test results."""

    def __init__(self, output_dir: str = 'backend/tests/reports'):
        """Initialize HTML reporter."""
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def generate_report(self, test_results: List[Dict[str, Any]],
                       summary: Dict[str, Any]) -> str:
        """Generate HTML test report."""
        report_file = self.output_dir / f"test_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.html"

        html_content = f"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Backtesting Validation Test Report</title>
            <style>
                body {{
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    margin: 0;
                    padding: 20px;
                    background-color: #f5f5f5;
                }}
                .header {{
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 30px;
                    border-radius: 10px;
                    margin-bottom: 30px;
                    text-align: center;
                }}
                .summary {{
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 20px;
                    margin-bottom: 30px;
                }}
                .metric-card {{
                    background: white;
                    padding: 20px;
                    border-radius: 8px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    text-align: center;
                }}
                .metric-value {{
                    font-size: 2em;
                    font-weight: bold;
                    color: #333;
                }}
                .metric-label {{
                    color: #666;
                    margin-top: 5px;
                }}
                .test-results {{
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    overflow: hidden;
                }}
                .test-section {{
                    margin-bottom: 30px;
                }}
                .section-header {{
                    background: #f8f9fa;
                    padding: 15px 20px;
                    border-bottom: 1px solid #dee2e6;
                    font-weight: bold;
                    color: #495057;
                }}
                .test-item {{
                    padding: 15px 20px;
                    border-bottom: 1px solid #f1f3f4;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }}
                .test-item:last-child {{
                    border-bottom: none;
                }}
                .test-name {{
                    font-weight: 500;
                    color: #333;
                }}
                .test-status {{
                    padding: 4px 12px;
                    border-radius: 20px;
                    font-size: 0.85em;
                    font-weight: bold;
                }}
                .status-passed {{ background: #d4edda; color: #155724; }}
                .status-failed {{ background: #f8d7da; color: #721c24; }}
                .status-skipped {{ background: #fff3cd; color: #856404; }}
                .details {{
                    margin-top: 10px;
                    padding: 10px;
                    background: #f8f9fa;
                    border-radius: 4px;
                    font-family: monospace;
                    font-size: 0.9em;
                }}
                .footer {{
                    margin-top: 30px;
                    text-align: center;
                    color: #666;
                    font-size: 0.9em;
                }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🚀 Backtesting Validation Test Report</h1>
                <p>Comprehensive validation of backtesting calculations</p>
                <p><strong>Generated:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
            </div>

            <div class="summary">
                <div class="metric-card">
                    <div class="metric-value">{summary['total_tests']}</div>
                    <div class="metric-label">Total Tests</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value" style="color: {'#28a745' if summary['passed_tests'] == summary['total_tests'] else '#ffc107'};">{summary['passed_tests']}</div>
                    <div class="metric-label">Passed</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value" style="color: {'#dc3545' if summary['failed_tests'] > 0 else '#28a745'};">{summary['failed_tests']}</div>
                    <div class="metric-label">Failed</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">{summary['success_rate']:.1%}</div>
                    <div class="metric-label">Success Rate</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">{summary['execution_time']:.1f}s</div>
                    <div class="metric-label">Execution Time</div>
                </div>
            </div>

            <div class="test-results">
        """

        # Group tests by category
        test_categories = defaultdict(list)
        for result in test_results:
            category = result.get('category', 'General')
            test_categories[category].append(result)

        for category, tests in test_categories.items():
            html_content += f"""
            <div class="test-section">
                <div class="section-header">{category}</div>
            """

            for test in tests:
                status_class = 'status-passed' if test.get('passed', False) else 'status-failed'
                status_text = 'PASSED' if test.get('passed', False) else 'FAILED'

                html_content += f"""
                <div class="test-item">
                    <div class="test-name">{test.get('test_name', 'Unknown Test')}</div>
                    <div class="test-status {status_class}">{status_text}</div>
                </div>
                """

                if not test.get('passed', False) and 'details' in test:
                    html_content += f"""
                    <div class="details">
                        <strong>Failure Details:</strong><br>
                        {test['details']}
                    </div>
                    """

            html_content += "</div>"

        html_content += """
            </div>

            <div class="footer">
                <p>Backtesting Validation Test Suite - Comprehensive Testing Framework</p>
                <p>Report generated automatically by the test runner</p>
            </div>
        </body>
        </html>
        """

        with open(report_file, 'w', encoding='utf-8') as f:
            f.write(html_content)

        return str(report_file)


class PerformanceBenchmarker:
    """Benchmarks test performance."""

    def __init__(self):
        """Initialize performance benchmarker."""
        self.benchmarks = {}

    def start_benchmark(self, test_name: str):
        """Start benchmarking a test."""
        self.benchmarks[test_name] = {
            'start_time': time.time(),
            'end_time': None,
            'duration': None
        }

    def end_benchmark(self, test_name: str):
        """End benchmarking a test."""
        if test_name in self.benchmarks:
            self.benchmarks[test_name]['end_time'] = time.time()
            self.benchmarks[test_name]['duration'] = (
                self.benchmarks[test_name]['end_time'] -
                self.benchmarks[test_name]['start_time']
            )

    def get_benchmark_report(self) -> Dict[str, Any]:
        """Get benchmark report."""
        total_time = sum(bench['duration'] for bench in self.benchmarks.values()
                        if bench['duration'] is not None)

        return {
            'total_execution_time': total_time,
            'average_test_time': total_time / len(self.benchmarks) if self.benchmarks else 0,
            'individual_benchmarks': self.benchmarks
        }


class TestRunner:
    """Main test runner class."""

    def __init__(self, output_dir: str = 'backend/tests/reports'):
        """Initialize test runner."""
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)

        self.result_collector = TestResultCollector()
        self.html_reporter = HTMLTestReporter(output_dir)
        self.performance_benchmarker = PerformanceBenchmarker()

    def run_test_suite(self, test_categories: Optional[List[str]] = None) -> Dict[str, Any]:
        """Run the complete test suite."""
        print("🚀 Starting Backtesting Validation Test Suite...")
        print("=" * 60)

        self.result_collector.start_collection()

        # Define test suites
        all_test_suites = {
            'vectorized_consistency': TestVectorizedConsistency,
            'leverage_conditions': TestLeverageConditions,
            'parameter_optimization': TestParameterOptimization,
            'trade_restrictions': TestTradeRestrictions
        }

        # Filter test suites if specified
        if test_categories:
            test_suites = {k: v for k, v in all_test_suites.items() if k in test_categories}
        else:
            test_suites = all_test_suites

        # Run each test suite
        for suite_name, test_class in test_suites.items():
            print(f"\n📋 Running {suite_name.replace('_', ' ').title()} Tests...")
            print("-" * 50)

            try:
                # Create test suite
                suite = unittest.TestLoader().loadTestsFromTestCase(test_class)

                # Run tests with custom result handler
                result = self._run_test_suite_with_timing(suite, suite_name)

                print(f"✅ {suite_name}: {result['tests_run']} tests, "
                      f"{result['passed']} passed, {result['failed']} failed")

            except Exception as e:
                print(f"❌ Error running {suite_name}: {e}")

        self.result_collector.end_collection()

        # Generate reports
        summary = self.result_collector.get_summary()
        report_file = self.html_reporter.generate_report(
            self.result_collector.test_results, summary
        )

        # Generate performance report
        benchmark_report = self.performance_benchmarker.get_benchmark_report()

        # Save JSON report
        self._save_json_report(summary, benchmark_report)

        # Print final summary
        self._print_final_summary(summary, report_file)

        return summary

    def _run_test_suite_with_timing(self, suite: unittest.TestSuite,
                                   suite_name: str) -> Dict[str, Any]:
        """Run test suite with performance timing."""
        result = {
            'suite_name': suite_name,
            'tests_run': 0,
            'passed': 0,
            'failed': 0,
            'errors': 0,
            'skipped': 0,
            'execution_time': 0
        }

        start_time = time.time()

        # Run tests with timing
        start_time = time.time()

        # Create a simple test result handler
        class SimpleTestResult(unittest.TextTestResult):
            def __init__(self, stream, descriptions, verbosity):
                super().__init__(stream, descriptions, verbosity)

        # Run tests
        runner = unittest.TextTestRunner(
            verbosity=2,
            resultclass=SimpleTestResult,
            stream=open(os.devnull, 'w')  # Suppress console output
        )

        test_result = runner.run(suite)

        # Calculate execution time
        execution_time = time.time() - start_time

        result['tests_run'] = test_result.testsRun
        result['passed'] = test_result.testsRun - len(test_result.failures) - len(test_result.errors) - len(test_result.skipped)
        result['failed'] = len(test_result.failures) + len(test_result.errors)
        result['errors'] = len(test_result.errors)
        result['skipped'] = len(test_result.skipped)
        result['execution_time'] = time.time() - start_time

        return result

    def _save_json_report(self, summary: Dict[str, Any],
                         benchmark_report: Dict[str, Any]):
        """Save detailed JSON report."""
        report_data = {
            'summary': summary,
            'benchmarks': benchmark_report,
            'test_results': self.result_collector.test_results,
            'config': TEST_CONFIG,
            'timestamp': datetime.now().isoformat()
        }

        json_file = self.output_dir / f"test_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"

        with open(json_file, 'w', encoding='utf-8') as f:
            json.dump(report_data, f, indent=2, ensure_ascii=False)

    def _print_final_summary(self, summary: Dict[str, Any], report_file: str):
        """Print final test summary."""
        print("\n" + "=" * 60)
        print("📊 FINAL TEST SUMMARY")
        print("=" * 60)
        print(f"Total Tests: {summary['total_tests']}")
        print(f"Passed: {summary['passed_tests']}")
        print(f"Failed: {summary['failed_tests']}")
        print(f"Success Rate: {summary['success_rate']:.1%}")
        print(f"Execution Time: {summary['execution_time']:.1f}s")
        print(f"\n📄 Report saved to: {report_file}")

        # Check success criteria
        success_rate = summary['success_rate']
        if success_rate >= SUCCESS_CRITERIA['overall_pass_rate']:
            print("✅ All success criteria met!")
        else:
            print(f"❌ Success criteria not met. Required: {SUCCESS_CRITERIA['overall_pass_rate']:.1%}")


def main():
    """Main function to run the test suite."""
    import argparse

    parser = argparse.ArgumentParser(description='Backtesting Validation Test Runner')
    parser.add_argument('--categories', nargs='+',
                       choices=['vectorized_consistency', 'leverage_conditions',
                               'parameter_optimization', 'trade_restrictions'],
                       help='Test categories to run')
    parser.add_argument('--output-dir', default='backend/tests/reports',
                       help='Output directory for reports')
    parser.add_argument('--verbose', '-v', action='store_true',
                       help='Verbose output')

    args = parser.parse_args()

    # Create test runner
    runner = TestRunner(args.output_dir)

    # Run tests
    summary = runner.run_test_suite(args.categories)

    # Exit with appropriate code
    success_rate = summary.get('success_rate', 0)
    if success_rate >= SUCCESS_CRITERIA['overall_pass_rate']:
        exit(0)
    else:
        exit(1)


if __name__ == "__main__":
    main()