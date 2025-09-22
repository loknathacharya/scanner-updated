import { useState, useCallback, useRef, useEffect } from 'react';
import { transformOHLCVData, transformIndicatorsData, calculateDataStatistics } from '../utils/chartDataTransformer';

/**
 * Custom hook for managing TradingView chart state
 * Provides centralized state management for chart data, indicators, and configuration
 */
export const useChartState = (initialData = [], initialConfig = {}) => {
  // Core chart state
  const [data, setData] = useState(initialData);
  const [indicators, setIndicators] = useState([]);
  const [annotations, setAnnotations] = useState([]);
  const [chartType, setChartType] = useState(initialConfig.chartType || 'candlestick');
  const [timeframe, setTimeframe] = useState(initialConfig.timeframe || '1D');
  const [symbol, setSymbol] = useState(initialConfig.symbol || '');

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState(initialConfig.theme || 'dark');

  // Chart configuration
  const [config, setConfig] = useState({
    height: initialConfig.height || 500,
    width: initialConfig.width || '100%',
    showVolume: initialConfig.showVolume !== false,
    showGrid: initialConfig.showGrid !== false,
    showLegend: initialConfig.showLegend !== false,
    autoScale: initialConfig.autoScale !== false,
    ...initialConfig
  });

  // Data statistics
  const [statistics, setStatistics] = useState({
    count: 0,
    startDate: null,
    endDate: null,
    priceRange: { min: 0, max: 0 },
    volumeRange: { min: 0, max: 0 }
  });

  // Chart references
  const chartRef = useRef(null);
  const seriesRef = useRef({});
  const indicatorsRef = useRef({});

  // Data management
  const updateData = useCallback((newData, updateStatistics = true) => {
    try {
      setError(null);
      setData(newData);

      if (updateStatistics && newData.length > 0) {
        const stats = calculateDataStatistics(newData);
        setStatistics(stats);
      }
    } catch (err) {
      setError(`Error updating chart data: ${err.message}`);
      console.error('Error updating chart data:', err);
    }
  }, []);

  const appendData = useCallback((newDataPoints) => {
    try {
      setError(null);
      setData(prevData => {
        const updatedData = [...prevData, ...newDataPoints];
        // Update statistics with new data
        const stats = calculateDataStatistics(updatedData);
        setStatistics(stats);
        return updatedData;
      });
    } catch (err) {
      setError(`Error appending chart data: ${err.message}`);
      console.error('Error appending chart data:', err);
    }
  }, []);

  const clearData = useCallback(() => {
    setData([]);
    setStatistics({
      count: 0,
      startDate: null,
      endDate: null,
      priceRange: { min: 0, max: 0 },
      volumeRange: { min: 0, max: 0 }
    });
    setError(null);
  }, []);

  // Indicator management
  const addIndicator = useCallback((indicator) => {
    try {
      setError(null);
      setIndicators(prev => {
        // Check if indicator already exists
        const exists = prev.find(ind => ind.name === indicator.name);
        if (exists) {
          console.warn(`Indicator ${indicator.name} already exists`);
          return prev;
        }
        return [...prev, {
          id: `indicator_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          ...indicator,
          createdAt: new Date().toISOString()
        }];
      });
    } catch (err) {
      setError(`Error adding indicator: ${err.message}`);
      console.error('Error adding indicator:', err);
    }
  }, []);

  const removeIndicator = useCallback((indicatorId) => {
    try {
      setError(null);
      setIndicators(prev => prev.filter(ind => ind.id !== indicatorId));
    } catch (err) {
      setError(`Error removing indicator: ${err.message}`);
      console.error('Error removing indicator:', err);
    }
  }, []);

  const updateIndicator = useCallback((indicatorId, updates) => {
    try {
      setError(null);
      setIndicators(prev =>
        prev.map(ind =>
          ind.id === indicatorId
            ? { ...ind, ...updates, updatedAt: new Date().toISOString() }
            : ind
        )
      );
    } catch (err) {
      setError(`Error updating indicator: ${err.message}`);
      console.error('Error updating indicator:', err);
    }
  }, []);

  const clearIndicators = useCallback(() => {
    setIndicators([]);
    setError(null);
  }, []);

  // Annotation management
  const addAnnotation = useCallback((annotation) => {
    try {
      setError(null);
      setAnnotations(prev => [...prev, {
        id: `annotation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...annotation,
        createdAt: new Date().toISOString()
      }]);
    } catch (err) {
      setError(`Error adding annotation: ${err.message}`);
      console.error('Error adding annotation:', err);
    }
  }, []);

  const removeAnnotation = useCallback((annotationId) => {
    try {
      setError(null);
      setAnnotations(prev => prev.filter(ann => ann.id !== annotationId));
    } catch (err) {
      setError(`Error removing annotation: ${err.message}`);
      console.error('Error removing annotation:', err);
    }
  }, []);

  const updateAnnotation = useCallback((annotationId, updates) => {
    try {
      setError(null);
      setAnnotations(prev =>
        prev.map(ann =>
          ann.id === annotationId
            ? { ...ann, ...updates, updatedAt: new Date().toISOString() }
            : ann
        )
      );
    } catch (err) {
      setError(`Error updating annotation: ${err.message}`);
      console.error('Error updating annotation:', err);
    }
  }, []);

  const clearAnnotations = useCallback(() => {
    setAnnotations([]);
    setError(null);
  }, []);

  // Configuration management
  const updateConfig = useCallback((newConfig) => {
    try {
      setError(null);
      setConfig(prev => ({ ...prev, ...newConfig }));
    } catch (err) {
      setError(`Error updating configuration: ${err.message}`);
      console.error('Error updating configuration:', err);
    }
  }, []);

  // Chart actions
  const resetChart = useCallback(() => {
    try {
      setError(null);
      clearData();
      clearIndicators();
      clearAnnotations();
      setChartType('candlestick');
      setTimeframe('1D');
      updateConfig({
        height: 500,
        width: '100%',
        showVolume: true,
        showGrid: true,
        showLegend: true,
        autoScale: true
      });
    } catch (err) {
      setError(`Error resetting chart: ${err.message}`);
      console.error('Error resetting chart:', err);
    }
  }, [clearData, clearIndicators, clearAnnotations, updateConfig]);

  const exportChartData = useCallback(() => {
    try {
      const exportData = {
        symbol,
        chartType,
        timeframe,
        data: data,
        indicators: indicators,
        annotations: annotations,
        statistics: statistics,
        config: config,
        exportedAt: new Date().toISOString()
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `chart_data_${symbol}_${timeframe}_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);

      return exportData;
    } catch (err) {
      setError(`Error exporting chart data: ${err.message}`);
      console.error('Error exporting chart data:', err);
      return null;
    }
  }, [symbol, chartType, timeframe, data, indicators, annotations, statistics, config]);

  const importChartData = useCallback((importData) => {
    try {
      setError(null);

      if (!importData || typeof importData !== 'object') {
        throw new Error('Invalid import data format');
      }

      // Validate required fields
      if (!importData.data || !Array.isArray(importData.data)) {
        throw new Error('Import data must contain valid data array');
      }

      setSymbol(importData.symbol || '');
      setChartType(importData.chartType || 'candlestick');
      setTimeframe(importData.timeframe || '1D');
      setData(importData.data);
      setIndicators(importData.indicators || []);
      setAnnotations(importData.annotations || []);

      if (importData.config) {
        setConfig(prev => ({ ...prev, ...importData.config }));
      }

      if (importData.statistics) {
        setStatistics(importData.statistics);
      }

      return true;
    } catch (err) {
      setError(`Error importing chart data: ${err.message}`);
      console.error('Error importing chart data:', err);
      return false;
    }
  }, []);

  // Chart event handlers
  const handleCrosshairMove = useCallback((param) => {
    // Handle crosshair movement events
    if (param.time && param.seriesData) {
      const data = param.seriesData.get(seriesRef.current.main);
      if (data) {
        // Emit custom event or update state as needed
        console.log('Crosshair moved:', { time: param.time, data });
      }
    }
  }, []);

  const handleVisibleRangeChange = useCallback((range) => {
    // Handle visible range changes
    if (range && range.from && range.to) {
      console.log('Visible range changed:', range);
    }
  }, []);

  const handleChartReady = useCallback((chartInfo) => {
    chartRef.current = chartInfo.chart;
    seriesRef.current = chartInfo.series;

    console.log('Chart ready:', chartInfo);
  }, []);

  // Data validation
  const validateData = useCallback((dataToValidate) => {
    if (!Array.isArray(dataToValidate) || dataToValidate.length === 0) {
      return { isValid: false, error: 'Data must be a non-empty array' };
    }

    const transformedData = transformOHLCVData(dataToValidate);
    const hasValidData = transformedData.length > 0;

    return {
      isValid: hasValidData,
      error: hasValidData ? null : 'No valid OHLCV data found',
      validCount: transformedData.length,
      totalCount: dataToValidate.length
    };
  }, []);

  // Auto-save functionality
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(false);
  const autoSaveRef = useRef(null);

  const enableAutoSave = useCallback((interval = 30000) => { // 30 seconds default
    setAutoSaveEnabled(true);

    if (autoSaveRef.current) {
      clearInterval(autoSaveRef.current);
    }

    autoSaveRef.current = setInterval(() => {
      if (data.length > 0) {
        const autoSaveData = {
          symbol,
          chartType,
          timeframe,
          data,
          indicators,
          annotations,
          statistics,
          config,
          autoSavedAt: new Date().toISOString()
        };

        localStorage.setItem(`chart_autosave_${symbol}`, JSON.stringify(autoSaveData));
      }
    }, interval);
  }, [data, symbol, chartType, timeframe, indicators, annotations, statistics, config]);

  const disableAutoSave = useCallback(() => {
    setAutoSaveEnabled(false);

    if (autoSaveRef.current) {
      clearInterval(autoSaveRef.current);
      autoSaveRef.current = null;
    }
  }, []);

  // Load auto-saved data on mount
  useEffect(() => {
    if (symbol && !data.length) {
      const autoSaved = localStorage.getItem(`chart_autosave_${symbol}`);
      if (autoSaved) {
        try {
          const autoSaveData = JSON.parse(autoSaved);
          // Only load if it's recent (within last hour)
          const autoSavedTime = new Date(autoSaveData.autoSavedAt);
          const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

          if (autoSavedTime > oneHourAgo) {
            console.log('Loading auto-saved chart data');
            importChartData(autoSaveData);
          } else {
            localStorage.removeItem(`chart_autosave_${symbol}`);
          }
        } catch (err) {
          console.warn('Error loading auto-saved data:', err);
          localStorage.removeItem(`chart_autosave_${symbol}`);
        }
      }
    }
  }, [symbol, data.length, importChartData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoSaveRef.current) {
        clearInterval(autoSaveRef.current);
      }
    };
  }, []);

  return {
    // State
    data,
    indicators,
    annotations,
    chartType,
    timeframe,
    symbol,
    isLoading,
    error,
    theme,
    config,
    statistics,
    chartRef,
    seriesRef,
    indicatorsRef,
    autoSaveEnabled,

    // Data management
    updateData,
    appendData,
    clearData,
    validateData,

    // Indicator management
    addIndicator,
    removeIndicator,
    updateIndicator,
    clearIndicators,

    // Annotation management
    addAnnotation,
    removeAnnotation,
    updateAnnotation,
    clearAnnotations,

    // Configuration
    updateConfig,
    setChartType,
    setTimeframe,
    setSymbol,
    setTheme,
    setIsLoading,
    setError,

    // Chart actions
    resetChart,
    exportChartData,
    importChartData,
    enableAutoSave,
    disableAutoSave,

    // Event handlers
    handleCrosshairMove,
    handleVisibleRangeChange,
    handleChartReady
  };
};

export default useChartState;