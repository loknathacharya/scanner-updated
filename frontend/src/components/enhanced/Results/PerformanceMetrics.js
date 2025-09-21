import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  LinearProgress as Progress,
  Alert,
  Paper,
  Button,
  IconButton,
  Tooltip,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Badge
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
  Star,
  StarBorder,
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
  StarOutlined,
  CalendarTodayOutlined,
  MonetizationOnOutlined,
  SpeedOutlined,
  ShieldOutlined,
  EqualizerOutlined,
  AnalyticsOutlined,
  LeaderboardOutlined,
  InsightsOutlined
} from '@mui/icons-material';
import './PerformanceMetrics.css';

const PerformanceMetrics = ({
  performanceData,
  initialCapital = 100000,
  signalType = 'long',
  timeRange = 'all',
  onMetricChange = () => {},
  disabled = false
}) => {
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange);
  const [selectedMetrics, setSelectedMetrics] = useState(['all']);
  const [isExpanded, setIsExpanded] = useState(false);
  const [sortBy, setSortBy] = useState('total_return');
  const [sortDirection, setSortDirection] = useState('desc');
  const [showDetails, setShowDetails] = useState(false);

  // Calculate derived metrics
  const calculateDerivedMetrics = (data) => {
    if (!data || data.length === 0) return null;

    const totalReturn = ((data[data.length - 1].portfolio_value - initialCapital) / initialCapital) * 100;
    const totalTrades = data.length;
    const winningTrades = data.filter(trade => trade.pnl > 0).length;
    const losingTrades = data.filter(trade => trade.pnl <= 0).length;
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
    const avgWin = winningTrades > 0 ? data.filter(trade => trade.pnl > 0).reduce((sum, trade) => sum + trade.pnl, 0) / winningTrades : 0;
    const avgLoss = losingTrades > 0 ? data.filter(trade => trade.pnl <= 0).reduce((sum, trade) => sum + trade.pnl, 0) / losingTrades : 0;
    const profitFactor = Math.abs(avgLoss) > 0 ? Math.abs(avgWin / avgLoss) : 0;
    const maxDrawdown = calculateMaxDrawdown(data);
    const sharpeRatio = calculateSharpeRatio(data);
    const calmarRatio = maxDrawdown !== 0 ? totalReturn / Math.abs(maxDrawdown) : 0;
    const volatility = calculateVolatility(data);

    return {
      totalReturn,
      totalTrades,
      winningTrades,
      losingTrades,
      winRate,
      avgWin,
      avgLoss,
      profitFactor,
      maxDrawdown,
      sharpeRatio,
      calmarRatio,
      volatility,
      finalValue: data[data.length - 1].portfolio_value
    };
  };

  const calculateMaxDrawdown = (data) => {
    if (!data || data.length === 0) return 0;
    
    let peak = data[0].portfolio_value;
    let maxDrawdown = 0;
    
    for (let i = 1; i < data.length; i++) {
      const currentValue = data[i].portfolio_value;
      if (currentValue > peak) {
        peak = currentValue;
      }
      const drawdown = ((peak - currentValue) / peak) * 100;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    }
    
    return maxDrawdown;
  };

  const calculateSharpeRatio = (data) => {
    if (!data || data.length < 2) return 0;
    
    const returns = [];
    for (let i = 1; i < data.length; i++) {
      const return_pct = ((data[i].portfolio_value - data[i-1].portfolio_value) / data[i-1].portfolio_value) * 100;
      returns.push(return_pct);
    }
    
    const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);
    
    return stdDev !== 0 ? avgReturn / stdDev : 0;
  };

  const calculateVolatility = (data) => {
    if (!data || data.length < 2) return 0;
    
    const returns = [];
    for (let i = 1; i < data.length; i++) {
      const return_pct = ((data[i].portfolio_value - data[i-1].portfolio_value) / data[i-1].portfolio_value) * 100;
      returns.push(return_pct);
    }
    
    const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length;
    
    return Math.sqrt(variance);
  };

  const derivedMetrics = calculateDerivedMetrics(performanceData);

  const getPerformanceColor = (value, type) => {
    if (type === 'drawdown' || type === 'loss') {
      return value < 0 ? '#4caf50' : '#f44336';
    }
    return value > 0 ? '#4caf50' : '#f44336';
  };

  const getPerformanceIcon = (value, type) => {
    if (type === 'drawdown' || type === 'loss') {
      return value < 0 ? <TrendingUp /> : <TrendingDown />;
    }
    return value > 0 ? <TrendingUp /> : <TrendingDown />;
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

  const metricDefinitions = {
    totalReturn: {
      label: 'Total Return',
      description: 'Overall portfolio return percentage',
      icon: <TrendingUp />,
      color: '#4caf50'
    },
    totalTrades: {
      label: 'Total Trades',
      description: 'Number of executed trades',
      icon: <Assessment />,
      color: '#2196f3'
    },
    winRate: {
      label: 'Win Rate',
      description: 'Percentage of profitable trades',
      icon: <PieChart />,
      color: '#ff9800'
    },
    profitFactor: {
      label: 'Profit Factor',
      description: 'Ratio of gross profits to gross losses',
      icon: <BarChart />,
      color: '#9c27b0'
    },
    maxDrawdown: {
      label: 'Max Drawdown',
      description: 'Maximum peak-to-trough decline',
      icon: <TrendingDown />,
      color: '#f44336'
    },
    sharpeRatio: {
      label: 'Sharpe Ratio',
      description: 'Risk-adjusted return measure',
      icon: <Equalizer />,
      color: '#00bcd4'
    },
    calmarRatio: {
      label: 'Calmar Ratio',
      description: 'Return relative to drawdown',
      icon: <Speed />,
      color: '#795548'
    },
    volatility: {
      label: 'Volatility',
      description: 'Portfolio volatility percentage',
      icon: <ShowChart />,
      color: '#607d8b'
    }
  };

  const availableMetrics = Object.keys(metricDefinitions);

  const handleMetricToggle = (metric) => {
    if (metric === 'all') {
      setSelectedMetrics(selectedMetrics.includes('all') ? [] : ['all']);
    } else {
      const newMetrics = selectedMetrics.includes('all') 
        ? [metric] 
        : selectedMetrics.includes(metric)
        ? selectedMetrics.filter(m => m !== metric)
        : [...selectedMetrics, metric];
      
      if (newMetrics.length === 0) {
        setSelectedMetrics(['all']);
      } else {
        setSelectedMetrics(newMetrics);
      }
    }
  };

  const getSortedMetrics = () => {
    const metricsToShow = selectedMetrics.includes('all') 
      ? availableMetrics 
      : availableMetrics.filter(metric => selectedMetrics.includes(metric));
    
    return metricsToShow.sort((a, b) => {
      const aValue = derivedMetrics ? derivedMetrics[a] : 0;
      const bValue = derivedMetrics ? derivedMetrics[b] : 0;
      
      if (sortDirection === 'desc') {
        return bValue - aValue;
      } else {
        return aValue - bValue;
      }
    });
  };

  const getPerformanceRating = () => {
    if (!derivedMetrics) return 'N/A';
    
    const score = (
      (derivedMetrics.totalReturn > 0 ? 1 : 0) +
      (derivedMetrics.winRate > 50 ? 1 : 0) +
      (derivedMetrics.profitFactor > 1 ? 1 : 0) +
      (derivedMetrics.maxDrawdown < 20 ? 1 : 0) +
      (derivedMetrics.sharpeRatio > 1 ? 1 : 0)
    );
    
    if (score >= 4) return 'Excellent';
    if (score >= 3) return 'Good';
    if (score >= 2) return 'Average';
    return 'Poor';
  };

  const getPerformanceColorByRating = (rating) => {
    const colors = {
      'Excellent': '#4caf50',
      'Good': '#8bc34a',
      'Average': '#ff9800',
      'Poor': '#f44336'
    };
    return colors[rating] || '#9e9e9e';
  };

  const performanceRating = getPerformanceRating();

  if (!performanceData || performanceData.length === 0) {
    return (
      <Card className="performance-metrics">
        <CardContent>
          <Box className="empty-state">
            <AssessmentOutlined className="empty-icon" />
            <Typography variant="h6" className="empty-title">
              No Performance Data Available
            </Typography>
            <Typography variant="body2" className="empty-description">
              Run a backtest to see performance metrics
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="performance-metrics">
      <CardContent>
        <Box className="metrics-header">
          <Box className="header-left">
            <Typography variant="h6" className="metrics-title">
              <Assessment className="title-icon" />
              Performance Metrics
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
            <FormControl size="small" className="time-range-select">
              <InputLabel>Time Range</InputLabel>
              <Select
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value)}
                disabled={disabled}
              >
                <MenuItem value="all">All Time</MenuItem>
                <MenuItem value="1m">1 Month</MenuItem>
                <MenuItem value="3m">3 Months</MenuItem>
                <MenuItem value="6m">6 Months</MenuItem>
                <MenuItem value="1y">1 Year</MenuItem>
              </Select>
            </FormControl>
            <Tooltip title="Refresh metrics">
              <span>
                <IconButton
                  size="small"
                  onClick={() => onMetricChange(selectedTimeRange, selectedMetrics)}
                  disabled={disabled}
                  className="refresh-button"
                >
                  <Refresh />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Export metrics">
              <span>
                <IconButton
                  size="small"
                  onClick={() => {
                    // Export functionality would go here
                    console.log('Exporting metrics...');
                  }}
                  disabled={disabled}
                  className="export-button"
                >
                  <Download />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        </Box>

        <Divider className="metrics-divider" />

        {/* Performance Overview */}
        <Box className="performance-overview">
          <Paper className="overview-card">
            <Box className="overview-header">
              <Typography variant="subtitle1" className="overview-title">
                Performance Overview
              </Typography>
              <Badge
                badgeContent={performanceRating}
                color="primary"
                className="performance-badge"
                style={{
                  backgroundColor: getPerformanceColorByRating(performanceRating),
                  color: 'white'
                }}
              />
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Box className="overview-metric">
                  <Typography variant="body2" className="metric-label">
                    Final Portfolio Value
                  </Typography>
                  <Typography variant="h4" className="metric-value">
                    {formatCurrency(derivedMetrics.finalValue)}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box className="overview-metric">
                  <Typography variant="body2" className="metric-label">
                    Total Return
                  </Typography>
                  <Typography variant="h4" className={`metric-value ${derivedMetrics.totalReturn >= 0 ? 'positive' : 'negative'}`}>
                    {formatPercentage(derivedMetrics.totalReturn)}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Box>

        {/* Key Metrics Grid */}
        <Box className="key-metrics">
          <Grid container spacing={2}>
            {getSortedMetrics().map((metric) => {
              const value = derivedMetrics[metric];
              const definition = metricDefinitions[metric];
              
              return (
                <Grid item xs={12} sm={6} md={4} key={metric}>
                  <Paper className="metric-card">
                    <Box className="metric-header">
                      <Box className="metric-icon">
                        {definition.icon}
                      </Box>
                      <Typography variant="subtitle2" className="metric-name">
                        {definition.label}
                      </Typography>
                    </Box>
                    <Typography variant="h5" className={`metric-value ${metric === 'maxDrawdown' || metric === 'volatility' ? value >= 0 ? 'negative' : 'positive' : value >= 0 ? 'positive' : 'negative'}`}>
                      {metric === 'totalTrades' ? value.toFixed(0) : 
                       metric === 'winRate' || metric === 'profitFactor' || metric === 'sharpeRatio' || metric === 'calmarRatio' || metric === 'volatility' ?
                       formatPercentage(value) : formatPercentage(value)}
                    </Typography>
                    <Progress 
                      variant="determinate" 
                      value={Math.min(Math.abs(value), 100)} 
                      className="metric-progress"
                      style={{
                        '--progress-color': definition.color
                      }}
                    />
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        </Box>

        {/* Advanced Metrics Accordion */}
        <Box className="advanced-metrics">
          <Accordion 
            expanded={isExpanded} 
            onChange={() => setIsExpanded(!isExpanded)}
            className="metrics-accordion"
          >
            <AccordionSummary 
              expandIcon={<ExpandMore />}
              className="accordion-summary"
            >
              <Typography variant="subtitle1">
                Advanced Metrics & Analysis
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box className="advanced-content">
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Paper className="analysis-card">
                      <Typography variant="subtitle2" className="analysis-title">
                        Trade Analysis
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
                              <TableCell>Winning Trades</TableCell>
                              <TableCell align="right">{derivedMetrics.winningTrades}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Losing Trades</TableCell>
                              <TableCell align="right">{derivedMetrics.losingTrades}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Average Win</TableCell>
                              <TableCell align="right">{formatCurrency(derivedMetrics.avgWin)}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Average Loss</TableCell>
                              <TableCell align="right">{formatCurrency(derivedMetrics.avgLoss)}</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Paper className="analysis-card">
                      <Typography variant="subtitle2" className="analysis-title">
                        Risk Metrics
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
                              <TableCell>Max Drawdown</TableCell>
                              <TableCell align="right">{formatPercentage(derivedMetrics.maxDrawdown)}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Sharpe Ratio</TableCell>
                              <TableCell align="right">{derivedMetrics.sharpeRatio.toFixed(3)}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Calmar Ratio</TableCell>
                              <TableCell align="right">{derivedMetrics.calmarRatio.toFixed(3)}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Volatility</TableCell>
                              <TableCell align="right">{formatPercentage(derivedMetrics.volatility)}</TableCell>
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
      </CardContent>
    </Card>
  );
};

export default PerformanceMetrics;