import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Paper,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  ShowChart,
  BarChart,
  PieChart,
  Equalizer,
} from '@mui/icons-material';
import './PerformanceDashboard.css';

const PerformanceDashboard = ({ data, disabled = false }) => {
  const {
    totalReturn,
    annualizedReturn,
    sharpeRatio,
    maxDrawdown,
    winRate,
    profitFactor,
    bestTrade,
    worstTrade,
  } = data;

  const Metric = ({ title, value, icon, positive, negative }) => (
    <Paper className="dashboard-metric">
      <Box display="flex" alignItems="center" mb={1}>
        {icon}
        <Typography variant="subtitle1" ml={1}>
          {title}
        </Typography>
      </Box>
      <Typography
        variant="h5"
        className={positive ? 'positive' : negative ? 'negative' : ''}
      >
        {value}
      </Typography>
    </Paper>
  );

  return (
    <Card className="performance-dashboard-card">
      <CardContent>
        <Typography variant="h6" className="dashboard-title">
          Performance Dashboard
        </Typography>
        <Grid container spacing={3} mt={1}>
          <Grid item xs={12} md={3}>
            <Metric
              title="Total Return"
              value={`${totalReturn.toFixed(2)}%`}
              icon={<TrendingUp />}
              positive={totalReturn > 0}
              negative={totalReturn < 0}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <Metric
              title="Max Drawdown"
              value={`${maxDrawdown.toFixed(2)}%`}
              icon={<TrendingDown />}
              negative
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <Metric
              title="Sharpe Ratio"
              value={sharpeRatio.toFixed(2)}
              icon={<Equalizer />}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <Metric
              title="Win Rate"
              value={`${winRate.toFixed(2)}%`}
              icon={<PieChart />}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper className="dashboard-chart">
              <Typography variant="subtitle1">Equity Curve</Typography>
              <Box className="chart-placeholder">
                <ShowChart className="placeholder-icon" />
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper className="dashboard-chart">
              <Typography variant="subtitle1">Drawdown Curve</Typography>
              <Box className="chart-placeholder">
                <BarChart className="placeholder-icon" />
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default PerformanceDashboard;