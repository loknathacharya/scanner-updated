import React, { useEffect, useRef, useMemo, useCallback, useState } from 'react';
import {
  createChart,
  ColorType,
  CrosshairMode,
  CandlestickSeries,
  LineSeries
} from 'lightweight-charts';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import {
  ZoomIn,
  ZoomOut,
  Refresh,
  Download,
  Edit,
} from '@mui/icons-material';

const TradingViewChart = ({
  data = [],
  indicators = [],
  chartType = 'candlestick',
  symbol = '',
  height = 500,
  width = '100%',
  theme = 'dark',
  loading = false,
  error = null,
  className = '',
  priceScale = 'price', // 'price', 'index', 'percentage'
  pricePrecision = 2,
  showCrosshairData = true,
  onCrosshairMove = null,
}) => {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const mainSeriesRef = useRef(null);
  const indicatorSeriesRef = useRef(new Map());
  const [isDrawing, setIsDrawing] = useState(false);
  const drawingPoints = useRef([]);
  const drawnLines = useRef([]);
  const [crosshairData, setCrosshairData] = useState(null);

  const themes = useMemo(() => ({
    dark: {
      background: '#1a1a1a',
      textColor: '#d1d4dc',
      gridColor: '#2a2e39',
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderColor: '#485158',
    },
    light: {
      background: '#ffffff',
      textColor: '#191919',
      gridColor: '#e1e1e1',
      upColor: '#089981',
      downColor: '#f23645',
      borderColor: '#d1d4dc',
    },
  }), []);

  const currentTheme = useMemo(() => themes[theme] || themes.dark, [theme, themes]);

  useEffect(() => {
    console.log('TradingViewChart - Received data:', {
      symbol,
      dataLength: data.length,
      firstDataPoint: data[0],
      lastDataPoint: data[data.length - 1]
    });

    if (!chartContainerRef.current || data.length === 0) {
      return;
    }

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: currentTheme.background },
        textColor: currentTheme.textColor,
      },
      grid: {
        vertLines: { color: currentTheme.gridColor },
        horzLines: { color: currentTheme.gridColor },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      width: chartContainerRef.current.clientWidth,
      height: height,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
    });
    chartRef.current = chart;

    // Add series using NEW Version 5 API
    let mainSeries;
    if (chartType === 'candlestick') {
      // NEW API: Use addSeries with CandlestickSeries instead of addCandlestickSeries
      mainSeries = chart.addSeries(CandlestickSeries, {
        upColor: currentTheme.upColor,
        downColor: currentTheme.downColor,
        borderVisible: false,
        wickUpColor: currentTheme.upColor,
        wickDownColor: currentTheme.downColor,
      });
      mainSeries.setData(data);
    } else if (chartType === 'line') {
      // NEW API: Use addSeries with LineSeries instead of addLineSeries
      mainSeries = chart.addSeries(LineSeries, {
        color: currentTheme.upColor,
        lineWidth: 2,
      });
      const lineData = data.map(d => ({ time: d.time, value: d.close }));
      mainSeries.setData(lineData);
    }

    // Configure price scale based on selected mode
    if (mainSeries) {
      const priceScaleOptions = {
        mode: 0, // Normal mode
        autoScale: true,
        entireTextOnly: false,
        visible: true,
        ticksVisible: true,
        borderVisible: true,
      };

      // Apply price scale mode
      if (priceScale === 'index') {
        priceScaleOptions.mode = 1; // Index mode
      } else if (priceScale === 'percentage') {
        priceScaleOptions.mode = 2; // Percentage mode
      }

      mainSeries.applyOptions({
        priceScaleId: 'main',
      });

      chart.priceScale('main').applyOptions(priceScaleOptions);
    }

    mainSeriesRef.current = mainSeries;

    // Subscribe to crosshair move events
    if (showCrosshairData) {
      chart.subscribeCrosshairMove(handleCrosshairMove);
    }

    // Handle resize using ResizeObserver (more efficient than window resize)
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    if (chartContainerRef.current) {
      resizeObserver.observe(chartContainerRef.current);
    }

    // Cleanup
    return () => {
      resizeObserver.disconnect();
      if (chartRef.current) {
        // Unsubscribe from crosshair events
        if (showCrosshairData) {
          chartRef.current.unsubscribeCrosshairMove(handleCrosshairMove);
        }

        // Clean up indicator series before removing chart
        indicatorSeriesRef.current.forEach((series) => {
          if (series) {
            try {
              chartRef.current.removeSeries(series);
            } catch (error) {
              console.warn('Failed to remove indicator series during cleanup:', error);
            }
          }
        });
        indicatorSeriesRef.current.clear();

        // Clean up drawing lines
        drawnLines.current.forEach((line) => {
          if (line) {
            try {
              chartRef.current.removeSeries(line);
            } catch (error) {
              console.warn('Failed to remove drawing line during cleanup:', error);
            }
          }
        });
        drawnLines.current = [];

        chartRef.current.remove();
        chartRef.current = null;
        mainSeriesRef.current = null;
      }
    };
  }, [data, chartType, currentTheme, height]);

  useEffect(() => {
    if (!chartRef.current || !mainSeriesRef.current) return;

    // Clear old indicators with null checks
    indicatorSeriesRef.current.forEach((series) => {
      if (chartRef.current && series) {
        try {
          chartRef.current.removeSeries(series);
        } catch (error) {
          console.warn('Failed to remove indicator series:', error);
        }
      }
    });
    indicatorSeriesRef.current.clear();

    // Add new indicators
    indicators.forEach((indicator) => {
      if (indicator.data && indicator.data.length > 0 && chartRef.current) {
        try {
          const indicatorSeries = chartRef.current.addSeries(LineSeries, {
            color: indicator.color || '#2962FF',
            lineWidth: 1,
            title: indicator.name,
          });
          indicatorSeries.setData(indicator.data);
          indicatorSeriesRef.current.set(indicator.name, indicatorSeries);
        } catch (error) {
          console.warn('Failed to add indicator series:', error);
        }
      }
    });
  }, [indicators, currentTheme]);

  // Handle price scale changes
  useEffect(() => {
    if (!chartRef.current || !mainSeriesRef.current) return;

    const priceScaleOptions = {
      mode: 0, // Normal mode
      autoScale: true,
      entireTextOnly: false,
      visible: true,
      ticksVisible: true,
      borderVisible: true,
    };

    // Apply price scale mode
    if (priceScale === 'index') {
      priceScaleOptions.mode = 1; // Index mode
    } else if (priceScale === 'percentage') {
      priceScaleOptions.mode = 2; // Percentage mode
    }

    chartRef.current.priceScale('main').applyOptions(priceScaleOptions);
  }, [priceScale]);

  // Format price display
  const formatPrice = useCallback((price) => {
    if (price === null || price === undefined) return 'N/A';
    return price.toFixed(pricePrecision);
  }, [pricePrecision]);

  // Chart control handlers
  const handleZoomIn = useCallback(() => {
    if (chartRef.current) {
      chartRef.current.timeScale().zoomIn();
    }
  }, []);

  const handleZoomOut = useCallback(() => {
    if (chartRef.current) {
      chartRef.current.timeScale().zoomOut();
    }
  }, []);

  const handleResetZoom = useCallback(() => {
    if (chartRef.current) {
      chartRef.current.timeScale().fitContent();
    }
  }, []);

  const handleDownload = useCallback(async () => {
    if (chartRef.current) {
      try {
        // Updated download method for version 5
        const canvas = chartRef.current.takeScreenshot();
        const link = document.createElement('a');
        link.download = `chart_${symbol}_${new Date().toISOString().split('T')[0]}.png`;
        link.href = canvas.toDataURL();
        link.click();
      } catch (error) {
        console.error('Screenshot failed:', error);
      }
    }
  }, [symbol]);

  const handleDrawClick = () => {
    setIsDrawing(true);
    drawingPoints.current = [];
  };

  // Handle crosshair movement
  const handleCrosshairMove = useCallback((param) => {
    if (!showCrosshairData || !param || !param.time) {
      setCrosshairData(null);
      return;
    }

    // Find the candle data for the current time
    const time = param.time;
    const candleData = data.find(d => d.time === time);

    if (candleData) {
      setCrosshairData({
        time: new Date(time * 1000).toLocaleDateString(),
        open: candleData.open,
        high: candleData.high,
        low: candleData.low,
        close: candleData.close,
        volume: candleData.volume || 0,
        price: param.price || candleData.close,
      });
    }

    if (onCrosshairMove) {
      onCrosshairMove(param);
    }
  }, [showCrosshairData, data, onCrosshairMove]);

  // Crosshair data display component
  const CrosshairDataDisplay = () => {
    if (!crosshairData) return null;

    return (
      <Box
        sx={{
          position: 'absolute',
          top: 10,
          left: 10,
          backgroundColor: theme === 'dark' ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.9)',
          color: theme === 'dark' ? '#ffffff' : '#000000',
          padding: '8px 12px',
          borderRadius: '4px',
          fontSize: '12px',
          fontFamily: 'monospace',
          zIndex: 1000,
          border: `1px solid ${theme === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'}`,
          backdropFilter: 'blur(4px)',
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Box sx={{ fontWeight: 'bold', fontSize: '11px', opacity: 0.8 }}>
            {symbol} • {crosshairData.time}
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'auto auto', gap: '4px 12px' }}>
            <Box>O:</Box>
            <Box sx={{ color: '#26a69a', fontWeight: 'bold' }}>{formatPrice(crosshairData.open)}</Box>
            <Box>H:</Box>
            <Box sx={{ color: '#26a69a', fontWeight: 'bold' }}>{formatPrice(crosshairData.high)}</Box>
            <Box>L:</Box>
            <Box sx={{ color: '#ef5350', fontWeight: 'bold' }}>{formatPrice(crosshairData.low)}</Box>
            <Box>C:</Box>
            <Box sx={{ color: crosshairData.close >= crosshairData.open ? '#26a69a' : '#ef5350', fontWeight: 'bold' }}>
              {formatPrice(crosshairData.close)}
            </Box>
            <Box>V:</Box>
            <Box sx={{ color: '#2962FF', fontWeight: 'bold' }}>
              {crosshairData.volume?.toLocaleString() || 'N/A'}
            </Box>
          </Box>
        </Box>
      </Box>
    );
  };

  useEffect(() => {
    if (!chartRef.current || !isDrawing) return;

    const chart = chartRef.current;

    const clickHandler = (param) => {
      if (!param.point) return;

      drawingPoints.current.push(param);

      if (drawingPoints.current.length === 2) {
        const [start, end] = drawingPoints.current;
        const line = chart.addSeries(LineSeries, {
          color: 'yellow',
          lineWidth: 2,
        });
        line.setData([
          { time: start.time, value: start.price },
          { time: end.time, value: end.price },
        ]);
        drawnLines.current.push(line);
        setIsDrawing(false);
        drawingPoints.current = [];
      }
    };

    chart.subscribeClick(clickHandler);

    return () => {
      chart.unsubscribeClick(clickHandler);
      // Clean up any drawn lines
      drawnLines.current.forEach((line) => {
        if (chartRef.current && line) {
          try {
            chartRef.current.removeSeries(line);
          } catch (error) {
            console.warn('Failed to remove drawing line:', error);
          }
        }
      });
      drawnLines.current = [];
    };
  }, [isDrawing]);

  if (error) {
    return (
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Typography color="error">Error loading chart: {error}</Typography>
      </Paper>
    );
  }

  return (
    <Paper variant="outlined" className={`tradingview-chart ${className}`}>
      <Box
        sx={{
          p: 2,
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Typography variant="h6">
          {symbol} - {chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Zoom In">
            <IconButton size="small" onClick={handleZoomIn}>
              <ZoomIn />
            </IconButton>
          </Tooltip>
          <Tooltip title="Zoom Out">
            <IconButton size="small" onClick={handleZoomOut}>
              <ZoomOut />
            </IconButton>
          </Tooltip>
          <Tooltip title="Reset Zoom">
            <IconButton size="small" onClick={handleResetZoom}>
              <Refresh />
            </IconButton>
          </Tooltip>
          <Tooltip title="Download Chart">
            <IconButton size="small" onClick={handleDownload}>
              <Download />
            </IconButton>
          </Tooltip>
          <Tooltip title="Draw Trend Line">
            <IconButton size="small" onClick={handleDrawClick} color={isDrawing ? 'primary' : 'default'}>
              <Edit />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      <Box sx={{ position: 'relative' }}>
        {loading && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 10
            }}
          >
            <CircularProgress />
          </Box>
        )}
        {showCrosshairData && <CrosshairDataDisplay />}
        <div
          ref={chartContainerRef}
          style={{
            width: width,
            height: height,
            minHeight: '400px',
          }}
        />
      </Box>
    </Paper>
  );
};

export default TradingViewChart;
