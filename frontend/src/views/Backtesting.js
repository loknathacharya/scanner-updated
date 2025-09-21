import React, { useState } from 'react';
import BacktestControls from '../components/BacktestControls';
import BacktestResults from '../components/BacktestResults';

const Backtesting = ({ filteredResults, ohlcvData, apiBase }) => {
  const [backtestResults, setBacktestResults] = useState(null);

  const handleBacktestComplete = (data) => {
    setBacktestResults(data);
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
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Backtest Results</h2>
              <BacktestResults results={backtestResults} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Backtesting;