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
  Paper,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  InputAdornment
} from '@mui/material';
import {
  Security,
  Warning,
  TrendingUp,
  TrendingDown,
  Shield,
  Assessment,
  Info,
  CheckCircle,
  Error,
  Help,
  NotificationsActive,
  GppGood,
  Block
} from '@mui/icons-material';
import './RiskManagementControls.css';

const defaultParams = {
  conservative: {
    maxDrawdown: 10.0,
    maxPositionSize: 5.0,
    riskPerTrade: 1.0,
    stopLoss: 3.0,
    takeProfit: 6.0,
    maxCorrelation: 0.7,
    diversification: 0.8,
    trailingStop: false,
    trailingStopDistance: 2.0,
    riskRewardRatio: 2.0,
    maxLeverage: 1.0,
    volatilityLimit: 0.15,
    sectorLimit: 20.0,
    dailyLossLimit: 2.0,
    weeklyLossLimit: 5.0,
    monthlyLossLimit: 10.0
  },
  moderate: {
    maxDrawdown: 15.0,
    maxPositionSize: 8.0,
    riskPerTrade: 2.0,
    stopLoss: 5.0,
    takeProfit: 10.0,
    maxCorrelation: 0.8,
    diversification: 0.6,
    trailingStop: true,
    trailingStopDistance: 3.0,
    riskRewardRatio: 2.5,
    maxLeverage: 2.0,
    volatilityLimit: 0.20,
    sectorLimit: 30.0,
    dailyLossLimit: 3.0,
    weeklyLossLimit: 8.0,
    monthlyLossLimit: 15.0
  },
  aggressive: {
    maxDrawdown: 25.0,
    maxPositionSize: 15.0,
    riskPerTrade: 3.0,
    stopLoss: 8.0,
    takeProfit: 15.0,
    maxCorrelation: 0.9,
    diversification: 0.4,
    trailingStop: true,
    trailingStopDistance: 4.0,
    riskRewardRatio: 3.0,
    maxLeverage: 4.0,
    volatilityLimit: 0.30,
    sectorLimit: 40.0,
    dailyLossLimit: 5.0,
    weeklyLossLimit: 12.0,
    monthlyLossLimit: 20.0
  }
};

const RiskManagementControls = ({
  onRiskManagementChange = () => {},
  initialRiskProfile = 'moderate',
  initialParams = {},
  disabled = false
}) => {
  const [riskProfile, setRiskProfile] = useState(initialRiskProfile);
  const [params, setParams] = useState(initialParams && Object.keys(initialParams).length > 0 ? initialParams : defaultParams[initialRiskProfile]);
  const [validationErrors, setValidationErrors] = useState({});
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [isCalculating, setIsCalculating] = useState(false);

  // Debug initial mount
  useEffect(() => {
    console.debug('[RiskManagementControls] mount', { initialRiskProfile, initialParams, resolvedParams: params });
  }, []);

  // Initialize with default params if none provided

  useEffect(() => {
    const errors = validateParams(params);
    setValidationErrors(prev => (JSON.stringify(errors) === JSON.stringify(prev) ? prev : errors));
  }, [params]);

  const handleRiskProfileChange = (event) => {
    const profile = event.target.value;
    console.debug('[RiskManagementControls] handleRiskProfileChange', { profile });
    setRiskProfile(profile);
    setParams(defaultParams[profile]);
    setValidationErrors({});
    onRiskManagementChange(profile, defaultParams[profile]);
    setActiveStep(0);
  };

  const handleParamChange = (param, value) => {
    const newParams = { ...params, [param]: value };
    console.debug('[RiskManagementControls] handleParamChange', { param, value, newParams });
    setParams(newParams);
    onRiskManagementChange(riskProfile, newParams);
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
    if (currentParams.stopLoss >= currentParams.takeProfit) {
      errors.stopLoss = 'Stop loss must be less than take profit';
    }

    if (currentParams.maxPositionSize > 100) {
      errors.maxPositionSize = 'Max position size cannot exceed 100%';
    }

    if (currentParams.maxLeverage < 1) {
      errors.maxLeverage = 'Max leverage must be at least 1x';
    }

    if (currentParams.riskRewardRatio <= 1) {
      errors.riskRewardRatio = 'Risk/reward ratio must be greater than 1';
    }

    return errors;
  };

  const getRiskProfileDescription = () => {
    const descriptions = {
      conservative: 'Low risk approach with strict controls and conservative position sizing',
      moderate: 'Balanced risk management with moderate position sizing and flexible controls',
      aggressive: 'Higher risk tolerance with larger positions and more aggressive strategies'
    };
    return descriptions[riskProfile];
  };

  const getRiskProfileAdvantages = () => {
    const advantages = {
      conservative: ['Capital preservation', 'Lower volatility', 'Steady growth', 'Peace of mind'],
      moderate: ['Balanced returns', 'Flexible strategy', 'Risk-adjusted growth', 'Professional approach'],
      aggressive: ['Higher returns potential', 'Faster capital growth', 'Strategic advantage', 'Market opportunities']
    };
    return advantages[riskProfile];
  };

  const getRiskProfileWarnings = () => {
    const warnings = {
      conservative: ['Lower returns', 'Missed opportunities', 'Underperformance in bull markets'],
      moderate: ['Moderate risk exposure', 'Requires active monitoring', 'Balanced performance'],
      aggressive: ['Higher risk of losses', 'Increased volatility', 'Requires experience']
    };
    return warnings[riskProfile];
  };

  const renderRiskControls = () => {
    const basicControls = [
      { key: 'maxDrawdown', label: 'Max Drawdown (%)', min: 5, max: 50, step: 1 },
      { key: 'maxPositionSize', label: 'Max Position Size (%)', min: 1, max: 50, step: 1 },
      { key: 'riskPerTrade', label: 'Risk Per Trade (%)', min: 0.1, max: 10, step: 0.1 },
      { key: 'stopLoss', label: 'Stop Loss (%)', min: 1, max: 20, step: 0.5 },
      { key: 'takeProfit', label: 'Take Profit (%)', min: 2, max: 50, step: 0.5 }
    ];

    const advancedControls = [
      { key: 'maxCorrelation', label: 'Max Correlation', min: 0.1, max: 1.0, step: 0.1 },
      { key: 'diversification', label: 'Diversification Level', min: 0.1, max: 1.0, step: 0.1 },
      { key: 'trailingStopDistance', label: 'Trailing Stop Distance (%)', min: 1, max: 10, step: 0.5 },
      { key: 'riskRewardRatio', label: 'Risk/Reward Ratio', min: 1.0, max: 5.0, step: 0.1 },
      { key: 'maxLeverage', label: 'Max Leverage', min: 1, max: 10, step: 0.5 },
      { key: 'volatilityLimit', label: 'Volatility Limit', min: 0.05, max: 0.50, step: 0.05 },
      { key: 'sectorLimit', label: 'Sector Limit (%)', min: 10, max: 100, step: 5 },
      { key: 'dailyLossLimit', label: 'Daily Loss Limit (%)', min: 0.5, max: 10, step: 0.5 },
      { key: 'weeklyLossLimit', label: 'Weekly Loss Limit (%)', min: 1, max: 20, step: 1 },
      { key: 'monthlyLossLimit', label: 'Monthly Loss Limit (%)', min: 2, max: 30, step: 1 }
    ];

    const controls = isAdvancedMode ? [...basicControls, ...advancedControls] : basicControls;

    return (
      <Grid container spacing={2}>
        {controls.map((control) => (
          <Grid item xs={12} md={6} key={control.key}>
            <TextField
              fullWidth
              label={control.label}
              type="number"
              value={params[control.key]}
              onChange={(e) => handleParamChange(control.key, parseFloat(e.target.value) || 0)}
              error={!!validationErrors[control.key]}
              helperText={validationErrors[control.key]}
              disabled={disabled}
              InputProps={{
                endAdornment: <InputAdornment position="end">%</InputAdornment>
              }}
            />
          </Grid>
        ))}
      </Grid>
    );
  };

  const steps = ['Basic Risk Controls', 'Advanced Settings', 'Risk Analysis'];

  const isFormValid = Object.keys(validationErrors).length === 0;

  return (
    <Card className="risk-management-controls">
      <CardContent>
        <Box className="controls-header">
          <Typography variant="h6" className="controls-title">
            <Security className="controls-icon" />
            Risk Management Controls
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

        {/* Risk Profile Selection */}
        <Grid container spacing={2} className="risk-profile-selection">
          <Grid item xs={12} md={8}>
            <FormControl fullWidth>
              <InputLabel>Risk Profile</InputLabel>
              <Select
                value={riskProfile}
                onChange={handleRiskProfileChange}
                disabled={disabled}
                className="risk-profile-select"
              >
                <MenuItem value="conservative">
                  <Box display="flex" alignItems="center">
                    <Shield className="menu-icon" style={{ color: '#4caf50' }} />
                    <span>Conservative</span>
                  </Box>
                </MenuItem>
                <MenuItem value="moderate">
                  <Box display="flex" alignItems="center">
                    <Assessment className="menu-icon" style={{ color: '#ff9800' }} />
                    <span>Moderate</span>
                  </Box>
                </MenuItem>
                <MenuItem value="aggressive">
                  <Box display="flex" alignItems="center">
                    <TrendingUp className="menu-icon" style={{ color: '#f44336' }} />
                    <span>Aggressive</span>
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper className="risk-profile-info">
              <Typography variant="body2" className="risk-profile-description">
                {getRiskProfileDescription()}
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Risk Profile Summary */}
        <Box className="risk-profile-summary">
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Box className="summary-section">
                <Typography variant="subtitle2" className="summary-title">
                  <CheckCircle className="summary-icon" style={{ color: '#4caf50' }} />
                  Advantages
                </Typography>
                <Box className="summary-chips">
                  {getRiskProfileAdvantages().map((advantage, index) => (
                    <Chip
                      key={index}
                      label={advantage}
                      size="small"
                      className="advantage-chip"
                      style={{ background: 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)' }}
                    />
                  ))}
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box className="summary-section">
                <Typography variant="subtitle2" className="summary-title">
                  <Warning className="summary-icon" style={{ color: '#ff9800' }} />
                  Considerations
                </Typography>
                <Box className="summary-chips">
                  {getRiskProfileWarnings().map((warning, index) => (
                    <Chip
                      key={index}
                      label={warning}
                      size="small"
                      className="warning-chip"
                      style={{ background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)' }}
                    />
                  ))}
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box className="summary-section">
                <Typography variant="subtitle2" className="summary-title">
                  <Security className="summary-icon" style={{ color: '#2196f3' }} />
                  Risk Level
                </Typography>
                <Box className="risk-level-indicator">
                  <div className={`risk-level ${riskProfile}`}></div>
                  <Typography variant="body1" className="risk-level-text">
                    {riskProfile.charAt(0).toUpperCase() + riskProfile.slice(1)}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Box>

        {/* Stepper for guided configuration */}
        {isAdvancedMode && (
          <Box className="configuration-stepper">
            <Stepper activeStep={activeStep} alternativeLabel>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>
        )}

        {/* Risk Controls */}
        <Box className="risk-controls">
          {renderRiskControls()}
        </Box>

        {/* Trailing Stop Control */}
        <Grid container spacing={2} className="trailing-stop-control">
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={params.trailingStop}
                  onChange={(e) => handleParamChange('trailingStop', e.target.checked)}
                  disabled={disabled}
                  color="primary"
                />
              }
              label="Enable Trailing Stop"
              className="trailing-stop-switch"
            />
            <Tooltip
              title="When enabled, stop loss moves up as price increases, locking in profits"
              placement="top"
            >
              <Info className="trailing-info-icon" />
            </Tooltip>
          </Grid>
        </Grid>

        {/* Validation Alert */}
        {Object.keys(validationErrors).length > 0 && (
          <Alert severity="warning" className="validation-alert">
            <Error className="alert-icon" />
            Please fix the validation errors before proceeding.
          </Alert>
        )}

        {/* Apply Button */}
        <Box className="controls-actions">
          <Button
            variant="contained"
            color="primary"
            onClick={() => onRiskManagementChange(riskProfile, params)}
            disabled={!isFormValid || disabled}
            className="apply-button"
            startIcon={<CheckCircle />}
          >
            Apply Risk Management
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default RiskManagementControls;
