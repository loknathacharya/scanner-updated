import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Paper,
  Button,
  IconButton,
  Tooltip,
  Divider,
  Tabs,
  Tab,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  LinearProgress,
} from '@mui/material';
import {
  AccountBalance,
  TrendingUp,
  TrendingDown,
  PieChart,
  BarChart,
  ShowChart,
  Download,
  Refresh,
  Info,
  Equalizer,
  Analytics,
  Leaderboard,
} from '@mui/icons-material';
import './PortfolioAnalytics.css';

const PortfolioAnalytics = ({ portfolioData, onRefresh, disabled = false }) => {
  const [selectedView, setSelectedView] = useState('overview');

  const calculatePortfolioMetrics = (data) => {
    if (!data || !data.equity_curve || data.equity_curve.length === 0) {
      return {
        initialCapital: 0,
        finalCapital: 0,
        totalReturn: 0,
        totalReturnPct: 0,
        annualizedReturn: 0,
        sharpeRatio: 0,
        calmarRatio: 0,
        maxDrawdown: 0,
        bestMonth: 0,
        worstMonth: 0,
        monthlyReturns: [],
        assetAllocation: [],
        sectorAllocation: [],
      };
    }

    const initialCapital = data.initial_capital || 0;
    const finalCapital = data.equity_curve[data.equity_curve.length - 1]?.equity || 0;
    const totalReturn = finalCapital - initialCapital;
    const totalReturnPct = initialCapital > 0 ? (totalReturn / initialCapital) * 100 : 0;

    return {
      initialCapital,
      finalCapital,
      totalReturn,
      totalReturnPct,
      annualizedReturn: data.annualized_return || 0,
      sharpeRatio: data.sharpe_ratio || 0,
      calmarRatio: data.calmar_ratio || 0,
      maxDrawdown: data.max_drawdown || 0,
      bestMonth: data.best_month_return || 0,
      worstMonth: data.worst_month_return || 0,
      monthlyReturns: data.monthly_returns || [],
      assetAllocation: data.asset_allocation || [],
      sectorAllocation: data.sector_allocation || [],
    };
  };

  const metrics = calculatePortfolioMetrics(portfolioData);

  const formatCurrency = (value) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);

  const formatPercentage = (value) => `${value.toFixed(2)}%`;

  const viewOptions = [
    { value: 'overview', label: 'Overview', icon: <Analytics /> },
    { value: 'performance', label: 'Performance', icon: <Leaderboard /> },
    { value: 'allocation', label: 'Allocation', icon: <PieChart /> },
  ];

  if (!portfolioData) {
    return (
      <Card className="portfolio-analytics-card">
        <CardContent>
          <Box className="empty-state">
            <AccountBalance className="empty-icon" />
            <Typography variant="h6" className="empty-title">
              No Portfolio Data
            </Typography>
            <Typography variant="body2" className="empty-description">
              Run a backtest to generate portfolio analytics.
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="portfolio-analytics-card">
      <CardContent>
        <Box className="analytics-header">
          <Typography variant="h6" className="analytics-title">
            <AccountBalance /> Portfolio Analytics
          </Typography>
          <Box>
            <Tooltip title="Refresh Data">
              <span>
                <IconButton onClick={onRefresh} disabled={disabled}>
                  <Refresh />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Export Data">
              <span>
                <IconButton disabled={disabled}>
                  <Download />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        </Box>
        <Divider />

        <Tabs
          value={selectedView}
          onChange={(e, newValue) => setSelectedView(newValue)}
          variant="fullWidth"
          className="view-tabs"
        >
          {viewOptions.map((option) => (
            <Tab
              key={option.value}
              value={option.value}
              label={option.label}
              icon={option.icon}
              iconPosition="start"
            />
          ))}
        </Tabs>

        {selectedView === 'overview' && (
          <Grid container spacing={3} mt={2}>
            <Grid item xs={12} md={4}>
              <Paper className="metric-paper">
                <Typography variant="subtitle1" className="metric-title">
                  Total Return
                </Typography>
                <Typography
                  variant="h4"
                  className={`metric-value ${metrics.totalReturn >= 0 ? 'positive' : 'negative'}`}
                >
                  {formatCurrency(metrics.totalReturn)}
                </Typography>
                <Typography
                  variant="h6"
                  className={`metric-value-pct ${metrics.totalReturnPct >= 0 ? 'positive' : 'negative'}`}
                >
                  {formatPercentage(metrics.totalReturnPct)}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper className="metric-paper">
                <Typography variant="subtitle1" className="metric-title">
                  Annualized Return
                </Typography>
                <Typography
                  variant="h4"
                  className={`metric-value ${metrics.annualizedReturn >= 0 ? 'positive' : 'negative'}`}
                >
                  {formatPercentage(metrics.annualizedReturn)}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper className="metric-paper">
                <Typography variant="subtitle1" className="metric-title">
                  Max Drawdown
                </Typography>
                <Typography variant="h4" className="metric-value negative">
                  {formatPercentage(metrics.maxDrawdown)}
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        )}

        {selectedView === 'performance' && (
          <Grid container spacing={3} mt={2}>
            <Grid item xs={12} md={6}>
              <Paper className="chart-paper">
                <Typography variant="h6" className="chart-title">
                  Equity Curve
                </Typography>
                <Box className="chart-placeholder">
                  <ShowChart className="placeholder-icon" />
                  <Typography>Equity Curve Chart</Typography>
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper className="chart-paper">
                <Typography variant="h6" className="chart-title">
                  Monthly Returns
                </Typography>
                <Box className="chart-placeholder">
                  <BarChart className="placeholder-icon" />
                  <Typography>Monthly Returns Bar Chart</Typography>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        )}

        {selectedView === 'allocation' && (
          <Grid container spacing={3} mt={2}>
            <Grid item xs={12} md={6}>
              <Paper className="allocation-paper">
                <Typography variant="h6" className="allocation-title">
                  Asset Allocation
                </Typography>
                <List>
                  {metrics.assetAllocation.map((asset) => (
                    <ListItem key={asset.name}>
                      <ListItemAvatar>
                        <Avatar>{asset.name.charAt(0)}</Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={asset.name}
                        secondary={`${formatPercentage(asset.percentage)}`}
                      />
                      <LinearProgress
                        variant="determinate"
                        value={asset.percentage}
                        className="allocation-bar"
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper className="allocation-paper">
                <Typography variant="h6" className="allocation-title">
                  Sector Allocation
                </Typography>
                <Box className="chart-placeholder">
                  <PieChart className="placeholder-icon" />
                  <Typography>Sector Allocation Pie Chart</Typography>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        )}
      </CardContent>
    </Card>
  );
};

export default PortfolioAnalytics;