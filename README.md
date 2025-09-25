# Stock Scanner & Backtesting Engine

A comprehensive stock scanning and backtesting application migrated from Streamlit to a modern React + Python architecture. This professional-grade trading analytics platform provides advanced filtering, backtesting, and risk analysis capabilities for individual traders and analysts.

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Architecture Overview](#architecture-overview)
- [Current Capabilities](#current-capabilities)
- [Setup Instructions](#setup-instructions)
- [Usage Guide](#usage-guide)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing Guidelines](#contributing-guidelines)
- [Troubleshooting](#troubleshooting)
- [Future Roadmap](#future-roadmap)

## 🚀 Project Overview

### Objectives

The Stock Scanner & Backtesting Engine is designed to provide traders and analysts with powerful tools for:

- **Data Processing**: Efficiently process large OHLCV datasets from various sources
- **Advanced Filtering**: Apply complex technical and fundamental filters to identify trading opportunities
- **Backtesting**: Test trading strategies with sophisticated position sizing and risk management
- **Risk Analysis**: Comprehensive risk assessment including Monte Carlo simulation and leverage analysis
- **Performance Analytics**: Detailed performance metrics and visualization capabilities

### Scope

This application serves individual traders and analysts who need professional-grade tools for:
- Stock screening and filtering
- Strategy backtesting and optimization
- Risk management and analysis
- Performance tracking and reporting

### Key Milestones

1. ✅ **Phase 1**: Migration from Streamlit to React + FastAPI architecture
2. ✅ **Phase 2**: Integration of advanced backtesting engine with vectorized processing
3. ✅ **Phase 3**: Implementation of comprehensive risk management and analytics
4. 🔄 **Phase 4**: Enhanced UI/UX with professional design system
5. 📈 **Phase 5**: Advanced features and optimization (in progress)

## 🏗️ Architecture Overview

### System Design

The application follows a modern microservices architecture with clear separation of concerns:

```
┌─────────────────┐    HTTP/REST API    ┌─────────────────┐
│   React Frontend│◄──────────────────►│  FastAPI Backend│
│   (Material-UI) │                     │   (Python)      │
└─────────────────┘                     └─────────────────┘
         │                                       │
         │                                       │
    ┌────▼────┐                            ┌────▼────┐
    │  Charts │                            │  Data   │
    │  Tables │                            │Processing│
    │  Forms  │                            │ Filters  │
    └─────────┘                            └─────────┘
```

### Component Interactions

#### Frontend Components
- **App.js**: Main application component with tab-based navigation
- **FileUpload.js**: Handles data file uploads and validation
- **FilterBuilder.js**: Advanced filter construction interface
- **ResultsTable.js**: Interactive results display with sorting/filtering
- **Backtesting.js**: Comprehensive backtesting controls and results
- **Chart Components**: Multiple chart types for data visualization

#### Backend Modules
- **main.py**: FastAPI application with REST endpoints
- **utils_module.py**: Data processing and validation utilities
- **filters_module.py**: Core filtering engine
- **advanced_filter_engine.py**: JSON-based advanced filtering
- **BackTestEngine.py**: Vectorized backtesting with position sizing
- **performance_optimizer.py**: Optimization and caching utilities

### Data Flow

1. **Data Upload**: User uploads OHLCV data files (CSV, Parquet, Excel)
2. **Data Processing**: Backend processes and validates data, stores in memory
3. **Filter Application**: User builds filters via React interface
4. **Results Generation**: Backend applies filters and returns results
5. **Backtesting**: User runs backtests with selected parameters
6. **Analysis**: Comprehensive analytics and visualization

### React + Python Integration

The frontend and backend communicate through RESTful APIs:

- **Frontend**: React 19 with Material-UI components
- **HTTP Client**: Axios for API communication
- **Backend**: FastAPI with automatic OpenAPI documentation
- **CORS**: Configured for local development
- **Data Serialization**: JSON with pandas DataFrame conversion

## ⚡ Current Capabilities

### Implemented Features

#### Data Processing
- ✅ Multiple file format support (CSV, Parquet, Excel)
- ✅ Automatic column detection and validation
- ✅ Large dataset processing with memory optimization
- ✅ Real-time data preview and summary statistics

#### Advanced Filtering
- ✅ JSON-based filter engine with complex conditions
- ✅ Template-based filter presets
- ✅ Custom filter builder with dynamic UI
- ✅ Saved filters management
- ✅ Real-time filter application and results

#### Backtesting Engine
- ✅ Vectorized backtesting with Numba JIT compilation
- ✅ Multiple position sizing methods:
  - Equal Weight (2% per position)
  - Fixed Dollar Amount
  - Percent Risk-based
  - Volatility Targeting
  - ATR-based sizing
  - Kelly Criterion optimization
- ✅ Long/Short signal support
- ✅ Parameter optimization with multiprocessing
- ✅ Leverage control and risk management

#### Analytics & Visualization
- ✅ Interactive equity curves with drawdown analysis
- ✅ Comprehensive performance metrics (Sharpe, Calmar, etc.)
- ✅ Monte Carlo simulation for risk assessment
- ✅ Leverage usage analysis and risk dashboard
- ✅ Per-instrument performance breakdown
- ✅ Trade log with advanced filtering
- ✅ Export capabilities (CSV, JSON)

#### Risk Management
- ✅ Position size optimization
- ✅ Leverage monitoring and alerts
- ✅ Drawdown analysis and control
- ✅ Risk-adjusted performance metrics
- ✅ Portfolio concentration analysis

### Supported Functionalities

#### Data Sources
- CSV files with OHLCV data
- Parquet files for large datasets
- Excel files (.xlsx, .xls)
- Automatic column mapping and validation

#### Technical Indicators
- Price-based filters (SMA, EMA, RSI, MACD)
- Volume-based filters
- Volatility measures (ATR, standard deviation)
- Custom indicator support via JSON filters

#### Position Sizing Methods
- **Equal Weight**: Fixed percentage allocation
- **Fixed Amount**: Consistent dollar amounts
- **Percent Risk**: Risk-based position sizing
- **Volatility Target**: Portfolio volatility management
- **ATR-based**: Average True Range sizing
- **Kelly Criterion**: Optimal mathematical sizing

#### Performance Metrics
- Total Return and P&L
- Win Rate and Profit Factor
- Maximum Drawdown
- Sharpe and Calmar Ratios
- Average Win/Loss amounts
- Holding period analysis

### Limitations

#### Current Constraints
- ⚠️ In-memory data storage (requires restart for new datasets)
- ⚠️ Single-user architecture (not designed for concurrent users)
- ⚠️ Local file processing only (no cloud storage integration)
- ⚠️ Limited to historical data analysis (no real-time streaming)

#### Performance Considerations
- 📊 Recommended dataset size: < 1M rows for optimal performance
- 📊 Backtesting performance: ~1000 parameter combinations per minute
- 📊 Memory usage: ~500MB for large datasets
- 📊 Vectorized processing for datasets up to 500K rows

## 🛠️ Setup Instructions

### Prerequisites

#### System Requirements
- **Operating System**: Windows 10/11, macOS 10.15+, or Linux
- **Memory**: 8GB RAM minimum, 16GB recommended
- **Storage**: 2GB free space
- **Python**: 3.8+ (for backend)
- **Node.js**: 16+ (for frontend)

#### Required Software
- Python 3.8 or higher
- Node.js 16 or higher
- Git (for version control)
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Environment Setup

#### 1. Clone the Repository
```bash
git clone <repository-url>
cd stock-scanner-backtesting
```

#### 2. Backend Setup

##### Create Python Virtual Environment
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

##### Install Python Dependencies
```bash
pip install -r requirements.txt
```

##### Verify Installation
```bash
python -c "import fastapi, pandas, numpy; print('✅ Backend dependencies installed successfully')"
```

#### 3. Frontend Setup

##### Install Node.js Dependencies
```bash
cd ../frontend
npm install
```

##### Verify Installation
```bash
npm list --depth=0
```

### Configuration

#### Backend Configuration
The backend uses the following default configuration:
- **Host**: `localhost`
- **Port**: `8000`
- **CORS Origins**: `http://localhost:3000`, `http://localhost:3001`
- **Debug Mode**: Enabled for development

#### Frontend Configuration
- **API Base URL**: `http://localhost:8000/api`
- **Development Server**: `http://localhost:3000`
- **Theme**: Dark mode with professional styling

### Running the Application

#### Start Backend Server
```bash
cd backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

#### Start Frontend Development Server
```bash
cd frontend
npm start
```

#### Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

### Development Mode

#### Running Tests
```bash
# Backend tests
cd backend
pytest tests/

# Frontend tests
cd frontend
npm test
```

#### Code Quality Checks
```bash
# Backend linting
cd backend
flake8 . --max-line-length=100
black --check .
mypy .

# Frontend linting
cd frontend
npm run lint
```

## 📖 Usage Guide

### Getting Started

#### 1. Data Upload
1. Navigate to the "Upload Data" tab
2. Upload your OHLCV data file (CSV, Parquet, or Excel)
3. Review the data preview and summary statistics
4. Verify column detection and data quality

#### 2. Filter Building
1. Go to the "Build Filters" tab
2. Choose between template filters or custom JSON filters
3. Configure filter parameters using the intuitive interface
4. Save frequently used filters for quick access

#### 3. Results Analysis
1. Review filtered results in the interactive table
2. Sort and filter results by various criteria
3. Export results for further analysis

#### 4. Backtesting
1. Navigate to the "Backtesting" tab
2. Select signals from your filtered results
3. Configure backtesting parameters:
   - Position sizing method
   - Risk management settings
   - Holding period and exit conditions
4. Run backtest and analyze results

### Common Tasks

#### Running a Basic Scan
```javascript
// Example: Upload data and apply a simple filter
1. Upload your OHLCV data file
2. Create a filter: Price > 50 AND Volume > 100000
3. Apply filter and review results
4. Export results to CSV
```

#### Advanced Backtesting
```javascript
// Example: Comprehensive backtesting workflow
1. Upload historical OHLCV data
2. Apply technical filters (RSI < 30, Moving Average crossover)
3. Configure Kelly Criterion position sizing
4. Set stop-loss at 5% and take-profit at 15%
5. Run parameter optimization across multiple timeframes
6. Analyze Monte Carlo simulation results
```

#### Risk Analysis
```javascript
// Example: Risk assessment workflow
1. Run backtest with leverage enabled
2. Review leverage usage dashboard
3. Analyze drawdown periods
4. Run Monte Carlo simulation for 1000 scenarios
5. Assess Value at Risk (VaR) metrics
```

### Best Practices

#### Data Management
- ✅ Use consistent column naming across datasets
- ✅ Ensure data quality before uploading
- ✅ Keep datasets under 1M rows for optimal performance
- ✅ Use Parquet format for large datasets

#### Filter Design
- ✅ Start with simple filters and gradually add complexity
- ✅ Test filters on small datasets first
- ✅ Use JSON filters for complex multi-condition logic
- ✅ Save and reuse successful filter configurations

#### Backtesting
- ✅ Use realistic position sizing methods
- ✅ Include transaction costs in analysis
- ✅ Test across different market conditions
- ✅ Validate results with out-of-sample data

#### Risk Management
- ✅ Monitor leverage usage closely
- ✅ Set appropriate stop-loss levels
- ✅ Use Monte Carlo simulation for stress testing
- ✅ Regularly review and adjust risk parameters

## 🔌 API Documentation

### Base URL
```
http://localhost:8000/api
```

### Authentication
Currently, no authentication is required for local development. All endpoints are publicly accessible.

### Core Endpoints

#### Data Management

##### Upload Data
```http
POST /api/upload
Content-Type: multipart/form-data

file: (binary) Data file (CSV, Parquet, Excel)
```

**Response:**
```json
{
  "message": "File uploaded and processed successfully.",
  "shape": [rows, columns],
  "columns": ["symbol", "date", "open", "high", "low", "close", "volume"]
}
```

##### Get Data Summary
```http
GET /api/data/summary
```

**Response:**
```json
{
  "message": "Data summary retrieved successfully.",
  "shape": [rows, columns],
  "columns": ["symbol", "date", "open", "high", "low", "close", "volume"],
  "unique_symbols": 150,
  "date_range": {
    "min": "2023-01-01",
    "max": "2023-12-31"
  },
  "preview": [...],
  "summary_stats": {...}
}
```

##### Get OHLCV Data
```http
GET /api/data/ohlcv?limit=5000
```

**Response:**
```json
{
  "message": "OHLCV data exported successfully",
  "count": 5000,
  "limit": 5000,
  "columns": ["symbol", "date", "open", "high", "low", "close", "volume"],
  "data": [...]
}
```

#### Filter Management

##### Apply Filter
```http
POST /api/filters/apply
Content-Type: application/json

{
  "filter": {
    "type": "and",
    "conditions": [
      {
        "column": "close",
        "operator": ">",
        "value": 100
      },
      {
        "column": "volume",
        "operator": ">",
        "value": 100000
      }
    ]
  },
  "date_range": ["2023-01-01", "2023-12-31"]
}
```

**Response:**
```json
{
  "message": "Filter applied successfully.",
  "results": [...]
}
```

##### Get Saved Filters
```http
GET /api/filters/saved
```

##### Save Filter
```http
POST /api/filters/saved
Content-Type: application/json

{
  "name": "High Volume Stocks",
  "filter": {
    "type": "and",
    "conditions": [
      {
        "column": "volume",
        "operator": ">",
        "value": 1000000
      }
    ]
  }
}
```

##### Delete Saved Filter
```http
DELETE /api/filters/saved/{filter_name}
```

#### Backtesting

##### Run Backtest
```http
POST /api/backtest/run
Content-Type: application/json

{
  "signals_data": [...],
  "ohlcv_data": [...],
  "initial_capital": 100000,
  "stop_loss": 5.0,
  "take_profit": 15.0,
  "holding_period": 20,
  "signal_type": "long",
  "position_sizing": "kelly_criterion",
  "allow_leverage": false
}
```

**Response:**
```json
{
  "trades": [...],
  "performance_metrics": {
    "Total Return (%)": 25.5,
    "Win Rate (%)": 62.3,
    "Sharpe Ratio": 1.45,
    "Max Drawdown (%)": 8.2
  },
  "equity_curve": [...],
  "summary": {...}
}
```

##### Optimize Parameters
```http
POST /api/backtest/optimize
Content-Type: application/json

{
  "signals_data": [...],
  "ohlcv_data": [...],
  "param_ranges": {
    "holding_period": [5, 10, 15, 20],
    "stop_loss": [3, 5, 7, 10],
    "take_profit": [10, 15, 20, 25]
  }
}
```

### Integration Points

#### Frontend-Backend Communication
- **Protocol**: HTTP/1.1 with JSON payloads
- **Content-Type**: `application/json` for data endpoints
- **Content-Type**: `multipart/form-data` for file uploads
- **CORS**: Enabled for local development

#### Error Handling
All endpoints return appropriate HTTP status codes:
- `200`: Success
- `400`: Bad Request (invalid parameters)
- `404`: Not Found (no data uploaded)
- `500`: Internal Server Error

#### Rate Limiting
Currently no rate limiting is implemented for local development.

## 🧪 Testing

### Testing Strategy

The application follows a comprehensive testing approach:

#### Backend Testing
- **Unit Tests**: Individual function and module testing
- **Integration Tests**: API endpoint testing
- **End-to-End Tests**: Full workflow testing
- **Performance Tests**: Load testing for large datasets

#### Frontend Testing
- **Unit Tests**: Component and utility function testing
- **Integration Tests**: Component interaction testing
- **E2E Tests**: User workflow testing

### Test Suites

#### Backend Tests
```bash
# Run all backend tests
cd backend
pytest tests/

# Run specific test categories
pytest tests/test_api.py -v
pytest tests/test_integration.py -v
pytest tests/test_backtest_api.py -v

# Run with coverage
pytest --cov=. --cov-report=html tests/
```

#### Frontend Tests
```bash
# Run all frontend tests
cd frontend
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

### Test Coverage

#### Backend Coverage Targets
- **Overall Coverage**: 85%+
- **Core Modules**: 90%+
- **API Endpoints**: 95%+
- **Critical Functions**: 100%

#### Frontend Coverage Targets
- **Component Coverage**: 80%+
- **Utility Functions**: 90%+
- **Critical User Flows**: 95%+

### Performance Testing

#### Benchmark Tests
```python
# Backend performance benchmarks
cd backend
python performance_test.py

# Large dataset processing tests
python -m pytest tests/test_performance.py -v
```

#### Load Testing
```bash
# API load testing
cd backend
python load_test.py

# Frontend performance testing
cd frontend
npm run lighthouse
```

### Continuous Integration

#### Automated Testing Pipeline
1. **Pre-commit Hooks**: Code quality checks
2. **Pull Request**: Automated test execution
3. **Main Branch**: Full test suite + performance tests
4. **Release**: Comprehensive validation

#### Test Data
- **Sample Datasets**: Provided in `test_data/` directory
- **Mock Data**: Generated for unit tests
- **Edge Cases**: Comprehensive edge case coverage

## 🚀 Deployment

### Deployment Options

#### Local Development
```bash
# Backend (development mode)
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Frontend (development mode)
cd frontend
npm start
```

#### Production Deployment

##### Backend Production
```bash
# Using Gunicorn with Uvicorn workers
cd backend
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000

# With reverse proxy (Nginx)
nginx_config = """
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
"""
```

##### Frontend Production
```bash
# Build for production
cd frontend
npm run build

# Serve with Nginx
nginx_config = """
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/frontend/build;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
"""
```

### CI/CD Pipelines

#### GitHub Actions Example
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.9'
    - name: Install dependencies
      run: |
        cd backend && pip install -r requirements.txt
        cd ../frontend && npm install
    - name: Run backend tests
      run: cd backend && pytest tests/ --cov=. --cov-report=xml
    - name: Run frontend tests
      run: cd frontend && npm test -- --coverage --watchAll=false
    - name: Build frontend
      run: cd frontend && npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
    - name: Deploy to production
      run: |
        # Deployment commands here
        echo "Deploying to production..."
```

### Production Setup

#### Environment Variables
```bash
# Backend environment variables
export FASTAPI_ENV=production
export CORS_ORIGINS=https://yourdomain.com
export REDIS_URL=redis://localhost:6379
export LOG_LEVEL=INFO

# Frontend environment variables
export REACT_APP_API_URL=https://api.yourdomain.com
export GENERATE_SOURCEMAP=false
```

#### Security Considerations
- ✅ Enable HTTPS in production
- ✅ Configure CORS properly
- ✅ Set up authentication/authorization
- ✅ Enable rate limiting
- ✅ Configure logging and monitoring
- ✅ Regular security updates

#### Monitoring & Logging
```bash
# Application monitoring
export ENABLE_METRICS=true
export LOG_LEVEL=INFO
export LOG_FILE=/var/log/stock-scanner/app.log

# Health checks
curl http://localhost:8000/health
curl http://localhost:3000/health
```

## 🤝 Contributing Guidelines

### Development Workflow

#### 1. Fork and Clone
```bash
git clone https://github.com/your-username/stock-scanner-backtesting.git
cd stock-scanner-backtesting
```

#### 2. Create Feature Branch
```bash
git checkout -b feature/your-feature-name
```

#### 3. Development Setup
```bash
# Install dependencies
cd backend && pip install -r requirements.txt
cd ../frontend && npm install

# Set up pre-commit hooks
pre-commit install
```

#### 4. Make Changes
- Follow coding standards
- Add tests for new features
- Update documentation
- Ensure all tests pass

#### 5. Submit Changes
```bash
# Commit changes
git add .
git commit -m "feat: add new feature description"

# Push to branch
git push origin feature/your-feature-name

# Create Pull Request
```

### Coding Standards

#### Backend (Python)
- **Style**: PEP 8 with Black formatting
- **Type Hints**: Use mypy for type checking
- **Documentation**: Google-style docstrings
- **Line Length**: 100 characters maximum
- **Imports**: Grouped by type (stdlib, third-party, local)

```python
# Example: Well-formatted Python code
from typing import Dict, List, Optional, Tuple
import pandas as pd
import numpy as np

def calculate_performance_metrics(
    trades: pd.DataFrame,
    initial_capital: float = 100000,
    risk_free_rate: float = 0.06
) -> Dict[str, float]:
    """
    Calculate comprehensive performance metrics for backtesting results.

    Args:
        trades: DataFrame containing trade information
        initial_capital: Starting portfolio value
        risk_free_rate: Annual risk-free rate for Sharpe calculation

    Returns:
        Dictionary containing performance metrics
    """
    if trades.empty:
        return {}

    # Implementation here
    return metrics
```

#### Frontend (JavaScript/React)
- **Style**: ESLint with Prettier formatting
- **Components**: Functional components with hooks
- **State Management**: React Context or Redux
- **Styling**: Material-UI with custom themes
- **File Structure**: Feature-based organization

```javascript
// Example: Well-formatted React component
import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  useTheme
} from '@mui/material';

const DataUpload = ({ onDataUpload, apiBase }) => {
  const theme = useTheme();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(
        `${apiBase}/upload`,
        formData
      );

      onDataUpload(response.data);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Upload Data File
      </Typography>
      <TextField
        type="file"
        onChange={(e) => setFile(e.target.files[0])}
        fullWidth
        margin="normal"
      />
      <Button
        variant="contained"
        onClick={handleUpload}
        disabled={!file || loading}
        sx={{ mt: 2 }}
      >
        {loading ? 'Uploading...' : 'Upload'}
      </Button>
    </Box>
  );
};

export default DataUpload;
```

### Pull Request Process

#### PR Requirements
- ✅ **Title**: Clear, descriptive title following conventional commits
- ✅ **Description**: Detailed explanation of changes
- ✅ **Tests**: All existing and new tests pass
- ✅ **Documentation**: Updated README and API docs
- ✅ **Code Review**: Approved by at least one maintainer
- ✅ **CI/CD**: All pipeline checks pass

#### PR Template
```markdown
## Description
Brief description of the changes made.

## Changes Made
- Change 1: Description
- Change 2: Description
- Change 3: Description

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed
- [ ] All tests pass

## Documentation
- [ ] README updated
- [ ] API documentation updated
- [ ] Code comments added

## Related Issues
- Closes #123
- Related to #456

## Screenshots (if applicable)
Add screenshots of UI changes.
```

### Code Review Guidelines

#### Review Checklist
- ✅ **Functionality**: Does it work as expected?
- ✅ **Code Quality**: Follows coding standards?
- ✅ **Performance**: No unnecessary computations?
- ✅ **Security**: No security vulnerabilities?
- ✅ **Testing**: Adequate test coverage?
- ✅ **Documentation**: Well documented?

#### Approval Criteria
- All automated checks pass
- Code follows project standards
- Changes are well-tested
- Documentation is updated
- At least one approval from maintainer

## 🔧 Troubleshooting

### Common Issues

#### 1. Backend Server Issues

**Problem**: FastAPI server fails to start
```bash
# Solution: Check Python environment and dependencies
cd backend
python -c "import fastapi, uvicorn; print('Dependencies OK')"
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Problem**: Port already in use
```bash
# Solution: Kill existing process or use different port
lsof -ti:8000 | xargs kill -9
# Or use different port
uvicorn main:app --reload --host 0.0.0.0 --port 8001
```

#### 2. Frontend Issues

**Problem**: React development server fails
```bash
# Solution: Clear node_modules and reinstall
cd frontend
rm -rf node_modules package-lock.json
npm install
npm start
```

**Problem**: CORS errors
```bash
# Solution: Check CORS configuration in backend
# Update CORS origins in backend/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

#### 3. Data Processing Issues

**Problem**: File upload fails
```bash
# Solution: Check file format and size
# Ensure file is CSV, Parquet, or Excel
# Check file size (recommended < 100MB)
# Verify column names and data types
```

**Problem**: Memory errors with large datasets
```bash
# Solution: Optimize memory usage
# Use Parquet format for large files
# Process data in chunks if needed
# Monitor memory usage: python -m memory_profiler script.py
```

#### 4. Backtesting Issues

**Problem**: Backtest runs but no trades generated
```bash
# Solution: Check data alignment and parameters
# Verify ticker symbols match between OHLCV and signals
# Check date ranges overlap
# Review backtest parameters (holding period, stop loss, etc.)
```

**Problem**: Performance issues with large parameter spaces
```bash
# Solution: Optimize backtesting
# Use vectorized processing for large datasets
# Enable multiprocessing for parameter optimization
# Reduce parameter combinations for initial testing
```

### Error Handling

#### Backend Error Responses
```json
{
  "detail": "Error description",
  "traceback": "Full error traceback for debugging"
}
```

#### Frontend Error Handling
```javascript
try {
  const response = await axios.post('/api/upload', formData);
  // Handle success
} catch (error) {
  if (error.response) {
    // Server responded with error status
    console.error('Server error:', error.response.data);
  } else if (error.request) {
    // Network error
    console.error('Network error:', error.request);
  } else {
    // Other error
    console.error('Error:', error.message);
  }
}
```

### Debugging Tips

#### Backend Debugging
```bash
# Enable debug logging
export LOG_LEVEL=DEBUG
python -m uvicorn main:app --reload --log-level debug

# Add debug prints to code
print(f"DEBUG: Variable value = {variable}")

# Use Python debugger
import pdb; pdb.set_trace()
```

#### Frontend Debugging
```bash
# Use React DevTools
# Add console.log statements
console.log('Debug info:', data);

# Use browser debugger
debugger;

# Check network requests in browser DevTools
```

#### Performance Debugging
```bash
# Profile Python code
python -m cProfile -s time script.py

# Profile memory usage
python -m memory_profiler script.py

# Monitor system resources
htop  # or top on macOS
```




## 🗺️ Future Roadmap

### Planned Enhancements

#### Phase 4: Enhanced Features (Q1 2024)
- [ ] **Real-time Data Integration**: Connect to live market data feeds
- [ ] **Machine Learning Models**: Predictive analytics and signal generation
- [ ] **Portfolio Optimization**: Multi-asset portfolio construction
- [ ] **Advanced Charting**: TradingView-style interactive charts

#### Phase 5: Advanced Analytics 
- [ ] **Factor Analysis**: Attribution analysis and factor models
- [ ] **Risk Parity**: Advanced risk management strategies
- [ ] **Walk-forward Optimization**: Dynamic parameter optimization



### Next Steps

#### Immediate Priorities (Next 2-4 weeks)
1. **Performance Optimization**: Improve memory usage for large datasets
2. **UI/UX Improvements**: Enhanced user interface and experience
3. **Testing Coverage**: Increase test coverage to 90%+
4. **Documentation**: Complete API and user documentation
5. **Error Handling**: Robust error handling and user feedback

#### Medium-term Goals (1-3 months)
1. **Real-time Features**: Live data integration capabilities
2. **Advanced Analytics**: Machine learning model integration
3. **Mobile Support**: Responsive design and mobile app
4. **Cloud Deployment**: Easy cloud deployment options
5. **Enterprise Security**: Enhanced security features

#### Long-term Vision (6-12 months)
1. **AI-Powered Insights**: Automated strategy generation
2. **Institutional Features**: Multi-asset class support
3. **Global Markets**: International market data support
4. **Regulatory Compliance**: Full compliance framework
5. **Ecosystem Integration**: Third-party platform integrations

### Contributing to the Roadmap

We welcome community contributions to help shape the future of the Stock Scanner & Backtesting Engine:

#### How to Contribute
1. **Feature Requests**: Open GitHub issues for new features
2. **Bug Reports**: Report issues with detailed reproduction steps
3. **Code Contributions**: Submit pull requests with new features
4. **Documentation**: Help improve documentation and tutorials
5. **Testing**: Contribute test cases and scenarios

#### Feature Request Process
1. Check existing feature requests
2. Create detailed feature request with use cases
3. Provide implementation suggestions if possible
4. Engage in community discussion
5. Contribute to implementation if interested

### Stay Updated

- 📧 **Newsletter**: Subscribe for product updates
- 🐦 **Twitter**: Follow @your-handle for announcements
- 📱 **Discord**: Join community discussions
- 📖 **Blog**: Read technical articles and tutorials
- 🎥 **YouTube**: Watch tutorial videos and demos

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **React Team** for the excellent frontend framework
- **FastAPI Team** for the high-performance backend framework
- **Material-UI Team** for the beautiful component library
- **Pandas/NumPy Teams** for essential data processing tools
- **Open Source Community** for various libraries and tools

## 📞 Contact

- **Website**: https://your-domain.com
- **Email**: contact@your-domain.com
- **GitHub**: https://github.com/your-username/stock-scanner-backtesting
- **LinkedIn**: https://linkedin.com/company/your-company

---

<div align="center">
  <p><strong>Built with ❤️ by the Stock Scanner & Backtesting Engine Team</strong></p>
  <p>Empowering traders with professional-grade analytics tools</p>
</div>