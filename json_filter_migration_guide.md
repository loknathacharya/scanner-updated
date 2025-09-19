# JSON-Based Filtering System: Migration Guide

## Overview

This guide provides a comprehensive walkthrough for migrating from the old string-based filter system to the new, powerful JSON-based filtering system. It highlights the benefits of the new system, offers step-by-step conversion instructions, and provides examples to ensure a smooth transition.

## 1. Understanding the Old Filter System

The previous filter system relied on simple string expressions, often resembling SQL-like syntax, to define conditions.

**Example of an old string-based filter:**
```
close > sma_20 AND volume > volume_sma_50 * 1.5
```

**Limitations of the old system:**
-   **Limited expressiveness**: Difficult to represent complex nested logic (e.g., `(A AND B) OR C`).
-   **Hardcoded indicators**: Required indicators to be pre-calculated and named in a specific format (e.g., `sma_20`).
-   **No explicit offset/timeframe**: Offset and timeframe handling were implicit or required manual data manipulation.
-   **Poor validation**: Limited ability to validate filter syntax and semantics before execution.
-   **Scalability issues**: Harder to extend with new operand types or complex data sources.

## 2. Benefits of Migrating to the New JSON System

The new JSON-based filtering system offers significant advantages:

-   **Structured and explicit**: Clear, human-readable JSON format explicitly defines logic, operands, operators, timeframes, and offsets.
-   **Enhanced flexibility**: Supports complex nested `AND`/`OR` logic, allowing for highly sophisticated screening criteria.
-   **Dynamic indicator handling**: Indicators are defined within the JSON, allowing for dynamic parameterization and calculation on demand.
-   **Robust validation**: Comprehensive JSON schema validation prevents malformed filters and provides detailed error feedback.
-   **Improved maintainability**: Easier to manage, version, and extend filters as the system evolves.
-   **Better integration**: Designed for seamless integration with modern data processing pipelines and UI frameworks.

## 3. Step-by-Step Migration Process

Migrating your existing filters involves converting them from the old string-based format to the new JSON structure.

### Step 3.1: Identify Old Filters
Gather all your existing string-based filter configurations. These might be stored in files, databases, or directly in your application code.

### Step 3.2: Understand the JSON Schema
Familiarize yourself with the new JSON filter schema. Refer to the **[JSON-Based Filtering System Specification](json_filter_specification.md)** for a complete breakdown.

**Key JSON structure:**
```json
{
  "logic": "AND" | "OR",
  "conditions": [
    {
      "left": { /* operand definition */ },
      "operator": ">" | "<" | ">=" | "<=" | "==" | "!=",
      "right": { /* operand definition */ }
    }
  ]
}
```

**Operand Types:**
-   **`column`**: References a raw data column (e.g., `close`, `volume`).
    ```json
    {"type": "column", "name": "close", "timeframe": "daily", "offset": 0}
    ```
-   **`indicator`**: References a technical indicator (e.g., `sma`, `rsi`).
    ```json
    {"type": "indicator", "name": "sma", "params": [20], "column": "close", "timeframe": "daily", "offset": 0}
    ```
-   **`constant`**: A fixed numeric value.
    ```json
    {"type": "constant", "value": 100.0}
    ```

### Step 3.3: Convert Each Condition

For each condition in your old string filter, translate it into a JSON condition object.

**Example: `close > 100`**

**Old:** `close > 100`

**New (JSON):**
```json
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
```

**Example: `sma_50 > sma_200`**

**Old:** `sma_50 > sma_200`

**New (JSON):**
```json
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
```

### Step 3.4: Combine Conditions with Logic Operators

Wrap your converted conditions in a `conditions` array and specify the overall `logic` ("AND" or "OR").

**Example: `close > 100 AND volume > 1000000`**

**Old:** `close > 100 AND volume > 1000000`

**New (JSON):**
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
        "value": 1000000.0
      }
    }
  ]
}
```

### Step 3.5: Test Your Migrated Filters

After converting, thoroughly test each JSON filter using the application's "JSON Filter" tab. Compare the results with the old system to ensure accuracy.

## 4. Common Migration Scenarios and Examples

This section provides a mapping of common old filter patterns to their new JSON equivalents.

### Scenario 4.1: Simple Column Comparison

**Old Filter:** `close > open`

**New JSON Filter:**
```json
{
  "logic": "AND",
  "conditions": [
    {
      "left": {"type": "column", "name": "close", "timeframe": "daily", "offset": 0},
      "operator": ">",
      "right": {"type": "column", "name": "open", "timeframe": "daily", "offset": 0}
    }
  ]
}
```

### Scenario 4.2: Indicator Threshold

**Old Filter:** `rsi < 30`

**New JSON Filter:**
```json
{
  "logic": "AND",
  "conditions": [
    {
      "left": {"type": "indicator", "name": "rsi", "params": [14], "column": "close", "timeframe": "daily", "offset": 0},
      "operator": "<",
      "right": {"type": "constant", "value": 30.0}
    }
  ]
}
```

### Scenario 4.3: Price Change Over Time

**Old Filter:** `close > close_5d` (assuming `close_5d` was a pre-calculated column)

**New JSON Filter:**
```json
{
  "logic": "AND",
  "conditions": [
    {
      "left": {"type": "column", "name": "close", "timeframe": "daily", "offset": 0},
      "operator": ">",
      "right": {"type": "column", "name": "close", "timeframe": "daily", "offset": -5}
    }
  ]
}
```

### Scenario 4.4: Complex AND/OR Logic

**Old Filter:** `(close > sma_20 AND volume > volume_sma_20) OR rsi < 30` (this was difficult to express directly in the old system)

**New JSON Filter:**
```json
{
  "logic": "OR",
  "conditions": [
    {
      "logic": "AND",
      "conditions": [
        {
          "left": {"type": "column", "name": "close", "timeframe": "daily", "offset": 0},
          "operator": ">",
          "right": {"type": "indicator", "name": "sma", "params": [20], "column": "close", "timeframe": "daily", "offset": 0}
        },
        {
          "left": {"type": "column", "name": "volume", "timeframe": "daily", "offset": 0},
          "operator": ">",
          "right": {"type": "indicator", "name": "sma", "params": [20], "column": "volume", "timeframe": "daily", "offset": 0}
        }
      ]
    },
    {
      "left": {"type": "indicator", "name": "rsi", "params": [14], "column": "close", "timeframe": "daily", "offset": 0},
      "operator": "<",
      "right": {"type": "constant", "value": 30.0}
    }
  ]
}
```
*Note: The new JSON system supports nested logic by allowing a `conditions` array to contain another object with `logic` and `conditions` keys, effectively creating sub-expressions.*

## 5. Tips for a Smooth Migration

-   **Start small**: Begin by migrating your simplest and most frequently used filters.
-   **Use the UI's example filters**: The "JSON Filter" tab in the application provides example JSON filters that you can use as templates.
-   **Leverage validation feedback**: Pay close attention to the validation messages in the UI; they will guide you in correcting your JSON.
-   **Consult documentation**: Refer to the **[JSON-Based Filtering System Specification](json_filter_specification.md)** and **[JSON Filter Examples and Usage Guide](json_filter_examples.md)** frequently.
-   **Backup old filters**: Always keep a backup of your old filter configurations until you are confident in the new system.
-   **Iterate and refine**: Migration is an iterative process. Don't expect perfect JSON on the first try.

## Conclusion

The migration to the JSON-based filtering system is an investment that will significantly enhance your stock scanning capabilities. By following this guide, you can confidently transition your existing filters and unlock the full potential of advanced, flexible, and robust filtering.