import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Tooltip,
  Alert,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  Grid,
  IconButton,
  Divider,
} from '@mui/material';
import {
  Sync,
  SyncDisabled,
  ViewColumn,
  ViewModule,
  Info,
  CompareArrows,
  Settings,
} from '@mui/icons-material';
import TradingViewChart from './TradingViewChart';

const TradingViewMultiChart = ({
  symbols = [],
  data = {},
  height = 500,
  width = '100%',
  theme = 'dark',
  loading = false,
  error = null,
  className = '',
  layout = 'horizontal', // 'horizontal' | 'vertical' | 'grid'
  syncCrosshair = true,
  syncTimeScale = true,
  showVolume = true,
  showComparison = true,
  pricePrecision = 2,
  onSymbolSelect = null,
  onLayoutChange = null,
  maxCharts = 4,
  chartSpacing = 2,
}) => {
  const [selectedSymbols, setSelectedSymbols] = useState(symbols.slice(0, maxCharts));
  const [currentLayout, setCurrentLayout] = useState(layout);
  const [crosshairSync, setCrosshairSync] = useState(syncCrosshair);
  const [timeSync, setTimeSync] = useState(syncTimeScale);
  const [showVolumes, setShowVolumes] = useState(showVolume);
  const [showComparisons, setShowComparisons] = useState(showComparison);

  const chartRefs = useRef(new Map());
  const mainChartRef = useRef(null);

  // Filter symbols based on available data
  const availableSymbols = useMemo(() => {
    return symbols.filter(symbol => data[symbol] && data[symbol].length > 0);
  }, [symbols, data]);

  // Calculate comparison metrics
  const comparisonMetrics = useMemo(() => {
    if (!showComparisons || selectedSymbols.length === 0) return null;

    const metrics = {};
    selectedSymbols.forEach(symbol => {
      const symbolData = data[symbol];
      if (!symbolData || symbolData.length === 0) return;

      const first = symbolData[0];
      const last = symbolData[symbolData.length - 1];
      const change = ((last.close - first.close) / first.close) * 100;

      metrics[symbol] = {
        startPrice: first.close,
        endPrice: last.close,
        change,
        changePercent: change,
        high: Math.max(...symbolData.map(d => d.high)),
        low: Math.min(...symbolData.map(d => d.low)),
        volume: symbolData.reduce((sum, d) => sum + (d.volume || 0), 0),
      };
    });

    return metrics;
  }, [selectedSymbols, data, showComparisons]);

  // Handle symbol selection
  const handleSymbolChange = useCallback((index, newSymbol) => {
    const newSymbols = [...selectedSymbols];
    newSymbols[index] = newSymbol;
    setSelectedSymbols(newSymbols);

    if (onSymbolSelect) {
      onSymbolSelect(newSymbols);
    }
  }, [selectedSymbols, onSymbolSelect]);

  // Handle layout change
  const handleLayoutChange = useCallback((newLayout) => {
    setCurrentLayout(newLayout);

    if (onLayoutChange) {
      onLayoutChange(newLayout);
    }
  }, [onLayoutChange]);

  // Handle crosshair synchronization
  const handleCrosshairMove = useCallback((param, chartIndex) => {
    if (!crosshairSync) return;

    // Skip if this is the main chart to avoid infinite loops
    if (chartIndex === 0) return;

    const mainChart = chartRefs.current.get(0);
    if (mainChart && param.time) {
      mainChart.timeScale().scrollToPosition(0, false);
      mainChart.timeScale().scrollToPosition(param.time, true);
    }
  }, [crosshairSync]);

  // Handle time scale synchronization
  const handleTimeScaleChange = useCallback((timeRange) => {
    if (!timeSync) return;

    chartRefs.current.forEach((chart, index) => {
      if (index === 0) return; // Skip main chart
      if (chart && chart.timeScale) {
        chart.timeScale().setVisibleRange(timeRange);
      }
    });
  }, [timeSync]);

  // Prepare volume indicators for each symbol
  const getVolumeIndicator = useCallback((symbol) => {
    if (!showVolumes || !data[symbol]) return null;

    return {
      name: `${symbol} Volume`,
      data: data[symbol].map(d => ({
        time: d.time,
        value: d.volume || 0,
      })),
      color: theme === 'dark' ? '#2962FF' : '#1976d2',
    };
  }, [data, showVolumes, theme]);

  // Format percentage display
  const formatPercentage = useCallback((value) => {
    if (value === null || value === undefined) return 'N/A';
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  }, []);

  // Format price display
  const formatPrice = useCallback((price) => {
    if (price === null || price === undefined) return 'N/A';
    return price.toFixed(pricePrecision);
  }, [pricePrecision]);

  // Render individual chart
  const renderChart = (symbol, index) => {
    const symbolData = data[symbol];
    if (!symbolData || symbolData.length === 0) {
      return (
        <Paper
          key={`${symbol}-${index}`}
          variant="outlined"
          sx={{
            p: 2,
            height: currentLayout === 'horizontal' ? height : height / selectedSymbols.length,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          <Alert severity="warning" icon={<Info />}>
            No data available for {symbol}
          </Alert>
        </Paper>
      );
    }

    return (
      <Box key={`${symbol}-${index}`} sx={{ mb: currentLayout === 'vertical' ? chartSpacing : 0 }}>
        <TradingViewChart
          data={symbolData}
          indicators={showVolumes ? [getVolumeIndicator(symbol)] : []}
          chartType="candlestick"
          symbol={symbol}
          height={currentLayout === 'horizontal' ? height : height / selectedSymbols.length}
          width="100%"
          theme={theme}
          loading={false}
          error={null}
          onCrosshairMove={(param) => handleCrosshairMove(param, index)}
          onTimeScaleChange={index === 0 ? handleTimeScaleChange : undefined}
        />
      </Box>
    );
  };

  // Render symbol selector
  const renderSymbolSelector = (index) => (
    <FormControl size="small" sx={{ minWidth: 120 }}>
      <InputLabel>Symbol {index + 1}</InputLabel>
      <Select
        value={selectedSymbols[index] || ''}
        label={`Symbol ${index + 1}`}
        onChange={(e) => handleSymbolChange(index, e.target.value)}
      >
        {availableSymbols.map(symbol => (
          <MenuItem key={symbol} value={symbol}>
            {symbol}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );

  if (error) {
    return (
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 2,
        }}
        className={className}
      >
        <Alert severity="error" icon={<Info />}>
          {error}
        </Alert>
        <Typography variant="body2" color="text.secondary">
          Unable to load multi-chart comparison
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper variant="outlined" className={`tradingview-multi-chart ${className}`}>
      {/* Header with controls */}
      <Box
        sx={{
          p: 2,
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Multi-Chart Comparison
          </Typography>

          <FormControl size="small">
            <InputLabel>Layout</InputLabel>
            <Select
              value={currentLayout}
              label="Layout"
              onChange={(e) => handleLayoutChange(e.target.value)}
            >
              <MenuItem value="horizontal">Horizontal</MenuItem>
              <MenuItem value="vertical">Vertical</MenuItem>
              <MenuItem value="grid">Grid</MenuItem>
            </Select>
          </FormControl>

          <FormControlLabel
            control={
              <Switch
                checked={crosshairSync}
                onChange={(e) => setCrosshairSync(e.target.checked)}
                size="small"
              />
            }
            label="Sync Crosshair"
          />

          <FormControlLabel
            control={
              <Switch
                checked={timeSync}
                onChange={(e) => setTimeSync(e.target.checked)}
                size="small"
              />
            }
            label="Sync Time"
          />

          <FormControlLabel
            control={
              <Switch
                checked={showVolumes}
                onChange={(e) => setShowVolumes(e.target.checked)}
                size="small"
              />
            }
            label="Show Volume"
          />
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          {selectedSymbols.map((_, index) => (
            <Box key={index}>
              {renderSymbolSelector(index)}
            </Box>
          ))}
        </Box>
      </Box>

      {/* Comparison metrics */}
      {showComparisons && comparisonMetrics && (
        <Box
          sx={{
            p: 2,
            borderBottom: 1,
            borderColor: 'divider',
            backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
          }}
        >
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Performance Comparison
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {selectedSymbols.map(symbol => {
              const metrics = comparisonMetrics[symbol];
              if (!metrics) return null;

              return (
                <Chip
                  key={symbol}
                  label={`${symbol}: ${formatPercentage(metrics.changePercent)}`}
                  color={metrics.changePercent >= 0 ? 'success' : 'error'}
                  size="small"
                  variant="outlined"
                />
              );
            })}
          </Box>
        </Box>
      )}

      {/* Charts area */}
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
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              zIndex: 10,
            }}
          >
            <CircularProgress />
          </Box>
        )}

        <Box
          sx={{
            display: 'flex',
            flexDirection: currentLayout === 'vertical' ? 'column' : 'row',
            gap: currentLayout === 'grid' ? chartSpacing : 0,
            p: currentLayout === 'grid' ? chartSpacing : 0,
          }}
        >
          {selectedSymbols.map((symbol, index) => renderChart(symbol, index))}
        </Box>
      </Box>

      {/* Legend */}
      <Box
        sx={{
          p: 1,
          borderTop: 1,
          borderColor: 'divider',
          display: 'flex',
          justifyContent: 'center',
          gap: 3,
          flexWrap: 'wrap',
        }}
      >
        {selectedSymbols.map((symbol, index) => (
          <Box key={symbol} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                backgroundColor: `hsl(${(index * 360) / selectedSymbols.length}, 70%, 50%)`,
              }}
            />
            <Typography variant="caption">{symbol}</Typography>
          </Box>
        ))}
      </Box>
    </Paper>
  );
};

export default TradingViewMultiChart;