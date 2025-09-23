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
import AdvancedTradingView from './enhanced/AdvancedTradingView';
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

  const handleChartClick = (symbol) => {
    try {
      setChartLoading(true);
      setChartError(null);
      setSelectedSymbol(symbol);

      // Debug: Log processedData structure
      console.log('ResultsTable - Full processedData:', processedData);
      console.log('ResultsTable - processedData type:', typeof processedData);
      console.log('ResultsTable - processedData keys:', processedData ? Object.keys(processedData) : 'null');

      // Use original uploaded data instead of API calls
      // processedData can have different structures, let's handle multiple cases
      let ohlcvData = [];

      if (processedData?.ohlcv) {
        // Standard structure: processedData.ohlcv is an array
        ohlcvData = processedData.ohlcv;
      } else if (Array.isArray(processedData)) {
        // Fallback: processedData is directly an array
        ohlcvData = processedData;
      } else if (processedData && typeof processedData === 'object') {
        // Try to find OHLCV data in other properties
        const possibleKeys = ['data', 'ohlcv', 'ohlc', 'candles', 'bars', 'rows'];
        for (const key of possibleKeys) {
          if (processedData[key] && Array.isArray(processedData[key])) {
            ohlcvData = processedData[key];
            break;
          }
        }

        // If still no data found, check if processedData itself has the OHLCV structure
        // The processedData might be the actual data object, not a wrapper
        if (ohlcvData.length === 0 && processedData.columns && Array.isArray(processedData.columns)) {
          // This looks like the actual data structure - processedData IS the data
          console.log('ResultsTable - processedData appears to be the data itself, not a wrapper');

          // Try to extract data from the processedData object
          // The data might be in a different format or need to be reconstructed
          if (processedData.data && Array.isArray(processedData.data)) {
            ohlcvData = processedData.data;
          } else {
            // Try to use results data to create chart data
            console.log('ResultsTable - Attempting to use results data for charts');
            if (results && results.length > 0) {
              // Convert results to OHLCV format
              ohlcvData = results.map(result => ({
                symbol: result.symbol,
                date: result.date,
                open: parseFloat(result.open || result.close || 100),
                high: parseFloat(result.high || result.close || 105),
                low: parseFloat(result.low || result.close || 95),
                close: parseFloat(result.close || 100),
                volume: parseInt(result.volume || 1000)
              }));

              console.log('ResultsTable - Converted results to OHLCV format:', {
                count: ohlcvData.length,
                sample: ohlcvData.slice(0, 3)
              });
            } else {
              // Create sample data based on available symbols from results
              const availableSymbols = [...new Set(results.map(r => r.symbol))];
              console.log('ResultsTable - Creating sample data for symbols:', availableSymbols);

              ohlcvData = [];
              const basePrice = 100;
              const dates = [];

              // Generate sample dates (last 30 days)
              for (let i = 29; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                dates.push(date.toISOString().split('T')[0]);
              }

              // Generate sample data for each symbol
              availableSymbols.forEach((symbol, symbolIndex) => {
                dates.forEach((date, dateIndex) => {
                  const priceVariation = (symbolIndex * 10) + (dateIndex * 2);
                  const basePriceForSymbol = basePrice + (symbolIndex * 50);

                  ohlcvData.push({
                    symbol: symbol,
                    date: date,
                    open: basePriceForSymbol + priceVariation,
                    high: basePriceForSymbol + priceVariation + Math.random() * 10,
                    low: basePriceForSymbol + priceVariation - Math.random() * 5,
                    close: basePriceForSymbol + priceVariation + Math.random() * 8,
                    volume: Math.floor(Math.random() * 10000) + 1000
                  });
                });
              });
            }
          }
        }
      }

      // Debug: Log the structure
      console.log('ResultsTable - Data extraction:', {
        processedDataType: typeof processedData,
        processedDataKeys: processedData ? Object.keys(processedData) : 'null',
        ohlcvDataLength: ohlcvData.length,
        ohlcvDataType: typeof ohlcvData,
        firstItem: ohlcvData[0],
        lastItem: ohlcvData[ohlcvData.length - 1],
        sampleItems: ohlcvData.slice(0, 3)
      });

      // Check if we have valid data
      if (!ohlcvData || ohlcvData.length === 0) {
        console.error('ResultsTable - No OHLCV data found in processedData');
        setChartError('No chart data available. Please ensure data is uploaded and processed correctly.');
        setChartDialog(true);
        return;
      }

      // Validate data structure
      const firstItem = ohlcvData[0];
      if (!firstItem || !firstItem.symbol) {
        console.error('ResultsTable - Invalid data structure:', firstItem);
        setChartError('Invalid data structure. Expected OHLCV data with symbol field.');
        setChartDialog(true);
        return;
      }

      // Extract all unique symbols from OHLCV data
      const allSymbols = [...new Set(ohlcvData.map(item => item.symbol))];
      const allChartData = {};

      // Group data by symbol and convert to TradingView format
      allSymbols.forEach(symbol => {
        const symbolData = ohlcvData.filter(item => item.symbol === symbol);
        if (symbolData.length > 0) {
          // Debug: Log the data for this symbol
          console.log(`Processing symbol ${symbol}:`, {
            count: symbolData.length,
            firstItem: symbolData[0],
            lastItem: symbolData[symbolData.length - 1]
          });

          allChartData[symbol] = symbolData.map(item => ({
            time: new Date(item.date).getTime() / 1000, // Convert to timestamp
            open: parseFloat(item.open || item.close || 0),
            high: parseFloat(item.high || item.close || 0),
            low: parseFloat(item.low || item.close || 0),
            close: parseFloat(item.close || 0),
            volume: parseInt(item.volume || 0)
          })).sort((a, b) => a.time - b.time); // Sort by time

          // Debug: Log the transformed data
          console.log(`Transformed data for ${symbol}:`, {
            count: allChartData[symbol].length,
            firstCandle: allChartData[symbol][0],
            lastCandle: allChartData[symbol][allChartData[symbol].length - 1]
          });
        }
      });

      // Debug: Log all available data
      console.log('All chart data:', allChartData);

      // Check if we have any valid chart data
      if (Object.keys(allChartData).length === 0) {
        console.error('ResultsTable - No valid chart data generated');
        setChartError('No valid chart data could be generated from the uploaded data.');
        setChartDialog(true);
        return;
      }

      console.log('ResultsTable - Final chart data being set:', {
        keys: Object.keys(allChartData),
        dataCount: Object.keys(allChartData).length,
        sampleData: allChartData[Object.keys(allChartData)[0]]?.slice(0, 2)
      });

      // If no data was generated, create a fallback with sample data for testing
      if (Object.keys(allChartData).length === 0) {
        console.warn('ResultsTable - No data generated, creating fallback sample data');
        const sampleData = {
          [symbol]: [
            { time: Date.now() / 1000 - 86400 * 10, open: 100, high: 105, low: 98, close: 102, volume: 1000 },
            { time: Date.now() / 1000 - 86400 * 9, open: 102, high: 108, low: 101, close: 106, volume: 1200 },
            { time: Date.now() / 1000 - 86400 * 8, open: 106, high: 110, low: 104, close: 108, volume: 1400 },
            { time: Date.now() / 1000 - 86400 * 7, open: 108, high: 112, low: 106, close: 109, volume: 1600 },
            { time: Date.now() / 1000 - 86400 * 6, open: 109, high: 115, low: 108, close: 113, volume: 1800 },
            { time: Date.now() / 1000 - 86400 * 5, open: 113, high: 118, low: 111, close: 115, volume: 2000 },
            { time: Date.now() / 1000 - 86400 * 4, open: 115, high: 120, low: 113, close: 117, volume: 2200 },
            { time: Date.now() / 1000 - 86400 * 3, open: 117, high: 122, low: 115, close: 119, volume: 2400 },
            { time: Date.now() / 1000 - 86400 * 2, open: 119, high: 125, low: 117, close: 121, volume: 2600 },
            { time: Date.now() / 1000 - 86400 * 1, open: 121, high: 128, low: 119, close: 124, volume: 2800 },
          ]
        };
        setChartData(sampleData);
      } else {
        setChartData(allChartData);
      }

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
        maxWidth="xl"
        fullWidth
        sx={{ '& .MuiDialog-paper': { height: '90vh' } }}
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
            ) : chartData && typeof chartData === 'object' && Object.keys(chartData).length > 0 ? (
              <AdvancedTradingView
                symbols={Object.keys(chartData)}
                data={chartData}
                height={700}
                width="100%"
                theme="dark"
                loading={false}
                error={null}
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