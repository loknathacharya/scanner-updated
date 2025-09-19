import streamlit as st
import pandas as pd
import json
from typing import Dict, List, Any, Optional
from json_filter_parser import JSONFilterParser
import traceback

class JSONFilterUI:
    """UI components for JSON-based filter editing and validation"""
    
    def __init__(self):
        """Initialize the JSONFilterUI with parser"""
        self.parser = JSONFilterParser()
        self.example_filters = self._load_example_filters()
    
    def render_json_editor(self) -> Optional[dict]:
        """
        Render JSON editor interface with syntax highlighting
        
        Returns:
            Optional[dict]: JSON data from editor or None if invalid
        """
        st.subheader("📝 JSON Filter Editor")
        
        # Create two columns for better layout
        col1, col2 = st.columns([1, 1])
        
        with col1:
            # JSON input area
            st.write("**JSON Input**")
            
            # Default JSON template
            default_json = {
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
            
            # Use session state to preserve user input across re-renders
            if 'json_filter_input' not in st.session_state:
                st.session_state.json_filter_input = json.dumps(default_json, indent=2)
            
            # JSON text area
            json_input = st.text_area(
                "Enter JSON Filter",
                value=st.session_state.json_filter_input,
                height=300,
                help="Paste your JSON filter here. Use the examples on the right for reference."
            )
            
            # Update session state when text area changes
            st.session_state.json_filter_input = json_input
            
            # Parse button
            if st.button("🔍 Validate & Parse JSON", type="primary"):
                try:
                    json_data = json.loads(json_input)
                    return json_data
                except json.JSONDecodeError as e:
                    st.error(f"❌ JSON Syntax Error: {str(e)}")
                    st.code(f"Error at position {e.pos}: {e.msg}")
                    return None
                except Exception as e:
                    st.error(f"❌ Unexpected Error: {str(e)}")
                    return None
        
        with col2:
            # Example filters
            st.write("**Example Filters**")
            self.render_example_selector()
            
            # JSON structure help
            st.write("**JSON Structure Guide**")
            self.render_json_structure_help()
        
        return None
    
    def render_validation_feedback(self, json_data: dict) -> None:
        """
        Show validation feedback for JSON data
        
        Args:
            json_data (dict): JSON data to validate
        """
        if json_data is None:
            return
        
        st.subheader("🔍 Validation Results")
        
        # Validate JSON structure
        is_valid, error_message = self.parser.validate_json(json_data)
        
        if is_valid:
            st.success("✅ JSON Structure Valid")
            
            # Additional validation checks
            self._perform_additional_validations(json_data)
            
        else:
            st.error(f"❌ {error_message}")
            return
        
        # Show parsed filter information
        st.subheader("📋 Filter Information")
        
        col1, col2 = st.columns(2)
        
        with col1:
            # Logic operator
            logic = json_data.get("logic", "NOT_SPECIFIED")
            st.write(f"**Logic Operator:** `{logic}`")
            
            # Number of conditions
            conditions = json_data.get("conditions", [])
            st.write(f"**Number of Conditions:** {len(conditions)}")
            
            # Supported operators
            operators = self.parser.get_supported_operators()
            st.write(f"**Supported Operators:** {', '.join(operators)}")
        
        with col2:
            # Supported indicators
            indicators = self.parser.get_supported_indicators()
            st.write(f"**Supported Indicators:** {', '.join(indicators)}")
            
            # Supported timeframes
            timeframes = self.parser.get_supported_timeframes()
            st.write(f"**Supported Timeframes:** {', '.join(timeframes)}")
        
        # Show conditions breakdown
        if conditions:
            st.subheader("📝 Conditions Breakdown")
            for i, condition in enumerate(conditions, 1):
                with st.expander(f"Condition {i}: {condition.get('operator', 'UNKNOWN')}", expanded=False):
                    self._display_condition_details(condition)
    
    def render_filter_preview(self, json_data: dict, data: pd.DataFrame) -> None:
        """
        Show filter preview with sample results
        
        Args:
            json_data (dict): Valid JSON filter data
            data (pd.DataFrame): Sample data for preview
        """
        if json_data is None or data.empty:
            return
        
        st.subheader("🔍 Filter Preview")
        
        try:
            # Import here to avoid circular imports
            from advanced_filter_engine import AdvancedFilterEngine
            
            # Create filter engine
            filter_engine = AdvancedFilterEngine()
            
            # Apply filter to sample data
            with st.spinner("Applying filter to sample data..."):
                # Use a smaller sample for preview
                sample_size = min(1000, len(data))
                sample_data = data.sample(n=sample_size, random_state=42)
                
                filtered_data = filter_engine.apply_filter(sample_data, json_data)
            
            # Show results
            col1, col2 = st.columns(2)
            
            with col1:
                st.metric(
                    "Total Records in Sample",
                    f"{len(sample_data):,}",
                    help=f"Sample size: {sample_size}"
                )
            
            with col2:
                st.metric(
                    "Matching Records",
                    f"{len(filtered_data):,}",
                    delta=f"{(len(filtered_data)/len(sample_data)*100):.1f}%" if len(sample_data) > 0 else "0%"
                )
            
            # Show sample results if any matches
            if len(filtered_data) > 0:
                st.subheader("📊 Sample Results")
                
                # Limit display to first 10 rows
                display_data = filtered_data.head(10)
                
                # Format numeric columns for display
                numeric_cols = display_data.select_dtypes(include=['number']).columns
                formatted_data = display_data.copy()
                
                for col in numeric_cols:
                    if col in ['volume']:
                        formatted_data[col] = formatted_data[col].apply(lambda x: f"{x:,.0f}" if pd.notna(x) else "")
                    elif col in ['open', 'high', 'low', 'close']:
                        formatted_data[col] = formatted_data[col].apply(lambda x: f"{x:.2f}" if pd.notna(x) else "")
                    elif col.startswith(('sma_', 'ema_', 'bb_')):
                        formatted_data[col] = formatted_data[col].apply(lambda x: f"{x:.2f}" if pd.notna(x) else "")
                    elif col in ['rsi', 'stoch_k', 'stoch_d']:
                        formatted_data[col] = formatted_data[col].apply(lambda x: f"{x:.1f}" if pd.notna(x) else "")
                
                st.dataframe(formatted_data, use_container_width=True, height=300)
                
                # Download button for full results
                csv_data = filtered_data.to_csv(index=False)
                st.download_button(
                    label="📄 Download Full Results",
                    data=csv_data,
                    file_name="filter_preview_results.csv",
                    mime="text/csv",
                    help="Download all matching records"
                )
            else:
                st.info("ℹ️ No matching records found in the sample data.")
                
        except Exception as e:
            st.error(f"❌ Error applying filter: {str(e)}")
            st.error(f"Error details: {traceback.format_exc()}")
    
    def get_example_filters(self) -> dict:
        """
        Get example filter templates
        
        Returns:
            dict: Dictionary of example filter templates
        """
        return self.example_filters
    
    def render_example_selector(self) -> None:
        """Render example filter selector"""
        example_categories = {
            "Basic Filters": self.example_filters["basic_filters"],
            "Technical Indicators": self.example_filters["technical_indicators"],
            "Complex Patterns": self.example_filters["complex_patterns"],
            "Volume Analysis": self.example_filters["volume_analysis"]
        }
        
        selected_category = st.selectbox(
            "Select Category",
            list(example_categories.keys())
        )
        
        selected_example = st.selectbox(
            "Select Example",
            list(example_categories[selected_category].keys())
        )
        
        # Display selected example
        example_data = example_categories[selected_category][selected_example]
        
        st.code(
            json.dumps(example_data, indent=2),
            language="json",
            height=200
        )
        
        # Copy button
        if st.button("📋 Copy to Editor"):
            st.session_state['copied_json'] = json.dumps(example_data, indent=2)
            st.success("✅ Example copied to editor!")
    
    def render_json_structure_help(self) -> None:
        """Render JSON structure help information"""
        with st.expander("📚 JSON Structure Guide", expanded=False):
            st.markdown("""
            ### Basic JSON Filter Structure
            
            ```json
            {
              "logic": "AND",  // or "OR"
              "conditions": [
                {
                  "left": {
                    "type": "column",  // or "indicator" or "constant"
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
            ```
            
            ### Operand Types
            
            1. **Column**: Reference to data column
               - `type`: "column"
               - `name`: Column name (required)
               - `timeframe`: "daily", "weekly", "intraday" (optional)
               - `offset`: Time offset (default: 0)
            
            2. **Indicator**: Technical indicator calculation
               - `type`: "indicator"
               - `name`: Indicator name (required)
               - `column`: Base column (required)
               - `params`: Indicator parameters (array)
               - `timeframe`: Timeframe (optional)
               - `offset`: Time offset (default: 0)
            
            3. **Constant**: Fixed value
               - `type`: "constant"
               - `value`: Numeric value (required)
            
            ### Supported Operators
            
            - `>`, `<`, `>=`, `<=`, `==`, `!=`
            
            ### Supported Indicators
            
            - `sma`: Simple Moving Average
            - `ema`: Exponential Moving Average
            """)
    
    def _load_example_filters(self) -> dict:
        """Load example filter templates"""
        return {
            "basic_filters": {
                "Price Above $100": {
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
                },
                "Price Increase": {
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
                                "type": "column",
                                "name": "close",
                                "timeframe": "daily",
                                "offset": -1
                            }
                        }
                    ]
                },
                "High Volume": {
                    "logic": "AND",
                    "conditions": [
                        {
                            "left": {
                                "type": "column",
                                "name": "volume",
                                "timeframe": "daily",
                                "offset": 0
                            },
                            "operator": ">",
                            "right": {
                                "type": "constant",
                                "value": 1000000
                            }
                        }
                    ]
                }
            },
            "technical_indicators": {
                "Golden Cross": {
                    "logic": "AND",
                    "conditions": [
                        {
                            "left": {
                                "type": "indicator",
                                "name": "sma",
                                "params": [50],
                                "column": "close",
                                "timeframe": "daily",
                                "offset": 0
                            },
                            "operator": ">",
                            "right": {
                                "type": "indicator",
                                "name": "sma",
                                "params": [200],
                                "column": "close",
                                "timeframe": "daily",
                                "offset": 0
                            }
                        }
                    ]
                },
                "RSI Overbought": {
                    "logic": "AND",
                    "conditions": [
                        {
                            "left": {
                                "type": "indicator",
                                "name": "rsi",
                                "params": [14],
                                "column": "close",
                                "timeframe": "daily",
                                "offset": 0
                            },
                            "operator": ">",
                            "right": {
                                "type": "constant",
                                "value": 70.0
                            }
                        }
                    ]
                },
                "RSI Oversold": {
                    "logic": "AND",
                    "conditions": [
                        {
                            "left": {
                                "type": "indicator",
                                "name": "rsi",
                                "params": [14],
                                "column": "close",
                                "timeframe": "daily",
                                "offset": 0
                            },
                            "operator": "<",
                            "right": {
                                "type": "constant",
                                "value": 30.0
                            }
                        }
                    ]
                }
            },
            "complex_patterns": {
                "Bullish Confirmation": {
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
                                "type": "indicator",
                                "name": "sma",
                                "params": [20],
                                "column": "close",
                                "timeframe": "daily",
                                "offset": 0
                            }
                        },
                        {
                            "left": {
                                "type": "indicator",
                                "name": "rsi",
                                "params": [14],
                                "column": "close",
                                "timeframe": "daily",
                                "offset": 0
                            },
                            "operator": ">",
                            "right": {
                                "type": "constant",
                                "value": 50.0
                            }
                        },
                        {
                            "left": {
                                "type": "column",
                                "name": "volume",
                                "timeframe": "daily",
                                "offset": 0
                            },
                            "operator": ">",
                            "right": {
                                "type": "indicator",
                                "name": "sma",
                                "params": [20],
                                "column": "volume",
                                "timeframe": "daily",
                                "offset": 0
                            }
                        }
                    ]
                },
                "OR Logic Example": {
                    "logic": "OR",
                    "conditions": [
                        {
                            "left": {
                                "type": "indicator",
                                "name": "rsi",
                                "params": [14],
                                "column": "close",
                                "timeframe": "daily",
                                "offset": 0
                            },
                            "operator": "<",
                            "right": {
                                "type": "constant",
                                "value": 30.0
                            }
                        },
                        {
                            "left": {
                                "type": "column",
                                "name": "close",
                                "timeframe": "daily",
                                "offset": 0
                            },
                            "operator": "<",
                            "right": {
                                "type": "indicator",
                                "name": "sma",
                                "params": [50],
                                "column": "close",
                                "timeframe": "daily",
                                "offset": 0
                            }
                        }
                    ]
                }
            },
            "volume_analysis": {
                "Volume Breakout": {
                    "logic": "AND",
                    "conditions": [
                        {
                            "left": {
                                "type": "column",
                                "name": "volume",
                                "timeframe": "daily",
                                "offset": 0
                            },
                            "operator": ">",
                            "right": {
                                "type": "indicator",
                                "name": "sma",
                                "params": [50],
                                "column": "volume",
                                "timeframe": "daily",
                                "offset": 0
                            }
                        },
                        {
                            "left": {
                                "type": "column",
                                "name": "close",
                                "timeframe": "daily",
                                "offset": 0
                            },
                            "operator": ">",
                            "right": {
                                "type": "indicator",
                                "name": "sma",
                                "params": [20],
                                "column": "close",
                                "timeframe": "daily",
                                "offset": 0
                            }
                        }
                    ]
                },
                "High Volume Spike": {
                    "logic": "AND",
                    "conditions": [
                        {
                            "left": {
                                "type": "column",
                                "name": "volume",
                                "timeframe": "daily",
                                "offset": 0
                            },
                            "operator": ">",
                            "right": {
                                "type": "indicator",
                                "name": "sma",
                                "params": [20],
                                "column": "volume",
                                "timeframe": "daily",
                                "offset": 0
                            }
                        },
                        {
                            "left": {
                                "type": "column",
                                "name": "volume",
                                "timeframe": "daily",
                                "offset": 0
                            },
                            "operator": ">",
                            "right": {
                                "type": "constant",
                                "value": 2000000
                            }
                        }
                    ]
                }
            }
        }
    
    def _perform_additional_validations(self, json_data: dict) -> None:
        """Perform additional validation beyond schema"""
        conditions = json_data.get("conditions", [])
        
        if not conditions:
            st.warning("⚠️ No conditions specified in filter")
            return
        
        # Check for empty conditions
        empty_conditions = [i for i, cond in enumerate(conditions) 
                          if not cond.get('left') or not cond.get('operator') or not cond.get('right')]
        
        if empty_conditions:
            st.warning(f"⚠️ Empty conditions found at indices: {empty_conditions}")
        
        # Check for duplicate operators in same condition
        for i, condition in enumerate(conditions):
            left = condition.get('left', {})
            right = condition.get('right', {})
            
            if left.get('type') == 'constant' and right.get('type') == 'constant':
                st.info(f"ℹ️ Condition {i+1}: Comparing two constants")
    
    def _display_condition_details(self, condition: dict) -> None:
        """Display detailed information about a condition"""
        left = condition.get('left', {})
        right = condition.get('right', {})
        operator = condition.get('operator', 'UNKNOWN')
        
        st.write(f"**Operator:** `{operator}`")
        
        # Left operand details
        st.write("**Left Operand:**")
        st.write(f"- Type: `{left.get('type', 'UNKNOWN')}`")
        if left.get('type') == 'column':
            st.write(f"- Column: `{left.get('name', 'UNKNOWN')}`")
            st.write(f"- Timeframe: `{left.get('timeframe', 'daily')}`")
            st.write(f"- Offset: `{left.get('offset', 0)}`")
        elif left.get('type') == 'indicator':
            st.write(f"- Indicator: `{left.get('name', 'UNKNOWN')}`")
            st.write(f"- Column: `{left.get('column', 'UNKNOWN')}`")
            st.write(f"- Parameters: `{left.get('params', [])}`")
            st.write(f"- Timeframe: `{left.get('timeframe', 'daily')}`")
            st.write(f"- Offset: `{left.get('offset', 0)}`")
        elif left.get('type') == 'constant':
            st.write(f"- Value: `{left.get('value', 'UNKNOWN')}`")
        
        # Right operand details
        st.write("**Right Operand:**")
        st.write(f"- Type: `{right.get('type', 'UNKNOWN')}`")
        if right.get('type') == 'column':
            st.write(f"- Column: `{right.get('name', 'UNKNOWN')}`")
            st.write(f"- Timeframe: `{right.get('timeframe', 'daily')}`")
            st.write(f"- Offset: `{right.get('offset', 0)}`")
        elif right.get('type') == 'indicator':
            st.write(f"- Indicator: `{right.get('name', 'UNKNOWN')}`")
            st.write(f"- Column: `{right.get('column', 'UNKNOWN')}`")
            st.write(f"- Parameters: `{right.get('params', [])}`")
            st.write(f"- Timeframe: `{right.get('timeframe', 'daily')}`")
            st.write(f"- Offset: `{right.get('offset', 0)}`")
        elif right.get('type') == 'constant':
            st.write(f"- Value: `{right.get('value', 'UNKNOWN')}`")