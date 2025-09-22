"""
Chart API Endpoints for TradingView Integration
Provides optimized endpoints for chart data, indicators, and annotations
"""

from fastapi import APIRouter, HTTPException, Query, Depends
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import json
import logging

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from utils_module import DataProcessor
from indicators_module import TechnicalIndicators
from performance_optimizer import PerformanceOptimizer

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter()

# Pydantic models for request/response
class ChartDataRequest(BaseModel):
    symbol: str = Field(..., description="Trading symbol")
    timeframe: str = Field(default="1D", description="Timeframe (1D, 5D, 1M, 6M, 1Y, 5Y, MAX)")
    start_date: Optional[str] = Field(None, description="Start date (YYYY-MM-DD)")
    end_date: Optional[str] = Field(None, description="End date (YYYY-MM-DD)")
    limit: int = Field(default=1000, ge=1, le=50000, description="Maximum number of data points")
    indicators: List[Dict] = Field(default_factory=list, description="Technical indicators to calculate")

class ChartDataResponse(BaseModel):
    symbol: str
    timeframe: str
    data: List[Dict]
    indicators: Dict[str, List[Dict]]
    statistics: Dict[str, Any]
    metadata: Dict[str, Any]

class IndicatorRequest(BaseModel):
    symbol: str
    indicator: str
    parameters: Dict[str, Any] = Field(default_factory=dict)
    timeframe: str = "1D"

class IndicatorResponse(BaseModel):
    symbol: str
    indicator: str
    data: List[Dict]
    parameters: Dict[str, Any]

class AnnotationRequest(BaseModel):
    symbol: str
    annotations: List[Dict]
    chart_type: str = "candlestick"

class AnnotationResponse(BaseModel):
    symbol: str
    saved_annotations: List[Dict]
    status: str

class ChartConfigResponse(BaseModel):
    themes: Dict[str, Any]
    indicators: List[Dict]
    timeframes: List[str]
    chart_types: List[str]
    default_config: Dict[str, Any]

# Dependencies
def get_data_processor():
    return DataProcessor()

def get_technical_indicators():
    return TechnicalIndicators()

def get_performance_optimizer():
    return PerformanceOptimizer()

# Utility functions
def parse_timeframe(timeframe: str) -> Dict[str, Any]:
    """Parse timeframe string to pandas frequency and limit"""
    timeframe_map = {
        '1D': {'freq': 'D', 'limit': 365},
        '5D': {'freq': 'D', 'limit': 5},
        '1M': {'freq': 'M', 'limit': 30},
        '6M': {'freq': 'M', 'limit': 6},
        '1Y': {'freq': 'M', 'limit': 12},
        '5Y': {'freq': 'M', 'limit': 60},
        'MAX': {'freq': 'M', 'limit': None}
    }

    if timeframe not in timeframe_map:
        raise ValueError(f"Unsupported timeframe: {timeframe}")

    config = timeframe_map[timeframe]
    return config

def transform_to_tradingview_format(data: pd.DataFrame) -> List[Dict]:
    """Transform pandas DataFrame to TradingView format"""
    if data is None or data.empty:
        return []

    try:
        # Ensure data is sorted by date
        data = data.sort_index()

        # Convert to TradingView format
        tradingview_data = []
        for timestamp, row in data.iterrows():
            # Handle different timestamp formats
            try:
                if isinstance(timestamp, str):
                    time_unix = int(pd.Timestamp(timestamp).timestamp())
                elif isinstance(timestamp, pd.Timestamp):
                    time_unix = int(timestamp.timestamp())
                elif isinstance(timestamp, (int, float)):
                    time_unix = int(timestamp)
                else:
                    # Try to convert to timestamp
                    time_unix = int(pd.Timestamp(str(timestamp)).timestamp())
            except Exception as e:
                logger.warning(f"Could not convert timestamp: {timestamp}, error: {e}")
                continue

            tradingview_data.append({
                'time': time_unix,
                'open': float(row.get('open', row.get('Open', 0))),
                'high': float(row.get('high', row.get('High', 0))),
                'low': float(row.get('low', row.get('Low', 0))),
                'close': float(row.get('close', row.get('Close', 0))),
                'volume': float(row.get('volume', row.get('Volume', 0)))
            })

        return tradingview_data
    except Exception as e:
        logger.error(f"Error transforming data to TradingView format: {e}")
        return []

def calculate_data_statistics(data: pd.DataFrame) -> Dict[str, Any]:
    """Calculate basic statistics for the dataset"""
    if data is None or data.empty:
        return {
            'count': 0,
            'start_date': None,
            'end_date': None,
            'price_range': {'min': 0, 'max': 0},
            'volume_range': {'min': 0, 'max': 0},
            'avg_volume': 0
        }

    try:
        close_prices = data.get('close', data.get('Close', pd.Series([])))
        volumes = data.get('volume', data.get('Volume', pd.Series([])))

        return {
            'count': len(data),
            'start_date': data.index.min().strftime('%Y-%m-%d') if hasattr(data.index, 'strftime') else str(data.index.min()),
            'end_date': data.index.max().strftime('%Y-%m-%d') if hasattr(data.index, 'strftime') else str(data.index.max()),
            'price_range': {
                'min': float(close_prices.min()),
                'max': float(close_prices.max())
            },
            'volume_range': {
                'min': float(volumes.min()),
                'max': float(volumes.max())
            },
            'avg_volume': float(volumes.mean())
        }
    except Exception as e:
        logger.error(f"Error calculating statistics: {e}")
        return {
            'count': len(data),
            'start_date': None,
            'end_date': None,
            'price_range': {'min': 0, 'max': 0},
            'volume_range': {'min': 0, 'max': 0},
            'avg_volume': 0
        }

# API Endpoints

@router.get("/api/charts/{symbol}/ohlcv", response_model=ChartDataResponse)
async def get_chart_data(
    symbol: str,
    timeframe: str = "1D",
    limit: int = Query(default=1000, ge=1, le=50000),
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    data_processor: DataProcessor = Depends(get_data_processor)
):
    """
    Get OHLCV data for a symbol optimized for TradingView charts
    """
    try:
        logger.info(f"Fetching chart data for {symbol}, timeframe: {timeframe}, limit: {limit}")

        # Get raw data from existing pipeline
        # For now, we'll use a simplified approach since the actual data loading
        # would need to be integrated with the existing data processing pipeline
        # In a real implementation, you would load data from your data source
        # data = data_processor.get_latest_data(symbol, limit)
        # For this example, we'll return a mock response
        import pandas as pd
        from datetime import datetime, timedelta

        # Create mock data for demonstration
        end_date_dt = datetime.now()
        start_date_dt = end_date_dt - timedelta(days=limit)

        # Generate sample OHLCV data
        dates = pd.date_range(start=start_date_dt, end=end_date_dt, freq='D')
        base_price = 100.0

        data_list = []
        for i, date in enumerate(dates):
            # Generate realistic price movements
            change = np.random.normal(0, 0.02)  # 2% daily volatility
            open_price = base_price * (1 + change)
            high_price = open_price * (1 + abs(np.random.normal(0, 0.01)))
            low_price = open_price * (1 - abs(np.random.normal(0, 0.01)))
            close_price = open_price * (1 + np.random.normal(0, 0.005))
            volume = np.random.randint(100000, 1000000)

            data_list.append({
                'date': date,
                'symbol': symbol,
                'open': max(open_price, 0.01),  # Ensure positive prices
                'high': max(high_price, 0.01),
                'low': max(low_price, 0.01),
                'close': max(close_price, 0.01),
                'volume': volume
            })

        data = pd.DataFrame(data_list)
        data.set_index('date', inplace=True)

        if data is None or data.empty:
            raise HTTPException(status_code=404, detail=f"No data found for symbol: {symbol}")

        # Transform to TradingView format
        transformed_data = transform_to_tradingview_format(data)

        if not transformed_data:
            raise HTTPException(status_code=500, detail="Failed to transform data")

        # Calculate statistics
        statistics = calculate_data_statistics(data)

        # Prepare indicators (placeholder for now)
        indicators = {}

        return ChartDataResponse(
            symbol=symbol,
            timeframe=timeframe,
            data=transformed_data,
            indicators=indicators,
            statistics=statistics,
            metadata={
                'data_points': len(transformed_data),
                'timeframe': timeframe,
                'last_updated': datetime.now().isoformat()
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching chart data for {symbol}: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/api/charts/{symbol}/indicators", response_model=IndicatorResponse)
async def get_chart_indicators(
    symbol: str,
    indicator: str,
    parameters: str = Query(default="{}", description="JSON string of indicator parameters"),
    timeframe: str = "1D",
    data_processor: DataProcessor = Depends(get_data_processor),
    technical_indicators: TechnicalIndicators = Depends(get_technical_indicators)
):
    """
    Get technical indicators for a symbol
    """
    try:
        logger.info(f"Calculating indicator {indicator} for {symbol}")

        # Parse parameters
        try:
            params = json.loads(parameters)
        except json.JSONDecodeError:
            params = {}

        # Get base data
        timeframe_config = parse_timeframe(timeframe)
        # For now, use mock data since we don't have the actual data loading integrated
        # In a real implementation, you would use: data = data_processor.get_latest_data(symbol, 1000)
        data = pd.DataFrame()  # Placeholder

        if data is None or data.empty:
            raise HTTPException(status_code=404, detail=f"No data found for symbol: {symbol}")

        # Calculate indicator - placeholder for now
        # In a real implementation, you would use: indicator_data = technical_indicators.calculate_indicator(data, indicator, **params)
        indicator_data = pd.Series()  # Placeholder

        if indicator_data is None or indicator_data.empty:
            raise HTTPException(status_code=500, detail=f"Failed to calculate {indicator}")

        # Transform indicator data
        transformed_indicator = []
        for timestamp, value in indicator_data.items():
            if pd.notna(value):
                try:
                    if isinstance(timestamp, str):
                        time_unix = int(pd.Timestamp(timestamp).timestamp())
                    elif isinstance(timestamp, pd.Timestamp):
                        time_unix = int(timestamp.timestamp())
                    elif isinstance(timestamp, (int, float)):
                        time_unix = int(timestamp)
                    else:
                        time_unix = int(pd.Timestamp(str(timestamp)).timestamp())
                except Exception as e:
                    logger.warning(f"Could not convert indicator timestamp: {timestamp}, error: {e}")
                    continue

                transformed_indicator.append({
                    'time': time_unix,
                    'value': float(value)
                })

        return IndicatorResponse(
            symbol=symbol,
            indicator=indicator,
            data=transformed_indicator,
            parameters=params
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error calculating indicator {indicator} for {symbol}: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.post("/api/charts/{symbol}/indicators/batch")
async def get_chart_indicators_batch(
    symbol: str,
    request: ChartDataRequest,
    data_processor: DataProcessor = Depends(get_data_processor),
    technical_indicators: TechnicalIndicators = Depends(get_technical_indicators)
):
    """
    Get multiple technical indicators for a symbol in a single request
    """
    try:
        logger.info(f"Calculating batch indicators for {symbol}: {request.indicators}")

        # Get base data - placeholder for now
        data = pd.DataFrame()  # Placeholder

        if data is None or data.empty:
            raise HTTPException(status_code=404, detail=f"No data found for symbol: {symbol}")

        results = {}

        # Calculate each indicator - placeholder for now
        for indicator_config in request.indicators:
            indicator_name = indicator_config.get('name')
            parameters = indicator_config.get('parameters', {})

            if not indicator_name:
                continue

            try:
                # Placeholder for indicator calculation
                # In a real implementation: indicator_data = technical_indicators.calculate_indicator(data, indicator_name, **parameters)
                indicator_data = pd.Series()  # Placeholder

                if indicator_data is not None and not indicator_data.empty:
                    transformed_data = []
                    for timestamp, value in indicator_data.items():
                        if pd.notna(value):
                            try:
                                if isinstance(timestamp, str):
                                    time_unix = int(pd.Timestamp(timestamp).timestamp())
                                elif isinstance(timestamp, pd.Timestamp):
                                    time_unix = int(timestamp.timestamp())
                                elif isinstance(timestamp, (int, float)):
                                    time_unix = int(timestamp)
                                else:
                                    time_unix = int(pd.Timestamp(str(timestamp)).timestamp())
                            except Exception as e:
                                logger.warning(f"Could not convert batch indicator timestamp: {timestamp}, error: {e}")
                                continue

                            transformed_data.append({
                                'time': time_unix,
                                'value': float(value)
                            })

                    results[indicator_name] = {
                        'data': transformed_data,
                        'parameters': parameters,
                        'type': indicator_config.get('type', 'line')
                    }
            except Exception as e:
                logger.warning(f"Failed to calculate indicator {indicator_name}: {e}")
                results[indicator_name] = {
                    'data': [],
                    'parameters': parameters,
                    'error': str(e)
                }

        return {
            'symbol': symbol,
            'indicators': results,
            'count': len(results)
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error calculating batch indicators for {symbol}: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.post("/api/charts/{symbol}/annotations")
async def save_chart_annotations(
    symbol: str,
    request: AnnotationRequest
):
    """
    Save chart annotations and drawings
    """
    try:
        logger.info(f"Saving annotations for {symbol}")

        # In a real implementation, you would save to a database
        # For now, we'll just validate and return the annotations

        validated_annotations = []
        for annotation in request.annotations:
            validated_annotation = {
                'id': annotation.get('id', f"annotation_{len(validated_annotations)}"),
                'type': annotation.get('type', 'line'),
                'x': annotation.get('x'),
                'y': annotation.get('y'),
                'text': annotation.get('text', ''),
                'color': annotation.get('color', '#2962FF'),
                'size': annotation.get('size', 1),
                'options': annotation.get('options', {}),
                'created_at': datetime.now().isoformat()
            }
            validated_annotations.append(validated_annotation)

        return AnnotationResponse(
            symbol=symbol,
            saved_annotations=validated_annotations,
            status='success'
        )

    except Exception as e:
        logger.error(f"Error saving annotations for {symbol}: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/api/charts/{symbol}/annotations")
async def get_chart_annotations(symbol: str):
    """
    Get saved chart annotations for a symbol
    """
    try:
        # In a real implementation, you would fetch from a database
        # For now, return empty list
        return {
            'symbol': symbol,
            'annotations': [],
            'count': 0
        }

    except Exception as e:
        logger.error(f"Error fetching annotations for {symbol}: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/api/charts/config", response_model=ChartConfigResponse)
async def get_chart_config():
    """
    Get chart configuration and available options
    """
    try:
        return ChartConfigResponse(
            themes={
                'dark': {
                    'background': '#1a1a1a',
                    'textColor': '#d1d4dc',
                    'gridColor': '#2a2e39',
                    'upColor': '#26a69a',
                    'downColor': '#ef5350'
                },
                'light': {
                    'background': '#ffffff',
                    'textColor': '#191919',
                    'gridColor': '#e1e1e1',
                    'upColor': '#089981',
                    'downColor': '#f23645'
                }
            },
            indicators=[
                {'value': 'sma', 'label': 'Simple Moving Average', 'params': ['period']},
                {'value': 'ema', 'label': 'Exponential Moving Average', 'params': ['period']},
                {'value': 'rsi', 'label': 'Relative Strength Index', 'params': ['period']},
                {'value': 'macd', 'label': 'MACD', 'params': ['fast', 'slow', 'signal']},
                {'value': 'bb', 'label': 'Bollinger Bands', 'params': ['period', 'stdDev']},
                {'value': 'stoch', 'label': 'Stochastic Oscillator', 'params': ['k', 'd', 'smooth']}
            ],
            timeframes=['1D', '5D', '1M', '6M', '1Y', '5Y', 'MAX'],
            chart_types=['candlestick', 'line', 'area', 'bar'],
            default_config={
                'theme': 'dark',
                'chartType': 'candlestick',
                'timeframe': '1D',
                'showVolume': True,
                'showGrid': True,
                'showLegend': True,
                'autoScale': True
            }
        )

    except Exception as e:
        logger.error(f"Error fetching chart config: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/api/charts/{symbol}/search")
async def search_chart_data(
    symbol: str,
    query: str = Query(..., description="Search query"),
    limit: int = Query(default=10, ge=1, le=100)
):
    """
    Search for chart data patterns or specific dates
    """
    try:
        # This is a placeholder for search functionality
        # In a real implementation, you would search through the data
        return {
            'symbol': symbol,
            'query': query,
            'results': [],
            'message': 'Search functionality not yet implemented'
        }

    except Exception as e:
        logger.error(f"Error searching chart data for {symbol}: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

# Health check endpoint
@router.get("/api/charts/health")
async def chart_health_check():
    """
    Health check for chart API
    """
    return {
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'services': {
            'data_processor': 'available',
            'technical_indicators': 'available',
            'performance_optimizer': 'available'
        }
    }