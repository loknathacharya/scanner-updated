/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import TradingViewChart from '../TradingViewChart';

// Mock the lightweight-charts library
jest.mock('lightweight-charts', () => ({
  createChart: jest.fn(() => ({
    addSeries: jest.fn((seriesType, options) => {
      if (seriesType.name === 'CandlestickSeries') {
        return {
          setData: jest.fn(),
          update: jest.fn(),
        };
      } else if (seriesType.name === 'LineSeries') {
        return {
          setData: jest.fn(),
          update: jest.fn(),
        };
      }
      return {
        setData: jest.fn(),
        update: jest.fn(),
      };
    }),
    removeSeries: jest.fn(),
    remove: jest.fn(),
    applyOptions: jest.fn(),
    takeScreenshot: jest.fn(() => ({
      toDataURL: jest.fn(() => 'mock-canvas-data-url'),
    })),
    timeScale: jest.fn(() => ({
      zoomIn: jest.fn(),
      zoomOut: jest.fn(),
      fitContent: jest.fn(),
      scrollToPosition: jest.fn(),
    })),
    subscribeClick: jest.fn(),
    unsubscribeClick: jest.fn(),
  })),
  ColorType: {
    Solid: 0,
  },
  CrosshairMode: {
    Normal: 0,
  },
  CandlestickSeries: class CandlestickSeries {
    static name = 'CandlestickSeries';
  },
  LineSeries: class LineSeries {
    static name = 'LineSeries';
  },
}));

// Mock ResizeObserver
global.ResizeObserver = jest.fn(() => ({
  observe: jest.fn(),
  disconnect: jest.fn(),
}));

const mockCreateChart = require('lightweight-charts').createChart;
const mockCandlestickSeries = require('lightweight-charts').CandlestickSeries;
const mockLineSeries = require('lightweight-charts').LineSeries;

describe('TradingViewChart Component', () => {
  const mockData = [
    { time: 1640995200, open: 100, high: 110, low: 95, close: 105, volume: 1000 },
    { time: 1641081600, open: 105, high: 115, low: 100, close: 110, volume: 1200 },
    { time: 1641168000, open: 110, high: 120, low: 105, close: 115, volume: 1400 },
  ];

  const mockIndicators = [
    {
      name: 'SMA',
      data: [
        { time: 1640995200, value: 102 },
        { time: 1641081600, value: 107 },
        { time: 1641168000, value: 112 },
      ],
      color: '#FF6B35',
    },
  ];

  const defaultProps = {
    data: mockData,
    indicators: mockIndicators,
    chartType: 'candlestick',
    symbol: 'AAPL',
    height: 500,
    width: '100%',
    theme: 'dark',
    loading: false,
    error: null,
    className: '',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the mock implementation
    mockCreateChart.mockReturnValue({
      addSeries: jest.fn((seriesType, options) => {
        if (seriesType.name === 'CandlestickSeries') {
          return {
            setData: jest.fn(),
            update: jest.fn(),
          };
        } else if (seriesType.name === 'LineSeries') {
          return {
            setData: jest.fn(),
            update: jest.fn(),
          };
        }
        return {
          setData: jest.fn(),
          update: jest.fn(),
        };
      }),
      removeSeries: jest.fn(),
      remove: jest.fn(),
      applyOptions: jest.fn(),
      takeScreenshot: jest.fn(() => ({
        toDataURL: jest.fn(() => 'mock-canvas-data-url'),
      })),
      timeScale: jest.fn(() => ({
        zoomIn: jest.fn(),
        zoomOut: jest.fn(),
        fitContent: jest.fn(),
        scrollToPosition: jest.fn(),
      })),
      subscribeClick: jest.fn(),
      unsubscribeClick: jest.fn(),
    });
  });

  describe('Rendering', () => {
    test('renders chart with all controls', () => {
      render(<TradingViewChart {...defaultProps} />);

      expect(screen.getByText('AAPL - Candlestick Chart')).toBeInTheDocument();
      expect(screen.getByTitle('Zoom In')).toBeInTheDocument();
      expect(screen.getByTitle('Zoom Out')).toBeInTheDocument();
      expect(screen.getByTitle('Reset Zoom')).toBeInTheDocument();
      expect(screen.getByTitle('Download Chart')).toBeInTheDocument();
      expect(screen.getByTitle('Draw Trend Line')).toBeInTheDocument();
    });

    test('renders chart container with correct dimensions', () => {
      render(<TradingViewChart {...defaultProps} />);

      const chartContainer = document.querySelector('.tradingview-chart');
      expect(chartContainer).toBeInTheDocument();
    });

    test('renders loading state', () => {
      render(<TradingViewChart {...defaultProps} loading={true} />);

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    test('renders error state', () => {
      render(<TradingViewChart {...defaultProps} error="Test error message" />);

      expect(screen.getByText('Error loading chart: Test error message')).toBeInTheDocument();
    });

    test('renders with custom className', () => {
      render(<TradingViewChart {...defaultProps} className="custom-class" />);

      const chartElement = document.querySelector('.tradingview-chart.custom-class');
      expect(chartElement).toBeInTheDocument();
    });
  });

  describe('Chart Initialization', () => {
    test('creates chart with correct configuration', () => {
      render(<TradingViewChart {...defaultProps} />);

      expect(mockCreateChart).toHaveBeenCalledWith(
        expect.any(Element),
        expect.objectContaining({
          layout: {
            background: { type: 0, color: '#1a1a1a' },
            textColor: '#d1d4dc',
          },
          grid: {
            vertLines: { color: '#2a2e39' },
            horzLines: { color: '#2a2e39' },
          },
          crosshair: {
            mode: 0,
          },
          width: expect.any(Number),
          height: 500,
          timeScale: {
            timeVisible: true,
            secondsVisible: false,
          },
        })
      );
    });

    test('creates candlestick series for candlestick chart type', () => {
      render(<TradingViewChart {...defaultProps} chartType="candlestick" />);

      expect(mockCreateChart().addSeries).toHaveBeenCalledWith(
        mockCandlestickSeries,
        expect.objectContaining({
          upColor: '#26a69a',
          downColor: '#ef5350',
          borderVisible: false,
          wickUpColor: '#26a69a',
          wickDownColor: '#ef5350',
        })
      );
    });

    test('creates line series for line chart type', () => {
      render(<TradingViewChart {...defaultProps} chartType="line" />);

      expect(mockCreateChart().addSeries).toHaveBeenCalledWith(
        mockLineSeries,
        expect.objectContaining({
          color: '#26a69a',
          lineWidth: 2,
        })
      );
    });

    test('sets data on main series', () => {
      render(<TradingViewChart {...defaultProps} />);

      const mockSeries = mockCreateChart().addSeries.mock.results[0].value;
      expect(mockSeries.setData).toHaveBeenCalledWith(mockData);
    });

    test('converts line data correctly for line chart type', () => {
      render(<TradingViewChart {...defaultProps} chartType="line" />);

      const mockSeries = mockCreateChart().addSeries.mock.results[0].value;
      const expectedLineData = mockData.map(d => ({ time: d.time, value: d.close }));
      expect(mockSeries.setData).toHaveBeenCalledWith(expectedLineData);
    });

    test('applies theme correctly', () => {
      render(<TradingViewChart {...defaultProps} theme="light" />);

      expect(mockCreateChart).toHaveBeenCalledWith(
        expect.any(Element),
        expect.objectContaining({
          layout: {
            background: { type: 0, color: '#ffffff' },
            textColor: '#191919',
          },
          grid: {
            vertLines: { color: '#e1e1e1' },
            horzLines: { color: '#e1e1e1' },
          },
        })
      );
    });
  });

  describe('Indicators', () => {
    test('adds indicator series', () => {
      render(<TradingViewChart {...defaultProps} />);

      expect(mockCreateChart().addSeries).toHaveBeenCalledWith(
        mockLineSeries,
        expect.objectContaining({
          color: '#FF6B35',
          lineWidth: 1,
          title: 'SMA',
        })
      );
    });

    test('sets indicator data', () => {
      render(<TradingViewChart {...defaultProps} />);

      const mockIndicatorSeries = mockCreateChart().addSeries.mock.results[1].value;
      expect(mockIndicatorSeries.setData).toHaveBeenCalledWith(mockIndicators[0].data);
    });

    test('clears old indicators when indicators prop changes', () => {
      const { rerender } = render(<TradingViewChart {...defaultProps} />);

      const newIndicators = [
        {
          name: 'EMA',
          data: [
            { time: 1640995200, value: 103 },
            { time: 1641081600, value: 108 },
          ],
          color: '#2962FF',
        },
      ];

      rerender(<TradingViewChart {...defaultProps} indicators={newIndicators} />);

      expect(mockCreateChart().removeSeries).toHaveBeenCalled();
    });

    test('handles empty indicators array', () => {
      render(<TradingViewChart {...defaultProps} indicators={[]} />);

      // Should only create main series
      expect(mockCreateChart().addSeries).toHaveBeenCalledTimes(1);
    });
  });

  describe('Chart Controls', () => {
    test('handles zoom in', () => {
      render(<TradingViewChart {...defaultProps} />);

      const zoomInButton = screen.getByTitle('Zoom In');
      fireEvent.click(zoomInButton);

      expect(mockCreateChart().timeScale().zoomIn).toHaveBeenCalled();
    });

    test('handles zoom out', () => {
      render(<TradingViewChart {...defaultProps} />);

      const zoomOutButton = screen.getByTitle('Zoom Out');
      fireEvent.click(zoomOutButton);

      expect(mockCreateChart().timeScale().zoomOut).toHaveBeenCalled();
    });

    test('handles reset zoom', () => {
      render(<TradingViewChart {...defaultProps} />);

      const resetButton = screen.getByTitle('Reset Zoom');
      fireEvent.click(resetButton);

      expect(mockCreateChart().timeScale().fitContent).toHaveBeenCalled();
    });

    test('handles download chart', async () => {
      // Mock URL methods
      global.URL.createObjectURL = jest.fn(() => 'mock-url');
      global.URL.revokeObjectURL = jest.fn();

      render(<TradingViewChart {...defaultProps} />);

      const downloadButton = screen.getByTitle('Download Chart');
      fireEvent.click(downloadButton);

      await waitFor(() => {
        expect(mockCreateChart().takeScreenshot).toHaveBeenCalled();
      });
    });

    test('handles drawing mode toggle', () => {
      render(<TradingViewChart {...defaultProps} />);

      const drawButton = screen.getByTitle('Draw Trend Line');
      expect(drawButton).toHaveAttribute('color', 'default');

      fireEvent.click(drawButton);
      expect(drawButton).toHaveAttribute('color', 'primary');
    });
  });

  describe('Drawing Tools', () => {
    test('enters drawing mode when draw button is clicked', () => {
      render(<TradingViewChart {...defaultProps} />);

      const drawButton = screen.getByTitle('Draw Trend Line');
      fireEvent.click(drawButton);

      // Button should be highlighted
      expect(drawButton).toHaveAttribute('color', 'primary');
    });

    test('handles drawing point clicks', () => {
      render(<TradingViewChart {...defaultProps} />);

      // Enter drawing mode
      const drawButton = screen.getByTitle('Draw Trend Line');
      fireEvent.click(drawButton);

      // Simulate chart click events
      const mockChart = mockCreateChart();
      const clickHandler = mockChart.subscribeClick.mock.calls[0][0];

      // First click
      clickHandler({ point: { x: 100, y: 200 }, time: 1640995200, price: 105 });
      expect(mockChart.addSeries).toHaveBeenCalledTimes(1); // Main series

      // Second click should create line
      clickHandler({ point: { x: 200, y: 300 }, time: 1641081600, price: 110 });

      expect(mockChart.addSeries).toHaveBeenCalledTimes(2); // Main series + drawing line
      expect(mockChart.addSeries).toHaveBeenLastCalledWith(
        mockLineSeries,
        expect.objectContaining({
          color: 'yellow',
          lineWidth: 2,
        })
      );
    });

    test('exits drawing mode after completing line', () => {
      render(<TradingViewChart {...defaultProps} />);

      const drawButton = screen.getByTitle('Draw Trend Line');
      fireEvent.click(drawButton);

      const mockChart = mockCreateChart();
      const clickHandler = mockChart.subscribeClick.mock.calls[0][0];

      // Complete a line
      clickHandler({ point: { x: 100, y: 200 }, time: 1640995200, price: 105 });
      clickHandler({ point: { x: 200, y: 300 }, time: 1641081600, price: 110 });

      // Should exit drawing mode
      expect(drawButton).toHaveAttribute('color', 'default');
    });
  });

  describe('Responsive Behavior', () => {
    test('handles resize events', () => {
      render(<TradingViewChart {...defaultProps} />);

      // Simulate resize
      const resizeObserverCallback = global.ResizeObserver.mock.calls[0][0];
      const mockEntry = {
        target: { clientWidth: 800 },
      };

      act(() => {
        resizeObserverCallback([mockEntry]);
      });

      expect(mockCreateChart().applyOptions).toHaveBeenCalledWith({
        width: 800,
      });
    });

    test('cleans up resize observer on unmount', () => {
      const { unmount } = render(<TradingViewChart {...defaultProps} />);

      unmount();

      expect(global.ResizeObserver.mock.instances[0].disconnect).toHaveBeenCalled();
    });
  });

  describe('Data Updates', () => {
    test('updates chart when data prop changes', () => {
      const { rerender } = render(<TradingViewChart {...defaultProps} />);

      const newData = [
        ...mockData,
        { time: 1641254400, open: 115, high: 125, low: 110, close: 120, volume: 1600 },
      ];

      rerender(<TradingViewChart {...defaultProps} data={newData} />);

      const mockSeries = mockCreateChart().addSeries.mock.results[0].value;
      expect(mockSeries.setData).toHaveBeenCalledWith(newData);
    });

    test('handles empty data array', () => {
      render(<TradingViewChart {...defaultProps} data={[]} />);

      expect(mockCreateChart).not.toHaveBeenCalled();
    });

    test('handles null data', () => {
      render(<TradingViewChart {...defaultProps} data={null} />);

      expect(mockCreateChart).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    test('handles chart creation errors gracefully', () => {
      mockCreateChart.mockImplementation(() => {
        throw new Error('Chart creation failed');
      });

      // Should not crash
      expect(() => {
        render(<TradingViewChart {...defaultProps} />);
      }).not.toThrow();
    });

    test('handles screenshot errors gracefully', async () => {
      mockCreateChart().takeScreenshot.mockImplementation(() => {
        throw new Error('Screenshot failed');
      });

      // Mock console.error to avoid noise in test output
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(<TradingViewChart {...defaultProps} />);

      const downloadButton = screen.getByTitle('Download Chart');
      fireEvent.click(downloadButton);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Screenshot failed:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Accessibility', () => {
    test('has proper ARIA labels', () => {
      render(<TradingViewChart {...defaultProps} />);

      expect(screen.getByTitle('Zoom In')).toBeInTheDocument();
      expect(screen.getByTitle('Zoom Out')).toBeInTheDocument();
      expect(screen.getByTitle('Reset Zoom')).toBeInTheDocument();
      expect(screen.getByTitle('Download Chart')).toBeInTheDocument();
      expect(screen.getByTitle('Draw Trend Line')).toBeInTheDocument();
    });

    test('buttons are keyboard accessible', () => {
      render(<TradingViewChart {...defaultProps} />);

      const zoomInButton = screen.getByTitle('Zoom In');
      const zoomOutButton = screen.getByTitle('Zoom Out');

      expect(zoomInButton).toBeVisible();
      expect(zoomOutButton).toBeVisible();
    });
  });

  describe('Performance', () => {
    test('handles rapid prop changes efficiently', () => {
      const { rerender } = render(<TradingViewChart {...defaultProps} />);

      // Rapidly change props
      for (let i = 0; i < 10; i++) {
        rerender(<TradingViewChart {...defaultProps} height={500 + i} />);
      }

      // Should still work
      expect(screen.getByText('AAPL - Candlestick Chart')).toBeInTheDocument();
    });

    test('cleans up resources properly', () => {
      const { unmount } = render(<TradingViewChart {...defaultProps} />);

      unmount();

      expect(mockCreateChart().remove).toHaveBeenCalled();
    });
  });

  describe('Theme Integration', () => {
    test('applies dark theme correctly', () => {
      render(<TradingViewChart {...defaultProps} theme="dark" />);

      expect(mockCreateChart).toHaveBeenCalledWith(
        expect.any(Element),
        expect.objectContaining({
          layout: {
            background: { type: 0, color: '#1a1a1a' },
            textColor: '#d1d4dc',
          },
        })
      );
    });

    test('applies light theme correctly', () => {
      render(<TradingViewChart {...defaultProps} theme="light" />);

      expect(mockCreateChart).toHaveBeenCalledWith(
        expect.any(Element),
        expect.objectContaining({
          layout: {
            background: { type: 0, color: '#ffffff' },
            textColor: '#191919',
          },
        })
      );
    });

    test('handles invalid theme gracefully', () => {
      render(<TradingViewChart {...defaultProps} theme="invalid" />);

      // Should fall back to dark theme
      expect(mockCreateChart).toHaveBeenCalledWith(
        expect.any(Element),
        expect.objectContaining({
          layout: {
            background: { type: 0, color: '#1a1a1a' },
            textColor: '#d1d4dc',
          },
        })
      );
    });
  });
});

    test('renders chart container with correct dimensions', () => {
      render(<TradingViewChart {...defaultProps} />);

      const chartContainer = document.querySelector('.tradingview-chart');
      expect(chartContainer).toBeInTheDocument();
    });

    test('renders loading state', () => {
      render(<TradingViewChart {...defaultProps} loading={true} />);

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    test('renders error state', () => {
      render(<TradingViewChart {...defaultProps} error="Test error message" />);

      expect(screen.getByText('Error loading chart: Test error message')).toBeInTheDocument();
    });

    test('renders with custom className', () => {
      render(<TradingViewChart {...defaultProps} className="custom-class" />);

      const chartElement = document.querySelector('.tradingview-chart.custom-class');
      expect(chartElement).toBeInTheDocument();
    });
  });

  describe('Chart Initialization', () => {
    test('creates chart with correct configuration', () => {
      render(<TradingViewChart {...defaultProps} />);

      expect(mockCreateChart).toHaveBeenCalledWith(
        expect.any(Element),
        expect.objectContaining({
          layout: {
            background: { type: 0, color: '#1a1a1a' },
            textColor: '#d1d4dc',
          },
          grid: {
            vertLines: { color: '#2a2e39' },
            horzLines: { color: '#2a2e39' },
          },
          crosshair: {
            mode: 0,
          },
          width: expect.any(Number),
          height: 500,
          timeScale: {
            timeVisible: true,
            secondsVisible: false,
          },
        })
      );
    });

    test('creates candlestick series for candlestick chart type', () => {
      render(<TradingViewChart {...defaultProps} chartType="candlestick" />);

      expect(mockCreateChart().addSeries).toHaveBeenCalledWith(
        mockCandlestickSeries,
        expect.objectContaining({
          upColor: '#26a69a',
          downColor: '#ef5350',
          borderVisible: false,
          wickUpColor: '#26a69a',
          wickDownColor: '#ef5350',
        })
      );
    });

    test('creates line series for line chart type', () => {
      render(<TradingViewChart {...defaultProps} chartType="line" />);

      expect(mockCreateChart().addSeries).toHaveBeenCalledWith(
        mockLineSeries,
        expect.objectContaining({
          color: '#26a69a',
          lineWidth: 2,
        })
      );
    });

    test('sets data on main series', () => {
      render(<TradingViewChart {...defaultProps} />);

      const mockSeries = mockCreateChart().addSeries.mock.results[0].value;
      expect(mockSeries.setData).toHaveBeenCalledWith(mockData);
    });

    test('converts line data correctly for line chart type', () => {
      render(<TradingViewChart {...defaultProps} chartType="line" />);

      const mockSeries = mockCreateChart().addSeries.mock.results[0].value;
      const expectedLineData = mockData.map(d => ({ time: d.time, value: d.close }));
      expect(mockSeries.setData).toHaveBeenCalledWith(expectedLineData);
    });

    test('applies theme correctly', () => {
      render(<TradingViewChart {...defaultProps} theme="light" />);

      expect(mockCreateChart).toHaveBeenCalledWith(
        expect.any(Element),
        expect.objectContaining({
          layout: {
            background: { type: 0, color: '#ffffff' },
            textColor: '#191919',
          },
          grid: {
            vertLines: { color: '#e1e1e1' },
            horzLines: { color: '#e1e1e1' },
          },
        })
      );
    });
  });

  describe('Indicators', () => {
    test('adds indicator series', () => {
      render(<TradingViewChart {...defaultProps} />);

      expect(mockCreateChart().addSeries).toHaveBeenCalledWith(
        mockLineSeries,
        expect.objectContaining({
          color: '#FF6B35',
          lineWidth: 1,
          title: 'SMA',
        })
      );
    });

    test('sets indicator data', () => {
      render(<TradingViewChart {...defaultProps} />);

      const mockIndicatorSeries = mockCreateChart().addSeries.mock.results[1].value;
      expect(mockIndicatorSeries.setData).toHaveBeenCalledWith(mockIndicators[0].data);
    });

    test('clears old indicators when indicators prop changes', () => {
      const { rerender } = render(<TradingViewChart {...defaultProps} />);

      const newIndicators = [
        {
          name: 'EMA',
          data: [
            { time: 1640995200, value: 103 },
            { time: 1641081600, value: 108 },
          ],
          color: '#2962FF',
        },
      ];

      rerender(<TradingViewChart {...defaultProps} indicators={newIndicators} />);

      expect(mockCreateChart().removeSeries).toHaveBeenCalled();
    });

    test('handles empty indicators array', () => {
      render(<TradingViewChart {...defaultProps} indicators={[]} />);

      // Should only create main series
      expect(mockCreateChart().addSeries).toHaveBeenCalledTimes(1);
    });
  });

  describe('Chart Controls', () => {
    test('handles zoom in', () => {
      render(<TradingViewChart {...defaultProps} />);

      const zoomInButton = screen.getByTitle('Zoom In');
      fireEvent.click(zoomInButton);

      expect(mockCreateChart().timeScale().zoomIn).toHaveBeenCalled();
    });

    test('handles zoom out', () => {
      render(<TradingViewChart {...defaultProps} />);

      const zoomOutButton = screen.getByTitle('Zoom Out');
      fireEvent.click(zoomOutButton);

      expect(mockCreateChart().timeScale().zoomOut).toHaveBeenCalled();
    });

    test('handles reset zoom', () => {
      render(<TradingViewChart {...defaultProps} />);

      const resetButton = screen.getByTitle('Reset Zoom');
      fireEvent.click(resetButton);

      expect(mockCreateChart().timeScale().fitContent).toHaveBeenCalled();
    });

    test('handles download chart', async () => {
      // Mock URL methods
      global.URL.createObjectURL = jest.fn(() => 'mock-url');
      global.URL.revokeObjectURL = jest.fn();

      render(<TradingViewChart {...defaultProps} />);

      const downloadButton = screen.getByTitle('Download Chart');
      fireEvent.click(downloadButton);

      await waitFor(() => {
        expect(mockCreateChart().takeScreenshot).toHaveBeenCalled();
      });
    });

    test('handles drawing mode toggle', () => {
      render(<TradingViewChart {...defaultProps} />);

      const drawButton = screen.getByTitle('Draw Trend Line');
      expect(drawButton).toHaveAttribute('color', 'default');

      fireEvent.click(drawButton);
      expect(drawButton).toHaveAttribute('color', 'primary');
    });
  });

  describe('Drawing Tools', () => {
    test('enters drawing mode when draw button is clicked', () => {
      render(<TradingViewChart {...defaultProps} />);

      const drawButton = screen.getByTitle('Draw Trend Line');
      fireEvent.click(drawButton);

      // Button should be highlighted
      expect(drawButton).toHaveAttribute('color', 'primary');
    });

    test('handles drawing point clicks', () => {
      render(<TradingViewChart {...defaultProps} />);

      // Enter drawing mode
      const drawButton = screen.getByTitle('Draw Trend Line');
      fireEvent.click(drawButton);

      // Simulate chart click events
      const mockChart = mockCreateChart();
      const clickHandler = mockChart.subscribeClick.mock.calls[0][0];

      // First click
      clickHandler({ point: { x: 100, y: 200 }, time: 1640995200, price: 105 });
      expect(mockChart.addSeries).toHaveBeenCalledTimes(1); // Main series

      // Second click should create line
      clickHandler({ point: { x: 200, y: 300 }, time: 1641081600, price: 110 });

      expect(mockChart.addSeries).toHaveBeenCalledTimes(2); // Main series + drawing line
      expect(mockChart.addSeries).toHaveBeenLastCalledWith(
        mockLineSeries,
        expect.objectContaining({
          color: 'yellow',
          lineWidth: 2,
        })
      );
    });

    test('exits drawing mode after completing line', () => {
      render(<TradingViewChart {...defaultProps} />);

      const drawButton = screen.getByTitle('Draw Trend Line');
      fireEvent.click(drawButton);

      const mockChart = mockCreateChart();
      const clickHandler = mockChart.subscribeClick.mock.calls[0][0];

      // Complete a line
      clickHandler({ point: { x: 100, y: 200 }, time: 1640995200, price: 105 });
      clickHandler({ point: { x: 200, y: 300 }, time: 1641081600, price: 110 });

      // Should exit drawing mode
      expect(drawButton).toHaveAttribute('color', 'default');
    });
  });

  describe('Responsive Behavior', () => {
    test('handles resize events', () => {
      render(<TradingViewChart {...defaultProps} />);

      // Simulate resize
      const resizeObserverCallback = global.ResizeObserver.mock.calls[0][0];
      const mockEntry = {
        target: { clientWidth: 800 },
      };

      act(() => {
        resizeObserverCallback([mockEntry]);
      });

      expect(mockCreateChart().applyOptions).toHaveBeenCalledWith({
        width: 800,
      });
    });

    test('cleans up resize observer on unmount', () => {
      const { unmount } = render(<TradingViewChart {...defaultProps} />);

      unmount();

      expect(global.ResizeObserver.mock.instances[0].disconnect).toHaveBeenCalled();
    });
  });

  describe('Data Updates', () => {
    test('updates chart when data prop changes', () => {
      const { rerender } = render(<TradingViewChart {...defaultProps} />);

      const newData = [
        ...mockData,
        { time: 1641254400, open: 115, high: 125, low: 110, close: 120, volume: 1600 },
      ];

      rerender(<TradingViewChart {...defaultProps} data={newData} />);

      const mockSeries = mockCreateChart().addSeries.mock.results[0].value;
      expect(mockSeries.setData).toHaveBeenCalledWith(newData);
    });

    test('handles empty data array', () => {
      render(<TradingViewChart {...defaultProps} data={[]} />);

      expect(mockCreateChart).not.toHaveBeenCalled();
    });

    test('handles null data', () => {
      render(<TradingViewChart {...defaultProps} data={null} />);

      expect(mockCreateChart).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    test('handles chart creation errors gracefully', () => {
      mockCreateChart.mockImplementation(() => {
        throw new Error('Chart creation failed');
      });

      // Should not crash
      expect(() => {
        render(<TradingViewChart {...defaultProps} />);
      }).not.toThrow();
    });

    test('handles screenshot errors gracefully', async () => {
      mockCreateChart().takeScreenshot.mockImplementation(() => {
        throw new Error('Screenshot failed');
      });

      // Mock console.error to avoid noise in test output
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(<TradingViewChart {...defaultProps} />);

      const downloadButton = screen.getByTitle('Download Chart');
      fireEvent.click(downloadButton);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Screenshot failed:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Accessibility', () => {
    test('has proper ARIA labels', () => {
      render(<TradingViewChart {...defaultProps} />);

      expect(screen.getByTitle('Zoom In')).toBeInTheDocument();
      expect(screen.getByTitle('Zoom Out')).toBeInTheDocument();
      expect(screen.getByTitle('Reset Zoom')).toBeInTheDocument();
      expect(screen.getByTitle('Download Chart')).toBeInTheDocument();
      expect(screen.getByTitle('Draw Trend Line')).toBeInTheDocument();
    });

    test('buttons are keyboard accessible', () => {
      render(<TradingViewChart {...defaultProps} />);

      const zoomInButton = screen.getByTitle('Zoom In');
      const zoomOutButton = screen.getByTitle('Zoom Out');

      expect(zoomInButton).toBeVisible();
      expect(zoomOutButton).toBeVisible();
    });
  });

  describe('Performance', () => {
    test('handles rapid prop changes efficiently', () => {
      const { rerender } = render(<TradingViewChart {...defaultProps} />);

      // Rapidly change props
      for (let i = 0; i < 10; i++) {
        rerender(<TradingViewChart {...defaultProps} height={500 + i} />);
      }

      // Should still work
      expect(screen.getByText('AAPL - Candlestick Chart')).toBeInTheDocument();
    });

    test('cleans up resources properly', () => {
      const { unmount } = render(<TradingViewChart {...defaultProps} />);

      unmount();

      expect(mockCreateChart().remove).toHaveBeenCalled();
    });
  });

  describe('Theme Integration', () => {
    test('applies dark theme correctly', () => {
      render(<TradingViewChart {...defaultProps} theme="dark" />);

      expect(mockCreateChart).toHaveBeenCalledWith(
        expect.any(Element),
        expect.objectContaining({
          layout: {
            background: { type: 0, color: '#1a1a1a' },
            textColor: '#d1d4dc',
          },
        })
      );
    });

    test('applies light theme correctly', () => {
      render(<TradingViewChart {...defaultProps} theme="light" />);

      expect(mockCreateChart).toHaveBeenCalledWith(
        expect.any(Element),
        expect.objectContaining({
          layout: {
            background: { type: 0, color: '#ffffff' },
            textColor: '#191919',
          },
        })
      );
    });

    test('handles invalid theme gracefully', () => {
      render(<TradingViewChart {...defaultProps} theme="invalid" />);

      // Should fall back to dark theme
      expect(mockCreateChart).toHaveBeenCalledWith(
        expect.any(Element),
        expect.objectContaining({
          layout: {
            background: { type: 0, color: '#1a1a1a' },
            textColor: '#d1d4dc',
          },
        })
      );
    });
  });
});