import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  LinearProgress,
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
  Badge,
  Tabs,
  Tab,
  CardHeader,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Switch,
  FormControlLabel,
  RadioGroup,
  FormLabel,
  Radio,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  StepButton,
  Collapse,
  AlertTitle,
  Input,
  Checkbox
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
  InsightsOutlined,
  TableChart,
  InsertChart,
  ScatterPlot,
  Timeline as TimelineIcon,
  FilterAlt,
  Sort,
  Search,
  Clear,
  ZoomIn,
  ZoomOut,
  ZoomOutMap,
  ViewColumn,
  ViewAgenda,
  ViewStream,
  ViewWeek,
  ViewDay,
  ViewQuilt,
  Dashboard,
  DashboardCustomize,
  DashboardOutlined,
  DashboardCustomizeOutlined,
  ViewColumnOutlined,
  ViewAgendaOutlined,
  ViewStreamOutlined,
  ViewWeekOutlined,
  ViewDayOutlined,
  ViewQuiltOutlined,
  FilterAltOutlined,
  SortOutlined,
  SearchOutlined,
  ClearOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  ZoomOutMapOutlined,
  TableChartOutlined,
  InsertChartOutlined,
  ScatterPlotOutlined,
  TimelineIconOutlined
} from '@mui/icons-material';
import './TradeAnalysis.css';

const TradeAnalysis = ({ 
  tradeData, 
  signalType = 'long',
  timeRange = 'all',
  onAnalysisChange,
  disabled = false 
}) => {
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange);
  const [selectedView, setSelectedView] = useState('overview');
  const [sortBy, setSortBy] = useState('pnl');
  const [sortDirection, setSortDirection] = useState('desc');
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [chartType, setChartType] = useState('line');
  const [groupBy, setGroupBy] = useState('ticker');
  const [filters, setFilters] = useState({
    minPnl: null,
    maxPnl: null,
    minDuration: null,
    maxDuration: null,
    exitReasons: [],
    tickers: []
  });
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState('csv');

  // Calculate derived metrics
  const calculateTradeMetrics = (data) => {
    if (!data || data.length === 0) return null;

    const totalTrades = data.length;
    const winningTrades = data.filter(trade => trade.pnl > 0).length;
    const losingTrades = data.filter(trade => trade.pnl <= 0).length;
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
    const totalPnl = data.reduce((sum, trade) => sum + trade.pnl, 0);
    const avgPnl = totalTrades > 0 ? totalPnl / totalTrades : 0;
    const avgWin = winningTrades > 0 ? data.filter(trade => trade.pnl > 0).reduce((sum, trade) => sum + trade.pnl, 0) / winningTrades : 0;
    const avgLoss = losingTrades > 0 ? data.filter(trade => trade.pnl <= 0).reduce((sum, trade) => sum + trade.pnl, 0) / losingTrades : 0;
    const profitFactor = Math.abs(avgLoss) > 0 ? Math.abs(avgWin / avgLoss) : 0;
    const avgDuration = data.reduce((sum, trade) => sum + (trade.exit_date - trade.entry_date), 0) / totalTrades;
    const maxWin = Math.max(...data.map(trade => trade.pnl));
    const maxLoss = Math.min(...data.map(trade => trade.pnl));
    const avgPositionSize = data.reduce((sum, trade) => sum + trade.position_size, 0) / totalTrades;

    return {
      totalTrades,
      winningTrades,
      losingTrades,
      winRate,
      totalPnl,
      avgPnl,
      avgWin,
      avgLoss,
      profitFactor,
      avgDuration,
      maxWin,
      maxLoss,
      avgPositionSize
    };
  };

  const tradeMetrics = calculateTradeMetrics(tradeData);

  const getTradeColor = (pnl) => {
    return pnl > 0 ? '#4caf50' : pnl < 0 ? '#f44336' : '#ff9800';
  };

  const getTradeIcon = (pnl) => {
    return pnl > 0 ? <TrendingUp /> : pnl < 0 ? <TrendingDown /> : <Equalizer />;
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDuration = (days) => {
    if (days < 1) return '< 1 day';
    if (days === 1) return '1 day';
    return `${days.toFixed(1)} days`;
  };

  const getSortedTrades = () => {
    if (!tradeData) return [];
    
    let filteredTrades = [...tradeData];
    
    // Apply filters
    if (filters.minPnl !== null) {
      filteredTrades = filteredTrades.filter(trade => trade.pnl >= filters.minPnl);
    }
    if (filters.maxPnl !== null) {
      filteredTrades = filteredTrades.filter(trade => trade.pnl <= filters.maxPnl);
    }
    if (filters.minDuration !== null) {
      filteredTrades = filteredTrades.filter(trade => trade.duration >= filters.minDuration);
    }
    if (filters.maxDuration !== null) {
      filteredTrades = filteredTrades.filter(trade => trade.duration <= filters.maxDuration);
    }
    if (filters.exitReasons.length > 0) {
      filteredTrades = filteredTrades.filter(trade => filters.exitReasons.includes(trade.exit_reason));
    }
    if (filters.tickers.length > 0) {
      filteredTrades = filteredTrades.filter(trade => filters.tickers.includes(trade.ticker));
    }
    
    // Apply sorting
    return filteredTrades.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (sortDirection === 'desc') {
        return bValue - aValue;
      } else {
        return aValue - bValue;
      }
    });
  };

  const getExitReasonDistribution = () => {
    if (!tradeData) return {};
    
    const distribution = {};
    tradeData.forEach(trade => {
      distribution[trade.exit_reason] = (distribution[trade.exit_reason] || 0) + 1;
    });
    
    return distribution;
  };

  const getTickerPerformance = () => {
    if (!tradeData) return {};
    
    const performance = {};
    tradeData.forEach(trade => {
      if (!performance[trade.ticker]) {
        performance[trade.ticker] = {
          totalTrades: 0,
          winningTrades: 0,
          totalPnl: 0,
          avgPnl: 0,
          bestTrade: 0,
          worstTrade: 0
        };
      }
      
      performance[trade.ticker].totalTrades++;
      performance[trade.ticker].totalPnl += trade.pnl;
      if (trade.pnl > 0) {
        performance[trade.ticker].winningTrades++;
      }
      performance[trade.ticker].bestTrade = Math.max(performance[trade.ticker].bestTrade, trade.pnl);
      performance[trade.ticker].worstTrade = Math.min(performance[trade.ticker].worstTrade, trade.pnl);
    });
    
    Object.keys(performance).forEach(ticker => {
      const data = performance[ticker];
      data.avgPnl = data.totalTrades > 0 ? data.totalPnl / data.totalTrades : 0;
      data.winRate = data.totalTrades > 0 ? (data.winningTrades / data.totalTrades) * 100 : 0;
    });
    
    return performance;
  };

  const handleTradeClick = (trade) => {
    setSelectedTrade(trade);
    setShowDetails(true);
  };

  const handleExport = () => {
    const trades = getSortedTrades();
    const headers = ['Ticker', 'Entry Date', 'Exit Date', 'Entry Price', 'Exit Price', 'P&L', 'P&L %', 'Duration', 'Exit Reason', 'Position Size'];
    
    let content = headers.join(',') + '\n';
    trades.forEach(trade => {
      content += [
        trade.ticker,
        trade.entry_date,
        trade.exit_date,
        trade.entry_price,
        trade.exit_price,
        trade.pnl,
        trade.pnl_pct,
        trade.duration,
        trade.exit_reason,
        trade.position_size
      ].join(',') + '\n';
    });
    
    const blob = new Blob([content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trade_analysis_${signalType}_${new Date().toISOString().split('T')[0]}.${exportFormat}`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleApplyFilters = () => {
    setIsFilterDialogOpen(false);
    onAnalysisChange(selectedTimeRange, filters);
  };

  const handleClearFilters = () => {
    setFilters({
      minPnl: null,
      maxPnl: null,
      minDuration: null,
      maxDuration: null,
      exitReasons: [],
      tickers: []
    });
    setIsFilterDialogOpen(false);
    onAnalysisChange(selectedTimeRange, {});
  };

  const viewOptions = [
    { value: 'overview', label: 'Overview', icon: <Dashboard /> },
    { value: 'trades', label: 'Trade Log', icon: <TableChart /> },
    { value: 'performance', label: 'Performance', icon: <InsertChart /> },
    { value: 'distribution', label: 'Distribution', icon: <PieChart /> },
    { value: 'comparison', label: 'Comparison', icon: <BarChart /> }
  ];

  const chartTypes = [
    { value: 'line', label: 'Line Chart', icon: <ShowChart /> },
    { value: 'bar', label: 'Bar Chart', icon: <BarChart /> },
    { value: 'area', label: 'Area Chart', icon: <ShowChart /> },
    { value: 'scatter', label: 'Scatter Plot', icon: <ScatterPlot /> }
  ];

  const groupByOptions = [
    { value: 'ticker', label: 'By Ticker' },
    { value: 'exit_reason', label: 'By Exit Reason' },
    { value: 'month', label: 'By Month' },
    { value: 'quarter', label: 'By Quarter' }
  ];

  if (!tradeData || tradeData.length === 0) {
    return (
      <Card className="trade-analysis">
        <CardContent>
          <Box className="empty-state">
            <AssessmentOutlined className="empty-icon" />
            <Typography variant="h6" className="empty-title">
              No Trade Data Available
            </Typography>
            <Typography variant="body2" className="empty-description">
              Run a backtest to see trade analysis
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="trade-analysis">
      <CardContent>
        <Box className="analysis-header">
          <Box className="header-left">
            <Typography variant="h6" className="analysis-title">
              <Assessment className="title-icon" />
              Trade Analysis
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
            <Tooltip title="Apply filters">
              <span>
                <IconButton
                  size="small"
                  onClick={() => setIsFilterDialogOpen(true)}
                  disabled={disabled}
                  className="filter-button"
                >
                  <FilterList />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Export data">
              <span>
                <IconButton
                  size="small"
                  onClick={handleExport}
                  disabled={disabled}
                  className="export-button"
                >
                  <Download />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Refresh analysis">
              <span>
                <IconButton
                  size="small"
                  onClick={() => onAnalysisChange(selectedTimeRange, filters)}
                  disabled={disabled}
                  className="refresh-button"
                >
                  <Refresh />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        </Box>

        <Divider className="analysis-divider" />

        {/* View Tabs */}
        <Box className="view-tabs">
          <Tabs
            value={selectedView}
            onChange={(e, newValue) => setSelectedView(newValue)}
            variant="fullWidth"
            className="view-tabs-container"
          >
            {viewOptions.map((option) => (
              <Tab
                key={option.value}
                value={option.value}
                label={
                  <Box className="tab-label">
                    {option.icon}
                    <span>{option.label}</span>
                  </Box>
                }
                iconPosition="start"
                className="view-tab"
              />
            ))}
          </Tabs>
        </Box>

        {/* Overview View */}
        {selectedView === 'overview' && (
          <Box className="overview-view">
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <Paper className="metric-card">
                  <Box className="metric-header">
                    <Typography variant="subtitle2" className="metric-title">
                      Total Trades
                    </Typography>
                    <Assessment className="metric-icon" />
                  </Box>
                  <Typography variant="h4" className="metric-value">
                    {tradeMetrics.totalTrades}
                  </Typography>
                  <LinearProgress variant="determinate" value={100} className="metric-progress" />
                </Paper>
              </Grid>
              <Grid item xs={12} md={3}>
                <Paper className="metric-card">
                  <Box className="metric-header">
                    <Typography variant="subtitle2" className="metric-title">
                      Win Rate
                    </Typography>
                    <PieChart className="metric-icon" />
                  </Box>
                  <Typography variant="h4" className={`metric-value ${tradeMetrics.winRate >= 50 ? 'positive' : 'negative'}`}>
                    {formatPercentage(tradeMetrics.winRate)}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={tradeMetrics.winRate}
                    className="metric-progress"
                    style={{ '--progress-color': '#ff9800' }}
                  />
                </Paper>
              </Grid>
              <Grid item xs={12} md={3}>
                <Paper className="metric-card">
                  <Box className="metric-header">
                    <Typography variant="subtitle2" className="metric-title">
                      Total P&L
                    </Typography>
                    <MonetizationOn className="metric-icon" />
                  </Box>
                  <Typography variant="h4" className={`metric-value ${tradeMetrics.totalPnl >= 0 ? 'positive' : 'negative'}`}>
                    {formatCurrency(tradeMetrics.totalPnl)}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(Math.abs(tradeMetrics.totalPnl) / 10000 * 100, 100)}
                    className="metric-progress"
                    style={{ '--progress-color': tradeMetrics.totalPnl >= 0 ? '#4caf50' : '#f44336' }}
                  />
                </Paper>
              </Grid>
              <Grid item xs={12} md={3}>
                <Paper className="metric-card">
                  <Box className="metric-header">
                    <Typography variant="subtitle2" className="metric-title">
                      Profit Factor
                    </Typography>
                    <BarChart className="metric-icon" />
                  </Box>
                  <Typography variant="h4" className={`metric-value ${tradeMetrics.profitFactor >= 1 ? 'positive' : 'negative'}`}>
                    {tradeMetrics.profitFactor.toFixed(2)}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(tradeMetrics.profitFactor * 20, 100)}
                    className="metric-progress"
                    style={{ '--progress-color': '#9c27b0' }}
                  />
                </Paper>
              </Grid>
            </Grid>

            {/* Quick Stats */}
            <Box className="quick-stats">
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Paper className="stats-card">
                    <Typography variant="subtitle2" className="stats-title">
                      Trade Statistics
                    </Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableBody>
                          <TableRow>
                            <TableCell>Winning Trades</TableCell>
                            <TableCell align="right" className="positive">
                              {tradeMetrics.winningTrades}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Losing Trades</TableCell>
                            <TableCell align="right" className="negative">
                              {tradeMetrics.losingTrades}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Average Win</TableCell>
                            <TableCell align="right" className="positive">
                              {formatCurrency(tradeMetrics.avgWin)}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Average Loss</TableCell>
                            <TableCell align="right" className="negative">
                              {formatCurrency(tradeMetrics.avgLoss)}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Avg Duration</TableCell>
                            <TableCell align="right">
                              {formatDuration(tradeMetrics.avgDuration)}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper className="stats-card">
                    <Typography variant="subtitle2" className="stats-title">
                      Performance Extremes
                    </Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableBody>
                          <TableRow>
                            <TableCell>Best Trade</TableCell>
                            <TableCell align="right" className="positive">
                              {formatCurrency(tradeMetrics.maxWin)}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Worst Trade</TableCell>
                            <TableCell align="right" className="negative">
                              {formatCurrency(tradeMetrics.maxLoss)}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Avg Position Size</TableCell>
                            <TableCell align="right">
                              {formatCurrency(tradeMetrics.avgPositionSize)}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Total Capital</TableCell>
                            <TableCell align="right">
                              {formatCurrency(tradeMetrics.avgPositionSize * tradeMetrics.totalTrades)}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          </Box>
        )}

        {/* Trade Log View */}
        {selectedView === 'trades' && (
          <Box className="trades-view">
            <Paper className="trades-table-container">
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Ticker</TableCell>
                      <TableCell>Entry Date</TableCell>
                      <TableCell>Exit Date</TableCell>
                      <TableCell>Entry Price</TableCell>
                      <TableCell>Exit Price</TableCell>
                      <TableCell>P&L</TableCell>
                      <TableCell>P&L %</TableCell>
                      <TableCell>Duration</TableCell>
                      <TableCell>Exit Reason</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {getSortedTrades().map((trade, index) => (
                      <TableRow 
                        key={index} 
                        hover
                        className="trade-row"
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleTradeClick(trade)}
                      >
                        <TableCell>
                          <Chip
                            label={trade.ticker}
                            size="small"
                            className="ticker-chip"
                          />
                        </TableCell>
                        <TableCell>{formatDate(trade.entry_date)}</TableCell>
                        <TableCell>{formatDate(trade.exit_date)}</TableCell>
                        <TableCell>{trade.entry_price.toFixed(2)}</TableCell>
                        <TableCell>{trade.exit_price.toFixed(2)}</TableCell>
                        <TableCell className={trade.pnl >= 0 ? 'positive' : 'negative'}>
                          {formatCurrency(trade.pnl)}
                        </TableCell>
                        <TableCell className={trade.pnl_pct >= 0 ? 'positive' : 'negative'}>
                          {formatPercentage(trade.pnl_pct)}
                        </TableCell>
                        <TableCell>{formatDuration(trade.duration)}</TableCell>
                        <TableCell>
                          <Chip
                            label={trade.exit_reason}
                            size="small"
                            className="exit-reason-chip"
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleTradeClick(trade); }}>
                            <Info />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Box>
        )}

        {/* Performance View */}
        {selectedView === 'performance' && (
          <Box className="performance-view">
            <Grid container spacing={2}>
              <Grid item xs={12} md={8}>
                <Paper className="chart-container">
                  <Box className="chart-header">
                    <Typography variant="subtitle1" className="chart-title">
                      Performance Over Time
                    </Typography>
                    <Box className="chart-controls">
                      <FormControl size="small" className="chart-type-select">
                        <InputLabel>Chart Type</InputLabel>
                        <Select
                          value={chartType}
                          onChange={(e) => setChartType(e.target.value)}
                          disabled={disabled}
                        >
                          {chartTypes.map((type) => (
                            <MenuItem key={type.value} value={type.value}>
                              <Box className="chart-type-option">
                                {type.icon}
                                <span>{type.label}</span>
                              </Box>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <FormControl size="small" className="group-by-select">
                        <InputLabel>Group By</InputLabel>
                        <Select
                          value={groupBy}
                          onChange={(e) => setGroupBy(e.target.value)}
                          disabled={disabled}
                        >
                          {groupByOptions.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                              {option.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>
                  </Box>
                  <Box className="chart-placeholder">
                    <ShowChart className="placeholder-icon" />
                    <Typography variant="body2" className="placeholder-text">
                      Interactive {chartTypes.find(t => t.value === chartType)?.label} would be displayed here
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper className="performance-stats">
                  <Typography variant="subtitle1" className="stats-title">
                    Performance Summary
                  </Typography>
                  <Box className="stats-list">
                    <Box className="stat-item">
                      <Typography variant="body2" className="stat-label">
                        Total Return
                      </Typography>
                      <Typography variant="h6" className={`stat-value ${tradeMetrics.totalPnl >= 0 ? 'positive' : 'negative'}`}>
                        {formatPercentage((tradeMetrics.totalPnl / (tradeMetrics.avgPositionSize * tradeMetrics.totalTrades)) * 100)}
                      </Typography>
                    </Box>
                    <Box className="stat-item">
                      <Typography variant="body2" className="stat-label">
                        Sharpe Ratio
                      </Typography>
                      <Typography variant="h6" className="stat-value">
                        {((tradeMetrics.avgPnl / Math.abs(tradeMetrics.avgLoss)) * Math.sqrt(252)).toFixed(2)}
                      </Typography>
                    </Box>
                    <Box className="stat-item">
                      <Typography variant="body2" className="stat-label">
                        Max Consecutive Wins
                      </Typography>
                      <Typography variant="h6" className="stat-value positive">
                        {calculateMaxConsecutiveWins(tradeData)}
                      </Typography>
                    </Box>
                    <Box className="stat-item">
                      <Typography variant="body2" className="stat-label">
                        Max Consecutive Losses
                      </Typography>
                      <Typography variant="h6" className="stat-value negative">
                        {calculateMaxConsecutiveLosses(tradeData)}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Distribution View */}
        {selectedView === 'distribution' && (
          <Box className="distribution-view">
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Paper className="distribution-card">
                  <Typography variant="subtitle1" className="distribution-title">
                    Exit Reason Distribution
                  </Typography>
                  <Box className="distribution-placeholder">
                    <PieChart className="placeholder-icon" />
                    <Typography variant="body2" className="placeholder-text">
                      Pie chart showing exit reason distribution
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper className="distribution-card">
                  <Typography variant="subtitle1" className="distribution-title">
                    P&L Distribution
                  </Typography>
                  <Box className="distribution-placeholder">
                    <BarChart className="placeholder-icon" />
                    <Typography variant="body2" className="placeholder-text">
                      Histogram showing P&L distribution
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Comparison View */}
        {selectedView === 'comparison' && (
          <Box className="comparison-view">
            <Paper className="comparison-table">
              <Typography variant="subtitle1" className="comparison-title">
                Ticker Performance Comparison
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Ticker</TableCell>
                      <TableCell align="right">Total Trades</TableCell>
                      <TableCell align="right">Win Rate</TableCell>
                      <TableCell align="right">Total P&L</TableCell>
                      <TableCell align="right">Avg P&L</TableCell>
                      <TableCell align="right">Best Trade</TableCell>
                      <TableCell align="right">Worst Trade</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(getTickerPerformance()).map(([ticker, data]) => (
                      <TableRow key={ticker} hover>
                        <TableCell>
                          <Chip
                            label={ticker}
                            size="small"
                            className="ticker-chip"
                          />
                        </TableCell>
                        <TableCell align="right">{data.totalTrades}</TableCell>
                        <TableCell align="right" className={data.winRate >= 50 ? 'positive' : 'negative'}>
                          {formatPercentage(data.winRate)}
                        </TableCell>
                        <TableCell align="right" className={data.totalPnl >= 0 ? 'positive' : 'negative'}>
                          {formatCurrency(data.totalPnl)}
                        </TableCell>
                        <TableCell align="right" className={data.avgPnl >= 0 ? 'positive' : 'negative'}>
                          {formatCurrency(data.avgPnl)}
                        </TableCell>
                        <TableCell align="right" className="positive">
                          {formatCurrency(data.bestTrade || 0)}
                        </TableCell>
                        <TableCell align="right" className="negative">
                          {formatCurrency(data.worstTrade || 0)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Box>
        )}

        {/* Trade Details Dialog */}
        <Dialog
          open={showDetails}
          onClose={() => setShowDetails(false)}
          maxWidth="md"
          fullWidth
          className="trade-details-dialog"
        >
          <DialogTitle className="dialog-title">
            <Assessment className="dialog-icon" />
            Trade Details
          </DialogTitle>
          <DialogContent>
            {selectedTrade && (
              <Box className="trade-details-content">
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Paper className="detail-card">
                      <Typography variant="subtitle2" className="detail-title">
                        Basic Information
                      </Typography>
                      <TableContainer size="small">
                        <Table>
                          <TableBody>
                            <TableRow>
                              <TableCell>Ticker</TableCell>
                              <TableCell align="right">{selectedTrade.ticker}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Signal Type</TableCell>
                              <TableCell align="right">{signalType.toUpperCase()}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Entry Date</TableCell>
                              <TableCell align="right">{formatDate(selectedTrade.entry_date)}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Exit Date</TableCell>
                              <TableCell align="right">{formatDate(selectedTrade.exit_date)}</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Paper className="detail-card">
                      <Typography variant="subtitle2" className="detail-title">
                        Performance Metrics
                      </Typography>
                      <TableContainer size="small">
                        <Table>
                          <TableBody>
                            <TableRow>
                              <TableCell>Entry Price</TableCell>
                              <TableCell align="right">{selectedTrade.entry_price.toFixed(2)}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Exit Price</TableCell>
                              <TableCell align="right">{selectedTrade.exit_price.toFixed(2)}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>P&L</TableCell>
                              <TableCell align="right" className={selectedTrade.pnl >= 0 ? 'positive' : 'negative'}>
                                {formatCurrency(selectedTrade.pnl)}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>P&L %</TableCell>
                              <TableCell align="right" className={selectedTrade.pnl_pct >= 0 ? 'positive' : 'negative'}>
                                {formatPercentage(selectedTrade.pnl_pct)}
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Paper>
                  </Grid>
                  <Grid item xs={12}>
                    <Paper className="detail-card">
                      <Typography variant="subtitle2" className="detail-title">
                        Additional Details
                      </Typography>
                      <TableContainer size="small">
                        <Table>
                          <TableBody>
                            <TableRow>
                              <TableCell>Duration</TableCell>
                              <TableCell align="right">{formatDuration(selectedTrade.duration)}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Exit Reason</TableCell>
                              <TableCell align="right">{selectedTrade.exit_reason}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Position Size</TableCell>
                              <TableCell align="right">{formatCurrency(selectedTrade.position_size)}</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowDetails(false)} variant="outlined">
              Close
            </Button>
            <Button onClick={() => { setShowDetails(false); handleExport(); }} variant="contained" className="export-button">
              Export Trade
            </Button>
          </DialogActions>
        </Dialog>

        {/* Filter Dialog */}
        <Dialog
          open={isFilterDialogOpen}
          onClose={() => setIsFilterDialogOpen(false)}
          maxWidth="md"
          fullWidth
          className="filter-dialog"
        >
          <DialogTitle className="dialog-title">
            <FilterList className="dialog-icon" />
            Filter Trades
          </DialogTitle>
          <DialogContent>
            <Box className="filter-content">
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Paper className="filter-card">
                    <Typography variant="subtitle2" className="filter-title">
                      P&L Range
                    </Typography>
                    <Box className="filter-range">
                      <FormControl fullWidth size="small" className="filter-input">
                        <InputLabel>Min P&L</InputLabel>
                        <Input
                          type="number"
                          value={filters.minPnl || ''}
                          onChange={(e) => setFilters({...filters, minPnl: e.target.value ? parseFloat(e.target.value) : null})}
                        />
                      </FormControl>
                      <FormControl fullWidth size="small" className="filter-input">
                        <InputLabel>Max P&L</InputLabel>
                        <Input
                          type="number"
                          value={filters.maxPnl || ''}
                          onChange={(e) => setFilters({...filters, maxPnl: e.target.value ? parseFloat(e.target.value) : null})}
                        />
                      </FormControl>
                    </Box>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper className="filter-card">
                    <Typography variant="subtitle2" className="filter-title">
                      Duration Range
                    </Typography>
                    <Box className="filter-range">
                      <FormControl fullWidth size="small" className="filter-input">
                        <InputLabel>Min Duration (days)</InputLabel>
                        <Input
                          type="number"
                          value={filters.minDuration || ''}
                          onChange={(e) => setFilters({...filters, minDuration: e.target.value ? parseFloat(e.target.value) : null})}
                        />
                      </FormControl>
                      <FormControl fullWidth size="small" className="filter-input">
                        <InputLabel>Max Duration (days)</InputLabel>
                        <Input
                          type="number"
                          value={filters.maxDuration || ''}
                          onChange={(e) => setFilters({...filters, maxDuration: e.target.value ? parseFloat(e.target.value) : null})}
                        />
                      </FormControl>
                    </Box>
                  </Paper>
                </Grid>
                <Grid item xs={12}>
                  <Paper className="filter-card">
                    <Typography variant="subtitle2" className="filter-title">
                      Exit Reasons
                    </Typography>
                    <Box className="filter-checkboxes">
                      {Array.from(new Set(tradeData.map(trade => trade.exit_reason))).map(reason => (
                        <FormControlLabel
                          key={reason}
                          control={
                            <Checkbox
                              checked={filters.exitReasons.includes(reason)}
                              onChange={(e) => {
                                const newReasons = e.target.checked
                                  ? [...filters.exitReasons, reason]
                                  : filters.exitReasons.filter(r => r !== reason);
                                setFilters({...filters, exitReasons: newReasons});
                              }}
                            />
                          }
                          label={reason}
                        />
                      ))}
                    </Box>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClearFilters} variant="outlined">
              Clear Filters
            </Button>
            <Button onClick={() => setIsFilterDialogOpen(false)} variant="outlined">
              Cancel
            </Button>
            <Button onClick={handleApplyFilters} variant="contained" className="apply-button">
              Apply Filters
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};

// Helper functions
const calculateMaxConsecutiveWins = (trades) => {
  if (!trades || trades.length === 0) return 0;
  
  let maxConsecutive = 0;
  let currentConsecutive = 0;
  
  trades.forEach(trade => {
    if (trade.pnl > 0) {
      currentConsecutive++;
      maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
    } else {
      currentConsecutive = 0;
    }
  });
  
  return maxConsecutive;
};

const calculateMaxConsecutiveLosses = (trades) => {
  if (!trades || trades.length === 0) return 0;
  
  let maxConsecutive = 0;
  let currentConsecutive = 0;
  
  trades.forEach(trade => {
    if (trade.pnl <= 0) {
      currentConsecutive++;
      maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
    } else {
      currentConsecutive = 0;
    }
  });
  
  return maxConsecutive;
};

export default TradeAnalysis;