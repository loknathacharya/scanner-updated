import React, { useState, useCallback, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Tooltip,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Info,
} from '@mui/icons-material';
import TradingViewChart from './TradingViewChart';

const TradingViewCandlestickChart = ({
  data = [],
  symbol = '',
  height = 500,
  width = '100%',
  theme = 'dark',
  loading = false,
  error = null,
  className = '',
  showVolume = true,
  showPriceInfo = true,
  onPriceChange = null,
  volumeColor = null,
  pricePrecision = 2,
  volumePrecision = 0,
}) => {
  const [currentPrice, setCurrentPrice] = useState(null);
  const [priceChange, setPriceChange] = useState(null);
  const [priceChangePercent, setPriceChangePercent] = useState(null);

  // Calculate price statistics
  const priceStats = useMemo(() => {
    if (!data || data.length === 0) return null;

    const latest = data[data.length - 1];
    const previous = data[data.length - 2];

    if (!latest || !previous) return null;

    const change = latest.close - previous.close;
    const changePercent = (change / previous.close) * 100;

    return {
      current: latest.close,
      change,
      changePercent,
      high: latest.high,
      low: latest.low,
      open: latest.open,
      volume: latest.volume || 0,
    };
  }, [data]);

  // Handle crosshair move for price display
  const handleCrosshairMove = useCallback((param) => {
    if (!param.time) {
      setCurrentPrice(null);
      setPriceChange(null);
      setPriceChangePercent(null);
      return;
    }

    const dataPoint = param.seriesData.get(param.series);
    if (dataPoint) {
      const price = dataPoint.value !== undefined ? dataPoint.value : dataPoint.close;
      setCurrentPrice(price);

      // Calculate change from previous close
      if (priceStats && data.length > 1) {
        const prevClose = data[data.length - 2]?.close;
        if (prevClose) {
          const change = price - prevClose;
          const changePercent = (change / prevClose) * 100;
          setPriceChange(change);
          setPriceChangePercent(changePercent);
        }
      }

      // Call external price change handler
      if (onPriceChange) {
        onPriceChange({
          price,
          time: param.time,
          change: priceChange,
          changePercent: priceChangePercent,
        });
      }
    }
  }, [priceStats, data, onPriceChange, priceChange, priceChangePercent]);

  // Prepare volume indicator data
  const volumeIndicator = useMemo(() => {
    if (!showVolume || !data || data.length === 0) return null;

    return {
      name: 'Volume',
      data: data.map(d => ({
        time: d.time,
        value: d.volume || 0,
      })),
      color: volumeColor || (theme === 'dark' ? '#2962FF' : '#1976d2'),
    };
  }, [data, showVolume, volumeColor, theme]);

  // Format price display
  const formatPrice = useCallback((price) => {
    if (price === null || price === undefined) return 'N/A';
    return price.toFixed(pricePrecision);
  }, [pricePrecision]);

  const formatVolume = useCallback((volume) => {
    if (volume === null || volume === undefined || volume === 0) return '0';
    if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(volumePrecision)}M`;
    } else if (volume >= 1000) {
      return `${(volume / 1000).toFixed(volumePrecision)}K`;
    }
    return volume.toFixed(volumePrecision);
  }, [volumePrecision]);

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
        <Alert severity="error" icon={<Info />}>
          {error}
        </Alert>
        <Typography variant="body2" color="text.secondary">
          Unable to load candlestick chart for {symbol}
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper variant="outlined" className={`tradingview-candlestick-chart ${className}`}>
      {/* Header with symbol and price info */}
      <Box
        sx={{
          p: 2,
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {symbol}
          </Typography>
          {showPriceInfo && priceStats && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {formatPrice(priceStats.current)}
              </Typography>
              <Chip
                icon={priceStats.change >= 0 ? <TrendingUp /> : <TrendingDown />}
                label={`${priceStats.change >= 0 ? '+' : ''}${formatPrice(priceStats.change)} (${priceStats.changePercent >= 0 ? '+' : ''}${priceStats.changePercent.toFixed(2)}%)`}
                color={priceStats.change >= 0 ? 'success' : 'error'}
                size="small"
                variant="outlined"
              />
            </Box>
          )}
        </Box>

        {showPriceInfo && priceStats && (
          <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
            <Tooltip title="Open">
              <Typography variant="body2" color="text.secondary">
                O: {formatPrice(priceStats.open)}
              </Typography>
            </Tooltip>
            <Tooltip title="High">
              <Typography variant="body2" color="text.secondary">
                H: {formatPrice(priceStats.high)}
              </Typography>
            </Tooltip>
            <Tooltip title="Low">
              <Typography variant="body2" color="text.secondary">
                L: {formatPrice(priceStats.low)}
              </Typography>
            </Tooltip>
            {priceStats.volume > 0 && (
              <Tooltip title="Volume">
                <Typography variant="body2" color="text.secondary">
                  V: {formatVolume(priceStats.volume)}
                </Typography>
              </Tooltip>
            )}
          </Box>
        )}
      </Box>

      {/* Chart area */}
      <Box sx={{ position: 'relative' }}>
        {loading && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              zIndex: 10,
            }}
          >
            <CircularProgress />
          </Box>
        )}

        <TradingViewChart
          data={data}
          indicators={volumeIndicator ? [volumeIndicator] : []}
          chartType="candlestick"
          symbol={symbol}
          height={height}
          width={width}
          theme={theme}
          loading={false} // Handle loading at this level
          error={null}
          onCrosshairMove={handleCrosshairMove}
        />
      </Box>

      {/* Current price display on hover */}
      {currentPrice && (
        <Box
          sx={{
            position: 'absolute',
            top: 10,
            right: 10,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            p: 1,
            borderRadius: 1,
            fontSize: '0.875rem',
            zIndex: 20,
          }}
        >
          <Typography variant="body2">
            Current: {formatPrice(currentPrice)}
          </Typography>
          {priceChange !== null && (
            <Typography variant="caption" sx={{ color: priceChange >= 0 ? '#4caf50' : '#f44336' }}>
              {priceChange >= 0 ? '+' : ''}{formatPrice(priceChange)} ({priceChangePercent >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%)
            </Typography>
          )}
        </Box>
      )}
    </Paper>
  );
};

export default TradingViewCandlestickChart;