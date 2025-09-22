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
  LineChart as LineChartIcon,
  TableChart as TableChartIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  Assessment as AssessmentIcon,
  ShowChart as ShowChartIcon
} from '@mui/icons-material';
import Plot from 'react-plotly.js';
import { format } from 'date-fns';
import KeyMetrics from './KeyMetrics';
import TradeLogTable from './TradeLogTable';
import EquityCurveChart from './EquityCurveChart';

const BacktestResults = ({ results, onExport, onFilterChange }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Backtest Results</h2>
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

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex space-x-1">
          <button
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === 'overview'
                ? 'text-primary border-b-2 border-primary bg-white/50 dark:bg-black/50'
                : 'text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === 'trades'
                ? 'text-primary border-b-2 border-primary bg-white/50 dark:bg-black/50'
                : 'text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
            onClick={() => setActiveTab('trades')}
          >
            Trades
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === 'analytics'
                ? 'text-primary border-b-2 border-primary bg-white/50 dark:bg-black/50'
                : 'text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
            onClick={() => setActiveTab('analytics')}
          >
            Analytics
          </button>
          {(optimization_results || results?.best_params) && (
            <button
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === 'optimization'
                  ? 'text-primary border-b-2 border-primary bg-white/50 dark:bg-black/50'
                  : 'text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
              onClick={() => setActiveTab('optimization')}
            >
              Optimization
            </button>
          )}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <KeyMetrics metrics={performance_metrics} />
          <EquityCurveChart equityCurve={equity_curve} initialCapital={initial_capital} />
        </div>
      )}

      {activeTab === 'trades' && (
        <div>
          <TradeLogTable trades={trades} />
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="rounded-lg border border-gray-200/50 dark:border-gray-700/50 bg-white/20 dark:bg-black/20 p-6">
            <div className="flex items-center mb-4">
              <BarChartIcon className="w-5 h-5 text-primary mr-2" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Trade Return Distribution</h3>
            </div>
            {/* <TradeDistributionChart /> */}
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              Trade distribution chart would be displayed here
            </div>
          </div>
          <div className="rounded-lg border border-gray-200/50 dark:border-gray-700/50 bg-white/20 dark:bg-black/20 p-6">
            <div className="flex items-center mb-4">
              <DateIcon className="w-5 h-5 text-primary mr-2" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Monthly Returns</h3>
            </div>
            {/* <MonthlyReturnsChart /> */}
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              Monthly returns chart would be displayed here
            </div>
          </div>
        </div>
      )}

      {activeTab === 'optimization' && (results?.optimization_results || results?.best_params) && (
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Parameters
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Total Return
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Win Rate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Sharpe Ratio
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Max Drawdown
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Total Trades
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900/50 divide-y divide-gray-200 dark:divide-gray-700">
                  {(results.optimization_results?.all_results || results.all_results)?.slice(0, 20).map((result, index) => (
                    <tr key={index} className={index === 0 ? 'bg-green-50 dark:bg-green-900/10' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                        <div className="flex flex-col">
                          <span>HP: {result.params?.holding_period || 'N/A'}</span>
                          <span>SL: {result.params?.stop_loss || 'N/A'}%</span>
                          <span>TP: {result.params?.take_profit ? `${result.params.take_profit}%` : 'None'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {result.total_return ? `${result.total_return.toFixed(2)}%` : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {result.win_rate ? `${result.win_rate.toFixed(1)}%` : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {result.sharpe_ratio ? result.sharpe_ratio.toFixed(3) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {result.max_drawdown ? `${result.max_drawdown.toFixed(2)}%` : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {result.total_trades || 'N/A'}
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