import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Slider,
  Switch,
  FormControlLabel,
  Grid,
  Button,
  IconButton,
  Tooltip,
  Chip,
  Divider,
  Alert,
  Paper
} from '@mui/material';
import {
  Calculate,
  Info,
  TrendingUp,
  TrendingDown,
  Equalizer,
  AccountBalance,
  Warning,
  CheckCircle
} from '@mui/icons-material';
import './PositionSizingControls.css';

const PositionSizingControls = ({
  onPositionSizingChange = () => {},
  initialSizingMethod = 'equal_weight',
  initialParams = {},
  disabled = false
}) => {
  // Default parameters for each sizing method
  const defaultParams = {
    equal_weight: { riskPercentage: 2.0, allowLeverage: false },
    fixed_amount: { fixedAmount: 10000, allowLeverage: false },
    percent_risk: { riskPercentage: 2.0, stopLossPercentage: 5.0, allowLeverage: false },
    volatility_target: { volatilityTarget: 0.15, allowLeverage: false },
    atr_based: { riskPercentage: 2.0, atrMultiplier: 2.0, allowLeverage: false },
    kelly_criterion: { kellyWinRate: 55, kellyAvgWin: 8, kellyAvgLoss: -4, allowLeverage: false }
  };

  const [sizingMethod, setSizingMethod] = useState(initialSizingMethod);
  const [params, setParams] = useState(() => (Object.keys(initialParams).length ? initialParams : defaultParams[initialSizingMethod]));
  const [validationErrors, setValidationErrors] = useState({});
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);

  // Initialize with default params if none provided (avoid effect loop on {} default prop)
  useEffect(() => {
    if (Object.keys(initialParams).length === 0) {
      setSizingMethod(initialSizingMethod);
      setParams(defaultParams[initialSizingMethod]);
    }
  }, [initialSizingMethod]);

  // Debug initial mount
  useEffect(() => {
    console.debug('[PositionSizingControls] mount', { initialSizingMethod, initialParams, resolvedParams: params });
  }, []);
 
  const handleSizingMethodChange = (event) => {
    const method = event.target.value;
    console.debug('[PositionSizingControls] handleSizingMethodChange', { method });
    setSizingMethod(method);
    setParams(defaultParams[method]);
    setValidationErrors({});
    onPositionSizingChange(method, defaultParams[method]);
  };

  const handleParamChange = (param, value) => {
    const newParams = { ...params, [param]: value };
    console.debug('[PositionSizingControls] handleParamChange', { param, value, newParams });
    setParams(newParams);
    validateParams(newParams);
    onPositionSizingChange(sizingMethod, newParams);
  };

  const validateParams = (currentParams) => {
    const errors = {};
    
    // Validate numeric parameters
    Object.keys(currentParams).forEach(key => {
      if (typeof currentParams[key] === 'number' && currentParams[key] < 0) {
        errors[key] = 'Value must be positive';
      }
    });

    // Specific validations
    if (sizingMethod === 'percent_risk' && currentParams.stopLossPercentage <= 0) {
      errors.stopLossPercentage = 'Stop loss must be greater than 0';
    }

    if (sizingMethod === 'kelly_criterion') {
      if (currentParams.kellyAvgLoss === 0) {
        errors.kellyAvgLoss = 'Average loss cannot be zero';
      }
      if (currentParams.kellyWinRate < 0 || currentParams.kellyWinRate > 100) {
        errors.kellyWinRate = 'Win rate must be between 0 and 100';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const getMethodDescription = () => {
    const descriptions = {
      equal_weight: 'Allocates a fixed percentage of portfolio value to each trade',
      fixed_amount: 'Uses the same dollar amount for every trade',
      percent_risk: 'Risks a fixed percentage based on stop-loss distance',
      volatility_target: 'Adjusts position size based on instrument volatility',
      atr_based: 'Uses Average True Range to measure and size positions',
      kelly_criterion: 'Mathematically optimal sizing based on win rate and averages'
    };
    return descriptions[sizingMethod];
  };

  const getMethodAdvantages = () => {
    const advantages = {
      equal_weight: ['Simple to understand', 'Ensures diversification', 'Consistent risk'],
      fixed_amount: ['Predictable position sizes', 'Easy to calculate', 'Capital preservation'],
      percent_risk: ['Controls maximum loss', 'Adapts to stop-loss levels', 'Risk-conscious'],
      volatility_target: ['Risk-adjusted sizing', 'Accounts for volatility', 'Professional approach'],
      atr_based: ['Adapts to market conditions', 'Good for trend-following', 'Technical analysis'],
      kelly_criterion: ['Theoretically optimal', 'Maximizes growth', 'Mathematical precision']
    };
    return advantages[sizingMethod];
  };

  const renderMethodSpecificControls = () => {
    switch (sizingMethod) {
      case 'equal_weight':
        return (
          <Grid item xs={12} md={6}>
            <Box>
              <Typography variant="subtitle2">Risk Percentage</Typography>
              <Slider
                value={params.riskPercentage}
                onChange={(event, newValue) => handleParamChange('riskPercentage', typeof newValue === 'number' ? newValue : Number(newValue))}
                min={0.1}
                max={10}
                step={0.1}
                disabled={disabled}
                marks={[
                  { value: 0.1, label: '0.1%' },
                  { value: 2, label: '2%' },
                  { value: 5, label: '5%' },
                  { value: 10, label: '10%' }
                ]}
              />
              <TextField
                fullWidth
                label="Risk Percentage"
                type="number"
                value={params.riskPercentage}
                onChange={(e) => handleParamChange('riskPercentage', parseFloat(e.target.value) || 0)}
                error={!!validationErrors.riskPercentage}
                helperText={validationErrors.riskPercentage}
                disabled={disabled}
                InputProps={{
                  endAdornment: <span>%</span>
                }}
              />
            </Box>
          </Grid>
        );

      case 'fixed_amount':
        return (
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Fixed Amount ($)"
              type="number"
              value={params.fixedAmount}
              onChange={(e) => handleParamChange('fixedAmount', parseFloat(e.target.value) || 0)}
              error={!!validationErrors.fixedAmount}
              helperText={validationErrors.fixedAmount}
              disabled={disabled}
              InputProps={{
                startAdornment: <span>$</span>
              }}
            />
          </Grid>
        );

      case 'percent_risk':
        return (
          <>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Risk Percentage"
                type="number"
                value={params.riskPercentage}
                onChange={(e) => handleParamChange('riskPercentage', parseFloat(e.target.value) || 0)}
                error={!!validationErrors.riskPercentage}
                helperText={validationErrors.riskPercentage}
                disabled={disabled}
                InputProps={{
                  endAdornment: <span>%</span>
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Stop Loss Percentage"
                type="number"
                value={params.stopLossPercentage}
                onChange={(e) => handleParamChange('stopLossPercentage', parseFloat(e.target.value) || 0)}
                error={!!validationErrors.stopLossPercentage}
                helperText={validationErrors.stopLossPercentage}
                disabled={disabled}
                InputProps={{
                  endAdornment: <span>%</span>
                }}
              />
            </Grid>
          </>
        );

      case 'volatility_target':
        return (
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Volatility Target"
              type="number"
              value={params.volatilityTarget}
              onChange={(e) => handleParamChange('volatilityTarget', parseFloat(e.target.value) || 0)}
              error={!!validationErrors.volatilityTarget}
              helperText={validationErrors.volatilityTarget}
              disabled={disabled}
              InputProps={{
                endAdornment: <span>%</span>
              }}
            />
          </Grid>
        );

      case 'atr_based':
        return (
          <>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Risk Percentage"
                type="number"
                value={params.riskPercentage}
                onChange={(e) => handleParamChange('riskPercentage', parseFloat(e.target.value) || 0)}
                error={!!validationErrors.riskPercentage}
                helperText={validationErrors.riskPercentage}
                disabled={disabled}
                InputProps={{
                  endAdornment: <span>%</span>
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="ATR Multiplier"
                type="number"
                value={params.atrMultiplier}
                onChange={(e) => handleParamChange('atrMultiplier', parseFloat(e.target.value) || 0)}
                error={!!validationErrors.atrMultiplier}
                helperText={validationErrors.atrMultiplier}
                disabled={disabled}
              />
            </Grid>
          </>
        );

      case 'kelly_criterion':
        return (
          <>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Win Rate (%)"
                type="number"
                value={params.kellyWinRate}
                onChange={(e) => handleParamChange('kellyWinRate', parseFloat(e.target.value) || 0)}
                error={!!validationErrors.kellyWinRate}
                helperText={validationErrors.kellyWinRate}
                disabled={disabled}
                InputProps={{
                  endAdornment: <span>%</span>
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Avg Win (%)"
                type="number"
                value={params.kellyAvgWin}
                onChange={(e) => handleParamChange('kellyAvgWin', parseFloat(e.target.value) || 0)}
                error={!!validationErrors.kellyAvgWin}
                helperText={validationErrors.kellyAvgWin}
                disabled={disabled}
                InputProps={{
                  endAdornment: <span>%</span>
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Avg Loss (%)"
                type="number"
                value={params.kellyAvgLoss}
                onChange={(e) => handleParamChange('kellyAvgLoss', parseFloat(e.target.value) || 0)}
                error={!!validationErrors.kellyAvgLoss}
                helperText={validationErrors.kellyAvgLoss}
                disabled={disabled}
                InputProps={{
                  endAdornment: <span>%</span>
                }}
              />
            </Grid>
          </>
        );

      default:
        return null;
    }
  };

  const isFormValid = Object.keys(validationErrors).length === 0;
 
  return (
    <Card className="position-sizing-controls">
      <CardContent>
        <Box className="controls-header">
          <Typography variant="h6" className="controls-title">
            <Calculate className="controls-icon" />
            Position Sizing Controls
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={isAdvancedMode}
                onChange={(e) => setIsAdvancedMode(e.target.checked)}
                disabled={disabled}
                color="primary"
              />
            }
            label="Advanced Mode"
          />
        </Box>

        <Divider className="controls-divider" />

        {/* Method Selection */}
        <Grid container spacing={2} className="method-selection">
          <Grid item xs={12} md={8}>
            <FormControl fullWidth>
              <InputLabel>Sizing Method</InputLabel>
              <Select
                value={sizingMethod}
                onChange={handleSizingMethodChange}
                disabled={disabled}
                className="sizing-method-select"
              >
                <MenuItem value="equal_weight">
                  <Box display="flex" alignItems="center">
                    <Equalizer className="menu-icon" />
                    <span>Equal Weight (2%)</span>
                  </Box>
                </MenuItem>
                <MenuItem value="fixed_amount">
                  <Box display="flex" alignItems="center">
                    <AccountBalance className="menu-icon" />
                    <span>Fixed Amount</span>
                  </Box>
                </MenuItem>
                <MenuItem value="percent_risk">
                  <Box display="flex" alignItems="center">
                    <TrendingUp className="menu-icon" />
                    <span>Percent Risk</span>
                  </Box>
                </MenuItem>
                <MenuItem value="volatility_target">
                  <Box display="flex" alignItems="center">
                    <Equalizer className="menu-icon" />
                    <span>Volatility Targeting</span>
                  </Box>
                </MenuItem>
                <MenuItem value="atr_based">
                  <Box display="flex" alignItems="center">
                    <TrendingUp className="menu-icon" />
                    <span>ATR-based Sizing</span>
                  </Box>
                </MenuItem>
                <MenuItem value="kelly_criterion">
                  <Box display="flex" alignItems="center">
                    <Calculate className="menu-icon" />
                    <span>Kelly Criterion</span>
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper className="method-info">
              <Typography variant="body2" className="method-description">
                {getMethodDescription()}
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Method Advantages */}
        {isAdvancedMode && (
          <Box className="method-advantages">
            <Typography variant="subtitle2" className="advantages-title">
              Key Advantages:
            </Typography>
            <Box className="advantages-chips">
              {getMethodAdvantages().map((advantage, index) => (
                <Chip
                  key={index}
                  label={advantage}
                  size="small"
                  className="advantage-chip"
                  icon={<CheckCircle fontSize="small" />}
                />
              ))}
            </Box>
          </Box>
        )}

        {/* Method-Specific Controls */}
        <Grid container spacing={2} className="method-controls">
          {renderMethodSpecificControls()}
        </Grid>

        {/* Leverage Control */}
        <Grid container spacing={2} className="leverage-control">
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={params.allowLeverage}
                  onChange={(e) => handleParamChange('allowLeverage', e.target.checked)}
                  disabled={disabled}
                  color="primary"
                />
              }
              label="Allow Leverage"
              className="leverage-switch"
            />
            <Tooltip
              title="When enabled, positions can exceed available capital. Use with caution."
              placement="top"
            >
              <Info className="leverage-info-icon" />
            </Tooltip>
          </Grid>
        </Grid>

        {/* Validation Alert */}
        {Object.keys(validationErrors).length > 0 && (
          <Alert severity="warning" className="validation-alert">
            <Warning className="alert-icon" />
            Please fix the validation errors before proceeding.
          </Alert>
        )}

        {/* Apply Button */}
        <Box className="controls-actions">
          <Button
            variant="contained"
            color="primary"
            onClick={() => onPositionSizingChange(sizingMethod, params)}
            disabled={!isFormValid || disabled}
            className="apply-button"
            startIcon={<CheckCircle />}
          >
            Apply Position Sizing
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default PositionSizingControls;