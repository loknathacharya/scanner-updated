/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import BacktestControls from '../BacktestControls';

// Mock the API module
jest.mock('../../services/api', () => ({
  runBacktest: jest.fn(),
  optimizeParameters: jest.fn(),
}));

// Mock the toast notification
jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
  },
}));

// Mock the file upload component
jest.mock('../FileUpload', () => {
  return function MockFileUpload({ onFileUpload, acceptedFileTypes, maxSize }) {
    return (
      <div data-testid="mock-file-upload">
        <button 
          onClick={() => onFileUpload({ 
            name: 'test.csv', 
            size: 1024, 
            type: 'text/csv' 
          })}
        >
          Mock Upload
        </button>
      </div>
    );
  };
});

const mockApi = require('../../services/api');
const mockToast = require('react-toastify').toast;

describe('BacktestControls Component', () => {
  const defaultProps = {
    onBacktestComplete: jest.fn(),
    onOptimizeComplete: jest.fn(),
    disabled: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockApi.runBacktest.mockResolvedValue({
      trades: [],
      performance_metrics: { total_return: 10.5 },
      equity_curve: [],
      summary: {},
      execution_time: 1.5,
      signals_processed: 100,
    });
    
    mockApi.optimizeParameters.mockResolvedValue({
      best_params: { stop_loss: 5.0 },
      best_performance: { total_return: 12.0 },
      all_results: [],
      execution_time: 5.0,
      signals_processed: 100,
    });
  });

  describe('Rendering', () => {
    test('renders backtest controls with all inputs', () => {
      render(<BacktestControls {...defaultProps} />);
      
      expect(screen.getByLabelText(/Initial Capital/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Stop Loss %/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Take Profit %/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Holding Period/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Signal Type/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Position Sizing/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Allow Leverage/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Run Backtest/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Optimize Parameters/i })).toBeInTheDocument();
    });

    test('renders file upload component', () => {
      render(<BacktestControls {...defaultProps} />);
      
      expect(screen.getByTestId('mock-file-upload')).toBeInTheDocument();
    });

    test('renders disabled state when disabled prop is true', () => {
      render(<BacktestControls {...defaultProps} disabled={true} />);
      
      expect(screen.getByRole('button', { name: /Run Backtest/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /Optimize Parameters/i })).toBeDisabled();
    });

    test('renders loading state during backtest execution', async () => {
      mockApi.runBacktest.mockImplementation(() => new Promise(resolve => {
        setTimeout(() => resolve({
          trades: [],
          performance_metrics: { total_return: 10.5 },
          equity_curve: [],
          summary: {},
          execution_time: 1.5,
          signals_processed: 100,
        }), 100);
      }));

      render(<BacktestControls {...defaultProps} />);
      
      fireEvent.click(screen.getByRole('button', { name: /Run Backtest/i }));
      
      expect(screen.getByText(/Running Backtest.../i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Run Backtest/i })).toBeDisabled();
    });
  });

  describe('Form Validation', () => {
    test('validates required fields', async () => {
      render(<BacktestControls {...defaultProps} />);
      
      const runButton = screen.getByRole('button', { name: /Run Backtest/i });
      fireEvent.click(runButton);
      
      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          'Please upload a file before running backtest',
          expect.any(Object)
        );
      });
    });

    test('validates numeric inputs', async () => {
      render(<BacktestControls {...defaultProps} />);
      
      // Upload a file first
      fireEvent.click(screen.getByText('Mock Upload'));
      
      // Set invalid numeric values
      fireEvent.change(screen.getByLabelText(/Initial Capital/i), {
        target: { value: 'invalid' },
      });
      
      const runButton = screen.getByRole('button', { name: /Run Backtest/i });
      fireEvent.click(runButton);
      
      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          'Please enter valid numeric values for all fields',
          expect.any(Object)
        );
      });
    });

    test('validates input ranges', async () => {
      render(<BacktestControls {...defaultProps} />);
      
      // Upload a file first
      fireEvent.click(screen.getByText('Mock Upload'));
      
      // Set values outside valid ranges
      fireEvent.change(screen.getByLabelText(/Stop Loss %/i), {
        target: { value: '150' },
      });
      
      const runButton = screen.getByRole('button', { name: /Run Backtest/i });
      fireEvent.click(runButton);
      
      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          'Stop loss must be between 0.1 and 50',
          expect.any(Object)
        );
      });
    });

    test('validates take profit dependency on stop loss', async () => {
      render(<BacktestControls {...defaultProps} />);
      
      // Upload a file first
      fireEvent.click(screen.getByText('Mock Upload'));
      
      // Set stop loss and take profit with invalid relationship
      fireEvent.change(screen.getByLabelText(/Stop Loss %/i), {
        target: { value: '10' },
      });
      fireEvent.change(screen.getByLabelText(/Take Profit %/i), {
        target: { value: '5' },
      });
      
      const runButton = screen.getByRole('button', { name: /Run Backtest/i });
      fireEvent.click(runButton);
      
      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          'Take profit should be greater than stop loss',
          expect.any(Object)
        );
      });
    });
  });

  describe('Backtest Execution', () => {
    test('runs backtest successfully with valid inputs', async () => {
      render(<BacktestControls {...defaultProps} />);
      
      // Upload a file
      fireEvent.click(screen.getByText('Mock Upload'));
      
      // Set valid inputs
      fireEvent.change(screen.getByLabelText(/Initial Capital/i), {
        target: { value: '100000' },
      });
      fireEvent.change(screen.getByLabelText(/Stop Loss %/i), {
        target: { value: '5' },
      });
      fireEvent.change(screen.getByLabelText(/Take Profit %/i), {
        target: { value: '10' },
      });
      fireEvent.change(screen.getByLabelText(/Holding Period/i), {
        target: { value: '20' },
      });
      
      // Run backtest
      fireEvent.click(screen.getByRole('button', { name: /Run Backtest/i }));
      
      await waitFor(() => {
        expect(mockApi.runBacktest).toHaveBeenCalledWith(
          expect.objectContaining({
            initial_capital: 100000,
            stop_loss: 5,
            take_profit: 10,
            holding_period: 20,
          })
        );
        expect(mockToast.success).toHaveBeenCalledWith(
          'Backtest completed successfully',
          expect.any(Object)
        );
      });
    });

    test('handles backtest API errors', async () => {
      mockApi.runBacktest.mockRejectedValue(new Error('API Error'));
      
      render(<BacktestControls {...defaultProps} />);
      
      // Upload a file
      fireEvent.click(screen.getByText('Mock Upload'));
      
      // Set valid inputs
      fireEvent.change(screen.getByLabelText(/Initial Capital/i), {
        target: { value: '100000' },
      });
      fireEvent.change(screen.getByLabelText(/Stop Loss %/i), {
        target: { value: '5' },
      });
      
      // Run backtest
      fireEvent.click(screen.getByRole('button', { name: /Run Backtest/i }));
      
      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          'Failed to run backtest: API Error',
          expect.any(Object)
        );
      });
    });

    test('calls onBacktestComplete callback on success', async () => {
      render(<BacktestControls {...defaultProps} />);
      
      // Upload a file
      fireEvent.click(screen.getByText('Mock Upload'));
      
      // Set valid inputs
      fireEvent.change(screen.getByLabelText(/Initial Capital/i), {
        target: { value: '100000' },
      });
      fireEvent.change(screen.getByLabelText(/Stop Loss %/i), {
        target: { value: '5' },
      });
      
      // Run backtest
      fireEvent.click(screen.getByRole('button', { name: /Run Backtest/i }));
      
      await waitFor(() => {
        expect(defaultProps.onBacktestComplete).toHaveBeenCalledWith(
          expect.objectContaining({
            trades: [],
            performance_metrics: { total_return: 10.5 },
            execution_time: 1.5,
            signals_processed: 100,
          })
        );
      });
    });
  });

  describe('Parameter Optimization', () => {
    test('runs parameter optimization successfully', async () => {
      render(<BacktestControls {...defaultProps} />);
      
      // Upload a file
      fireEvent.click(screen.getByText('Mock Upload'));
      
      // Set optimization parameters
      fireEvent.change(screen.getByLabelText(/Stop Loss %/i), {
        target: { value: '5' },
      });
      
      // Run optimization
      fireEvent.click(screen.getByRole('button', { name: /Optimize Parameters/i }));
      
      await waitFor(() => {
        expect(mockApi.optimizeParameters).toHaveBeenCalledWith(
          expect.objectContaining({
            stop_loss: 5,
          })
        );
        expect(mockToast.success).toHaveBeenCalledWith(
          'Parameter optimization completed',
          expect.any(Object)
        );
      });
    });

    test('handles optimization API errors', async () => {
      mockApi.optimizeParameters.mockRejectedValue(new Error('Optimization Error'));
      
      render(<BacktestControls {...defaultProps} />);
      
      // Upload a file
      fireEvent.click(screen.getByText('Mock Upload'));
      
      // Run optimization
      fireEvent.click(screen.getByRole('button', { name: /Optimize Parameters/i }));
      
      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          'Failed to optimize parameters: Optimization Error',
          expect.any(Object)
        );
      });
    });

    test('calls onOptimizeComplete callback on success', async () => {
      render(<BacktestControls {...defaultProps} />);
      
      // Upload a file
      fireEvent.click(screen.getByText('Mock Upload'));
      
      // Run optimization
      fireEvent.click(screen.getByRole('button', { name: /Optimize Parameters/i }));
      
      await waitFor(() => {
        expect(defaultProps.onOptimizeComplete).toHaveBeenCalledWith(
          expect.objectContaining({
            best_params: { stop_loss: 5.0 },
            best_performance: { total_return: 12.0 },
            execution_time: 5.0,
          })
        );
      });
    });
  });

  describe('Signal Type Selection', () => {
    test('handles long signal type', () => {
      render(<BacktestControls {...defaultProps} />);
      
      const signalTypeSelect = screen.getByLabelText(/Signal Type/i);
      fireEvent.change(signalTypeSelect, { target: { value: 'long' } });
      
      expect(signalTypeSelect).toHaveValue('long');
    });

    test('handles short signal type', () => {
      render(<BacktestControls {...defaultProps} />);
      
      const signalTypeSelect = screen.getByLabelText(/Signal Type/i);
      fireEvent.change(signalTypeSelect, { target: { value: 'short' } });
      
      expect(signalTypeSelect).toHaveValue('short');
    });

    test('handles both signal type', () => {
      render(<BacktestControls {...defaultProps} />);
      
      const signalTypeSelect = screen.getByLabelText(/Signal Type/i);
      fireEvent.change(signalTypeSelect, { target: { value: 'both' } });
      
      expect(signalTypeSelect).toHaveValue('both');
    });
  });

  describe('Position Sizing', () => {
    test('handles equal weight position sizing', () => {
      render(<BacktestControls {...defaultProps} />);
      
      const positionSizingSelect = screen.getByLabelText(/Position Sizing/i);
      fireEvent.change(positionSizingSelect, { target: { value: 'equal_weight' } });
      
      expect(positionSizingSelect).toHaveValue('equal_weight');
    });

    test('handles kelly criterion position sizing', () => {
      render(<BacktestControls {...defaultProps} />);
      
      const positionSizingSelect = screen.getByLabelText(/Position Sizing/i);
      fireEvent.change(positionSizingSelect, { target: { value: 'kelly' } });
      
      expect(positionSizingSelect).toHaveValue('kelly');
    });

    test('handles fixed dollar position sizing', () => {
      render(<BacktestControls {...defaultProps} />);
      
      const positionSizingSelect = screen.getByLabelText(/Position Sizing/i);
      fireEvent.change(positionSizingSelect, { target: { value: 'fixed_dollar' } });
      
      expect(positionSizingSelect).toHaveValue('fixed_dollar');
    });
  });

  describe('Leverage Control', () => {
    test('handles leverage toggle', () => {
      render(<BacktestControls {...defaultProps} />);
      
      const leverageToggle = screen.getByLabelText(/Allow Leverage/i);
      fireEvent.click(leverageToggle);
      
      expect(leverageToggle).toBeChecked();
    });

    test('disables leverage when not allowed', () => {
      render(<BacktestControls {...defaultProps} />);
      
      const leverageToggle = screen.getByLabelText(/Allow Leverage/i);
      expect(leverageToggle).not.toBeChecked();
    });
  });

  describe('Risk Management', () => {
    test('enables one trade per instrument when checked', () => {
      render(<BacktestControls {...defaultProps} />);
      
      const riskManagementCheckbox = screen.getByLabelText(/One Trade Per Instrument/i);
      fireEvent.click(riskManagementCheckbox);
      
      expect(riskManagementCheckbox).toBeChecked();
    });

    test('disables one trade per instrument when unchecked', () => {
      render(<BacktestControls {...defaultProps} />);
      
      const riskManagementCheckbox = screen.getByLabelText(/One Trade Per Instrument/i);
      expect(riskManagementCheckbox).not.toBeChecked();
    });
  });

  describe('Form State Management', () => {
    test('maintains form state across interactions', () => {
      render(<BacktestControls {...defaultProps} />);
      
      // Set initial values
      fireEvent.change(screen.getByLabelText(/Initial Capital/i), {
        target: { value: '100000' },
      });
      fireEvent.change(screen.getByLabelText(/Stop Loss %/i), {
        target: { value: '5' },
      });
      
      // Verify values are maintained
      expect(screen.getByLabelText(/Initial Capital/i)).toHaveValue('100000');
      expect(screen.getByLabelText(/Stop Loss %/i)).toHaveValue('5');
    });

    test('resets form state when component unmounts', () => {
      const { unmount } = render(<BacktestControls {...defaultProps} />);
      
      // Set some values
      fireEvent.change(screen.getByLabelText(/Initial Capital/i), {
        target: { value: '200000' },
      });
      
      unmount();
      
      // Form should be reset when re-mounted
      const { rerender } = render(<BacktestControls {...defaultProps} />);
      expect(screen.getByLabelText(/Initial Capital/i)).toHaveValue('');
    });
  });

  describe('Accessibility', () => {
    test('has proper ARIA labels', () => {
      render(<BacktestControls {...defaultProps} />);
      
      expect(screen.getByLabelText(/Initial Capital/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Stop Loss %/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Take Profit %/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Holding Period/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Signal Type/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Position Sizing/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Allow Leverage/i)).toBeInTheDocument();
    });

    test('has proper button roles', () => {
      render(<BacktestControls {...defaultProps} />);
      
      expect(screen.getByRole('button', { name: /Run Backtest/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Optimize Parameters/i })).toBeInTheDocument();
    });

    test('is keyboard navigable', () => {
      render(<BacktestControls {...defaultProps} />);
      
      // Test tab navigation
      const initialCapitalInput = screen.getByLabelText(/Initial Capital/i);
      fireEvent.keyDown(initialCapitalInput, { key: 'Tab' });
      
      // Should move to next input
      const stopLossInput = screen.getByLabelText(/Stop Loss %/i);
      expect(document.activeElement).toBe(stopLossInput);
    });
  });

  describe('Performance', () => {
    test('handles rapid user input without performance issues', async () => {
      render(<BacktestControls {...defaultProps} />);
      
      // Simulate rapid typing
      const initialCapitalInput = screen.getByLabelText(/Initial Capital/i);
      
      for (let i = 0; i < 100; i++) {
        fireEvent.change(initialCapitalInput, { target: { value: `${i}` } });
      }
      
      // Should still work normally
      expect(initialCapitalInput).toHaveValue('99');
    });

    test('handles concurrent operations gracefully', async () => {
      // Mock slow API response
      mockApi.runBacktest.mockImplementation(() => new Promise(resolve => {
        setTimeout(() => resolve({
          trades: [],
          performance_metrics: { total_return: 10.5 },
          equity_curve: [],
          summary: {},
          execution_time: 1.5,
          signals_processed: 100,
        }), 200);
      }));

      render(<BacktestControls {...defaultProps} />);
      
      // Upload file
      fireEvent.click(screen.getByText('Mock Upload'));
      
      // Start backtest
      fireEvent.click(screen.getByRole('button', { name: /Run Backtest/i }));
      
      // Try to start optimization while backtest is running
      fireEvent.click(screen.getByRole('button', { name: /Optimize Parameters/i }));
      
      // Should not crash and should show appropriate loading states
      expect(screen.getByText(/Running Backtest.../i)).toBeInTheDocument();
    });
  });

  describe('Error Boundaries', () => {
    test('handles component errors gracefully', () => {
      const ErrorComponent = () => {
        throw new Error('Test error');
      };
      
      // Mock the component to throw an error
      jest.spyOn(React, 'createElement').mockImplementation((component, props, ...children) => {
        if (component === BacktestControls) {
          return <ErrorComponent {...props} {...children} />;
        }
        return React.createElement(component, props, ...children);
      });
      
      expect(() => render(<BacktestControls {...defaultProps} />)).toThrow('Test error');
    });
  });

  describe('Integration with Other Components', () => {
    test('works with parent component state', () => {
      const parentState = {
        isRunning: false,
        results: null,
      };
      
      const ParentComponent = () => {
        const [state, setState] = React.useState(parentState);
        
        return (
          <div>
            <BacktestControls
              {...defaultProps}
              disabled={state.isRunning}
              onBacktestComplete={(results) => {
                setState({ ...state, results, isRunning: false });
              }}
            />
            {state.results && (
              <div data-testid="results-display">
                Results available
              </div>
            )}
          </div>
        );
      };
      
      render(<ParentComponent />);
      
      // Upload file and run backtest
      fireEvent.click(screen.getByText('Mock Upload'));
      fireEvent.change(screen.getByLabelText(/Initial Capital/i), {
        target: { value: '100000' },
      });
      fireEvent.click(screen.getByRole('button', { name: /Run Backtest/i }));
      
      // Should show results when complete
      await waitFor(() => {
        expect(screen.getByTestId('results-display')).toBeInTheDocument();
      });
    });
  });
});