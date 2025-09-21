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
          {optimization_results && (
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

      {activeTab === 'optimization' && optimization_results && (
        <div className="rounded-lg border border-gray-200/50 dark:border-gray-700/50 bg-white/20 dark:bg-black/20 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Parameter Optimization Results</h3>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-blue-700 dark:text-blue-300">
              Optimization results would be displayed here with parameter combinations and their performance metrics.
            </p>
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