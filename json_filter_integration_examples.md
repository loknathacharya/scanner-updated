# JSON-Based Filtering System Integration Examples

## Overview

This document provides comprehensive integration examples for the JSON-Based Filtering System. These examples demonstrate how to seamlessly integrate the JSON filtering capabilities into the main stock scanner application, including UI integration, data processing workflows, and advanced use cases.

## Integration Architecture

### Key Integration Points

1. **Main Application Integration**: Replace existing filter builders with JSON filter option
2. **UI Integration**: Add JSON editor interface to the Build Filters tab
3. **Data Processing Pipeline**: Integrate JSON filters into the data processing workflow
4. **Result Display**: Handle JSON filter results in the results display
5. **Filter Management**: Save and load JSON filters with existing filter system

## Integration Example 1: Main Application Integration

### Complete Integration Code

```python
import streamlit as st
import pandas as pd
import json
from typing import Dict, Any, Optional, Tuple
from json_filter_parser import JSONFilterParser
from operand_calculator import OperandCalculator
from advanced_filter_engine import AdvancedFilterEngine
from json_filter_ui import JSONFilterUI

class IntegratedFilterSystem:
    """Integrated filter system combining JSON and traditional filters."""
    
    def __init__(self):
        self.parser = JSONFilterParser()
        self.filter_engine = AdvancedFilterEngine()
        self.json_ui = JSONFilterUI()
        self.filter_cache = {}
    
    def render_build_filters_tab(self, data: pd.DataFrame) -> Optional[pd.DataFrame]:
        """
        Render the Build Filters tab with integrated filter options.
        
        Args:
            data (pd.DataFrame): Processed data for filtering
            
        Returns:
            Optional[pd.DataFrame]: Filtered data or None if no filter applied
        """
        st.header("🔍 Build Filters")
        
        # Filter type selection
        filter_type = st.radio(
            "Filter Type",
            ["JSON Filter", "Pre-built Templates", "Custom Filter"],
            horizontal=True,
            key="filter_type"
        )
        
        filtered_data = None
        
        if filter_type == "JSON Filter":
            filtered_data = self._render_json_filter_section(data)
        elif filter_type == "Pre-built Templates":
            filtered_data = self._render_template_filter_section(data)
        elif filter_type == "Custom Filter":
            filtered_data = self._render_custom_filter_section(data)
        
        return filtered_data
    
    def _render_json_filter_section(self, data: pd.DataFrame) -> Optional[pd.DataFrame]:
        """Render JSON filter section with full integration."""
        st.subheader("📋 JSON Filter Editor")
        
        # Create two columns for layout
        col1, col2 = st.columns([2, 1])
        
        with col1:
            # JSON editor
            json_data = self.json_ui.render_json_editor()
            
            if json_data is not None:
                # Show validation feedback
                self.json_ui.render_validation_feedback(json_data)
                
                # Apply filter button
                if st.button("🔍 Apply JSON Filter", type="primary"):
                    with st.spinner("Applying filter..."):
                        filtered_data = self.apply_json_filter(data, json_data)
                        return filtered_data
        
        with col2:
            # Example filters
            st.write("💡 Example Filters")
            examples = self.json_ui.get_example_filters()
            
            for category, filters in examples.items():
                with st.expander(category.replace("_", " ").title()):
                    for name, filter_json in filters.items():
                        if st.button(f"📄 {name}", key=f"example_{name}"):
                            # Load example into editor
                            st.session_state.json_editor = json.dumps(filter_json, indent=2)
                            st.rerun()
        
        return None
    
    def _render_template_filter_section(self, data: pd.DataFrame) -> Optional[pd.DataFrame]:
        """Render pre-built template filter section."""
        st.subheader("📋 Pre-built Template Filters")
        
        # Define template filters
        template_filters = {
            "Momentum Filters": {
                "Price Above SMA(20)": "close > sma_20",
                "Strong Momentum": "close > sma_5 AND volume > volume_sma_20 * 1.5",
                "Breakout Pattern": "close > high_20 AND volume > volume_sma_50 * 2"
            },
            "Mean Reversion Filters": {
                "RSI Oversold": "rsi < 30 AND close > sma_5",
                "Bollinger Band Support": "close < bb_lower AND rsi > 40",
                "Deep Value": "close < sma_200 AND pe_ratio < 15"
            },
            "Volume Analysis": {
                "Volume Spike": "volume > volume_sma_20 * 3",
                "Accumulation": "volume > volume_sma_50 * 1.5 AND close > close_1d",
                "Distribution": "volume > volume_sma_50 * 2 AND close < close_1d"
            }
        }
        
        selected_filter = None
        
        for category, filters in template_filters.items():
            with st.expander(category):
                for name, filter_string in filters.items():
                    if st.button(f"📄 {name}", key=f"template_{name}"):
                        selected_filter = filter_string
        
        if selected_filter and st.button("🔍 Apply Template Filter", type="primary"):
            with st.spinner("Applying template filter..."):
                # Convert template filter to JSON format
                json_filter = self._convert_template_to_json(selected_filter)
                filtered_data = self.apply_json_filter(data, json_filter)
                return filtered_data
        
        return None
    
    def _render_custom_filter_section(self, data: pd.DataFrame) -> Optional[pd.DataFrame]:
        """Render custom filter section (existing functionality)."""
        st.subheader("📋 Custom Filter Builder")
        
        # This would use the existing custom filter builder
        # For demonstration, we'll show a simple interface
        st.info("Custom filter builder functionality remains unchanged.")
        
        # Example of how to integrate with existing system
        custom_filter = st.text_input(
            "Enter custom filter expression",
            placeholder="e.g., close > 100 AND volume > 1000000",
            key="custom_filter"
        )
        
        if custom_filter and st.button("🔍 Apply Custom Filter", type="primary"):
            with st.spinner("Applying custom filter..."):
                # Use existing filter engine
                from filters_module import FilterEngine
                filter_engine = FilterEngine()
                filtered_data = filter_engine.apply_filter(data, custom_filter)
                return filtered_data
        
        return None
    
    def apply_json_filter(self, data: pd.DataFrame, json_filter: Dict[str, Any]) -> pd.DataFrame:
        """
        Apply JSON filter with caching and error handling.
        
        Args:
            data (pd.DataFrame): Input data
            json_filter (Dict[str, Any]): JSON filter
            
        Returns:
            pd.DataFrame: Filtered data
        """
        try:
            # Generate cache key
            import hashlib
            filter_str = json.dumps(json_filter, sort_keys=True)
            cache_key = hashlib.md5(filter_str.encode()).hexdigest()
            
            # Check cache
            if cache_key in self.filter_cache:
                st.info("📦 Using cached filter result")
                return self.filter_cache[cache_key]
            
            # Apply filter
            filtered_data = self.filter_engine.apply_filter(data, json_filter)
            
            # Cache result
            self.filter_cache[cache_key] = filtered_data
            
            # Store in session state for later use
            st.session_state.current_filter = json_filter
            st.session_state.current_filter_type = "JSON"
            
            return filtered_data
            
        except Exception as e:
            st.error(f"❌ Error applying JSON filter: {str(e)}")
            return data.copy()
    
    def _convert_template_to_json(self, filter_string: str) -> Dict[str, Any]:
        """Convert template filter string to JSON format."""
        # This is a simplified conversion - in practice, you'd need a more sophisticated parser
        # For now, we'll create a simple JSON filter
        
        # Basic conversion logic
        if ">" in filter_string and "sma" in filter_string:
            return {
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
                    }
                ]
            }
        else:
            # Default to a simple price filter
            return {
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

# Integration in main application
def main():
    """Main application with integrated filter system."""
    st.set_page_config(page_title="Stock Scanner", layout="wide")
    
    # Initialize integrated filter system
    filter_system = IntegratedFilterSystem()
    
    # Session state initialization
    if 'processed_data' not in st.session_state:
        st.session_state.processed_data = None
    if 'scan_results' not in st.session_state:
        st.session_state.scan_results = None
    
    # Sidebar
    with st.sidebar:
        st.header("📊 Stock Scanner")
        
        # Data upload section
        st.subheader("📁 Upload Data")
        uploaded_file = st.file_uploader(
            "Choose CSV/Excel file",
            type=['csv', 'xlsx', 'xls'],
            key="uploaded_file"
        )
        
        if uploaded_file is not None:
            # Process uploaded file
            with st.spinner("Processing data..."):
                data = process_uploaded_file(uploaded_file)
                st.session_state.processed_data = data
                st.success(f"✅ Loaded {len(data)} records")
        
        # Data info
        if st.session_state.processed_data is not None:
            df = st.session_state.processed_data
            st.metric("Total Records", len(df))
            st.metric("Unique Symbols", df['symbol'].nunique())
    
    # Main content
    if st.session_state.processed_data is None:
        st.info("👆 Please upload data to get started")
    else:
        # Create tabs
        tab1, tab2, tab3 = st.tabs(["🔍 Build Filters", "📊 View Results", "💾 Save/Load"])
        
        with tab1:
            # Build filters tab
            filtered_data = filter_system.render_build_filters_tab(st.session_state.processed_data)
            
            if filtered_data is not None:
                st.session_state.scan_results = filtered_data
                st.success(f"✅ Found {len(filtered_data)} matching records")
        
        with tab2:
            # View results tab
            if st.session_state.scan_results is not None:
                display_results(st.session_state.scan_results)
            else:
                st.info("👆 Apply a filter to see results")
        
        with tab3:
            # Save/Load filters tab
            render_save_load_tab()

def process_uploaded_file(uploaded_file):
    """Process uploaded file and return DataFrame."""
    # Implementation would go here
    # For demonstration, return sample data
    return pd.DataFrame({
        'date': pd.date_range('2020-01-01', periods=1000, freq='D'),
        'symbol': ['AAPL'] * 1000,
        'open': [100 + i for i in range(1000)],
        'high': [105 + i for i in range(1000)],
        'low': [95 + i for i in range(1000)],
        'close': [102 + i for i in range(1000)],
        'volume': [1000000 + i * 10000 for i in range(1000)]
    })

def display_results(results):
    """Display filter results."""
    st.subheader("📊 Filter Results")
    
    # Results summary
    col1, col2, col3 = st.columns(3)
    with col1:
        st.metric("Total Matches", len(results))
    with col2:
        st.metric("Unique Symbols", results['symbol'].nunique())
    with col3:
        st.metric("Date Range", f"{results['date'].min().date()} to {results['date'].max().date()}")
    
    # Data display
    st.write("### Matching Records")
    
    # Column selector
    available_columns = ['date', 'symbol', 'open', 'high', 'low', 'close', 'volume']
    selected_columns = st.multiselect(
        "Select columns to display",
        available_columns,
        default=['date', 'symbol', 'close', 'volume']
    )
    
    # Display data
    display_data = results[selected_columns].copy()
    st.dataframe(display_data, use_container_width=True)
    
    # Export options
    st.write("### Export Results")
    col1, col2 = st.columns(2)
    
    with col1:
        csv = display_data.to_csv(index=False)
        st.download_button(
            label="📄 Download CSV",
            data=csv,
            file_name=f"filter_results_{pd.Timestamp.now().strftime('%Y%m%d_%H%M%S')}.csv",
            mime="text/csv"
        )
    
    with col2:
        # Excel download would go here
        st.info("Excel export coming soon!")

def render_save_load_tab():
    """Render save/load filters tab."""
    st.subheader("💾 Save/Load Filters")
    
    # Save current filter
    if st.session_state.get('current_filter') is not None:
        filter_name = st.text_input("Filter name", key="filter_name")
        
        if st.button("💾 Save Filter", type="primary"):
            if filter_name:
                # Save filter to session state
                if 'saved_filters' not in st.session_state:
                    st.session_state.saved_filters = {}
                
                st.session_state.saved_filters[filter_name] = st.session_state.current_filter
                st.success(f"✅ Filter '{filter_name}' saved!")
            else:
                st.error("❌ Please enter a filter name")
    
    # Load saved filters
    if 'saved_filters' in st.session_state and st.session_state.saved_filters:
        st.write("### Saved Filters")
        
        for name, filter_data in st.session_state.saved_filters.items():
            col1, col2 = st.columns([3, 1])
            
            with col1:
                if st.button(f"📋 {name}", key=f"load_{name}"):
                    # Load filter
                    st.session_state.current_filter = filter_data
                    st.session_state.current_filter_type = "JSON"
                    st.success(f"✅ Loaded filter '{name}'")
                    st.rerun()
            
            with col2:
                if st.button("🗑️", key=f"delete_{name}"):
                    del st.session_state.saved_filters[name]
                    st.rerun()
    
    else:
        st.info("No saved filters yet.")

if __name__ == "__main__":
    main()
```

## Integration Example 2: Advanced Data Processing Pipeline

### Enhanced Data Processing with JSON Filters

```python
import pandas as pd
import numpy as np
from typing import Dict, List, Any, Optional, Callable
from concurrent.futures import ThreadPoolExecutor, as_completed
import time
from dataclasses import dataclass

@dataclass
class ProcessingStep:
    """Data processing step configuration."""
    name: str
    function: Callable
    parameters: Dict[str, Any]
    required_columns: List[str]
    optional: bool = False

class AdvancedDataProcessor:
    """Advanced data processor with JSON filter integration."""
    
    def __init__(self):
        self.filter_engine = AdvancedFilterEngine()
        self.parser = JSONFilterParser()
        self.processing_steps = self._define_processing_steps()
    
    def _define_processing_steps(self) -> List[ProcessingStep]:
        """Define data processing steps."""
        return [
            ProcessingStep(
                name="data_validation",
                function=self._validate_data,
                parameters={},
                required_columns=["date", "symbol", "close"],
                optional=False
            ),
            ProcessingStep(
                name="data_optimization",
                function=self._optimize_data_types,
                parameters={},
                required_columns=[],
                optional=False
            ),
            ProcessingStep(
                name="indicator_calculation",
                function=self._calculate_indicators,
                parameters={"indicators": ["sma", "ema", "rsi", "macd"]},
                required_columns=["close", "volume"],
                optional=False
            ),
            ProcessingStep(
                name="pre_filtering",
                function=self._apply_pre_filters,
                parameters={},
                required_columns=[],
                optional=True
            ),
            ProcessingStep(
                name="json_filtering",
                function=self._apply_json_filter,
                parameters={},
                required_columns=[],
                optional=True
            ),
            ProcessingStep(
                name="post_processing",
                function=self._post_process_results,
                parameters={},
                required_columns=[],
                optional=False
            )
        ]
    
    def process_data_pipeline(self, 
                            data: pd.DataFrame,
                            json_filter: Optional[Dict[str, Any]] = None,
                            pre_filters: Optional[List[str]] = None,
                            parallel: bool = True) -> Dict[str, Any]:
        """
        Process data through the complete pipeline with JSON filter integration.
        
        Args:
            data (pd.DataFrame): Input data
            json_filter (Optional[Dict[str, Any]]): JSON filter to apply
            pre_filters (Optional[List[str]]): Pre-filters to apply before JSON filter
            parallel (bool): Whether to process in parallel
            
        Returns:
            Dict[str, Any]: Processing results including filtered data and metrics
        """
        start_time = time.time()
        
        # Initialize processing context
        context = {
            "original_data": data.copy(),
            "current_data": data.copy(),
            "json_filter": json_filter,
            "pre_filters": pre_filters or [],
            "processing_log": [],
            "error_log": [],
            "performance_metrics": {}
        }
        
        try:
            # Execute processing steps
            for step in self.processing_steps:
                step_start = time.time()
                
                try:
                    # Check if step should be executed
                    should_execute = self._should_execute_step(step, context)
                    
                    if should_execute:
                        # Prepare step parameters
                        step_params = self._prepare_step_parameters(step, context)
                        
                        # Execute step
                        if parallel and step.optional:
                            # Execute optional steps in parallel
                            result = self._execute_step_parallel(step, context, step_params)
                        else:
                            # Execute step sequentially
                            result = step.function(context["current_data"], **step_params)
                        
                        # Update context
                        if isinstance(result, pd.DataFrame):
                            context["current_data"] = result
                        elif isinstance(result, dict):
                            context.update(result)
                        
                        # Log step execution
                        step_time = time.time() - step_start
                        context["processing_log"].append({
                            "step": step.name,
                            "status": "completed",
                            "execution_time": step_time,
                            "rows_before": len(context["current_data"]) if step.name != "data_validation" else None,
                            "rows_after": len(context["current_data"]) if step.name != "data_validation" else None
                        })
                        
                except Exception as e:
                    # Handle step errors
                    error_msg = f"Error in step '{step.name}': {str(e)}"
                    context["error_log"].append(error_msg)
                    context["processing_log"].append({
                        "step": step.name,
                        "status": "failed",
                        "error": error_msg,
                        "execution_time": time.time() - step_start
                    })
                    
                    # Handle critical errors
                    if not step.optional:
                        raise RuntimeError(f"Critical processing step failed: {error_msg}")
            
            # Calculate final performance metrics
            total_time = time.time() - start_time
            context["performance_metrics"] = {
                "total_processing_time": total_time,
                "final_row_count": len(context["current_data"]),
                "filter_efficiency": len(context["current_data"]) / len(data) * 100 if len(data) > 0 else 0,
                "steps_completed": len([log for log in context["processing_log"] if log["status"] == "completed"]),
                "steps_failed": len([log for log in context["processing_log"] if log["status"] == "failed"])
            }
            
            return {
                "success": True,
                "data": context["current_data"],
                "context": context
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "context": context
            }
    
    def _should_execute_step(self, step: ProcessingStep, context: Dict[str, Any]) -> bool:
        """Determine if a processing step should be executed."""
        # Always execute required steps
        if not step.optional:
            return True
        
        # Execute optional steps based on context
        if step.name == "pre_filtering" and context["pre_filters"]:
            return True
        
        if step.name == "json_filtering" and context["json_filter"]:
            return True
        
        return False
    
    def _prepare_step_parameters(self, step: ProcessingStep, context: Dict[str, Any]) -> Dict[str, Any]:
        """Prepare parameters for a processing step."""
        params = step.parameters.copy()
        
        # Add context-specific parameters
        if step.name == "json_filtering":
            params["json_filter"] = context["json_filter"]
        
        return params
    
    def _execute_step_parallel(self, step: ProcessingStep, context: Dict[str, Any], params: Dict[str, Any]) -> Any:
        """Execute a processing step in parallel."""
        # This is a simplified parallel execution
        # In practice, you might use multiprocessing or distributed processing
        return step.function(context["current_data"], **params)
    
    def _validate_data(self, data: pd.DataFrame) -> pd.DataFrame:
        """Validate input data."""
        if data.empty:
            raise ValueError("Input data is empty")
        
        # Check required columns
        required_columns = ["date", "symbol", "close"]
        missing_columns = [col for col in required_columns if col not in data.columns]
        
        if missing_columns:
            raise ValueError(f"Missing required columns: {missing_columns}")
        
        # Check data types
        if not pd.api.types.is_datetime64_any_dtype(data['date']):
            try:
                data['date'] = pd.to_datetime(data['date'])
            except Exception as e:
                raise ValueError(f"Invalid date format: {str(e)}")
        
        # Remove duplicates
        initial_rows = len(data)
        data = data.drop_duplicates(subset=['date', 'symbol'])
        removed_rows = initial_rows - len(data)
        
        if removed_rows > 0:
            print(f"Removed {removed_rows} duplicate records")
        
        return data
    
    def _optimize_data_types(self, data: pd.DataFrame) -> pd.DataFrame:
        """Optimize data types for better performance."""
        optimized_data = data.copy()
        
        # Optimize numeric columns
        for col in optimized_data.select_dtypes(include=['int64']).columns:
            optimized_data[col] = pd.to_numeric(optimized_data[col], downcast='integer')
        
        for col in optimized_data.select_dtypes(include=['float64']).columns:
            optimized_data[col] = pd.to_numeric(optimized_data[col], downcast='float')
        
        # Optimize object columns
        for col in optimized_data.select_dtypes(include=['object']).columns:
            if optimized_data[col].nunique() / len(optimized_data) < 0.5:
                optimized_data[col] = optimized_data[col].astype('category')
        
        return optimized_data
    
    def _calculate_indicators(self, data: pd.DataFrame, indicators: List[str]) -> pd.DataFrame:
        """Calculate technical indicators."""
        from indicators_module import TechnicalIndicators
        
        indicator_calculator = TechnicalIndicators()
        result_data = data.copy()
        
        for indicator in indicators:
            try:
                if indicator == "sma":
                    # Calculate multiple SMA periods
                    for period in [5, 10, 20, 50, 200]:
                        col_name = f"sma_{period}"
                        result_data[col_name] = data['close'].rolling(window=period).mean()
                
                elif indicator == "ema":
                    # Calculate multiple EMA periods
                    for period in [12, 26, 50]:
                        col_name = f"ema_{period}"
                        result_data[col_name] = data['close'].ewm(span=period).mean()
                
                elif indicator == "rsi":
                    # Calculate RSI
                    col_name = "rsi"
                    result_data[col_name] = self._calculate_rsi(data['close'])
                
                elif indicator == "macd":
                    # Calculate MACD
                    macd_data = self._calculate_macd(data['close'])
                    result_data = result_data.join(macd_data)
                
            except Exception as e:
                print(f"Warning: Could not calculate {indicator}: {str(e)}")
        
        return result_data
    
    def _apply_pre_filters(self, data: pd.DataFrame) -> pd.DataFrame:
        """Apply pre-filters before JSON filtering."""
        # This would apply simple string-based filters
        # For demonstration, we'll just return the data
        return data
    
    def _apply_json_filter(self, data: pd.DataFrame, json_filter: Dict[str, Any]) -> pd.DataFrame:
        """Apply JSON filter to data."""
        return self.filter_engine.apply_filter(data, json_filter)
    
    def _post_process_results(self, data: pd.DataFrame) -> pd.DataFrame:
        """Post-process filtered results."""
        # Sort by date and symbol
        if 'date' in data.columns:
            data = data.sort_values(['symbol', 'date'])
        
        # Add calculated columns
        data['price_change_pct'] = data.groupby('symbol')['close'].pct_change()
        data['volume_change_pct'] = data.groupby('symbol')['volume'].pct_change()
        
        return data
    
    def _calculate_rsi(self, prices: pd.Series, period: int = 14) -> pd.Series:
        """Calculate RSI indicator."""
        delta = prices.diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
        rs = gain / loss
        rsi = 100 - (100 / (1 + rs))
        return rsi
    
    def _calculate_macd(self, prices: pd.Series, fast: int = 12, slow: int = 26, signal: int = 9) -> pd.DataFrame:
        """Calculate MACD indicator."""
        ema_fast = prices.ewm(span=fast).mean()
        ema_slow = prices.ewm(span=slow).mean()
        macd_line = ema_fast - ema_slow
        signal_line = macd_line.ewm(span=signal).mean()
        histogram = macd_line - signal_line
        
        return pd.DataFrame({
            'macd': macd_line,
            'macd_signal': signal_line,
            'macd_histogram': histogram
        })

# Usage example
def advanced_processing_example():
    """Example of advanced data processing with JSON filters."""
    # Create sample data
    data = pd.DataFrame({
        'date': pd.date_range('2020-01-01', periods=10000, freq='D'),
        'symbol': np.random.choice(['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'META'], 10000),
        'open': np.random.uniform(50, 500, 10000),
        'high': np.random.uniform(50, 500, 10000),
        'low': np.random.uniform(50, 500, 10000),
        'close': np.random.uniform(50, 500, 10000),
        'volume': np.random.uniform(1000000, 10000000, 10000)
    })
    
    # Define JSON filter
    json_filter = {
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
                    "value": 200.0
                }
            },
            {
                "left": {
                    "type": "indicator",
                    "name": "sma",
                    "params": [20],
                    "column": "close",
                    "timeframe": "daily",
                    "offset": 0
                },
                "operator": ">",
                "right": {
                    "type": "constant",
                    "value": 0.0
                }
            }
        ]
    }
    
    # Process data
    processor = AdvancedDataProcessor()
    result = processor.process_data_pipeline(
        data=data,
        json_filter=json_filter,
        pre_filters=["volume > 1000000"],
        parallel=True
    )
    
    if result["success"]:
        print(f"✅ Processing completed successfully")
        print(f"📊 Results: {len(result['data'])} rows filtered")
        print(f"⏱️ Total time: {result['context']['performance_metrics']['total_processing_time']:.2f} seconds")
        
        # Display processing log
        print("\n📋 Processing Log:")
        for log in result['context']['processing_log']:
            status_icon = "✅" if log['status'] == 'completed' else "❌"
            print(f"{status_icon} {log['step']}: {log['status']} ({log['execution_time']:.3f}s)")
    else:
        print(f"❌ Processing failed: {result['error']}")
```

## Integration Example 3: Batch Processing with Multiple Filters

### Batch Processing System

```python
import asyncio
import aiofiles
import json
from typing import List, Dict, Any, Optional
from concurrent.futures import ThreadPoolExecutor, as_completed
import time
from pathlib import Path

class BatchFilterProcessor:
    """Batch processor for applying multiple JSON filters to large datasets."""
    
    def __init__(self, max_workers: int = 4):
        self.max_workers = max_workers
        self.filter_engine = AdvancedFilterEngine()
        self.parser = JSONFilterParser()
        self.results_cache = {}
    
    def process_batch_filters(self,
                            data: pd.DataFrame,
                            filter_configs: List[Dict[str, Any]],
                            output_dir: str = "batch_results") -> Dict[str, Any]:
        """
        Process multiple filters in batch.
        
        Args:
            data (pd.DataFrame): Input data
            filter_configs (List[Dict[str, Any]]): List of filter configurations
            output_dir (str): Directory to save results
            
        Returns:
            Dict[str, Any]: Batch processing results
        """
        start_time = time.time()
        
        # Create output directory
        Path(output_dir).mkdir(exist_ok=True)
        
        # Prepare batch processing context
        batch_context = {
            "total_filters": len(filter_configs),
            "completed_filters": 0,
            "failed_filters": 0,
            "total_rows_processed": 0,
            "results": {},
            "performance_metrics": {},
            "errors": []
        }
        
        # Process filters in parallel
        with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
            # Submit all filter tasks
            future_to_filter = {
                executor.submit(self._process_single_filter, data, filter_config, output_dir): filter_config
                for filter_config in filter_configs
            }
            
            # Process completed tasks
            for future in as_completed(future_to_filter):
                filter_config = future_to_filter[future]
                filter_name = filter_config.get("name", f"filter_{batch_context['completed_filters'] + 1}")
                
                try:
                    result = future.result()
                    batch_context["results"][filter_name] = result
                    batch_context["completed_filters"] += 1
                    batch_context["total_rows_processed"] += result.get("row_count", 0)
                    
                    print(f"✅ Completed {filter_name}: {result.get('row_count', 0)} rows")
                    
                except Exception as e:
                    error_msg = f"Error processing {filter_name}: {str(e)}"
                    batch_context["errors"].append(error_msg)
                    batch_context["failed_filters"] += 1
                    print(f"❌ {error_msg}")
                
                # Update progress
                progress = (batch_context["completed_filters"] + batch_context["failed_filters"]) / batch_context["total_filters"] * 100
                print(f"📊 Progress: {progress:.1f}% ({batch_context['completed_filters'] + batch_context['failed_filters']}/{batch_context['total_filters']})")
        
        # Calculate final metrics
        total_time = time.time() - start_time
        batch_context["performance_metrics"] = {
            "total_processing_time": total_time,
            "average_time_per_filter": total_time / batch_context["total_filters"] if batch_context["total_filters"] > 0 else 0,
            "filters_per_second": batch_context["total_filters"] / total_time if total_time > 0 else 0,
            "total_rows_processed": batch_context["total_rows_processed"],
            "success_rate": batch_context["completed_filters"] / batch_context["total_filters"] * 100 if batch_context["total_filters"] > 0 else 0
        }
        
        # Save batch results
        self._save_batch_results(batch_context, output_dir)
        
        return batch_context
    
    def _process_single_filter(self,
                             data: pd.DataFrame,
                             filter_config: Dict[str, Any],
                             output_dir: str) -> Dict[str, Any]:
        """Process a single filter with detailed logging."""
        filter_name = filter_config.get("name", "unnamed_filter")
        json_filter = filter_config.get("filter")
        
        start_time = time.time()
        
        try:
            # Validate JSON filter
            is_valid, error_msg = self.parser.validate_json(json_filter)
            if not is_valid:
                raise ValueError(f"Invalid JSON filter: {error_msg}")
            
            # Apply filter
            filtered_data = self.filter_engine.apply_filter(data, json_filter)
            
            # Calculate metrics
            processing_time = time.time() - start_time
            row_count = len(filtered_data)
            
            # Prepare result
            result = {
                "filter_name": filter_name,
                "row_count": row_count,
                "processing_time": processing_time,
                "efficiency": row_count / len(data) * 100 if len(data) > 0 else 0,
                "success": True,
                "data_summary": {
                    "date_range": {
                        "start": filtered_data['date'].min().isoformat() if 'date' in filtered_data.columns else None,
                        "end": filtered_data['date'].max().isoformat() if 'date' in filtered_data.columns else None
                    },
                    "unique_symbols": filtered_data['symbol'].nunique() if 'symbol' in filtered_data.columns else 0,
                    "columns": list(filtered_data.columns)
                }
            }
            
            # Save individual result
            self._save_individual_result(filtered_data, filter_name, output_dir)
            
            return result
            
        except Exception as e:
            processing_time = time.time() - start_time
            return {
                "filter_name": filter_name,
                "row_count": 0,
                "processing_time": processing_time,
                "efficiency": 0,
                "success": False,
                "error": str(e),
                "error_type": type(e).__name__
            }
    
    def _save_individual_result(self,
                              data: pd.DataFrame,
                              filter_name: str,
                              output_dir: str) -> None:
        """Save individual filter result."""
        # Sanitize filter name for filename
        safe_name = "".join(c for c in filter_name if c.isalnum() or c in (' ', '-', '_')).rstrip()
        filename = f"{safe_name}_{int(time.time())}.csv"
        filepath = Path(output_dir) / filename
        
        # Save data
        data.to_csv(filepath, index=False)
        
        # Save metadata
        metadata = {
            "filter_name": filter_name,
            "row_count": len(data),
            "columns": list(data.columns),
            "saved_at": time.time(),
            "file_path": str(filepath)
        }
        
        metadata_path = Path(output_dir) / f"{safe_name}_metadata.json"
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)
    
    def _save_batch_results(self,
                          batch_context: Dict[str, Any],
                          output_dir: str) -> None:
        """Save batch processing results."""
        # Save summary
        summary_path = Path(output_dir) / "batch_summary.json"
        with open(summary_path, 'w') as f:
            json.dump(batch_context, f, indent=2)
        
        # Save detailed results
        detailed_results = []
        for filter_name, result in batch_context["results"].items():
            detailed_results.append({
                "filter_name": filter_name,
                "result": result
            })
        
        detailed_path = Path(output_dir) / "detailed_results.json"
        with open(detailed_path, 'w') as f:
            json.dump(detailed_results, f, indent=2)
        
        # Generate report
        self._generate_batch_report(batch_context, output_dir)
    
    def _generate_batch_report(self,
                             batch_context: Dict[str, Any],
                             output_dir: str) -> None:
        """Generate batch processing report."""
        report_path = Path(output_dir) / "batch_report.md"
        
        with open(report_path, 'w') as f:
            f.write("# Batch Processing Report\n\n")
            
            # Summary
            f.write("## Summary\n\n")
            f.write(f"- **Total Filters**: {batch_context['total_filters']}\n")
            f.write(f"- **Completed**: {batch_context['completed_filters']}\n")
            f.write(f"- **Failed**: {batch_context['failed_filters']}\n")
            f.write(f"- **Success Rate**: {batch_context['performance_metrics']['success_rate']:.1f}%\n")
            f.write(f"- **Total Rows Processed**: {batch_context['total_rows_processed']:,}\n")
            f.write(f"- **Total Processing Time**: {batch_context['performance_metrics']['total_processing_time']:.2f}s\n")
            f.write(f"- **Average Time per Filter**: {batch_context['performance_metrics']['average_time_per_filter']:.2f}s\n\n")
            
            # Performance metrics
            f.write("## Performance Metrics\n\n")
            metrics = batch_context['performance_metrics']
            f.write(f"- **Filters per Second**: {metrics['filters_per_second']:.2f}\n")
            f.write(f"- **Total Processing Time**: {metrics['total_processing_time']:.2f}s\n")
            f.write(f"- **Average Time per Filter**: {metrics['average_time_per_filter']:.2f}s\n\n")
            
            # Individual results
            f.write("## Individual Filter Results\n\n")
            for filter_name, result in batch_context["results"].items():
                status = "✅" if result['success'] else "❌"
                f.write(f"### {status} {filter_name}\n")
                f.write(f"- **Rows**: {result['row_count']:,}\n")
                f.write(f"- **Processing Time**: {result['processing_time']:.2f}s\n")
                f.write(f"- **Efficiency**: {result['efficiency']:.1f}%\n")
                
                if not result['success']:
                    f.write(f"- **Error**: {result.get('error', 'Unknown error')}\n")
                
                f.write("\n")
            
            # Errors
            if batch_context['errors']:
                f.write("## Errors\n\n")
                for error in batch_context['errors']:
                    f.write(f"- {error}\n")
                f.write("\n")

# Usage example
def batch_processing_example():
    """Example of batch processing with multiple JSON filters."""
    # Create sample data
    data = pd.DataFrame({
        'date': pd.date_range('2020-01-01', periods=5000, freq='D'),
        'symbol': np.random.choice(['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'META'], 5000),
        'open': np.random.uniform(50, 500, 5000),
        'high': np.random.uniform(50, 500, 5000),
        'low': np.random.uniform(50, 500, 5000),
        'close': np.random.uniform(50, 500, 5000),
        'volume': np.random.uniform(1000000, 10000000, 5000)
    })
    
    # Define filter configurations
    filter_configs = [
        {
            "name": "High Price Stocks",
            "filter": {
                "logic": "AND",
                "conditions": [
                    {
                        "left": {"type": "column", "name": "close", "offset": 0},
                        "operator": ">",
                        "right": {"type": "constant", "value": 300.0}
                    }
                ]
            }
        },
        {
            "name": "Momentum Stocks",
            "filter": {
                "logic": "AND",
                "conditions": [
                    {
                        "left": {"type": "column", "name": "close", "offset": 0},
                        "operator": ">",
                        "right": {"type": "column", "name": "close", "offset": -5}
                    },
                    {
                        "left": {"type": "column", "name": "volume", "offset": 0},
                        "operator": ">",
                        "right": {"type": "constant", "value": 5000000}
                    }
                ]
            }
        },
        {
            "name": "RSI Overbought",
            "filter": {
                "logic": "AND",
                "conditions": [
                    {
                        "left": {"type": "indicator", "name": "rsi", "params": [14], "column": "close", "offset": 0},
                        "operator": ">",
                        "right": {"type": "constant", "value": 70.0}
                    }
                ]
            }
        },
        {
            "name": "Golden Cross",
            "filter": {
                "logic": "AND",
                "conditions": [
                    {
                        "left": {"type": "indicator", "name": "sma", "params": [50], "column": "close", "offset": 0},
                        "operator": ">",
                        "right": {"type": "indicator", "name": "sma", "params": [200], "column": "close", "offset": 0}
                    }
                ]
            }
        }
    ]
    
    # Process batch
    processor = BatchFilterProcessor(max_workers=2)
    results = processor.process_batch_filters(
        data=data,
        filter_configs=filter_configs,
        output_dir="batch_results"
    )
    
    print(f"\n🎉 Batch processing completed!")
    print(f"📊 Results: {results['completed_filters']}/{results['total_filters']} filters successful")
    print(f"⏱️ Total time: {results['performance_metrics']['total_processing_time']:.2f}s")
    print(f"📈 Success rate: {results['performance_metrics']['success_rate']:.1f}%")
```

## Integration Example 4: Real-time Filter Monitoring

### Real-time Monitoring System

```python
import time
import threading
from typing import Dict, Any, List, Optional, Callable
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
from queue import Queue

class RealtimeFilterMonitor:
    """Real-time monitoring system for JSON filter performance."""
    
    def __init__(self, check_interval: int = 60):
        self.check_interval = check_interval
        self.monitoring_active = False
        self.monitoring_thread = None
        self.metrics_queue = Queue()
        self.alerts = []
        self.performance_thresholds = {
            "max_execution_time": 10.0,
            "max_memory_usage": 100.0,
            "min_filter_efficiency": 1.0,
            "max_error_rate": 0