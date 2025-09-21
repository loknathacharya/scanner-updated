/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import BacktestResults from '../BacktestResults';

// Mock the plotly component
jest.mock('react-plotly.js', () => {
  return function MockPlot({ data, layout, config, style }) {
    return (
      <div data-testid="mock-plot" data-layout={JSON.stringify(layout)}>
        {data.map((trace, index) => (
          <div key={index} data-trace={JSON.stringify(trace)} />
        ))}
      </div>
    );
  };
});

// Mock the file download functionality
global.URL.createObjectURL = jest.fn(() => 'mock-url');
global.URL.revokeObjectURL = jest.fn();

const mockResults = {
  trades: [
    {
      symbol: 'AAPL',
      entry_date: '2023-01-01',
      exit_date: '2023-01-15',
      entry_price: 150.0,
      exit_price: 160.0,
      'p/l (%)': 6.67,
      pnl: 1000.0,
      Ticker: 'AAPL',
      Entry_Date: '2023-01-01',
      Exit_Date: '2023-01-15',
      Entry_Price: 150.0,
      Exit_Price: 160.0,
    },
    {
      symbol: 'GOOGL',
      entry_date: '2023-01-02',
      exit_date: '2023-01-16',
      entry_price: 100.0,
      exit_price: 95.0,
      'p/l (%)': -5.0,
      pnl: -500.0,
      Ticker: 'GOOGL',
      Entry_Date: '2023-01-02',
      Exit_Date: '2023-01-16',
      Entry_Price: 100.0,
      Exit_Price: 95.0,
    },
  ],
  performance_metrics: {
    total_return: 10.5,
    win_rate: 65.0,
    sharpe_ratio: 1.2,
    max_drawdown: -5.0,
    profit_factor: 2.5,
    avg_trade_return: 2.5,
  },
  equity_curve: [
    { date: '2023-01-01', value: 100000 },
    { date: '2023-01-02', value: 101000 },
    { date: '2023-01-03', value: 102000 },
  ],
  summary: {
    holding_period: 20,
    stop_loss: 5.0,
    take_profit: 10.0,
    signal_type: 'long',
    sizing_method: 'equal_weight',
  },
  execution_time: 1.5,
  signals_processed: 100,
  monitoring: {
    execution_id: 'test_exec_123',
    cache_hit: false,
    from_cache: false,
  },
};

const mockOptimizationResults = {
  best_params: { stop_loss: 4.5, take_profit: 12.0 },
  best_performance: { total_return: 15.2, sharpe_ratio: 1.8 },
  all_results: [
    { params: { stop_loss: 4.0, take_profit: 8.0 }, performance: { total_return: 8.5 } },
    { params: { stop_loss: 5.0, take_profit: 10.0 }, performance: { total_return: 10.5 } },
    { params: { stop_loss: 4.5, take_profit: 12.0 }, performance: { total_return: 15.2 } },
  ],
};

describe('BacktestResults Component', () => {
  const defaultProps = {
    results: mockResults,
    onExport: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    test('renders backtest results with all sections', () => {
      render(<BacktestResults {...defaultProps} />);
      
      expect(screen.getByText('Backtest Results')).toBeInTheDocument();
      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(screen.getByText('Trades')).toBeInTheDocument();
      expect(screen.getByText('Analytics')).toBeInTheDocument();
      expect(screen.getByText('100 signals processed • 1.50s execution time')).toBeInTheDocument();
    });

    test('renders performance metrics cards', () => {
      render(<BacktestResults {...defaultProps} />);
      
      expect(screen.getByText('Total Return')).toBeInTheDocument();
      expect(screen.getByText('Win Rate')).toBeInTheDocument();
      expect(screen.getByText('Sharpe Ratio')).toBeInTheDocument();
      expect(screen.getByText('Max Drawdown')).toBeInTheDocument();
      expect(screen.getByText('Total Trades')).toBeInTheDocument();
      expect(screen.getByText('Profit Factor')).toBeInTheDocument();
      expect(screen.getByText('Avg Trade Return')).toBeInTheDocument();
      expect(screen.getByText('Execution Time')).toBeInTheDocument();
    });

    test('renders trade table', () => {
      render(<BacktestResults {...defaultProps} />);
      
      expect(screen.getByText('Trade Log (2 of 2 trades)')).toBeInTheDocument();
      expect(screen.getByText('Symbol')).toBeInTheDocument();
      expect(screen.getByText('Entry Date')).toBeInTheDocument();
      expect(screen.getByText('Exit Date')).toBeInTheDocument();
      expect(screen.getByText('Entry Price')).toBeInTheDocument();
      expect(screen.getByText('Exit Price')).toBeInTheDocument();
      expect(screen.getByText('Return')).toBeInTheDocument();
      expect(screen.getByText('P&L')).toBeInTheDocument();
    });

    test('renders equity curve chart', () => {
      render(<BacktestResults {...defaultProps} />);
      
      expect(screen.getByText('Equity Curve')).toBeInTheDocument();
      expect(screen.getByTestId('mock-plot')).toBeInTheDocument();
    });

    test('renders analytics charts', () => {
      render(<BacktestResults {...defaultProps} />);
      
      expect(screen.getByText('Trade Return Distribution')).toBeInTheDocument();
      expect(screen.getByText('Monthly Returns')).toBeInTheDocument();
    });

    test('renders optimization results when provided', () => {
      const propsWithOptimization = {
        ...defaultProps,
        optimization_results: mockOptimizationResults,
      };
      
      render(<BacktestResults {...propsWithOptimization} />);
      
      expect(screen.getByText('Optimization')).toBeInTheDocument();
      expect(screen.getByText('Parameter Optimization Results')).toBeInTheDocument();
    });

    test('renders empty state when no results', () => {
      render(<BacktestResults results={null} />);
      
      expect(screen.getByText('No backtest results available')).toBeInTheDocument();
    });

    test('renders error state when error provided', () => {
      render(<BacktestResults {...defaultProps} error="Test error message" />);
      
      expect(screen.getByText('Test error message')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
    });
  });

  describe('Tab Navigation', () => {
    test('switches between tabs correctly', () => {
      render(<BacktestResults {...defaultProps} />);
      
      // Initially on overview tab
      expect(screen.getByText('Equity Curve')).toBeInTheDocument();
      expect(screen.queryByText('Trade Log (2 of 2 trades)')).not.toBeInTheDocument();
      
      // Switch to trades tab
      fireEvent.click(screen.getByText('Trades'));
      expect(screen.getByText('Trade Log (2 of 2 trades)')).toBeInTheDocument();
      expect(screen.queryByText('Equity Curve')).not.toBeInTheDocument();
      
      // Switch to analytics tab
      fireEvent.click(screen.getByText('Analytics'));
      expect(screen.getByText('Trade Return Distribution')).toBeInTheDocument();
      expect(screen.queryByText('Trade Log (2 of 2 trades)')).not.toBeInTheDocument();
      
      // Switch back to overview
      fireEvent.click(screen.getByText('Overview'));
      expect(screen.getByText('Equity Curve')).toBeInTheDocument();
      expect(screen.queryByText('Trade Return Distribution')).not.toBeInTheDocument();
    });

    test('shows optimization tab when optimization results provided', () => {
      const propsWithOptimization = {
        ...defaultProps,
        optimization_results: mockOptimizationResults,
      };
      
      render(<BacktestResults {...propsWithOptimization} />);
      
      expect(screen.getByText('Optimization')).toBeInTheDocument();
      
      // Click optimization tab
      fireEvent.click(screen.getByText('Optimization'));
      expect(screen.getByText('Parameter Optimization Results')).toBeInTheDocument();
    });

    test('hides optimization tab when no optimization results', () => {
      render(<BacktestResults {...defaultProps} />);
      
      expect(screen.queryByText('Optimization')).not.toBeInTheDocument();
    });
  });

  describe('Performance Metrics Display', () => {
    test('displays total return with correct color', () => {
      render(<BacktestResults {...defaultProps} />);
      
      const totalReturnElement = screen.getByText('10.50%');
      expect(totalReturnElement).toBeInTheDocument();
      expect(totalReturnElement).toHaveStyle({ color: 'rgb(76, 175, 80)' }); // green for positive
    });

    test('displays negative return with correct color', () => {
      const negativeResults = {
        ...mockResults,
        performance_metrics: {
          ...mockResults.performance_metrics,
          total_return: -5.0,
        },
      };
      
      render(<BacktestResults results={negativeResults} />);
      
      const totalReturnElement = screen.getByText('-5.00%');
      expect(totalReturnElement).toBeInTheDocument();
      expect(totalReturnElement).toHaveStyle({ color: 'rgb(244, 67, 54)' }); // red for negative
    });

    test('displays win rate with correct format', () => {
      render(<BacktestResults {...defaultProps} />);
      
      const winRateElement = screen.getByText('65.0%');
      expect(winRateElement).toBeInTheDocument();
    });

    test('displays sharpe ratio with correct format', () => {
      render(<BacktestResults {...defaultProps} />);
      
      const sharpeRatioElement = screen.getByText('1.200');
      expect(sharpeRatioElement).toBeInTheDocument();
    });

    test('displays max drawdown with correct color', () => {
      render(<BacktestResults {...defaultProps} />);
      
      const maxDrawdownElement = screen.getByText('-5.00%');
      expect(maxDrawdownElement).toBeInTheDocument();
      expect(maxDrawdownElement).toHaveStyle({ color: 'rgb(244, 67, 54)' }); // red for negative
    });

    test('displays profit factor with correct format', () => {
      render(<BacktestResults {...defaultProps} />);
      
      const profitFactorElement = screen.getByText('2.50');
      expect(profitFactorElement).toBeInTheDocument();
    });

    test('displays average trade return with correct color', () => {
      render(<BacktestResults {...defaultProps} />);
      
      const avgTradeReturnElement = screen.getByText('2.50%');
      expect(avgTradeReturnElement).toBeInTheDocument();
      expect(avgTradeReturnElement).toHaveStyle({ color: 'rgb(76, 175, 80)' }); // green for positive
    });

    test('displays execution time with correct format', () => {
      render(<BacktestResults {...defaultProps} />);
      
      const executionTimeElement = screen.getByText('1.50s');
      expect(executionTimeElement).toBeInTheDocument();
    });
  });

  describe('Trade Table', () => {
    test('displays all trades correctly', () => {
      render(<BacktestResults {...defaultProps} />);
      
      // Check trade data
      const tradeRows = screen.getAllByRole('row');
      expect(tradeRows).toHaveLength(3); // Header + 2 trades
      
      // Check first trade (AAPL)
      const firstTrade = tradeRows[1];
      expect(firstTrade).toHaveTextContent('AAPL');
      expect(firstTrade).toHaveTextContent('Jan 01, 2023');
      expect(firstTrade).toHaveTextContent('Jan 15, 2023');
      expect(firstTrade).toHaveTextContent('$150.00');
      expect(firstTrade).toHaveTextContent('$160.00');
      expect(firstTrade).toHaveTextContent('6.67%');
      expect(firstTrade).toHaveTextContent('$1,000.00');
      
      // Check second trade (GOOGL)
      const secondTrade = tradeRows[2];
      expect(secondTrade).toHaveTextContent('GOOGL');
      expect(secondTrade).toHaveTextContent('Jan 02, 2023');
      expect(secondTrade).toHaveTextContent('Jan 16, 2023');
      expect(secondTrade).toHaveTextContent('$100.00');
      expect(secondTrade).toHaveTextContent('$95.00');
      expect(secondTrade).toHaveTextContent('-5.00%');
      expect(secondTrade).toHaveTextContent('-$500.00');
    });

    test('formats currency values correctly', () => {
      render(<BacktestResults {...defaultProps} />);
      
      const currencyElements = screen.getAllByText(/\$[\d,]+\.?\d*/);
      expect(currencyElements).toHaveLength(4); // 2 entry prices + 2 exit prices + 2 P&L
      
      currencyElements.forEach(element => {
        expect(element).toHaveTextContent(/\$[\d,]+\.?\d*/);
      });
    });

    test('formats dates correctly', () => {
      render(<BacktestResults {...defaultProps} />);
      
      const dateElements = screen.getAllByText(/Jan \d{1,2}, 2023/);
      expect(dateElements).toHaveLength(4); // 2 entry dates + 2 exit dates
    });

    test('highlights positive and negative returns correctly', () => {
      render(<BacktestResults {...defaultProps} />);
      
      // Positive return (AAPL)
      const positiveReturn = screen.getByText('6.67%');
      expect(positiveReturn).toHaveStyle({ color: 'rgb(76, 175, 80)' }); // green
      
      // Negative return (GOOGL)
      const negativeReturn = screen.getByText('-5.00%');
      expect(negativeReturn).toHaveStyle({ color: 'rgb(244, 67, 54)' }); // red
      
      // Positive P&L (AAPL)
      const positivePnL = screen.getByText('$1,000.00');
      expect(positivePnL).toHaveStyle({ color: 'rgb(76, 175, 80)' }); // green
      
      // Negative P&L (GOOGL)
      const negativePnL = screen.getByText('-$500.00');
      expect(negativePnL).toHaveStyle({ color: 'rgb(244, 67, 54)' }); // red
    });

    test('handles open trades correctly', () => {
      const resultsWithOpenTrade = {
        ...mockResults,
        trades: [
          {
            ...mockResults.trades[0],
            exit_date: null,
            exit_price: null,
          },
        ],
      };
      
      render(<BacktestResults results={resultsWithOpenTrade} />);
      
      const exitDateElement = screen.getByText('Open');
      expect(exitDateElement).toBeInTheDocument();
      
      const exitPriceElement = screen.getByText('-');
      expect(exitPriceElement).toBeInTheDocument();
    });
  });

  describe('Charts', () => {
    test('renders equity curve chart with correct data', () => {
      render(<BacktestResults {...defaultProps} />);
      
      const plot = screen.getByTestId('mock-plot');
      expect(plot).toBeInTheDocument();
      
      // Check that plot data contains equity curve
      const traceElements = plot.querySelectorAll('[data-trace]');
      expect(traceElements).toHaveLength(1);
      
      const traceData = JSON.parse(traceElements[0].getAttribute('data-trace'));
      expect(traceData.type).toBe('scatter');
      expect(traceData.mode).toBe('lines');
      expect(traceData.name).toBe('Equity Curve');
    });

    test('renders trade distribution chart', () => {
      render(<BacktestResults {...defaultProps} />);
      
      const plot = screen.getByTestId('mock-plot');
      expect(plot).toBeInTheDocument();
      
      // Check that plot data contains distribution
      const traceElements = plot.querySelectorAll('[data-trace]');
      expect(traceElements).toHaveLength(1);
      
      const traceData = JSON.parse(traceElements[0].getAttribute('data-trace'));
      expect(traceData.type).toBe('histogram');
      expect(traceData.name).toBe('Trade Returns');
    });

    test('renders monthly returns chart', () => {
      render(<BacktestResults {...defaultProps} />);
      
      const plot = screen.getByTestId('mock-plot');
      expect(plot).toBeInTheDocument();
      
      // Check that plot data contains monthly returns
      const traceElements = plot.querySelectorAll('[data-trace]');
      expect(traceElements).toHaveLength(1);
      
      const traceData = JSON.parse(traceElements[0].getAttribute('data-trace'));
      expect(traceData.type).toBe('bar');
      expect(traceData.name).toBe('Monthly Returns');
    });

    test('handles chart configuration correctly', () => {
      render(<BacktestResults {...defaultProps} />);
      
      const plot = screen.getByTestId('mock-plot');
      const layout = JSON.parse(plot.getAttribute('data-layout'));
      
      expect(layout.title).toBe('Equity Curve');
      expect(layout.xaxis.title).toBe('Date');
      expect(layout.yaxis.title).toBe('Portfolio Value');
      expect(layout.margin).toEqual({ t: 50, r: 20, b: 60, l: 60 });
    });
  });

  describe('Filtering and Sorting', () => {
    test('opens filter dialog when filter button clicked', () => {
      render(<BacktestResults {...defaultProps} />);
      
      expect(screen.queryByText('Trade Filters & Settings')).not.toBeInTheDocument();
      
      fireEvent.click(screen.getByText('Filter'));
      
      expect(screen.getByText('Trade Filters & Settings')).toBeInTheDocument();
    });

    test('applies filters correctly', async () => {
      render(<BacktestResults {...defaultProps} />);
      
      // Open filter dialog
      fireEvent.click(screen.getByText('Filter'));
      
      // Set return range filter
      const minReturnSlider = screen.getByLabelText(/Min:/);
      const maxReturnSlider = screen.getByLabelText(/Max:/);
      
      fireEvent.change(minReturnSlider, { target: { value: 0 } });
      fireEvent.change(maxReturnSlider, { target: { value: 10 } });
      
      // Apply filters
      fireEvent.click(screen.getByText('Apply Filters'));
      
      // Check that filters were applied (trade count should be filtered)
      await waitFor(() => {
        expect(screen.getByText('Trade Log (1 of 2 trades)')).toBeInTheDocument();
      });
    });

    test('sorts trades by symbol correctly', () => {
      render(<BacktestResults {...defaultProps} />);
      
      // Click symbol header to sort
      fireEvent.click(screen.getByText('Symbol'));
      
      // Check that trades are sorted
      const tradeRows = screen.getAllByRole('row');
      expect(tradeRows[1]).toHaveTextContent('AAPL');
      expect(tradeRows[2]).toHaveTextContent('GOOGL');
    });

    test('sorts trades by entry date correctly', () => {
      render(<BacktestResults {...defaultProps} />);
      
      // Click entry date header to sort
      fireEvent.click(screen.getByText('Entry Date'));
      
      // Check that trades are sorted by date
      const tradeRows = screen.getAllByRole('row');
      expect(tradeRows[1]).toHaveTextContent('Jan 01, 2023'); // AAPL
      expect(tradeRows[2]).toHaveTextContent('Jan 02, 2023'); // GOOGL
    });

    test('sorts trades by P&L correctly', () => {
      render(<BacktestResults {...defaultProps} />);
      
      // Click P&L header to sort
      fireEvent.click(screen.getByText('P&L'));
      
      // Check that trades are sorted by P&L (descending)
      const tradeRows = screen.getAllByRole('row');
      expect(tradeRows[1]).toHaveTextContent('$1,000.00'); // AAPL (positive)
      expect(tradeRows[2]).toHaveTextContent('-$500.00'); // GOOGL (negative)
    });
  });

  describe('Export Functionality', () => {
    test('opens export menu when export button clicked', () => {
      render(<BacktestResults {...defaultProps} />);
      
      expect(screen.queryByText('Export Trades (CSV)')).not.toBeInTheDocument();
      
      fireEvent.click(screen.getByText('Export'));
      
      expect(screen.getByText('Export Trades (CSV)')).toBeInTheDocument();
      expect(screen.getByText('Export Trades (JSON)')).toBeInTheDocument();
      expect(screen.getByText('Export Performance Metrics')).toBeInTheDocument();
      expect(screen.getByText('Export Equity Curve')).toBeInTheDocument();
    });

    test('exports trades as CSV', async () => {
      render(<BacktestResults {...defaultProps} />);
      
      // Open export menu
      fireEvent.click(screen.getByText('Export'));
      
      // Click CSV export
      fireEvent.click(screen.getByText('Export Trades (CSV)'));
      
      await waitFor(() => {
        expect(defaultProps.onExport).toHaveBeenCalledWith({
          format: 'csv',
          data: expect.stringContaining('symbol,entry_date,exit_date'),
          filename: 'backtest_trades.csv',
        });
      });
    });

    test('exports trades as JSON', async () => {
      render(<BacktestResults {...defaultProps} />);
      
      // Open export menu
      fireEvent.click(screen.getByText('Export'));
      
      // Click JSON export
      fireEvent.click(screen.getByText('Export Trades (JSON)'));
      
      await waitFor(() => {
        expect(defaultProps.onExport).toHaveBeenCalledWith({
          format: 'json',
          data: expect.stringContaining('['),
          filename: 'backtest_trades.json',
        });
      });
    });

    test('exports performance metrics', async () => {
      render(<BacktestResults {...defaultProps} />);
      
      // Open export menu
      fireEvent.click(screen.getByText('Export'));
      
      // Click performance metrics export
      fireEvent.click(screen.getByText('Export Performance Metrics'));
      
      await waitFor(() => {
        expect(defaultProps.onExport).toHaveBeenCalledWith({
          format: 'performance',
          data: expect.stringContaining('performance_metrics'),
          filename: 'backtest_performance.json',
        });
      });
    });

    test('exports equity curve', async () => {
      render(<BacktestResults {...defaultProps} />);
      
      // Open export menu
      fireEvent.click(screen.getByText('Export'));
      
      // Click equity curve export
      fireEvent.click(screen.getByText('Export Equity Curve'));
      
      await waitFor(() => {
        expect(defaultProps.onExport).toHaveBeenCalledWith({
          format: 'equity',
          data: expect.stringContaining('equity_curve'),
          filename: 'backtest_equity_curve.json',
        });
      });
    });

    test('handles export errors gracefully', async () => {
      const mockError = new Error('Export failed');
      defaultProps.onExport.mockRejectedValue(mockError);
      
      render(<BacktestResults {...defaultProps} />);
      
      // Open export menu
      fireEvent.click(screen.getByText('Export'));
      
      // Click CSV export
      fireEvent.click(screen.getByText('Export Trades (CSV)'));
      
      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith('Export error:', mockError);
      });
    });
  });

  describe('Pagination', () => {
    test('displays pagination controls', () => {
      render(<BacktestResults {...defaultProps} />);
      
      expect(screen.getByText('Rows per page:')).toBeInTheDocument();
      expect(screen.getByText('1-2 of 2')).toBeInTheDocument();
    });

    test('changes page size correctly', () => {
      render(<BacktestResults {...defaultProps} />);
      
      const pageSizeSelect = screen.getByLabelText(/Rows per page:/);
      fireEvent.change(pageSizeSelect, { target: { value: '10' } });
      
      expect(pageSizeSelect).toHaveValue('10');
    });

    test('changes page correctly', () => {
      // Add more trades to test pagination
      const manyTrades = Array(15).fill().map((_, i) => ({
        ...mockResults.trades[0],
        symbol: `STOCK${i}`,
        entry_date: `2023-01-${String(i + 1).padStart(2, '0')}`,
      }));
      
      const resultsWithManyTrades = {
        ...mockResults,
        trades: manyTrades,
      };
      
      render(<BacktestResults results={resultsWithManyTrades} />);
      
      // Go to next page
      fireEvent.click(screen.getByText('›', { selector: 'button' }));
      
      expect(screen.getByText('11-15 of 15')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    test('renders correctly on small screens', () => {
      render(<BacktestResults {...defaultProps} />, { container: document.createElement('div') });
      
      // Mock small screen
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 600,
      });
      
      window.dispatchEvent(new Event('resize'));
      
      // Should still render correctly
      expect(screen.getByText('Backtest Results')).toBeInTheDocument();
    });

    test('handles mobile layout for trade table', () => {
      render(<BacktestResults {...defaultProps} />, { container: document.createElement('div') });
      
      // Mock small screen
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 400,
      });
      
      window.dispatchEvent(new Event('resize'));
      
      // Trade table should adapt to small screen
      expect(screen.getByText('Trade Log (2 of 2 trades)')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('has proper ARIA labels', () => {
      render(<BacktestResults {...defaultProps} />);
      
      expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /export/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /filter/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /settings/i })).toBeInTheDocument();
    });

    test('is keyboard navigable', () => {
      render(<BacktestResults {...defaultProps} />);
      
      // Test tab navigation through tabs
      const overviewTab = screen.getByText('Overview');
      fireEvent.keyDown(overviewTab, { key: 'Tab' });
      
      const tradesTab = screen.getByText('Trades');
      expect(document.activeElement).toBe(tradesTab);
    });

    test('has proper table accessibility', () => {
      render(<BacktestResults {...defaultProps} />);
      
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
      
      // Check that table has proper structure
      const headerRow = screen.getByRole('row', { name: /symbol/i });
      expect(headerRow).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    test('handles large datasets efficiently', () => {
      // Create a large dataset
      const largeTrades = Array(1000).fill().map((_, i) => ({
        ...mockResults.trades[0],
        symbol: `STOCK${i}`,
        entry_date: `2023-01-${String(i % 31 + 1).padStart(2, '0')}`,
      }));
      
      const largeResults = {
        ...mockResults,
        trades: largeTrades,
      };
      
      render(<BacktestResults results={largeResults} />);
      
      // Should render without performance issues
      expect(screen.getByText('Trade Log (1000 of 1000 trades)')).toBeInTheDocument();
    });

    test('handles rapid tab switching without performance issues', async () => {
      render(<BacktestResults {...defaultProps} />);
      
      // Switch tabs rapidly
      for (let i = 0; i < 10; i++) {
        fireEvent.click(screen.getByText('Overview'));
        fireEvent.click(screen.getByText('Trades'));
        fireEvent.click(screen.getByText('Analytics'));
      }
      
      // Should still work normally
      expect(screen.getByText('Trade Return Distribution')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('handles missing performance metrics gracefully', () => {
      const resultsWithoutMetrics = {
        ...mockResults,
        performance_metrics: null,
      };
      
      render(<BacktestResults results={resultsWithoutMetrics} />);
      
      // Should still render without crashing
      expect(screen.getByText('Backtest Results')).toBeInTheDocument();
    });

    test('handles missing equity curve gracefully', () => {
      const resultsWithoutEquityCurve = {
        ...mockResults,
        equity_curve: [],
      };
      
      render(<BacktestResults results={resultsWithoutEquityCurve} />);
      
      // Should still render without crashing
      expect(screen.getByText('Backtest Results')).toBeInTheDocument();
    });

    test('handles malformed trade data gracefully', () => {
      const malformedResults = {
        ...mockResults,
        trades: [
          {
            symbol: 'AAPL',
            // Missing required fields
          },
        ],
      };
      
      render(<BacktestResults results={malformedResults} />);
      
      // Should still render without crashing
      expect(screen.getByText('Backtest Results')).toBeInTheDocument();
    });
  });

  describe('Integration with Parent Components', () => {
    test('works with parent component state management', () => {
      const ParentComponent = () => {
        const [results, setResults] = React.useState(mockResults);
        const [showResults, setShowResults] = React.useState(true);
        
        return (
          <div>
            <button 
              onClick={() => setShowResults(!showResults)}
              data-testid="toggle-results"
            >
              Toggle Results
            </button>
            {showResults && (
              <BacktestResults 
                results={results} 
                onExport={defaultProps.onExport}
              />
            )}
          </div>
        );
      };
      
      render(<ParentComponent />);
      
      // Initially shows results
      expect(screen.getByText('Backtest Results')).toBeInTheDocument();
      
      // Hide results
      fireEvent.click(screen.getByTestId('toggle-results'));
      expect(screen.queryByText('Backtest Results')).not.toBeInTheDocument();
      
      // Show results again
      fireEvent.click(screen.getByTestId('toggle-results'));
      expect(screen.getByText('Backtest Results')).toBeInTheDocument();
    });

    test('handles refresh functionality', () => {
      const mockRefresh = jest.fn();
      
      // Mock window.location.reload
      delete window.location;
      window.location = { reload: mockRefresh };
      
      render(<BacktestResults {...defaultProps} />);
      
      fireEvent.click(screen.getByText('Refresh'));
      
      expect(mockRefresh).toHaveBeenCalled();
    });
  });
});