import unittest
import json
import pandas as pd
import numpy as np
from unittest.mock import Mock, patch
import sys
import os

# Add the current directory to the path to import modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from json_filter_ui import JSONFilterUI
from json_filter_parser import JSONFilterParser

class TestJSONFilterUI(unittest.TestCase):
    """Test cases for JSONFilterUI class"""
    
    def setUp(self):
        """Set up test fixtures"""
        self.ui = JSONFilterUI()
        self.parser = JSONFilterParser()
        
        # Create sample data for testing
        self.sample_data = pd.DataFrame({
            'date': pd.date_range('2023-01-01', periods=100, freq='D'),
            'symbol': ['AAPL'] * 100,
            'open': np.random.uniform(150, 200, 100),
            'high': np.random.uniform(155, 205, 100),
            'low': np.random.uniform(145, 195, 100),
            'close': np.random.uniform(152, 202, 100),
            'volume': np.random.uniform(1000000, 5000000, 100),
            'sma_20': np.random.uniform(160, 190, 100),
            'sma_50': np.random.uniform(155, 195, 100),
            'rsi': np.random.uniform(20, 80, 100)
        })
    
    def test_init(self):
        """Test JSONFilterUI initialization"""
        self.assertIsInstance(self.ui.parser, JSONFilterParser)
        self.assertIsInstance(self.ui.example_filters, dict)
        self.assertIn('basic_filters', self.ui.example_filters)
        self.assertIn('technical_indicators', self.ui.example_filters)
        self.assertIn('complex_patterns', self.ui.example_filters)
        self.assertIn('volume_analysis', self.ui.example_filters)
    
    def test_get_example_filters(self):
        """Test getting example filters"""
        examples = self.ui.get_example_filters()
        
        self.assertIsInstance(examples, dict)
        self.assertIn('basic_filters', examples)
        self.assertIn('technical_indicators', examples)
        self.assertIn('complex_patterns', examples)
        self.assertIn('volume_analysis', examples)
        
        # Check that each category has examples
        for category in examples.values():
            self.assertIsInstance(category, dict)
            self.assertGreater(len(category), 0)
    
    def test_load_example_filters(self):
        """Test loading example filters"""
        examples = self.ui._load_example_filters()
        
        # Check structure
        self.assertIsInstance(examples, dict)
        self.assertIn('basic_filters', examples)
        self.assertIn('technical_indicators', examples)
        self.assertIn('complex_patterns', examples)
        self.assertIn('volume_analysis', examples)
        
        # Check basic filters
        basic_filters = examples['basic_filters']
        self.assertIn('Price Above $100', basic_filters)
        self.assertIn('Price Increase', basic_filters)
        self.assertIn('High Volume', basic_filters)
        
        # Check technical indicators
        tech_indicators = examples['technical_indicators']
        self.assertIn('Golden Cross', tech_indicators)
        self.assertIn('RSI Overbought', tech_indicators)
        self.assertIn('RSI Oversold', tech_indicators)
        
        # Check complex patterns
        complex_patterns = examples['complex_patterns']
        self.assertIn('Bullish Confirmation', complex_patterns)
        self.assertIn('OR Logic Example', complex_patterns)
        
        # Check volume analysis
        volume_analysis = examples['volume_analysis']
        self.assertIn('Volume Breakout', volume_analysis)
        self.assertIn('High Volume Spike', volume_analysis)
    
    def test_perform_additional_validations(self):
        """Test additional validation logic"""
        # Test with valid conditions
        valid_json = {
            "logic": "AND",
            "conditions": [
                {
                    "left": {
                        "type": "column",
                        "name": "close",
                        "timeframe": "daily",
                        "offset": 0
                    },
                    "operator": ">",
                    "right": {
                        "type": "constant",
                        "value": 100.0
                    }
                }
            ]
        }
        
        # Test with empty conditions
        empty_json = {
            "logic": "AND",
            "conditions": []
        }
        
        # Test with constant comparison
        constant_json = {
            "logic": "AND",
            "conditions": [
                {
                    "left": {
                        "type": "constant",
                        "value": 100.0
                    },
                    "operator": ">",
                    "right": {
                        "type": "constant",
                        "value": 50.0
                    }
                }
            ]
        }
        
        # Just test that the method runs without error
        self.ui._perform_additional_validations(valid_json)
        self.ui._perform_additional_validations(empty_json)
        self.ui._perform_additional_validations(constant_json)
    
    def test_display_condition_details(self):
        """Test condition details display"""
        condition = {
            "left": {
                "type": "column",
                "name": "close",
                "timeframe": "daily",
                "offset": 0
            },
            "operator": ">",
            "right": {
                "type": "constant",
                "value": 100.0
            }
        }
        
        # Just test that the method runs without error
        self.ui._display_condition_details(condition)
    
    def test_integration_with_parser(self):
        """Test integration with JSONFilterParser"""
        # Test that the UI uses the parser correctly
        valid_json = {
            "logic": "AND",
            "conditions": [
                {
                    "left": {
                        "type": "column",
                        "name": "close",
                        "timeframe": "daily",
                        "offset": 0
                    },
                    "operator": ">",
                    "right": {
                        "type": "constant",
                        "value": 100.0
                    }
                }
            ]
        }
        
        # Test validation
        is_valid, error_msg = self.parser.validate_json(valid_json)
        self.assertTrue(is_valid)
        
        # Test that UI uses the same validation
        self.ui.render_validation_feedback(valid_json)
    
    def test_json_parsing_functionality(self):
        """Test JSON parsing functionality"""
        # Test valid JSON
        valid_json_str = json.dumps({
            "logic": "AND",
            "conditions": [
                {
                    "left": {
                        "type": "column",
                        "name": "close",
                        "timeframe": "daily",
                        "offset": 0
                    },
                    "operator": ">",
                    "right": {
                        "type": "constant",
                        "value": 100.0
                    }
                }
            ]
        })
        
        # Test JSON parsing
        parsed_json = json.loads(valid_json_str)
        self.assertEqual(parsed_json['logic'], "AND")
        self.assertEqual(len(parsed_json['conditions']), 1)
        self.assertEqual(parsed_json['conditions'][0]['operator'], ">")
        
        # Test invalid JSON
        invalid_json_str = '{"logic": "AND", "conditions": [{"left": {"type": "column", "name": "close"}, "operator": ">", "right": {"type": "constant", "value": 100.0}'
        
        try:
            json.loads(invalid_json_str)
            self.fail("Should have raised JSONDecodeError")
        except json.JSONDecodeError:
            pass  # Expected
    
    def test_example_filter_structure(self):
        """Test that example filters have correct structure"""
        examples = self.ui.get_example_filters()
        
        for category_name, category_filters in examples.items():
            for filter_name, filter_data in category_filters.items():
                # Check that each filter has the required structure
                self.assertIn('logic', filter_data)
                self.assertIn('conditions', filter_data)
                self.assertIsInstance(filter_data['logic'], str)
                self.assertIsInstance(filter_data['conditions'], list)
                
                # Check each condition
                for condition in filter_data['conditions']:
                    self.assertIn('left', condition)
                    self.assertIn('operator', condition)
                    self.assertIn('right', condition)
                    self.assertIsInstance(condition['operator'], str)
                    
                    # Check operands
                    for operand in [condition['left'], condition['right']]:
                        self.assertIn('type', operand)
                        self.assertIsInstance(operand['type'], str)
                        
                        if operand['type'] == 'column':
                            self.assertIn('name', operand)
                        elif operand['type'] == 'indicator':
                            self.assertIn('name', operand)
                            self.assertIn('column', operand)
                            self.assertIn('params', operand)
                        elif operand['type'] == 'constant':
                            self.assertIn('value', operand)

if __name__ == '__main__':
    unittest.main()