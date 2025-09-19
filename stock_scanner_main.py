import streamlit as st
import pandas as pd
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import json
from datetime import datetime
import numpy as np
import traceback

# Import custom modules
from filters_module import FilterEngine
from indicators_module import TechnicalIndicators
from utils_module import DataProcessor
from ui_components_module import UIComponents
from json_filter_ui import JSONFilterUI
from advanced_filter_engine import AdvancedFilterEngine
from performance_optimizer import PerformanceOptimizer

# Page config
st.set_page_config(
    page_title="Stock Scanner & Filter App",
    page_icon="📊",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Initialize session state
if 'uploaded_data' not in st.session_state:
    st.session_state.uploaded_data = None
if 'processed_data' not in st.session_state:
    st.session_state.processed_data = None
if 'scan_results' not in st.session_state:
    st.session_state.scan_results = None
if 'saved_filters' not in st.session_state:
    st.session_state.saved_filters = {}
if 'current_filter' not in st.session_state:
    st.session_state.current_filter = None

# Initialize components
data_processor = DataProcessor()
filter_engine = FilterEngine()
ui_components = UIComponents()
json_filter_ui = JSONFilterUI()
advanced_filter_engine = AdvancedFilterEngine()
performance_optimizer = PerformanceOptimizer()

def main():
    st.title("📊 Stock Scanner & Filter App")
    st.markdown("Build custom filters and scan your OHLCV data efficiently")
    
    # Tabs
    tab1, tab2, tab3 = st.tabs(["📁 Upload Data", "🔧 Build Filters", "📋 Results"])
    
    with tab1:
        upload_data_tab()
    
    with tab2:
        build_filters_tab()
    
    with tab3:
        results_tab()
    
    # Sidebar
    with st.sidebar:
        sidebar_content()

def upload_data_tab():
    st.header("📁 Upload OHLCV Data")
    
    uploaded_file = st.file_uploader(
        "Choose a file", 
        type=['csv', 'xlsx', 'parquet'],
        help="Upload CSV, Excel, or Parquet files containing OHLCV data"
    )
    
    if uploaded_file is not None:
        try:
            # Load data
            with st.spinner("Loading data..."):
                df = data_processor.load_file(uploaded_file)
                st.session_state.uploaded_data = df
            
            st.success(f"✅ File loaded successfully! Shape: {df.shape}")
            
            # Column detection and mapping
            st.subheader("🔍 Column Detection")
            detected_cols = data_processor.detect_columns(df)
            
            col1, col2 = st.columns(2)
            
            with col1:
                st.write("**Detected Columns:**")
                for col_type, col_name in detected_cols.items():
                    if col_name:
                        st.write(f"• {col_type.title()}: `{col_name}`")
            
            with col2:
                st.write("**Manual Column Selection:**")
                date_col = st.selectbox("Date Column", df.columns, index=list(df.columns).index(detected_cols['date'] or df.columns[0]) if detected_cols.get('date') in df.columns else 0)
                symbol_col = st.selectbox("Symbol Column", df.columns, index=list(df.columns).index(detected_cols['symbol'] or df.columns[1]) if detected_cols.get('symbol') in df.columns else 0)
            
            # Process data
            if st.button("🚀 Process Data"):
                with st.spinner("Processing data and calculating indicators..."):
                    processed_df = data_processor.process_data(
                        df, date_col, symbol_col, detected_cols
                    )
                    st.session_state.processed_data = processed_df
                    st.success("✅ Data processed successfully!")
            
            # Preview
            st.subheader("👀 Data Preview")
            preview_df = df.head(20)
            st.dataframe(preview_df, use_container_width=True)
            
            # Summary stats
            st.subheader("📊 Summary Statistics")
            numeric_cols = df.select_dtypes(include=[np.number]).columns
            if len(numeric_cols) > 0:
                st.dataframe(df[numeric_cols].describe(), use_container_width=True)
                
        except Exception as e:
            st.error(f"❌ Error loading file: {str(e)}")

def build_filters_tab():
    st.header("🔧 Build Filters")
    
    if st.session_state.processed_data is None:
        st.warning("⚠️ Please upload and process data first in the Upload Data tab.")
        return
    
    df = st.session_state.processed_data
    
    # Filter type selection
    filter_type = st.radio(
        "Filter Type",
        ["Pre-built Templates", "Custom Filter", "JSON Filter"],
        horizontal=True
    )
    
    if filter_type == "Pre-built Templates":
        template_filters(df)
    elif filter_type == "Custom Filter":
        custom_filters(df)
    else:
        json_filter_tab(df)

def template_filters(df):
    st.subheader("📋 Pre-built Filter Templates")
    
    templates = {
        "Price Above SMA(20)": "close > sma_20",
        "High Volume (2x Average)": "volume > volume_sma_20 * 2",
        "RSI Overbought": "rsi > 70",
        "RSI Oversold": "rsi < 30",
        "MACD Bullish": "macd > macd_signal",
        "Bollinger Upper Break": "close > bb_upper",
        "Bollinger Lower Break": "close < bb_lower",
        "Price Near 52W High": "close > high_52w * 0.95",
        "Volume Breakout": "volume > volume_sma_50 * 1.5 AND close > sma_50"
    }
    
    selected_template = st.selectbox("Select Template", list(templates.keys()))
    
    # Date range selection for templates
    st.subheader("📅 Date Range Selection")
    col1, col2 = st.columns(2)
    
    with col1:
        start_date = st.date_input(
            "Start Date",
            value=df['date'].min() if 'date' in df.columns else None,
            min_value=df['date'].min() if 'date' in df.columns else None,
            max_value=df['date'].max() if 'date' in df.columns else None
        )
    
    with col2:
        end_date = st.date_input(
            "End Date",
            value=df['date'].max() if 'date' in df.columns else None,
            min_value=df['date'].min() if 'date' in df.columns else None,
            max_value=df['date'].max() if 'date' in df.columns else None
        )
    
    # Convert to datetime if needed
    date_range = None
    if start_date and end_date:
        # Convert to timezone-aware datetime objects to match DataFrame timezone
        # This fixes the timezone mismatch error
        start_datetime = pd.to_datetime(start_date).tz_localize('UTC+05:30')
        end_datetime = pd.to_datetime(end_date).tz_localize('UTC+05:30')
        date_range = (start_datetime, end_datetime)
    
    if selected_template:
        st.code(templates[selected_template], language="python")
        
        if st.button("🔍 Apply Template Filter"):
            try:
                results = filter_engine.apply_filter(df, templates[selected_template], date_range)
                st.session_state.scan_results = results
                st.session_state.current_filter = templates[selected_template]
                st.session_state.date_range = date_range
                st.success(f"✅ Filter applied! Found {len(results)} matches.")
            except Exception as e:
                st.error(f"❌ Error applying filter: {str(e)}")

def custom_filters(df):
    st.subheader("⚙️ Custom Filter Builder")
    
    # Initialize filter conditions
    if 'filter_conditions' not in st.session_state:
        st.session_state.filter_conditions = []
    
    # Ensure backward compatibility for existing conditions
    for condition in st.session_state.filter_conditions:
        if 'value_type' not in condition:
            # Try to determine if value is a column name
            available_cols = [col for col in df.columns if col not in ['symbol', 'date']]
            if condition['value'] in available_cols:
                condition['value_type'] = 'column'
            else:
                condition['value_type'] = 'value'
    
    # Date range selection
    st.subheader("📅 Date Range Selection")
    col1, col2 = st.columns(2)
    
    with col1:
        start_date = st.date_input(
            "Start Date",
            value=df['date'].min() if 'date' in df.columns else None,
            min_value=df['date'].min() if 'date' in df.columns else None,
            max_value=df['date'].max() if 'date' in df.columns else None
        )
    
    with col2:
        end_date = st.date_input(
            "End Date",
            value=df['date'].max() if 'date' in df.columns else None,
            min_value=df['date'].min() if 'date' in df.columns else None,
            max_value=df['date'].max() if 'date' in df.columns else None
        )
    
    # Convert to datetime if needed
    date_range = None
    if start_date and end_date:
        # Convert to timezone-aware datetime objects to match DataFrame timezone
        # This fixes the timezone mismatch error
        start_datetime = pd.to_datetime(start_date).tz_localize('UTC+05:30')
        end_datetime = pd.to_datetime(end_date).tz_localize('UTC+05:30')
        date_range = (start_datetime, end_datetime)
    
    # Add condition button
    if st.button("➕ Add Condition"):
        st.session_state.filter_conditions.append({
            'column': 'close',
            'operator': '>',
            'value': '0',
            'value_type': 'value',
            'logic': 'AND'
        })
    
    # Display conditions
    conditions_to_remove = []
    for i, condition in enumerate(st.session_state.filter_conditions):
        col1, col2, col3, col4, col5, col6 = st.columns([2, 1, 1, 1, 1, 1])
        
        with col1:
            available_cols = [col for col in df.columns if col not in ['symbol', 'date']]
            condition['column'] = st.selectbox(
                "Column", available_cols,
                key=f"col_{i}",
                index=available_cols.index(condition['column']) if condition['column'] in available_cols else 0
            )
        
        with col2:
            operators = ['>', '<', '>=', '<=', '==', '!=', 'crosses_above', 'crosses_below']
            condition['operator'] = st.selectbox(
                "Operator", operators,
                key=f"op_{i}",
                index=operators.index(condition['operator']) if condition['operator'] in operators else 0
            )
        
        with col3:
            # Determine value type if not set
            if 'value_type' not in condition:
                # Try to determine if value is a column name
                if condition['value'] in available_cols:
                    condition['value_type'] = 'column'
                else:
                    condition['value_type'] = 'value'
            
            condition['value_type'] = st.selectbox(
                "Type", ['value', 'column'],
                key=f"val_type_{i}",
                index=0 if condition['value_type'] == 'value' else 1
            )
        
        with col4:
            if condition['value_type'] == 'column':
                # Show column selector
                condition['value'] = st.selectbox(
                    "Compare With", available_cols,
                    key=f"val_col_{i}",
                    index=available_cols.index(condition['value']) if condition['value'] in available_cols else 0
                )
            else:
                # Show value input
                condition['value'] = st.text_input(
                    "Value", value=condition['value'],
                    key=f"val_{i}",
                    help="Enter a number"
                )
        
        with col5:
            if i > 0:
                condition['logic'] = st.selectbox(
                    "Logic", ['AND', 'OR'],
                    key=f"logic_{i}",
                    index=['AND', 'OR'].index(condition['logic'])
                )
        
        with col6:
            if st.button("🗑️", key=f"remove_{i}", help="Remove condition"):
                conditions_to_remove.append(i)
    
    # Remove conditions
    for i in reversed(conditions_to_remove):
        st.session_state.filter_conditions.pop(i)
    
    # Build and apply filter
    if st.session_state.filter_conditions:
        filter_string = filter_engine.build_filter_string(st.session_state.filter_conditions)
        
        st.subheader("📝 Generated Filter")
        st.code(filter_string, language="python")
        
        col1, col2, col3 = st.columns(3)
        with col1:
            if st.button("🔍 Run Scan"):
                try:
                    results = filter_engine.apply_filter(df, filter_string, date_range)
                    st.session_state.scan_results = results
                    st.session_state.current_filter = filter_string
                    st.session_state.date_range = date_range
                    st.success(f"✅ Scan completed! Found {len(results)} matches.")
                except Exception as e:
                    st.error(f"❌ Error running scan: {str(e)}")
        
        with col2:
            filter_name = st.text_input("Filter Name", placeholder="My Custom Filter")
            if st.button("💾 Save Filter"):
                if filter_name:
                    st.session_state.saved_filters[filter_name] = filter_string
                    st.success(f"✅ Filter '{filter_name}' saved!")
                else:
                    st.warning("Please enter a filter name.")
        
        with col3:
            if st.button("🔄 Reset Filter"):
                st.session_state.filter_conditions = []
                st.success("✅ Filter reset successfully!")
                st.rerun()

def json_filter_tab(df):
    """JSON Filter interface with validation and preview"""
    st.subheader("🔧 JSON Filter Builder")
    
    # Date range selection
    st.subheader("📅 Date Range Selection")
    col1, col2 = st.columns(2)
    
    with col1:
        start_date = st.date_input(
            "Start Date",
            value=df['date'].min() if 'date' in df.columns else None,
            min_value=df['date'].min() if 'date' in df.columns else None,
            max_value=df['date'].max() if 'date' in df.columns else None
        )
    
    with col2:
        end_date = st.date_input(
            "End Date",
            value=df['date'].max() if 'date' in df.columns else None,
            min_value=df['date'].min() if 'date' in df.columns else None,
            max_value=df['date'].max() if 'date' in df.columns else None
        )
    
    # Convert to datetime if needed
    date_range = None
    if start_date and end_date:
        # Convert to timezone-aware datetime objects to match DataFrame timezone
        # This fixes the timezone mismatch error
        start_datetime = pd.to_datetime(start_date).tz_localize('UTC+05:30')
        end_datetime = pd.to_datetime(end_date).tz_localize('UTC+05:30')
        date_range = (start_datetime, end_datetime)
    
    # JSON Filter Editor
    json_data = json_filter_ui.render_json_editor()
    
    # Show validation feedback and preview even if json_data is None
    # This ensures they remain visible after saving
    if json_data is not None:
        # Store validated JSON in session state to preserve across re-renders
        st.session_state.last_validated_json = json_data
    
    # Use the last validated JSON if available
    display_json = st.session_state.get('last_validated_json', None) if json_data is None else json_data
    
    if display_json is not None:
        # Show validation feedback
        json_filter_ui.render_validation_feedback(display_json)
        
        # Show filter preview
        json_filter_ui.render_filter_preview(display_json, df)
        
        # Action buttons
        col1, col2, col3 = st.columns(3)
        with col1:
            if st.button("🔍 Apply JSON Filter", type="primary"):
                try:
                    # Apply filter using advanced filter engine
                    with st.spinner("Applying JSON filter..."):
                        filtered_data = advanced_filter_engine.apply_filter(df, display_json)
                        
                        # Apply date range filter if specified
                        if date_range and 'date' in df.columns:
                            start_date, end_date = date_range
                            
                            # DEBUG: Log datetime information for JSON filter
                            print("DEBUG: JSON Filter Date Range Processing:")
                            print(f"  - DataFrame date column dtype: {df['date'].dtype}")
                            print(f"  - DataFrame date sample: {df['date'].iloc[0] if len(df) > 0 else 'N/A'}")
                            print(f"  - Start date type: {type(start_date)}, value: {start_date}")
                            # Convert to timezone-aware datetime objects to match DataFrame timezone
                            # This fixes the timezone mismatch error
                            start_datetime = pd.to_datetime(start_date).tz_localize('UTC+05:30')
                            end_datetime = pd.to_datetime(end_date).tz_localize('UTC+05:30')
                            
                            print(f"DEBUG: Applying date range filter to filtered_data: {filtered_data['date'].dtype} >= {type(start_date)}")
                            filtered_data = filtered_data[
                                (filtered_data['date'] >= start_date) &
                                (filtered_data['date'] <= end_date)
                            ]
                    
                    # Store results in session state
                    st.session_state.scan_results = filtered_data
                    st.session_state.current_filter = display_json
                    st.session_state.date_range = date_range
                    st.success(f"✅ JSON filter applied! Found {len(filtered_data)} matches.")
                    
                except Exception as e:
                    st.error(f"❌ Error applying JSON filter: {str(e)}")
                    st.error(f"Error details: {traceback.format_exc()}")
        
        with col2:
            filter_name = st.text_input("Filter Name", placeholder="My JSON Filter",
                                       key="json_filter_name")
            if st.button("💾 Save JSON Filter"):
                if filter_name:
                    # Convert JSON to string for saving
                    filter_string = json.dumps(display_json, indent=2)
                    st.session_state.saved_filters[filter_name] = filter_string
                    st.success(f"✅ JSON filter '{filter_name}' saved!")
                    # Clear the filter name input after saving
                    st.session_state.json_filter_name = ""
                else:
                    st.warning("Please enter a filter name.")
        
        with col3:
            if st.button("🔄 Reset JSON Filter"):
                # Clear session state variables related to JSON filter
                if 'last_validated_json' in st.session_state:
                    del st.session_state.last_validated_json
                if 'json_filter_input' in st.session_state:
                    del st.session_state.json_filter_input
                st.success("✅ JSON filter reset successfully!")
                st.rerun()

def results_tab():
    st.header("📋 Scan Results")
    
    if st.session_state.scan_results is None:
        st.info("🔍 No scan results yet. Please run a filter in the Build Filters tab.")
        return
    
    results = st.session_state.scan_results
    
    if len(results) == 0:
        st.warning("❌ No matches found for the current filter.")
        return
    
    st.success(f"✅ Found {len(results)} matches")
    
    # Column selector
    all_columns = results.columns.tolist()
    default_columns = ['date', 'symbol', 'close', 'volume']
    default_columns = [col for col in default_columns if col in all_columns]
    
    selected_columns = st.multiselect(
        "Select Columns to Display",
        all_columns,
        default=default_columns,
        help="Choose which columns to show in the results table"
    )
    
    if selected_columns:
        # Display results
        display_df = results[selected_columns]
        
        # Interactive table
        st.subheader("📊 Results Table")
        
        # Add sorting options
        col1, col2 = st.columns(2)
        with col1:
            sort_by = st.selectbox("Sort by", selected_columns, index=0)
        with col2:
            ascending = st.checkbox("Ascending", value=False)
        
        sorted_df = display_df.sort_values(sort_by, ascending=ascending)
        
        # Display with pagination
        page_size = st.slider("Rows per page", 10, 100, 25)
        total_pages = len(sorted_df) // page_size + (1 if len(sorted_df) % page_size > 0 else 0)
        
        if total_pages > 1:
            page = st.selectbox("Page", range(1, total_pages + 1))
            start_idx = (page - 1) * page_size
            end_idx = start_idx + page_size
            page_df = sorted_df.iloc[start_idx:end_idx]
        else:
            page_df = sorted_df
        
        st.dataframe(page_df, use_container_width=True)
        
        # Chart visualization
        if 'symbol' in results.columns:
            st.subheader("📈 Quick Chart")
            symbols = results['symbol'].unique()
            selected_symbol = st.selectbox("Select Symbol for Chart", symbols)
            
            if selected_symbol and st.session_state.processed_data is not None:
                chart_data = st.session_state.processed_data[
                    st.session_state.processed_data['symbol'] == selected_symbol
                ].sort_values('date')
                
                if len(chart_data) > 0:
                    fig = create_ohlc_chart(chart_data, selected_symbol)
                    st.plotly_chart(fig, use_container_width=True)
        
        # Download options
        st.subheader("⬇️ Export Results")
        col1, col2 = st.columns(2)
        
        with col1:
            csv = sorted_df.to_csv(index=False)
            st.download_button(
                label="📄 Download CSV",
                data=csv,
                file_name=f"scan_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv",
                mime="text/csv"
            )
        
        with col2:
            # Excel download
            excel_buffer = ui_components.create_excel_download(sorted_df)
            st.download_button(
                label="📊 Download Excel",
                data=excel_buffer,
                file_name=f"scan_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx",
                mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            )

def create_ohlc_chart(data, symbol):
    """Create OHLC chart with indicators"""
    fig = make_subplots(
        rows=2, cols=1,
        shared_xaxes=True,
        vertical_spacing=0.03,
        subplot_titles=(f'{symbol} - OHLC', 'Volume'),
        row_width=[0.7, 0.3]
    )
    
    # OHLC
    fig.add_trace(
        go.Candlestick(
            x=data['date'],
            open=data['open'],
            high=data['high'],
            low=data['low'],
            close=data['close'],
            name='OHLC'
        ),
        row=1, col=1
    )
    
    # Add SMA if available
    if 'sma_20' in data.columns:
        fig.add_trace(
            go.Scatter(
                x=data['date'],
                y=data['sma_20'],
                mode='lines',
                name='SMA(20)',
                line=dict(color='orange', width=1)
            ),
            row=1, col=1
        )
    
    # Volume
    fig.add_trace(
        go.Bar(
            x=data['date'],
            y=data['volume'],
            name='Volume',
            marker_color='lightblue'
        ),
        row=2, col=1
    )
    
    fig.update_layout(
        title=f'{symbol} Chart',
        xaxis_rangeslider_visible=False,
        height=600
    )
    
    return fig

def sidebar_content():
    st.sidebar.header("🛠️ Tools")
    
    # Data info
    if st.session_state.processed_data is not None:
        df = st.session_state.processed_data
        st.sidebar.success("✅ Data Loaded")
        st.sidebar.metric("Total Records", len(df))
        st.sidebar.metric("Unique Symbols", df['symbol'].nunique())
        st.sidebar.metric("Date Range", f"{df['date'].dt.date.min()} to {df['date'].dt.date.max()}")
    
    # Saved filters
    st.sidebar.subheader("💾 Saved Filters")
    if st.session_state.saved_filters:
        for name, filter_str in st.session_state.saved_filters.items():
            col1, col2 = st.sidebar.columns([3, 1])
            with col1:
                if st.button(f"📋 {name}", key=f"load_{name}"):
                    if st.session_state.processed_data is not None:
                        try:
                            # Use the last applied date range if available
                            date_range = st.session_state.get('date_range', None)
                            
                            # Check if it's a JSON filter (starts with {)
                            if filter_str.strip().startswith('{'):
                                # Parse JSON filter
                                json_data = json.loads(filter_str)
                                results = advanced_filter_engine.apply_filter(st.session_state.processed_data, json_data)
                                
                                # Apply date range filter if specified
                                if date_range and 'date' in st.session_state.processed_data.columns:
                                    start_date, end_date = date_range
                                    results = results[
                                        (results['date'] >= start_date) &
                                        (results['date'] <= end_date)
                                    ]
                            else:
                                # Apply regular filter
                                results = filter_engine.apply_filter(st.session_state.processed_data, filter_str, date_range)
                            
                            st.session_state.scan_results = results
                            st.session_state.current_filter = filter_str
                            st.success(f"✅ Applied '{name}' - Found {len(results)} matches.")
                        except Exception as e:
                            st.error(f"❌ Error: {str(e)}")
            with col2:
                if st.button("🗑️", key=f"del_{name}"):
                    del st.session_state.saved_filters[name]
                    st.rerun()
    else:
        st.sidebar.info("No saved filters yet.")
    
    # Export/Import filters
    st.sidebar.subheader("🔄 Import/Export")
    
    # Export filters
    if st.session_state.saved_filters:
        filters_json = json.dumps(st.session_state.saved_filters, indent=2)
        st.sidebar.download_button(
            "📤 Export Filters",
            data=filters_json,
            file_name="saved_filters.json",
            mime="application/json"
        )
    
    # Import filters
    uploaded_filters = st.sidebar.file_uploader(
        "📥 Import Filters",
        type=['json'],
        help="Upload a JSON file with saved filters"
    )
    
    if uploaded_filters is not None:
        try:
            imported_filters = json.load(uploaded_filters)
            st.session_state.saved_filters.update(imported_filters)
            st.sidebar.success(f"✅ Imported {len(imported_filters)} filters!")
        except Exception as e:
            st.sidebar.error(f"❌ Error importing: {str(e)}")

if __name__ == "__main__":
    main()