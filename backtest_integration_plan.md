# BackTestEngine Integration Plan

## Current Architecture Analysis

### BackTestEngine.py Structure
The backtesting engine has these key components:
- **Core Functions**: [`calculate_position_size()`](backend/BackTestEngine.py:24), [`calculate_trade_outcomes_vectorized()`](backend/BackTestEngine.py:114), [`run_single_parameter_combo()`](backend/BackTestEngine.py:251)
- **Vectorization**: Uses Numba JIT compilation ([`@jit`](backend/BackTestEngine.py:114)) and NumPy for performance
- **Position Sizing**: 6 methods including Kelly Criterion, volatility targeting, ATR-based
- **Signal Processing**: Expects manual signal file uploads with specific format
- **UI**: Streamlit-based interface with parameter controls

### Existing Scanner Project Structure
- **Data Pipeline**: [`utils_module.py`](backend/utils_module.py) → [`indicators_module.py`](backend/indicators_module.py) → [`filters_module.py`](backend/filters_module.py)
- **API Layer**: FastAPI endpoints in [`main.py`](backend/main.py)
- **Performance**: [`performance_optimizer.py`](backend/performance_optimizer.py) with vectorization capabilities
- **Frontend**: React components for file upload and results display

## Integration Points Identified

### 1. **Signal Generation Integration**
- **Current**: BackTestEngine expects manual CSV uploads with 'Ticker' and 'Date' columns
- **Target**: Direct consumption from scanner's filtered results
- **Integration Point**: Transform scanner output to match expected signal format

### 2. **Data Format Compatibility**
- **Current**: BackTestEngine expects OHLCV data with 'Ticker', 'Date', 'Open', 'High', 'Low', 'Close', 'Volume'
- **Target**: Scanner uses 'symbol', 'date', 'open', 'high', 'low', 'close', 'volume' (lowercase)
- **Integration Point**: Standardize column naming conventions

### 3. **Performance Optimization Synergy**
- **Current**: Both have vectorization capabilities
- **Target**: Leverage existing [`performance_optimizer.py`](backend/performance_optimizer.py) instead of duplicate functionality
- **Integration Point**: Merge vectorization approaches

### 4. **API Extension**
- **Current**: BackTestEngine is standalone Streamlit app
- **Target**: Integrate into existing FastAPI backend
- **Integration Point**: Add `/api/backtest` endpoints to [`main.py`](backend/main.py)

### 5. **Single Data Source Policy**
- The same uploaded dataset is the single source of truth for both signal generation and backtesting
- No duplicate uploads are required; backtesting consumes the same `processed_data` used by the scanner
- The backend exposes a normalized OHLCV view (e.g., `/api/data/ohlcv`) derived from `processed_data` for backtesting to consume directly

## Phase-wise Migration Plan

### Phase 1: Backend Integration (Week 1-2)
**Objective**: Create API endpoints for backtesting without UI changes

#### 1.1 Create BackTest API Module
```python
# backend/backtest_api.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from .backtest_engine import BackTestEngine
from .utils_module import DataProcessor

router = APIRouter()

class BacktestRequest(BaseModel):
    signals_data: pd.DataFrame
    ohlcv_data: pd.DataFrame
    initial_capital: float = 100000
    stop_loss: float = 5.0
    take_profit: Optional[float] = None
    holding_period: int = 20
    signal_type: str = "long"
    position_sizing: str = "equal_weight"
    allow_leverage: bool = False

class BacktestResponse(BaseModel):
    trades: List[Dict]
    performance_metrics: Dict
    equity_curve: pd.DataFrame
    summary: Dict
```

#### 1.2 Data Transformation Layer
```python
# backend/signal_transformer.py
class SignalTransformer:
    def transform_scanner_signals(self, scanner_results: pd.DataFrame) -> pd.DataFrame:
        """Convert scanner output to BackTestEngine format"""
        # Map column names: symbol → Ticker, date → Date
        transformed_df = scanner_results.copy()
        transformed_df['Ticker'] = transformed_df['symbol']
        transformed_df['Date'] = transformed_df['date']
        
        # Standardize OHLCV column names
        column_mapping = {
            'open': 'Open',
            'high': 'High', 
            'low': 'Low',
            'close': 'Close',
            'volume': 'Volume'
        }
        
        for old_name, new_name in column_mapping.items():
            if old_name in transformed_df.columns:
                transformed_df[new_name] = transformed_df[old_name]
        
        return transformed_df[['Ticker', 'Date', 'Open', 'High', 'Low', 'Close', 'Volume']]
    
    def prepare_vectorized_data(self, ohlcv_df: pd.DataFrame) -> Dict[str, np.ndarray]:
        """Prepare OHLCV data in vectorized format for faster processing"""
        vectorized_data = {}
        
        for ticker in ohlcv_df['Ticker'].unique():
            ticker_data = ohlcv_df[ohlcv_df['Ticker'] == ticker].sort_values('Date')
            
            # Create numpy array: [Date_ordinal, High, Low, Close, Volume]
            dates = ticker_data['Date'].map(pd.Timestamp.toordinal).values
            prices = ticker_data[['High', 'Low', 'Close']].values
            
            # Combine dates and prices
            combined = np.column_stack([dates, prices])
            vectorized_data[ticker] = combined
        
        return vectorized_data
```

#### 1.3 Integrate with Performance Optimizer
```python
# backend/backtest_engine_adapter.py
from .performance_optimizer import PerformanceOptimizer

class BacktestEngineAdapter:
    def __init__(self):
        self.performance_optimizer = PerformanceOptimizer()
    
    def optimize_backtest_operations(self, operations: List[Dict], data: pd.DataFrame) -> pd.DataFrame:
        """Apply vectorized operations for better performance"""
        return self.performance_optimizer.vectorize_operations(operations, data)
    
    def optimize_memory_usage(self, data: pd.DataFrame) -> pd.DataFrame:
        """Optimize memory usage for large datasets"""
        return self.performance_optimizer.optimize_memory_usage(data)
```

### Phase 2: Frontend Integration (Week 3-4)
**Objective**: Add backtesting controls to React frontend, reusing the same uploaded dataset for signals and backtesting (no second upload)

#### 2.1 Backtesting Component
```javascript
// frontend/src/components/BacktestControls.js
import React, { useState } from 'react';

const BacktestControls = ({ filteredResults }) => {
  const [backtestParams, setBacktestParams] = useState({
    initialCapital: 100000,
    stopLoss: 5.0,
    takeProfit: null,
    holdingPeriod: 20,
    signalType: 'long',
    positionSizing: 'equal_weight',
    allowLeverage: false
  });

  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState(null);

  const runBacktest = async () => {
    setIsRunning(true);
    try {
      const response = await fetch('/api/backtest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          signals_data: filteredResults,
          ohlcv_data: await getOHLCVData(), // Function to fetch OHLCV data
          ...backtestParams
        })
      });
      
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Backtest failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="backtest-controls">
      <h3>Backtest Parameters</h3>
      {/* Parameter controls here */}
      <button 
        onClick={runBacktest} 
        disabled={isRunning || !filteredResults.length}
      >
        {isRunning ? 'Running Backtest...' : 'Run Backtest'}
      </button>
      
      {results && <BacktestResults results={results} />}
    </div>
  );
};
```

#### 2.2 Results Display Integration
```javascript
// frontend/src/components/BacktestResults.js
const BacktestResults = ({ results }) => {
  const { trades, performance_metrics, equity_curve, summary } = results;

  return (
    <div className="backtest-results">
      <h4>Performance Summary</h4>
      <div className="metrics-grid">
        <div className="metric">
          <span className="label">Total Return:</span>
          <span className="value">{performance_metrics.total_return}%</span>
        </div>
        <div className="metric">
          <span className="label">Win Rate:</span>
          <span className="value">{performance_metrics.win_rate}%</span>
        </div>
        <div className="metric">
          <span className="label">Sharpe Ratio:</span>
          <span className="value">{performance_metrics.sharpe_ratio}</span>
        </div>
        <div className="metric">
          <span className="label">Max Drawdown:</span>
          <span className="value">{performance_metrics.max_drawdown}%</span>
        </div>
      </div>

      <h4>Trades ({trades.length})</h4>
      <div className="trades-table">
        {/* Display trades in table format */}
      </div>

      <h4>Equity Curve</h4>
      <div className="equity-chart">
        {/* Chart equity curve over time */}
      </div>
    </div>
  );
};
```

### Phase 3: Advanced Features (Week 5-6)
**Objective**: Add sophisticated backtesting capabilities

#### 3.1 Parameter Optimization
```python
# backend/backtest_optimizer.py
from .performance_optimizer import PerformanceOptimizer
from concurrent.futures import ProcessPoolExecutor

class BacktestOptimizer:
    def __init__(self):
        self.performance_optimizer = PerformanceOptimizer()
    
    def optimize_parameters(self, signals_data, ohlcv_data, param_ranges):
        """Run parameter optimization using existing vectorization"""
        # Generate parameter combinations
        param_combinations = self._generate_param_combinations(param_ranges)
        
        # Use parallel processing for optimization
        with ProcessPoolExecutor() as executor:
            futures = []
            for params in param_combinations:
                future = executor.submit(
                    self._run_single_backtest,
                    signals_data, ohlcv_data, params
                )
                futures.append(future)
            
            # Collect results
            results = []
            for future in futures:
                try:
                    result = future.result()
                    results.append(result)
                except Exception as e:
                    logger.error(f"Backtest failed: {e}")
            
            return self._analyze_optimization_results(results)
    
    def _generate_param_combinations(self, param_ranges):
        """Generate all parameter combinations for optimization"""
        from itertools import product
        
        param_names = list(param_ranges.keys())
        param_values = list(param_ranges.values())
        
        combinations = []
        for values in product(*param_values):
            combination = dict(zip(param_names, values))
            combinations.append(combination)
        
        return combinations
```

#### 3.2 Monte Carlo Simulation
```python
# backend/monte_carlo.py
import numpy as np

class MonteCarloSimulator:
    def __init__(self, backtest_engine):
        self.backtest_engine = backtest_engine
    
    def run_simulation(self, trade_results, n_simulations=1000, n_trades=50):
        """Run Monte Carlo simulation on historical trade results"""
        returns = trade_results['Profit/Loss (%)'] / 100
        
        simulations = []
        for _ in range(n_simulations):
            # Sample returns with replacement
            sim_returns = np.random.choice(returns, n_trades, replace=True)
            # Calculate cumulative return
            final_return = np.prod(1 + sim_returns) - 1
            simulations.append(final_return * 100)
        
        return {
            'simulations': simulations,
            'mean_return': np.mean(simulations),
            'std_return': np.std(simulations),
            'percentiles': {
                '5th': np.percentile(simulations, 5),
                '25th': np.percentile(simulations, 25),
                '50th': np.percentile(simulations, 50),
                '75th': np.percentile(simulations, 75),
                '95th': np.percentile(simulations, 95)
            }
        }
```

#### 3.3 Risk Management Integration
```python
# backend/risk_management.py
class RiskManager:
    def __init__(self):
        self.position_limits = {
            'max_single_position': 0.10,  # 10% of portfolio
            'max_sector_exposure': 0.30,  # 30% per sector
            'max_correlation': 0.70      # 70% correlation limit
        }
    
    def validate_position_sizes(self, proposed_positions, portfolio_value):
        """Validate position sizes against risk limits"""
        validation_result = {
            'valid': True,
            'violations': [],
            'adjusted_positions': proposed_positions.copy()
        }
        
        # Check single position limits
        for symbol, position in proposed_positions.items():
            position_value = position['shares'] * position['entry_price']
            position_ratio = position_value / portfolio_value
            
            if position_ratio > self.position_limits['max_single_position']:
                validation_result['valid'] = False
                validation_result['violations'].append({
                    'symbol': symbol,
                    'reason': 'Single position too large',
                    'current_ratio': position_ratio,
                    'limit': self.position_limits['max_single_position']
                })
                
                # Adjust position size
                max_shares = (portfolio_value * self.position_limits['max_single_position']) / position['entry_price']
                validation_result['adjusted_positions'][symbol]['shares'] = max_shares
        
        return validation_result
```

### Phase 4: Production Readiness (Week 7-8)
**Objective**: Final integration and optimization

#### 4.1 Caching Layer
```python
# backend/backtest_cache.py
import redis
import json
from datetime import timedelta

class BacktestCache:
    def __init__(self, redis_url='redis://localhost:6379'):
        self.redis_client = redis.from_url(redis_url)
        self.default_ttl = timedelta(hours=24)
    
    def get_backtest_result(self, cache_key):
        """Get cached backtest result"""
        try:
            cached_result = self.redis_client.get(cache_key)
            if cached_result:
                return json.loads(cached_result)
            return None
        except Exception as e:
            logger.error(f"Cache get error: {e}")
            return None
    
    def set_backtest_result(self, cache_key, result, ttl=None):
        """Cache backtest result"""
        try:
            if ttl is None:
                ttl = self.default_ttl
            
            self.redis_client.setex(
                cache_key,
                ttl,
                json.dumps(result, default=str)
            )
        except Exception as e:
            logger.error(f"Cache set error: {e}")
    
    def generate_cache_key(self, signals_hash, params):
        """Generate cache key based on signals and parameters"""
        import hashlib
        key_data = f"{signals_hash}_{json.dumps(params, sort_keys=True)}"
        return hashlib.md5(key_data.encode()).hexdigest()
```

#### 4.2 Monitoring & Analytics
```python
# backend/backtest_monitoring.py
import logging
from datetime import datetime

class BacktestMonitor:
    def __init__(self):
        self.logger = logging.getLogger(__name__)
    
    def log_backtest_start(self, params, signals_count):
        """Log backtest execution start"""
        self.logger.info(f"Backtest started: {params}, signals: {signals_count}")
    
    def log_backtest_complete(self, duration, trades_count, performance_metrics):
        """Log backtest execution completion"""
        self.logger.info(
            f"Backtest completed: duration={duration}s, "
            f"trades={trades_count}, "
            f"return={performance_metrics.get('total_return', 0)}%"
        )
    
    def log_performance_metrics(self, metrics):
        """Log performance metrics for analytics"""
        timestamp = datetime.now().isoformat()
        log_entry = {
            'timestamp': timestamp,
            'metrics': metrics
        }
        
        # Log to file or send to monitoring system
        self.logger.info(f"Performance metrics: {log_entry}")
```

#### 4.3 API Endpoints Integration
```python
# Add to backend/main.py
from .backtest_api import router as backtest_router

# Add to FastAPI app
app.include_router(backtest_router, prefix="/api/backtest", tags=["backtest"])

# NOTE: The backend reuses the same uploaded processed_data for both signals and backtesting.
#       When possible, the backtest API derives OHLCV from server-side processed_data
#       (e.g., via an internal service or a public helper like /api/data/ohlcv),
#       avoiding any second upload.
# New endpoints
@app.post("/api/backtest/run")
async def run_backtest(request: BacktestRequest):
    """Run backtest on provided signals"""
    try:
        # Transform signals data
        transformer = SignalTransformer()
        transformed_signals = transformer.transform_scanner_signals(request.signals_data)
        vectorized_data = transformer.prepare_vectorized_data(request.ohlcv_data)
        
        # Initialize backtest engine
        backtest_engine = BackTestEngine()
        
        # Run backtest
        results = backtest_engine.run_single_parameter_combo(
            (vectorized_data, transformed_signals, 
             request.holding_period, request.stop_loss, request.take_profit,
             request.signal_type, request.initial_capital,
             request.position_sizing, {}, False, request.allow_leverage)
        )
        
        return BacktestResponse(
            trades=results.get('trades', []),
            performance_metrics=results.get('performance_metrics', {}),
            equity_curve=results.get('equity_curve', pd.DataFrame()),
            summary=results.get('summary', {})
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/backtest/optimize")
async def optimize_backtest(request: BacktestRequest, param_ranges: dict):
    """Run parameter optimization"""
    try:
        optimizer = BacktestOptimizer()
        results = optimizer.optimize_parameters(
            request.signals_data, 
            request.ohlcv_data,
            param_ranges
        )
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

## Implementation Priority

### High Priority (Week 1-2)
1. **Data transformation layer** - SignalTransformer class
2. **Basic API endpoints** - `/api/backtest/run`
3. **Frontend integration** - BacktestControls component
4. **Performance optimization** - Integrate with existing performance_optimizer

### Medium Priority (Week 3-4)
1. **Parameter optimization** - BacktestOptimizer class
2. **Results display** - BacktestResults component
3. **Error handling** - Comprehensive error handling for backtest execution
4. **Testing** - Unit and integration tests

### Low Priority (Week 5-8)
1. **Monte Carlo simulation** - MonteCarloSimulator class
2. **Risk management** - RiskManager class
3. **Caching layer** - BacktestCache class
4. **Monitoring** - BacktestMonitor class
5. **Documentation** - API documentation and user guides

## Key Integration Benefits

1. **Unified Data Pipeline**: Scanner → Indicators → Filters → Backtesting
2. **Performance Optimization**: Leverage existing vectorization and caching
3. **Seamless User Experience**: No file uploads needed, immediate backtesting
4. **Scalable Architecture**: API-based integration supports multiple frontends
5. **Code Reuse**: Eliminate duplicate functionality between modules

## Success Metrics

1. **Integration Time**: Complete integration within 8 weeks
2. **Performance**: Backtest execution time reduced by 30% through vectorization
3. **User Experience**: Zero file uploads required for backtesting
4. **Code Quality**: 90% test coverage for new integration components
5. **Performance**: 50% reduction in memory usage through optimization

This phased approach ensures minimal disruption to existing functionality while gradually integrating the powerful backtesting capabilities into the scanner ecosystem.