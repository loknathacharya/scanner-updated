/**
 * BacktestResults Component
 * 
 * Comprehensive backtest results display component with interactive charts,
 * filtering, export functionality, and performance analytics
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  Slider,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Paper,
  Tooltip
} from '@mui/material';
import {
  Download as DownloadIcon,
  FilterList as FilterIcon,
  DateRange as DateIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  ShowChart as LineChartIcon,
  TableChart as TableChartIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  Assessment as AssessmentIcon,
  ShowChart as ShowChartIcon,
  Balance as BalanceIcon,
  Casino as CasinoIcon,
  PlayArrow as PlayIcon,
  ScatterPlot as ScatterIcon
} from '@mui/icons-material';
import Plot from 'react-plotly.js';
import { format } from 'date-fns';
import KeyMetrics from './KeyMetrics';
import TradeLogTable from './TradeLogTable';
import EquityCurveChart from './EquityCurveChart';
import InvestedCapitalChart from './InvestedCapitalChart';

const BacktestResults = ({ results, onExport, onFilterChange }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('equity_curve');
  const [mainTab, setMainTab] = useState('single'); // 'single' or 'optimization'
  const [tradeFilters, setTradeFilters] = useState({
    minReturn: -100,
    maxReturn: 100,
    minProfit: -10000,
    maxProfit: 10000,
    symbols: [],
    dateRange: [null, null]
  });
  const [chartSettings, setChartSettings] = useState({
    showTrades: true,
    showDrawdown: true,
    showMovingAverage: false,
    movingAveragePeriod: 20
  });
  const [exportMenuAnchor, setExportMenuAnchor] = useState(null);
  const [settingsDialog, setSettingsDialog] = useState(false);
  const [optimizationOrder, setOptimizationOrder] = useState('desc');
  const [optimizationOrderBy, setOptimizationOrderBy] = useState('holding_period');

  // Sorting functions for optimization results
  const handleOptimizationRequestSort = (property) => {
    const isAsc = optimizationOrderBy === property && optimizationOrder === 'asc';
    setOptimizationOrder(isAsc ? 'desc' : 'asc');
    setOptimizationOrderBy(property);
  };

  const getOptimizationComparator = (order, orderBy) => {
    return order === 'desc'
      ? (a, b) => descendingOptimizationComparator(a, b, orderBy)
      : (a, b) => -descendingOptimizationComparator(a, b, orderBy);
  };

  const descendingOptimizationComparator = (a, b, orderBy) => {
    let aValue, bValue;
    
    if (orderBy.startsWith('params_')) {
      const paramKey = orderBy.replace('params_', '');
      aValue = a.params?.[paramKey];
      bValue = b.params?.[paramKey];
    } else {
      aValue = a[orderBy];
      bValue = b[orderBy];
    }
    
    if (aValue == null) aValue = -Infinity;
    if (bValue == null) bValue = -Infinity;
    
    if (bValue < aValue) return -1;
    if (bValue > aValue) return 1;
    return 0;
  };

  const getSortedOptimizationResults = () => {
    const allResults = results.optimization_results?.all_results || results.all_results || [];
    return allResults.slice().sort(getOptimizationComparator(optimizationOrder, optimizationOrderBy));
  };

  // Auto-switch to optimization tab if optimization results are available and we're on single tab
  React.useEffect(() => {
    if (results && (results.optimization_results || results.best_params) && mainTab === 'single') {
      setMainTab('optimization');
    }
  }, [results, mainTab]);

  // Extract data from results (moved below after results null-check)
  // const { trades, performance_metrics, equity_curve, summary, execution_time, signals_processed, optimization_results, initial_capital } = results;

  // Main render
  if (!results) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="text.secondary">
          No backtest results available
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" action={
          <IconButton color="inherit" size="small" onClick={() => setError(null)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        }>
          {error}
        </Alert>
      </Box>
    );
  }

  // Safe to destructure after ensuring results is non-null
  const { trades, performance_metrics, equity_curve, summary, execution_time, signals_processed, optimization_results, initial_capital } = results;

  // Determine which main tab to show based on available data
  const hasOptimizationResults = optimization_results || results.best_params;
  const shouldShowOptimization = hasOptimizationResults && mainTab === 'optimization';
  const shouldShowSingle = !hasOptimizationResults || mainTab === 'single';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {hasOptimizationResults ? 'Parameter Optimization Results' : 'Backtest Results'}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {signals_processed} signals processed • {execution_time?.toFixed(2)}s execution time
          </p>
        </div>
        <div className="flex gap-2">
          <button
            className="rounded-lg bg-gray-200 dark:bg-gray-700 px-4 py-2 text-sm font-semibold text-gray-900 dark:text-white shadow-sm hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center gap-2"
            onClick={() => window.location.reload()}
          >
            <RefreshIcon className="w-4 h-4" />
            Refresh
          </button>
          <button
            className="rounded-lg bg-gray-200 dark:bg-gray-700 px-4 py-2 text-sm font-semibold text-gray-900 dark:text-white shadow-sm hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center gap-2"
            onClick={(e) => setExportMenuAnchor(e.currentTarget)}
          >
            <DownloadIcon className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Main Tabs - Single vs Optimization */}
      {hasOptimizationResults && (
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex space-x-1">
            <button
              className={`px-6 py-3 text-sm font-medium rounded-t-lg transition-colors ${
                mainTab === 'single'
                  ? 'text-primary border-b-2 border-primary bg-white/50 dark:bg-black/50'
                  : 'text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
              onClick={() => setMainTab('single')}
            >
              📊 Single Backtest
            </button>
            <button
              className={`px-6 py-3 text-sm font-medium rounded-t-lg transition-colors ${
                mainTab === 'optimization'
                  ? 'text-primary border-b-2 border-primary bg-white/50 dark:bg-black/50'
                  : 'text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
              onClick={() => setMainTab('optimization')}
            >
              🔬 Parameter Optimization
            </button>
          </div>
        </div>
      )}

      {/* KPI Metrics Section - Always Visible */}
      <div className="rounded-lg border border-gray-200/50 dark:border-gray-700/50 bg-white/20 dark:bg-black/20 p-6 mb-6">
        <div className="flex items-center mb-4">
          <AssessmentIcon className="w-5 h-5 text-primary mr-2" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Key Performance Indicators</h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* Total Return */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="text-xs font-medium text-blue-700 dark:text-blue-300 uppercase tracking-wider mb-1">Total Return</div>
            <div className={`text-xl font-bold ${performance_metrics?.total_return >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {performance_metrics?.total_return ? `${performance_metrics.total_return.toFixed(2)}%` : 'N/A'}
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              {performance_metrics?.total_pl ? `$${performance_metrics.total_pl.toLocaleString()}` : 'N/A'}
            </div>
          </div>

          {/* Win Rate */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="text-xs font-medium text-green-700 dark:text-green-300 uppercase tracking-wider mb-1">Win Rate</div>
            <div className="text-xl font-bold text-green-900 dark:text-green-100">
              {performance_metrics?.win_rate ? `${performance_metrics.win_rate.toFixed(1)}%` : 'N/A'}
            </div>
            <div className="text-xs text-green-600 dark:text-green-400 mt-1">
              {performance_metrics?.total_trades || 'N/A'} trades
            </div>
          </div>

          {/* Sharpe Ratio */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
            <div className="text-xs font-medium text-purple-700 dark:text-purple-300 uppercase tracking-wider mb-1">Sharpe Ratio</div>
            <div className="text-xl font-bold text-purple-900 dark:text-purple-100">
              {performance_metrics?.sharpe_ratio ? performance_metrics.sharpe_ratio.toFixed(3) : 'N/A'}
            </div>
            <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
              Risk-adjusted return
            </div>
          </div>

          {/* Max Drawdown */}
          <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="text-xs font-medium text-red-700 dark:text-red-300 uppercase tracking-wider mb-1">Max Drawdown</div>
            <div className="text-xl font-bold text-red-900 dark:text-red-100">
              {performance_metrics?.max_drawdown ? `${performance_metrics.max_drawdown.toFixed(2)}%` : 'N/A'}
            </div>
            <div className="text-xs text-red-600 dark:text-red-400 mt-1">
              Peak to trough decline
            </div>
          </div>

          {/* Profit Factor */}
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="text-xs font-medium text-yellow-700 dark:text-yellow-300 uppercase tracking-wider mb-1">Profit Factor</div>
            <div className="text-xl font-bold text-yellow-900 dark:text-yellow-100">
              {performance_metrics?.profit_factor ? performance_metrics.profit_factor.toFixed(2) : 'N/A'}
            </div>
            <div className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
              Gross profit / gross loss
            </div>
          </div>

          {/* Calmar Ratio */}
          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4">
            <div className="text-xs font-medium text-indigo-700 dark:text-indigo-300 uppercase tracking-wider mb-1">Calmar Ratio</div>
            <div className="text-xl font-bold text-indigo-900 dark:text-indigo-100">
              {performance_metrics?.calmar_ratio || performance_metrics?.['Calmar Ratio'] ? (performance_metrics.calmar_ratio || performance_metrics['Calmar Ratio']).toFixed(3) : 'N/A'}
            </div>
            <div className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
              Return / max drawdown
            </div>
          </div>
        </div>

        {/* Additional Metrics Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
            <div className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">Avg Win</div>
            <div className="text-lg font-semibold text-green-600 dark:text-green-400">
              {performance_metrics?.avg_win || performance_metrics?.['Average Win (%)'] ? `${(performance_metrics.avg_win || performance_metrics['Average Win (%)']).toFixed(2)}%` : 'N/A'}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-500">
              {performance_metrics?.avg_win_dollar || performance_metrics?.['Average Win ($)'] ? `$${(performance_metrics.avg_win_dollar || performance_metrics['Average Win ($)']).toLocaleString()}` : 'N/A'}
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
            <div className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">Avg Loss</div>
            <div className="text-lg font-semibold text-red-600 dark:text-red-400">
              {performance_metrics?.avg_loss || performance_metrics?.['Average Loss (%)'] ? `${(performance_metrics.avg_loss || performance_metrics['Average Loss (%)']).toFixed(2)}%` : 'N/A'}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-500">
              {performance_metrics?.avg_loss_dollar || performance_metrics?.['Average Loss ($)'] ? `$${(performance_metrics.avg_loss_dollar || performance_metrics['Average Loss ($)']).toLocaleString()}` : 'N/A'}
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
            <div className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">Avg Position</div>
            <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {(() => {
                // Try multiple possible field names for average position size
                const avgPosSize = performance_metrics?.avg_position_size ||
                                 performance_metrics?.['Avg Position Size ($)'] ||
                                 performance_metrics?.['Average Position Size ($)'] ||
                                 performance_metrics?.avg_position ||
                                 performance_metrics?.['Average Position Size'];
                return avgPosSize ? `$${Number(avgPosSize).toLocaleString()}` : 'N/A';
              })()}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-500">
              Portfolio allocation
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
            <div className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">Signal Type</div>
            <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {performance_metrics?.signal_type || performance_metrics?.['Signal Type'] || 'N/A'}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-500">
              Strategy direction
            </div>
          </div>
        </div>
      </div>

      {/* Analysis Tabs - Only show for Single Backtest */}
      {shouldShowSingle && (
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex space-x-1 overflow-x-auto">
            <button
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
                activeTab === 'equity_curve'
                  ? 'text-primary border-b-2 border-primary bg-white/50 dark:bg-black/50'
                  : 'text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
              onClick={() => setActiveTab('equity_curve')}
            >
              📈 Equity Curve
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
                activeTab === 'invested_capital'
                  ? 'text-primary border-b-2 border-primary bg-white/50 dark:bg-black/50'
                  : 'text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
              onClick={() => setActiveTab('invested_capital')}
            >
              📊 Invested Capital
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
                activeTab === 'trade_log'
                  ? 'text-primary border-b-2 border-primary bg-white/50 dark:bg-black/50'
                  : 'text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
              onClick={() => setActiveTab('trade_log')}
            >
              📋 Trade Log
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
                activeTab === 'per_instrument'
                  ? 'text-primary border-b-2 border-primary bg-white/50 dark:bg-black/50'
                  : 'text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
              onClick={() => setActiveTab('per_instrument')}
            >
              🏢 Per-Instrument
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
                activeTab === 'trade_analysis'
                  ? 'text-primary border-b-2 border-primary bg-white/50 dark:bg-black/50'
                  : 'text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
              onClick={() => setActiveTab('trade_analysis')}
            >
              📊 Trade Analysis
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
                activeTab === 'position_sizing'
                  ? 'text-primary border-b-2 border-primary bg-white/50 dark:bg-black/50'
                  : 'text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
              onClick={() => setActiveTab('position_sizing')}
            >
              📏 Position Sizing
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
                activeTab === 'monte_carlo'
                  ? 'text-primary border-b-2 border-primary bg-white/50 dark:bg-black/50'
                  : 'text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
              onClick={() => setActiveTab('monte_carlo')}
            >
              🎲 Monte Carlo
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
                activeTab === 'leverage_metrics'
                  ? 'text-primary border-b-2 border-primary bg-white/50 dark:bg-black/50'
                  : 'text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
              onClick={() => setActiveTab('leverage_metrics')}
            >
              ⚖️ Leverage Metrics
            </button>
          </div>
        </div>
      )}

      {/* Tab Content - Single Backtest Analysis */}
      {shouldShowSingle && (
        <>
          {activeTab === 'equity_curve' && (
        <div className="space-y-6">
          {/* Portfolio Performance Over Time */}
          <div className="rounded-lg border border-gray-200/50 dark:border-gray-700/50 bg-white/20 dark:bg-black/20 p-6">
            <div className="flex items-center mb-4">
              <TrendingUpIcon className="w-5 h-5 text-primary mr-2" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Portfolio Performance Over Time</h3>
            </div>
            {equity_curve && equity_curve.length > 0 ? (
              <EquityCurveChart equityCurve={equity_curve} trades={trades} initialCapital={initial_capital} />
            ) : (
              <div className="h-96 bg-gray-50 dark:bg-gray-800/30 rounded-lg p-4 flex items-center justify-center">
                <div className="text-center text-gray-500 dark:text-gray-400">
                  <LineChartIcon className="w-12 h-12 mx-auto mb-2" />
                  <p>No equity curve data available</p>
                </div>
              </div>
            )}
            
            {/* Performance Summary */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="text-sm font-medium text-blue-700 dark:text-blue-300">Final Portfolio Value</div>
                <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  ${(() => {
                    if (!equity_curve || equity_curve.length === 0) return 'N/A';
                    const lastPoint = equity_curve[equity_curve.length - 1];
                    if (lastPoint && (lastPoint.portfolio_value || lastPoint['Portfolio Value'])) {
                      return (lastPoint.portfolio_value || lastPoint['Portfolio Value']).toLocaleString();
                    }
                    return 'N/A';
                  })()}
                </div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="text-sm font-medium text-green-700 dark:text-green-300">Total Return</div>
                <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {performance_metrics?.total_return || performance_metrics?.['Total Return (%)'] ?
                    `${(performance_metrics.total_return || performance_metrics['Total Return (%)']).toFixed(2)}%` : 'N/A'}
                </div>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                <div className="text-sm font-medium text-purple-700 dark:text-purple-300">Max Drawdown</div>
                <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                  {performance_metrics?.max_drawdown || performance_metrics?.['Max Drawdown (%)'] ?
                    `${(performance_metrics.max_drawdown || performance_metrics['Max Drawdown (%)']).toFixed(2)}%` : 'N/A'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'invested_capital' && (
        <div className="space-y-6">
          {/* Capital Deployment Timeline */}
          <div className="rounded-lg border border-gray-200/50 dark:border-gray-700/50 bg-white/20 dark:bg-black/20 p-6">
            <div className="flex items-center mb-4">
              <DateIcon className="w-5 h-5 text-primary mr-2" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Capital Deployment Timeline</h3>
            </div>
            
            {/* Invested Value Chart */}
            {trades && trades.length > 0 ? (
              <InvestedCapitalChart trades={trades} initialCapital={initial_capital} />
            ) : (
              <div className="h-96 bg-gray-50 dark:bg-gray-800/30 rounded-lg p-4 flex items-center justify-center">
                <div className="text-center text-gray-500 dark:text-gray-400">
                  <LineChartIcon className="w-12 h-12 mx-auto mb-2" />
                  <p>No trade data available for invested capital chart</p>
                  <p className="text-sm mt-1">Trade data is required to calculate capital deployment</p>
                </div>
              </div>
            )}
            
            {/* Invested Value Statistics */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4">
                <div className="text-sm font-medium text-indigo-700 dark:text-indigo-300">Max Invested</div>
                <div className="text-xl font-bold text-indigo-900 dark:text-indigo-100">
                  ${performance_metrics && performance_metrics.max_invested ? performance_metrics.max_invested.toLocaleString() : 'N/A'}
                </div>
              </div>
              <div className="bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800 rounded-lg p-4">
                <div className="text-sm font-medium text-cyan-700 dark:text-cyan-300">Avg Invested</div>
                <div className="text-xl font-bold text-cyan-900 dark:text-cyan-100">
                  ${performance_metrics && performance_metrics.avg_invested ? performance_metrics.avg_invested.toLocaleString() : 'N/A'}
                </div>
              </div>
              <div className="bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-lg p-4">
                <div className="text-sm font-medium text-teal-700 dark:text-teal-300">Total Deployed</div>
                <div className="text-xl font-bold text-teal-900 dark:text-teal-100">
                  ${performance_metrics && performance_metrics.total_deployed ? performance_metrics.total_deployed.toLocaleString() : 'N/A'}
                </div>
              </div>
              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                <div className="text-sm font-medium text-orange-700 dark:text-orange-300">Utilization Rate</div>
                <div className="text-xl font-bold text-orange-900 dark:text-orange-100">
                  {performance_metrics && performance_metrics.utilization_rate ? `${performance_metrics.utilization_rate.toFixed(1)}%` : 'N/A'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'trade_log' && (
        <div className="space-y-6">
          {/* Enhanced Trade Log with Advanced Filtering */}
          <div className="rounded-lg border border-gray-200/50 dark:border-gray-700/50 bg-white/20 dark:bg-black/20 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <TableChartIcon className="w-5 h-5 text-primary mr-2" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Trade Log - Enhanced Table</h3>
              </div>
              <Button variant="outlined" size="small" startIcon={<DownloadIcon />}>
                Export CSV
              </Button>
            </div>
            
            {/* Advanced Filters */}
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800/30 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Advanced Filters</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <FormControl fullWidth size="small">
                  <InputLabel>Ticker</InputLabel>
                  <Select>
                    <MenuItem value="">All</MenuItem>
                    {Array.from(new Set(trades?.map(trade => trade.Ticker) || [])).map(ticker => (
                      <MenuItem key={ticker} value={ticker}>{ticker}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl fullWidth size="small">
                  <InputLabel>Outcome</InputLabel>
                  <Select>
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="winners">Winners</MenuItem>
                    <MenuItem value="losers">Losers</MenuItem>
                  </Select>
                </FormControl>
                <FormControl fullWidth size="small">
                  <InputLabel>Exit Reason</InputLabel>
                  <Select>
                    <MenuItem value="">All</MenuItem>
                    {Array.from(new Set(trades?.map(trade => trade['Exit Reason']) || [])).map(reason => (
                      <MenuItem key={reason} value={reason}>{reason}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl fullWidth size="small">
                  <InputLabel>Date Range</InputLabel>
                  <Select>
                    <MenuItem value="">All Time</MenuItem>
                    <MenuItem value="30">Last 30 Days</MenuItem>
                    <MenuItem value="90">Last 90 Days</MenuItem>
                    <MenuItem value="365">Last Year</MenuItem>
                  </Select>
                </FormControl>
              </div>
            </div>
            
            {/* Trade Log Table */}
            <TradeLogTable trades={trades} />
          </div>
        </div>
      )}

      {activeTab === 'per_instrument' && (
        <div className="space-y-6">
          {/* Performance Breakdown by Symbol */}
          <div className="rounded-lg border border-gray-200/50 dark:border-gray-700/50 bg-white/20 dark:bg-black/20 p-6">
            <div className="flex items-center mb-4">
              <BarChartIcon className="w-5 h-5 text-primary mr-2" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Performance by Instrument</h3>
            </div>
            
            {/* Instrument Performance Summary */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ticker</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total P&L ($)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Avg P&L (%)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Win Rate (%)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Trades</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Volatility (%)</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900/50 divide-y divide-gray-200 dark:divide-gray-700">
                  {(() => {
                    if (!trades || trades.length === 0) {
                      return (
                        <tr>
                          <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                            No trade data available
                          </td>
                        </tr>
                      );
                    }
                    
                    const instrumentStats = {};
                    trades.forEach(trade => {
                      if (!instrumentStats[trade.Ticker]) {
                        instrumentStats[trade.Ticker] = {
                          total_pl: 0,
                          total_pl_pct: 0,
                          trades: 0,
                          wins: 0,
                          volatility: []
                        };
                      }
                      
                      instrumentStats[trade.Ticker].total_pl += trade['P&L ($)'] || 0;
                      instrumentStats[trade.Ticker].total_pl_pct += trade['Profit/Loss (%)'] || 0;
                      instrumentStats[trade.Ticker].trades += 1;
                      if ((trade['P&L ($)'] || 0) > 0) {
                        instrumentStats[trade.Ticker].wins += 1;
                      }
                      instrumentStats[trade.Ticker].volatility.push(trade['Profit/Loss (%)'] || 0);
                    });
                    
                    return Object.entries(instrumentStats)
                      .sort(([,a], [,b]) => (b.total_pl || 0) - (a.total_pl || 0))
                      .map(([ticker, stats], index) => {
                        const avgPct = (stats.total_pl_pct / stats.trades).toFixed(2);
                        const winRate = ((stats.wins / stats.trades) * 100).toFixed(1);
                        const volatility = stats.volatility.length > 1
                          ? (stats.volatility.reduce((a, b) => a + Math.abs(b), 0) / stats.volatility.length).toFixed(2)
                          : '0.00';
                        
                        return (
                          <tr key={ticker} className={index % 2 === 0 ? 'bg-white dark:bg-gray-900/30' : 'bg-gray-50 dark:bg-gray-800/30'}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{ticker}</td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${stats.total_pl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                              ${(stats.total_pl || 0).toLocaleString()}
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm ${parseFloat(avgPct) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                              {avgPct}%
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                              {winRate}%
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                              {stats.trades}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                              {volatility}%
                            </td>
                          </tr>
                        );
                      });
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'trade_analysis' && (
        <div className="space-y-6">
          {/* Trade Analysis Dashboard */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Exit Reason Distribution */}
            <div className="rounded-lg border border-gray-200/50 dark:border-gray-700/50 bg-white/20 dark:bg-black/20 p-6">
              <div className="flex items-center mb-4">
                <PieChartIcon className="w-5 h-5 text-primary mr-2" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Trade Exit Reasons</h3>
              </div>
              {trades && trades.length > 0 ? (
                (() => {
                  const exitReasons = {};
                  trades.forEach(trade => {
                    const reason = trade['Exit Reason'] || 'Unknown';
                    exitReasons[reason] = (exitReasons[reason] || 0) + 1;
                  });

                  const plotData = [{
                    labels: Object.keys(exitReasons),
                    values: Object.values(exitReasons),
                    type: 'pie',
                    textinfo: 'label+percent',
                    textposition: 'inside',
                    marker: {
                      colors: ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b']
                    }
                  }];

                  const layout = {
                    title: {
                      text: 'Trade Exit Reasons Distribution',
                      font: { color: 'white' }
                    },
                    paper_bgcolor: 'rgba(0,0,0,0.8)',
                    plot_bgcolor: 'rgba(0,0,0,0.8)',
                    font: { color: 'white' }
                  };

                  return (
                    <Plot
                      data={plotData}
                      layout={layout}
                      style={{ width: '100%', height: '300px' }}
                      useResizeHandler={true}
                      config={{ displayModeBar: false, displaylogo: false }}
                    />
                  );
                })()
              ) : (
                <div className="h-64 flex items-center justify-center">
                  <div className="text-center text-gray-500 dark:text-gray-400">
                    <PieChartIcon className="w-12 h-12 mx-auto mb-2" />
                    <p>No trade data available</p>
                  </div>
                </div>
              )}
            </div>

            {/* P&L Distribution */}
            <div className="rounded-lg border border-gray-200/50 dark:border-gray-700/50 bg-white/20 dark:bg-black/20 p-6">
              <div className="flex items-center mb-4">
                <BarChartIcon className="w-5 h-5 text-primary mr-2" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">P&L Distribution</h3>
              </div>
              {trades && trades.length > 0 ? (
                (() => {
                  const pnlValues = trades.map(trade => trade['Profit/Loss (%)'] || 0);

                  const plotData = [{
                    x: pnlValues,
                    type: 'histogram',
                    nbinsx: 20,
                    marker: {
                      color: '#1f77b4',
                      line: { color: 'white', width: 1 }
                    }
                  }];

                  const layout = {
                    title: {
                      text: 'P&L Distribution (%)',
                      font: { color: 'white' }
                    },
                    xaxis: {
                      title: { text: 'P&L (%)', font: { color: 'white' } },
                      tickfont: { color: 'white' }
                    },
                    yaxis: {
                      title: { text: 'Frequency', font: { color: 'white' } },
                      tickfont: { color: 'white' }
                    },
                    paper_bgcolor: 'rgba(0,0,0,0.8)',
                    plot_bgcolor: 'rgba(0,0,0,0.8)',
                    font: { color: 'white' }
                  };

                  return (
                    <Plot
                      data={plotData}
                      layout={layout}
                      style={{ width: '100%', height: '300px' }}
                      useResizeHandler={true}
                      config={{ displayModeBar: false, displaylogo: false }}
                    />
                  );
                })()
              ) : (
                <div className="h-64 flex items-center justify-center">
                  <div className="text-center text-gray-500 dark:text-gray-400">
                    <BarChartIcon className="w-12 h-12 mx-auto mb-2" />
                    <p>No trade data available</p>
                  </div>
                </div>
              )}
            </div>

            {/* Holding Period Distribution */}
            <div className="rounded-lg border border-gray-200/50 dark:border-gray-700/50 bg-white/20 dark:bg-black/20 p-6">
              <div className="flex items-center mb-4">
                <DateIcon className="w-5 h-5 text-primary mr-2" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Holding Period Distribution</h3>
              </div>
              {trades && trades.length > 0 ? (
                (() => {
                  const holdingPeriods = trades.map(trade => trade['Days Held'] || 0);

                  const plotData = [{
                    x: holdingPeriods,
                    type: 'histogram',
                    nbinsx: 10,
                    marker: {
                      color: '#2ca02c',
                      line: { color: 'white', width: 1 }
                    }
                  }];

                  const layout = {
                    title: {
                      text: 'Holding Period Distribution (Days)',
                      font: { color: 'white' }
                    },
                    xaxis: {
                      title: { text: 'Days Held', font: { color: 'white' } },
                      tickfont: { color: 'white' }
                    },
                    yaxis: {
                      title: { text: 'Frequency', font: { color: 'white' } },
                      tickfont: { color: 'white' }
                    },
                    paper_bgcolor: 'rgba(0,0,0,0.8)',
                    plot_bgcolor: 'rgba(0,0,0,0.8)',
                    font: { color: 'white' }
                  };

                  return (
                    <Plot
                      data={plotData}
                      layout={layout}
                      style={{ width: '100%', height: '300px' }}
                      useResizeHandler={true}
                      config={{ displayModeBar: false, displaylogo: false }}
                    />
                  );
                })()
              ) : (
                <div className="h-64 flex items-center justify-center">
                  <div className="text-center text-gray-500 dark:text-gray-400">
                    <BarChartIcon className="w-12 h-12 mx-auto mb-2" />
                    <p>No trade data available</p>
                  </div>
                </div>
              )}
            </div>

            {/* P&L Over Time */}
            <div className="rounded-lg border border-gray-200/50 dark:border-gray-700/50 bg-white/20 dark:bg-black/20 p-6">
              <div className="flex items-center mb-4">
                <TrendingUpIcon className="w-5 h-5 text-primary mr-2" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">P&L Over Time</h3>
              </div>
              {trades && trades.length > 0 ? (
                (() => {
                  const sortedTrades = trades.sort((a, b) =>
                    new Date(a['Exit Date'] || a.exit_date) - new Date(b['Exit Date'] || b.exit_date)
                  );

                  const plotData = [{
                    x: sortedTrades.map(trade => trade['Exit Date'] || trade.exit_date),
                    y: sortedTrades.map(trade => trade['Profit/Loss (%)'] || 0),
                    type: 'scatter',
                    mode: 'lines+markers',
                    line: { color: '#ff7f0e', width: 2 },
                    marker: { size: 4, color: '#ff7f0e' },
                    name: 'P&L (%)'
                  }];

                  const layout = {
                    title: {
                      text: 'P&L Trend Over Time',
                      font: { color: 'white' }
                    },
                    xaxis: {
                      title: { text: 'Exit Date', font: { color: 'white' } },
                      tickfont: { color: 'white' }
                    },
                    yaxis: {
                      title: { text: 'P&L (%)', font: { color: 'white' } },
                      tickfont: { color: 'white' }
                    },
                    paper_bgcolor: 'rgba(0,0,0,0.8)',
                    plot_bgcolor: 'rgba(0,0,0,0.8)',
                    font: { color: 'white' }
                  };

                  return (
                    <Plot
                      data={plotData}
                      layout={layout}
                      style={{ width: '100%', height: '300px' }}
                      useResizeHandler={true}
                      config={{ displayModeBar: false, displaylogo: false }}
                    />
                  );
                })()
              ) : (
                <div className="h-64 flex items-center justify-center">
                  <div className="text-center text-gray-500 dark:text-gray-400">
                    <LineChartIcon className="w-12 h-12 mx-auto mb-2" />
                    <p>No trade data available</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'position_sizing' && (
        <div className="space-y-6">
          {/* Position Sizing Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Position Size Distribution */}
            <div className="rounded-lg border border-gray-200/50 dark:border-gray-700/50 bg-white/20 dark:bg-black/20 p-6">
              <div className="flex items-center mb-4">
                <BarChartIcon className="w-5 h-5 text-primary mr-2" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Position Size Distribution</h3>
              </div>
              {trades && trades.length > 0 ? (
                (() => {
                  const positionSizes = trades.map(trade => trade['Position Value'] || 0);

                  const plotData = [{
                    x: positionSizes,
                    type: 'histogram',
                    nbinsx: 15,
                    marker: {
                      color: '#ff7f0e',
                      line: { color: 'white', width: 1 }
                    }
                  }];

                  const layout = {
                    title: {
                      text: 'Position Size Distribution ($)',
                      font: { color: 'white' }
                    },
                    xaxis: {
                      title: { text: 'Position Value ($)', font: { color: 'white' } },
                      tickfont: { color: 'white' },
                      tickformat: '$,.0f'
                    },
                    yaxis: {
                      title: { text: 'Frequency', font: { color: 'white' } },
                      tickfont: { color: 'white' }
                    },
                    paper_bgcolor: 'rgba(0,0,0,0.8)',
                    plot_bgcolor: 'rgba(0,0,0,0.8)',
                    font: { color: 'white' }
                  };

                  return (
                    <Plot
                      data={plotData}
                      layout={layout}
                      style={{ width: '100%', height: '300px' }}
                      useResizeHandler={true}
                      config={{ displayModeBar: false, displaylogo: false }}
                    />
                  );
                })()
              ) : (
                <div className="h-64 flex items-center justify-center">
                  <div className="text-center text-gray-500 dark:text-gray-400">
                    <BarChartIcon className="w-12 h-12 mx-auto mb-2" />
                    <p>No trade data available</p>
                  </div>
                </div>
              )}
            </div>

            {/* Position Size Over Time */}
            <div className="rounded-lg border border-gray-200/50 dark:border-gray-700/50 bg-white/20 dark:bg-black/20 p-6">
              <div className="flex items-center mb-4">
                <TrendingUpIcon className="w-5 h-5 text-primary mr-2" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Position Size Evolution</h3>
              </div>
              {trades && trades.length > 0 ? (
                (() => {
                  const sortedTrades = trades.sort((a, b) =>
                    new Date(a['Entry Date'] || a.entry_date) - new Date(b['Entry Date'] || b.entry_date)
                  );

                  const plotData = [{
                    x: sortedTrades.map(trade => trade['Entry Date'] || trade.entry_date),
                    y: sortedTrades.map(trade => trade['Position Value'] || 0),
                    type: 'scatter',
                    mode: 'lines+markers',
                    line: { color: '#2ca02c', width: 2 },
                    marker: { size: 4, color: '#2ca02c' },
                    name: 'Position Size ($)'
                  }];

                  const layout = {
                    title: {
                      text: 'Position Size Evolution Over Time',
                      font: { color: 'white' }
                    },
                    xaxis: {
                      title: { text: 'Entry Date', font: { color: 'white' } },
                      tickfont: { color: 'white' }
                    },
                    yaxis: {
                      title: { text: 'Position Value ($)', font: { color: 'white' } },
                      tickfont: { color: 'white' },
                      tickformat: '$,.0f'
                    },
                    paper_bgcolor: 'rgba(0,0,0,0.8)',
                    plot_bgcolor: 'rgba(0,0,0,0.8)',
                    font: { color: 'white' }
                  };

                  return (
                    <Plot
                      data={plotData}
                      layout={layout}
                      style={{ width: '100%', height: '300px' }}
                      useResizeHandler={true}
                      config={{ displayModeBar: false, displaylogo: false }}
                    />
                  );
                })()
              ) : (
                <div className="h-64 flex items-center justify-center">
                  <div className="text-center text-gray-500 dark:text-gray-400">
                    <LineChartIcon className="w-12 h-12 mx-auto mb-2" />
                    <p>No trade data available</p>
                  </div>
                </div>
              )}
            </div>

            {/* Position Size Statistics */}
            <div className="rounded-lg border border-gray-200/50 dark:border-gray-700/50 bg-white/20 dark:bg-black/20 p-6">
              <div className="flex items-center mb-4">
                <AssessmentIcon className="w-5 h-5 text-primary mr-2" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Position Size Statistics</h3>
              </div>
              {trades && trades.length > 0 ? (
                (() => {
                  const positionSizes = trades.map(trade => trade['Position Value'] || 0);
                  const avgPosition = positionSizes.reduce((a, b) => a + b, 0) / positionSizes.length;
                  const maxPosition = Math.max(...positionSizes);
                  const minPosition = Math.min(...positionSizes);
                  const stdDev = Math.sqrt(
                    positionSizes.reduce((sum, size) => sum + Math.pow(size - avgPosition, 2), 0) / positionSizes.length
                  );

                  return (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                        <div className="text-sm text-gray-600 dark:text-gray-400">Average Position</div>
                        <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          ${avgPosition.toLocaleString()}
                        </div>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                        <div className="text-sm text-gray-600 dark:text-gray-400">Max Position</div>
                        <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          ${maxPosition.toLocaleString()}
                        </div>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                        <div className="text-sm text-gray-600 dark:text-gray-400">Min Position</div>
                        <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          ${minPosition.toLocaleString()}
                        </div>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                        <div className="text-sm text-gray-600 dark:text-gray-400">Position Std Dev</div>
                        <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          ${stdDev.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Average Position</div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">N/A</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Max Position</div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">N/A</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Min Position</div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">N/A</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Position Std Dev</div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">N/A</div>
                  </div>
                </div>
              )}
            </div>

            {/* Position Size vs Performance */}
            <div className="rounded-lg border border-gray-200/50 dark:border-gray-700/50 bg-white/20 dark:bg-black/20 p-6">
              <div className="flex items-center mb-4">
                <ShowChartIcon className="w-5 h-5 text-primary mr-2" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Position Size vs Performance</h3>
              </div>
              {trades && trades.length > 0 ? (
                (() => {
                  const plotData = [{
                    x: trades.map(trade => trade['Position Value'] || 0),
                    y: trades.map(trade => trade['Profit/Loss (%)'] || 0),
                    type: 'scatter',
                    mode: 'markers',
                    marker: {
                      size: 8,
                      color: trades.map(trade => trade['Profit/Loss (%)'] || 0),
                      colorscale: 'RdYlGn',
                      showscale: true,
                      colorbar: {
                        title: 'P&L (%)',
                        titleside: 'right'
                      }
                    },
                    text: trades.map(trade => `${trade.Ticker}: $${(trade['Position Value'] || 0).toLocaleString()}`),
                    hovertemplate: '<b>Ticker:</b> %{text}<br><b>Position Size:</b> $%{x:,.0f}<br><b>P&L:</b> %{y:.2f}%<extra></extra>'
                  }];

                  const layout = {
                    title: {
                      text: 'Position Size vs Performance Correlation',
                      font: { color: 'white' }
                    },
                    xaxis: {
                      title: { text: 'Position Value ($)', font: { color: 'white' } },
                      tickfont: { color: 'white' },
                      tickformat: '$,.0f'
                    },
                    yaxis: {
                      title: { text: 'P&L (%)', font: { color: 'white' } },
                      tickfont: { color: 'white' }
                    },
                    paper_bgcolor: 'rgba(0,0,0,0.8)',
                    plot_bgcolor: 'rgba(0,0,0,0.8)',
                    font: { color: 'white' }
                  };

                  return (
                    <Plot
                      data={plotData}
                      layout={layout}
                      style={{ width: '100%', height: '300px' }}
                      useResizeHandler={true}
                      config={{ displayModeBar: false, displaylogo: false }}
                    />
                  );
                })()
              ) : (
                <div className="h-64 flex items-center justify-center">
                  <div className="text-center text-gray-500 dark:text-gray-400">
                    <ScatterIcon className="w-12 h-12 mx-auto mb-2" />
                    <p>No trade data available</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'monte_carlo' && (
        <div className="space-y-6">
          {/* Monte Carlo Simulation */}
          <div className="rounded-lg border border-gray-200/50 dark:border-gray-700/50 bg-white/20 dark:bg-black/20 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <CasinoIcon className="w-5 h-5 text-primary mr-2" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Monte Carlo Risk Simulation</h3>
              </div>
              <Button variant="contained" startIcon={<PlayIcon />}>
                Run Simulation
              </Button>
            </div>
            
            {/* Simulation Controls */}
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800/30 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Simulation Parameters</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormControl fullWidth>
                  <InputLabel>Number of Simulations</InputLabel>
                  <Select defaultValue="1000">
                    <MenuItem value="500">500</MenuItem>
                    <MenuItem value="1000">1,000</MenuItem>
                    <MenuItem value="2000">2,000</MenuItem>
                    <MenuItem value="5000">5,000</MenuItem>
                  </Select>
                </FormControl>
                <FormControl fullWidth>
                  <InputLabel>Future Trades to Simulate</InputLabel>
                  <Select defaultValue="50">
                    <MenuItem value="25">25</MenuItem>
                    <MenuItem value="50">50</MenuItem>
                    <MenuItem value="100">100</MenuItem>
                    <MenuItem value="200">200</MenuItem>
                  </Select>
                </FormControl>
                <FormControl fullWidth>
                  <InputLabel>Confidence Level</InputLabel>
                  <Select defaultValue="95">
                    <MenuItem value="80">80%</MenuItem>
                    <MenuItem value="90">90%</MenuItem>
                    <MenuItem value="95">95%</MenuItem>
                    <MenuItem value="99">99%</MenuItem>
                  </Select>
                </FormControl>
              </div>
            </div>
            
            {/* Simulation Results */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Return Distribution */}
              <div className="h-80 bg-gray-50 dark:bg-gray-800/30 rounded-lg p-4 flex items-center justify-center">
                <div className="text-center text-gray-500 dark:text-gray-400">
                  <BarChartIcon className="w-12 h-12 mx-auto mb-2" />
                  <p>Return distribution histogram</p>
                  <p className="text-sm mt-1">Shows probability of different outcomes</p>
                </div>
              </div>
              
              {/* Risk Metrics */}
              <div className="space-y-4">
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="text-sm font-medium text-green-700 dark:text-green-300">Probability of Profit</div>
                  <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                    {performance_metrics?.prob_profit ? `${(performance_metrics.prob_profit * 100).toFixed(1)}%` : 'N/A'}
                  </div>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="text-sm font-medium text-red-700 dark:text-red-300">Probability of Loss</div>
                  <div className="text-2xl font-bold text-red-900 dark:text-red-100">
                    {performance_metrics?.prob_loss ? `${(performance_metrics.prob_loss * 100).toFixed(1)}%` : 'N/A'}
                  </div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                  <div className="text-sm font-medium text-purple-700 dark:text-purple-300">Value at Risk (95%)</div>
                  <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                    {performance_metrics?.var_95 ? `${performance_metrics.var_95.toFixed(2)}%` : 'N/A'}
                  </div>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                  <div className="text-sm font-medium text-orange-700 dark:text-orange-300">Expected Return</div>
                  <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                    {performance_metrics?.expected_return ? `${performance_metrics.expected_return.toFixed(2)}%` : 'N/A'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'leverage_metrics' && (
        <div className="space-y-6">
          {/* Leverage Metrics Dashboard */}
          <div className="rounded-lg border border-gray-200/50 dark:border-gray-700/50 bg-white/20 dark:bg-black/20 p-6">
            <div className="flex items-center mb-4">
              <BalanceIcon className="w-5 h-5 text-primary mr-2" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Leverage Usage & Risk Dashboard</h3>
            </div>

            {/* Key Leverage Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="text-sm font-medium text-blue-700 dark:text-blue-300">Average Leverage</div>
                <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {trades && trades.length > 0 ? (() => {
                    const leverages = trades.map(trade => {
                      const positionValue = trade['Position Value'] || 0;
                      const portfolioValue = trade['Portfolio Value'] || 0;
                      return portfolioValue > 0 ? positionValue / portfolioValue : 0;
                    });
                    const avgLeverage = leverages.reduce((a, b) => a + b, 0) / leverages.length;
                    return `${avgLeverage.toFixed(2)}x`;
                  })() : 'N/A'}
                </div>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="text-sm font-medium text-red-700 dark:text-red-300">Maximum Leverage</div>
                <div className="text-2xl font-bold text-red-900 dark:text-red-100">
                  {trades && trades.length > 0 ? (() => {
                    const leverages = trades.map(trade => {
                      const positionValue = trade['Position Value'] || 0;
                      const portfolioValue = trade['Portfolio Value'] || 0;
                      return portfolioValue > 0 ? positionValue / portfolioValue : 0;
                    });
                    const maxLeverage = Math.max(...leverages);
                    return `${maxLeverage.toFixed(2)}x`;
                  })() : 'N/A'}
                </div>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="text-sm font-medium text-yellow-700 dark:text-yellow-300">Leverage Risk Score</div>
                <div className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                  {trades && trades.length > 0 ? (() => {
                    const leverages = trades.map(trade => {
                      const positionValue = trade['Position Value'] || 0;
                      const portfolioValue = trade['Portfolio Value'] || 0;
                      return portfolioValue > 0 ? positionValue / portfolioValue : 0;
                    });
                    const highRiskTrades = leverages.filter(l => l > 2).length;
                    const riskScore = (highRiskTrades / leverages.length) * 100;
                    return riskScore.toFixed(2);
                  })() : 'N/A'}
                </div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="text-sm font-medium text-green-700 dark:text-green-300">Leverage-Performance Correlation</div>
                <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {trades && trades.length > 0 ? (() => {
                    const leverages = trades.map(trade => {
                      const positionValue = trade['Position Value'] || 0;
                      const portfolioValue = trade['Portfolio Value'] || 0;
                      return portfolioValue > 0 ? positionValue / portfolioValue : 0;
                    });
                    const performances = trades.map(trade => trade['Profit/Loss (%)'] || 0);

                    const correlation = leverages.reduce((sum, l, i) => {
                      const meanL = leverages.reduce((a, b) => a + b, 0) / leverages.length;
                      const meanP = performances.reduce((a, b) => a + b, 0) / performances.length;
                      return sum + (l - meanL) * (performances[i] - meanP);
                    }, 0) / Math.sqrt(
                      leverages.reduce((sum, l) => sum + Math.pow(l - leverages.reduce((a, b) => a + b, 0) / leverages.length, 2), 0) *
                      performances.reduce((sum, p) => sum + Math.pow(p - performances.reduce((a, b) => a + b, 0) / performances.length, 2), 0)
                    );
                    return correlation.toFixed(3);
                  })() : 'N/A'}
                </div>
              </div>
            </div>

            {/* Leverage Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rounded-lg border border-gray-200/50 dark:border-gray-700/50 bg-white/20 dark:bg-black/20 p-6">
                <div className="flex items-center mb-4">
                  <BarChartIcon className="w-5 h-5 text-primary mr-2" />
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Leverage Distribution</h4>
                </div>
                {trades && trades.length > 0 ? (
                  (() => {
                    const leverages = trades.map(trade => {
                      const positionValue = trade['Position Value'] || 0;
                      const portfolioValue = trade['Portfolio Value'] || 0;
                      return portfolioValue > 0 ? positionValue / portfolioValue : 0;
                    });

                    const plotData = [{
                      x: leverages,
                      type: 'histogram',
                      nbinsx: 10,
                      marker: {
                        color: '#d62728',
                        line: { color: 'white', width: 1 }
                      }
                    }];

                    const layout = {
                      title: {
                        text: 'Leverage Distribution',
                        font: { color: 'white' }
                      },
                      xaxis: {
                        title: { text: 'Leverage (x)', font: { color: 'white' } },
                        tickfont: { color: 'white' }
                      },
                      yaxis: {
                        title: { text: 'Frequency', font: { color: 'white' } },
                        tickfont: { color: 'white' }
                      },
                      paper_bgcolor: 'rgba(0,0,0,0.8)',
                      plot_bgcolor: 'rgba(0,0,0,0.8)',
                      font: { color: 'white' }
                    };

                    return (
                      <Plot
                        data={plotData}
                        layout={layout}
                        style={{ width: '100%', height: '300px' }}
                        useResizeHandler={true}
                        config={{ displayModeBar: false, displaylogo: false }}
                      />
                    );
                  })()
                ) : (
                  <div className="h-64 flex items-center justify-center">
                    <div className="text-center text-gray-500 dark:text-gray-400">
                      <BarChartIcon className="w-12 h-12 mx-auto mb-2" />
                      <p>No trade data available</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Leverage Timeline */}
              <div className="rounded-lg border border-gray-200/50 dark:border-gray-700/50 bg-white/20 dark:bg-black/20 p-6">
                <div className="flex items-center mb-4">
                  <LineChartIcon className="w-5 h-5 text-primary mr-2" />
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Leverage Usage Over Time</h4>
                </div>
                {trades && trades.length > 0 ? (
                  (() => {
                    const sortedTrades = trades.sort((a, b) =>
                      new Date(a['Entry Date'] || a.entry_date) - new Date(b['Entry Date'] || b.entry_date)
                    );

                    const plotData = [{
                      x: sortedTrades.map(trade => trade['Entry Date'] || trade.entry_date),
                      y: sortedTrades.map(trade => {
                        const positionValue = trade['Position Value'] || 0;
                        const portfolioValue = trade['Portfolio Value'] || 0;
                        return portfolioValue > 0 ? positionValue / portfolioValue : 0;
                      }),
                      type: 'scatter',
                      mode: 'lines+markers',
                      line: { color: '#ff7f0e', width: 2 },
                      marker: { size: 4, color: '#ff7f0e' },
                      name: 'Leverage (x)'
                    }];

                    const layout = {
                      title: {
                        text: 'Leverage Usage Timeline',
                        font: { color: 'white' }
                      },
                      xaxis: {
                        title: { text: 'Entry Date', font: { color: 'white' } },
                        tickfont: { color: 'white' }
                      },
                      yaxis: {
                        title: { text: 'Leverage (x)', font: { color: 'white' } },
                        tickfont: { color: 'white' }
                      },
                      paper_bgcolor: 'rgba(0,0,0,0.8)',
                      plot_bgcolor: 'rgba(0,0,0,0.8)',
                      font: { color: 'white' }
                    };

                    return (
                      <Plot
                        data={plotData}
                        layout={layout}
                        style={{ width: '100%', height: '300px' }}
                        useResizeHandler={true}
                        config={{ displayModeBar: false, displaylogo: false }}
                      />
                    );
                  })()
                ) : (
                  <div className="h-64 flex items-center justify-center">
                    <div className="text-center text-gray-500 dark:text-gray-400">
                      <LineChartIcon className="w-12 h-12 mx-auto mb-2" />
                      <p>No trade data available</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Leverage Risk Assessment */}
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800/30 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Leverage Risk Assessment</h4>
              {trades && trades.length > 0 ? (
                (() => {
                  const leverages = trades.map(trade => {
                    const positionValue = trade['Position Value'] || 0;
                    const portfolioValue = trade['Portfolio Value'] || 0;
                    return portfolioValue > 0 ? positionValue / portfolioValue : 0;
                  });

                  const safeTrades = leverages.filter(l => l <= 2).length;
                  const highRiskTrades = leverages.filter(l => l > 2 && l <= 3).length;
                  const extremeRiskTrades = leverages.filter(l => l > 3).length;

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {safeTrades}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Safe Trades (≤2x)</div>
                        <div className="text-xs text-gray-500 dark:text-gray-500">
                          {((safeTrades / leverages.length) * 100).toFixed(1)}%
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">
                          {highRiskTrades}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">High Risk (2x-3x)</div>
                        <div className="text-xs text-gray-500 dark:text-gray-500">
                          {((highRiskTrades / leverages.length) * 100).toFixed(1)}%
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">
                          {extremeRiskTrades}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Extreme Risk (&gt;3x)</div>
                        <div className="text-xs text-gray-500 dark:text-gray-500">
                          {((extremeRiskTrades / leverages.length) * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">0</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Safe Trades (≤2x)</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">0</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">High Risk (2x-3x)</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">0</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Extreme Risk (&gt;3x)</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
        </>
      )}

      {/* Optimization Results */}
      {shouldShowOptimization && (
        <>
        <div className="space-y-6">
          {/* Best Parameters Summary */}
          <div className="rounded-lg border border-gray-200/50 dark:border-gray-700/50 bg-white/20 dark:bg-black/20 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Best Parameters</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="text-sm font-medium text-green-700 dark:text-green-300">Holding Period</div>
                <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {(results.optimization_results?.best_params?.holding_period || results.best_params?.holding_period) || 'N/A'}
                </div>
                <div className="text-xs text-green-600 dark:text-green-400">days</div>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="text-sm font-medium text-red-700 dark:text-red-300">Stop Loss</div>
                <div className="text-2xl font-bold text-red-900 dark:text-red-100">
                  {(results.optimization_results?.best_params?.stop_loss || results.best_params?.stop_loss) || 'N/A'}%
                </div>
                <div className="text-xs text-red-600 dark:text-red-400">percentage</div>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="text-sm font-medium text-blue-700 dark:text-blue-300">Take Profit</div>
                <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {(results.optimization_results?.best_params?.take_profit || results.best_params?.take_profit) ? `${(results.optimization_results?.best_params?.take_profit || results.best_params?.take_profit)}%` : 'No Limit'}
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-400">target</div>
              </div>
            </div>
          </div>

          {/* Best Performance Summary */}
          <div className="rounded-lg border border-gray-200/50 dark:border-gray-700/50 bg-white/20 dark:bg-black/20 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Best Performance</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                <div className="text-sm font-medium text-purple-700 dark:text-purple-300">Total Return</div>
                <div className="text-xl font-bold text-purple-900 dark:text-purple-100">
                  {(results.optimization_results?.best_performance?.['Total Return (%)'] || results.best_performance?.['Total Return (%)'] || results.optimization_results?.best_performance?.total_return || results.best_performance?.total_return || results.optimization_results?.total_return || results.total_return) ?
                    `${(results.optimization_results?.best_performance?.['Total Return (%)'] || results.best_performance?.['Total Return (%)'] || results.optimization_results?.best_performance?.total_return || results.best_performance?.total_return || results.optimization_results?.total_return || results.total_return).toFixed(2)}%` : 'N/A'}
                </div>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="text-sm font-medium text-yellow-700 dark:text-yellow-300">Win Rate</div>
                <div className="text-xl font-bold text-yellow-900 dark:text-yellow-100">
                  {(results.optimization_results?.best_performance?.['Win Rate (%)'] || results.best_performance?.['Win Rate (%)'] || results.optimization_results?.best_performance?.win_rate || results.best_performance?.win_rate || results.summary?.win_rate || results.optimization_results?.win_rate || results.win_rate) ?
                    `${(results.optimization_results?.best_performance?.['Win Rate (%)'] || results.best_performance?.['Win Rate (%)'] || results.optimization_results?.best_performance?.win_rate || results.best_performance?.win_rate || results.summary?.win_rate || results.optimization_results?.win_rate || results.win_rate).toFixed(1)}%` : 'N/A'}
                </div>
              </div>
              <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4">
                <div className="text-sm font-medium text-indigo-700 dark:text-indigo-300">Sharpe Ratio</div>
                <div className="text-xl font-bold text-indigo-900 dark:text-indigo-100">
                  {(results.optimization_results?.best_performance?.['Sharpe Ratio'] || results.best_performance?.['Sharpe Ratio'] || results.optimization_results?.best_performance?.sharpe_ratio || results.best_performance?.sharpe_ratio || results.optimization_results?.sharpe_ratio || results.sharpe_ratio) ?
                    (results.optimization_results?.best_performance?.['Sharpe Ratio'] || results.best_performance?.['Sharpe Ratio'] || results.optimization_results?.best_performance?.sharpe_ratio || results.best_performance?.sharpe_ratio || results.optimization_results?.sharpe_ratio || results.sharpe_ratio).toFixed(3) : 'N/A'}
                </div>
              </div>
              <div className="bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-800 rounded-lg p-4">
                <div className="text-sm font-medium text-pink-700 dark:text-pink-300">Max Drawdown</div>
                <div className="text-xl font-bold text-pink-900 dark:text-pink-100">
                  {(results.optimization_results?.best_performance?.['Max Drawdown (%)'] || results.best_performance?.['Max Drawdown (%)'] || results.optimization_results?.best_performance?.max_drawdown || results.best_performance?.max_drawdown || results.optimization_results?.max_drawdown || results.max_drawdown) ?
                    `${(results.optimization_results?.best_performance?.['Max Drawdown (%)'] || results.best_performance?.['Max Drawdown (%)'] || results.optimization_results?.best_performance?.max_drawdown || results.best_performance?.max_drawdown || results.optimization_results?.max_drawdown || results.max_drawdown).toFixed(2)}%` : 'N/A'}
                </div>
              </div>
            </div>
          </div>

          {/* Optimization Statistics */}
          <div className="rounded-lg border border-gray-200/50 dark:border-gray-700/50 bg-white/20 dark:bg-black/20 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Optimization Statistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Combinations</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {(results.optimization_results?.optimization_stats?.total_combinations || results.optimization_stats?.total_combinations) || 'N/A'}
                </div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="text-sm font-medium text-green-700 dark:text-green-300">Successful</div>
                <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {(results.optimization_results?.optimization_stats?.successful_combinations || results.optimization_stats?.successful_combinations) || 'N/A'}
                </div>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="text-sm font-medium text-red-700 dark:text-red-300">Failed</div>
                <div className="text-2xl font-bold text-red-900 dark:text-red-100">
                  {(results.optimization_results?.optimization_stats?.failed_combinations || results.optimization_stats?.failed_combinations) || 'N/A'}
                </div>
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              Execution Time: {results.execution_time?.toFixed(2)}s |
              Signals Processed: {results.signals_processed || 'N/A'}
            </div>
          </div>

          {/* All Results Table */}
          <div className="rounded-lg border border-gray-200/50 dark:border-gray-700/50 bg-white/20 dark:bg-black/20 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">All Parameter Combinations</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800/50">
                  <tr>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-300"
                      onClick={() => handleOptimizationRequestSort('holding_period')}
                    >
                      Holding Period
                      {optimizationOrderBy === 'holding_period' && (
                        <span className="ml-1">
                          {optimizationOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-300"
                      onClick={() => handleOptimizationRequestSort('stop_loss')}
                    >
                      Stop Loss
                      {optimizationOrderBy === 'stop_loss' && (
                        <span className="ml-1">
                          {optimizationOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-300"
                      onClick={() => handleOptimizationRequestSort('take_profit')}
                    >
                      Take Profit
                      {optimizationOrderBy === 'take_profit' && (
                        <span className="ml-1">
                          {optimizationOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-300"
                      onClick={() => handleOptimizationRequestSort('total_return')}
                    >
                      Total Return
                      {optimizationOrderBy === 'total_return' && (
                        <span className="ml-1">
                          {optimizationOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-300"
                      onClick={() => handleOptimizationRequestSort('win_rate')}
                    >
                      Win Rate
                      {optimizationOrderBy === 'win_rate' && (
                        <span className="ml-1">
                          {optimizationOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-300"
                      onClick={() => handleOptimizationRequestSort('sharpe_ratio')}
                    >
                      Sharpe Ratio
                      {optimizationOrderBy === 'sharpe_ratio' && (
                        <span className="ml-1">
                          {optimizationOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-300"
                      onClick={() => handleOptimizationRequestSort('max_drawdown')}
                    >
                      Max Drawdown
                      {optimizationOrderBy === 'max_drawdown' && (
                        <span className="ml-1">
                          {optimizationOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-300"
                      onClick={() => handleOptimizationRequestSort('total_trades')}
                    >
                      Total Trades
                      {optimizationOrderBy === 'total_trades' && (
                        <span className="ml-1">
                          {optimizationOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900/50 divide-y divide-gray-200 dark:divide-gray-700">
                  {getSortedOptimizationResults().slice(0, 20).map((result, index) => (
                    <tr key={index} className={index === 0 ? 'bg-green-50 dark:bg-green-900/10' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                        {result.params?.holding_period || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {result.params?.stop_loss !== undefined ? `${result.params.stop_loss}%` : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {result.params?.take_profit !== undefined ? `${result.params.take_profit}%` : 'None'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {(() => {
                          const totalReturn = result.total_return || result['Total Return (%)'] || result.total_return_pct || result.return_pct;
                          return totalReturn ? `${Number(totalReturn).toFixed(2)}%` : 'N/A';
                        })()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {(() => {
                          const winRate = result.win_rate || result['Win Rate (%)'] || result.win_rate_pct || result.win_rate_percentage;
                          return winRate ? `${Number(winRate).toFixed(1)}%` : 'N/A';
                        })()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {result.sharpe_ratio ? result.sharpe_ratio.toFixed(3) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {(() => {
                          const maxDrawdown = result.max_drawdown || result['Max Drawdown (%)'] || result.max_drawdown_pct || result.drawdown;
                          return maxDrawdown ? `${Number(maxDrawdown).toFixed(2)}%` : 'N/A';
                        })()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {(() => {
                          const totalTrades = result.total_trades || result['Total Trades'] || result.trades || result.num_trades;
                          return totalTrades || 'N/A';
                        })()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {(results.optimization_results?.all_results || results.all_results) && (results.optimization_results?.all_results || results.all_results).length > 20 && (
              <div className="mt-4 text-sm text-gray-500 dark:text-gray-400 text-center">
                Showing first 20 of {(results.optimization_results?.all_results || results.all_results).length} results
              </div>
            )}
          </div>
        </div>
        </>
      )}

      {/* Loading overlay */}
      {loading && (
        <div className="fixed inset-0 bg-white/80 dark:bg-black/80 flex items-center justify-center z-50">
          <CircularProgress />
        </div>
      )}
    </div>
  );
};

export default BacktestResults;