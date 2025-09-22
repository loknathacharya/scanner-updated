/**
 * Chart Data Transformation Utilities
 * Converts existing data formats to TradingView Lightweight Charts compatible format
 */

import { format, parseISO } from 'date-fns';

/**
 * Main data transformation function
 * @param {Array} data - Raw OHLCV data
 * @param {string} timeframe - Timeframe for data grouping
 * @returns {Array} TradingView compatible data
 */
export const transformOHLCVData = (data, timeframe = '1D') => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return [];
  }

  try {
    // Sort data by date if not already sorted
    const sortedData = [...data].sort((a, b) => {
      const dateA = new Date(a.date || a.Date || a.time);
      const dateB = new Date(b.date || b.Date || b.time);
      return dateA - dateB;
    });

    // Transform to TradingView format
    const transformedData = sortedData.map(item => ({
      time: convertToUnixTimestamp(item.date || item.Date || item.time),
      open: parseFloat(item.open || item.Open || 0),
      high: parseFloat(item.high || item.High || 0),
      low: parseFloat(item.low || item.Low || 0),
      close: parseFloat(item.close || item.Close || 0),
      volume: parseFloat(item.volume || item.Volume || 0)
    }));

    // Validate data
    return transformedData.filter(item =>
      isValidOHLCVData(item) &&
      isFiniteNumber(item.open) &&
      isFiniteNumber(item.high) &&
      isFiniteNumber(item.low) &&
      isFiniteNumber(item.close)
    );
  } catch (error) {
    console.error('Error transforming OHLCV data:', error);
    return [];
  }
};

/**
 * Transform indicators data for TradingView
 * @param {Object} indicators - Technical indicators data
 * @param {string} symbol - Symbol name
 * @returns {Object} Transformed indicators
 */
export const transformIndicatorsData = (indicators, symbol = '') => {
  if (!indicators || typeof indicators !== 'object') {
    return {};
  }

  const transformedIndicators = {};

  try {
    // Handle different indicator formats
    Object.keys(indicators).forEach(indicatorName => {
      const indicatorData = indicators[indicatorName];

      if (Array.isArray(indicatorData)) {
        // Convert array format to TradingView series format
        transformedIndicators[indicatorName] = indicatorData.map(item => ({
          time: convertToUnixTimestamp(item.date || item.Date || item.time),
          value: parseFloat(item.value || item.Value || 0)
        })).filter(item => isFiniteNumber(item.value));
      } else if (indicatorData && typeof indicatorData === 'object') {
        // Handle object format with multiple lines (e.g., MACD)
        if (indicatorData.line || indicatorData.histogram || indicatorData.signal) {
          transformedIndicators[indicatorName] = {
            line: indicatorData.line ? transformIndicatorLine(indicatorData.line) : [],
            histogram: indicatorData.histogram ? transformIndicatorLine(indicatorData.histogram) : [],
            signal: indicatorData.signal ? transformIndicatorLine(indicatorData.signal) : []
          };
        } else {
          // Single line indicator
          transformedIndicators[indicatorName] = transformIndicatorLine(indicatorData);
        }
      }
    });
  } catch (error) {
    console.error('Error transforming indicators data:', error);
  }

  return transformedIndicators;
};

/**
 * Transform single indicator line
 * @param {Array|Object} data - Indicator data
 * @returns {Array} Transformed indicator line
 */
const transformIndicatorLine = (data) => {
  if (Array.isArray(data)) {
    return data.map(item => ({
      time: convertToUnixTimestamp(item.date || item.Date || item.time),
      value: parseFloat(item.value || item.Value || 0)
    })).filter(item => isFiniteNumber(item.value));
  }

  return [];
};

/**
 * Transform annotations for TradingView
 * @param {Array} annotations - Chart annotations
 * @returns {Array} Transformed annotations
 */
export const transformAnnotations = (annotations) => {
  if (!annotations || !Array.isArray(annotations)) {
    return [];
  }

  return annotations.map(annotation => ({
    id: annotation.id || generateId(),
    type: annotation.type || 'line',
    x: convertToUnixTimestamp(annotation.x || annotation.date),
    y: parseFloat(annotation.y || 0),
    text: annotation.text || '',
    color: annotation.color || '#2962FF',
    size: annotation.size || 1,
    options: annotation.options || {}
  })).filter(annotation => isFiniteNumber(annotation.x) && isFiniteNumber(annotation.y));
};

/**
 * Prepare streaming data for TradingView
 * @param {Array} data - Full dataset
 * @param {number} chunkSize - Size of each chunk
 * @returns {Object} Streaming data configuration
 */
export const prepareStreamingData = (data, chunkSize = 1000) => {
  const transformedData = transformOHLCVData(data);

  return {
    data: transformedData,
    chunks: chunkData(transformedData, chunkSize),
    totalChunks: Math.ceil(transformedData.length / chunkSize),
    chunkSize
  };
};

/**
 * Convert various date formats to Unix timestamp
 * @param {string|number|Date} dateInput - Date input
 * @returns {number} Unix timestamp
 */
export const convertToUnixTimestamp = (dateInput) => {
  if (!dateInput) return Date.now() / 1000;

  try {
    let date;

    if (typeof dateInput === 'number') {
      // Already a timestamp
      return dateInput;
    } else if (typeof dateInput === 'string') {
      // Parse string date
      if (/^\d{4}-\d{2}-\d{2}/.test(dateInput)) {
        // ISO date format
        date = parseISO(dateInput);
      } else {
        // Other string format
        date = new Date(dateInput);
      }
    } else if (dateInput instanceof Date) {
      date = dateInput;
    } else {
      throw new Error('Invalid date format');
    }

    // Validate date
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date');
    }

    return Math.floor(date.getTime() / 1000);
  } catch (error) {
    console.warn('Error converting date to timestamp:', dateInput, error);
    return Math.floor(Date.now() / 1000);
  }
};

/**
 * Validate OHLCV data point
 * @param {Object} dataPoint - OHLCV data point
 * @returns {boolean} Is valid
 */
const isValidOHLCVData = (dataPoint) => {
  return (
    dataPoint &&
    typeof dataPoint === 'object' &&
    dataPoint.time !== undefined &&
    dataPoint.open !== undefined &&
    dataPoint.high !== undefined &&
    dataPoint.low !== undefined &&
    dataPoint.close !== undefined
  );
};

/**
 * Check if number is finite
 * @param {number} num - Number to check
 * @returns {boolean} Is finite
 */
const isFiniteNumber = (num) => {
  return typeof num === 'number' && isFinite(num) && !isNaN(num);
};

/**
 * Generate unique ID
 * @returns {string} Unique ID
 */
const generateId = () => {
  return `chart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Chunk data for streaming
 * @param {Array} data - Data to chunk
 * @param {number} chunkSize - Size of each chunk
 * @returns {Array} Array of chunks
 */
const chunkData = (data, chunkSize) => {
  const chunks = [];
  for (let i = 0; i < data.length; i += chunkSize) {
    chunks.push(data.slice(i, i + chunkSize));
  }
  return chunks;
};

/**
 * Format data for different chart types
 * @param {Array} data - OHLCV data
 * @param {string} chartType - Type of chart
 * @returns {Array} Formatted data
 */
export const formatDataForChartType = (data, chartType = 'candlestick') => {
  const transformedData = transformOHLCVData(data);

  switch (chartType) {
    case 'line':
      return transformedData.map(item => ({
        time: item.time,
        value: item.close
      }));

    case 'area':
      return transformedData.map(item => ({
        time: item.time,
        value: item.close
      }));

    case 'bar':
      return transformedData.map(item => ({
        time: item.time,
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close
      }));

    case 'histogram':
      return transformedData.map(item => ({
        time: item.time,
        value: item.volume
      }));

    case 'candlestick':
    default:
      return transformedData;
  }
};

/**
 * Merge multiple data series
 * @param {Array} series - Array of data series
 * @returns {Array} Merged data
 */
export const mergeDataSeries = (series) => {
  if (!series || series.length === 0) return [];

  try {
    // Create a map of time -> data points
    const timeMap = new Map();

    series.forEach(seriesData => {
      seriesData.forEach(dataPoint => {
        if (!timeMap.has(dataPoint.time)) {
          timeMap.set(dataPoint.time, {});
        }

        const existing = timeMap.get(dataPoint.time);
        Object.assign(existing, dataPoint);
        timeMap.set(dataPoint.time, existing);
      });
    });

    // Convert back to array and sort by time
    return Array.from(timeMap.entries())
      .map(([time, data]) => ({ time, ...data }))
      .sort((a, b) => a.time - b.time);
  } catch (error) {
    console.error('Error merging data series:', error);
    return [];
  }
};

/**
 * Calculate data statistics
 * @param {Array} data - OHLCV data
 * @returns {Object} Data statistics
 */
export const calculateDataStatistics = (data) => {
  const transformedData = transformOHLCVData(data);

  if (transformedData.length === 0) {
    return {
      count: 0,
      startDate: null,
      endDate: null,
      priceRange: { min: 0, max: 0 },
      volumeRange: { min: 0, max: 0 }
    };
  }

  const closes = transformedData.map(d => d.close);
  const volumes = transformedData.map(d => d.volume);

  return {
    count: transformedData.length,
    startDate: new Date(transformedData[0].time * 1000),
    endDate: new Date(transformedData[transformedData.length - 1].time * 1000),
    priceRange: {
      min: Math.min(...closes),
      max: Math.max(...closes)
    },
    volumeRange: {
      min: Math.min(...volumes),
      max: Math.max(...volumes)
    },
    avgVolume: volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length
  };
};

export default {
  transformOHLCVData,
  transformIndicatorsData,
  transformAnnotations,
  prepareStreamingData,
  convertToUnixTimestamp,
  formatDataForChartType,
  mergeDataSeries,
  calculateDataStatistics
};