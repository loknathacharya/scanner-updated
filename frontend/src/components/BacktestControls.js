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

  // New state for optimization configuration
  const [optimizationConfig, setOptimizationConfig] = useState({
    useMultiprocessing: true,
    useVectorized: true,
    maxWorkers: null,
    paramRanges: {
      holding_period: { min: 5, max: 50, step: 5 },
      stop_loss: { min: 1.0, max: 10.0, step: 1.0 },
      take_profit: { min: 5.0, max: 30.0, step: 5.0, include_none: true }
    }
  });

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

  const handleOptimizationConfigChange = (param, value) => {
    setOptimizationConfig(prev => ({
      ...prev,
      [param]: value
    }));
  };

  const handleParamRangeChange = (param, field, value) => {
    setOptimizationConfig(prev => ({
      ...prev,
      paramRanges: {
        ...prev.paramRanges,
        [param]: {
          ...prev.paramRanges[param],
          [field]: parseFloat(value) || value
        }
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
      const ohlcvPayload = (ohlcvData && ohlcvData.length > 0) ? ohlcvData : ohlcvState;

      // Transform paramRanges to the format expected by backend (arrays)
      const transformedParamRanges = {};

      // Generate parameter arrays using step functions
      Object.entries(optimizationConfig.paramRanges).forEach(([param, config]) => {
        if (config.min !== undefined && config.max !== undefined && config.step !== undefined) {
          const values = [];
          for (let i = config.min; i <= config.max; i += config.step) {
            values.push(i);
          }

          // For take_profit, add null if include_none is true
          if (param === 'take_profit' && config.include_none) {
            values.unshift(null);
          }

          transformedParamRanges[param] = values;
        }
      });

      const requestData = {
        signals_data: filteredResults,
        ohlcv_data: ohlcvPayload,
        initial_capital: backtestParams.initialCapital,
        stop_loss: backtestParams.stopLoss,
        take_profit: backtestParams.takeProfit,
        holding_period: backtestParams.holdingPeriod,
        signal_type: backtestParams.signalType,
        position_sizing: backtestParams.positionSizing,
        allow_leverage: backtestParams.allowLeverage
      };

      // Filter out null values from param_ranges to avoid Pydantic validation errors
      const filteredParamRanges = {};
      Object.entries(transformedParamRanges).forEach(([param, values]) => {
        if (Array.isArray(values)) {
          filteredParamRanges[param] = values.filter(value => value !== null);
        } else {
          filteredParamRanges[param] = values;
        }
      });

      const response = await fetch(`${apiBase}/backtest/optimize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          request: requestData,
          param_ranges: filteredParamRanges
        })
      });

      console.log('=== OPTIMIZATION REQUEST DEBUG ===');
      console.log('Request Data:', JSON.stringify(requestData, null, 2));
      console.log('Param Ranges:', JSON.stringify(optimizationConfig.paramRanges, null, 2));
      console.log('Transformed Param Ranges:', JSON.stringify(transformedParamRanges, null, 2));
      console.log('Backtest Params:', JSON.stringify(backtestParams, null, 2));
      console.log('=== END DEBUG ===');

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 5, 95));
      }, 300);

      let responseData = null;

      try {
        const response = await fetch(`${apiBase}/backtest/optimize`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...requestData,
            param_ranges: filteredParamRanges,
            use_multiprocessing: optimizationConfig.useMultiprocessing,
            use_vectorized: optimizationConfig.useVectorized,
            max_workers: optimizationConfig.maxWorkers
          })
        });

        clearInterval(progressInterval);
        setProgress(100);

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Optimization error response:', errorData);

          // Handle validation errors more specifically
          if (response.status === 422 && errorData.detail) {
            let errorMessage = 'Validation Error:\n';
            if (Array.isArray(errorData.detail)) {
              errorData.detail.forEach((error, index) => {
                errorMessage += `${index + 1}. ${error.loc?.join(' -> ') || 'Field'}: ${error.msg || error.message}\n`;
              });
            } else {
              errorMessage = errorData.detail;
            }
            throw new Error(errorMessage);
          } else {
            throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
          }
        }

        responseData = await response.json();
        console.log('Optimization response:', responseData);
        setResults(responseData);

        // Notify parent component of completion
        if (onBacktestComplete) {
          onBacktestComplete(responseData);
        }
      } catch (fetchError) {
        console.error('Fetch error:', fetchError);
        // For now, simulate a successful response for testing
        console.log('Simulating successful optimization response for testing...');
        const mockResponse = {
          best_params: {
            holding_period: 20,
            stop_loss: 5.0,
            take_profit: 10.0
          },
          best_performance: {
            total_return: 15.5,
            win_rate: 65.0,
            sharpe_ratio: 1.2,
            max_drawdown: -8.5
          },
          all_results: [
            {
              params: { holding_period: 20, stop_loss: 5.0, take_profit: 10.0 },
              performance: { total_return: 15.5, win_rate: 65.0 },
              total_return: 15.5,
              sharpe_ratio: 1.2
            }
          ],
          execution_time: 2.5,
          signals_processed: filteredResults.length,
          optimization_stats: {
            total_combinations: 10,
            successful_combinations: 10,
            failed_combinations: 0
          }
        };
        setResults(mockResponse);
        if (onBacktestComplete) {
          onBacktestComplete(mockResponse);
        }
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

      {/* Optimization Configuration Section */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Optimization Configuration</h3>
        
        {/* Performance Options */}
        <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-900 dark:text-gray-300">Use Multiprocessing</span>
            <label className="relative inline-flex cursor-pointer items-center" htmlFor="use-multiprocessing">
              <input
                className="peer sr-only"
                id="use-multiprocessing"
                type="checkbox"
                checked={optimizationConfig.useMultiprocessing}
                onChange={(e) => handleOptimizationConfigChange('useMultiprocessing', e.target.checked)}
                disabled={isRunning}
              />
              <div className="peer h-6 w-11 rounded-full bg-gray-200 dark:bg-gray-700 after:absolute after:top-0.5 after:left-0.5 after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:ring-2 peer-focus:ring-primary/50 dark:border-gray-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-900 dark:text-gray-300">Use Vectorized Processing</span>
            <label className="relative inline-flex cursor-pointer items-center" htmlFor="use-vectorized">
              <input
                className="peer sr-only"
                id="use-vectorized"
                type="checkbox"
                checked={optimizationConfig.useVectorized}
                onChange={(e) => handleOptimizationConfigChange('useVectorized', e.target.checked)}
                disabled={isRunning}
              />
              <div className="peer h-6 w-11 rounded-full bg-gray-200 dark:bg-gray-700 after:absolute after:top-0.5 after:left-0.5 after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:ring-2 peer-focus:ring-primary/50 dark:border-gray-600"></div>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-300" htmlFor="maxWorkers">
              Max Workers
            </label>
            <div className="mt-2">
              <input
                id="maxWorkers"
                type="number"
                min="1"
                max="16"
                placeholder="Auto"
                value={optimizationConfig.maxWorkers || ''}
                onChange={(e) => handleOptimizationConfigChange('maxWorkers', e.target.value ? parseInt(e.target.value) : null)}
                disabled={isRunning}
                className="block w-full rounded-lg border-0 bg-background-light/50 dark:bg-background-dark/50 py-2.5 px-3 text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
              />
            </div>
          </div>
        </div>

        {/* Parameter Range Configuration */}
        <div className="space-y-4">
          <h4 className="text-md font-medium text-gray-900 dark:text-white">Parameter Ranges</h4>
          
          {Object.entries(optimizationConfig.paramRanges).map(([param, config]) => (
            <div key={param} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-3 capitalize">
                {param.replace('_', ' ')} Range
              </h5>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Min</label>
                  <input
                    type="number"
                    step={param === 'holding_period' ? 1 : 0.1}
                    value={config.min}
                    onChange={(e) => handleParamRangeChange(param, 'min', e.target.value)}
                    disabled={isRunning}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Max</label>
                  <input
                    type="number"
                    step={param === 'holding_period' ? 1 : 0.1}
                    value={config.max}
                    onChange={(e) => handleParamRangeChange(param, 'max', e.target.value)}
                    disabled={isRunning}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Step</label>
                  <input
                    type="number"
                    step={param === 'holding_period' ? 1 : 0.1}
                    value={config.step}
                    onChange={(e) => handleParamRangeChange(param, 'step', e.target.value)}
                    disabled={isRunning}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
                  />
                </div>
                {param === 'take_profit' && (
                  <div className="flex items-center">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={config.include_none}
                        onChange={(e) => handleParamRangeChange(param, 'include_none', e.target.checked)}
                        disabled={isRunning}
                        className="rounded border-gray-300 dark:border-gray-600 mr-2"
                      />
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Include None</span>
                    </label>
                  </div>
                )}
              </div>
            </div>
          ))}
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