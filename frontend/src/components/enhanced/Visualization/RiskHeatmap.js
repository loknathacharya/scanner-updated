import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Paper,
  Tooltip,
} from '@mui/material';
import { Warning } from '@mui/icons-material';
import './RiskHeatmap.css';

const RiskHeatmap = ({ data, disabled = false }) => {
  const getColor = (value) => {
    if (value > 0.8) return '#f44336'; // High risk
    if (value > 0.5) return '#ff9800'; // Medium risk
    if (value > 0.2) return '#ffc107'; // Low-medium risk
    return '#4caf50'; // Low risk
  };

  return (
    <Card className="risk-heatmap-card">
      <CardContent>
        <Typography variant="h6" className="heatmap-title">
          <Warning /> Risk Heatmap
        </Typography>
        <Box className="heatmap-container">
          {data.map((row, rowIndex) => (
            <Box key={rowIndex} className="heatmap-row">
              {row.map((cell, cellIndex) => (
                <Tooltip key={cellIndex} title={`${cell.label}: ${cell.value.toFixed(2)}`}>
                  <Paper
                    className="heatmap-cell"
                    style={{ backgroundColor: getColor(cell.value) }}
                  />
                </Tooltip>
              ))}
            </Box>
          ))}
        </Box>
        <Box className="heatmap-legend">
          <Box display="flex" alignItems="center">
            <Paper className="legend-color" style={{ backgroundColor: '#4caf50' }} />
            <Typography variant="caption">Low Risk</Typography>
          </Box>
          <Box display="flex" alignItems="center">
            <Paper className="legend-color" style={{ backgroundColor: '#ffc107' }} />
            <Typography variant="caption">Medium-Low Risk</Typography>
          </Box>
          <Box display="flex" alignItems="center">
            <Paper className="legend-color" style={{ backgroundColor: '#ff9800' }} />
            <Typography variant="caption">Medium Risk</Typography>
          </Box>
          <Box display="flex" alignItems="center">
            <Paper className="legend-color" style={{ backgroundColor: '#f44336' }} />
            <Typography variant="caption">High Risk</Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default RiskHeatmap;