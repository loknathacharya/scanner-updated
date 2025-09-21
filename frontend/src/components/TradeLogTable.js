import React, { useState, useMemo } from 'react';
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
  Toolbar,
  Tooltip,
  IconButton
} from '@mui/material';
import { FilterList as FilterListIcon } from '@mui/icons-material';
import { formatCurrency, formatPercentage, formatDate } from '../utils/formatting';

const headCells = [
  { id: 'Ticker', numeric: false, disablePadding: false, label: 'Ticker' },
  { id: 'Signal Type', numeric: false, disablePadding: false, label: 'Signal Type' },
  { id: 'Entry Date', numeric: false, disablePadding: false, label: 'Entry Date' },
  { id: 'Entry Price', numeric: true, disablePadding: false, label: 'Entry Price' },
  { id: 'Exit Date', numeric: false, disablePadding: false, label: 'Exit Date' },
  { id: 'Exit Price', numeric: true, disablePadding: false, label: 'Exit Price' },
  { id: 'P&L ($)', numeric: true, disablePadding: false, label: 'P&L ($)' },
  { id: 'Profit/Loss (%)', numeric: true, disablePadding: false, label: 'P&L (%)' },
  { id: 'Exit Reason', numeric: false, disablePadding: false, label: 'Exit Reason' },
  { id: 'Days Held', numeric: true, disablePadding: false, label: 'Days Held' },
];

function EnhancedTableHead(props) {
  const { order, orderBy, onRequestSort } = props;
  const createSortHandler = (property) => (event) => {
    onRequestSort(event, property);
  };

  return (
    <TableHead>
      <TableRow>
        {headCells.map((headCell) => (
          <TableCell
            key={headCell.id}
            align={headCell.numeric ? 'right' : 'left'}
            padding={headCell.disablePadding ? 'none' : 'normal'}
            sortDirection={orderBy === headCell.id ? order : false}
          >
            <TableSortLabel
              active={orderBy === headCell.id}
              direction={orderBy === headCell.id ? order : 'asc'}
              onClick={createSortHandler(headCell.id)}
            >
              {headCell.label}
            </TableSortLabel>
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
}

const EnhancedTableToolbar = () => {
  return (
    <Toolbar
      sx={{
        pl: { sm: 2 },
        pr: { xs: 1, sm: 1 },
      }}
    >
      <Typography
        sx={{ flex: '1 1 100%' }}
        variant="h6"
        id="tableTitle"
        component="div"
      >
        Trade Log
      </Typography>

      <Tooltip title="Filter list">
        <IconButton>
          <FilterListIcon />
        </IconButton>
      </Tooltip>
    </Toolbar>
  );
};

function descendingComparator(a, b, orderBy) {
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
}

function getComparator(order, orderBy) {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

const TradeLogTable = ({ trades }) => {
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('Entry Date');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleRequestSort = (event, property) => {
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

  const sortedTrades = useMemo(() => {
    if (!trades) return [];
    const stabilizedThis = trades.map((el, index) => [el, index]);
    stabilizedThis.sort((a, b) => {
      const orderValue = getComparator(order, orderBy)(a[0], b[0]);
      if (orderValue !== 0) return orderValue;
      return a[1] - b[1];
    });
    return stabilizedThis.map((el) => el[0]);
  }, [trades, order, orderBy]);

  const emptyRows =
    page > 0 ? Math.max(0, (1 + page) * rowsPerPage - trades.length) : 0;

  if (!trades || trades.length === 0) {
    return <Typography>No trades to display.</Typography>;
  }

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen">
      <div className="mx-auto max-w-7xl py-10 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Trade Log</h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">Detailed record of all backtest trades and their performance.</p>
        </div>

        <div className="space-y-12">
          <div className="space-y-6 rounded-lg border border-gray-200/50 dark:border-gray-700/50 bg-white/20 dark:bg-black/20 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Trade History</h2>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Showing {Math.min(rowsPerPage, sortedTrades.length)} of {sortedTrades.length} trades
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    {headCells.map((headCell) => (
                      <th
                        key={headCell.id}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-300"
                        onClick={(event) => handleRequestSort(event, headCell.id)}
                      >
                        {headCell.label}
                        {orderBy === headCell.id && (
                          <span className="ml-1">
                            {order === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {sortedTrades
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((row, index) => (
                      <tr key={row['Entry Date'] + row.Ticker + index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                          {row.Ticker}
                        </TableCell>
                        <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                          {row['Signal Type']}
                        </TableCell>
                        <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                          {formatDate(row['Entry Date'])}
                        </TableCell>
                        <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300 text-right">
                          {formatCurrency(row['Entry Price'])}
                        </TableCell>
                        <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                          {formatDate(row['Exit Date'])}
                        </TableCell>
                        <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300 text-right">
                          {formatCurrency(row['Exit Price'])}
                        </TableCell>
                        <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300 text-right">
                          <span className={row['P&L ($)'] >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                            {formatCurrency(row['P&L ($)'])}
                          </span>
                        </TableCell>
                        <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300 text-right">
                          <span className={row['Profit/Loss (%)'] >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                            {formatPercentage(row['Profit/Loss (%)'])}
                          </span>
                        </TableCell>
                        <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                          {row['Exit Reason']}
                        </TableCell>
                        <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300 text-right">
                          {row['Days Held']}
                        </TableCell>
                      </tr>
                    ))}
                  {emptyRows > 0 && (
                    <tr>
                      <TableCell colSpan={10} className="h-24px" />
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Page {page + 1} of {Math.ceil(sortedTrades.length / rowsPerPage)}
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
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                </select>
                <button
                  className="rounded-lg bg-gray-200 dark:bg-gray-700 px-3 py-1 text-sm font-medium text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
                  onClick={() => handleChangePage(page + 1)}
                  disabled={page >= Math.ceil(sortedTrades.length / rowsPerPage) - 1}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TradeLogTable;