import pandas as pd
import numpy as np
from typing import Tuple, Optional, Dict, Any
import streamlit as st
from functools import lru_cache
try:
    from .performance_optimizer import PerformanceOptimizer
except Exception:
    # Allow running tests that import this module as a top-level module
    from performance_optimizer import PerformanceOptimizer

class TechnicalIndicators:
    """Calculate technical indicators for stock data with offset and timeframe support"""
    
    def __init__(self):
        """Initialize TechnicalIndicators with cache for performance"""
        self._cache = {}
    
    def _validate_input(self, data: pd.Series, window: int, offset: int = 0) -> None:
        """Validate input parameters for indicator calculations"""
        if not isinstance(data, pd.Series):
            raise TypeError("Data must be a pandas Series")
        if not isinstance(window, int) or window <= 0:
            raise ValueError("Window must be a positive integer")
        if not isinstance(offset, int):
            raise ValueError("Offset must be an integer")
    
    def _apply_offset(self, data: pd.Series, offset: int) -> pd.Series:
        """Apply offset to data with boundary handling"""
        if offset == 0:
            return data
        
        # Handle positive offset (look into the future)
        if offset > 0:
            result = data.shift(-offset)
            # Set values beyond data boundary to NaN
            result.iloc[-offset:] = np.nan
        # Handle negative offset (look into the past)
        else:
            result = data.shift(-offset)  # Negative offset becomes positive shift
        
        return result
    
    def _get_timeframe_data(self, data: pd.DataFrame, timeframe: str = 'daily') -> pd.DataFrame:
        """Resample data to different timeframes"""
        if timeframe == 'daily':
            return data
        elif timeframe == 'weekly':
            return data.resample('W').agg({
                'open': 'first',
                'high': 'max',
                'low': 'min',
                'close': 'last',
                'volume': 'sum'
            })
        elif timeframe == 'monthly':
            return data.resample('M').agg({
                'open': 'first',
                'high': 'max',
                'low': 'min',
                'close': 'last',
                'volume': 'sum'
            })
        else:
            raise ValueError(f"Unsupported timeframe: {timeframe}")
    
    @lru_cache(maxsize=128)
    def calculate_sma_offset(self, series_hash: int, window: int, offset: int) -> pd.Series:
        """Calculate SMA with offset support (cached version)"""
        # This is a wrapper for the actual SMA calculation with caching
        # The actual implementation will be in the sma method
        # For now, return empty series - this would need actual implementation
        return pd.Series()
    
    def sma(self, data: pd.Series, window: int, offset: int = 0) -> pd.Series:
        """Simple Moving Average with offset support"""
        self._validate_input(data, window, offset)
        
        if offset != 0:
            # Apply offset before calculation
            offset_data = self._apply_offset(data, offset)
            result = offset_data.rolling(window=window, min_periods=1).mean()
        else:
            result = data.rolling(window=window, min_periods=1).mean()
        
        return result
    
    @lru_cache(maxsize=128)
    def calculate_ema_offset(self, series_hash: int, window: int, offset: int) -> pd.Series:
        """Calculate EMA with offset support (cached version)"""
        # This is a wrapper for the actual EMA calculation with caching
        # The actual implementation will be in the ema method
        # For now, return empty series - this would need actual implementation
        return pd.Series()
    
    def ema(self, data: pd.Series, window: int, offset: int = 0) -> pd.Series:
        """Exponential Moving Average with offset support"""
        self._validate_input(data, window, offset)
        
        if offset != 0:
            # Apply offset before calculation
            offset_data = self._apply_offset(data, offset)
            result = offset_data.ewm(span=window, adjust=False).mean()
        else:
            result = data.ewm(span=window, adjust=False).mean()
        
        return result
    
    @lru_cache(maxsize=128)
    def calculate_rsi_offset(self, series_hash: int, window: int, offset: int) -> pd.Series:
        """Calculate RSI with offset support (cached version)"""
        # This is a wrapper for the actual RSI calculation with caching
        # The actual implementation will be in the rsi method
        # For now, return empty series - this would need actual implementation
        return pd.Series()
    
    def rsi(self, data: pd.Series, window: int = 14, offset: int = 0) -> pd.Series:
        """Relative Strength Index with offset support"""
        self._validate_input(data, window, offset)
        
        if offset != 0:
            # Apply offset before calculation
            offset_data = self._apply_offset(data, offset)
            delta = offset_data.diff()
            gain = (delta.where(delta.gt(0), 0)).rolling(window=window).mean()
            loss = (-delta.where(delta.lt(0), 0)).rolling(window=window).mean()
        else:
            delta = data.diff()
            gain = (delta.where(delta.gt(0), 0)).rolling(window=window).mean()
            loss = (-delta.where(delta.lt(0), 0)).rolling(window=window).mean()
        
        rs = gain / loss
        rsi = 100 - (100 / (1 + rs))
        return rsi
    
    @lru_cache(maxsize=128)
    def calculate_macd_offset(self, series_hash: int, fast: int, slow: int, signal: int, offset: int) -> Tuple[pd.Series, pd.Series, pd.Series]:
        """Calculate MACD with offset support (cached version)"""
        # This is a wrapper for the actual MACD calculation with caching
        # The actual implementation will be in the macd method
        # For now, return empty series - this would need actual implementation
        return pd.Series(), pd.Series(), pd.Series()
    
    def macd(self, data: pd.Series, fast: int = 12, slow: int = 26, signal: int = 9, offset: int = 0) -> Tuple[pd.Series, pd.Series, pd.Series]:
        """MACD (Moving Average Convergence Divergence) with offset support"""
        self._validate_input(data, fast, offset)
        self._validate_input(data, slow, offset)
        self._validate_input(data, signal, offset)
        
        if offset != 0:
            # Apply offset before calculation
            offset_data = self._apply_offset(data, offset)
            ema_fast = self.ema(offset_data, fast)
            ema_slow = self.ema(offset_data, slow)
        else:
            ema_fast = self.ema(data, fast)
            ema_slow = self.ema(data, slow)
        
        macd_line = ema_fast - ema_slow
        signal_line = self.ema(macd_line, signal)
        histogram = macd_line - signal_line
        
        return macd_line, signal_line, histogram
    
    @lru_cache(maxsize=128)
    def calculate_bollinger_bands_offset(self, series_hash: int, window: int, std: float, offset: int) -> Tuple[pd.Series, pd.Series, pd.Series]:
        """Calculate Bollinger Bands with offset support (cached version)"""
        # This is a wrapper for the actual Bollinger Bands calculation with caching
        # The actual implementation will be in the bollinger_bands method
        # For now, return empty series - this would need actual implementation
        return pd.Series(), pd.Series(), pd.Series()
    
    def bollinger_bands(self, data: pd.Series, window: int = 20, num_std: float = 2, offset: int = 0) -> Tuple[pd.Series, pd.Series, pd.Series]:
        """Bollinger Bands with offset support"""
        self._validate_input(data, window, offset)
        
        if offset != 0:
            # Apply offset before calculation
            offset_data = self._apply_offset(data, offset)
            sma = self.sma(offset_data, window)
            std = offset_data.rolling(window=window).std()
        else:
            sma = self.sma(data, window)
            std = data.rolling(window=window).std()
        
        upper = sma + (std * num_std)
        lower = sma - (std * num_std)
        
        return upper, sma, lower
    
    def atr(self, high: pd.Series, low: pd.Series, close: pd.Series, window: int = 14, offset: int = 0) -> pd.Series:
        """Average True Range with offset support"""
        self._validate_input(high, window, offset)
        self._validate_input(low, window, offset)
        self._validate_input(close, window, offset)
        
        if offset != 0:
            offset_high = self._apply_offset(high, offset)
            offset_low = self._apply_offset(low, offset)
            offset_close = self._apply_offset(close, offset)
        else:
            offset_high = high
            offset_low = low
            offset_close = close
        
        tr1 = offset_high - offset_low
        tr2 = abs(offset_high - offset_close.shift())
        tr3 = abs(offset_low - offset_close.shift())
        
        tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
        atr = tr.rolling(window=window).mean()
        
        return atr
    
    def stochastic(self, high: pd.Series, low: pd.Series, close: pd.Series, k_window: int = 14, d_window: int = 3, offset: int = 0) -> Tuple[pd.Series, pd.Series]:
        """Stochastic Oscillator with offset support"""
        self._validate_input(high, k_window, offset)
        self._validate_input(low, k_window, offset)
        self._validate_input(close, k_window, offset)
        
        if offset != 0:
            offset_high = self._apply_offset(high, offset)
            offset_low = self._apply_offset(low, offset)
            offset_close = self._apply_offset(close, offset)
        else:
            offset_high = high
            offset_low = low
            offset_close = close
        
        lowest_low = offset_low.rolling(window=k_window).min()
        highest_high = offset_high.rolling(window=k_window).max()
        
        k_percent = 100 * ((offset_close - lowest_low) / (highest_high - lowest_low))
        d_percent = k_percent.rolling(window=d_window).mean()
        
        return k_percent, d_percent
    
    def williams_r(self, high: pd.Series, low: pd.Series, close: pd.Series, window: int = 14, offset: int = 0) -> pd.Series:
        """Williams %R with offset support"""
        self._validate_input(high, window, offset)
        self._validate_input(low, window, offset)
        self._validate_input(close, window, offset)
        
        if offset != 0:
            offset_high = self._apply_offset(high, offset)
            offset_low = self._apply_offset(low, offset)
            offset_close = self._apply_offset(close, offset)
        else:
            offset_high = high
            offset_low = low
            offset_close = close
        
        highest_high = offset_high.rolling(window=window).max()
        lowest_low = offset_low.rolling(window=window).min()
        
        wr = -100 * ((highest_high - offset_close) / (highest_high - lowest_low))
        return wr
    
    def roc(self, data: pd.Series, window: int = 10, offset: int = 0) -> pd.Series:
        """Rate of Change with offset support"""
        self._validate_input(data, window, offset)
        
        if offset != 0:
            offset_data = self._apply_offset(data, offset)
            result = ((offset_data - offset_data.shift(window)) / offset_data.shift(window)) * 100
        else:
            result = ((data - data.shift(window)) / data.shift(window)) * 100
        
        return result
    
    def momentum(self, data: pd.Series, window: int = 10, offset: int = 0) -> pd.Series:
        """Momentum with offset support"""
        self._validate_input(data, window, offset)
        
        if offset != 0:
            offset_data = self._apply_offset(data, offset)
            result = offset_data - offset_data.shift(window)
        else:
            result = data - data.shift(window)
        
        return result
    
    def cci(self, high: pd.Series, low: pd.Series, close: pd.Series, window: int = 20, offset: int = 0) -> pd.Series:
        """Commodity Channel Index with offset support"""
        self._validate_input(high, window, offset)
        self._validate_input(low, window, offset)
        self._validate_input(close, window, offset)
        
        if offset != 0:
            offset_high = self._apply_offset(high, offset)
            offset_low = self._apply_offset(low, offset)
            offset_close = self._apply_offset(close, offset)
        else:
            offset_high = high
            offset_low = low
            offset_close = close
        
        typical_price = (offset_high + offset_low + offset_close) / 3
        sma_tp = self.sma(typical_price, window)
        mad = typical_price.rolling(window=window).apply(lambda x: np.mean(np.abs(x - x.mean())))
        
        cci = (typical_price - sma_tp) / (0.015 * mad)
        return cci
    
    def add_all_indicators(self, df: pd.DataFrame, offset: int = 0, timeframe: str = 'daily') -> pd.DataFrame:
        """Add all indicators with offset and timeframe support"""
        import time
        start_time = time.time()
        print(f"DEBUG: Starting indicators calculation for {len(df)} rows, {df['symbol'].nunique()} symbols")
        
        df = df.copy()
        
        # Apply timeframe resampling if needed
        if timeframe != 'daily':
            # For now, we'll handle this at the group level
            # In a more complex implementation, we might resample the entire dataframe first
            pass
        
        # Initialize performance optimizer
        perf_optimizer = PerformanceOptimizer()
        
        # Create indicator instance
        indicator = TechnicalIndicators()
        
        # Define vectorized operations for better performance
        print(f"DEBUG: Starting vectorized operations")
        vectorized_start = time.time()
        vectorized_operations = [
            # Price-based calculations
            {'type': 'arithmetic', 'target': 'price_change', 'source': ['close'], 'operation': 'pct_change'},
            {'type': 'arithmetic', 'target': 'log_return', 'source': ['close'], 'operation': 'log'},
            {'type': 'function', 'target': 'volatility_20d', 'source': ['close'], 'operation': 'pct_change'},
            
            # Volume-based calculations
            {'type': 'arithmetic', 'target': 'volume_change', 'source': ['volume'], 'operation': 'pct_change'},
        ]
        
        # Apply vectorized operations for performance
        df = perf_optimizer.vectorize_operations(vectorized_operations, df)
        vectorized_end = time.time()
        print(f"DEBUG: Vectorized operations completed in {vectorized_end - vectorized_start:.2f}s")
        
        # Group by symbol to calculate indicators for each stock
        def calculate_indicators(group):
            group = group.sort_values('date').reset_index(drop=True)
            
            # Moving averages
            group['sma_5'] = indicator.sma(group['close'], 5, offset)
            group['sma_10'] = indicator.sma(group['close'], 10, offset)
            group['sma_20'] = indicator.sma(group['close'], 20, offset)
            group['sma_50'] = indicator.sma(group['close'], 50, offset)
            group['sma_200'] = indicator.sma(group['close'], 200, offset)
            
            group['ema_12'] = indicator.ema(group['close'], 12, offset)
            group['ema_26'] = indicator.ema(group['close'], 26, offset)
            group['ema_20'] = indicator.ema(group['close'], 20, offset)
            group['ema_50'] = indicator.ema(group['close'], 50, offset)
            
            # Volume indicators
            group['volume_sma_20'] = indicator.sma(group['volume'], 20, offset)
            group['volume_sma_50'] = indicator.sma(group['volume'], 50, offset)
            
            # RSI
            group['rsi'] = indicator.rsi(group['close'], 14, offset)
            
            # MACD
            macd, macd_signal, macd_hist = indicator.macd(group['close'], 12, 26, 9, offset)
            group['macd'] = macd
            group['macd_signal'] = macd_signal
            group['macd_histogram'] = macd_hist
            
            # Bollinger Bands
            bb_upper, bb_middle, bb_lower = indicator.bollinger_bands(group['close'], 20, 2, offset)
            group['bb_upper'] = bb_upper
            group['bb_middle'] = bb_middle
            group['bb_lower'] = bb_lower
            group['bb_width'] = bb_upper - bb_lower
            
            # ATR
            group['atr'] = indicator.atr(group['high'], group['low'], group['close'], 14, offset)
            
            # Stochastic
            stoch_k, stoch_d = indicator.stochastic(group['high'], group['low'], group['close'], 14, 3, offset)
            group['stoch_k'] = stoch_k
            group['stoch_d'] = stoch_d
            
            # Williams %R
            group['williams_r'] = indicator.williams_r(group['high'], group['low'], group['close'], 14, offset)
            
            # Rate of Change
            group['roc_10'] = indicator.roc(group['close'], 10, offset)
            group['roc_20'] = indicator.roc(group['close'], 20, offset)
            
            # Momentum
            group['momentum_10'] = indicator.momentum(group['close'], 10, offset)
            
            # CCI
            group['cci'] = indicator.cci(group['high'], group['low'], group['close'], 20, offset)
            
            # High/Low ranges (with offset support)
            if offset != 0:
                offset_high = indicator._apply_offset(group['high'], offset)
                offset_low = indicator._apply_offset(group['low'], offset)
                group['high_20'] = offset_high.rolling(window=20).max()
                group['low_20'] = offset_low.rolling(window=20).min()
                group['high_52w'] = offset_high.rolling(window=252).max()  # ~1 year
                group['low_52w'] = offset_low.rolling(window=252).min()
            else:
                group['high_20'] = group['high'].rolling(window=20).max()
                group['low_20'] = group['low'].rolling(window=20).min()
                group['high_52w'] = group['high'].rolling(window=252).max()  # ~1 year
                group['low_52w'] = group['low'].rolling(window=252).min()
            
            # Price position indicators (with offset support)
            if offset != 0:
                offset_close = indicator._apply_offset(group['close'], offset)
                offset_sma20 = indicator.sma(offset_close, 20, 0)  # No offset for SMA itself
                offset_sma50 = indicator.sma(offset_close, 50, 0)  # No offset for SMA itself
                group['price_vs_sma20'] = (offset_close - offset_sma20) / offset_sma20 * 100
                group['price_vs_sma50'] = (offset_close - offset_sma50) / offset_sma50 * 100
            else:
                group['price_vs_sma20'] = (group['close'] - group['sma_20']) / group['sma_20'] * 100
                group['price_vs_sma50'] = (group['close'] - group['sma_50']) / group['sma_50'] * 100
            
            # Volume indicators (with offset support)
            if offset != 0:
                offset_volume = indicator._apply_offset(group['volume'], offset)
                offset_volume_sma20 = indicator.sma(offset_volume, 20, 0)  # No offset for SMA itself
                group['volume_ratio'] = offset_volume / offset_volume_sma20
            else:
                group['volume_ratio'] = group['volume'] / group['volume_sma_20']
            
            return group
        
        # Apply indicators to each symbol group with performance optimization
        def optimized_groupby_apply(group):
            return calculate_indicators(group)
        
        # Use regular groupby apply (cached_groupby_apply was removed from PerformanceOptimizer)
        print(f"DEBUG: Starting groupby apply operation for {df['symbol'].nunique()} symbols")
        groupby_start = time.time()
        result = df.groupby('symbol').apply(optimized_groupby_apply)
        groupby_end = time.time()
        print(f"DEBUG: Groupby apply completed in {groupby_end - groupby_start:.2f}s")
        
        # Ensure the result is a DataFrame
        if isinstance(result, pd.Series):
            result = result.reset_index()
        else:
            result = result.reset_index(drop=True)
        
        # Apply final memory optimization
        print(f"DEBUG: Starting final memory optimization")
        final_mem_start = time.time()
        result = perf_optimizer.optimize_memory_usage(result)
        final_mem_end = time.time()
        print(f"DEBUG: Final memory optimization completed in {final_mem_end - final_mem_start:.2f}s")
        
        total_end = time.time()
        print(f"DEBUG: Total indicators calculation completed in {total_end - start_time:.2f}s, final shape: {result.shape}")
        
        return result

class IndicatorUtils:
    """Utility functions for technical indicators"""
    
    @staticmethod
    def get_indicator_info() -> dict:
        """Get information about available indicators"""
        return {
            'Moving Averages': {
                'sma_5': 'Simple Moving Average (5 periods)',
                'sma_10': 'Simple Moving Average (10 periods)',
                'sma_20': 'Simple Moving Average (20 periods)',
                'sma_50': 'Simple Moving Average (50 periods)',
                'sma_200': 'Simple Moving Average (200 periods)',
                'ema_12': 'Exponential Moving Average (12 periods)',
                'ema_26': 'Exponential Moving Average (26 periods)',
                'ema_20': 'Exponential Moving Average (20 periods)',
                'ema_50': 'Exponential Moving Average (50 periods)',
            },
            'Oscillators': {
                'rsi': 'Relative Strength Index (0-100)',
                'stoch_k': 'Stochastic %K',
                'stoch_d': 'Stochastic %D',
                'williams_r': 'Williams %R',
                'cci': 'Commodity Channel Index',
            },
            'Trend Indicators': {
                'macd': 'MACD Line',
                'macd_signal': 'MACD Signal Line',
                'macd_histogram': 'MACD Histogram',
            },
            'Volatility Indicators': {
                'bb_upper': 'Bollinger Band Upper',
                'bb_middle': 'Bollinger Band Middle',
                'bb_lower': 'Bollinger Band Lower',
                'bb_width': 'Bollinger Band Width',
                'atr': 'Average True Range',
            },
            'Volume Indicators': {
                'volume_sma_20': '20-day Volume Average',
                'volume_sma_50': '50-day Volume Average',
                'volume_ratio': 'Volume Ratio (current/20-day avg)',
            },
            'Price Position': {
                'high_20': '20-day High',
                'low_20': '20-day Low',
                'high_52w': '52-week High',
                'low_52w': '52-week Low',
                'price_vs_sma20': 'Price vs SMA(20) %',
                'price_vs_sma50': 'Price vs SMA(50) %',
            },
            'Momentum': {
                'roc_10': '10-day Rate of Change',
                'roc_20': '20-day Rate of Change',
                'momentum_10': '10-day Momentum',
            }
        }
    
    @staticmethod
    def get_indicator_ranges() -> dict:
        """Get typical ranges for indicators"""
        return {
            'rsi': (0, 100),
            'stoch_k': (0, 100),
            'stoch_d': (0, 100),
            'williams_r': (-100, 0),
            'cci': (-200, 200),
            'bb_width': (0, None),
            'atr': (0, None),
            'volume_ratio': (0, None),
            'price_vs_sma20': (None, None),
            'price_vs_sma50': (None, None),
            'roc_10': (None, None),
            'roc_20': (None, None),
            'momentum_10': (None, None),
        }
    
    @staticmethod
    def get_overbought_oversold_levels() -> dict:
        """Get common overbought/oversold levels"""
        return {
            'rsi': {'oversold': 30, 'overbought': 70},
            'stoch_k': {'oversold': 20, 'overbought': 80},
            'stoch_d': {'oversold': 20, 'overbought': 80},
            'williams_r': {'oversold': -80, 'overbought': -20},
            'cci': {'oversold': -100, 'overbought': 100},
        }

class PatternRecognition:
    """Basic pattern recognition functions"""
    
    @staticmethod
    def identify_golden_cross(sma_50: pd.Series, sma_200: pd.Series) -> pd.Series:
        """Identify Golden Cross pattern (SMA 50 crosses above SMA 200)"""
        prev_below = sma_50.shift(1) <= sma_200.shift(1)
        curr_above = sma_50 > sma_200
        return prev_below & curr_above
    
    @staticmethod
    def identify_death_cross(sma_50: pd.Series, sma_200: pd.Series) -> pd.Series:
        """Identify Death Cross pattern (SMA 50 crosses below SMA 200)"""
        prev_above = sma_50.shift(1) >= sma_200.shift(1)
        curr_below = sma_50 < sma_200
        return prev_above & curr_below
    
    @staticmethod
    def identify_bullish_divergence(price: pd.Series, oscillator: pd.Series, window: int = 20) -> pd.Series:
        """Identify bullish divergence (price makes lower lows, oscillator makes higher lows)"""
        price_low = price.rolling(window).min()
        osc_low = oscillator.rolling(window).min()
        
        price_lower_low = price_low < price_low.shift(window)
        osc_higher_low = osc_low > osc_low.shift(window)
        
        return price_lower_low & osc_higher_low
    
    @staticmethod
    def identify_bearish_divergence(price: pd.Series, oscillator: pd.Series, window: int = 20) -> pd.Series:
        """Identify bearish divergence (price makes higher highs, oscillator makes lower highs)"""
        price_high = price.rolling(window).max()
        osc_high = oscillator.rolling(window).max()
        
        price_higher_high = price_high > price_high.shift(window)
        osc_lower_high = osc_high < osc_high.shift(window)
        
        return price_higher_high & osc_lower_high
    
    @staticmethod
    def identify_breakout(price: pd.Series, resistance: pd.Series, volume: pd.Series, volume_sma: pd.Series) -> pd.Series:
        """Identify breakout pattern (price breaks resistance with volume confirmation)"""
        price_breakout = price > resistance
        volume_confirmation = volume > volume_sma * 1.5
        
        return price_breakout & volume_confirmation
    
    @staticmethod
    def identify_support_break(price: pd.Series, support: pd.Series, volume: pd.Series, volume_sma: pd.Series) -> pd.Series:
        """Identify support break pattern"""
        price_break = price < support
        volume_confirmation = volume > volume_sma * 1.5
        
        return price_break & volume_confirmation

# Performance optimized versions using NumPy
class FastIndicators:
    """Optimized versions of technical indicators using NumPy"""
    
    @staticmethod
    @st.cache_data
    def fast_sma(data: np.ndarray, window: int) -> np.ndarray:
        """Fast SMA calculation using NumPy"""
        if len(data) < window:
            return np.full(len(data), np.nan)
        
        # Use convolution for fast SMA calculation
        weights = np.ones(window) / window
        sma = np.convolve(data, weights, mode='valid')
        
        # Pad with NaN for initial values
        padded_sma = np.full(len(data), np.nan)
        padded_sma[window-1:] = sma
        
        return padded_sma
    
    @staticmethod
    @st.cache_data
    def fast_ema(data: np.ndarray, window: int) -> np.ndarray:
        """Fast EMA calculation using NumPy"""
        alpha = 2.0 / (window + 1.0)
        ema = np.zeros_like(data)
        ema[0] = data[0]
        
        for i in range(1, len(data)):
            ema[i] = alpha * data[i] + (1 - alpha) * ema[i-1]
        
        return ema
    
    @staticmethod
    @st.cache_data
    def fast_rsi(data: np.ndarray, window: int = 14) -> np.ndarray:
        """Fast RSI calculation using NumPy"""
        if len(data) < window + 1:
            return np.full(len(data), np.nan)
        
        delta = np.diff(data)
        gain = np.where(delta > 0, delta, 0)
        loss = np.where(delta < 0, -delta, 0)
        
        avg_gain = np.zeros_like(data)
        avg_loss = np.zeros_like(data)
        
        # Initial average
        avg_gain[window] = np.mean(gain[:window])
        avg_loss[window] = np.mean(loss[:window])
        
        # Smoothed averages
        for i in range(window + 1, len(data)):
            avg_gain[i] = (avg_gain[i-1] * (window - 1) + gain[i-1]) / window
            avg_loss[i] = (avg_loss[i-1] * (window - 1) + loss[i-1]) / window
        
        rs = np.divide(avg_gain, avg_loss, out=np.zeros_like(avg_gain), where=avg_loss!=0)
        rsi = 100 - (100 / (1 + rs))
        
        # Set initial values to NaN
        rsi[:window] = np.nan
        
        return rsi