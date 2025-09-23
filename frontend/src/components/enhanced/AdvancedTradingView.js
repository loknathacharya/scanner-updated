import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  CircularProgress,
  Button,
  ButtonGroup,
  Tooltip,
  IconButton,
} from '@mui/material';
import {
  ExpandMore,
  Settings,
  ShowChart,
  Notifications,
  Folder,
  Palette,
  Sync,
} from '@mui/icons-material';

// Import our enhanced components
import DrawingToolbar from './Drawing/DrawingToolbar';
import ObjectPropertiesPanel from './Drawing/ObjectPropertiesPanel';
import EnhancedMultiChartLayout from './Layouts/EnhancedMultiChartLayout';
import PriceAlertsManager from './Alerts/PriceAlertsManager';
import ChartTemplatesManager from './Templates/ChartTemplatesManager';

// Import utilities
import DrawingToolsManager, { DRAWING_TOOL_TYPES } from '../../utils/DrawingToolsManager';

const AdvancedTradingView = ({
  symbols = [],
  data = {},
  height = 800,
  width = '100%',
  theme = 'dark',
  loading = false,
  error = null,
  className = '',
  onSymbolSelect = null,
  onDataUpdate = null,
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedTool, setSelectedTool] = useState(null);
  const [selectedObject, setSelectedObject] = useState(null);
  const [drawingManager, setDrawingManager] = useState(null);
  const [chartConfig, setChartConfig] = useState({
    chartType: 'candlestick',
    indicators: ['SMA', 'EMA'],
    timeFrame: '1D',
    theme: theme,
    showVolume: true,
  });

  // Debug: Log received props
  console.log('AdvancedTradingView - Received props:', {
    symbols,
    dataKeys: Object.keys(data),
    dataLength: Object.keys(data).length,
    firstSymbolData: data[symbols[0]]?.length || 0,
    dataStructure: data
  });

  const chartContainerRef = useRef(null);

  // Initialize drawing manager
  useEffect(() => {
    if (chartContainerRef.current && !drawingManager) {
      const manager = new DrawingToolsManager(chartContainerRef.current, {
        enablePersistence: true,
        storageKey: 'advanced_tradingview_drawings',
        maxTools: 100,
        snapToPrice: true,
        snapToTime: true,
      });

      // Set up event handlers
      manager.on('drawing-complete', (data) => {
        console.log('Drawing completed:', data);
        setSelectedObject(data.tool.id);
      });

      manager.on('drawing-error', (error) => {
        console.error('Drawing error:', error);
      });

      setDrawingManager(manager);

      return () => {
        if (manager) {
          manager.destroy();
        }
      };
    }
  }, [chartContainerRef, drawingManager]);

  // Handle tab changes
  const handleTabChange = useCallback((event, newValue) => {
    setActiveTab(newValue);
  }, []);

  // Handle tool selection
  const handleToolSelect = useCallback((toolType) => {
    setSelectedTool(toolType);
    if (drawingManager) {
      if (toolType) {
        drawingManager.startDrawing(toolType);
      } else {
        drawingManager.cancelDrawing();
      }
    }
  }, [drawingManager]);

  // Handle style changes
  const handleStyleChange = useCallback((style) => {
    if (drawingManager) {
      // Update current drawing style
      console.log('Style changed:', style);
    }
  }, [drawingManager]);

  // Handle object selection
  const handleObjectSelect = useCallback((objectId) => {
    setSelectedObject(objectId);
  }, []);

  // Handle object update
  const handleObjectUpdate = useCallback((updatedObject) => {
    console.log('Object updated:', updatedObject);
    setSelectedObject(updatedObject.id);
  }, []);

  // Handle object deletion
  const handleObjectDelete = useCallback((objectId) => {
    console.log('Object deleted:', objectId);
    if (selectedObject === objectId) {
      setSelectedObject(null);
    }
  }, [selectedObject]);

  // Handle template loading
  const handleTemplateLoad = useCallback((templateConfig) => {
    setChartConfig(prev => ({ ...prev, ...templateConfig }));
    console.log('Template loaded:', templateConfig);
  }, []);

  // Handle template saving
  const handleTemplateSave = useCallback((template) => {
    console.log('Template saved:', template);
  }, []);

  // Handle template deletion
  const handleTemplateDelete = useCallback((templateId) => {
    console.log('Template deleted:', templateId);
  }, []);

  // Handle alert creation
  const handleAlertCreate = useCallback((alert) => {
    console.log('Alert created:', alert);
  }, []);

  // Handle alert update
  const handleAlertUpdate = useCallback((alert) => {
    console.log('Alert updated:', alert);
  }, []);

  // Handle alert deletion
  const handleAlertDelete = useCallback((alertId) => {
    console.log('Alert deleted:', alertId);
  }, []);

  // Handle alert trigger
  const handleAlertTrigger = useCallback((alert) => {
    console.log('Alert triggered:', alert);
    // Show notification or play sound
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`Trading Alert: ${alert.symbol}`, {
        body: alert.message || `Alert condition met: ${alert.condition}`,
        icon: '/favicon.ico',
      });
    }
  }, []);

  // Handle chart synchronization
  const handleSyncSettingsChange = useCallback((settings) => {
    console.log('Sync settings changed:', settings);
  }, []);

  // Handle layout change
  const handleLayoutChange = useCallback((layout) => {
    console.log('Layout changed:', layout);
  }, []);

  const tabs = [
    {
      label: 'Charts',
      icon: <ShowChart />,
      content: (
        <EnhancedMultiChartLayout
          symbols={symbols}
          data={data}
          height={height - 200}
          width="100%"
          theme={theme}
          loading={loading}
          error={error}
          layout="grid_2x2"
          syncCrosshair={true}
          syncTimeScale={true}
          syncIndicators={true}
          showVolume={true}
          showComparison={true}
          onSymbolSelect={onSymbolSelect}
          onLayoutChange={handleLayoutChange}
          onSyncSettingsChange={handleSyncSettingsChange}
        />
      ),
    },
    {
      label: 'Drawing Tools',
      icon: <Palette />,
      content: (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <DrawingToolbar
            drawingManager={drawingManager}
            onToolSelect={handleToolSelect}
            onStyleChange={handleStyleChange}
            onClearAll={() => drawingManager?.clearAllTools()}
          />

          <Box sx={{ display: 'flex', gap: 2, height: 'calc(100% - 100px)' }}>
            <Box sx={{ flex: 2 }}>
              <Paper
                ref={chartContainerRef}
                variant="outlined"
                sx={{
                  height: '100%',
                  minHeight: 400,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: theme === 'dark' ? '#1a1a1a' : '#ffffff',
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Chart Area - Drawing tools will be rendered here
                </Typography>
              </Paper>
            </Box>

            <Box sx={{ flex: 1 }}>
              <ObjectPropertiesPanel
                selectedTool={selectedObject}
                drawingManager={drawingManager}
                onToolUpdate={handleObjectUpdate}
                onToolDelete={handleObjectDelete}
              />
            </Box>
          </Box>
        </Box>
      ),
    },
    {
      label: 'Alerts',
      icon: <Notifications />,
      content: (
        <PriceAlertsManager
          symbol={symbols[0] || 'AAPL'}
          currentPrice={data[symbols[0]]?.[data[symbols[0]]?.length - 1]?.close || 0}
          onAlertCreate={handleAlertCreate}
          onAlertUpdate={handleAlertUpdate}
          onAlertDelete={handleAlertDelete}
          onAlertTrigger={handleAlertTrigger}
        />
      ),
    },
    {
      label: 'Templates',
      icon: <Folder />,
      content: (
        <ChartTemplatesManager
          chartConfig={chartConfig}
          onTemplateLoad={handleTemplateLoad}
          onTemplateSave={handleTemplateSave}
          onTemplateDelete={handleTemplateDelete}
        />
      ),
    },
  ];

  if (error) {
    return (
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 2,
        }}
        className={className}
      >
        <Alert severity="error">
          {error}
        </Alert>
        <Typography variant="body2" color="text.secondary">
          Unable to load advanced trading view
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper
      variant="outlined"
      className={`advanced-trading-view ${className}`}
      sx={{
        height,
        width,
        backgroundColor: theme === 'dark' ? '#1a1a1a' : '#ffffff',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Advanced TradingView
        </Typography>

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Tooltip title="Settings">
            <IconButton size="small">
              <Settings />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          '& .MuiTab-root': {
            minWidth: 120,
            fontSize: '0.875rem',
          },
        }}
      >
        {tabs.map((tab, index) => (
          <Tab
            key={index}
            label={tab.label}
            icon={tab.icon}
            iconPosition="start"
            sx={{ minHeight: 64 }}
          />
        ))}
      </Tabs>

      {/* Tab Content */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          p: 2,
        }}
      >
        {loading ? (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
            }}
          >
            <CircularProgress />
          </Box>
        ) : (
          tabs[activeTab]?.content
        )}
      </Box>
    </Paper>
  );
};

export default AdvancedTradingView;