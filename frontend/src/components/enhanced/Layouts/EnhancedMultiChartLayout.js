import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  IconButton,
  Tooltip,
  Divider,
  Chip,
  Alert,
  CircularProgress,
  Button,
  ButtonGroup,
} from '@mui/material';
import {
  Sync,
  SyncDisabled,
  ViewColumn,
  ViewModule,
  ViewComfy,
  ViewCompact,
  Settings,
  CompareArrows,
  Link,
  LinkOff,
  Fullscreen,
  FullscreenExit,
} from '@mui/icons-material';
import TradingViewChart from '../../../components/TradingViewChart';

const LAYOUT_PRESETS = {
  single: { rows: 1, cols: 1, label: 'Single' },
  horizontal: { rows: 1, cols: 2, label: '1x2 Horizontal' },
  vertical: { rows: 2, cols: 1, label: '2x1 Vertical' },
  grid_2x2: { rows: 2, cols: 2, label: '2x2 Grid' },
  grid_3x2: { rows: 3, cols: 2, label: '3x2 Grid' },
  grid_2x3: { rows: 2, cols: 3, label: '2x3 Grid' },
  grid_4x2: { rows: 4, cols: 2, label: '4x2 Grid' },
  grid_2x4: { rows: 2, cols: 4, label: '2x4 Grid' },
};

const EnhancedMultiChartLayout = ({
  symbols = [],
  data = {},
  height = 600,
  width = '100%',
  theme = 'dark',
  loading = false,
  error = null,
  className = '',
  layout = 'grid_2x2',
  syncCrosshair = true,
  syncTimeScale = true,
  syncIndicators = true,
  showVolume = true,
  showComparison = true,
  pricePrecision = 2,
  priceScale = 'price', // 'price', 'index', 'percentage'
  showCrosshairData = true,
  onSymbolSelect = null,
  onLayoutChange = null,
  onSyncSettingsChange = null,
  maxCharts = 8,
  chartSpacing = 2,
}) => {
  const [selectedSymbols, setSelectedSymbols] = useState(symbols.slice(0, maxCharts));
  const [currentLayout, setCurrentLayout] = useState(layout);
  const [crosshairSync, setCrosshairSync] = useState(syncCrosshair);
  const [timeSync, setTimeSync] = useState(syncTimeScale);
  const [indicatorSync, setIndicatorSync] = useState(syncIndicators);
  const [showVolumes, setShowVolumes] = useState(showVolume);
  const [showComparisons, setShowComparisons] = useState(showComparison);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [linkedCharts, setLinkedCharts] = useState(new Set());
  const [currentPriceScale, setCurrentPriceScale] = useState(priceScale);
  const [currentShowCrosshairData, setCurrentShowCrosshairData] = useState(showCrosshairData);

  const chartRefs = useRef(new Map());
  const mainChartRef = useRef(null);

  // Filter symbols based on available data
  const availableSymbols = useMemo(() => {
    console.log('EnhancedMultiChartLayout - Available symbols:', symbols);
    console.log('EnhancedMultiChartLayout - Available data:', data);
    const filtered = symbols.filter(symbol => data[symbol] && data[symbol].length > 0);
    console.log('EnhancedMultiChartLayout - Filtered symbols:', filtered);
    return filtered;
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

  // Handle sync settings change
  const handleSyncSettingsChange = useCallback((settings) => {
    setCrosshairSync(settings.crosshairSync);
    setTimeSync(settings.timeSync);
    setIndicatorSync(settings.indicatorSync);

    if (onSyncSettingsChange) {
      onSyncSettingsChange(settings);
    }
  }, [onSyncSettingsChange]);

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

  // Handle chart linking
  const handleChartLink = useCallback((chartIndex) => {
    setLinkedCharts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(chartIndex)) {
        newSet.delete(chartIndex);
      } else {
        newSet.add(chartIndex);
      }
      return newSet;
    });
  }, []);

  // Handle fullscreen toggle
  const handleFullscreenToggle = useCallback(() => {
    setIsFullscreen(prev => !prev);
  }, []);

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
            height: '100%',
            minHeight: 300,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          <Alert severity="warning">
            No data available for {symbol}
          </Alert>
        </Paper>
      );
    }

    const isLinked = linkedCharts.has(index);
    const layoutPreset = LAYOUT_PRESETS[currentLayout];
    const chartHeight = layoutPreset.rows > 1 ?
      (height - 100) / layoutPreset.rows :
      height - 100;

    return (
      <Box
        key={`${symbol}-${index}`}
        sx={{
          position: 'relative',
          height: '100%',
          minHeight: 300,
        }}
      >
        {/* Chart Header */}
        <Box
          sx={{
            p: 1,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              {symbol}
            </Typography>
            {comparisonMetrics && comparisonMetrics[symbol] && (
              <Chip
                label={formatPercentage(comparisonMetrics[symbol].changePercent)}
                size="small"
                color={comparisonMetrics[symbol].changePercent >= 0 ? 'success' : 'error'}
                variant="outlined"
              />
            )}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Tooltip title={isLinked ? 'Unlink Chart' : 'Link Chart'}>
              <IconButton
                size="small"
                onClick={() => handleChartLink(index)}
                color={isLinked ? 'primary' : 'default'}
              >
                {isLinked ? <Link /> : <LinkOff />}
              </IconButton>
            </Tooltip>

            <FormControl size="small" sx={{ minWidth: 100 }}>
              <Select
                value={symbol}
                onChange={(e) => handleSymbolChange(index, e.target.value)}
                displayEmpty
              >
                {availableSymbols.map(symbol => (
                  <MenuItem key={symbol} value={symbol}>
                    {symbol}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>

        {/* Chart */}
        <Box sx={{ height: `calc(100% - 60px)` }}>
          <TradingViewChart
            data={symbolData}
            indicators={showVolumes ? [getVolumeIndicator(symbol)] : []}
            chartType="candlestick"
            symbol={symbol}
            height={chartHeight}
            width="100%"
            theme={theme}
            loading={false}
            error={null}
            priceScale={currentPriceScale}
            pricePrecision={pricePrecision}
            showCrosshairData={currentShowCrosshairData}
            onCrosshairMove={(param) => handleCrosshairMove(param, index)}
            onTimeScaleChange={index === 0 ? handleTimeScaleChange : undefined}
          />
        </Box>
      </Box>
    );
  };

  // Render symbol selector for unused slots
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

  const layoutPreset = LAYOUT_PRESETS[currentLayout];
  const totalSlots = layoutPreset.rows * layoutPreset.cols;

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
        <Alert severity="error">
          {error}
        </Alert>
        <Typography variant="body2" color="text.secondary">
          Unable to load multi-chart layout
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper
      variant="outlined"
      className={`enhanced-multi-chart-layout ${className}`}
      sx={{
        height: isFullscreen ? '100vh' : height,
        width: width,
        position: isFullscreen ? 'fixed' : 'relative',
        top: isFullscreen ? 0 : 'auto',
        left: isFullscreen ? 0 : 'auto',
        zIndex: isFullscreen ? 9999 : 'auto',
        backgroundColor: theme === 'dark' ? '#1a1a1a' : '#ffffff',
      }}
    >
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
            Enhanced Multi-Chart Layout
          </Typography>

          <FormControl size="small">
            <InputLabel>Layout</InputLabel>
            <Select
              value={currentLayout}
              label="Layout"
              onChange={(e) => handleLayoutChange(e.target.value)}
            >
              {Object.entries(LAYOUT_PRESETS).map(([key, preset]) => (
                <MenuItem key={key} value={key}>
                  {preset.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <ButtonGroup size="small">
            <Tooltip title="Sync Crosshair">
              <Button
                variant={crosshairSync ? 'contained' : 'outlined'}
                onClick={() => handleSyncSettingsChange({
                  crosshairSync: !crosshairSync,
                  timeSync,
                  indicatorSync,
                })}
              >
                <Sync />
              </Button>
            </Tooltip>

            <Tooltip title="Sync Time Scale">
              <Button
                variant={timeSync ? 'contained' : 'outlined'}
                onClick={() => handleSyncSettingsChange({
                  crosshairSync,
                  timeSync: !timeSync,
                  indicatorSync,
                })}
              >
                <ViewColumn />
              </Button>
            </Tooltip>

            <Tooltip title="Sync Indicators">
              <Button
                variant={indicatorSync ? 'contained' : 'outlined'}
                onClick={() => handleSyncSettingsChange({
                  crosshairSync,
                  timeSync,
                  indicatorSync: !indicatorSync,
                })}
              >
                <CompareArrows />
              </Button>
            </Tooltip>
          </ButtonGroup>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <FormControlLabel
            control={
              <Switch
                checked={showVolumes}
                onChange={(e) => setShowVolumes(e.target.checked)}
                size="small"
              />
            }
            label="Volume"
          />

          <FormControlLabel
            control={
              <Switch
                checked={showComparisons}
                onChange={(e) => setShowComparisons(e.target.checked)}
                size="small"
              />
            }
            label="Comparison"
          />

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Price Scale</InputLabel>
            <Select
              value={currentPriceScale}
              label="Price Scale"
              onChange={(e) => setCurrentPriceScale(e.target.value)}
            >
              <MenuItem value="price">Price</MenuItem>
              <MenuItem value="index">Index</MenuItem>
              <MenuItem value="percentage">Percentage</MenuItem>
            </Select>
          </FormControl>

          <FormControlLabel
            control={
              <Switch
                checked={currentShowCrosshairData}
                onChange={(e) => setCurrentShowCrosshairData(e.target.checked)}
                size="small"
              />
            }
            label="OHLCV Data"
          />

          <Tooltip title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}>
            <IconButton size="small" onClick={handleFullscreenToggle}>
              {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
            </IconButton>
          </Tooltip>
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
      <Box sx={{ position: 'relative', flex: 1, p: chartSpacing }}>
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

        <Grid container spacing={chartSpacing} sx={{ height: '100%' }}>
          {Array.from({ length: totalSlots }, (_, index) => (
            <Grid
              item
              xs={12 / layoutPreset.cols}
              sm={12 / layoutPreset.cols}
              md={12 / layoutPreset.cols}
              key={index}
              sx={{ height: `${100 / layoutPreset.rows}%` }}
            >
              {index < selectedSymbols.length && selectedSymbols[index] ?
                renderChart(selectedSymbols[index], index) :
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    gap: 2,
                    minHeight: 300,
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Select Symbol {index + 1}
                  </Typography>
                  {renderSymbolSelector(index)}
                </Paper>
              }
            </Grid>
          ))}
        </Grid>
      </Box>
    </Paper>
  );
};

export default EnhancedMultiChartLayout;