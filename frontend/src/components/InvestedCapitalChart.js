import React from 'react';
import Plot from 'react-plotly.js';
import { Box, Typography } from '@mui/material';

const InvestedCapitalChart = ({ trades, initialCapital }) => {
  // Calculate invested capital over time from trades data
  const investedCapitalData = calculateInvestedCapitalOverTime(trades, initialCapital);

  if (investedCapitalData.length === 0) {
    return (
      <Box sx={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography>No invested capital data available.</Typography>
      </Box>
    );
  }

  // Calculate statistics
  const investedValues = investedCapitalData.map(d => d.investedValue);
  const maxInvested = Math.max(...investedValues);
  const avgInvested = investedValues.reduce((a, b) => a + b, 0) / investedValues.length;
  const totalDeployed = investedValues.reduce((a, b) => a + b, 0);
  const utilizationRate = initialCapital > 0 ? (maxInvested / initialCapital * 100) : 0;

  // Create the Plotly chart
  const plotData = [{
    x: investedCapitalData.map(point => point.date),
    y: investedCapitalData.map(point => point.investedValue),
    type: 'scatter',
    mode: 'lines+markers',
    name: 'Invested Capital',
    line: {
      color: '#2ca02c',
      width: 2
    },
    marker: {
      size: 4,
      color: '#2ca02c'
    },
    hovertemplate: '<b>Date:</b> %{x}<br><b>Invested Capital:</b> $%{y:,.0f}<extra></extra>',
    hoverlabel: {
      bgcolor: 'rgba(0,0,0,0.8)',
      bordercolor: 'white',
      font: { color: 'white' }
    }
  }];

  // Add initial capital reference line
  if (initialCapital > 0) {
    plotData.push({
      x: [investedCapitalData[0]?.date, investedCapitalData[investedCapitalData.length - 1]?.date],
      y: [initialCapital, initialCapital],
      type: 'scatter',
      mode: 'lines',
      name: `Total Capital: $${initialCapital.toLocaleString()}`,
      line: {
        color: 'blue',
        width: 1,
        dash: 'dash'
      },
      showlegend: true,
      hoverinfo: 'skip'
    });
  }

  const layout = {
    title: {
      text: 'Capital Deployment Timeline',
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
        text: 'Invested Capital ($)',
        font: { color: 'white' }
      },
      tickformat: '$,.0f',
      tickfont: { color: 'white' },
      gridcolor: 'rgba(255,255,255,0.1)'
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

// Helper function to calculate invested capital over time from trades
function calculateInvestedCapitalOverTime(trades, initialCapital) {
  if (!trades || trades.length === 0) {
    return [];
  }

  // Create a map to track daily invested capital
  const dailyInvested = new Map();

  // Initialize with starting capital
  const startDate = new Date(Math.min(...trades.map(t => new Date(t['Entry Date'] || t.entry_date))));
  const endDate = new Date(Math.max(...trades.map(t => new Date(t['Exit Date'] || t.exit_date))));

  // Create daily date range
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    dailyInvested.set(currentDate.toISOString().split('T')[0], 0);
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Process each trade
  trades.forEach(trade => {
    const entryDate = new Date(trade['Entry Date'] || trade.entry_date);
    const exitDate = new Date(trade['Exit Date'] || trade.exit_date);
    const positionValue = trade['Position Value'] || trade.position_value || 0;

    // Add position value on entry date
    const entryDateStr = entryDate.toISOString().split('T')[0];
    if (dailyInvested.has(entryDateStr)) {
      dailyInvested.set(entryDateStr, dailyInvested.get(entryDateStr) + positionValue);
    }

    // Remove position value on exit date + 1 (when capital becomes available again)
    const exitDatePlusOne = new Date(exitDate);
    exitDatePlusOne.setDate(exitDatePlusOne.getDate() + 1);
    const exitDateStr = exitDatePlusOne.toISOString().split('T')[0];
    if (dailyInvested.has(exitDateStr)) {
      dailyInvested.set(exitDateStr, dailyInvested.get(exitDateStr) - positionValue);
    }
  });

  // Convert to cumulative array
  let cumulativeInvested = 0;
  const result = [];

  // Sort dates
  const sortedDates = Array.from(dailyInvested.keys()).sort();

  sortedDates.forEach(dateStr => {
    const change = dailyInvested.get(dateStr);
    cumulativeInvested += change;
    cumulativeInvested = Math.max(0, cumulativeInvested); // Ensure non-negative

    result.push({
      date: new Date(dateStr),
      investedValue: cumulativeInvested
    });
  });

  return result;
}

export default InvestedCapitalChart;