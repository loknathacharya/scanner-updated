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
}) => {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const mainSeriesRef = useRef(null);
  const indicatorSeriesRef = useRef(new Map());
  const [isDrawing, setIsDrawing] = useState(false);
  const drawingPoints = useRef([]);
  const drawnLines = useRef([]);

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

    mainSeriesRef.current = mainSeries;

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
        chartRef.current.remove();
        chartRef.current = null;
        mainSeriesRef.current = null;
      }
    };
  }, [data, chartType, currentTheme, height]);

  useEffect(() => {
    if (!chartRef.current || !mainSeriesRef.current) return;

    // Clear old indicators
    indicatorSeriesRef.current.forEach((series) => {
      chartRef.current.removeSeries(series);
    });
    indicatorSeriesRef.current.clear();

    // Add new indicators
    indicators.forEach((indicator) => {
      if (indicator.data && indicator.data.length > 0) {
        const indicatorSeries = chartRef.current.addSeries(LineSeries, {
          color: indicator.color || '#2962FF',
          lineWidth: 1,
          title: indicator.name,
        });
        indicatorSeries.setData(indicator.data);
        indicatorSeriesRef.current.set(indicator.name, indicatorSeries);
      }
    });
  }, [indicators, currentTheme]);

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
