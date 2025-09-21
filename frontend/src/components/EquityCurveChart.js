import React from 'react';
import Plot from 'react-plotly.js';
import { Box, Typography, Paper } from '@mui/material';

const EquityCurveChart = ({ equityCurve, initialCapital }) => {
  if (!equityCurve || equityCurve.length === 0) {
    return <Typography>No equity curve data available.</Typography>;
  }

  const dates = equityCurve.map(d => d.Date || d.date);
  const values = equityCurve.map(d => d['Portfolio Value'] || d.portfolio_value);

  // Fallback baseline if initialCapital is undefined/null/non-numeric
  const baseline = Number.isFinite(Number(initialCapital))
    ? Number(initialCapital)
    : (typeof values?.[0] === 'number' ? Number(values[0]) : 0);
  const baselineLabel = Number.isFinite(baseline)
    ? baseline.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : '0.00';

  return (
    <Paper variant="outlined">
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Portfolio Performance
        </Typography>
        <Plot
          data={[
            {
              x: dates,
              y: values,
              type: 'scatter',
              mode: 'lines',
              name: 'Portfolio Value',
              line: { color: '#1976d2' },
            },
          ]}
          layout={{
            title: 'Equity Curve',
            height: 500,
            xaxis: {
              title: 'Date',
              type: 'date',
            },
            yaxis: {
              title: 'Portfolio Value ($)',
            },
            shapes: [
              {
                type: 'line',
                x0: dates[0],
                y0: baseline,
                x1: dates[dates.length - 1],
                y1: baseline,
                line: {
                  color: 'grey',
                  width: 2,
                  dash: 'dash',
                },
              },
            ],
            annotations: [
              {
                x: dates[Math.floor(dates.length / 2)],
                y: baseline,
                text: `Initial Capital: $${baselineLabel}`,
                showarrow: false,
                yanchor: 'bottom',
              },
            ],
          }}
          style={{ width: '100%' }}
          config={{ responsive: true }}
        />
      </Box>
    </Paper>
  );
};

export default EquityCurveChart;