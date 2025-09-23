import React, { useState, useCallback, useMemo } from 'react';
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
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  ShowChart,
  Timeline,
  Info,
  Settings,
} from '@mui/icons-material';
import TradingViewChart from './TradingViewChart';

const TradingViewLineChart = ({
  data = [],
  symbol = '',
  height = 500,
  width = '100%',
  theme = 'dark',
  loading = false,
  error = null,
  className = '',
  showPerformanceMetrics = true,
  showBenchmark = false,
  benchmarkData = null,
  benchmarkSymbol = 'BENCHMARK',
  lineColor = null,
  benchmarkColor = null,
  showAreaFill = false,
  smoothCurve = false,
  onDataPointClick = null,
  pricePrecision = 2,
  showDrawdown = false,
  drawdownColor = null,
}) => {
  const [selectedMetric, setSelectedMetric] = useState('close');
  const [showArea, setShowArea] = useState(showAreaFill);
  const [curveSmoothing, setCurveSmoothing] = useState(smoothCurve);

  // Calculate performance metrics
  const performanceMetrics = useMemo(() => {
    if (!data || data.length === 0) return null;

    const first = data[0];
    const last = data[data.length - 1];
    const values = data.map(d => d[selectedMetric] || d.close);

    const totalReturn = ((last[selectedMetric] || last.close) - (first[selectedMetric] || first.close)) / (first[selectedMetric] || first.close) * 100;
    const maxValue = Math.max(...values);
    const minValue = Math.min(...values);
    const volatility = values.length > 1 ? Math.sqrt(values.reduce((acc, val, i) => {
      if (i === 0) return acc;
      const prev = values[i - 1];
      return acc + Math.pow(val - prev, 2);
    }, 0) / (values.length - 1)) : 0;

    return {
      totalReturn,
      maxValue,
      minValue,
      volatility,
      startValue: first[selectedMetric] || first.close,
      endValue: last[selectedMetric] || last.close,
      dataPoints: values.length,
    };
  }, [data, selectedMetric]);

  // Calculate drawdown data
  const drawdownData = useMemo(() => {
    if (!showDrawdown || !data || data.length === 0) return null;

    const values = data.map(d => d[selectedMetric] || d.close);
    let peak = values[0];
    const drawdowns = [];

    values.forEach((value, index) => {
      if (value > peak) peak = value;
      const drawdown = peak > 0 ? (peak - value) / peak * 100 : 0;
      drawdowns.push({
        time: data[index].time,
        value: -drawdown, // Negative for display below main line
      });
    });

    return {
      name: 'Drawdown',
      data: drawdowns,
      color: drawdownColor || '#ff6b6b',
    };
  }, [data, selectedMetric, showDrawdown, drawdownColor]);

  // Prepare benchmark indicator
  const benchmarkIndicator = useMemo(() => {
    if (!showBenchmark || !benchmarkData || benchmarkData.length === 0) return null;

    return {
      name: benchmarkSymbol,
      data: benchmarkData.map(d => ({
        time: d.time,
        value: d[selectedMetric] || d.close,
      })),
      color: benchmarkColor || '#8884d8',
    };
  }, [benchmarkData, showBenchmark, benchmarkSymbol, benchmarkColor, selectedMetric]);

  // Prepare main line data
  const lineData = useMemo(() => {
    if (!data || data.length === 0) return [];

    return data.map(d => ({
      time: d.time,
      value: d[selectedMetric] || d.close,
    }));
  }, [data, selectedMetric]);

  // Handle chart click for data point selection
  const handleChartClick = useCallback((param) => {
    if (!param.time || !onDataPointClick) return;

    const dataPoint = param.seriesData.get(param.series);
    if (dataPoint) {
      const price = dataPoint.value;
      const timeIndex = data.findIndex(d => d.time === param.time);
      const dataPointInfo = {
        price,
        time: param.time,
        index: timeIndex,
        data: data[timeIndex],
      };

      onDataPointClick(dataPointInfo);
    }
  }, [data, onDataPointClick]);

  // Format percentage display
  const formatPercentage = useCallback((value) => {
    if (value === null || value === undefined) return 'N/A';
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  }, []);

  // Format value display
  const formatValue = useCallback((value) => {
    if (value === null || value === undefined) return 'N/A';
    return value.toFixed(pricePrecision);
  }, [pricePrecision]);

  // Available metrics for selection
  const availableMetrics = useMemo(() => {
    if (!data || data.length === 0) return ['close'];

    const metrics = new Set(['close']);
    data.forEach(d => {
      Object.keys(d).forEach(key => {
        if (typeof d[key] === 'number' && !['time', 'timestamp'].includes(key)) {
          metrics.add(key);
        }
      });
    });

    return Array.from(metrics);
  }, [data]);

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
          Unable to load line chart for {symbol}
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper variant="outlined" className={`tradingview-line-chart ${className}`}>
      {/* Header with controls and metrics */}
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
            {symbol} - Line Chart
          </Typography>

          {availableMetrics.length > 1 && (
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Metric</InputLabel>
              <Select
                value={selectedMetric}
                label="Metric"
                onChange={(e) => setSelectedMetric(e.target.value)}
              >
                {availableMetrics.map(metric => (
                  <MenuItem key={metric} value={metric}>
                    {metric.charAt(0).toUpperCase() + metric.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <FormControlLabel
            control={
              <Switch
                checked={showArea}
                onChange={(e) => setShowArea(e.target.checked)}
                size="small"
              />
            }
            label="Area Fill"
          />

          <FormControlLabel
            control={
              <Switch
                checked={curveSmoothing}
                onChange={(e) => setCurveSmoothing(e.target.checked)}
                size="small"
              />
            }
            label="Smooth"
          />
        </Box>

        {showPerformanceMetrics && performanceMetrics && (
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Chip
              icon={<ShowChart />}
              label={`Return: ${formatPercentage(performanceMetrics.totalReturn)}`}
              color={performanceMetrics.totalReturn >= 0 ? 'success' : 'error'}
              size="small"
              variant="outlined"
            />
            <Tooltip title="Data Points">
              <Chip
                label={`${performanceMetrics.dataPoints} pts`}
                size="small"
                variant="outlined"
              />
            </Tooltip>
          </Box>
        )}
      </Box>

      {/* Performance metrics display */}
      {showPerformanceMetrics && performanceMetrics && (
        <Box
          sx={{
            p: 2,
            borderBottom: 1,
            borderColor: 'divider',
            backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
          }}
        >
          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" color="text.secondary">Start:</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {formatValue(performanceMetrics.startValue)}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" color="text.secondary">End:</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {formatValue(performanceMetrics.endValue)}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" color="text.secondary">Max:</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {formatValue(performanceMetrics.maxValue)}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" color="text.secondary">Min:</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {formatValue(performanceMetrics.minValue)}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" color="text.secondary">Volatility:</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {formatValue(performanceMetrics.volatility)}
              </Typography>
            </Box>
          </Box>
        </Box>
      )}

      {/* Chart area */}
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

        <TradingViewChart
          data={lineData}
          indicators={showDrawdown && drawdownData ? [drawdownData] : []}
          chartType="line"
          symbol={symbol}
          height={height}
          width={width}
          theme={theme}
          loading={false}
          error={null}
          onClick={handleChartClick}
        />
      </Box>

      {/* Legend */}
      {showBenchmark && benchmarkIndicator && (
        <Box
          sx={{
            p: 1,
            borderTop: 1,
            borderColor: 'divider',
            display: 'flex',
            justifyContent: 'center',
            gap: 3,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                width: 12,
                height: 2,
                backgroundColor: lineColor || (theme === 'dark' ? '#26a69a' : '#089981'),
              }}
            />
            <Typography variant="caption">{symbol}</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                width: 12,
                height: 2,
                backgroundColor: benchmarkColor || '#8884d8',
              }}
            />
            <Typography variant="caption">{benchmarkSymbol}</Typography>
          </Box>
        </Box>
      )}
    </Paper>
  );
};

export default TradingViewLineChart;