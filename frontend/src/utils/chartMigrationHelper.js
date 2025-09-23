/**
 * Chart Migration Helper Utilities
 * Facilitates smooth transition from Plotly.js to TradingView Lightweight Charts
 *
 * Features:
 * - Feature parity checking between Plotly and TradingView
 * - Automatic data format conversion
 * - Error handling and fallback mechanisms
 * - Migration progress tracking
 * - Migration recommendations
 */

import { formatCurrency, formatPercentage } from './formatting.js';

// Migration status constants
export const MIGRATION_STATUS = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed',
  PARTIAL: 'partial'
};

// Chart type mappings
export const CHART_TYPE_MAPPINGS = {
  // Plotly to TradingView chart type mappings
  scatter: 'line',
  bar: 'bar',
  histogram: 'histogram',
  box: 'line', // Box plots not directly supported
  violin: 'line', // Violin plots not directly supported
  heatmap: 'area', // Heatmaps not directly supported
  contour: 'area', // Contour plots not directly supported
  scatter3d: 'line', // 3D plots not supported
  surface: 'area', // Surface plots not supported
  mesh3d: 'area', // 3D plots not supported
  candlestick: 'candlestick',
  ohlc: 'candlestick'
};

// Feature compatibility matrix
export const FEATURE_COMPATIBILITY = {
  // Fully supported features
  SUPPORTED: {
    basic_chart_types: ['line', 'bar', 'candlestick', 'area', 'histogram'],
    time_series: true,
    multiple_series: true,
    zoom_pan: true,
    crosshair: true,
    annotations: true,
    indicators: true,
    themes: true,
    responsive: true
  },

  // Partially supported features
  PARTIALLY_SUPPORTED: {
    '3d_charts': { supported: false, alternative: 'Use 2D alternatives' },
    'advanced_statistics': { supported: false, alternative: 'Calculate separately' },
    'custom_shapes': { supported: false, alternative: 'Use annotations' },
    'subplots': { supported: true, alternative: 'Limited subplot support' },
    'animations': { supported: false, alternative: 'Static charts only' },
    'real_time_updates': { supported: true, alternative: 'Streaming data support' }
  },

  // Unsupported features
  UNSUPPORTED: [
    '3d_scatter_plots',
    'surface_plots',
    'mesh_plots',
    'advanced_3d_features',
    'custom_webgl_shaders',
    'plotly_express_features'
  ]
};

/**
 * Migration Progress Tracker
 * Tracks the migration status of components across the application
 */
class MigrationProgressTracker {
  constructor() {
    this.migrationStatus = new Map();
    this.completedComponents = new Set();
    this.failedComponents = new Set();
    this.migrationLogs = [];
  }

  /**
   * Start migration for a component
   * @param {string} componentName - Name of the component being migrated
   * @param {Object} config - Migration configuration
   */
  startMigration(componentName, config = {}) {
    this.migrationStatus.set(componentName, {
      status: MIGRATION_STATUS.IN_PROGRESS,
      startTime: Date.now(),
      config,
      progress: 0,
      errors: [],
      warnings: []
    });

    this.logMigrationEvent(componentName, 'Migration started', 'info');
  }

  /**
   * Update migration progress
   * @param {string} componentName - Component name
   * @param {number} progress - Progress percentage (0-100)
   * @param {Object} details - Additional progress details
   */
  updateProgress(componentName, progress, details = {}) {
    const status = this.migrationStatus.get(componentName);
    if (status) {
      status.progress = Math.min(100, Math.max(0, progress));
      status.lastUpdate = Date.now();
      status.details = { ...status.details, ...details };

      this.migrationStatus.set(componentName, status);
    }
  }

  /**
   * Complete migration for a component
   * @param {string} componentName - Component name
   * @param {Object} result - Migration result
   */
  completeMigration(componentName, result = {}) {
    const status = this.migrationStatus.get(componentName);
    if (status) {
      status.status = MIGRATION_STATUS.COMPLETED;
      status.endTime = Date.now();
      status.duration = status.endTime - status.startTime;
      status.result = result;
      status.progress = 100;

      this.completedComponents.add(componentName);
      this.migrationStatus.set(componentName, status);

      this.logMigrationEvent(componentName, 'Migration completed successfully', 'success');
    }
  }

  /**
   * Mark migration as failed
   * @param {string} componentName - Component name
   * @param {Error} error - Error that caused failure
   */
  failMigration(componentName, error) {
    const status = this.migrationStatus.get(componentName);
    if (status) {
      status.status = MIGRATION_STATUS.FAILED;
      status.endTime = Date.now();
      status.duration = status.endTime - status.startTime;
      status.error = error.message;
      status.progress = 0;

      this.failedComponents.add(componentName);
      this.migrationStatus.set(componentName, status);

      this.logMigrationEvent(componentName, `Migration failed: ${error.message}`, 'error');
    }
  }

  /**
   * Add warning to migration
   * @param {string} componentName - Component name
   * @param {string} warning - Warning message
   */
  addWarning(componentName, warning) {
    const status = this.migrationStatus.get(componentName);
    if (status) {
      status.warnings.push({
        message: warning,
        timestamp: Date.now()
      });
      this.migrationStatus.set(componentName, status);
    }
  }

  /**
   * Log migration event
   * @param {string} componentName - Component name
   * @param {string} message - Log message
   * @param {string} level - Log level (info, warning, error, success)
   */
  logMigrationEvent(componentName, message, level = 'info') {
    this.migrationLogs.push({
      componentName,
      message,
      level,
      timestamp: Date.now()
    });
  }

  /**
   * Get migration status for a component
   * @param {string} componentName - Component name
   * @returns {Object} Migration status
   */
  getMigrationStatus(componentName) {
    return this.migrationStatus.get(componentName) || {
      status: MIGRATION_STATUS.NOT_STARTED,
      progress: 0
    };
  }

  /**
   * Get overall migration statistics
   * @returns {Object} Migration statistics
   */
  getMigrationStats() {
    const totalComponents = this.migrationStatus.size;
    const completedCount = this.completedComponents.size;
    const failedCount = this.failedComponents.size;
    const inProgressCount = totalComponents - completedCount - failedCount;

    return {
      totalComponents,
      completed: completedCount,
      failed: failedCount,
      inProgress: inProgressCount,
      completionRate: totalComponents > 0 ? (completedCount / totalComponents) * 100 : 0,
      averageProgress: Array.from(this.migrationStatus.values())
        .reduce((sum, status) => sum + (status.progress || 0), 0) / totalComponents || 0
    };
  }

  /**
   * Get components that need migration
   * @returns {Array} Components needing migration
   */
  getComponentsNeedingMigration() {
    return Array.from(this.migrationStatus.entries())
      .filter(([_, status]) => status.status !== MIGRATION_STATUS.COMPLETED)
      .map(([componentName, status]) => ({
        componentName,
        status: status.status,
        progress: status.progress,
        warnings: status.warnings.length,
        errors: status.errors.length
      }));
  }

  /**
   * Generate migration report
   * @returns {Object} Comprehensive migration report
   */
  generateMigrationReport() {
    const stats = this.getMigrationStats();
    const componentsNeedingMigration = this.getComponentsNeedingMigration();

    return {
      summary: {
        ...stats,
        estimatedTimeRemaining: this.estimateTimeRemaining(),
        lastUpdated: new Date().toISOString()
      },
      componentsNeedingMigration,
      recentLogs: this.migrationLogs.slice(-10),
      recommendations: this.generateRecommendations()
    };
  }

  /**
   * Estimate remaining migration time
   * @returns {Object} Time estimation
   */
  estimateTimeRemaining() {
    const inProgressComponents = Array.from(this.migrationStatus.values())
      .filter(status => status.status === MIGRATION_STATUS.IN_PROGRESS);

    if (inProgressComponents.length === 0) {
      return { hours: 0, minutes: 0 };
    }

    const avgDuration = inProgressComponents
      .filter(status => status.duration)
      .reduce((sum, status) => sum + status.duration, 0) / inProgressComponents.length;

    const remainingComponents = this.getComponentsNeedingMigration().length;
    const estimatedMs = avgDuration * remainingComponents;

    return {
      hours: Math.floor(estimatedMs / (1000 * 60 * 60)),
      minutes: Math.floor((estimatedMs % (1000 * 60 * 60)) / (1000 * 60))
    };
  }

  /**
   * Generate migration recommendations
   * @returns {Array} Recommendations for migration
   */
  generateRecommendations() {
    const recommendations = [];
    const componentsNeedingMigration = this.getComponentsNeedingMigration();

    if (componentsNeedingMigration.length > 0) {
      recommendations.push({
        type: 'priority',
        message: `Focus on migrating ${componentsNeedingMigration.length} remaining components`,
        components: componentsNeedingMigration.map(c => c.componentName)
      });
    }

    const failedComponents = Array.from(this.failedComponents);
    if (failedComponents.length > 0) {
      recommendations.push({
        type: 'critical',
        message: `Review and fix ${failedComponents.length} failed migrations`,
        components: failedComponents
      });
    }

    return recommendations;
  }
}

// Global migration tracker instance
export const migrationTracker = new MigrationProgressTracker();

/**
 * Feature Parity Checker
 * Compares Plotly configurations with TradingView capabilities
 */
export class FeatureParityChecker {
  /**
   * Check feature compatibility
   * @param {Object} plotlyConfig - Plotly configuration
   * @returns {Object} Compatibility report
   */
  static checkCompatibility(plotlyConfig) {
    const report = {
      supported: [],
      partiallySupported: [],
      unsupported: [],
      recommendations: [],
      compatibilityScore: 0
    };

    try {
      // Check chart type compatibility
      const chartType = plotlyConfig.type || plotlyConfig.data?.[0]?.type;
      if (chartType) {
        const tvChartType = this.mapChartType(chartType);
        if (FEATURE_COMPATIBILITY.SUPPORTED.basic_chart_types.includes(tvChartType)) {
          report.supported.push(`Chart type: ${chartType} → ${tvChartType}`);
          report.compatibilityScore += 25;
        } else {
          report.partiallySupported.push(`Chart type: ${chartType} → ${tvChartType} (limited support)`);
          report.compatibilityScore += 15;
        }
      }

      // Check layout features
      if (plotlyConfig.layout) {
        const layoutFeatures = this.checkLayoutFeatures(plotlyConfig.layout);
        report.supported.push(...layoutFeatures.supported);
        report.partiallySupported.push(...layoutFeatures.partiallySupported);
        report.unsupported.push(...layoutFeatures.unsupported);
      }

      // Check data features
      if (plotlyConfig.data) {
        const dataFeatures = this.checkDataFeatures(plotlyConfig.data);
        report.supported.push(...dataFeatures.supported);
        report.partiallySupported.push(...dataFeatures.partiallySupported);
        report.unsupported.push(...dataFeatures.unsupported);
      }

      // Generate recommendations
      report.recommendations = this.generateRecommendations(report);

      // Normalize compatibility score
      report.compatibilityScore = Math.min(100, Math.max(0, report.compatibilityScore));

    } catch (error) {
      console.error('Error checking feature compatibility:', error);
      report.error = error.message;
    }

    return report;
  }

  /**
   * Map Plotly chart type to TradingView chart type
   * @param {string} plotlyType - Plotly chart type
   * @returns {string} TradingView chart type
   */
  static mapChartType(plotlyType) {
    return CHART_TYPE_MAPPINGS[plotlyType] || 'line';
  }

  /**
   * Check layout feature compatibility
   * @param {Object} layout - Plotly layout configuration
   * @returns {Object} Layout compatibility report
   */
  static checkLayoutFeatures(layout) {
    const report = {
      supported: [],
      partiallySupported: [],
      unsupported: []
    };

    // Check annotations
    if (layout.annotations) {
      report.supported.push('Annotations supported');
    }

    // Check shapes
    if (layout.shapes) {
      report.partiallySupported.push('Custom shapes (limited support)');
    }

    // Check subplots
    if (layout.grid && layout.grid.rows > 1) {
      report.partiallySupported.push('Multiple subplots (limited support)');
    }

    // Check 3D features
    if (layout.scene) {
      report.unsupported.push('3D scene features');
    }

    return report;
  }

  /**
   * Check data feature compatibility
   * @param {Array} data - Plotly data traces
   * @returns {Object} Data compatibility report
   */
  static checkDataFeatures(data) {
    const report = {
      supported: [],
      partiallySupported: [],
      unsupported: []
    };

    data.forEach((trace, index) => {
      // Check multiple series
      if (index > 0) {
        report.supported.push(`Multiple series (trace ${index + 1})`);
      }

      // Check trace type
      const traceType = trace.type;
      if (FEATURE_COMPATIBILITY.SUPPORTED.basic_chart_types.includes(this.mapChartType(traceType))) {
        report.supported.push(`Trace type: ${traceType}`);
      } else {
        report.partiallySupported.push(`Trace type: ${traceType} (limited support)`);
      }

      // Check markers
      if (trace.marker) {
        report.supported.push('Custom markers');
      }

      // Check error bars
      if (trace.error_y || trace.error_x) {
        report.partiallySupported.push('Error bars (limited support)');
      }

      // Check hover templates
      if (trace.hovertemplate) {
        report.supported.push('Custom hover templates');
      }
    });

    return report;
  }

  /**
   * Generate migration recommendations
   * @param {Object} compatibilityReport - Compatibility report
   * @returns {Array} Migration recommendations
   */
  static generateRecommendations(compatibilityReport) {
    const recommendations = [];

    if (compatibilityReport.unsupported.length > 0) {
      recommendations.push({
        type: 'critical',
        message: 'Remove or replace unsupported features',
        features: compatibilityReport.unsupported
      });
    }

    if (compatibilityReport.partiallySupported.length > 0) {
      recommendations.push({
        type: 'warning',
        message: 'Review partially supported features for compatibility',
        features: compatibilityReport.partiallySupported
      });
    }

    if (compatibilityReport.compatibilityScore < 50) {
      recommendations.push({
        type: 'info',
        message: 'Consider gradual migration approach due to low compatibility'
      });
    }

    return recommendations;
  }
}

/**
 * Data Format Converter
 * Converts Plotly data formats to TradingView format
 */
export class DataFormatConverter {
  /**
   * Convert Plotly data to TradingView format
   * @param {Object} plotlyData - Plotly chart data
   * @returns {Object} Converted TradingView data
   */
  static convertPlotlyToTradingView(plotlyData) {
    const convertedData = {
      series: [],
      indicators: [],
      annotations: [],
      error: null
    };

    try {
      // Convert traces
      if (plotlyData.data && Array.isArray(plotlyData.data)) {
        convertedData.series = plotlyData.data.map((trace, index) =>
          this.convertTrace(trace, index)
        ).filter(Boolean);
      }

      // Convert layout annotations
      if (plotlyData.layout && plotlyData.layout.annotations) {
        convertedData.annotations = this.convertAnnotations(plotlyData.layout.annotations);
      }

      // Convert layout shapes
      if (plotlyData.layout && plotlyData.layout.shapes) {
        convertedData.annotations.push(...this.convertShapes(plotlyData.layout.shapes));
      }

    } catch (error) {
      console.error('Error converting Plotly data to TradingView format:', error);
      convertedData.error = error.message;
    }

    return convertedData;
  }

  /**
   * Convert Plotly trace to TradingView series
   * @param {Object} trace - Plotly trace
   * @param {number} index - Trace index
   * @returns {Object} TradingView series
   */
  static convertTrace(trace, index) {
    const series = {
      id: `series_${index}`,
      name: trace.name || `Series ${index + 1}`,
      type: this.mapTraceType(trace.type),
      data: [],
      options: {}
    };

    try {
      // Convert data points
      if (trace.x && trace.y) {
        series.data = this.convertDataPoints(trace.x, trace.y, trace);
      } else if (trace.x && trace.open !== undefined) {
        // OHLC/Candlestick data
        series.data = this.convertOHLCData(trace);
      }

      // Convert trace styling
      series.options = this.convertTraceStyling(trace);

      // Handle special trace types
      if (trace.type === 'scatter' && trace.mode === 'markers') {
        series.options.markerSize = trace.marker?.size || 6;
      }

    } catch (error) {
      console.error(`Error converting trace ${index}:`, error);
      series.error = error.message;
    }

    return series;
  }

  /**
   * Map Plotly trace type to TradingView series type
   * @param {string} plotlyType - Plotly trace type
   * @returns {string} TradingView series type
   */
  static mapTraceType(plotlyType) {
    const typeMap = {
      'scatter': 'line',
      'bar': 'bar',
      'histogram': 'histogram',
      'box': 'line',
      'violin': 'line',
      'heatmap': 'area',
      'contour': 'area',
      'candlestick': 'candlestick',
      'ohlc': 'candlestick'
    };

    return typeMap[plotlyType] || 'line';
  }

  /**
   * Convert data points
   * @param {Array} xData - X-axis data
   * @param {Array} yData - Y-axis data
   * @param {Object} trace - Original trace
   * @returns {Array} Converted data points
   */
  static convertDataPoints(xData, yData, trace) {
    const dataPoints = [];

    for (let i = 0; i < Math.min(xData.length, yData.length); i++) {
      const dataPoint = {
        time: this.convertToTimestamp(xData[i]),
        value: parseFloat(yData[i])
      };

      // Add additional fields for OHLC data
      if (trace.open !== undefined && trace.high !== undefined &&
          trace.low !== undefined && trace.close !== undefined) {
        dataPoint.open = parseFloat(trace.open[i]);
        dataPoint.high = parseFloat(trace.high[i]);
        dataPoint.low = parseFloat(trace.low[i]);
        dataPoint.close = parseFloat(trace.close[i]);
        dataPoint.volume = parseFloat(trace.volume?.[i] || 0);
      }

      dataPoints.push(dataPoint);
    }

    return dataPoints.filter(point =>
      !isNaN(point.time) && !isNaN(point.value)
    );
  }

  /**
   * Convert OHLC data
   * @param {Object} trace - OHLC trace
   * @returns {Array} Converted OHLC data
   */
  static convertOHLCData(trace) {
    const dataPoints = [];

    if (!trace.x || !trace.open || !trace.high || !trace.low || !trace.close) {
      return dataPoints;
    }

    for (let i = 0; i < trace.x.length; i++) {
      const dataPoint = {
        time: this.convertToTimestamp(trace.x[i]),
        open: parseFloat(trace.open[i]),
        high: parseFloat(trace.high[i]),
        low: parseFloat(trace.low[i]),
        close: parseFloat(trace.close[i]),
        volume: parseFloat(trace.volume?.[i] || 0)
      };

      dataPoints.push(dataPoint);
    }

    return dataPoints.filter(point =>
      !isNaN(point.time) && !isNaN(point.open) &&
      !isNaN(point.high) && !isNaN(point.low) && !isNaN(point.close)
    );
  }

  /**
   * Convert trace styling
   * @param {Object} trace - Plotly trace
   * @returns {Object} TradingView styling options
   */
  static convertTraceStyling(trace) {
    const options = {};

    // Line styling
    if (trace.line) {
      options.color = trace.line.color || '#2962FF';
      options.width = trace.line.width || 2;
      if (trace.line.dash) {
        options.lineStyle = this.mapLineStyle(trace.line.dash);
      }
    }

    // Marker styling
    if (trace.marker) {
      options.markerSize = trace.marker.size || 6;
      options.markerColor = trace.marker.color || options.color;
    }

    // Fill styling
    if (trace.fill && trace.fill !== 'none') {
      options.fillColor = trace.fillcolor || options.color;
    }

    return options;
  }

  /**
   * Map Plotly line style to TradingView line style
   * @param {string} plotlyDash - Plotly dash style
   * @returns {number} TradingView line style
   */
  static mapLineStyle(plotlyDash) {
    const styleMap = {
      'solid': 0,
      'dash': 1,
      'dot': 2,
      'longdash': 1,
      'dashdot': 3,
      'longdashdot': 3
    };

    return styleMap[plotlyDash] || 0;
  }

  /**
   * Convert annotations
   * @param {Array} annotations - Plotly annotations
   * @returns {Array} TradingView annotations
   */
  static convertAnnotations(annotations) {
    return annotations.map(annotation => ({
      id: annotation.id || `annotation_${Date.now()}_${Math.random()}`,
      type: 'text',
      x: this.convertToTimestamp(annotation.x),
      y: parseFloat(annotation.y),
      text: annotation.text || '',
      color: annotation.font?.color || '#2962FF',
      size: annotation.font?.size || 12,
      options: {
        backgroundColor: annotation.bgcolor,
        borderColor: annotation.bordercolor,
        borderWidth: annotation.borderwidth || 1
      }
    })).filter(annotation =>
      !isNaN(annotation.x) && !isNaN(annotation.y)
    );
  }

  /**
   * Convert shapes
   * @param {Array} shapes - Plotly shapes
   * @returns {Array} TradingView annotations
   */
  static convertShapes(shapes) {
    return shapes.map(shape => ({
      id: shape.id || `shape_${Date.now()}_${Math.random()}`,
      type: 'line',
      x1: this.convertToTimestamp(shape.x0),
      y1: parseFloat(shape.y0),
      x2: this.convertToTimestamp(shape.x1),
      y2: parseFloat(shape.y1),
      color: shape.line?.color || '#2962FF',
      width: shape.line?.width || 1,
      options: {
        lineStyle: this.mapLineStyle(shape.line?.dash)
      }
    })).filter(shape =>
      !isNaN(shape.x1) && !isNaN(shape.y1) &&
      !isNaN(shape.x2) && !isNaN(shape.y2)
    );
  }

  /**
   * Convert various date formats to timestamp
   * @param {any} dateInput - Date input
   * @returns {number} Unix timestamp
   */
  static convertToTimestamp(dateInput) {
    if (!dateInput) return Date.now() / 1000;

    try {
      if (typeof dateInput === 'number') {
        return dateInput;
      }

      if (typeof dateInput === 'string') {
        // Handle ISO date strings
        if (/^\d{4}-\d{2}-\d{2}/.test(dateInput)) {
          return Math.floor(new Date(dateInput).getTime() / 1000);
        }
        // Handle other string formats
        return Math.floor(new Date(dateInput).getTime() / 1000);
      }

      if (dateInput instanceof Date) {
        return Math.floor(dateInput.getTime() / 1000);
      }

      throw new Error('Invalid date format');
    } catch (error) {
      console.warn('Error converting date to timestamp:', dateInput, error);
      return Math.floor(Date.now() / 1000);
    }
  }
}

/**
 * Error Handler and Fallback Manager
 * Handles errors and provides fallback mechanisms
 */
export class ErrorHandler {
  constructor() {
    this.errorLog = [];
    this.fallbackAttempts = new Map();
  }

  /**
   * Handle migration error
   * @param {string} componentName - Component name
   * @param {Error} error - Error that occurred
   * @param {Object} context - Error context
   */
  handleMigrationError(componentName, error, context = {}) {
    const errorEntry = {
      componentName,
      error: error.message,
      stack: error.stack,
      context,
      timestamp: Date.now(),
      resolved: false
    };

    this.errorLog.push(errorEntry);
    this.logError(errorEntry);

    // Attempt fallback if available
    return this.attemptFallback(componentName, error, context);
  }

  /**
   * Attempt fallback mechanism
   * @param {string} componentName - Component name
   * @param {Error} error - Original error
   * @param {Object} context - Error context
   * @returns {Object} Fallback result
   */
  attemptFallback(componentName, error, context) {
    const fallbackKey = `${componentName}_${error.message}`;
    const attempts = this.fallbackAttempts.get(fallbackKey) || 0;

    // Limit fallback attempts to prevent infinite loops
    if (attempts >= 3) {
      return {
        success: false,
        error: 'Maximum fallback attempts exceeded',
        shouldUseOriginal: true
      };
    }

    this.fallbackAttempts.set(fallbackKey, attempts + 1);

    try {
      // Determine fallback strategy based on error type
      const fallbackStrategy = this.determineFallbackStrategy(error, context);

      switch (fallbackStrategy) {
        case 'use_plotly':
          return this.createPlotlyFallback(context);

        case 'simplify_chart':
          return this.createSimplifiedFallback(context);

        case 'static_data':
          return this.createStaticDataFallback(context);

        default:
          return {
            success: false,
            error: 'No suitable fallback strategy found',
            shouldUseOriginal: true
          };
      }
    } catch (fallbackError) {
      return {
        success: false,
        error: `Fallback failed: ${fallbackError.message}`,
        shouldUseOriginal: true
      };
    }
  }

  /**
   * Determine appropriate fallback strategy
   * @param {Error} error - Original error
   * @param {Object} context - Error context
   * @returns {string} Fallback strategy
   */
  determineFallbackStrategy(error, context) {
    if (error.message.includes('TradingView') || error.message.includes('Lightweight Charts')) {
      return 'use_plotly';
    }

    if (error.message.includes('data') || error.message.includes('format')) {
      return 'simplify_chart';
    }

    if (error.message.includes('memory') || error.message.includes('performance')) {
      return 'static_data';
    }

    return 'use_plotly';
  }

  /**
   * Create Plotly fallback
   * @param {Object} context - Error context
   * @returns {Object} Plotly fallback configuration
   */
  createPlotlyFallback(context) {
    return {
      success: true,
      fallbackType: 'plotly',
      config: {
        type: 'plotly',
        data: context.originalData || [],
        layout: context.originalLayout || {},
        message: 'Using Plotly as fallback due to TradingView error'
      }
    };
  }

  /**
   * Create simplified chart fallback
   * @param {Object} context - Error context
   * @returns {Object} Simplified fallback configuration
   */
  createSimplifiedFallback(context) {
    return {
      success: true,
      fallbackType: 'simplified',
      config: {
        type: 'tradingview',
        data: this.simplifyData(context.originalData),
        options: {
          simplified: true,
          message: 'Using simplified chart due to data complexity'
        }
      }
    };
  }

  /**
   * Create static data fallback
   * @param {Object} context - Error context
   * @returns {Object} Static data fallback configuration
   */
  createStaticDataFallback(context) {
    return {
      success: true,
      fallbackType: 'static',
      config: {
        type: 'tradingview',
        data: this.createStaticData(context.originalData),
        options: {
          static: true,
          message: 'Using static data due to performance constraints'
        }
      }
    };
  }

  /**
   * Simplify complex data for fallback
   * @param {Array} data - Original data
   * @returns {Array} Simplified data
   */
  simplifyData(data) {
    if (!Array.isArray(data) || data.length === 0) {
      return [];
    }

    // Take only first 1000 data points
    const simplified = data.slice(0, 1000);

    // Reduce data density by taking every 2nd or 3rd point
    if (simplified.length > 500) {
      return simplified.filter((_, index) => index % 2 === 0);
    }

    return simplified;
  }

  /**
   * Create static data representation
   * @param {Array} data - Original data
   * @returns {Array} Static data
   */
  createStaticData(data) {
    if (!Array.isArray(data) || data.length === 0) {
      return [];
    }

    // Create summary statistics as static data
    const summary = this.calculateDataSummary(data);

    return [
      {
        time: summary.startTime,
        value: summary.minValue,
        label: 'Min'
      },
      {
        time: summary.startTime + (summary.endTime - summary.startTime) / 2,
        value: summary.avgValue,
        label: 'Average'
      },
      {
        time: summary.endTime,
        value: summary.maxValue,
        label: 'Max'
      }
    ];
  }

  /**
   * Calculate data summary for static fallback
   * @param {Array} data - Original data
   * @returns {Object} Data summary
   */
  calculateDataSummary(data) {
    const values = data.map(d => parseFloat(d.value || d.close || 0)).filter(v => !isNaN(v));
    const times = data.map(d => d.time).filter(t => !isNaN(t));

    return {
      startTime: Math.min(...times),
      endTime: Math.max(...times),
      minValue: Math.min(...values),
      maxValue: Math.max(...values),
      avgValue: values.reduce((sum, val) => sum + val, 0) / values.length
    };
  }

  /**
   * Log error for tracking
   * @param {Object} errorEntry - Error entry
   */
  logError(errorEntry) {
    console.error('Migration Error:', {
      component: errorEntry.componentName,
      error: errorEntry.error,
      context: errorEntry.context,
      timestamp: new Date(errorEntry.timestamp).toISOString()
    });
  }

  /**
   * Get error statistics
   * @returns {Object} Error statistics
   */
  getErrorStats() {
    const totalErrors = this.errorLog.length;
    const resolvedErrors = this.errorLog.filter(e => e.resolved).length;
    const unresolvedErrors = totalErrors - resolvedErrors;

    return {
      totalErrors,
      resolvedErrors,
      unresolvedErrors,
      resolutionRate: totalErrors > 0 ? (resolvedErrors / totalErrors) * 100 : 0,
      recentErrors: this.errorLog.slice(-5)
    };
  }
}

// Global error handler instance
export const errorHandler = new ErrorHandler();

/**
 * Migration Manager
 * Orchestrates the migration process
 */
export class MigrationManager {
  constructor() {
    this.activeMigrations = new Map();
    this.completedMigrations = new Set();
  }

  /**
   * Start migration for a component
   * @param {string} componentName - Component name
   * @param {Object} plotlyConfig - Plotly configuration
   * @param {Object} options - Migration options
   * @returns {Promise} Migration result
   */
  async startMigration(componentName, plotlyConfig, options = {}) {
    if (this.activeMigrations.has(componentName)) {
      throw new Error(`Migration already in progress for ${componentName}`);
    }

    const migration = {
      componentName,
      status: MIGRATION_STATUS.IN_PROGRESS,
      startTime: Date.now(),
      options,
      progress: 0
    };

    this.activeMigrations.set(componentName, migration);
    migrationTracker.startMigration(componentName, options);

    try {
      // Step 1: Feature compatibility check
      migration.progress = 20;
      const compatibilityReport = FeatureParityChecker.checkCompatibility(plotlyConfig);
      migrationTracker.updateProgress(componentName, 20, { compatibilityReport });

      // Step 2: Data conversion
      migration.progress = 50;
      const convertedData = DataFormatConverter.convertPlotlyToTradingView(plotlyConfig);
      migrationTracker.updateProgress(componentName, 50, { convertedData });

      // Step 3: Error handling setup
      migration.progress = 80;
      const errorHandling = this.setupErrorHandling(componentName, plotlyConfig, convertedData);
      migrationTracker.updateProgress(componentName, 80, { errorHandling });

      // Step 4: Finalization
      migration.progress = 100;
      const result = {
        success: true,
        compatibilityReport,
        convertedData,
        errorHandling,
        recommendations: this.generateMigrationRecommendations(compatibilityReport)
      };

      migration.result = result;
      migration.status = MIGRATION_STATUS.COMPLETED;
      migration.endTime = Date.now();

      this.activeMigrations.delete(componentName);
      this.completedMigrations.add(componentName);
      migrationTracker.completeMigration(componentName, result);

      return result;

    } catch (error) {
      migration.status = MIGRATION_STATUS.FAILED;
      migration.error = error.message;
      migration.endTime = Date.now();

      this.activeMigrations.delete(componentName);
      migrationTracker.failMigration(componentName, error);

      // Attempt error handling
      const fallbackResult = errorHandler.handleMigrationError(componentName, error, {
        plotlyConfig,
        options
      });

      return {
        success: false,
        error: error.message,
        fallback: fallbackResult,
        compatibilityReport: null
      };
    }
  }

  /**
   * Setup error handling for migration
   * @param {string} componentName - Component name
   * @param {Object} plotlyConfig - Original Plotly config
   * @param {Object} convertedData - Converted data
   * @returns {Object} Error handling configuration
   */
  setupErrorHandling(componentName, plotlyConfig, convertedData) {
    return {
      fallbackEnabled: true,
      fallbackConfig: {
        usePlotlyOnError: true,
        simplifyOnDataError: true,
        staticOnPerformanceError: true
      },
      errorReporting: {
        enabled: true,
        componentName,
        originalConfig: plotlyConfig,
        convertedData
      }
    };
  }

  /**
   * Generate migration recommendations
   * @param {Object} compatibilityReport - Compatibility report
   * @returns {Array} Migration recommendations
   */
  generateMigrationRecommendations(compatibilityReport) {
    const recommendations = [];

    if (compatibilityReport.compatibilityScore < 70) {
      recommendations.push({
        type: 'warning',
        message: 'Low compatibility score detected. Consider reviewing chart requirements.',
        score: compatibilityReport.compatibilityScore
      });
    }

    if (compatibilityReport.unsupported.length > 0) {
      recommendations.push({
        type: 'action',
        message: 'Remove or replace unsupported features before migration.',
        features: compatibilityReport.unsupported
      });
    }

    if (compatibilityReport.partiallySupported.length > 0) {
      recommendations.push({
        type: 'info',
        message: 'Review partially supported features for optimal migration.',
        features: compatibilityReport.partiallySupported
      });
    }

    return recommendations;
  }

  /**
   * Get migration status
   * @param {string} componentName - Component name
   * @returns {Object} Migration status
   */
  getMigrationStatus(componentName) {
    return migrationTracker.getMigrationStatus(componentName);
  }

  /**
   * Get all migration statistics
   * @returns {Object} Migration statistics
   */
  getMigrationStats() {
    return migrationTracker.getMigrationStats();
  }

  /**
   * Generate comprehensive migration report
   * @returns {Object} Migration report
   */
  generateMigrationReport() {
    return migrationTracker.generateMigrationReport();
  }
}

// Global migration manager instance
export const migrationManager = new MigrationManager();

/**
 * Utility functions for common migration tasks
 */
export const MigrationUtils = {
  /**
   * Quick migration check for a component
   * @param {Object} plotlyConfig - Plotly configuration
   * @returns {Object} Quick compatibility check
   */
  quickCompatibilityCheck: (plotlyConfig) => {
    const report = FeatureParityChecker.checkCompatibility(plotlyConfig);
    return {
      isCompatible: report.compatibilityScore >= 70,
      score: report.compatibilityScore,
      hasCriticalIssues: report.unsupported.length > 0,
      recommendations: report.recommendations
    };
  },

  /**
   * Convert simple data formats
   * @param {Array} data - Simple data array
   * @param {Object} options - Conversion options
   * @returns {Array} Converted data
   */
  convertSimpleData: (data, options = {}) => {
    if (!Array.isArray(data)) return [];

    return data.map(item => ({
      time: DataFormatConverter.convertToTimestamp(item.x || item.date || item.time),
      value: parseFloat(item.y || item.value || item.close || 0),
      ...((item.open !== undefined && item.high !== undefined &&
           item.low !== undefined && item.close !== undefined) && {
        open: parseFloat(item.open),
        high: parseFloat(item.high),
        low: parseFloat(item.low),
        close: parseFloat(item.close),
        volume: parseFloat(item.volume || 0)
      })
    })).filter(item => !isNaN(item.time) && !isNaN(item.value));
  },

  /**
   * Create migration summary
   * @param {Object} result - Migration result
   * @returns {string} Human-readable summary
   */
  createMigrationSummary: (result) => {
    if (!result.success) {
      return `Migration failed: ${result.error}`;
    }

    const { compatibilityReport } = result;
    const summary = [
      `Migration completed with ${compatibilityReport.compatibilityScore}% compatibility`,
      `Supported features: ${compatibilityReport.supported.length}`,
      `Partially supported: ${compatibilityReport.partiallySupported.length}`,
      `Unsupported: ${compatibilityReport.unsupported.length}`
    ];

    return summary.join('\n');
  }
};

export default {
  MigrationManager,
  FeatureParityChecker,
  DataFormatConverter,
  ErrorHandler,
  MigrationProgressTracker,
  migrationManager,
  migrationTracker,
  errorHandler,
  MigrationUtils,
  MIGRATION_STATUS,
  CHART_TYPE_MAPPINGS,
  FEATURE_COMPATIBILITY
};