# 📊 Advanced Stock Scanner & Backtesting Platform

A comprehensive Streamlit application for advanced stock scanning, filtering, and backtesting with JSON-based filters, technical indicators, and performance optimization. Built for professional traders and quantitative analysts.

## 🚀 Core Features

### Data Processing & Management
- **Multi-format Support**: CSV, Excel, and Parquet file loading with automatic encoding detection
- **Smart Column Detection**: Automatic identification of Date, Symbol, OHLCV columns with intelligent mapping
- **Data Validation**: Comprehensive data quality checks, OHLC relationship validation, and outlier detection
- **Memory Optimization**: Advanced memory management with optimized data types and chunked processing
- **Performance Monitoring**: Real-time performance tracking and optimization

### Advanced Filtering System
- **JSON-based Filters**: Complex filter expressions with nested conditions and logic operators
- **Multiple Operand Types**: Column references, technical indicators, and constants
- **Logic Operators**: Full AND/OR logic support with unlimited condition combinations
- **Cross-timeframe Analysis**: Support for different timeframes and offsets
- **Real-time Validation**: Filter syntax validation and preview functionality
- **Template Library**: Pre-built filter templates for common trading strategies

### Technical Indicators
- **Moving Averages**: SMA, EMA with customizable periods
- **Momentum Indicators**: RSI, Stochastic, Williams %R, CCI
- **Trend Indicators**: MACD with signal line and histogram
- **Volatility Indicators**: Bollinger Bands, ATR (Average True Range)
- **Volume Analysis**: Volume SMA, volume ratios, and volume-based filters
- **Custom Indicators**: Extensible framework for adding custom indicators

### Backtesting Engine
- **Strategy Testing**: Comprehensive backtesting with multiple position sizing methods
- **Position Sizing**: Equal weight, fixed amount, percentage risk, volatility targeting, ATR-based, and Kelly criterion
- **Long/Short Support**: Both long and short trading strategies
- **Leverage Control**: Configurable leverage settings with capital constraints
- **Performance Metrics**: Sharpe ratio, max drawdown, profit factor, win rate, and more
- **Parameter Optimization**: Multi-parameter optimization with multiprocessing support

### Visualization & Analysis
- **Interactive Charts**: Candlestick charts with technical indicator overlays
- **Performance Dashboards**: Comprehensive performance metrics and analysis
- **Trade Analysis**: Detailed trade-by-trade breakdown and statistics
- **Market Data Analysis**: Returns calculation, volatility analysis, and trading session detection

## 📁 Project Structure

```
scanner/
├── stock_scanner_main.py              # Main Streamlit application
├── advanced_filter_engine.py         # JSON-based filter processing engine
├── BackTestEngine.py                 # Comprehensive backtesting system
├── filters_module.py                 # Filter templates and logic
├── indicators_module.py              # Technical indicators calculation
├── utils_module.py                   # Data processing and utilities
├── ui_components_module.py           # Reusable UI components
├── json_filter_parser.py             # JSON filter expression parser
├── operand_calculator.py             # Operand calculation engine
├── performance_optimizer.py          # Performance optimization utilities
├── requirements_file.txt             # Python dependencies
└── readme_file.md                    # This file
```

## 🛠️ Installation & Setup

### Prerequisites
- Python 3.8 or higher
- pip package manager
- Recommended: 8GB+ RAM for large datasets
- Recommended: Multi-core CPU for performance optimization

### Step 1: Clone/Download Files
Download all Python files in the `scanner/` directory to a local folder.

### Step 2: Install Dependencies
```bash
pip install -r requirements_file.txt
```

### Step 3: Run the Application
```bash
streamlit run stock_scanner_main.py
```

The app will open in your browser at `http://localhost:8501`

## 📊 Usage Guide

### 1. Data Upload & Processing
- Go to the **Data Upload** tab
- Upload CSV, Excel, or Parquet files with OHLCV data
- The app automatically detects and maps columns (Date, Symbol, Open, High, Low, Close, Volume)
- Review column mappings and click **Process Data**
- Monitor technical indicator calculation progress

### 2. Advanced Filter Building

#### JSON Filter Editor
- Switch to the **Filter Builder** tab
- Use the JSON editor to create complex filter expressions
- Access the **JSON Structure Guide** for syntax help
- Load pre-built templates from the **Examples** dropdown
- Validate filter syntax in real-time

#### Filter Examples
```json
{
  "logic": "AND",
  "conditions": [
    {
      "left": {
        "type": "indicator",
        "name": "rsi",
        "params": [14],
        "column": "close"
      },
      "operator": ">",
      "right": {
        "type": "constant",
        "value": 70.0
      }
    },
    {
      "left": {
        "type": "column",
        "name": "volume",
        "timeframe": "daily"
      },
      "operator": ">",
      "right": {
        "type": "indicator",
        "name": "sma",
        "params": [20],
        "column": "volume"
      }
    }
  ]
}
```

#### Filter Categories
- **Basic Filters**: Price, volume, and simple conditions
- **Technical Indicators**: RSI, MACD, Bollinger Bands, etc.
- **Complex Patterns**: Multi-indicator confirmation patterns
- **Volume Analysis**: Volume breakouts and spikes

### 3. Backtesting & Analysis

#### Strategy Backtesting
- Navigate to the **Backtesting** tab
- Configure strategy parameters:
  - Signal type (Long/Short)
  - Position sizing method
  - Stop loss and take profit levels
  - Holding period
- Run single backtests or parameter optimization
- Monitor progress with real-time updates

#### Performance Analysis
- Review comprehensive performance metrics
- Analyze trade-by-trade results
- Compare different parameter combinations
- Export backtesting results for further analysis

### 4. Results & Visualization
- View filtered results in interactive tables
- Select and display specific columns
- Sort and paginate through large datasets
- Generate technical analysis charts
- Export results in multiple formats (CSV, Excel, JSON)

## 🎯 Sample Filters & Strategies

### Momentum Trading Filters
```json
{
  "logic": "AND",
  "conditions": [
    {
      "left": {"type": "column", "name": "close"},
      "operator": ">",
      "right": {"type": "indicator", "name": "sma", "params": [20], "column": "close"}
    },
    {
      "left": {"type": "column", "name": "volume"},
      "operator": ">",
      "right": {"type": "indicator", "name": "sma", "params": [20], "column": "volume"}
    }
  ]
}
```

### Mean Reversion (Oversold) Filters
```json
{
  "logic": "AND",
  "conditions": [
    {
      "left": {"type": "indicator", "name": "rsi", "params": [14], "column": "close"},
      "operator": "<",
      "right": {"type": "constant", "value": 30.0}
    },
    {
      "left": {"type": "column", "name": "close"},
      "operator": ">",
      "right": {"type": "indicator", "name": "sma", "params": [50], "column": "close"}
    }
  ]
}
```

### Breakout Trading Filters
```json
{
  "logic": "AND",
  "conditions": [
    {
      "left": {"type": "column", "name": "close"},
      "operator": ">",
      "right": {"type": "indicator", "name": "sma", "params": [200], "column": "close"}
    },
    {
      "left": {"type": "column", "name": "volume"},
      "operator": ">",
      "right": {"type": "indicator", "name": "sma", "params": [50], "column": "volume"}
    }
  ]
}
```

### Volatility-Based Filters
```json
{
  "logic": "AND",
  "conditions": [
    {
      "left": {"type": "indicator", "name": "atr", "params": [14], "column": "close"},
      "operator": ">",
      "right": {"type": "indicator", "name": "sma", "params": [20], "column": "atr"}
    },
    {
      "left": {"type": "indicator", "name": "bb_width", "params": [20, 2], "column": "close"},
      "operator": ">",
      "right": {"type": "constant", "value": 0.1}
    }
  ]
}
```

## 📈 Technical Indicators

### Moving Averages
- **Simple Moving Average (SMA)**: Customizable periods (5, 10, 20, 50, 200)
- **Exponential Moving Average (EMA)**: Customizable periods (12, 20, 26, 50)
- **Weighted Moving Average (WMA)**: Customizable periods
- **Hull Moving Average (HMA)**: Smoothed moving average with reduced lag

### Momentum Oscillators
- **RSI (Relative Strength Index)**: 14-period with overbought/oversold levels
- **Stochastic Oscillator**: %K and %D with smoothing
- **Williams %R**: Williams Percent Range for momentum
- **CCI (Commodity Channel Index)**: Trend-following oscillator
- **Momentum**: Rate of change indicator

### Trend Indicators
- **MACD (Moving Average Convergence Divergence)**: Line, signal, and histogram
- **ADX (Average Directional Index)**: Trend strength measurement
- **DMI (Directional Movement Index)**: +DI and -DI components
- **Parabolic SAR**: Stop-and-reverse indicator

### Volatility Indicators
- **Bollinger Bands**: Upper, middle, lower bands with width calculation
- **ATR (Average True Range)**: Volatility measurement
- **Keltner Channels**: Volatility-based bands
- **Donchian Channels**: Highest high and lowest low over periods

### Volume Indicators
- **Volume SMA**: Volume moving averages (20, 50 periods)
- **Volume Weighted Average Price (VWAP)**: Volume-weighted average price
- **On-Balance Volume (OBV)**: Volume flow indicator
- **Volume Rate of Change**: Volume momentum measurement

### Custom Indicators
- Extensible framework for adding custom technical indicators
- Support for complex mathematical calculations
- Integration with the JSON filter system

## 💾 Data Format Requirements

### Required Columns
Your data should contain these columns (exact names may vary):
- **Date/DateTime**: Date column in various formats (YYYY-MM-DD, DD-MM-YYYY, etc.)
- **Symbol/Ticker**: Stock identifier (AAPL, MSFT, etc.)
- **Open**: Opening price
- **High**: Highest price
- **Low**: Lowest price
- **Close**: Closing price
- **Volume**: Trading volume

### Supported Date Formats
- `YYYY-MM-DD` (2024-01-01)
- `DD-MM-YYYY` (01-01-2024)
- `MM-DD-YYYY` (01-01-2024)
- `YYYY/MM/DD` (2024/01/01)
- `YYYY-MM-DD HH:MM:SS` (2024-01-01 09:30:00)

### Sample CSV Format
```csv
Date,Symbol,Open,High,Low,Close,Volume
2024-01-01,AAPL,180.50,182.30,179.20,181.75,45000000
2024-01-02,AAPL,181.80,183.50,181.00,182.90,38000000
2024-01-01,MSFT,375.20,378.50,374.10,377.80,25000000
2024-01-02,MSFT,377.90,380.20,376.50,379.40,28000000
```

### Data Quality Requirements
- **OHLC Relationships**: High ≥ Low, High ≥ Open/Close, Low ≤ Open/Close
- **No Negative Prices**: All price columns must be positive
- **Volume Data**: Volume should be non-negative
- **Date Continuity**: No duplicate dates for the same symbol
- **Missing Data**: Minimal missing values in critical columns

### Data Validation
The application automatically validates your data and provides:
- Column mapping suggestions
- Data type validation
- OHLC relationship checks
- Outlier detection and reporting
- Missing data analysis

## 🚀 Performance Optimization

### Large Dataset Handling (>100MB)
- **Use Parquet Format**: Fastest loading and smallest file size
- **Date Range Filtering**: Process only relevant date ranges
- **Symbol Filtering**: Limit to specific symbols of interest
- **Memory Management**: Automatic data type optimization and chunked processing
- **Multiprocessing**: Parallel processing for filter operations and backtesting

### Performance Optimization Features
- **Vectorized Operations**: NumPy-optimized calculations for indicators
- **Caching**: Streamlit caching for repeated operations
- **Memory Optimization**: Efficient data types and garbage collection
- **Numba JIT Compilation**: Just-in-time compilation for performance-critical functions
- **Parallel Processing**: Multi-core support for parameter optimization

### Memory Management Tips
- **Remove Unnecessary Columns**: Drop unused columns before processing
- **Use Appropriate Data Types**: Float32 instead of Float64 where possible
- **Process in Chunks**: For extremely large datasets, consider processing in chunks
- **Monitor Memory Usage**: Watch memory usage in the Streamlit sidebar
- **Clear Cache**: Periodically clear Streamlit cache for better performance

### Backtesting Performance
- **Vectorized Backtesting**: Optimized for speed with large datasets
- **Multiparameter Optimization**: Parallel processing of parameter combinations
- **Efficient Position Sizing**: Fast position size calculations
- **Trade Outcome Caching**: Cache trade results for repeated analysis

## 🔧 Advanced Configuration

### Custom Technical Indicators
Add new indicators to `indicators_module.py`:

```python
@staticmethod
def my_custom_indicator(data: pd.Series, window: int = 14) -> pd.Series:
    """Your custom indicator logic"""
    return data.rolling(window).mean()  # Example: Simple moving average

def add_all_indicators(self, df: pd.DataFrame) -> pd.DataFrame:
    """Add all indicators to the dataframe"""
    # Add your custom indicator
    df['my_custom_indicator'] = self.my_custom_indicator(df['close'])
    return df
```

### Custom Filter Templates
Add templates to `filters_module.py`:

```python
CUSTOM_FILTERS = {
    "My Strategy": {
        "logic": "AND",
        "conditions": [
            {
                "left": {"type": "column", "name": "close"},
                "operator": ">",
                "right": {"type": "indicator", "name": "sma", "params": [20], "column": "close"}
            }
        ]
    }
}
```

### JSON Filter Extensions
Extend the JSON filter system in `json_filter_parser.py`:

```python
def add_custom_operator(self, operator_name: str, operator_function):
    """Add custom operator to the parser"""
    self.custom_operators[operator_name] = operator_function

def add_custom_indicator(self, indicator_name: str, indicator_function):
    """Add custom indicator to the parser"""
    self.custom_indicators[indicator_name] = indicator_function
```

### Backtesting Configuration
Configure backtesting parameters in `BackTestEngine.py`:

```python
# Custom position sizing methods
def custom_position_size(entry_price, portfolio_value, risk_params):
    """Your custom position sizing logic"""
    # Implement your sizing algorithm
    return shares

# Custom exit strategies
def custom_exit_strategy(entry_price, current_price, holding_days):
    """Your custom exit logic"""
    # Implement your exit conditions
    return exit_reason, exit_price
```

### Performance Optimization
Configure performance settings in `performance_optimizer.py`:

```python
# Memory optimization settings
MEMORY_CONFIG = {
    'use_float32': True,
    'optimize_categoricals': True,
    'chunk_size': 10000,
    'max_memory_gb': 4
}

# Processing optimization
PROCESSING_CONFIG = {
    'use_multiprocessing': True,
    'max_workers': 4,
    'chunk_processing': True,
    'cache_enabled': True
}

## 🐛 Troubleshooting & Support

### Common Issues and Solutions

**Data Loading Problems**
- **"Column not found" error**: Verify your data contains all required OHLCV columns
- **"Invalid date format"**: Check date column format against supported formats
- **"Encoding error"**: Try different file encodings (UTF-8, Latin-1)
- **"Empty file"**: Ensure file contains data and is not corrupted

**Memory Issues**
- **"Memory error" with large files**:
  - Use Parquet format for better memory efficiency
  - Filter data by date range before processing
  - Reduce the number of technical indicators calculated
  - Increase system memory allocation
- **"Slow performance"**:
  - Enable multiprocessing in settings
  - Use smaller data samples for testing
  - Clear Streamlit cache: `streamlit cache clear`

**Filter Application Issues**
- **"Invalid JSON filter"**: Use the JSON Structure Guide for syntax help
- **"Operator not supported"**: Check supported operators in the documentation
- **"Indicator calculation failed"**: Verify indicator parameters and data availability
- **"No results found"**: Test with simpler filters first

**Backtesting Problems**
- **"No trades executed"**: Check signal conditions and position sizing parameters
- **"Performance metrics error"**: Ensure sufficient data for calculation
- **"Optimization timeout"**: Reduce parameter space or increase timeout settings
- **"Leverage warnings"**: Adjust leverage settings or capital allocation

### Performance Optimization
- **Large Dataset Handling**: Use Parquet format, apply date filters, process in chunks
- **Memory Management**: Monitor memory usage, optimize data types, clear cache regularly
- **Processing Speed**: Enable multiprocessing, use vectorized operations, cache results

### Data Quality Checks
- **OHLC Validation**: Ensure high ≥ low, high ≥ open/close, low ≤ open/close
- **Volume Analysis**: Check for zero or negative volume values
- **Date Continuity**: Verify no duplicate dates for same symbol
- **Price Validation**: Ensure all prices are positive and reasonable

### Getting Help
1. **Check Documentation**: Review this README and inline code documentation
2. **Validate Data Format**: Ensure your data meets the format requirements
3. **Test with Sample Data**: Use small, clean datasets first
4. **Monitor Performance**: Watch memory usage and processing times
5. **Check Dependencies**: Verify all required packages are installed
6. **Review Error Logs**: Check console output for detailed error messages

### Debug Mode
Enable debug mode for detailed logging:
```python
# In your Streamlit app, add:
import logging
logging.basicConfig(level=logging.DEBUG)
```

### Performance Monitoring
Monitor system performance:
- **Memory Usage**: Check in Streamlit sidebar
- **Processing Time**: Monitor operation completion times
- **CPU Usage**: Watch for high CPU utilization
- **Disk I/O**: Monitor for excessive disk operations

## 📝 Future Enhancements

### Planned Features
- **Real-time Data Integration**: Live market data streaming and real-time scanning
- **Multi-timeframe Analysis**: Support for intraday, daily, weekly, and monthly timeframes
- **Advanced Pattern Recognition**: Automated chart pattern detection (head and shoulders, triangles, etc.)
- **Machine Learning Integration**: AI-powered pattern recognition and prediction
- **Portfolio Management**: Watchlist tracking and portfolio performance monitoring
- **Alert System**: Email, SMS, and webhook notifications for trading signals
- **Cloud Integration**: Cloud-based processing and data storage
- **Mobile App**: Mobile companion app for on-the-go monitoring

### Advanced Analytics
- **Statistical Analysis**: Advanced statistical measures and correlation analysis
- **Monte Carlo Simulation**: Risk analysis using Monte Carlo methods
- **Correlation Matrix**: Asset correlation analysis and diversification metrics
- **Sentiment Analysis**: News sentiment analysis for market insights

### Enhanced Backtesting
- **Multi-Asset Strategies**: Portfolio-level backtesting with asset allocation
- **Transaction Costs**: Realistic transaction cost modeling
- **Slippage Simulation**: Market impact and slippage modeling
- **Risk Management**: Advanced risk management tools and metrics

## 🤝 Contributing

We welcome contributions from the community! Please feel free to contribute by:

### Code Contributions
- **New Technical Indicators**: Add custom indicators with proper documentation
- **Filter Templates**: Create and share new filter templates
- **Performance Improvements**: Optimize existing code for better performance
- **Bug Fixes**: Identify and fix bugs in the codebase
- **New Features**: Implement new functionality following the existing architecture

### Documentation
- **Improve Documentation**: Enhance README files and inline documentation
- **Add Examples**: Provide more examples and use cases
- **Update Guides**: Keep installation and usage guides current

### Testing
- **Unit Tests**: Add comprehensive unit tests for new features
- **Integration Tests**: Test integration between different components
- **Performance Tests**: Benchmark performance improvements

### Community Support
- **Answer Questions**: Help users on GitHub discussions or forums
- **Share Ideas**: Suggest new features and improvements
- **Report Issues**: Report bugs and feature requests

### Development Guidelines
1. **Follow Code Style**: Maintain consistent coding style
2. **Add Tests**: Include tests for new functionality
3. **Document Changes**: Update documentation for significant changes
4. **Test Thoroughly**: Ensure changes don't break existing functionality
5. **Submit Pull Requests**: Follow the contribution guidelines

## 📄 License

This project is licensed under the MIT License. Feel free to use, modify, and distribute as needed.

## 🙏 Acknowledgments

- **Streamlit**: For the excellent web application framework
- **Pandas**: For powerful data manipulation capabilities
- **NumPy**: For efficient numerical computations
- **Plotly**: For interactive data visualization
- **Open Source Community**: For inspiration and contributions

---

**Happy Trading & Scanning! 📊🚀**

*Built with passion for quantitative trading and data analysis.*