
import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Button,
  IconButton,
  Tooltip,
  Paper,
  LinearProgress,
  Alert,
  Chip,
  Badge,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider
} from '@mui/material';
import {
  Assessment,
  TrendingUp,
  TrendingDown,
  ShowChart,
  PieChart,
  BarChart,
  Timeline,
  FilterList,
  Download,
  Refresh,
  ExpandMore,
  Info,
  Casino,
  BarChart3,
  ScatterPlot,
  CalendarToday,
  MonetizationOn,
  Speed,
  Shield,
  Equalizer,
  Analytics,
  Leaderboard,
  Insights,
  AssessmentOutlined,
  TrendingUpOutlined,
  TrendingDownOutlined,
  ShowChartOutlined,
  PieChartOutlined,
  BarChartOutlined,
  TimelineOutlined,
  FilterListOutlined,
  DownloadOutlined,
  RefreshOutlined,
  ExpandMoreOutlined,
  InfoOutlined,
  CasinoOutlined,
  BarChart3Outlined,
  ScatterPlotOutlined,
  CalendarTodayOutlined,
  MonetizationOnOutlined,
  SpeedOutlined,
  ShieldOutlined,
  EqualizerOutlined,
  AnalyticsOutlined,
  LeaderboardOutlined,
  InsightsOutlined
} from '@mui/icons-material';
import Plot from 'react-plotly.js';
import './MonteCarloSimulation.css';

const MonteCarloSimulation = ({
  simulationData,
  tradeData,
  initialCapital = 100000,
  signalType = 'long',
  timeRange = 'all',
  onSimulationChange = () => {},
  disabled = false
}) => {
  const [simulationParams, setSimulationParams] = useState({
    nSimulations: 1000,
    nTrades: 50,
    confidenceLevel: 95,
    allowNegative: true,
    timeHorizon: 252
  });
  
  const [selectedAnalysis, setSelectedAnalysis] = useState('distribution');
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [sortBy, setSortBy] = useState('mean_return');
  const [sortDirection, setSortDirection] = useState('desc');

  // Calculate derived metrics from simulation data
  const calculateDerivedMetrics = (data) => {
    if (!data || !data.simulations || data.simulations.length === 0) return null;

    const simulations = data.simulations;
    const meanReturn = data.mean_return || 0;
    const stdReturn = data.std_return || 0;
    const percentiles = data.percentiles || {};

    // Calculate additional risk metrics
    const var95 = percentiles['5th'] || 0;
    const var99 = percentiles['1th'] || 0;
    const expectedShortfall = simulations.filter(s => s <= var95).length > 0 
      ? simulations.filter(s => s <= var95).reduce((sum, s) => sum + s, 0) / simulations.filter(s => s <= var95).length 
      : 0;
    
    const skewness = calculateSkewness(simulations);
    const kurtosis = calculateKurtosis(simulations);
    
    // Calculate probability of positive returns
    const positiveReturns = simulations.filter(s => s > 0).length;
    const probPositive = (positiveReturns / simulations.length) * 100;

    // Calculate worst/best case scenarios
    const worstCase = Math.min(...simulations);
    const bestCase = Math.max(...simulations);

    return {
      meanReturn,
      stdReturn,
      var95,
      var99,
      expectedShortfall,
      skewness,
      kurtosis,
      probPositive,
      worstCase,
      bestCase,
      simulationsCount: simulations.length,
      percentiles
    };
  };

  const calculateSkewness = (data) => {
    if (!data || data.length < 3) return 0;
    
    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    const std = Math.sqrt(data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length);
    
    if (std === 0) return 0;
    
    const skewness = data.reduce((sum, val) => sum + Math.pow((val - mean) / std, 3), 0) / data.length;
    return skewness;
  };

  const calculateKurtosis = (data) => {
    if (!data || data.length < 4) return 0;
    
    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    const std = Math.sqrt(data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length);
    
    if (std === 0) return 0;
    
    const kurtosis = data.reduce((sum, val) => sum + Math.pow((val - mean) / std, 4), 0) / data.length - 3;
    return kurtosis;
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercentage = (value) => {
    return `${value.toFixed(2)}%`;
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(value);
  };

  // Generate chart data based on selected analysis
  const generateChartData = () => {
    if (!simulationData || !simulationData.simulations) return null;

    const simulations = simulationData.simulations;
    const metrics = calculateDerivedMetrics(simulationData);

    switch (selectedAnalysis) {
      case 'distribution':
        return {
          type: 'histogram',
          data: [{
            x: simulations,
            type: 'histogram',
            nbinsx: 50,
            name: 'Return Distribution',
            marker: { color: '#1f77b4', opacity: 0.7 }
          }],
          layout: {
            title: 'Monte Carlo Return Distribution',
            xaxis: { title: 'Return (%)' },
            yaxis: { title: 'Frequency' },
            bargap: 0.1,
            paper_bgcolor: '#2a2a2a',
            plot_bgcolor: '#2a2a2a',
            font: { color: '#e0e0e0' }
          }
        };

      case 'confidence':
        return {
          type: 'scatter',
          data: [
            {
              x: Array(simulations.length).fill(0).map((_, i) => i),
              y: simulations,
              type: 'scatter',
              mode: 'markers',
              name: 'Simulation Results',
              marker: { color: '#ff7f0e', size: 3, opacity: 0.6 }
            },
            {
              x: [0, simulations.length - 1],
              y: [metrics.percentiles['5th'], metrics.percentiles['5th']],
              type: 'scatter',
              mode: 'lines',
              name: '5th Percentile',
              line: { color: '#dc3545', width: 2 }
            },
            {
              x: [0, simulations.length - 1],
              y: [metrics.percentiles['95th'], metrics.percentiles['95th']],
              type: 'scatter',
              mode: 'lines',
              name: '95th Percentile',
              line: { color: '#28a745', width: 2 }
            }
          ],
          layout: {
            title: 'Simulation Results with Confidence Intervals',
            xaxis: { title: 'Simulation Number' },
            yaxis: { title: 'Return (%)' },
            paper_bgcolor: '#2a2a2a',
            plot_bgcolor: '#2a2a2a',
            font: { color: '#e0e0e0' }
          }
        };

      case 'cumulative':
        return {
          type: 'scatter',
          data: [{
            x: Array(simulations.length).fill(0).map((_, i) => i),
            y: simulations,
            type: 'scatter',
            mode: 'lines',
            name: 'Cumulative Returns',
            line: { color: '#1f77b4', width: 1 }
          }],
          layout: {
            title: 'Cumulative Return Paths',
            xaxis: { title: 'Trade Number' },
            yaxis: { title: 'Cumulative Return (%)' },
            paper_bgcolor: '#2a2a2a',
            plot_bgcolor: '#2a2a2a',
            font: { color: '#e0e0e0' }
          }
        };

      case 'comparison':
        return {
          type: 'box',
          data: [{
            y: simulations,
            type: 'box',
            name: 'Monte Carlo Results',
            marker: { color: '#1f77b4' }
          }],
          layout: {
            title: 'Return Distribution Summary',
            yaxis: { title: 'Return (%)' },
            paper_bgcolor: '#2a2a2a',
            plot_bgcolor: '#2a2a2a',
            font: { color: '#e0e0e0' }
          }
        };

      default:
        return null;
    }
  };

  const getRiskRating = (metrics) => {
    if (!metrics) return 'N/A';
    
    const score = (
      (metrics.meanReturn > 0 ? 1 : 0) +
      (metrics.stdReturn < 20 ? 1 : 0) +
      (metrics.var95 > -10 ? 1 : 0) +
      (metrics.probPositive > 60 ? 1 : 0) +
      (Math.abs(metrics.skewness) < 1 ? 1 : 0)
    );
    
    if (score >= 4) return 'Excellent';
    if (score >= 3) return 'Good';
    if (score >= 2) return 'Average';
    return 'Poor';
  };

  const getRiskColor = (rating) => {
    const colors = {
      'Excellent': '#4caf50',
      'Good': '#8bc34a',
      'Average': '#ff9800',
      'Poor': '#f44336'
    };
    return colors[rating] || '#9e9e9e';
  };

  const handleParamChange = (param, value) => {
    setSimulationParams(prev => ({
      ...prev,
      [param]: value
    }));
  };

  const runSimulation = async () => {
    setIsRunning(true);
    setError(null);
    
    try {
      // Simulate API call to backend
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For demo purposes, generate mock simulation data
      const mockData = generateMockSimulationData();
      onSimulationChange(mockData);
    } catch (err) {
      setError('Simulation failed. Please try again.');
      console.error('Simulation error:', err);
    } finally {
      setIsRunning(false);
    }
  };

  const generateMockSimulationData = () => {
    const { nSimulations, nTrades } = simulationParams;
    const simulations = [];
    
    // Generate realistic simulation data
    for (let i = 0; i < nSimulations; i++) {
      let cumulativeReturn = 1;
      for (let j = 0; j < nTrades; j++) {
        const tradeReturn = (Math.random() - 0.4) * 0.1; // Mean 2% return, std 10%
        cumulativeReturn *= (1 + tradeReturn);
      }
      simulations.push((cumulativeReturn - 1) * 100);
    }
    
    const meanReturn = simulations.reduce((sum, val) => sum + val, 0) / simulations.length;
    const stdReturn = Math.sqrt(simulations.reduce((sum, val) => sum + Math.pow(val - meanReturn, 2), 0) / simulations.length);
    
    const percentiles = {
      '5th': simulations.sort((a, b) => a - b)[Math.floor(simulations.length * 0.05)],
      '25th': simulations.sort((a, b) => a - b)[Math.floor(simulations.length * 0.25)],
      '50th': simulations.sort((a, b) => a - b)[Math.floor(simulations.length * 0.5)],
      '75th': simulations.sort((a, b) => a - b)[Math.floor(simulations.length * 0.75)],
      '95th': simulations.sort((a, b) => a - b)[Math.floor(simulations.length * 0.95)]
    };
    
    return {
      simulations,
      meanReturn,
      stdReturn,
      percentiles
    };
  };

  const exportResults = () => {
    if (!simulationData) return;
    
    const metrics = calculateDerivedMetrics(simulationData);
    const exportData = {
      simulationParams,
      metrics,
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `monte_carlo_simulation_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const chartData = generateChartData();
  const metrics = calculateDerivedMetrics(simulationData);

  if (!simulationData || !simulationData.simulations) {
    return (
      <Card className="monte-carlo-simulation">
        <CardContent>
          <Box className="empty-state">
            <CasinoOutlined className="empty-icon" />
            <Typography variant="h6" className="empty-title">
              No Simulation Data Available
            </Typography>
            <Typography variant="body2" className="empty-description">
              Run a backtest to see Monte Carlo simulation results
            </Typography>
            <Button 
              variant="contained" 
              onClick={runSimulation}
              disabled={disabled}
              className="run-simulation-button"
            >
              <Casino /> Run Simulation
            </Button>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="monte-carlo-simulation">
      <CardContent>
        <Box className="simulation-header">
          <Box className="header-left">
            <Typography variant="h6" className="simulation-title">
              <Casino className="title-icon" />
              Monte Carlo Simulation
            </Typography>
            <Box className="signal-type-badge">
              <Chip
                label={signalType.toUpperCase()}
                size="small"
                className="signal-chip"
                style={{
                  background: signalType === 'long' 
                    ? 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)'
                    : signalType === 'short'
                    ? 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)'
                    : 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)'
                }}
              />
            </Box>
          </Box>
          <Box className="header-right">
            <Badge
              badgeContent={getRiskRating(metrics)}
              color="primary"
              className="risk-badge"
              style={{
                backgroundColor: getRiskColor(getRiskRating(metrics)),
                color: 'white'
              }}
            />
            <Tooltip title="Run new simulation">
              <span>
                <IconButton
                  size="small"
                  onClick={runSimulation}
                  disabled={disabled || isRunning}
                  className="run-button"
                >
                  <Refresh />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Export results">
              <span>
                <IconButton
                  size="small"
                  onClick={exportResults}
                  disabled={disabled}
                  className="export-button"
                >
                  <Download />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        </Box>

        <Divider className="simulation-divider" />

        {/* Simulation Parameters */}
        <Box className="simulation-params">
          <Typography variant="subtitle1" className="params-title">
            Simulation Parameters
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <label className="form-label-enhanced">Simulations</label>
                <Slider
                  value={simulationParams.nSimulations}
                  onChange={(e, value) => handleParamChange('nSimulations', value)}
                  min={100}
                  max={5000}
                  step={100}
                  marks
                  valueLabelDisplay="auto"
                  disabled={disabled}
                />
                <Typography variant="body2" className="param-value">
                  {simulationParams.nSimulations.toLocaleString()}
                </Typography>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <label className="form-label-enhanced">Trades per Simulation</label>
                <Slider
                  value={simulationParams.nTrades}
                  onChange={(e, value) => handleParamChange('nTrades', value)}
                  min={10}
                  max={200}
                  step={5}
                  marks
                  valueLabelDisplay="auto"
                  disabled={disabled}
                />
                <Typography variant="body2" className="param-value">
                  {simulationParams.nTrades}
                </Typography>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <label className="form-label-enhanced">Confidence Level</label>
                <Slider
                  value={simulationParams.confidenceLevel}
                  onChange={(e, value) => handleParamChange('confidenceLevel', value)}
                  min={80}
                  max={99}
                  step={1}
                  marks
                  valueLabelDisplay="auto"
                  disabled={disabled}
                />
                <Typography variant="body2" className="param-value">
                  {simulationParams.confidenceLevel}%
                </Typography>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <label className="form-label-enhanced">Time Horizon (Days)</label>
                <Slider
                  value={simulationParams.timeHorizon}
                  onChange={(e, value) => handleParamChange('timeHorizon', value)}
                  min={30}
                  max={1000}
                  step={30}
                  marks
                  valueLabelDisplay="auto"
                  disabled={disabled}
                />
                <Typography variant="body2" className="param-value">
                  {simulationParams.timeHorizon}
                </Typography>
              </FormControl>
            </Grid>
          </Grid>
        </Box>

        {/* Risk Overview */}
        <Box className="risk-overview">
          <Paper className="overview-card">
            <Box className="overview-header">
              <Typography variant="subtitle1" className="overview-title">
                Risk Overview
              </Typography>
              <Badge
                badgeContent={getRiskRating(metrics)}
                color="primary"
                className="performance-badge"
                style={{
                  backgroundColor: getRiskColor(getRiskRating(metrics)),
                  color: 'white'
                }}
              />
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Box className="overview-metric">
                  <MonetizationOn className="metric-icon" />
                  <Typography variant="body2" className="metric-label">
                    Mean Return
                  </Typography>
                  <Typography variant="h5" className={`metric-value ${metrics.meanReturn >= 0 ? 'positive' : 'negative'}`}>
                    {formatPercentage(metrics.meanReturn)}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box className="overview-metric">
                  <Speed className="metric-icon" />
                  <Typography variant="body2" className="metric-label">
                    Volatility
                  </Typography>
                  <Typography variant="h5" className="metric-value">
                    {formatPercentage(metrics.stdReturn)}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box className="overview-metric">
                  <Shield className="metric-icon" />
                  <Typography variant="body2" className="metric-label">
                    Value at Risk
                  </Typography>
                  <Typography variant="h5" className="metric-value negative">
                    {formatPercentage(metrics.var95)}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box className="overview-metric">
                  <TrendingUp className="metric-icon" />
                  <Typography variant="body2" className="metric-label">
                    Positive Returns
                  </Typography>
                  <Typography variant="h5" className="metric-value positive">
                    {formatPercentage(metrics.probPositive)}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Box>

        {/* Chart Analysis */}
        <Box className="chart-analysis">
          <Box className="chart-controls">
            <Typography variant="subtitle1" className="chart-title">
              Simulation Analysis
            </Typography>
            <Box className="analysis-tabs">
              <Button
                variant={selectedAnalysis === 'distribution' ? 'contained' : 'outlined'}
                size="small"
                onClick={() => setSelectedAnalysis('distribution')}
                disabled={disabled}
                className="analysis-tab"
              >
                <BarChart3 /> Distribution
              </Button>
              <Button
                variant={selectedAnalysis === 'confidence' ? 'contained' : 'outlined'}
                size="small"
                onClick={() => setSelectedAnalysis('confidence')}
                disabled={disabled}
                className="analysis-tab"
              >
                <ShowChart /> Confidence
              </Button>
              <Button
                variant={selectedAnalysis === 'cumulative' ? 'contained' : 'outlined'}
                size="small"
                onClick={() => setSelectedAnalysis('cumulative')}
                disabled={disabled}
                className="analysis-tab"
              >
                <Timeline /> Cumulative
              </Button>
              <Button
                variant={selectedAnalysis === 'comparison' ? 'contained' : 'outlined'}
                size="small"
                onClick={() => setSelectedAnalysis('comparison')}
                disabled={disabled}
                className="analysis-tab"
              >
                <Equalizer /> Summary
              </Button>
            </Box>
          </Box>
          
          {isRunning ? (
            <Box className="loading-state">
              <LinearProgress />
              <Typography variant="body2" className="loading-text">
                Running Monte Carlo simulation...
              </Typography>
            </Box>
          ) : (
            <Box className="chart-container">
              {chartData && (
                <Plot
                  data={chartData.data}
                  layout={chartData.layout}
                  config={{
                    responsive: true,
                    displaylogo: false,
                    modeBarButtonsToRemove: ['pan2d', 'lasso2d']
                  }}
                  style={{ width: '100%', height: '400px' }}
                />
              )}
            </Box>
          )}
        </Box>

        {/* Advanced Metrics */}
        <Box className="advanced-metrics">
          <Accordion 
            expanded={showAdvanced} 
            onChange={() => setShowAdvanced(!showAdvanced)}
            className="metrics-accordion"
          >
            <AccordionSummary 
              expandIcon={<ExpandMore />}
              className="accordion-summary"
            >
              <Typography variant="subtitle1">
                Advanced Risk Metrics & Statistical Analysis
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box className="advanced-content">
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Paper className="analysis-card">
                      <Typography variant="subtitle2" className="analysis-title">
                        Statistical Properties
                      </Typography>
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Metric</TableCell>
                              <TableCell align="right">Value</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            <TableRow>
                              <TableCell>Skewness</TableCell>
                              <TableCell align="right">{metrics.skewness.toFixed(3)}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Kurtosis</TableCell>
                              <TableCell align="right">{metrics.kurtosis.toFixed(3)}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Worst Case</TableCell>
                              <TableCell align="right" className="negative">{formatPercentage(metrics.worstCase)}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Best Case</TableCell>
                              <TableCell align="right" className="positive">{formatPercentage(metrics.bestCase)}</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Paper className="analysis-card">
                      <Typography variant="subtitle2" className="analysis-title">
                        Confidence Intervals
                      </Typography>
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Percentile</TableCell>
                              <TableCell align="right">Return (%)</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            <TableRow>
                              <TableCell>5th</TableCell>
                              <TableCell align="right" className="negative">{formatPercentage(metrics.percentiles['5th'])}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>25th</TableCell>
                              <TableCell align="right">{formatPercentage(metrics.percentiles['25th'])}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>50th (Median)</TableCell>
                              <TableCell align="right">{formatPercentage(metrics.percentiles['50th'])}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>75th</TableCell>
                              <TableCell align="right">{formatPercentage(metrics.percentiles['75th'])}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>95th</TableCell>
                              <TableCell align="right" className="positive">{formatPercentage(metrics.percentiles['95th'])}</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>
            </AccordionDetails>
          </Accordion>
        </Box>

        {error && (
          <Alert severity="error" className="error-alert">
            {error}
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default MonteCarloSimulation;
 