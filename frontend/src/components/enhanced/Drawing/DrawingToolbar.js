import React, { useState, useCallback, useMemo } from 'react';
import {
  Box,
  Paper,
  IconButton,
  Tooltip,
  ToggleButton,
  ToggleButtonGroup,
  Divider,
  Typography,
  Popover,
  Slider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  ButtonGroup,
  Chip,
} from '@mui/material';
import {
  ShowChart,
  Timeline,
  Rectangle,
  RadioButtonUnchecked,
  TextFields,
  ArrowRight,
  HorizontalRule,
  VerticalAlignCenter,
  Notifications,
  Palette,
  Settings,
  Delete,
  Clear,
  Save,
  Undo,
  Redo,
} from '@mui/icons-material';
import { DRAWING_TOOL_TYPES, DRAWING_STYLES } from '../../../utils/DrawingToolsManager';

const DrawingToolbar = ({
  drawingManager,
  onToolSelect,
  onStyleChange,
  onClearAll,
  onUndo,
  onRedo,
  className = '',
}) => {
  const [selectedTool, setSelectedTool] = useState(null);
  const [styleAnchorEl, setStyleAnchorEl] = useState(null);
  const [currentStyle, setCurrentStyle] = useState({
    color: DRAWING_STYLES.COLORS[0],
    lineWidth: 2,
    lineStyle: 'solid',
    fillColor: null,
    fillOpacity: 0.1,
  });

  const tools = useMemo(() => [
    {
      type: DRAWING_TOOL_TYPES.TREND_LINE,
      icon: <ShowChart />,
      label: 'Trend Line',
      tooltip: 'Draw trend lines on the chart',
    },
    {
      type: DRAWING_TOOL_TYPES.FIBONACCI_RETRACEMENT,
      icon: <Timeline />,
      label: 'Fibonacci',
      tooltip: 'Draw Fibonacci retracement levels',
    },
    {
      type: DRAWING_TOOL_TYPES.RECTANGLE,
      icon: <Rectangle />,
      label: 'Rectangle',
      tooltip: 'Draw rectangle shapes',
    },
    {
      type: DRAWING_TOOL_TYPES.ELLIPSE,
      icon: <RadioButtonUnchecked />,
      label: 'Ellipse',
      tooltip: 'Draw ellipse/circle shapes',
    },
    {
      type: DRAWING_TOOL_TYPES.TEXT_ANNOTATION,
      icon: <TextFields />,
      label: 'Text',
      tooltip: 'Add text annotations',
    },
    {
      type: DRAWING_TOOL_TYPES.ARROW,
      icon: <ArrowRight />,
      label: 'Arrow',
      tooltip: 'Draw arrows and pointers',
    },
    {
      type: DRAWING_TOOL_TYPES.HORIZONTAL_LINE,
      icon: <HorizontalRule />,
      label: 'Horizontal Line',
      tooltip: 'Draw horizontal price lines',
    },
    {
      type: DRAWING_TOOL_TYPES.VERTICAL_LINE,
      icon: <VerticalAlignCenter />,
      label: 'Vertical Line',
      tooltip: 'Draw vertical time lines',
    },
    {
      type: DRAWING_TOOL_TYPES.PRICE_ALERT,
      icon: <Notifications />,
      label: 'Price Alert',
      tooltip: 'Set price alerts',
    },
  ], []);

  const handleToolSelect = useCallback((toolType) => {
    const newTool = toolType === selectedTool ? null : toolType;
    setSelectedTool(newTool);

    if (drawingManager) {
      if (newTool) {
        drawingManager.startDrawing(newTool, { style: currentStyle });
      } else {
        drawingManager.cancelDrawing();
      }
    }

    if (onToolSelect) {
      onToolSelect(newTool);
    }
  }, [selectedTool, drawingManager, currentStyle, onToolSelect]);

  const handleStyleClick = useCallback((event) => {
    setStyleAnchorEl(event.currentTarget);
  }, []);

  const handleStyleClose = useCallback(() => {
    setStyleAnchorEl(null);
  }, []);

  const handleStyleChange = useCallback((newStyle) => {
    setCurrentStyle(prev => ({ ...prev, ...newStyle }));
    if (onStyleChange) {
      onStyleChange(newStyle);
    }
  }, [onStyleChange]);

  const handleClearAll = useCallback(() => {
    if (drawingManager) {
      drawingManager.clearAllTools();
    }
    if (onClearAll) {
      onClearAll();
    }
  }, [drawingManager, onClearAll]);

  const handleUndo = useCallback(() => {
    if (drawingManager) {
      // Implementation would depend on drawing manager's undo functionality
      console.log('Undo not yet implemented');
    }
    if (onUndo) {
      onUndo();
    }
  }, [drawingManager, onUndo]);

  const handleRedo = useCallback(() => {
    if (drawingManager) {
      // Implementation would depend on drawing manager's redo functionality
      console.log('Redo not yet implemented');
    }
    if (onRedo) {
      onRedo();
    }
  }, [drawingManager, onRedo]);

  const isStyleOpen = Boolean(styleAnchorEl);

  return (
    <Paper
      variant="outlined"
      className={`drawing-toolbar ${className}`}
      sx={{
        p: 1,
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        flexWrap: 'wrap',
        minHeight: '60px',
      }}
    >
      {/* Tool Selection */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Typography variant="subtitle2" sx={{ mr: 1, fontWeight: 600 }}>
          Drawing Tools
        </Typography>

        <ToggleButtonGroup
          value={selectedTool}
          exclusive
          onChange={(event, newTool) => handleToolSelect(newTool)}
          size="small"
        >
          {tools.map((tool) => (
            <Tooltip key={tool.type} title={tool.tooltip}>
              <ToggleButton
                value={tool.type}
                aria-label={tool.label}
                sx={{
                  minWidth: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  '&.Mui-selected': {
                    backgroundColor: 'primary.main',
                    color: 'primary.contrastText',
                    '&:hover': {
                      backgroundColor: 'primary.dark',
                    },
                  },
                }}
              >
                {tool.icon}
              </ToggleButton>
            </Tooltip>
          ))}
        </ToggleButtonGroup>
      </Box>

      <Divider orientation="vertical" flexItem />

      {/* Style Controls */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Tooltip title="Drawing Style">
          <IconButton
            size="small"
            onClick={handleStyleClick}
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: '8px',
            }}
          >
            <Palette />
          </IconButton>
        </Tooltip>

        <Popover
          open={isStyleOpen}
          anchorEl={styleAnchorEl}
          onClose={handleStyleClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
        >
          <Box sx={{ p: 2, minWidth: 250 }}>
            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              Drawing Style
            </Typography>

            {/* Color Selection */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Color
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                {DRAWING_STYLES.COLORS.map((color) => (
                  <Tooltip key={color} title={color}>
                    <Box
                      onClick={() => handleStyleChange({ color })}
                      sx={{
                        width: 24,
                        height: 24,
                        backgroundColor: color,
                        borderRadius: '50%',
                        cursor: 'pointer',
                        border: currentStyle.color === color ? '2px solid #000' : '1px solid #ccc',
                        '&:hover': {
                          transform: 'scale(1.1)',
                        },
                        transition: 'all 0.2s',
                      }}
                    />
                  </Tooltip>
                ))}
              </Box>
            </Box>

            {/* Line Width */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Line Width: {currentStyle.lineWidth}
              </Typography>
              <Slider
                value={currentStyle.lineWidth}
                onChange={(event, value) => handleStyleChange({ lineWidth: value })}
                min={1}
                max={5}
                step={1}
                marks
                size="small"
              />
            </Box>

            {/* Line Style */}
            <Box sx={{ mb: 2 }}>
              <FormControl size="small" fullWidth>
                <InputLabel>Line Style</InputLabel>
                <Select
                  value={currentStyle.lineStyle}
                  label="Line Style"
                  onChange={(event) => handleStyleChange({ lineStyle: event.target.value })}
                >
                  {DRAWING_STYLES.LINE_STYLES.map((style) => (
                    <MenuItem key={style} value={style}>
                      {style.charAt(0).toUpperCase() + style.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Fill Opacity */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Fill Opacity: {Math.round(currentStyle.fillOpacity * 100)}%
              </Typography>
              <Slider
                value={currentStyle.fillOpacity}
                onChange={(event, value) => handleStyleChange({ fillOpacity: value })}
                min={0}
                max={1}
                step={0.1}
                size="small"
              />
            </Box>
          </Box>
        </Popover>
      </Box>

      <Divider orientation="vertical" flexItem />

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Tooltip title="Undo">
          <IconButton size="small" onClick={handleUndo}>
            <Undo />
          </IconButton>
        </Tooltip>

        <Tooltip title="Redo">
          <IconButton size="small" onClick={handleRedo}>
            <Redo />
          </IconButton>
        </Tooltip>

        <Tooltip title="Clear All">
          <IconButton size="small" onClick={handleClearAll} color="error">
            <Clear />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Active Tool Indicator */}
      {selectedTool && (
        <>
          <Divider orientation="vertical" flexItem />
          <Chip
            label={tools.find(t => t.type === selectedTool)?.label || 'Unknown Tool'}
            size="small"
            color="primary"
            onDelete={() => handleToolSelect(null)}
            deleteIcon={<Clear fontSize="small" />}
          />
        </>
      )}
    </Paper>
  );
};

export default DrawingToolbar;