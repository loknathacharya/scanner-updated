import streamlit as st
import pandas as pd
import plotly.graph_objects as go
import plotly.express as px
from plotly.subplots import make_subplots
import io
from typing import List, Dict, Any, Optional
import numpy as np
# Remove unused import that's causing issues

class UIComponents:
    """Reusable UI components for the stock scanner app"""
    
    def __init__(self):
        self.colors = {
            'primary': '#1f77b4',
            'secondary': '#ff7f0e',
            'success': '#2ca02c',
            'danger': '#d62728',
            'warning': '#ff9800',
            'info': '#17a2b8',
            'light': '#f8f9fa',
            'dark': '#343a40'
        }
    
    def create_metric_cards(self, metrics: Dict[str, Any]) -> None:
        """Create metric cards for key statistics"""
        cols = st.columns(len(metrics))
        
        for i, (label, value) in enumerate(metrics.items()):
            with cols[i]:
                if isinstance(value, (int, float)):
                    if isinstance(value, float):
                        display_value = f"{value:.2f}"
                    else:
                        display_value = f"{value:,}"
                else:
                    display_value = str(value)
                
                st.metric(label=label, value=display_value)
    
    def create_filter_condition_row(self, index: int, condition: Dict[str, Any], 
                                   available_columns: List[str]) -> tuple[Dict[str, Any], bool]:
        """Create a row for filter condition input"""
        col1, col2, col3, col4, col5 = st.columns([2, 1, 2, 1, 1])
        
        updated_condition = condition.copy()
        
        with col1:
            updated_condition['column'] = st.selectbox(
                "Column", 
                available_columns,
                index=available_columns.index(condition['column']) if condition['column'] in available_columns else 0,
                key=f"filter_col_{index}"
            )
        
        with col2:
            operators = ['>', '<', '>=', '<=', '==', '!=', 'crosses_above', 'crosses_below']
            updated_condition['operator'] = st.selectbox(
                "Operator", 
                operators,
                index=operators.index(condition['operator']) if condition['operator'] in operators else 0,
                key=f"filter_op_{index}"
            )
        
        with col3:
            updated_condition['value'] = st.text_input(
                "Value", 
                value=str(condition['value']),
                key=f"filter_val_{index}",
                help="Enter a number or column name"
            )
        
        with col4:
            if index > 0:
                updated_condition['logic'] = st.selectbox(
                    "Logic", 
                    ['AND', 'OR'],
                    index=['AND', 'OR'].index(condition.get('logic', 'AND')),
                    key=f"filter_logic_{index}"
                )
        
        with col5:
            remove_clicked = st.button("🗑️", key=f"remove_filter_{index}", help="Remove condition")
        
        return updated_condition, remove_clicked
    
    def create_data_preview_table(self, df: pd.DataFrame, max_rows: int = 20) -> None:
        """Create a formatted data preview table"""
        if df.empty:
            st.warning("No data to display")
            return
        
        # Show basic info
        st.write(f"**Shape:** {df.shape[0]:,} rows × {df.shape[1]} columns")
        
        # Display sample data
        preview_df = df.head(max_rows)
        
        # Format numeric columns for display
        numeric_columns = preview_df.select_dtypes(include=[np.number]).columns
        formatted_df = preview_df.copy()
        
        for col in numeric_columns:
            if col in ['volume']:
                formatted_df[col] = formatted_df[col].apply(lambda x: f"{x:,.0f}" if pd.notna(x) else "")
            elif col in ['open', 'high', 'low', 'close']:
                formatted_df[col] = formatted_df[col].apply(lambda x: f"{x:.2f}" if pd.notna(x) else "")
            elif col.startswith(('sma_', 'ema_', 'bb_')):
                formatted_df[col] = formatted_df[col].apply(lambda x: f"{x:.2f}" if pd.notna(x) else "")
            elif col in ['rsi', 'stoch_k', 'stoch_d']:
                formatted_df[col] = formatted_df[col].apply(lambda x: f"{x:.1f}" if pd.notna(x) else "")
        
        st.dataframe(formatted_df, use_container_width=True, height=400)
    
    def create_results_table(self, df: pd.DataFrame, selected_columns: List[str], 
                           sortable: bool = True, paginated: bool = True) -> pd.DataFrame:
        """Create an interactive results table"""
        if df.empty or not selected_columns:
            st.info("No data to display")
            return df
        
        display_df = df[selected_columns].copy()
        
        # Sorting options
        if sortable and len(selected_columns) > 0:
            col1, col2, col3 = st.columns([2, 1, 1])
            
            with col1:
                sort_column = st.selectbox("Sort by", selected_columns)
            
            with col2:
                sort_order = st.selectbox("Order", ["Descending", "Ascending"])
            
            with col3:
                st.write("")  # Spacer
                apply_sort = st.button("Apply Sort")
            
            if apply_sort and sort_column:
                ascending = sort_order == "Ascending"
                display_df = display_df.sort_values(sort_column, ascending=ascending)
        
        # Pagination
        if paginated and len(display_df) > 25:
            col1, col2 = st.columns([1, 3])
            
            with col1:
                page_size = st.selectbox("Rows per page", [10, 25, 50, 100], index=1)
            
            total_pages = (len(display_df) - 1) // page_size + 1
            
            with col2:
                if total_pages > 1:
                    page_num = st.selectbox("Page", range(1, total_pages + 1))
                    start_idx = (page_num - 1) * page_size
                    end_idx = min(start_idx + page_size, len(display_df))
                    display_df = display_df.iloc[start_idx:end_idx]
        
        # Display table
        st.dataframe(display_df, use_container_width=True)
        
        return display_df
    
    def create_candlestick_chart(self, data: pd.DataFrame, symbol: str, 
                               indicators: Optional[List[str]] = None) -> go.Figure:
        """Create an interactive candlestick chart with indicators"""
        if data.empty:
            return go.Figure()
        
        # Sort by date
        data = data.sort_values('date')
        
        # Create subplots
        subplot_titles = [f'{symbol} - OHLC']
        specs = [[{"secondary_y": True}]]
        
        # Add volume subplot if volume data exists
        if 'volume' in data.columns:
            subplot_titles.append('Volume')
            specs.append([{"secondary_y": False}])
        
        fig = make_subplots(
            rows=len(specs), cols=1,
            shared_xaxes=True,
            vertical_spacing=0.03,
            subplot_titles=subplot_titles,
            specs=specs,
            row_width=[0.7, 0.3] if len(specs) > 1 else [1.0]
        )
        
        # Main OHLC candlestick
        fig.add_trace(
            go.Candlestick(
                x=data['date'],
                open=data['open'],
                high=data['high'],
                low=data['low'],
                close=data['close'],
                name='OHLC',
                increasing_line_color='#26a69a',
                decreasing_line_color='#ef5350'
            ),
            row=1, col=1
        )
        
        # Add indicators
        if indicators:
            colors = ['orange', 'purple', 'brown', 'pink', 'gray', 'olive']
            color_index = 0
            
            for indicator in indicators:
                if indicator in data.columns:
                    # Determine if indicator should be on main chart or separate
                    if indicator.startswith(('sma_', 'ema_', 'bb_')):
                        # Price-based indicators go on main chart
                        fig.add_trace(
                            go.Scatter(
                                x=data['date'],
                                y=data[indicator],
                                mode='lines',
                                name=indicator.upper(),
                                line=dict(color=colors[color_index % len(colors)], width=1),
                                opacity=0.8
                            ),
                            row=1, col=1
                        )
                    elif indicator in ['rsi', 'stoch_k', 'stoch_d', 'williams_r']:
                        # Oscillators go on secondary y-axis
                        fig.add_trace(
                            go.Scatter(
                                x=data['date'],
                                y=data[indicator],
                                mode='lines',
                                name=indicator.upper(),
                                line=dict(color=colors[color_index % len(colors)], width=1),
                                yaxis='y2'
                            ),
                            row=1, col=1
                        )
                    
                    color_index += 1
        
        # Add volume if available
        if 'volume' in data.columns and len(specs) > 1:
            colors = ['green' if close >= open else 'red' 
                     for close, open in zip(data['close'], data['open'])]
            
            fig.add_trace(
                go.Bar(
                    x=data['date'],
                    y=data['volume'],
                    name='Volume',
                    marker_color=colors,
                    opacity=0.7
                ),
                row=2, col=1
            )
        
        # Update layout
        fig.update_layout(
            title=f'{symbol} Chart Analysis',
            xaxis_rangeslider_visible=False,
            height=600 if len(specs) > 1 else 500,
            showlegend=True,
            legend=dict(
                orientation="h",
                yanchor="bottom",
                y=1.02,
                xanchor="right",
                x=1
            )
        )
        
        # Update y-axes
        fig.update_yaxes(title_text="Price", row=1, col=1)
        if len(specs) > 1:
            fig.update_yaxes(title_text="Volume", row=2, col=1)
        
        return fig
    
    def create_performance_chart(self, data: pd.DataFrame, metric: str = 'close') -> go.Figure:
        """Create a performance comparison chart"""
        if data.empty or 'symbol' not in data.columns:
            return go.Figure()
        
        fig = go.Figure()
        
        # Calculate performance for each symbol
        for symbol, group in data.groupby('symbol'):
            group = group.sort_values('date')
            if len(group) > 1 and metric in group.columns:
                # Calculate cumulative return
                returns = group[metric].pct_change().fillna(0)
                cumulative_return = (1 + returns).cumprod() - 1
                
                fig.add_trace(
                    go.Scatter(
                        x=group['date'],
                        y=cumulative_return * 100,
                        mode='lines',
                        name=symbol,
                        line=dict(width=2)
                    )
                )
        
        fig.update_layout(
            title='Performance Comparison (Cumulative Returns %)',
            xaxis_title='Date',
            yaxis_title='Cumulative Return (%)',
            hovermode='x unified',
            height=400
        )
        
        return fig
    
    def create_correlation_heatmap(self, data: pd.DataFrame, columns: List[str]) -> go.Figure:
        """Create a correlation heatmap"""
        if data.empty or len(columns) < 2:
            return go.Figure()
        
        # Calculate correlation matrix
        available_cols = [col for col in columns if col in data.columns]
        if len(available_cols) < 2:
            return go.Figure()
        
        corr_matrix = data[available_cols].corr()
        
        fig = go.Figure(data=go.Heatmap(
            z=corr_matrix.values,
            x=corr_matrix.columns,
            y=corr_matrix.columns,
            colorscale='RdBu',
            zmid=0,
            text=corr_matrix.round(2).values,
            texttemplate="%{text}",
            textfont={"size": 10},
            hoverongaps=False
        ))
        
        fig.update_layout(
            title='Correlation Heatmap',
            height=400,
            width=400
        )
        
        return fig
    
    def create_distribution_chart(self, data: pd.DataFrame, column: str) -> go.Figure:
        """Create a distribution chart for a specific column"""
        if data.empty or column not in data.columns:
            return go.Figure()
        
        fig = go.Figure()
        
        # Histogram
        fig.add_trace(
            go.Histogram(
                x=data[column],
                nbinsx=30,
                name='Distribution',
                opacity=0.7
            )
        )
        
        fig.update_layout(
            title=f'Distribution of {column}',
            xaxis_title=column,
            yaxis_title='Frequency',
            height=300
        )
        
        return fig
    
    def create_excel_download(self, df: pd.DataFrame) -> bytes:
        """Create Excel file for download"""
        output = io.BytesIO()
        
        # Create a copy of the dataframe for Excel export
        excel_df = df.copy()
        
        # Convert timezone-aware datetime columns to timezone-naive for Excel compatibility
        for col in excel_df.columns:
            if pd.api.types.is_datetime64_any_dtype(excel_df[col]):
                if hasattr(excel_df[col].dt, 'tz') and excel_df[col].dt.tz is not None:
                    # Convert timezone-aware datetime to timezone-naive
                    excel_df[col] = excel_df[col].dt.tz_localize(None)
        
        try:
            # Try to use xlsxwriter for advanced formatting
            with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
                excel_df.to_excel(writer, sheet_name='Scan Results', index=False)
                workbook = writer.book
                worksheet = writer.sheets['Scan Results']
                # Ensure workbook is the xlsxwriter Workbook object
                # Check if workbook has add_format method (xlsxwriter)
                if hasattr(workbook, 'add_format'):
                    header_format = workbook.add_format({
                        'bold': True,
                        'text_wrap': True,
                        'valign': 'top',
                        'fg_color': '#4472C4',
                        'font_color': 'white',
                        'border': 1
                    })
                else:
                    # For openpyxl, use basic formatting
                    header_format = None
                for col_num, value in enumerate(excel_df.columns.values):
                    worksheet.write(0, col_num, value, header_format)
                for i, col in enumerate(excel_df.columns):
                    col_dtype = excel_df[col].dtype
                    if col_dtype in ['object']:
                        max_len = max(excel_df[col].astype(str).str.len().max(), len(str(col))) + 2
                    elif hasattr(pd, 'CategoricalDtype') and isinstance(col_dtype, pd.CategoricalDtype):
                        # If categorical and ordered, use max; else, use string length
                        if getattr(excel_df[col].dtype, 'ordered', False):
                            max_len = max(len(str(excel_df[col].max())), len(str(col))) + 2
                        else:
                            max_len = max(excel_df[col].astype(str).str.len().max(), len(str(col))) + 2
                    else:
                        max_len = max(len(str(excel_df[col].max())), len(str(col))) + 2
                    worksheet.set_column(i, i, min(max_len, 30))
                numeric_cols = excel_df.select_dtypes(include=[np.number]).columns
                # Create formats only once
                # Only create formats if using xlsxwriter
                pos_format = None
                neg_format = None
                if hasattr(workbook, 'add_format'):
                    pos_format = workbook.add_format({'bg_color': '#C6EFCE', 'font_color': '#006100'})
                    neg_format = workbook.add_format({'bg_color': '#FFC7CE', 'font_color': '#9C0006'})
                # Only apply conditional formatting if using xlsxwriter
                if pos_format and neg_format:
                    for col in numeric_cols:
                        col_index = excel_df.columns.get_loc(col)
                        if col in ['daily_return', 'return_5d', 'return_10d', 'return_20d']:
                            worksheet.conditional_format(1, col_index, len(excel_df), col_index, {
                                'type': 'cell',
                                'criteria': '>',
                                'value': 0,
                                'format': pos_format
                            })
                            worksheet.conditional_format(1, col_index, len(excel_df), col_index, {
                                'type': 'cell',
                                'criteria': '<',
                                'value': 0,
                                'format': neg_format
                            })
        except (ImportError, AttributeError):
            # Fallback to default Excel writer if xlsxwriter is not available
            st.warning("xlsxwriter not found. Using basic Excel export. For enhanced formatting, install xlsxwriter: pip install xlsxwriter")
            output = io.BytesIO()
            with pd.ExcelWriter(output, engine='openpyxl') as writer:
                excel_df.to_excel(writer, sheet_name='Scan Results', index=False)
        
        return output.getvalue()
    
    def create_summary_statistics_table(self, df: pd.DataFrame) -> None:
        """Create a summary statistics table"""
        if df.empty:
            st.info("No data available for summary statistics")
            return
        
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        if len(numeric_cols) == 0:
            st.info("No numeric columns found for summary statistics")
            return
        
        # Calculate statistics
        stats_df = df[numeric_cols].describe().round(2)
        
        # Add additional statistics
        additional_stats = pd.DataFrame({
            col: {
                'skew': df[col].skew(),
                'kurtosis': df[col].kurtosis(),
                'missing': df[col].isnull().sum(),
                'missing_pct': (df[col].isnull().sum() / len(df)) * 100
            } for col in numeric_cols
        }).round(2)
        
        # Combine statistics
        combined_stats = pd.concat([stats_df, additional_stats])
        
        st.subheader("📊 Summary Statistics")
        st.dataframe(combined_stats, use_container_width=True)
    
    def create_indicator_explanation_panel(self) -> None:
        """Create an expandable panel explaining technical indicators"""
        with st.expander("📚 Technical Indicators Explanation"):
            
            st.markdown("### Moving Averages")
            st.markdown("""
            - **SMA (Simple Moving Average)**: Average price over N periods
            - **EMA (Exponential Moving Average)**: Weighted average giving more importance to recent prices
            - **Usage**: Trend identification, support/resistance levels
            """)
            
            st.markdown("### Oscillators")
            st.markdown("""
            - **RSI (Relative Strength Index)**: Momentum oscillator (0-100)
                - Above 70: Overbought condition
                - Below 30: Oversold condition
            - **Stochastic %K/%D**: Compare closing price to price range
            - **Williams %R**: Similar to Stochastic but inverted scale
            """)
            
            st.markdown("### Trend Indicators")
            st.markdown("""
            - **MACD (Moving Average Convergence Divergence)**: Trend following momentum indicator
                - MACD Line: 12-EMA minus 26-EMA
                - Signal Line: 9-EMA of MACD line
                - Bullish when MACD > Signal Line
            """)
            
            st.markdown("### Volatility Indicators")
            st.markdown("""
            - **Bollinger Bands**: Price channels based on standard deviation
                - Upper Band: SMA + (2 × Standard Deviation)
                - Lower Band: SMA - (2 × Standard Deviation)
            - **ATR (Average True Range)**: Measure of volatility
            """)
    
    def create_filter_templates_showcase(self) -> None:
        """Create a showcase of available filter templates"""
        with st.expander("🎯 Filter Templates Showcase"):
            
            templates = {
                "Momentum Plays": [
                    "Price Above SMA(20)",
                    "High Volume (2x Average)",
                    "RSI > 50 AND Volume > Volume_SMA_20"
                ],
                "Oversold Opportunities": [
                    "RSI < 30",
                    "Price Near 52W Low",
                    "Bollinger Lower Break"
                ],
                "Breakout Patterns": [
                    "Price Breaking SMA(20)",
                    "Volume Breakout",
                    "Close > High_20 AND Volume > Volume_SMA_20 * 1.5"
                ],
                "Technical Signals": [
                    "MACD Bullish Crossover",
                    "Golden Cross (SMA 50 > SMA 200)",
                    "Bollinger Upper Break"
                ]
            }
            
            for category, filters in templates.items():
                st.markdown(f"**{category}**")
                for filter_desc in filters:
                    st.markdown(f"• {filter_desc}")
                st.markdown("")
    
    def create_data_quality_report(self, df: pd.DataFrame) -> None:
        """Create a data quality report"""
        if df.empty:
            st.warning("No data available for quality report")
            return
        
        with st.expander("🔍 Data Quality Report"):
            col1, col2 = st.columns(2)
            
            with col1:
                st.markdown("**Missing Data**")
                missing_data = df.isnull().sum()
                missing_pct = (missing_data / len(df)) * 100
                
                missing_df = pd.DataFrame({
                    'Column': missing_data.index,
                    'Missing Count': missing_data.values,
                    'Missing %': missing_pct.round(2)
                }).query('`Missing Count` > 0')
                
                if len(missing_df) > 0:
                    st.dataframe(missing_df, use_container_width=True)
                else:
                    st.success("✅ No missing data found")
            
            with col2:
                st.markdown("**Data Types**")
                dtype_df = pd.DataFrame({
                    'Column': df.dtypes.index,
                    'Data Type': df.dtypes.values.astype(str),
                    'Unique Values': [df[col].nunique() for col in df.columns]
                })
                st.dataframe(dtype_df, use_container_width=True)
            
            # Additional quality checks
            if 'symbol' in df.columns:
                st.markdown("**Symbol Coverage**")
                symbol_coverage = df.groupby('symbol').agg({
                    'date': ['count', 'min', 'max'],
                    'close': 'count'
                }).round(2)
                
                symbol_coverage.columns = ['Data Points', 'Start Date', 'End Date', 'Price Data']
                st.dataframe(symbol_coverage.head(10), use_container_width=True)
    
    def create_performance_metrics_dashboard(self, df: pd.DataFrame) -> None:
        """Create a performance metrics dashboard"""
        if df.empty or 'symbol' not in df.columns:
            return
        
        st.subheader("📈 Performance Metrics Dashboard")
        
        # Calculate key metrics for each symbol
        performance_metrics = []
        
        for symbol, group in df.groupby('symbol'):
            group = group.sort_values('date')
            if len(group) > 1:
                # Basic metrics
                latest_close = group['close'].iloc[-1]
                first_close = group['close'].iloc[0]
                total_return = (latest_close - first_close) / first_close * 100
                
                # Volatility
                daily_returns = group['close'].pct_change().dropna()
                volatility = daily_returns.std() * np.sqrt(252) * 100 if len(daily_returns) > 1 else 0
                
                # Max drawdown
                cumulative = (1 + daily_returns).cumprod()
                rolling_max = cumulative.expanding().max()
                drawdown = (cumulative - rolling_max) / rolling_max
                max_drawdown = drawdown.min() * 100 if len(drawdown) > 0 else 0
                
                performance_metrics.append({
                    'Symbol': symbol,
                    'Total Return (%)': round(total_return, 2),
                    'Volatility (%)': round(volatility, 2),
                    'Max Drawdown (%)': round(max_drawdown, 2),
                    'Latest Price': round(latest_close, 2),
                    'Data Points': len(group)
                })
        
        if performance_metrics:
            perf_df = pd.DataFrame(performance_metrics)
            
            # Display top performers
            col1, col2 = st.columns(2)
            
            with col1:
                st.markdown("**Top Performers (Total Return)**")
                top_performers = perf_df.nlargest(5, 'Total Return (%)')
                st.dataframe(top_performers[['Symbol', 'Total Return (%)']], 
                           use_container_width=True, hide_index=True)
            
            with col2:
                st.markdown("**Lowest Volatility**")
                low_vol = perf_df.nsmallest(5, 'Volatility (%)')
                st.dataframe(low_vol[['Symbol', 'Volatility (%)']], 
                           use_container_width=True, hide_index=True)
            
            # Full performance table
            st.markdown("**Complete Performance Table**")
            st.dataframe(perf_df, use_container_width=True, hide_index=True)
    
    def create_alert_system(self) -> None:
        """Create an alert configuration system"""
        with st.expander("🚨 Alert System (Future Feature)"):
            st.markdown("""
            **Planned Alert Features:**
            
            - **Price Alerts**: Get notified when a stock hits target price
            - **Technical Alerts**: Alerts based on indicator conditions
            - **Volume Alerts**: Unusual volume activity notifications
            - **Pattern Alerts**: Chart pattern recognition alerts
            
            **Alert Channels:**
            - Email notifications
            - Webhook integrations
            - Browser notifications
            
            *This feature will be available in a future update.*
            """)
    
    def create_export_options_panel(self, df: pd.DataFrame) -> None:
        """Create comprehensive export options"""
        if df.empty:
            return
        
        st.subheader("📤 Export Options")
        
        col1, col2, col3 = st.columns(3)
        
        with col1:
            # CSV Export
            csv_data = df.to_csv(index=False)
            st.download_button(
                label="📄 Download CSV",
                data=csv_data,
                file_name=f"scan_results_{pd.Timestamp.now().strftime('%Y%m%d_%H%M%S')}.csv",
                mime="text/csv",
                help="Download results as CSV file"
            )
        
        with col2:
            # Excel Export
            excel_data = self.create_excel_download(df)
            st.download_button(
                label="📊 Download Excel",
                data=excel_data,
                file_name=f"scan_results_{pd.Timestamp.now().strftime('%Y%m%d_%H%M%S')}.xlsx",
                mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                help="Download results as Excel file with formatting"
            )
        
        with col3:
            # JSON Export
            json_data = df.to_json(orient='records', date_format='iso', indent=2)
            st.download_button(
                label="🔧 Download JSON",
                data=json_data,
                file_name=f"scan_results_{pd.Timestamp.now().strftime('%Y%m%d_%H%M%S')}.json",
                mime="application/json",
                help="Download results as JSON file"
            )

class ChartComponents:
    """Specialized components for creating various chart types"""
    
    @staticmethod
    def create_technical_analysis_chart(data: pd.DataFrame, symbol: str) -> go.Figure:
        """Create comprehensive technical analysis chart"""
        if data.empty:
            return go.Figure()
        
        data = data.sort_values('date')
        
        # Create 4-row subplot
        fig = make_subplots(
            rows=4, cols=1,
            shared_xaxes=True,
            vertical_spacing=0.05,
            subplot_titles=(
                f'{symbol} - Price & Volume',
                'RSI',
                'MACD',
                'Stochastic'
            ),
            row_heights=[0.5, 0.2, 0.2, 0.1]
        )
        
        # Main price chart
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
        
        # Add moving averages if available
        for ma in ['sma_20', 'sma_50', 'ema_20']:
            if ma in data.columns:
                fig.add_trace(
                    go.Scatter(
                        x=data['date'],
                        y=data[ma],
                        mode='lines',
                        name=ma.upper(),
                        line=dict(width=1)
                    ),
                    row=1, col=1
                )
        
        # RSI
        if 'rsi' in data.columns:
            fig.add_trace(
                go.Scatter(
                    x=data['date'],
                    y=data['rsi'],
                    mode='lines',
                    name='RSI',
                    line=dict(color='purple')
                ),
                row=2, col=1
            )
            
            # Add RSI reference lines
            fig.add_hline(y=70, line_dash="dash", line_color="red")
            fig.add_hline(y=30, line_dash="dash", line_color="green")
        
        # MACD
        if all(col in data.columns for col in ['macd', 'macd_signal']):
            fig.add_trace(
                go.Scatter(
                    x=data['date'],
                    y=data['macd'],
                    mode='lines',
                    name='MACD',
                    line=dict(color='blue')
                ),
                row=3, col=1
            )
            
            fig.add_trace(
                go.Scatter(
                    x=data['date'],
                    y=data['macd_signal'],
                    mode='lines',
                    name='Signal',
                    line=dict(color='red')
                ),
                row=3, col=1
            )
            
            if 'macd_histogram' in data.columns:
                fig.add_trace(
                    go.Bar(
                        x=data['date'],
                        y=data['macd_histogram'],
                        name='Histogram',
                        marker_color='gray',
                        opacity=0.6
                    ),
                    row=3, col=1
                )
        
        # Stochastic
        if all(col in data.columns for col in ['stoch_k', 'stoch_d']):
            fig.add_trace(
                go.Scatter(
                    x=data['date'],
                    y=data['stoch_k'],
                    mode='lines',
                    name='%K',
                    line=dict(color='orange')
                ),
                row=4, col=1
            )
            
            fig.add_trace(
                go.Scatter(
                    x=data['date'],
                    y=data['stoch_d'],
                    mode='lines',
                    name='%D',
                    line=dict(color='red')
                ),
                row=4, col=1
            )
            
            # Add stochastic reference lines
            fig.add_hline(y=80, line_dash="dash", line_color="red")
            fig.add_hline(y=20, line_dash="dash", line_color="green")
        
        # Update layout
        fig.update_layout(
            title=f'{symbol} - Complete Technical Analysis',
            xaxis_rangeslider_visible=False,
            height=800,
            showlegend=True
        )
        
        # Update y-axes titles
        fig.update_yaxes(title_text="Price", row=1, col=1)
        fig.update_yaxes(title_text="RSI", row=2, col=1, range=[0, 100])
        fig.update_yaxes(title_text="MACD", row=3, col=1)
        fig.update_yaxes(title_text="Stoch", row=4, col=1, range=[0, 100])
        
        return fig