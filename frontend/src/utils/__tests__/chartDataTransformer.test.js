/**
 * @jest-environment jsdom
 */

import {
  transformOHLCVData,
  transformIndicatorsData,
  transformAnnotations,
  convertToUnixTimestamp,
  formatDataForChartType,
  mergeDataSeries,
  calculateDataStatistics
} from '../chartDataTransformer';

// Mock date-fns
jest.mock('date-fns', () => ({
  format: jest.fn((date, formatStr) => {
    return new Date(date).toISOString().split('T')[0];
  }),
  parseISO: jest.fn((dateStr) => {
    return new Date(dateStr);
  })
}));

describe('chartDataTransformer', () => {
  describe('transformOHLCVData', () => {
    const mockOHLCVData = [
      {
        date: '2023-01-01',
        open: 100,
        high: 110,
        low: 95,
        close: 105,
        volume: 1000
      },
      {
        date: '2023-01-02',
        open: 105,
        high: 115,
        low: 100,
        close: 110,
        volume: 1200
      },
      {
        date: '2023-01-03',
        open: 110,
        high: 120,
        low: 105,
        close: 115,
        volume: 1400
      }
    ];

    test('transforms OHLCV data correctly', () => {
      const result = transformOHLCVData(mockOHLCVData);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        time: expect.any(Number),
        open: 100,
        high: 110,
        low: 95,
        close: 105,
        volume: 1000
      });
      expect(result[1]).toEqual({
        time: expect.any(Number),
        open: 105,
        high: 115,
        low: 100,
        close: 110,
        volume: 1200
      });
      expect(result[2]).toEqual({
        time: expect.any(Number),
        open: 110,
        high: 120,
        low: 105,
        close: 115,
        volume: 1400
      });
    });

    test('handles different date field names', () => {
      const dataWithDifferentFields = [
        {
          Date: '2023-01-01',
          Open: 100,
          High: 110,
          Low: 95,
          Close: 105,
          Volume: 1000
        }
      ];

      const result = transformOHLCVData(dataWithDifferentFields);
      expect(result).toHaveLength(1);
      expect(result[0].open).toBe(100);
      expect(result[0].high).toBe(110);
      expect(result[0].low).toBe(95);
      expect(result[0].close).toBe(105);
      expect(result[0].volume).toBe(1000);
    });

    test('handles empty data array', () => {
      const result = transformOHLCVData([]);
      expect(result).toEqual([]);
    });

    test('handles null data', () => {
      const result = transformOHLCVData(null);
      expect(result).toEqual([]);
    });

    test('filters out invalid data points', () => {
      const dataWithInvalid = [
        {
          date: '2023-01-01',
          open: 100,
          high: 110,
          low: 95,
          close: 105,
          volume: 1000
        },
        {
          date: 'invalid-date',
          open: 'invalid',
          high: 'invalid',
          low: 'invalid',
          close: 'invalid',
          volume: 'invalid'
        }
      ];

      const result = transformOHLCVData(dataWithInvalid);
      expect(result).toHaveLength(1);
      expect(result[0].open).toBe(100);
    });

    test('sorts data by date', () => {
      const unsortedData = [
        {
          date: '2023-01-03',
          open: 110,
          high: 120,
          low: 105,
          close: 115,
          volume: 1400
        },
        {
          date: '2023-01-01',
          open: 100,
          high: 110,
          low: 95,
          close: 105,
          volume: 1000
        }
      ];

      const result = transformOHLCVData(unsortedData);
      expect(result).toHaveLength(2);
      expect(result[0].open).toBe(100); // First date should be first
      expect(result[1].open).toBe(110); // Second date should be second
    });
  });

  describe('transformIndicatorsData', () => {
    const mockIndicators = {
      SMA: [
        { date: '2023-01-01', value: 102 },
        { date: '2023-01-02', value: 107 },
        { date: '2023-01-03', value: 112 }
      ],
      MACD: {
        line: [
          { date: '2023-01-01', value: 1.5 },
          { date: '2023-01-02', value: 2.1 },
          { date: '2023-01-03', value: 2.8 }
        ],
        histogram: [
          { date: '2023-01-01', value: 0.5 },
          { date: '2023-01-02', value: 0.8 },
          { date: '2023-01-03', value: 1.2 }
        ]
      }
    };

    test('transforms single line indicators', () => {
      const result = transformIndicatorsData(mockIndicators);

      expect(result.SMA).toHaveLength(3);
      expect(result.SMA[0]).toEqual({
        time: expect.any(Number),
        value: 102
      });
      expect(result.SMA[1]).toEqual({
        time: expect.any(Number),
        value: 107
      });
      expect(result.SMA[2]).toEqual({
        time: expect.any(Number),
        value: 112
      });
    });

    test('transforms multi-line indicators', () => {
      const result = transformIndicatorsData(mockIndicators);

      expect(result.MACD.line).toHaveLength(3);
      expect(result.MACD.histogram).toHaveLength(3);
      expect(result.MACD.line[0]).toEqual({
        time: expect.any(Number),
        value: 1.5
      });
      expect(result.MACD.histogram[0]).toEqual({
        time: expect.any(Number),
        value: 0.5
      });
    });

    test('handles empty indicators object', () => {
      const result = transformIndicatorsData({});
      expect(result).toEqual({});
    });

    test('handles null indicators', () => {
      const result = transformIndicatorsData(null);
      expect(result).toEqual({});
    });

    test('filters out invalid indicator values', () => {
      const indicatorsWithInvalid = {
        SMA: [
          { date: '2023-01-01', value: 102 },
          { date: '2023-01-02', value: 'invalid' },
          { date: '2023-01-03', value: 112 }
        ]
      };

      const result = transformIndicatorsData(indicatorsWithInvalid);
      expect(result.SMA).toHaveLength(2);
      expect(result.SMA[0].value).toBe(102);
      expect(result.SMA[1].value).toBe(112);
    });
  });

  describe('convertToUnixTimestamp', () => {
    test('converts ISO date string to timestamp', () => {
      const result = convertToUnixTimestamp('2023-01-01T00:00:00Z');
      expect(typeof result).toBe('number');
      expect(result).toBe(1672531200); // 2023-01-01 00:00:00 UTC
    });

    test('converts regular date string to timestamp', () => {
      const result = convertToUnixTimestamp('2023-01-01');
      expect(typeof result).toBe('number');
    });

    test('converts Date object to timestamp', () => {
      const date = new Date('2023-01-01T00:00:00Z');
      const result = convertToUnixTimestamp(date);
      expect(typeof result).toBe('number');
      expect(result).toBe(1672531200);
    });

    test('converts numeric timestamp', () => {
      const result = convertToUnixTimestamp(1672531200);
      expect(result).toBe(1672531200);
    });

    test('handles null input', () => {
      const result = convertToUnixTimestamp(null);
      expect(typeof result).toBe('number');
    });

    test('handles undefined input', () => {
      const result = convertToUnixTimestamp(undefined);
      expect(typeof result).toBe('number');
    });

    test('handles invalid date gracefully', () => {
      const result = convertToUnixTimestamp('invalid-date');
      expect(typeof result).toBe('number');
    });
  });

  describe('formatDataForChartType', () => {
    const mockData = [
      { time: 1640995200, open: 100, high: 110, low: 95, close: 105, volume: 1000 },
      { time: 1641081600, open: 105, high: 115, low: 100, close: 110, volume: 1200 }
    ];

    test('formats data for line chart', () => {
      const result = formatDataForChartType(mockData, 'line');
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        time: 1640995200,
        value: 105
      });
      expect(result[1]).toEqual({
        time: 1641081600,
        value: 110
      });
    });

    test('formats data for area chart', () => {
      const result = formatDataForChartType(mockData, 'area');
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        time: 1640995200,
        value: 105
      });
      expect(result[1]).toEqual({
        time: 1641081600,
        value: 110
      });
    });

    test('formats data for bar chart', () => {
      const result = formatDataForChartType(mockData, 'bar');
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        time: 1640995200,
        open: 100,
        high: 110,
        low: 95,
        close: 105
      });
      expect(result[1]).toEqual({
        time: 1641081600,
        open: 105,
        high: 115,
        low: 100,
        close: 110
      });
    });

    test('formats data for histogram chart', () => {
      const result = formatDataForChartType(mockData, 'histogram');
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        time: 1640995200,
        value: 1000
      });
      expect(result[1]).toEqual({
        time: 1641081600,
        value: 1200
      });
    });

    test('returns candlestick data for candlestick chart type', () => {
      const result = formatDataForChartType(mockData, 'candlestick');
      expect(result).toEqual(mockData);
    });

    test('defaults to candlestick format for unknown chart type', () => {
      const result = formatDataForChartType(mockData, 'unknown');
      expect(result).toEqual(mockData);
    });
  });

  describe('mergeDataSeries', () => {
    const series1 = [
      { time: 1640995200, value: 100, volume: 1000 },
      { time: 1641081600, value: 105, volume: 1200 }
    ];

    const series2 = [
      { time: 1640995200, price: 102 },
      { time: 1641168000, price: 108 }
    ];

    test('merges multiple data series correctly', () => {
      const result = mergeDataSeries([series1, series2]);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        time: 1640995200,
        value: 100,
        volume: 1000,
        price: 102
      });
      expect(result[1]).toEqual({
        time: 1641081600,
        value: 105,
        volume: 1200
      });
      expect(result[2]).toEqual({
        time: 1641168000,
        price: 108
      });
    });

    test('sorts merged data by time', () => {
      const result = mergeDataSeries([series2, series1]);
      expect(result[0].time).toBe(1640995200);
      expect(result[1].time).toBe(1641081600);
      expect(result[2].time).toBe(1641168000);
    });

    test('handles empty series array', () => {
      const result = mergeDataSeries([]);
      expect(result).toEqual([]);
    });

    test('handles single series', () => {
      const result = mergeDataSeries([series1]);
      expect(result).toEqual(series1);
    });
  });

  describe('calculateDataStatistics', () => {
    const mockData = [
      { time: 1640995200, open: 100, high: 110, low: 95, close: 105, volume: 1000 },
      { time: 1641081600, open: 105, high: 115, low: 100, close: 110, volume: 1200 },
      { time: 1641168000, open: 110, high: 120, low: 105, close: 115, volume: 1400 }
    ];

    test('calculates statistics correctly', () => {
      const result = calculateDataStatistics(mockData);

      expect(result.count).toBe(3);
      expect(result.startDate).toEqual(new Date(1640995200 * 1000));
      expect(result.endDate).toEqual(new Date(1641168000 * 1000));
      expect(result.priceRange.min).toBe(105);
      expect(result.priceRange.max).toBe(115);
      expect(result.volumeRange.min).toBe(1000);
      expect(result.volumeRange.max).toBe(1400);
      expect(result.avgVolume).toBe(1200);
    });

    test('handles empty data', () => {
      const result = calculateDataStatistics([]);

      expect(result.count).toBe(0);
      expect(result.startDate).toBeNull();
      expect(result.endDate).toBeNull();
      expect(result.priceRange.min).toBe(0);
      expect(result.priceRange.max).toBe(0);
      expect(result.volumeRange.min).toBe(0);
      expect(result.volumeRange.max).toBe(0);
    });

    test('handles null data', () => {
      const result = calculateDataStatistics(null);

      expect(result.count).toBe(0);
      expect(result.startDate).toBeNull();
      expect(result.endDate).toBeNull();
      expect(result.priceRange.min).toBe(0);
      expect(result.priceRange.max).toBe(0);
      expect(result.volumeRange.min).toBe(0);
      expect(result.volumeRange.max).toBe(0);
    });
  });

  describe('transformAnnotations', () => {
    const mockAnnotations = [
      {
        id: 'annotation1',
        x: '2023-01-01',
        y: 105,
        text: 'Test annotation',
        color: '#FF6B35'
      },
      {
        id: 'annotation2',
        date: '2023-01-02',
        y: 110,
        text: 'Another annotation'
      }
    ];

    test('transforms annotations correctly', () => {
      const result = transformAnnotations(mockAnnotations);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'annotation1',
        type: 'line',
        x: expect.any(Number),
        y: 105,
        text: 'Test annotation',
        color: '#FF6B35',
        size: 1,
        options: {}
      });
      expect(result[1]).toEqual({
        id: 'annotation2',
        type: 'line',
        x: expect.any(Number),
        y: 110,
        text: 'Another annotation',
        color: '#2962FF',
        size: 1,
        options: {}
      });
    });

    test('handles empty annotations array', () => {
      const result = transformAnnotations([]);
      expect(result).toEqual([]);
    });

    test('handles null annotations', () => {
      const result = transformAnnotations(null);
      expect(result).toEqual([]);
    });

    test('filters out invalid annotations', () => {
      const invalidAnnotations = [
        {
          id: 'valid',
          x: '2023-01-01',
          y: 105,
          text: 'Valid annotation'
        },
        {
          id: 'invalid',
          x: 'invalid-date',
          y: 'invalid-y',
          text: 'Invalid annotation'
        }
      ];

      const result = transformAnnotations(invalidAnnotations);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('valid');
    });
  });
});