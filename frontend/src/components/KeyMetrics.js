import React from 'react';
import { Grid, Card, CardContent, Typography, Box } from '@mui/material';
import { TrendingUp, TrendingDown, BarChart, ShowChart } from '@mui/icons-material';
import { formatCurrency, formatPercentage, formatNumber } from '../utils/formatting';

const MetricCard = ({ title, value, icon, color = 'text.primary' }) => (
  <Card variant="outlined">
    <CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography color="text.secondary" gutterBottom>
          {title}
        </Typography>
        {icon}
      </Box>
      <Typography variant="h5" component="div" sx={{ color }}>
        {value}
      </Typography>
    </CardContent>
  </Card>
);

const KeyMetrics = ({ metrics }) => {
  if (!metrics) {
    return <Typography>No metrics available.</Typography>;
  }

  const getMetricColor = (value) => (value >= 0 ? 'success.main' : 'error.main');

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen">
      <div className="mx-auto max-w-7xl py-10 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Key Performance Indicators</h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">Essential metrics and performance indicators for your backtest results.</p>
        </div>

        <div className="space-y-12">
          <div className="space-y-6 rounded-lg border border-gray-200/50 dark:border-gray-700/50 bg-white/20 dark:bg-black/20 p-6">
            <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border border-gray-200/50 dark:border-gray-700/50 bg-white/20 dark:bg-black/20 p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Return</p>
                  <TrendingUp className="text-green-600 dark:text-green-400" fontSize="small" />
                </div>
                <p className={`text-2xl font-bold ${metrics['Total Return (%)'] >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {formatPercentage(metrics['Total Return (%)'])}
                </p>
              </div>
              
              <div className="rounded-lg border border-gray-200/50 dark:border-gray-700/50 bg-white/20 dark:bg-black/20 p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total P&L</p>
                  <TrendingUp className={metrics['Total P&L ($)'] >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'} fontSize="small" />
                </div>
                <p className={`text-2xl font-bold ${metrics['Total P&L ($)'] >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {formatCurrency(metrics['Total P&L ($)'])}
                </p>
              </div>
              
              <div className="rounded-lg border border-gray-200/50 dark:border-gray-700/50 bg-white/20 dark:bg-black/20 p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Win Rate</p>
                  <BarChart className="text-primary" fontSize="small" />
                </div>
                <p className="text-2xl font-bold text-primary">
                  {formatPercentage(metrics['Win Rate (%)'])}
                </p>
              </div>
              
              <div className="rounded-lg border border-gray-200/50 dark:border-gray-700/50 bg-white/20 dark:bg-black/20 p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Sharpe Ratio</p>
                  <ShowChart className="text-primary" fontSize="small" />
                </div>
                <p className="text-2xl font-bold text-primary">
                  {formatNumber(metrics['Sharpe Ratio'], 3)}
                </p>
              </div>
              
              <div className="rounded-lg border border-gray-200/50 dark:border-gray-700/50 bg-white/20 dark:bg-black/20 p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Max Drawdown</p>
                  <TrendingDown className="text-red-600 dark:text-red-400" fontSize="small" />
                </div>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {formatPercentage(metrics['Max Drawdown (%)'])}
                </p>
              </div>
              
              <div className="rounded-lg border border-gray-200/50 dark:border-gray-700/50 bg-white/20 dark:bg-black/20 p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Profit Factor</p>
                  <BarChart className={(metrics['Profit Factor'] - 1) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'} fontSize="small" />
                </div>
                <p className={`text-2xl font-bold ${(metrics['Profit Factor'] - 1) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {formatNumber(metrics['Profit Factor'], 2)}
                </p>
              </div>
              
              <div className="rounded-lg border border-gray-200/50 dark:border-gray-700/50 bg-white/20 dark:bg-black/20 p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Trades</p>
                  <BarChart className="text-gray-600 dark:text-gray-400" fontSize="small" />
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatNumber(metrics['Total Trades'])}
                </p>
              </div>
              
              <div className="rounded-lg border border-gray-200/50 dark:border-gray-700/50 bg-white/20 dark:bg-black/20 p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg Trade P&L</p>
                  <TrendingUp className={metrics['Total P&L ($)'] >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'} fontSize="small" />
                </div>
                <p className={`text-2xl font-bold ${metrics['Total P&L ($)'] >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {formatCurrency(metrics['Total P&L ($)'] / metrics['Total Trades'])}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KeyMetrics;