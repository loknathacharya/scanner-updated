import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Button,
  Grid,
  Card,
  CardContent,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  CircularProgress
} from '@mui/material';
import {
  Download as DownloadIcon,
  Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon
} from '@mui/icons-material';
import TradingViewChart from './TradingViewChart';
import { transformOHLCVData } from '../utils/chartDataTransformer';

const ResultsTable = ({ results, processedData, apiBase }) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [order, setOrder] = useState('desc');
  const [orderBy, setOrderBy] = useState('date');
  const [selectedColumns, setSelectedColumns] = useState(['date', 'symbol', 'close', 'volume']);
  const [chartDialog, setChartDialog] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState('');
  const [chartData, setChartData] = useState([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [chartError, setChartError] = useState(null);

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleColumnChange = (event) => {
    setSelectedColumns(event.target.value);
  };

  const getComparator = (order, orderBy) => {
    return order === 'desc'
      ? (a, b) => descendingComparator(a, b, orderBy)
      : (a, b) => -descendingComparator(a, b, orderBy);
  };

  const descendingComparator = (a, b, orderBy) => {
    if (b[orderBy] < a[orderBy]) return -1;
    if (b[orderBy] > a[orderBy]) return 1;
    return 0;
  };

  const stableSort = (array, comparator) => {
    const stabilizedThis = array.map((el, index) => [el, index]);
    stabilizedThis.sort((a, b) => {
      const order = comparator(a[0], b[0]);
      if (order !== 0) return order;
      return a[1] - b[1];
    });
    return stabilizedThis.map((el) => el[0]);
  };

  const handleExport = async (format) => {
    try {
      const data = stableSort(results || [], getComparator(order, orderBy))
        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
      
      if (format === 'csv') {
        const csvContent = convertToCSV(data, selectedColumns);
        downloadFile(csvContent, 'scan_results.csv', 'text/csv');
      } else if (format === 'json') {
        const jsonContent = JSON.stringify(data, null, 2);
        downloadFile(jsonContent, 'scan_results.json', 'application/json');
      }
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  const convertToCSV = (data, columns) => {
    const headers = columns.join(',');
    const rows = data.map(row => 
      columns.map(col => {
        const value = row[col];
        return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
      }).join(',')
    );
    return [headers, ...rows].join('\n');
  };

  const downloadFile = (content, filename, contentType) => {
    const blob = new Blob([content], { type: contentType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const handleChartClick = async (symbol) => {
    try {
      setChartLoading(true);
      setChartError(null);
      setSelectedSymbol(symbol);

      // Fetch chart data from the API
      const response = await fetch(`${apiBase}/charts/${symbol}/ohlcv?timeframe=1D&limit=1000`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const chartResponse = await response.json();

      // Data is already in TradingView format from the API
      const chartData = chartResponse.data || [];

      setChartData(chartData);
      setChartDialog(true);
    } catch (error) {
      console.error('Chart error:', error);
      setChartError(error.message);
      setChartDialog(true);
    } finally {
      setChartLoading(false);
    }
  };

  const formatValue = (value, column) => {
    if (value === null || value === undefined) return '-';
    
    if (column.includes('price') || ['open', 'high', 'low', 'close'].includes(column)) {
      return typeof value === 'number' ? value.toFixed(2) : value;
    }
    
    if (column === 'volume') {
      return typeof value === 'number' ? value.toLocaleString() : value;
    }
    
    if (column.includes('date')) {
      return new Date(value).toLocaleDateString();
    }
    
    return value;
  };

  const getTrendIcon = (value, column) => {
    if (column.includes('return') || column.includes('change')) {
      if (value > 0) return <TrendingUpIcon color="success" fontSize="small" />;
      if (value < 0) return <TrendingDownIcon color="error" fontSize="small" />;
    }
    return null;
  };

  if (!results || results.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">
          No scan results yet. Please run a filter in the Build Filters tab.
        </Alert>
      </Box>
    );
  }

  const availableColumns = Object.keys(results[0] || {});
  const displayData = stableSort(results, getComparator(order, orderBy))
    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <>
      <div className="bg-background-light dark:bg-background-dark min-h-screen">
        <div className="mx-auto max-w-7xl py-10 px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Scan Results</h1>
            <p className="mt-1 text-gray-500 dark:text-gray-400">View and analyze your filtered financial data results.</p>
          </div>

          <div className="space-y-12">
            <div className="space-y-6 rounded-lg border border-gray-200/50 dark:border-gray-700/50 bg-white/20 dark:bg-black/20 p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Results Overview</h2>
                <div className="flex gap-2">
                  <button
                    className="rounded-lg bg-primary/20 dark:bg-primary/30 px-3 py-1.5 text-sm font-medium text-primary dark:text-primary hover:bg-primary/30 dark:hover:bg-primary/40"
                    onClick={() => handleExport('csv')}
                  >
                    Export CSV
                  </button>
                  <button
                    className="rounded-lg bg-primary/20 dark:bg-primary/30 px-3 py-1.5 text-sm font-medium text-primary dark:text-primary hover:bg-primary/30 dark:hover:bg-primary/40"
                    onClick={() => handleExport('json')}
                  >
                    Export JSON
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-6 rounded-lg border border-gray-200/50 dark:border-gray-700/50 bg-white/20 dark:bg-black/20 p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Showing {displayData.length} of {results.length} results
                </p>
                <select
                  className="block w-48 rounded-lg border-0 bg-background-light/50 dark:bg-background-dark/50 py-2 px-3 text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm"
                  multiple
                  value={selectedColumns}
                  onChange={handleColumnChange}
                  size={Math.min(6, availableColumns.length)}
                >
                  {availableColumns.map((column) => (
                    <option key={column} value={column}>
                      {column}
                    </option>
                  ))}
                </select>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      {selectedColumns.map((column) => (
                        <th key={column} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-300" onClick={() => handleRequestSort(column)}>
                          {column}
                          {orderBy === column && (
                            <span className="ml-1">
                              {order === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </th>
                      ))}
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {displayData.map((row, index) => (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        {selectedColumns.map((column) => (
                          <td key={column} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                            <div className="flex items-center gap-2">
                              {getTrendIcon(row[column], column)}
                              {formatValue(row[column], column)}
                            </div>
                          </td>
                        ))}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                          {row.symbol && (
                            <button
                              className="rounded-lg bg-primary/20 dark:bg-primary/30 px-2 py-1 text-xs font-medium text-primary dark:text-primary hover:bg-primary/30 dark:hover:bg-primary/40"
                              onClick={() => handleChartClick(row.symbol)}
                            >
                              Chart
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Page {page + 1} of {Math.ceil(results.length / rowsPerPage)}
                </div>
                <div className="flex gap-2">
                  <button
                    className="rounded-lg bg-gray-200 dark:bg-gray-700 px-3 py-1 text-sm font-medium text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
                    onClick={handleChangePage}
                    disabled={page === 0}
                  >
                    Previous
                  </button>
                  <select
                    className="block w-20 rounded-lg border-0 bg-background-light/50 dark:bg-background-dark/50 py-1 px-2 text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm"
                    value={rowsPerPage}
                    onChange={handleChangeRowsPerPage}
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <button
                    className="rounded-lg bg-gray-200 dark:bg-gray-700 px-3 py-1 text-sm font-medium text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
                    onClick={() => handleChangePage(page + 1)}
                    disabled={page >= Math.ceil(results.length / rowsPerPage) - 1}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-6 rounded-lg border border-gray-200/50 dark:border-gray-700/50 bg-white/20 dark:bg-black/20 p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Summary Statistics</h2>
              
              <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg border border-gray-200/50 dark:border-gray-700/50 bg-white/20 dark:bg-black/20 p-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Results</p>
                  <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{results.length}</p>
                </div>
                
                <div className="rounded-lg border border-gray-200/50 dark:border-gray-700/50 bg-white/20 dark:bg-black/20 p-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Unique Symbols</p>
                  <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{new Set(results.map(r => r.symbol)).size}</p>
                </div>
                
                <div className="rounded-lg border border-gray-200/50 dark:border-gray-700/50 bg-white/20 dark:bg-black/20 p-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Date Range</p>
                  <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                    {results.length > 0
                      ? `${new Date(Math.min(...results.map(r => new Date(r.date)))).toLocaleDateString()} - ${new Date(Math.max(...results.map(r => new Date(r.date)))).toLocaleDateString()}`
                      : 'N/A'
                    }
                  </p>
                </div>
                
                <div className="rounded-lg border border-gray-200/50 dark:border-gray-700/50 bg-white/20 dark:bg-black/20 p-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg Close Price</p>
                  <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                    {results.length > 0
                      ? `$${(results.reduce((sum, r) => sum + (r.close || 0), 0) / results.length).toFixed(2)}`
                      : 'N/A'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog
        open={chartDialog}
        onClose={() => setChartDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Chart for {selectedSymbol}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ height: '600px', width: '100%' }}>
            {chartLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <CircularProgress />
              </Box>
            ) : chartError ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <Typography color="error">Error loading chart: {chartError}</Typography>
              </Box>
            ) : chartData.length > 0 ? (
              <TradingViewChart
                data={chartData}
                symbol={selectedSymbol}
                chartType="candlestick"
                timeframe="1D"
                height={600}
                theme="dark"
              />
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <Typography>No chart data available</Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setChartDialog(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ResultsTable;