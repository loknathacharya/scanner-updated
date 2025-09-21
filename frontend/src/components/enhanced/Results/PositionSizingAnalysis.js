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
  Slider,
  Input,
  AlertTitle
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
  TimelineIconOutlined,
  AccountBalance,
  AccountBalanceOutlined,
  Money,
  MoneyOff,
  TrendingFlat,
  Scale,
  ScaleOutlined,
  PieChart as PieChartIcon,
  PieChartIconOutlined,
  BarChart as BarChartIcon,
  BarChartIconOutlined,
  LineChart,
  LineChartOutlined,
  AreaChart,
  AreaChartOutlined,
  DonutLarge,
  DonutLargeOutlined,
  PieChart as PieChartSolid,
  PieChartSolidOutlined,
  BarChart as BarChartSolid,
  BarChartSolidOutlined,
  LineChart as LineChartSolid,
  LineChartSolidOutlined,
  AreaChart as AreaChartSolid,
  AreaChartSolidOutlined
} from '@mui/icons-material';
import Plot from 'react-plotly.js';
import './PositionSizingAnalysis.css';

const PositionSizingAnalysis = ({ 
  positionData, 
  tradeData,
  signalType = 'long',
  timeRange = 'all',
  onAnalysisChange,
  disabled = false 
}) => {
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange);
  const [selectedView, setSelectedView] = useState('overview');
  const [sortBy, setSortBy] = useState('position_size');
  const [sortDirection, setSortDirection] = useState('desc');
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [chartType, setChartType] = useState('histogram');
  const [groupBy, setGroupBy] = useState('ticker');
  const [filters, setFilters] = useState({
    minSize: null,
    maxSize: null,
    minReturn: null,
    maxReturn: null,
    tickers: [],
    methods: []
  });
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState('csv');
  const [riskLevel, setRiskLevel] = useState('medium');
  const [showAdvancedMetrics, setShowAdvancedMetrics] = useState(false);

  // Calculate derived metrics
  const calculatePositionMetrics = (data) => {
    if (!data || data.length === 0) return null;

    const totalPositions = data.length;
    const totalCapital = data.reduce((sum, pos) => sum + pos.position_size, 0);
    const avgPositionSize = totalCapital / totalPositions;
    const minPositionSize = Math.min(...data.map(pos => pos.position_size));
    const maxPositionSize = Math.max(...data.map(pos => pos.position_size));
    
    // Calculate position size distribution
    const sizeRanges = {
      'micro': data.filter(pos => pos.position_size <= 1000).length,
      'small': data.filter(pos => pos.position_size > 1000 && pos.position_size <= 5000).length,
      'medium': data.filter(pos => pos.position_size > 5000 && pos.position_size <= 20000).length,
      'large': data.filter(pos => pos.position_size > 20000 && pos.position_size <= 50000).length,
      'xlarge': data.filter(pos => pos.position_size > 50000).length
    };

    // Calculate method effectiveness
    const methodStats = {};
    data.forEach(pos => {
      if (!methodStats[pos.method]) {
        methodStats[pos.method] = {
          count: 0,
          totalSize: 0,
          avgReturn: 0,
          totalReturn: 0
        };
      }
      methodStats[pos.method].count++;
      methodStats[pos.method].totalSize += pos.position_size;
    });

    // Calculate returns by position size
    const returnBySize = {
      'micro': [],
      'small': [],
      'medium': [],
      'large': [],
      'xlarge': []
    };

    data.forEach(pos => {
      let sizeCategory;
      if (pos.position_size <= 1000) sizeCategory = 'micro';
      else if (pos.position_size <= 5000) sizeCategory = 'small';
      else if (pos.position_size <= 20000) sizeCategory = 'medium';
      else if (pos.position_size <= 50000) sizeCategory = 'large';
      else sizeCategory = 'xlarge';
      
      returnBySize[sizeCategory].push(pos.return_pct || 0);
    });

    // Calculate average returns by size category
    Object.keys(returnBySize).forEach(category => {
      const returns = returnBySize[category];
      returnBySize[category] = returns.length > 0 
        ? returns.reduce((sum, ret) => sum + ret, 0) / returns.length 
        : 0;
    });

    return {
      totalPositions,
      totalCapital,
      avgPositionSize,
      minPositionSize,
      maxPositionSize,
      sizeRanges,
      methodStats,
      returnBySize,
      concentrationRisk: calculateConcentrationRisk(data),
      diversificationScore: calculateDiversificationScore(data)
    };
  };

  const calculateConcentrationRisk = (data) => {
    if (!data || data.length === 0) return 0;
    
    const totalCapital = data.reduce((sum, pos) => sum + pos.position_size, 0);
    const concentrationRatios = data.map(pos => pos.position_size / totalCapital);
    
    // Calculate Herfindahl-Hirschman Index
    const hhi = concentrationRatios.reduce((sum, ratio) => sum + Math.pow(ratio, 2), 0);
    
    // Convert to percentage scale (0-100)
    return Math.round(hhi * 100);
  };

  const calculateDiversificationScore = (data) => {
    if (!data || data.length === 0) return 0;
    
    const uniqueTickers = new Set(data.map(pos => pos.ticker)).size;
    const totalPositions = data.length;
    
    // Score based on number of unique tickers vs total positions
    const idealDiversification = Math.min(totalPositions * 0.3, 20); // Ideal is 30% unique or max 20
    const actualDiversification = Math.min(uniqueTickers, 20);
    
    return Math.round((actualDiversification / idealDiversification) * 100);
  };

  const positionMetrics = calculatePositionMetrics(positionData);

  const getPositionColor = (size) => {
    if (size <= 1000) return '#4caf50';
    if (size <= 5000) return '#8bc34a';
    if (size <= 20000) return '#ff9800';
    if (size <= 50000) return '#ff5722';
    return '#f44336';
  };

  const getPositionIcon = (size) => {
    if (size <= 1000) return <Money />;
    if (size <= 50000) return <MonetizationOn />;
    return <AccountBalance />;
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

  const getSortedPositions = () => {
    if (!positionData) return [];
    
    let filteredPositions = [...positionData];
    
    // Apply filters
    if (filters.minSize !== null) {
      filteredPositions = filteredPositions.filter(pos => pos.position_size >= filters.minSize);
    }
    if (filters.maxSize !== null) {
      filteredPositions = filteredPositions.filter(pos => pos.position_size <= filters.maxSize);
    }
    if (filters.minReturn !== null) {
      filteredPositions = filteredPositions.filter(pos => (pos.return_pct || 0) >= filters.minReturn);
    }
    if (filters.maxReturn !== null) {
      filteredPositions = filteredPositions.filter(pos => (pos.return_pct || 0) <= filters.maxReturn);
    }
    if (filters.tickers.length > 0) {
      filteredPositions = filteredPositions.filter(pos => filters.tickers.includes(pos.ticker));
    }
    if (filters.methods.length > 0) {
      filteredPositions = filteredPositions.filter(pos => filters.methods.includes(pos.method));
    }
    
    // Apply sorting
    return filteredPositions.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (sortDirection === 'desc') {
        return bValue - aValue;
      } else {
        return aValue - bValue;
      }
    });
  };

  const handlePositionClick = (position) => {
    setSelectedPosition(position);
    setShowDetails(true);
  };

  const handleExport = () => {
    const positions = getSortedPositions();
    const headers = ['Ticker', 'Position Size', 'Return %', 'Method', 'Entry Date', 'Exit Date', 'Duration'];
    
    let content = headers.join(',') + '\n';
    positions.forEach(pos => {
      content += [
        pos.ticker,
        pos.position_size,
        pos.return_pct || 0,
        pos.method,
        pos.entry_date,
        pos.exit_date,
        pos.duration
      ].join(',') + '\n';
    });
    
    const blob = new Blob([content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `position_analysis_${signalType}_${new Date().toISOString().split('T')[0]}.${exportFormat}`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleApplyFilters = () => {
    setIsFilterDialogOpen(false);
    onAnalysisChange(selectedTimeRange, filters);
  };

  const handleClearFilters = () => {
    setFilters({
      minSize: null,
      maxSize: null,
      minReturn: null,
      maxReturn: null,
      tickers: [],
      methods: []
    });
    setIsFilterDialogOpen(false);
    onAnalysisChange(selectedTimeRange, {});
  };

  const viewOptions = [
    { value: 'overview', label: 'Overview', icon: <Dashboard /> },
    { value: 'distribution', label: 'Distribution', icon: <PieChart /> },
    { value: 'performance', label: 'Performance', icon: <InsertChart /> },
    { value: 'comparison', label: 'Comparison', icon: <BarChart /> },
    { value: 'methods', label: 'Methods', icon: <Analytics /> }
  ];

  const chartTypes = [
    { value: 'histogram', label: 'Histogram', icon: <BarChart /> },
    { value: 'scatter', label: 'Scatter Plot', icon: <ScatterPlot /> },
    { value: 'box', label: 'Box Plot', icon: <BarChart /> },
    { value: 'violin', label: 'Violin Plot', icon: <ShowChart /> }
  ];

  const groupByOptions = [
    { value: 'ticker', label: 'By Ticker' },
    { value: 'method', label: 'By Method' },
    { value: 'size_category', label: 'By Size Category' },
    { value: 'return', label: 'By Return' }
  ];

  const riskLevels = [
    { value: 'low', label: 'Low Risk', color: '#4caf50' },
    { value: 'medium', label: 'Medium Risk', color: '#ff9800' },
    { value: 'high', label: 'High Risk', color: '#f44336' }
  ];

  // Generate chart data for Plotly
  const generateChartData = () => {
    if (!positionData) return [];

    const positions = getSortedPositions();
    
    switch (chartType) {
      case 'histogram':
        return [{
          x: positions.map(pos => pos.position_size),
          type: 'histogram',
          name: 'Position Size Distribution',
          marker: { color: '#1f77b4' }
        }];
      
      case 'scatter':
        return [{
          x: positions.map(pos => pos.position_size),
          y: positions.map(pos => pos.return_pct || 0),
          type: 'scatter',
          mode: 'markers',
          name: 'Size vs Return',
          marker: { 
            color: positions.map(pos => getPositionColor(pos.position_size)),
            size: 8,
            opacity: 0.7
          }
        }];
      
      case 'box':
        return [{
          y: positions.map(pos => pos.position_size),
          type: 'box',
          name: 'Position Size Box Plot',
          marker: { color: '#1f77b4' }
        }];
      
      default:
        return [];
    }
  };

  const chartLayout = {
    title: '',
    xaxis: { title: 'Position Size ($)' },
    yaxis: { title: 'Return (%)' },
    paper_bgcolor: '#2a2a2a',
    plot_bgcolor: '#2a2a2a',
    font: { color: '#e0e0e0' },
    margin: { t: 20, r: 20, b: 40, l: 60 }
  };

  if (!positionData || positionData.length === 0) {
    return (
      <Card className="position-sizing-analysis">
        <CardContent>
          <Box className="empty-state">
            <AssessmentOutlined className="empty-icon" />
            <Typography variant="h6" className="empty-title">
              No Position Sizing Data Available
            </Typography>
            <Typography variant="body2" className="empty-description">
              Run a backtest to see position sizing analysis
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="position-sizing-analysis">
      <CardContent>
        <Box className="analysis-header">
          <Box className="header-left">
            <Typography variant="h6" className="analysis-title">
              <Assessment className="title-icon" />
              Position Sizing Analysis
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
            <FormControl size="small" className="risk-level-select">
              <InputLabel>Risk Level</InputLabel>
              <Select
                value={riskLevel}
                onChange={(e) => setRiskLevel(e.target.value)}
                disabled={disabled}
              >
                {riskLevels.map(level => (
                  <MenuItem key={level.value} value={level.value}>
                    <Box component="span" sx={{ mr: 1, color: level.color }}>
                      {level.label}
                    </Box>
                  </MenuItem>
                ))}
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
                      Total Positions
                    </Typography>
                    <Assessment className="metric-icon" />
                  </Box>
                  <Typography variant="h4" className="metric-value">
                    {positionMetrics.totalPositions}
                  </Typography>
                  <LinearProgress variant="determinate" value={100} className="metric-progress" />
                </Paper>
              </Grid>
              <Grid item xs={12} md={3}>
                <Paper className="metric-card">
                  <Box className="metric-header">
                    <Typography variant="subtitle2" className="metric-title">
                      Total Capital
                    </Typography>
                    <MonetizationOn className="metric-icon" />
                  </Box>
                  <Typography variant="h4" className="metric-value">
                    {formatCurrency(positionMetrics.totalCapital)}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(positionMetrics.totalCapital / 1000000 * 100, 100)}
                    className="metric-progress"
                    style={{ '--progress-color': '#4caf50' }}
                  />
                </Paper>
              </Grid>
              <Grid item xs={12} md={3}>
                <Paper className="metric-card">
                  <Box className="metric-header">
                    <Typography variant="subtitle2" className="metric-title">
                      Avg Position Size
                    </Typography>
                    <AccountBalance className="metric-icon" />
                  </Box>
                  <Typography variant="h4" className="metric-value">
                    {formatCurrency(positionMetrics.avgPositionSize)}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(positionMetrics.avgPositionSize / 50000 * 100, 100)}
                    className="metric-progress"
                    style={{ '--progress-color': '#2196f3' }}
                  />
                </Paper>
              </Grid>
              <Grid item xs={12} md={3}>
                <Paper className="metric-card">
                  <Box className="metric-header">
                    <Typography variant="subtitle2" className="metric-title">
                      Diversification Score
                    </Typography>
                    <Equalizer className="metric-icon" />
                  </Box>
                  <Typography variant="h4" className={`metric-value ${positionMetrics.diversificationScore >= 70 ? 'positive' : positionMetrics.diversificationScore >= 40 ? 'neutral' : 'negative'}`}>
                    {positionMetrics.diversificationScore}%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={positionMetrics.diversificationScore}
                    className="metric-progress"
                    style={{ '--progress-color': positionMetrics.diversificationScore >= 70 ? '#4caf50' : positionMetrics.diversificationScore >= 40 ? '#ff9800' : '#f44336' }}
                  />
                </Paper>
              </Grid>
            </Grid>

            {/* Size Distribution */}
            <Box className="size-distribution">
              <Paper className="distribution-card">
                <Box className="distribution-header">
                  <Typography variant="subtitle1" className="distribution-title">
                    Position Size Distribution
                  </Typography>
                  <Button
                    size="small"
                    onClick={() => setShowAdvancedMetrics(!showAdvancedMetrics)}
                    className="toggle-button"
                  >
                    {showAdvancedMetrics ? 'Hide' : 'Show'} Advanced
                  </Button>
                </Box>
                <Grid container spacing={2}>
                  {Object.entries(positionMetrics.sizeRanges).map(([category, count]) => (
                    <Grid item xs={12} md={2.4} key={category}>
                      <Paper className="size-category-card">
                        <Box className="category-header">
                          <Typography variant="subtitle2" className="category-title">
                            {category.charAt(0).toUpperCase() + category.slice(1)}
                          </Typography>
                          {getPositionIcon(positionMetrics.avgPositionSize)}
                        </Box>
                        <Typography variant="h5" className="category-count">
                          {count}
                        </Typography>
                        <Typography variant="body2" className="category-percentage">
                          {formatPercentage((count / positionMetrics.totalPositions) * 100)}
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={(count / positionMetrics.totalPositions) * 100}
                          className="category-progress"
                          style={{ '--progress-color': getPositionColor(positionMetrics.avgPositionSize) }}
                        />
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            </Box>

            {/* Risk Metrics */}
            <Box className="risk-metrics">
              <Paper className="risk-card">
                <Typography variant="subtitle1" className="risk-title">
                  Risk Analysis
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Box className="risk-item">
                      <Typography variant="body2" className="risk-label">
                        Concentration Risk (HHI)
                      </Typography>
                      <Typography variant="h6" className={`risk-value ${positionMetrics.concentrationRisk <= 1500 ? 'positive' : positionMetrics.concentrationRisk <= 2500 ? 'neutral' : 'negative'}`}>
                        {positionMetrics.concentrationRisk}
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(positionMetrics.concentrationRisk / 5000 * 100, 100)}
                        className="risk-progress"
                        style={{ '--progress-color': positionMetrics.concentrationRisk <= 1500 ? '#4caf50' : positionMetrics.concentrationRisk <= 2500 ? '#ff9800' : '#f44336' }}
                      />
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Box className="risk-item">
                      <Typography variant="body2" className="risk-label">
                        Max Position Size
                      </Typography>
                      <Typography variant="h6" className="risk-value">
                        {formatCurrency(positionMetrics.maxPositionSize)}
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(positionMetrics.maxPositionSize / positionMetrics.totalCapital * 100, 100)}
                        className="risk-progress"
                        style={{ '--progress-color': getPositionColor(positionMetrics.maxPositionSize) }}
                      />
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </Box>
          </Box>
        )}

        {/* Distribution View */}
        {selectedView === 'distribution' && (
          <Box className="distribution-view">
            <Grid container spacing={2}>
              <Grid item xs={12} md={8}>
                <Paper className="chart-container">
                  <Box className="chart-header">
                    <Typography variant="subtitle1" className="chart-title">
                      Position Size Distribution
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
                    </Box>
                  </Box>
                  <Box className="chart-plotly">
                    <Plot
                      data={generateChartData()}
                      layout={chartLayout}
                      config={{
                        responsive: true,
                        displaylogo: false,
                        modeBarButtonsToRemove: ['pan2d', 'lasso2d']
                      }}
                      style={{ width: '100%', height: '400px' }}
                    />
                  </Box>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper className="distribution-stats">
                  <Typography variant="subtitle1" className="stats-title">
                    Distribution Summary
                  </Typography>
                  <Box className="stats-list">
                    <Box className="stat-item">
                      <Typography variant="body2" className="stat-label">
                        Mean Position Size
                      </Typography>
                      <Typography variant="h6" className="stat-value">
                        {formatCurrency(positionMetrics.avgPositionSize)}
                      </Typography>
                    </Box>
                    <Box className="stat-item">
                      <Typography variant="body2" className="stat-label">
                        Median Position Size
                      </Typography>
                      <Typography variant="h6" className="stat-value">
                        {formatCurrency(positionMetrics.totalPositions / 2)}
                      </Typography>
                    </Box>
                    <Box className="stat-item">
                      <Typography variant="body2" className="stat-label">
                        Standard Deviation
                      </Typography>
                      <Typography variant="h6" className="stat-value">
                        {formatCurrency(calculateStandardDeviation(positionData.map(p => p.position_size)))}
                      </Typography>
                    </Box>
                    <Box className="stat-item">
                      <Typography variant="body2" className="stat-label">
                        Coefficient of Variation
                      </Typography>
                      <Typography variant="h6" className="stat-value">
                        {((calculateStandardDeviation(positionData.map(p => p.position_size)) / positionMetrics.avgPositionSize) * 100).toFixed(2)}%
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Performance View */}
        {selectedView === 'performance' && (
          <Box className="performance-view">
            <Paper className="performance-table">
              <Typography variant="subtitle1" className="performance-title">
                Position Performance by Size Category
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Size Category</TableCell>
                      <TableCell align="right">Count</TableCell>
                      <TableCell align="right">Avg Size</TableCell>
                      <TableCell align="right">Avg Return</TableCell>
                      <TableCell align="right">Best Return</TableCell>
                      <TableCell align="right">Worst Return</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(positionMetrics.returnBySize).map(([category, avgReturn]) => {
                      const categoryPositions = positionData.filter(pos => {
                        let sizeCategory;
                        if (pos.position_size <= 1000) sizeCategory = 'micro';
                        else if (pos.position_size <= 5000) sizeCategory = 'small';
                        else if (pos.position_size <= 20000) sizeCategory = 'medium';
                        else if (pos.position_size <= 50000) sizeCategory = 'large';
                        else sizeCategory = 'xlarge';
                        return sizeCategory === category;
                      });

                      const returns = categoryPositions.map(pos => pos.return_pct || 0);
                      const bestReturn = returns.length > 0 ? Math.max(...returns) : 0;
                      const worstReturn = returns.length > 0 ? Math.min(...returns) : 0;

                      return (
                        <TableRow key={category} hover>
                          <TableCell>
                            <Chip
                              label={category.charAt(0).toUpperCase() + category.slice(1)}
                              size="small"
                              className="category-chip"
                              style={{ backgroundColor: getPositionColor(positionMetrics.avgPositionSize) }}
                            />
                          </TableCell>
                          <TableCell align="right">{categoryPositions.length}</TableCell>
                          <TableCell align="right">{formatCurrency(categoryPositions.reduce((sum, pos) => sum + pos.position_size, 0) / categoryPositions.length)}</TableCell>
                          <TableCell align="right" className={avgReturn >= 0 ? 'positive' : 'negative'}>
                            {formatPercentage(avgReturn)}
                          </TableCell>
                          <TableCell align="right" className="positive">
                            {formatPercentage(bestReturn)}
                          </TableCell>
                          <TableCell align="right" className="negative">
                            {formatPercentage(worstReturn)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Box>
        )}

        {/* Methods View */}
        {selectedView === 'methods' && (
          <Box className="methods-view">
            <Grid container spacing={2}>
              {Object.entries(positionMetrics.methodStats).map(([method, stats]) => (
                <Grid item xs={12} md={6} key={method}>
                  <Paper className="method-card">
                    <Box className="method-header">
                      <Typography variant="subtitle1" className="method-title">
                        {method.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Typography>
                      <Chip
                        label={`${stats.count} positions`}
                        size="small"
                        className="method-count-chip"
                      />
                    </Box>
                    <Grid container spacing={1}>
                      <Grid item xs={6}>
                        <Typography variant="body2" className="method-stat-label">
                          Total Size
                        </Typography>
                        <Typography variant="h6" className="method-stat-value">
                          {formatCurrency(stats.totalSize)}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" className="method-stat-label">
                          Avg Size
                        </Typography>
                        <Typography variant="h6" className="method-stat-value">
                          {formatCurrency(stats.totalSize / stats.count)}
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="body2" className="method-stat-label">
                          Average Return
                        </Typography>
                        <Typography variant="h6" className={`method-stat-value ${stats.avgReturn >= 0 ? 'positive' : 'negative'}`}>
                          {formatPercentage(stats.avgReturn)}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Position Details Dialog */}
        <Dialog
          open={showDetails}
          onClose={() => setShowDetails(false)}
          maxWidth="md"
          fullWidth
          className="position-details-dialog"
        >
          <DialogTitle className="dialog-title">
            <Assessment className="dialog-icon" />
            Position Details
          </DialogTitle>
          <DialogContent>
            {selectedPosition && (
              <Box className="position-details-content">
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
                              <TableCell align="right">{selectedPosition.ticker}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Position Size</TableCell>
                              <TableCell align="right">{formatCurrency(selectedPosition.position_size)}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Method</TableCell>
                              <TableCell align="right">{selectedPosition.method}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Entry Date</TableCell>
                              <TableCell align="right">{formatDate(selectedPosition.entry_date)}</TableCell>
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
                              <TableCell>Return %</TableCell>
                              <TableCell align="right" className={(selectedPosition.return_pct || 0) >= 0 ? 'positive' : 'negative'}>
                                {formatPercentage(selectedPosition.return_pct || 0)}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Exit Date</TableCell>
                              <TableCell align="right">{formatDate(selectedPosition.exit_date)}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Duration</TableCell>
                              <TableCell align="right">{selectedPosition.duration} days</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>P&L</TableCell>
                              <TableCell align="right" className={(selectedPosition.return_pct || 0) >= 0 ? 'positive' : 'negative'}>
                                {formatCurrency(selectedPosition.position_size * (selectedPosition.return_pct || 0) / 100)}
                              </TableCell>
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
              Export Position
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
            Filter Positions
          </DialogTitle>
          <DialogContent>
            <Box className="filter-content">
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Paper className="filter-card">
                    <Typography variant="subtitle2" className="filter-title">
                      Position Size Range
                    </Typography>
                    <Box className="filter-range">
                      <FormControl fullWidth size="small" className="filter-input">
                        <InputLabel>Min Size ($)</InputLabel>
                        <Input
                          type="number"
                          value={filters.minSize || ''}
                          onChange={(e) => setFilters({...filters, minSize: e.target.value ? parseFloat(e.target.value) : null})}
                        />
                      </FormControl>
                      <FormControl fullWidth size="small" className="filter-input">
                        <InputLabel>Max Size ($)</InputLabel>
                        <Input
                          type="number"
                          value={filters.maxSize || ''}
                          onChange={(e) => setFilters({...filters, maxSize: e.target.value ? parseFloat(e.target.value) : null})}
                        />
                      </FormControl>
                    </Box>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper className="filter-card">
                    <Typography variant="subtitle2" className="filter-title">
                      Return Range (%)
                    </Typography>
                    <Box className="filter-range">
                      <FormControl fullWidth size="small" className="filter-input">
                        <InputLabel>Min Return (%)</InputLabel>
                        <Input
                          type="number"
                          value={filters.minReturn || ''}
                          onChange={(e) => setFilters({...filters, minReturn: e.target.value ? parseFloat(e.target.value) : null})}
                        />
                      </FormControl>
                      <FormControl fullWidth size="small" className="filter-input">
                        <InputLabel>Max Return (%)</InputLabel>
                        <Input
                          type="number"
                          value={filters.maxReturn || ''}
                          onChange={(e) => setFilters({...filters, maxReturn: e.target.value ? parseFloat(e.target.value) : null})}
                        />
                      </FormControl>
                    </Box>
                  </Paper>
                </Grid>
                <Grid item xs={12}>
                  <Paper className="filter-card">
                    <Typography variant="subtitle2" className="filter-title">
                      Available Methods
                    </Typography>
                    <Box className="filter-checkboxes">
                      {Object.keys(positionMetrics.methodStats || {}).map(method => (
                        <FormControlLabel
                          key={method}
                          control={
                            <Checkbox
                              checked={filters.methods.includes(method)}
                              onChange={(e) => {
                                const newMethods = e.target.checked
                                  ? [...filters.methods, method]
                                  : filters.methods.filter(m => m !== method);
                                setFilters({...filters, methods: newMethods});
                              }}
                            />
                          }
                          label={method.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
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
const calculateStandardDeviation = (values) => {
  if (!values || values.length === 0) return 0;
  
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squaredDifferences = values.map(val => Math.pow(val - mean, 2));
  const avgSquaredDiff = squaredDifferences.reduce((sum, val) => sum + val, 0) / values.length;
  
  return Math.sqrt(avgSquaredDiff);
};

export default PositionSizingAnalysis;