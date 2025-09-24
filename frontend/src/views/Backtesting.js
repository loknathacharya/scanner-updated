import React, { useState, useEffect } from 'react';
import BacktestControls from '../components/BacktestControls';
import BacktestResults from '../components/BacktestResults';
import storageManager from '../utils/storageManager';

const Backtesting = ({ filteredResults, ohlcvData, apiBase }) => {
  // Persist backtest results using storageManager with a unique key
  const [backtestResults, setBacktestResults] = useState(() => {
    const savedResults = storageManager.getItem('backtest_results');
    return savedResults;
  });

  // Save results using storageManager whenever they change
  useEffect(() => {
    if (backtestResults) {
      storageManager.setItem('backtest_results', backtestResults);
    }
  }, [backtestResults]);

  // Clear results when new data is uploaded (detected by prop changes)
  useEffect(() => {
    const hasNewData = filteredResults || ohlcvData;
    if (hasNewData && backtestResults) {
      // Optional: Clear results when new data is available
      // Uncomment the next line if you want to clear results on new data upload
      // setBacktestResults(null);
      // localStorage.removeItem('backtest_results');
    }
  }, [filteredResults, ohlcvData]);

  const handleBacktestComplete = (data) => {
    setBacktestResults(data);
  };

  const handleClearResults = () => {
    setBacktestResults(null);
    storageManager.removeItem('backtest_results');
  };

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen">
      <div className="mx-auto max-w-7xl py-10 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">New Backtest</h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">Configure the parameters for your financial backtest.</p>
        </div>

        <div className="space-y-12">
          {/* Backtest Controls Section */}
          <div className="space-y-6 rounded-lg border border-gray-200/50 dark:border-gray-700/50 bg-white/20 dark:bg-black/20 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Backtest Parameters</h2>
            <BacktestControls
              filteredResults={filteredResults}
              ohlcvData={ohlcvData}
              onBacktestComplete={handleBacktestComplete}
              apiBase={apiBase}
            />
          </div>

          {/* Results Section */}
          {backtestResults && (
            <div className="space-y-6 rounded-lg border border-gray-200/50 dark:border-gray-700/50 bg-white/20 dark:bg-black/20 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Backtest Results</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Results are automatically saved and will persist until you upload new data or clear them manually
                  </p>
                </div>
                <button
                  onClick={handleClearResults}
                  className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                >
                  Clear Results
                </button>
              </div>
              <BacktestResults results={backtestResults} />
            </div>
          )}

          {/* No Results State */}
          {!backtestResults && (
            <div className="rounded-lg border border-gray-200/50 dark:border-gray-700/50 bg-white/20 dark:bg-black/20 p-12 text-center">
              <div className="text-gray-500 dark:text-gray-400">
                <svg className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Backtest Results</h3>
                <p className="text-sm">
                  Configure your backtest parameters above and run a backtest to see results here.
                  Results will be automatically saved and persist across sessions.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Backtesting;