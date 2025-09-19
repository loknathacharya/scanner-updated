# JSON-Based Filtering System: Best Practices and Design Patterns

## Overview

This document outlines best practices and common design patterns for effectively using and extending the JSON-Based Filtering System. Adhering to these guidelines will help you create robust, efficient, readable, and maintainable filter configurations.

## 1. General Design Principles for JSON Filters

### 1.1 Clarity and Readability
-   **Use meaningful names**: For columns and indicators, ensure names are clear and descriptive.
-   **Indent JSON properly**: Always use consistent indentation (e.g., 2 or 4 spaces) for readability.
-   **Add comments (where supported)**: While standard JSON doesn't support comments, if your parsing layer allows (e.g., by stripping them before parsing), use them to explain complex logic. Otherwise, rely on external documentation.
-   **Keep conditions focused**: Each condition should ideally represent a single, clear comparison.

### 1.2 Modularity and Reusability
-   **Break down complex logic**: For very complex filters, consider if they can be broken into smaller, reusable sub-filters or components.
-   **Parameterize where possible**: If you have similar filters with only slight variations (e.g., different thresholds or periods), design them to accept parameters if your system supports it.

### 1.3 Performance Considerations
-   **Prioritize simple conditions**: Place simpler, faster-to-evaluate conditions (e.g., constant comparisons) earlier in an `AND` logic chain, as they can quickly narrow down the dataset.
-   **Avoid redundant calculations**: Ensure your underlying system caches indicator calculations to prevent re-computing the same indicator multiple times within a single filter.
-   **Filter by date range first**: If applicable, apply date range filters before complex JSON filters to reduce the dataset size.

### 1.4 Error Prevention
-   **Validate JSON rigorously**: Always validate your JSON against the schema before attempting to apply the filter.
-   **Test thoroughly**: Use unit and integration tests for your JSON filters, especially for complex scenarios.
-   **Use example templates**: Leverage provided examples as a starting point to ensure correct structure.

## 2. Best Practices for Writing Efficient and Readable Filters

### 2.1 Naming Conventions
-   **Columns**: Use standard column names (e.g., `close`, `volume`, `date`).
-   **Indicators**: Use consistent naming for indicators (e.g., `sma`, `ema`, `rsi`).
-   **Timeframes**: Stick to defined timeframes (e.g., `daily`, `weekly`, `intraday`).

### 2.2 Operator Usage
-   **Choose the right operator**: Select the most appropriate comparison operator (`>`, `<`, `>=`, `<=`, `==`, `!=`).
-   **Avoid float equality (`==`)**: Direct equality comparisons with floating-point numbers can be unreliable due to precision issues. If you need to check if two floats are "equal," consider checking if their absolute difference is within a small tolerance.

### 2.3 Operand Configuration
-   **Column Operand**:
    ```json
    {
      "type": "column",
      "name": "close",
      "timeframe": "daily",
      "offset": -1
    }
    ```
    -   Always specify `name`.
    -   `timeframe` and `offset` are optional but recommended for clarity. `offset: 0` is current, `-1` is previous.
-   **Indicator Operand**:
    ```json
    {
      "type": "indicator",
      "name": "sma",
      "params": [50],
      "column": "close",
      "timeframe": "daily",
      "offset": 0
    }
    ```
    -   Always specify `name` and `column`.
    -   `params` should be an array matching the indicator's requirements.
    -   `timeframe` and `offset` apply to the *result* of the indicator calculation.
-   **Constant Operand**:
    ```json
    {
      "type": "constant",
      "value": 100.0
    }
    ```
    -   Always specify `value` as a number.

## 3. Common Filter Patterns

### 3.1 Basic Price Movement
-   **Price increase today**: `close > close_1d` (using offset)
    ```json
    {
      "logic": "AND",
      "conditions": [
        {
          "left": {"type": "column", "name": "close", "offset": 0},
          "operator": ">",
          "right": {"type": "column", "name": "close", "offset": -1}
        }
      ]
    }
    ```

### 3.2 Indicator Crossovers
-   **Golden Cross (SMA 50 > SMA 200)**:
    ```json
    {
      "logic": "AND",
      "conditions": [
        {
          "left": {"type": "indicator", "name": "sma", "params": [50], "column": "close", "offset": 0},
          "operator": ">",
          "right": {"type": "indicator", "name": "sma", "params": [200], "column": "close", "offset": 0}
        }
      ]
    }
    ```
-   **RSI Overbought/Oversold**:
    ```json
    {
      "logic": "AND",
      "conditions": [
        {
          "left": {"type": "indicator", "name": "rsi", "params": [14], "column": "close", "offset": 0},
          "operator": ">",
          "right": {"type": "constant", "value": 70.0}
        }
      ]
    }
    ```

### 3.3 Complex Logic (AND/OR Combinations)
-   **Bullish Momentum with Volume Confirmation**:
    ```json
    {
      "logic": "AND",
      "conditions": [
        {
          "left": {"type": "column", "name": "close", "offset": 0},
          "operator": ">",
          "right": {"type": "indicator", "name": "sma", "params": [20], "column": "close", "offset": 0}
        },
        {
          "left": {"type": "indicator", "name": "rsi", "params": [14], "column": "close", "offset": 0},
          "operator": ">",
          "right": {"type": "constant", "value": 50.0}
        },
        {
          "left": {"type": "column", "name": "volume", "offset": 0},
          "operator": ">",
          "right": {"type": "indicator", "name": "sma", "params": [20], "column": "volume", "offset": 0}
        }
      ]
    }
    ```
-   **Either Oversold or Below Moving Average**:
    ```json
    {
      "logic": "OR",
      "conditions": [
        {
          "left": {"type": "indicator", "name": "rsi", "params": [14], "column": "close", "offset": 0},
          "operator": "<",
          "right": {"type": "constant", "value": 30.0}
        },
        {
          "left": {"type": "column", "name": "close", "offset": 0},
          "operator": "<",
          "right": {"type": "indicator", "name": "sma", "params": [50], "column": "close", "offset": 0}
        }
      ]
    }
    ```

### 3.4 Multi-Timeframe Analysis
-   **Daily Close above Weekly SMA(20)**:
    ```json
    {
      "logic": "AND",
      "conditions": [
        {
          "left": {"type": "column", "name": "close", "timeframe": "daily", "offset": 0},
          "operator": ">",
          "right": {"type": "indicator", "name": "sma", "params": [20], "column": "close", "timeframe": "weekly", "offset": 0}
        }
      ]
    }
    ```

## 4. Maintainability and Extensibility

### 4.1 Versioning Filters
-   **Store filters externally**: Save your JSON filter configurations in separate files or a database.
-   **Implement version control**: Treat filter JSON files like code and manage them with version control (e.g., Git).

### 4.2 Extending Indicators
-   **Add new indicators**: Follow the `indicators_module.py` pattern to add new technical indicators. Ensure they return a `pd.Series` for compatibility.
-   **Update schema**: If new indicator parameters or types are introduced, update the JSON schema in `json_filter_parser.py` accordingly.

### 4.3 Custom Operand Types
-   If you need to introduce new operand types (e.g., "fundamental", "news_sentiment"), extend `json_filter_parser.py` and `operand_calculator.py` to handle them.
-   Update the JSON schema to include the new operand type definition.

### 4.4 UI Integration
-   **Use UI components**: Leverage `json_filter_ui.py` for rendering the JSON editor and validation feedback.
-   **Provide examples**: Keep the example filters in `json_filter_ui.py` updated and comprehensive.

## Conclusion

By following these best practices and utilizing the described design patterns, you can effectively harness the power of the JSON-Based Filtering System. This approach promotes clarity, efficiency, and maintainability, allowing you to build sophisticated stock screening strategies with confidence.