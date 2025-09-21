import React, { useState } from 'react';
import { Grid, Paper, Typography, Box } from '@mui/material';
import ProfessionalHeader from '../components/enhanced/Header/ProfessionalHeader';
import SignalTypeBadges from '../components/enhanced/Header/SignalTypeBadges';
import PositionSizingControls from '../components/enhanced/Controls/PositionSizingControls';
import RiskManagementControls from '../components/enhanced/Controls/RiskManagementControls';
import FilterControls from '../components/enhanced/Controls/FilterControls';
import PerformanceMetrics from '../components/enhanced/Results/PerformanceMetrics';
import TradeAnalysis from '../components/enhanced/Results/TradeAnalysis';
import PortfolioAnalytics from '../components/enhanced/Results/PortfolioAnalytics';
import AdvancedFilterBuilder from '../components/enhanced/Filtering/AdvancedFilterBuilder';
import FilterPresets from '../components/enhanced/Filtering/FilterPresets';
import FilterTemplates from '../components/enhanced/Filtering/FilterTemplates';
import InteractiveCharts from '../components/enhanced/Visualization/InteractiveCharts';
import PerformanceDashboard from '../components/enhanced/Visualization/PerformanceDashboard';
import RiskHeatmap from '../components/enhanced/Visualization/RiskHeatmap';

const EnhancedBacktesting = () => {
  const [tradeData, setTradeData] = useState([
    { id: 1, ticker: 'AAPL', pnl: 100, duration: 5, exit_reason: 'take_profit', entry_date: '2023-01-01', exit_date: '2023-01-06', entry_price: 150, exit_price: 155, pnl_pct: 3.33, position_size: 1000 },
    { id: 2, ticker: 'GOOG', pnl: -50, duration: 3, exit_reason: 'stop_loss', entry_date: '2023-01-02', exit_date: '2023-01-05', entry_price: 2800, exit_price: 2750, pnl_pct: -1.78, position_size: 1000 },
  ]);
  const [portfolioData, setPortfolioData] = useState({
      initial_capital: 100000,
      equity_curve: [{date: '2023-01-01', equity: 100000}, {date: '2023-01-31', equity: 105000}],
      annualized_return: 10,
      sharpe_ratio: 1.2,
      calmar_ratio: 0.8,
      max_drawdown: -5,
      best_month_return: 5,
      worst_month_return: -2,
      monthly_returns: [{month: 'Jan', return: 5}, {month: 'Feb', return: -2}],
      asset_allocation: [{name: 'Stocks', percentage: 80}, {name: 'Bonds', percentage: 20}],
      sector_allocation: [{name: 'Tech', percentage: 60}, {name: 'Finance', percentage: 40}],
  });
  const [filterPresets, setFilterPresets] = useState([
      {id: 1, name: 'My Growth Stocks', filters: [{id: 1, field: 'market_cap', operator: 'gt', value: '10B'}]},
  ]);
  const [filterTemplates, setFilterTemplates] = useState([
      {id: 1, name: 'Value Trap', description: 'Low P/E but high debt', filters: [{id: 1, field: 'pe_ratio', operator: 'lt', value: '10'}, {id: 2, field: 'debt_to_equity', operator: 'gt', value: '2'}]},
  ]);
  const [riskData, setRiskData] = useState([
      [{label: 'Volatility', value: 0.6}, {label: 'Sharpe', value: 0.3}],
      [{label: 'Correlation', value: 0.8}, {label: 'Beta', value: 0.9}],
  ]);

  return (
    <div className="bg-background-light dark:bg-background-dark">
      <div className="mx-auto max-w-4xl py-10 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Enhanced Backtesting</h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">Advanced backtesting with comprehensive analytics and risk management.</p>
        </div>

        <div className="space-y-12">
          <div className="space-y-6 rounded-lg border border-gray-200/50 dark:border-gray-700/50 bg-white/20 dark:bg-black/20 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Position Sizing & Risk Management</h2>
            <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
              <PositionSizingControls />
              <RiskManagementControls />
            </div>
          </div>

          <div className="space-y-6 rounded-lg border border-gray-200/50 dark:border-gray-700/50 bg-white/20 dark:bg-black/20 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Performance Metrics</h2>
            <PerformanceMetrics tradeData={tradeData} />
            <TradeAnalysis tradeData={tradeData} />
            <PortfolioAnalytics portfolioData={portfolioData} />
          </div>

          <div className="space-y-6 rounded-lg border border-gray-200/50 dark:border-gray-700/50 bg-white/20 dark:bg-black/20 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Advanced Filtering</h2>
            <AdvancedFilterBuilder />
            <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
              <FilterPresets presets={filterPresets} />
              <FilterTemplates templates={filterTemplates} />
            </div>
          </div>

          <div className="space-y-6 rounded-lg border border-gray-200/50 dark:border-gray-700/50 bg-white/20 dark:bg-black/20 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Visualization & Analytics</h2>
            <InteractiveCharts data={[]} layout={{}} config={{}} />
            <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
              <PerformanceDashboard data={{totalReturn: 10, annualizedReturn: 5, sharpeRatio: 1.2, maxDrawdown: -8, winRate: 60, profitFactor: 1.8, bestTrade: 150, worstTrade: -70}} />
              <RiskHeatmap data={riskData} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedBacktesting;