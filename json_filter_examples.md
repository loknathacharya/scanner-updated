# JSON Filter Examples and Usage Guide

## Overview

This document provides comprehensive examples and usage patterns for the JSON-based filtering system. Each example includes the JSON structure, explanation, and expected behavior.

## Basic JSON Filter Structure

```json
{
  "logic": "AND",
  "conditions": [
    {
      "left": {
        "type": "column",
        "name": "close",
        "timeframe": "daily",
        "offset": 0
      },
      "operator": ">",
      "right": {
        "type": "column",
        "name": "close",
        "timeframe": "daily",
        "offset": -1
      }
    }
  ]
}
```

## Example 1: Simple Price Comparison

### JSON Filter
```json
{
  "logic": "AND",
  "conditions": [
    {
      "left": {
        "type": "column",
        "name": "close",
        "timeframe": "daily",
        "offset": 0
      },
      "operator": ">",
      "right": {
        "type": "constant",
        "value": 100.0
      }
    }
  ]
}
```

### Explanation
- **Logic**: AND (only one condition, so logic doesn't matter)
- **Condition**: Today's closing price > $100
- **Left Operand**: Current day's close price
- **Right Operand**: Fixed value of $100
- **Operator**: Greater than

### Expected Behavior
Returns all rows where the closing price is greater than $100.

## Example 2: Price Movement Detection

### JSON Filter
```json
{
  "logic": "AND",
  "conditions": [
    {
      "left": {
        "type": "column",
        "name": "close",
        "timeframe": "daily",
        "offset": 0
      },
      "operator": ">",
      "right": {
        "type": "column",
        "name": "close",
        "timeframe": "daily",
        "offset": -1
      }
    },
    {
      "left": {
        "type": "column",
        "name": "volume",
        "timeframe": "daily",
        "offset": 0
      },
      "operator": ">",
      "right": {
        "type": "constant",
        "value": 1000000
      }
    }
  ]
}
```

### Explanation
- **Logic**: AND (both conditions must be true)
- **Condition 1**: Today's closing price > yesterday's closing price (price increase)
- **Condition 2**: Today's volume > 1,000,000 (high volume)
- **Expected**: Stocks with price increase and high volume

### Expected Behavior
Returns all rows where the stock price increased from the previous day and trading volume exceeded 1 million shares.

## Example 3: Moving Average Crossover

### JSON Filter
```json
{
  "logic": "AND",
  "conditions": [
    {
      "left": {
        "type": "indicator",
        "name": "sma",
        "params": [50],
        "column": "close",
        "timeframe": "daily",
        "offset": 0
      },
      "operator": ">",
      "right": {
        "type": "indicator",
        "name": "sma",
        "params": [200],
        "column": "close",
        "timeframe": "daily",
        "offset": 0
      }
    }
  ]
}
```

### Explanation
- **Logic**: AND (only one condition)
- **Condition**: 50-day SMA > 200-day SMA (golden cross)
- **Left Operand**: 50-day simple moving average of close prices
- **Right Operand**: 200-day simple moving average of close prices
- **Operator**: Greater than

### Expected Behavior
Returns all rows where the 50-day moving average is above the 200-day moving average, indicating a bullish trend.

## Example 4: RSI Overbought/Oversold

### JSON Filter - Overbought
```json
{
  "logic": "AND",
  "conditions": [
    {
      "left": {
        "type": "indicator",
        "name": "rsi",
        "params": [14],
        "column": "close",
        "timeframe": "daily",
        "offset": 0
      },
      "operator": ">",
      "right": {
        "type": "constant",
        "value": 70.0
      }
    }
  ]
}
```

### JSON Filter - Oversold
```json
{
  "logic": "AND",
  "conditions": [
    {
      "left": {
        "type": "indicator",
        "name": "rsi",
        "params": [14],
        "column": "close",
        "timeframe": "daily",
        "offset": 0
      },
      "operator": "<",
      "right": {
        "type": "constant",
        "value": 30.0
      }
    }
  ]
}
```

### Explanation
- **Overbought**: RSI > 70 (indicates overbought condition)
- **Oversold**: RSI < 30 (indicates oversold condition)
- **Indicator**: 14-period Relative Strength Index
- **Expected**: Stocks in extreme conditions

### Expected Behavior
- **Overbought**: Returns stocks that may be due for a price correction
- **Oversold**: Returns stocks that may be due for a price bounce

## Example 5: Complex Multi-Condition Filter

### JSON Filter
```json
{
  "logic": "AND",
  "conditions": [
    {
      "left": {
        "type": "column",
        "name": "close",
        "timeframe": "daily",
        "offset": 0
      },
      "operator": ">",
      "right": {
        "type": "indicator",
        "name": "sma",
        "params": [20],
        "column": "close",
        "timeframe": "daily",
        "offset": 0
      }
    },
    {
      "left": {
        "type": "indicator",
        "name": "rsi",
        "params": [14],
        "column": "close",
        "timeframe": "daily",
        "offset": 0
      },
      "operator": ">",
      "right": {
        "type": "constant",
        "value": 50.0
      }
    },
    {
      "left": {
        "type": "column",
        "name": "volume",
        "timeframe": "daily",
        "offset": 0
      },
      "operator": ">",
      "right": {
        "type": "indicator",
        "name": "sma",
        "params": [20],
        "column": "volume",
        "timeframe": "daily",
        "offset": 0
      }
    }
  ]
}
```

### Explanation
- **Logic**: AND (all conditions must be true)
- **Condition 1**: Price > 20-day SMA (above moving average)
- **Condition 2**: RSI > 50 (bullish momentum)
- **Condition 3**: Volume > 20-day volume average (increased volume)
- **Expected**: Strong bullish signals with confirmation

### Expected Behavior
Returns stocks that are trading above their 20-day moving average, have bullish RSI momentum, and show increased trading volume.

## Example 6: OR Logic with Multiple Conditions

### JSON Filter
```json
{
  "logic": "OR",
  "conditions": [
    {
      "left": {
        "type": "indicator",
        "name": "rsi",
        "params": [14],
        "column": "close",
        "timeframe": "daily",
        "offset": 0
      },
      "operator": "<",
      "right": {
        "type": "constant",
        "value": 30.0
      }
    },
    {
      "left": {
        "type": "column",
        "name": "close",
        "timeframe": "daily",
        "offset": 0
      },
      "operator": "<",
      "right": {
        "type": "indicator",
        "name": "sma",
        "params": [50],
        "column": "close",
        "timeframe": "daily",
        "offset": 0
      }
    }
  ]
}
```

### Explanation
- **Logic**: OR (either condition can be true)
- **Condition 1**: RSI < 30 (oversold condition)
- **Condition 2**: Price < 50-day SMA (below moving average)
- **Expected**: Stocks that are either oversold or below their moving average

### Expected Behavior
Returns stocks that are either in oversold territory or trading below their 50-day moving average.

## Example 7: Offset-Based Comparisons

### JSON Filter
```json
{
  "logic": "AND",
  "conditions": [
    {
      "left": {
        "type": "column",
        "name": "close",
        "timeframe": "daily",
        "offset": 0
      },
      "operator": ">",
      "right": {
        "type": "column",
        "name": "close",
        "timeframe": "daily",
        "offset": -5
      }
    },
    {
      "left": {
        "type": "column",
        "name": "close",
        "timeframe": "daily",
        "offset": 0
      },
      "operator": ">",
      "right": {
        "type": "column",
        "name": "high",
        "timeframe": "daily",
        "offset": -20
      }
    }
  ]
}
```

### Explanation
- **Logic**: AND (both conditions must be true)
- **Condition 1**: Current close > close from 5 days ago (5-day gain)
- **Condition 2**: Current close > high from 20 days ago (above 20-day high)
- **Expected**: Stocks making new highs after recent gains

### Expected Behavior
Returns stocks that are trading above their 20-day high after gaining over the past 5 days.

## Example 8: Volume Breakout Detection

### JSON Filter
```json
{
  "logic": "AND",
  "conditions": [
    {
      "left": {
        "type": "column",
        "name": "volume",
        "timeframe": "daily",
        "offset": 0
      },
      "operator": ">",
      "right": {
        "type": "indicator",
        "name": "sma",
        "params": [50],
        "column": "volume",
        "timeframe": "daily",
        "offset": 0
      }
    },
    {
      "left": {
        "type": "column",
        "name": "close",
        "timeframe": "daily",
        "offset": 0
      },
      "operator": ">",
      "right": {
        "type": "indicator",
        "name": "sma",
        "params": [20],
        "column": "close",
        "timeframe": "daily",
        "offset": 0
      }
    }
  ]
}
```

### Explanation
- **Logic**: AND (both conditions must be true)
- **Condition 1**: Current volume > 50-day volume average (volume breakout)
- **Condition 2**: Current price > 20-day price SMA (price above moving average)
- **Expected**: Volume breakouts with price confirmation

### Expected Behavior
Returns stocks experiencing volume breakouts while trading above their 20-day moving average.

## Example 9: MACD Signal Crossover

### JSON Filter
```json
{
  "logic": "AND",
  "conditions": [
    {
      "left": {
        "type": "indicator",
        "name": "macd",
        "params": [12, 26, 9],
        "column": "close",
        "timeframe": "daily",
        "offset": 0
      },
      "operator": ">",
      "right": {
        "type": "indicator",
        "name": "macd_signal",
        "params": [12, 26, 9],
        "column": "close",
        "timeframe": "daily",
        "offset": 0
      }
    },
    {
      "left": {
        "type": "indicator",
        "name": "macd_histogram",
        "params": [12, 26, 9],
        "column": "close",
        "timeframe": "daily",
        "offset": 0
      },
      "operator": ">",
      "right": {
        "type": "constant",
        "value": 0.0
      }
    }
  ]
}
```

### Explanation
- **Logic**: AND (both conditions must be true)
- **Condition 1**: MACD line > MACD signal line (bullish crossover)
- **Condition 2**: MACD histogram > 0 (confirming signal)
- **Expected**: MACD bullish crossover signals

### Expected Behavior
Returns stocks where the MACD line has crossed above the signal line, indicating a potential bullish trend change.

## Example 10: Bollinger Band Breakout

### JSON Filter
```json
{
  "logic": "AND",
  "conditions": [
    {
      "left": {
        "type": "column",
        "name": "close",
        "timeframe": "daily",
        "offset": 0
      },
      "operator": ">",
      "right": {
        "type": "indicator",
        "name": "bb_upper",
        "params": [20, 2],
        "column": "close",
        "timeframe": "daily",
        "offset": 0
      }
    },
    {
      "left": {
        "type": "column",
        "name": "volume",
        "timeframe": "daily",
        "offset": 0
      },
      "operator": ">",
      "right": {
        "type": "indicator",
        "name": "sma",
        "params": [20],
        "column": "volume",
        "timeframe": "daily",
        "offset": 0
      }
    }
  ]
}
```

### Explanation
- **Logic**: AND (both conditions must be true)
- **Condition 1**: Price > Upper Bollinger Band (breakout above upper band)
- **Condition 2**: Volume > 20-day volume average (confirmation volume)
- **Expected**: Bollinger Band breakouts with volume confirmation

### Expected Behavior
Returns stocks that have broken above their upper Bollinger Band with increased trading volume.

## Common Patterns and Best Practices

### 1. Trend Following Patterns
```json
{
  "logic": "AND",
  "conditions": [
    {
      "left": {"type": "column", "name": "close", "timeframe": "daily", "offset": 0},
      "operator": ">",
      "right": {"type": "indicator", "name": "sma", "params": [50], "column": "close", "timeframe": "daily", "offset": 0}
    },
    {
      "left": {"type": "indicator", "name": "sma", "params": [50], "column": "close", "timeframe": "daily", "offset": 0},
      "operator": ">",
      "right": {"type": "indicator", "name": "sma", "params": [200], "column": "close", "timeframe": "daily", "offset": 0}
    }
  ]
}
```

### 2. Mean Reversion Patterns
```json
{
  "logic": "AND",
  "conditions": [
    {
      "left": {"type": "indicator", "name": "rsi", "params": [14], "column": "close", "timeframe": "daily", "offset": 0},
      "operator": "<",
      "right": {"type": "constant", "value": 30.0}
    },
    {
      "left": {"type": "column", "name": "close", "timeframe": "daily", "offset": 0},
      "operator": "<",
      "right": {"type": "indicator", "name": "sma", "params": [50], "column": "close", "timeframe": "daily", "offset": 0}
    }
  ]
}
```

### 3. Momentum Patterns
```json
{
  "logic": "AND",
  "conditions": [
    {
      "left": {"type": "column", "name": "close", "timeframe": "daily", "offset": 0},
      "operator": ">",
      "right": {"type": "column", "name": "close", "timeframe": "daily", "offset": -5}
    },
    {
      "left": {"type": "column", "name": "volume", "timeframe": "daily", "offset": 0},
      "operator": ">",
      "right": {"type": "indicator", "name": "sma", "params": [20], "column": "volume", "timeframe": "daily", "offset": 0}
    }
  ]
}
```

## Troubleshooting Common Issues

### 1. JSON Syntax Errors
- **Problem**: Malformed JSON syntax
- **Solution**: Use a JSON validator to check syntax
- **Example Tool**: JSONLint (https://jsonlint.com/)

### 2. Missing Indicators
- **Problem**: Indicator not available in data
- **Solution**: Ensure indicators are calculated before filtering
- **Fix**: Add technical indicators to your data processing pipeline

### 3. Invalid Column Names
- **Problem**: Column name doesn't exist in data
- **Solution**: Check available columns in your dataset
- **Fix**: Use `data.columns.tolist()` to see available columns

### 4. Offset Issues
- **Problem**: Offset beyond data range
- **Solution**: Use smaller offset values or check data availability
- **Fix**: Validate offset against data length

### 5. Performance Issues
- **Problem**: Slow filter execution with large datasets
- **Solution**: Use appropriate caching and optimize queries
- **Fix**: Consider filtering on smaller date ranges first

## Advanced Tips

### 1. Combining Multiple Timeframes
```json
{
  "logic": "AND",
  "conditions": [
    {
      "left": {"type": "column", "name": "close", "timeframe": "daily", "offset": 0},
      "operator": ">",
      "right": {"type": "indicator", "name": "sma", "params": [50], "column": "close", "timeframe": "weekly", "offset": 0}
    }
  ]
}
```

### 2. Complex Logic Combinations
```json
{
  "logic": "OR",
  "conditions": [
    {
      "logic": "AND",
      "conditions": [
        {"left": {"type": "column", "name": "close", "timeframe": "daily", "offset": 0}, "operator": ">", "right": {"type": "constant", "value": 100}},
        {"left": {"type": "indicator", "name": "rsi", "params": [14], "column": "close", "timeframe": "daily", "offset": 0}, "operator": ">", "right": {"type": "constant", "value": 50}}
      ]
    },
    {
      "logic": "AND",
      "conditions": [
        {"left": {"type": "column", "name": "close", "timeframe": "daily", "offset": 0}, "operator": "<", "right": {"type": "constant", "value": 50}},
        {"left": {"type": "indicator", "name": "rsi", "params": [14], "column": "close", "timeframe": "daily", "offset": 0}, "operator": "<", "right": {"type": "constant", "value": 50}}
      ]
    }
  ]
}
```

### 3. Parameter Optimization
- Experiment with different indicator periods
- Test various offset values for different strategies
- Combine multiple timeframes for robust signals

These examples provide a comprehensive starting point for using the JSON-based filtering system. Each example can be modified and combined to create sophisticated trading strategies and analysis patterns.