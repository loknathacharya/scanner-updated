# JSON-Based Filtering System: Quick Start Guide

## Welcome!

This guide will help you quickly get started with the powerful JSON-based filtering system for the stock scanner application. You'll learn how to define, apply, and interpret your first JSON filters.

## 🚀 1. Understanding the Core Concept

The JSON-based filtering system allows you to define complex stock screening criteria using a structured JSON format. Instead of building filters through a UI with many clicks, you write a JSON object that describes your conditions.

**Key elements of a JSON filter:**
-   **`logic`**: Defines how multiple conditions are combined ("AND" or "OR").
-   **`conditions`**: An array of individual filter conditions.
-   **`left` / `right` operands**: The values being compared (can be a column, an indicator, or a constant).
-   **`operator`**: The comparison operator (e.g., `>`, `<`, `==`).

## 📝 2. Your First JSON Filter: Basic Price Comparison

Let's create a simple filter to find stocks where the current closing price is greater than $100.

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

**Explanation:**
-   `"logic": "AND"`: Since there's only one condition, "AND" or "OR" doesn't make a difference.
-   `"left"`: Specifies the current day's closing price (`"type": "column"`, `"name": "close"`, `"offset": 0`).
-   `"operator": ">"`: We want prices greater than.
-   `"right"`: Specifies a fixed value of 100 (`"type": "constant"`, `"value": 100.0`).

## 🛠️ 3. Applying Your JSON Filter in the App

1.  **Upload Data**: Ensure you have uploaded and processed your stock data in the "Upload Data" tab of the main application.
2.  **Navigate to "Build Filters"**: Go to the "Build Filters" tab.
3.  **Select "JSON Filter"**: Choose the "JSON Filter" option from the filter type radio buttons.
4.  **Paste Your JSON**: Copy the JSON filter from step 2 and paste it into the "Enter JSON Filter" text area.
5.  **Validate & Parse**: Click the "🔍 Validate & Parse JSON" button. The app will provide real-time feedback on your JSON structure.
6.  **Apply Filter**: Once your JSON is valid, click the "🔍 Apply JSON Filter" button.

## 📊 4. Viewing the Results

After applying the filter, navigate to the "📋 Results" tab. You will see:
-   A summary of matching records.
-   An interactive table displaying the filtered stocks.
-   Options to select columns, sort, and paginate results.
-   A quick chart for individual stock analysis.

## 📈 5. Advanced Filter: Moving Average Crossover

Let's try a more advanced filter to find a "Golden Cross" pattern, where the 50-day Simple Moving Average (SMA) crosses above the 200-day SMA.

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

**Explanation:**
-   Both `left` and `right` operands are now of `"type": "indicator"`.
-   `"name": "sma"` specifies the Simple Moving Average indicator.
-   `"params": [50]` and `"params": [200]` define the periods for the SMAs.
-   `"column": "close"` indicates that the SMA is calculated on the closing prices.

Apply this filter in the app just like the basic example.

## 💡 Next Steps & Further Reading

Congratulations! You've successfully used the JSON-based filtering system. To explore more capabilities and troubleshoot issues, refer to these documents:

-   **[JSON Filter Examples and Usage Guide](json_filter_examples.md)**: More detailed examples for various filter types.
-   **[JSON-Based Filtering System Specification](json_filter_specification.md)**: In-depth documentation of the JSON schema and structure.
-   **[JSON-Based Filtering System API Reference](json_filter_api_reference.md)**: Technical details of the system's classes and methods.
-   **[JSON-Based Filtering System Error Handling Guide](json_filter_error_handling_guide.md)**: Comprehensive guide on error types and solutions.
-   **[JSON-Based Filtering System Performance Optimization Guide](json_filter_performance_guide.md)**: Tips for improving filter performance.
-   **[JSON Filter Troubleshooting Guide](json_filter_troubleshooting_guide_complete.md)**: Solutions for common problems.

Happy filtering!