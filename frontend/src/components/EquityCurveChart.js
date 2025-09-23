import React from 'react';
import Plot from 'react-plotly.js';
import { Box, Typography } from '@mui/material';

const EquityCurveChart = ({ equityCurve, trades, initialCapital }) => {
  // Handle different data structures and create portfolio progression
  let portfolioProgression = [];

  if (equityCurve && equityCurve.length > 0) {
    // Check if equityCurve is already a time series (has Date and Portfolio Value)
    if (equityCurve[0] && (equityCurve[0].Date || equityCurve[0].date) &&
        (equityCurve[0]['Portfolio Value'] || equityCurve[0].portfolio_value)) {

      const dates = equityCurve.map(d => {
        if (d.Date) return d.Date;
        if (d.date) return d.date;
        if (d.exit_date) return d.exit_date;
        if (d.entry_date) return d.entry_date;
        return new Date().toISOString();
      });

      const values = equityCurve.map(d => {
        if (d['Portfolio Value']) return Number(d['Portfolio Value']);
        if (d.portfolio_value) return Number(d.portfolio_value);
        if (d.portfolioValue) return Number(d.portfolioValue);
        if (d.value) return Number(d.value);
        return 0;
      });

      // Filter out invalid data
      portfolioProgression = dates.map((date, index) => ({
        date: new Date(date),
        portfolioValue: values[index]
      })).filter(d => !isNaN(d.date.getTime()) && Number.isFinite(d.portfolioValue));

    } else if (trades && trades.length > 0) {
      // Build equity curve from trades data
      let currentPortfolio = initialCapital || 100000;
      const tradeProgression = [{ date: new Date(trades[0]?.['Entry Date'] || trades[0]?.entry_date || new Date()), portfolioValue: currentPortfolio }];

      // Sort trades by date
      const sortedTrades = [...trades].sort((a, b) => new Date(a['Entry Date'] || a.entry_date) - new Date(b['Entry Date'] || b.entry_date));

      sortedTrades.forEach(trade => {
        const entryDate = new Date(trade['Entry Date'] || trade.entry_date);
        const exitDate = new Date(trade['Exit Date'] || trade.exit_date);
        const pnl = trade['P&L ($)'] || 0;

        // Add point at entry
        if (!tradeProgression.find(p => p.date.getTime() === entryDate.getTime())) {
          tradeProgression.push({ date: entryDate, portfolioValue: currentPortfolio });
        }

        // Update portfolio value
        currentPortfolio += pnl;

        // Add point at exit
        tradeProgression.push({ date: exitDate, portfolioValue: currentPortfolio });
      });

      portfolioProgression = tradeProgression;
    }
  }

  const validData = portfolioProgression;

  if (validData.length === 0) {
    return (
      <Box sx={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography>No valid equity curve data available.</Typography>
      </Box>
    );
  }

  // Sort data by date to ensure proper chronological order
  validData.sort((a, b) => a.date - b.date);

  // Create the Plotly chart
  const plotData = [{
    x: validData.map(point => point.date),
    y: validData.map(point => point.portfolioValue),
    type: 'scatter',
    mode: 'lines+markers',
    name: 'Portfolio Value',
    line: {
      color: '#1f77b4',
      width: 2
    },
    marker: {
      size: 4,
      color: '#1f77b4'
    },
    hovertemplate: '<b>Date:</b> %{x}<br><b>Portfolio Value:</b> $%{y:,.0f}<extra></extra>',
    hoverlabel: {
      bgcolor: 'rgba(0,0,0,0.8)',
      bordercolor: 'white',
      font: { color: 'white' }
    }
  }];

  // Add starting capital line
  const yValues = validData.map(point => point.portfolioValue);
  const minY = Math.min(...yValues);
  const maxY = Math.max(...yValues);

  const layout = {
    title: {
      text: 'Equity Curve - Portfolio Value Over Time',
      font: {
        size: 16,
        color: 'white'
      }
    },
    xaxis: {
      title: {
        text: 'Date',
        font: { color: 'white' }
      },
      type: 'date',
      tickformat: '%Y-%m-%d',
      tickfont: { color: 'white' },
      gridcolor: 'rgba(255,255,255,0.1)'
    },
    yaxis: {
      title: {
        text: 'Portfolio Value ($)',
        font: { color: 'white' }
      },
      tickformat: '$,.0f',
      tickfont: { color: 'white' },
      gridcolor: 'rgba(255,255,255,0.1)',
      range: [minY * 0.95, maxY * 1.05]
    },
    hovermode: 'x unified',
    showlegend: true,
    plot_bgcolor: 'rgba(0,0,0,0.8)',
    paper_bgcolor: 'rgba(0,0,0,0.8)',
    font: {
      family: 'Arial, sans-serif',
      size: 12,
      color: 'white'
    },
    margin: { l: 50, r: 50, t: 50, b: 50 },
    legend: {
      font: { color: 'white' }
    }
  };

  // Add starting capital reference line
  if (initialCapital > 0) {
    plotData.push({
      x: [validData[0]?.date, validData[validData.length - 1]?.date],
      y: [initialCapital, initialCapital],
      type: 'scatter',
      mode: 'lines',
      name: `Starting Capital: $${initialCapital.toLocaleString()}`,
      line: {
        color: 'green',
        width: 1,
        dash: 'dash'
      },
      showlegend: true,
      hoverinfo: 'skip'
    });
  }

  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      <Plot
        data={plotData}
        layout={layout}
        style={{ width: '100%', height: '100%' }}
        useResizeHandler={true}
        config={{
          displayModeBar: true,
          displaylogo: false,
          modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d']
        }}
      />
    </Box>
  );
};

export default EquityCurveChart;