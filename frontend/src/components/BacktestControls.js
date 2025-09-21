/**
 * BacktestControls Component
 * 
 * React component for controlling backtest parameters and execution
 * Integrates with the scanner's filtered results to run backtests
 * without requiring manual file uploads.
 */

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const BacktestControls = ({ filteredResults, ohlcvData, onBacktestComplete, apiBase }) => {
  const [backtestParams, setBacktestParams] = useState({
    initialCapital: 100000,
    stopLoss: 5.0,
    takeProfit: null,
    holdingPeriod: 20,
    signalType: 'long',
    positionSizing: 'equal_weight',
    allowLeverage: false,
    riskManagement: {
      maxDrawdown: 20,
      maxPositions: 10,
      stopLossMethod: 'percentage'
    }
  });

  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [ohlcvState, setOhlcvState] = useState([]);

  // Update available position sizing options based on data
  useEffect(() => {
    if (filteredResults && filteredResults.length > 0) {
      // Auto-detect position sizing options based on data
      const hasVolumeData = filteredResults.some(item => item.volume !== undefined);
      const hasPriceData = filteredResults.some(item => item.close !== undefined);
      
      // You can customize available options based on data availability
      console.log('Data availability:', { hasVolumeData, hasPriceData });
    }
  }, [filteredResults]);

  // Fetch OHLCV data from backend if not provided (reuse uploaded dataset)
  useEffect(() => {
    const fetchOhlcv = async () => {
      try {
        if ((!ohlcvData || ohlcvData.length === 0) && apiBase) {
          const res = await fetch(`${apiBase}/data/ohlcv?limit=50000`);
          if (!res.ok) {
            console.warn('Failed to fetch OHLCV from backend');
            return;
          }
          const json = await res.json();
          setOhlcvState(json.data || []);
          console.log('Fetched OHLCV rows:', json.count);
        }
      } catch (e) {
        console.warn('OHLCV fetch error:', e);
      }
    };
    fetchOhlcv();
  }, [apiBase, ohlcvData]);

  const handleParamChange = (param, value) => {
    setBacktestParams(prev => ({
      ...prev,
      [param]: value
    }));
  };

  const handleRiskManagementChange = (param, value) => {
    setBacktestParams(prev => ({
      ...prev,
      riskManagement: {
        ...prev.riskManagement,
        [param]: value
      }
    }));
  };

  const runBacktest = async () => {
    if (!filteredResults || filteredResults.length === 0) {
      setError('No filtered results available for backtesting');
      return;
    }

    setIsRunning(true);
    setError(null);
    setProgress(0);
    setResults(null);

    try {
        // Prepare request data
        const ohlcvPayload = (ohlcvData && ohlcvData.length > 0) ? ohlcvData : ohlcvState;
        const requestData = {
          signals_data: filteredResults,
          ohlcv_data: ohlcvPayload,
          ...backtestParams
        };

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      // Call the backtest API (use absolute API base to avoid dev-server 404/HTML)
      const response = await fetch(`${apiBase}/backtest/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Backtest failed');
      }

      const data = await response.json();
      setResults(data);
      
      // Notify parent component of completion
      if (onBacktestComplete) {
        onBacktestComplete(data);
      }

    } catch (err) {
      console.error('Backtest failed:', err);
      setError(err.message || 'Backtest execution failed');
    } finally {
      setIsRunning(false);
      setTimeout(() => setProgress(0), 1000); // Reset progress after delay
    }
  };

  const runOptimization = async () => {
    if (!filteredResults || filteredResults.length === 0) {
      setError('No filtered results available for optimization');
      return;
    }

    setIsRunning(true);
    setError(null);
    setProgress(0);

    try {
      // Define parameter ranges for optimization
      const paramRanges = {
        stop_loss: [1.0, 3.0, 5.0, 7.0, 10.0],
        take_profit: [null, 5.0, 10.0, 15.0, 20.0],
        holding_period: [5, 10, 20, 30, 50]
      };

      const ohlcvPayload = (ohlcvData && ohlcvData.length > 0) ? ohlcvData : ohlcvState;
      const requestData = {
        signals_data: filteredResults,
        ohlcv_data: ohlcvPayload,
        param_ranges: paramRanges,
        ...backtestParams
      };

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 5, 95));
      }, 300);

      const response = await fetch(`${apiBase}/backtest/optimize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Optimization failed');
      }

      const data = await response.json();
      setResults(data);
      
      // Notify parent component of completion
      if (onBacktestComplete) {
        onBacktestComplete(data);
      }

    } catch (err) {
      console.error('Optimization failed:', err);
      setError(err.message || 'Optimization failed');
    } finally {
      setIsRunning(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  const resetResults = () => {
    setResults(null);
    setError(null);
  };

  const getSignalTypeLabel = (type) => {
    const labels = {
      'long': 'Long Only',
      'short': 'Short Only',
      'both': 'Long & Short'
    };
    return labels[type] || type;
  };

  const getPositionSizingLabel = (method) => {
    const labels = {
      'equal_weight': 'Equal Weight',
      'kelly': 'Kelly Criterion',
      'volatility_target': 'Volatility Targeting',
      'atr_based': 'ATR-based',
      'fixed_dollar': 'Fixed Dollar',
      'percentage': 'Percentage'
    };
    return labels[method] || method;
  };

  return (
    <div className="space-y-6">
      {/* Info Section */}
      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
        <span>Signals: {filteredResults ? filteredResults.length : 0}</span>
        <span>OHLCV: {ohlcvData ? ohlcvData.length : 0}</span>
      </div>

      {/* Progress Bar */}
      {isRunning && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Processing...</span>
            <span className="text-sm font-medium text-primary">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-red-700 dark:text-red-300 font-medium">{error}</span>
            </div>
            <button
              className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              onClick={() => setError(null)}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Parameters Form */}
      <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-300" htmlFor="initialCapital">
            Initial Capital ($)
          </label>
          <div className="mt-2">
            <input
              id="initialCapital"
              type="number"
              min="1000"
              step="1000"
              value={backtestParams.initialCapital}
              onChange={(e) => handleParamChange('initialCapital', parseFloat(e.target.value))}
              disabled={isRunning}
              className="block w-full rounded-lg border-0 bg-background-light/50 dark:bg-background-dark/50 py-2.5 px-3 text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-300" htmlFor="stopLoss">
            Stop Loss (%)
          </label>
          <div className="mt-2">
            <input
              id="stopLoss"
              type="number"
              min="0.1"
              step="0.1"
              value={backtestParams.stopLoss}
              onChange={(e) => handleParamChange('stopLoss', parseFloat(e.target.value))}
              disabled={isRunning}
              className="block w-full rounded-lg border-0 bg-background-light/50 dark:bg-background-dark/50 py-2.5 px-3 text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-300" htmlFor="takeProfit">
            Take Profit (%)
          </label>
          <div className="mt-2">
            <input
              id="takeProfit"
              type="number"
              min="1"
              step="1"
              placeholder="No limit"
              value={backtestParams.takeProfit || ''}
              onChange={(e) => handleParamChange('takeProfit', e.target.value ? parseFloat(e.target.value) : null)}
              disabled={isRunning}
              className="block w-full rounded-lg border-0 bg-background-light/50 dark:bg-background-dark/50 py-2.5 px-3 text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-300" htmlFor="holdingPeriod">
            Holding Period (days)
          </label>
          <div className="mt-2">
            <input
              id="holdingPeriod"
              type="number"
              min="1"
              step="1"
              value={backtestParams.holdingPeriod}
              onChange={(e) => handleParamChange('holdingPeriod', parseInt(e.target.value))}
              disabled={isRunning}
              className="block w-full rounded-lg border-0 bg-background-light/50 dark:bg-background-dark/50 py-2.5 px-3 text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-300" htmlFor="signalType">
            Signal Type
          </label>
          <div className="mt-2">
            <select
              id="signalType"
              value={backtestParams.signalType}
              onChange={(e) => handleParamChange('signalType', e.target.value)}
              disabled={isRunning}
              className="form-select block w-full rounded-lg border-0 bg-background-light/50 dark:bg-background-dark/50 py-2.5 px-3 text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
            >
              <option value="long">Long Only</option>
              <option value="short">Short Only</option>
              <option value="both">Long & Short</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-300" htmlFor="positionSizing">
            Position Sizing
          </label>
          <div className="mt-2">
            <select
              id="positionSizing"
              value={backtestParams.positionSizing}
              onChange={(e) => handleParamChange('positionSizing', e.target.value)}
              disabled={isRunning}
              className="form-select block w-full rounded-lg border-0 bg-background-light/50 dark:bg-background-dark/50 py-2.5 px-3 text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
            >
              <option value="equal_weight">Equal Weight</option>
              <option value="kelly">Kelly Criterion</option>
              <option value="volatility_target">Volatility Targeting</option>
              <option value="atr_based">ATR-based</option>
              <option value="fixed_dollar">Fixed Dollar</option>
              <option value="percentage">Percentage</option>
            </select>
          </div>
        </div>

        <div className="sm:col-span-2 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-900 dark:text-gray-300">Allow Leverage</span>
          <label className="relative inline-flex cursor-pointer items-center" htmlFor="allow-leverage">
            <input
              className="peer sr-only"
              id="allow-leverage"
              type="checkbox"
              checked={backtestParams.allowLeverage}
              onChange={(e) => handleParamChange('allowLeverage', e.target.checked)}
              disabled={isRunning}
            />
            <div className="peer h-6 w-11 rounded-full bg-gray-200 dark:bg-gray-700 after:absolute after:top-0.5 after:left-0.5 after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:ring-2 peer-focus:ring-primary/50 dark:border-gray-600"></div>
          </label>
        </div>
      </div>

      {/* Risk Management Section */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Risk Management</h3>
        <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-300" htmlFor="maxDrawdown">
              Max Drawdown (%)
            </label>
            <div className="mt-2">
              <input
                id="maxDrawdown"
                type="number"
                min="5"
                max="50"
                step="1"
                value={backtestParams.riskManagement.maxDrawdown}
                onChange={(e) => handleRiskManagementChange('maxDrawdown', parseFloat(e.target.value))}
                disabled={isRunning}
                className="block w-full rounded-lg border-0 bg-background-light/50 dark:bg-background-dark/50 py-2.5 px-3 text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-300" htmlFor="maxPositions">
              Max Positions
            </label>
            <div className="mt-2">
              <input
                id="maxPositions"
                type="number"
                min="1"
                max="50"
                step="1"
                value={backtestParams.riskManagement.maxPositions}
                onChange={(e) => handleRiskManagementChange('maxPositions', parseInt(e.target.value))}
                disabled={isRunning}
                className="block w-full rounded-lg border-0 bg-background-light/50 dark:bg-background-dark/50 py-2.5 px-3 text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
              />
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-300" htmlFor="stopLossMethod">
              Stop Loss Method
            </label>
            <div className="mt-2">
              <select
                id="stopLossMethod"
                value={backtestParams.riskManagement.stopLossMethod}
                onChange={(e) => handleRiskManagementChange('stopLossMethod', e.target.value)}
                disabled={isRunning}
                className="form-select block w-full rounded-lg border-0 bg-background-light/50 dark:bg-background-dark/50 py-2.5 px-3 text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
              >
                <option value="percentage">Standard</option>
                <option value="atr">Trailing Stop</option>
                <option value="volatility">ATR Trailing Stop</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6">
        <button
          className="w-full sm:w-auto rounded-lg bg-gray-200 dark:bg-gray-700 px-4 py-2.5 text-sm font-semibold text-gray-900 dark:text-white shadow-sm hover:bg-gray-300 dark:hover:bg-gray-600"
          type="button"
          onClick={resetResults}
          disabled={isRunning}
        >
          Clear Results
        </button>
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <button
            className="w-full sm:w-auto rounded-lg bg-primary/20 dark:bg-primary/30 px-4 py-2.5 text-sm font-semibold text-primary shadow-sm hover:bg-primary/30 dark:hover:bg-primary/40"
            type="button"
            onClick={runOptimization}
            disabled={isRunning || !filteredResults || filteredResults.length === 0}
          >
            {isRunning ? 'Optimizing...' : 'Optimize Parameters'}
          </button>
          <button
            className="w-full sm:w-auto rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            type="button"
            onClick={runBacktest}
            disabled={isRunning || !filteredResults || filteredResults.length === 0}
          >
            {isRunning ? 'Running Backtest...' : 'Run Backtest'}
          </button>
        </div>
      </div>
    </div>
  );
};

// PropTypes for type checking
BacktestControls.propTypes = {
  filteredResults: PropTypes.arrayOf(PropTypes.object),
  ohlcvData: PropTypes.arrayOf(PropTypes.object),
  onBacktestComplete: PropTypes.func,
  apiBase: PropTypes.string
};

BacktestControls.defaultProps = {
  filteredResults: [],
  ohlcvData: [],
  onBacktestComplete: null,
  apiBase: ''
};

export default BacktestControls;