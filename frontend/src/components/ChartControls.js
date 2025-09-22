import React, { useState, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Button,
  ButtonGroup,
  Divider,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  ExpandMore,
  ShowChart,
  Timeline,
  BarChart,
  AreaChart,
  Settings,
  Palette,
  Save,
  FolderOpen,
  Refresh,
  Download,
  Upload,
  Add,
  Remove
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

/**
 * Chart Controls Component
 * Provides comprehensive controls for TradingView chart configuration
 */
const ChartControls = ({
  chartState,
  onChartTypeChange,
  onTimeframeChange,
  onIndicatorAdd,
  onIndicatorRemove,
  onThemeToggle,
  onConfigUpdate,
  onExport,
  onImport,
  onReset,
  disabled = false,
  compact = false
}) => {
  const {
    chartType,
    timeframe,
    indicators,
    theme,
    config,
    symbol,
    statistics
  } = chartState;

  const [indicatorDialogOpen, setIndicatorDialogOpen] = useState(false);
  const [selectedIndicator, setSelectedIndicator] = useState('');
  const [indicatorParams, setIndicatorParams] = useState({});

  // Available chart types
  const chartTypes = [
    { value: 'candlestick', label: 'Candlestick', icon: <ShowChart /> },
    { value: 'line', label: 'Line', icon: <Timeline /> },
    { value: 'area', label: 'Area', icon: <AreaChart /> },
    { value: 'bar', label: 'Bar', icon: <BarChart /> }
  ];

  // Available timeframes
  const timeframes = [
    { value: '1D', label: '1 Day' },
    { value: '5D', label: '5 Days' },
    { value: '1M', label: '1 Month' },
    { value: '6M', label: '6 Months' },
    { value: '1Y', label: '1 Year' },
    { value: '5Y', label: '5 Years' },
    { value: 'MAX', label: 'Maximum' }
  ];

  // Available indicators
  const availableIndicators = [
    { value: 'sma', label: 'Simple Moving Average', params: ['period'], defaults: { period: 20 } },
    { value: 'ema', label: 'Exponential Moving Average', params: ['period'], defaults: { period: 20 } },
    { value: 'rsi', label: 'Relative Strength Index', params: ['period'], defaults: { period: 14 } },
    { value: 'macd', label: 'MACD', params: ['fast', 'slow', 'signal'], defaults: { fast: 12, slow: 26, signal: 9 } },
    { value: 'bb', label: 'Bollinger Bands', params: ['period', 'stdDev'], defaults: { period: 20, stdDev: 2 } },
    { value: 'stoch', label: 'Stochastic Oscillator', params: ['k', 'd', 'smooth'], defaults: { k: 14, d: 3, smooth: 3 } }
  ];

  // Handle indicator dialog
  const handleIndicatorDialogOpen = useCallback(() => {
    setIndicatorDialogOpen(true);
  }, []);

  const handleIndicatorDialogClose = useCallback(() => {
    setIndicatorDialogOpen(false);
    setSelectedIndicator('');
    setIndicatorParams({});
  }, []);

  const handleIndicatorSelect = useCallback((indicatorValue) => {
    setSelectedIndicator(indicatorValue);
    const indicator = availableIndicators.find(ind => ind.value === indicatorValue);
    if (indicator) {
      setIndicatorParams(indicator.defaults);
    }
  }, [availableIndicators]);

  const handleIndicatorAdd = useCallback(() => {
    if (!selectedIndicator) return;

    const indicator = availableIndicators.find(ind => ind.value === selectedIndicator);
    if (indicator) {
      onIndicatorAdd({
        name: selectedIndicator,
        label: indicator.label,
        params: indicatorParams,
        color: getRandomColor(),
        type: 'line'
      });
    }

    handleIndicatorDialogClose();
  }, [selectedIndicator, indicatorParams, onIndicatorAdd, handleIndicatorDialogClose, availableIndicators]);

  const handleIndicatorRemove = useCallback((indicatorId) => {
    onIndicatorRemove(indicatorId);
  }, [onIndicatorRemove]);

  // Handle config changes
  const handleConfigChange = useCallback((key, value) => {
    onConfigUpdate({ [key]: value });
  }, [onConfigUpdate]);

  // Handle file import
  const handleFileImport = useCallback((event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importData = JSON.parse(e.target.result);
          onImport(importData);
        } catch (error) {
          console.error('Error importing chart data:', error);
          alert('Error importing chart data. Please check the file format.');
        }
      };
      reader.readAsText(file);
    }
  }, [onImport]);

  // Generate random color for indicators
  const getRandomColor = () => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  // Compact controls for smaller spaces
  if (compact) {
    return (
      <Paper variant="outlined" sx={{ p: 1 }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <InputLabel>Type</InputLabel>
            <Select
              value={chartType}
              onChange={(e) => onChartTypeChange(e.target.value)}
              disabled={disabled}
            >
              {chartTypes.map(type => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 80 }}>
            <InputLabel>TF</InputLabel>
            <Select
              value={timeframe}
              onChange={(e) => onTimeframeChange(e.target.value)}
              disabled={disabled}
            >
              {timeframes.map(tf => (
                <MenuItem key={tf.value} value={tf.value}>
                  {tf.value}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Tooltip title="Add Indicator">
            <IconButton size="small" onClick={handleIndicatorDialogOpen} disabled={disabled}>
              <Add />
            </IconButton>
          </Tooltip>

          <Tooltip title="Toggle Theme">
            <IconButton size="small" onClick={onThemeToggle} disabled={disabled}>
              <Palette />
            </IconButton>
          </Tooltip>

          <Tooltip title="Export Chart">
            <IconButton size="small" onClick={onExport} disabled={disabled}>
              <Download />
            </IconButton>
          </Tooltip>

          <Tooltip title="Reset Chart">
            <IconButton size="small" onClick={onReset} disabled={disabled}>
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Chart Controls
      </Typography>

      {/* Basic Controls */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Chart Type</InputLabel>
          <Select
            value={chartType}
            onChange={(e) => onChartTypeChange(e.target.value)}
            disabled={disabled}
          >
            {chartTypes.map(type => (
              <MenuItem key={type.value} value={type.value}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {type.icon}
                  {type.label}
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Timeframe</InputLabel>
          <Select
            value={timeframe}
            onChange={(e) => onTimeframeChange(e.target.value)}
            disabled={disabled}
          >
            {timeframes.map(tf => (
              <MenuItem key={tf.value} value={tf.value}>
                {tf.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControlLabel
          control={
            <Switch
              checked={theme === 'light'}
              onChange={onThemeToggle}
              disabled={disabled}
            />
          }
          label="Light Theme"
        />
      </Box>

      {/* Chart Configuration */}
      <Accordion sx={{ mb: 2 }}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="subtitle1">Chart Settings</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={config.showVolume}
                  onChange={(e) => handleConfigChange('showVolume', e.target.checked)}
                  disabled={disabled}
                />
              }
              label="Show Volume"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={config.showGrid}
                  onChange={(e) => handleConfigChange('showGrid', e.target.checked)}
                  disabled={disabled}
                />
              }
              label="Show Grid"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={config.showLegend}
                  onChange={(e) => handleConfigChange('showLegend', e.target.checked)}
                  disabled={disabled}
                />
              }
              label="Show Legend"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={config.autoScale}
                  onChange={(e) => handleConfigChange('autoScale', e.target.checked)}
                  disabled={disabled}
                />
              }
              label="Auto Scale"
            />
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Indicators */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="subtitle1">Indicators</Typography>
          <Button
            size="small"
            startIcon={<Add />}
            onClick={handleIndicatorDialogOpen}
            disabled={disabled}
          >
            Add Indicator
          </Button>
        </Box>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {indicators.map(indicator => (
            <Chip
              key={indicator.id}
              label={`${indicator.label} (${JSON.stringify(indicator.params)})`}
              onDelete={() => handleIndicatorRemove(indicator.id)}
              color="primary"
              variant="outlined"
              size="small"
            />
          ))}
        </Box>
      </Box>

      {/* Data Statistics */}
      {statistics.count > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Data Statistics
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 1 }}>
            <Paper variant="outlined" sx={{ p: 1 }}>
              <Typography variant="caption">Data Points</Typography>
              <Typography variant="body2">{statistics.count.toLocaleString()}</Typography>
            </Paper>
            <Paper variant="outlined" sx={{ p: 1 }}>
              <Typography variant="caption">Price Range</Typography>
              <Typography variant="body2">
                ${statistics.priceRange.min.toFixed(2)} - ${statistics.priceRange.max.toFixed(2)}
              </Typography>
            </Paper>
            <Paper variant="outlined" sx={{ p: 1 }}>
              <Typography variant="caption">Avg Volume</Typography>
              <Typography variant="body2">{statistics.avgVolume?.toLocaleString() || 'N/A'}</Typography>
            </Paper>
          </Box>
        </Box>
      )}

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <ButtonGroup variant="outlined" size="small">
          <Tooltip title="Export Chart Data">
            <Button onClick={onExport} disabled={disabled} startIcon={<Download />}>
              Export
            </Button>
          </Tooltip>
          <Tooltip title="Import Chart Data">
            <Button component="label" disabled={disabled} startIcon={<Upload />}>
              Import
              <input
                type="file"
                accept=".json"
                hidden
                onChange={handleFileImport}
              />
            </Button>
          </Tooltip>
          <Tooltip title="Reset Chart">
            <Button onClick={onReset} disabled={disabled} startIcon={<Refresh />}>
              Reset
            </Button>
          </Tooltip>
        </ButtonGroup>
      </Box>

      {/* Add Indicator Dialog */}
      <Dialog open={indicatorDialogOpen} onClose={handleIndicatorDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>Add Technical Indicator</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Select Indicator</InputLabel>
              <Select
                value={selectedIndicator}
                onChange={(e) => handleIndicatorSelect(e.target.value)}
              >
                {availableIndicators.map(indicator => (
                  <MenuItem key={indicator.value} value={indicator.value}>
                    {indicator.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {selectedIndicator && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="subtitle2">Parameters</Typography>
                {availableIndicators
                  .find(ind => ind.value === selectedIndicator)
                  ?.params.map(param => (
                    <TextField
                      key={param}
                      label={param.charAt(0).toUpperCase() + param.slice(1)}
                      type="number"
                      value={indicatorParams[param] || ''}
                      onChange={(e) => setIndicatorParams(prev => ({
                        ...prev,
                        [param]: parseInt(e.target.value) || 0
                      }))}
                      size="small"
                      fullWidth
                    />
                  ))}
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleIndicatorDialogClose}>Cancel</Button>
          <Button
            onClick={handleIndicatorAdd}
            disabled={!selectedIndicator}
            variant="contained"
          >
            Add Indicator
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default ChartControls;