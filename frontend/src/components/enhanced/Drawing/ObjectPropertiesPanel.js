import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  Button,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Slider,
  ColorLens,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  ExpandMore,
  Delete,
  Lock,
  LockOpen,
  Visibility,
  VisibilityOff,
  Colorize,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { DRAWING_STYLES } from '../../../utils/DrawingToolsManager';

const ObjectPropertiesPanel = ({
  selectedTool,
  drawingManager,
  onToolUpdate,
  onToolDelete,
  className = '',
}) => {
  const [toolData, setToolData] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (selectedTool && drawingManager) {
      const tool = drawingManager.getTool(selectedTool);
      setToolData(tool);
      setHasChanges(false);
    } else {
      setToolData(null);
      setHasChanges(false);
    }
  }, [selectedTool, drawingManager]);

  const handlePropertyChange = useCallback((property, value) => {
    if (!toolData) return;

    setToolData(prev => ({
      ...prev,
      [property]: value,
    }));
    setHasChanges(true);
  }, [toolData]);

  const handleStyleChange = useCallback((styleProperty, value) => {
    if (!toolData) return;

    setToolData(prev => ({
      ...prev,
      style: {
        ...prev.style,
        [styleProperty]: value,
      },
    }));
    setHasChanges(true);
  }, [toolData]);

  const handleSave = useCallback(() => {
    if (!toolData || !drawingManager || !hasChanges) return;

    drawingManager.updateTool(toolData.id, {
      style: toolData.style,
      properties: toolData.properties,
    });

    if (onToolUpdate) {
      onToolUpdate(toolData);
    }

    setHasChanges(false);
  }, [toolData, drawingManager, hasChanges, onToolUpdate]);

  const handleDelete = useCallback(() => {
    if (!toolData || !drawingManager) return;

    drawingManager.removeTool(toolData.id);

    if (onToolDelete) {
      onToolDelete(toolData.id);
    }

    setToolData(null);
    setHasChanges(false);
  }, [toolData, drawingManager, onToolDelete]);

  const handleCancel = useCallback(() => {
    if (!toolData || !drawingManager) return;

    const originalTool = drawingManager.getTool(toolData.id);
    setToolData(originalTool);
    setHasChanges(false);
  }, [toolData, drawingManager]);

  if (!toolData) {
    return (
      <Paper
        variant="outlined"
        className={`object-properties-panel ${className}`}
        sx={{
          p: 2,
          minHeight: '200px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Select a drawing object to edit its properties
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper
      variant="outlined"
      className={`object-properties-panel ${className}`}
      sx={{ p: 2, minHeight: '400px' }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Object Properties
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Delete Object">
            <IconButton size="small" onClick={handleDelete} color="error">
              <Delete />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {/* Basic Properties */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="subtitle2">Basic Properties</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Label"
              value={toolData.properties?.label || ''}
              onChange={(e) => handlePropertyChange('properties', {
                ...toolData.properties,
                label: e.target.value,
              })}
              size="small"
              fullWidth
            />

            <FormControlLabel
              control={
                <Switch
                  checked={toolData.properties?.visible !== false}
                  onChange={(e) => handlePropertyChange('properties', {
                    ...toolData.properties,
                    visible: e.target.checked,
                  })}
                />
              }
              label="Visible"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={toolData.properties?.locked || false}
                  onChange={(e) => handlePropertyChange('properties', {
                    ...toolData.properties,
                    locked: e.target.checked,
                  })}
                />
              }
              label="Locked"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={toolData.properties?.extended || false}
                  onChange={(e) => handlePropertyChange('properties', {
                    ...toolData.properties,
                    extended: e.target.checked,
                  })}
                />
              }
              label="Extended"
            />
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Style Properties */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="subtitle2">Style Properties</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Color Selection */}
            <Box>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Line Color
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                {DRAWING_STYLES.COLORS.map((color) => (
                  <Tooltip key={color} title={color}>
                    <Box
                      onClick={() => handleStyleChange('color', color)}
                      sx={{
                        width: 24,
                        height: 24,
                        backgroundColor: color,
                        borderRadius: '50%',
                        cursor: 'pointer',
                        border: toolData.style?.color === color ? '2px solid #000' : '1px solid #ccc',
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
            <Box>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Line Width: {toolData.style?.lineWidth || 2}
              </Typography>
              <Slider
                value={toolData.style?.lineWidth || 2}
                onChange={(event, value) => handleStyleChange('lineWidth', value)}
                min={1}
                max={5}
                step={1}
                marks
                size="small"
              />
            </Box>

            {/* Line Style */}
            <FormControl size="small" fullWidth>
              <InputLabel>Line Style</InputLabel>
              <Select
                value={toolData.style?.lineStyle || 'solid'}
                label="Line Style"
                onChange={(event) => handleStyleChange('lineStyle', event.target.value)}
              >
                {DRAWING_STYLES.LINE_STYLES.map((style) => (
                  <MenuItem key={style} value={style}>
                    {style.charAt(0).toUpperCase() + style.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Fill Color (for shapes) */}
            {(toolData.type === 'rectangle' || toolData.type === 'ellipse') && (
              <Box>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Fill Color
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                  <Tooltip title="No Fill">
                    <Box
                      onClick={() => handleStyleChange('fillColor', null)}
                      sx={{
                        width: 24,
                        height: 24,
                        border: '2px dashed #ccc',
                        borderRadius: '50%',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: toolData.style?.fillColor === null ? '#e0e0e0' : 'transparent',
                      }}
                    >
                      <Typography variant="caption" sx={{ fontSize: '10px' }}>X</Typography>
                    </Box>
                  </Tooltip>
                  {DRAWING_STYLES.COLORS.map((color) => (
                    <Tooltip key={color} title={color}>
                      <Box
                        onClick={() => handleStyleChange('fillColor', color)}
                        sx={{
                          width: 24,
                          height: 24,
                          backgroundColor: color,
                          borderRadius: '50%',
                          cursor: 'pointer',
                          border: toolData.style?.fillColor === color ? '2px solid #000' : '1px solid #ccc',
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
            )}

            {/* Fill Opacity (for shapes) */}
            {(toolData.type === 'rectangle' || toolData.type === 'ellipse') && toolData.style?.fillColor && (
              <Box>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Fill Opacity: {Math.round((toolData.style?.fillOpacity || 0.1) * 100)}%
                </Typography>
                <Slider
                  value={toolData.style?.fillOpacity || 0.1}
                  onChange={(event, value) => handleStyleChange('fillOpacity', value)}
                  min={0}
                  max={1}
                  step={0.1}
                  size="small"
                />
              </Box>
            )}

            {/* Text Properties (for text annotations) */}
            {toolData.type === 'text_annotation' && (
              <>
                <TextField
                  label="Font Size"
                  type="number"
                  value={toolData.style?.fontSize || 12}
                  onChange={(e) => handleStyleChange('fontSize', parseInt(e.target.value) || 12)}
                  size="small"
                  fullWidth
                  inputProps={{ min: 8, max: 72 }}
                />

                <FormControl size="small" fullWidth>
                  <InputLabel>Font Family</InputLabel>
                  <Select
                    value={toolData.style?.fontFamily || 'Arial'}
                    label="Font Family"
                    onChange={(event) => handleStyleChange('fontFamily', event.target.value)}
                  >
                    <MenuItem value="Arial">Arial</MenuItem>
                    <MenuItem value="Helvetica">Helvetica</MenuItem>
                    <MenuItem value="Times New Roman">Times New Roman</MenuItem>
                    <MenuItem value="Courier New">Courier New</MenuItem>
                    <MenuItem value="Verdana">Verdana</MenuItem>
                    <MenuItem value="Georgia">Georgia</MenuItem>
                  </Select>
                </FormControl>

                <FormControl size="small" fullWidth>
                  <InputLabel>Text Align</InputLabel>
                  <Select
                    value={toolData.style?.textAlign || 'center'}
                    label="Text Align"
                    onChange={(event) => handleStyleChange('textAlign', event.target.value)}
                  >
                    <MenuItem value="left">Left</MenuItem>
                    <MenuItem value="center">Center</MenuItem>
                    <MenuItem value="right">Right</MenuItem>
                  </Select>
                </FormControl>
              </>
            )}
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Tool-specific Properties */}
      {toolData.type === 'price_alert' && (
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="subtitle2">Alert Settings</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Alert Price"
                type="number"
                value={toolData.properties?.alertPrice || 0}
                onChange={(e) => handlePropertyChange('properties', {
                  ...toolData.properties,
                  alertPrice: parseFloat(e.target.value) || 0,
                })}
                size="small"
                fullWidth
              />

              <FormControl size="small" fullWidth>
                <InputLabel>Condition</InputLabel>
                <Select
                  value={toolData.properties?.condition || 'above'}
                  label="Condition"
                  onChange={(event) => handlePropertyChange('properties', {
                    ...toolData.properties,
                    condition: event.target.value,
                  })}
                >
                  <MenuItem value="above">Price Above</MenuItem>
                  <MenuItem value="below">Price Below</MenuItem>
                  <MenuItem value="cross_above">Cross Above</MenuItem>
                  <MenuItem value="cross_below">Cross Below</MenuItem>
                </Select>
              </FormControl>

              <FormControlLabel
                control={
                  <Switch
                    checked={toolData.properties?.triggered || false}
                    onChange={(e) => handlePropertyChange('properties', {
                      ...toolData.properties,
                      triggered: e.target.checked,
                    })}
                  />
                }
                label="Triggered"
              />
            </Box>
          </AccordionDetails>
        </Accordion>
      )}

      {/* Metadata */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="subtitle2">Metadata</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography variant="body2">
              <strong>ID:</strong> {toolData.id}
            </Typography>
            <Typography variant="body2">
              <strong>Type:</strong> {toolData.type.replace('_', ' ').toUpperCase()}
            </Typography>
            <Typography variant="body2">
              <strong>Created:</strong> {new Date(toolData.metadata?.createdAt).toLocaleString()}
            </Typography>
            <Typography variant="body2">
              <strong>Updated:</strong> {new Date(toolData.metadata?.updatedAt).toLocaleString()}
            </Typography>
            <Typography variant="body2">
              <strong>Created By:</strong> {toolData.metadata?.createdBy}
            </Typography>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Action Buttons */}
      {hasChanges && (
        <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            size="small"
            onClick={handleSave}
            fullWidth
          >
            Save Changes
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={handleCancel}
            fullWidth
          >
            Cancel
          </Button>
        </Box>
      )}
    </Paper>
  );
};

export default ObjectPropertiesPanel;