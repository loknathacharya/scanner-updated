import React, { useState, useEffect, useRef } from 'react';
import Plot from 'react-plotly.js';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  ZoomIn,
  ZoomOut,
  Fullscreen,
  Download,
  Info,
  ShowChart,
  Timeline,
  BarChart,
} from '@mui/icons-material';
import './InteractiveCharts.css';

const InteractiveCharts = ({ data, layout, config, onUpdate, disabled = false }) => {
  const plotRef = useRef(null);
  const [chartType, setChartType] = useState('line');
  const [timeframe, setTimeframe] = useState('1Y');

  const handleChartTypeChange = (event, newValue) => {
    setChartType(newValue);
  };

  const handleTimeframeChange = (event) => {
    setTimeframe(event.target.value);
  };

  const handleDownload = () => {
    if (plotRef.current) {
      plotRef.current.el.toImage({ format: 'png', width: 1200, height: 600 }).then((dataUrl) => {
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = 'chart.png';
        link.click();
      });
    }
  };

  const chartOptions = [
    { value: 'line', label: 'Line', icon: <ShowChart /> },
    { value: 'candlestick', label: 'Candlestick', icon: <Timeline /> },
    { value: 'bar', label: 'Bar', icon: <BarChart /> },
  ];

  const timeframeOptions = ['1D', '5D', '1M', '6M', '1Y', '5Y', 'MAX'];

  return (
    <Card className="interactive-charts-card">
      <CardContent>
        <Box className="chart-header">
          <Typography variant="h6" className="chart-title">
            Interactive Chart
          </Typography>
          <Box className="chart-controls">
            <FormControl size="small" className="timeframe-select">
              <InputLabel>Timeframe</InputLabel>
              <Select value={timeframe} onChange={handleTimeframeChange} disabled={disabled}>
                {timeframeOptions.map((tf) => (
                  <MenuItem key={tf} value={tf}>
                    {tf}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Tabs
              value={chartType}
              onChange={handleChartTypeChange}
              className="chart-type-tabs"
              disabled={disabled}
            >
              {chartOptions.map((opt) => (
                <Tab key={opt.value} value={opt.value} icon={opt.icon} />
              ))}
            </Tabs>
            <Tooltip title="Zoom In">
              <span>
                <IconButton disabled={disabled}>
                  <ZoomIn />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Zoom Out">
              <span>
                <IconButton disabled={disabled}>
                  <ZoomOut />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Fullscreen">
              <span>
                <IconButton disabled={disabled}>
                  <Fullscreen />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Download Chart">
              <span>
                <IconButton onClick={handleDownload} disabled={disabled}>
                  <Download />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Chart Info">
              <span>
                <IconButton disabled={disabled}>
                  <Info />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        </Box>
        <Box className="chart-container">
          <Plot
            ref={plotRef}
            data={data}
            layout={{
              ...layout,
              autosize: true,
              paper_bgcolor: '#2a2a2a',
              plot_bgcolor: '#2a2a2a',
              font: { color: '#e0e0e0' },
            }}
            config={{
              ...config,
              responsive: true,
              displaylogo: false,
            }}
            style={{ width: '100%', height: '100%' }}
            onUpdate={onUpdate}
          />
        </Box>
      </CardContent>
    </Card>
  );
};

export default InteractiveCharts;