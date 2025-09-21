import React, { useState, useEffect } from 'react';
import Ajv from 'ajv';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Tab,
  Tabs,
  TextField,
  Typography
} from '@mui/material';
import {
  Add as AddIcon,
  Code as CodeIcon,
  Dashboard as DashboardIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  PlayArrow as PlayIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import axios from 'axios';

const FilterBuilder = ({ processedData, savedFilters, onFilterResults, apiBase, onSaveFilter }) => {
  const ajv = new Ajv({ allErrors: true, verbose: true });

  const jsonSchema = {
    type: "object",
    properties: {
      logic: {
        type: "string",
        enum: ["AND", "OR"]
      },
      conditions: {
        type: "array",
        minItems: 1,
        maxItems: 50,
        items: {
          type: "object",
          properties: {
            left: { $ref: "#/definitions/operand" },
            operator: {
              type: "string",
              enum: [">", "<", ">=", "<=", "==", "!="]
            },
            right: { $ref: "#/definitions/operand" }
          },
          required: ["left", "operator", "right"],
          additionalProperties: false
        }
      }
    },
    required: ["logic", "conditions"],
    additionalProperties: false,
    definitions: {
      operand: {
        type: "object",
        oneOf: [
          {
            properties: {
              type: { const: "column" },
              name: { type: "string" },
              timeframe: { type: "string", enum: ["daily", "weekly", "intraday"] },
              offset: { type: "integer" }
            },
            required: ["type", "name"]
          },
          {
            properties: {
              type: { const: "indicator" },
              name: { type: "string" },
              params: { type: "array", items: { type: "number" } },
              column: { type: "string" },
              timeframe: { type: "string", enum: ["daily", "weekly", "intraday"] },
              offset: { type: "integer" }
            },
            required: ["type", "name", "column"]
          },
          {
            properties: {
              type: { const: "constant" },
              value: { type: "number" }
            },
            required: ["type", "value"]
          }
        ]
      }
    }
  };

  const jsonExamples = {
    "Price > $100": `{
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
}`,
    "Golden Cross (SMA50 > SMA200)": `{
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
}`,
    "RSI Oversold (<30)": `{
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
}`,
    "Volume Breakout": `{
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
        "params": [20],
        "column": "volume",
        "timeframe": "daily",
        "offset": 0
      }
    }
  ]
}`,
    "MACD Bullish": `{
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
    }
  ]
}`
  };
  const [activeTab, setActiveTab] = useState(0);
  const [validationError, setValidationError] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [selectedExample, setSelectedExample] = useState('');
  const [customConditions, setCustomConditions] = useState([]);
  const [jsonFilter, setJsonFilter] = useState('');
  const [jsonError, setJsonError] = useState('');
  const [filterName, setFilterName] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const templates = {
    "Price Above SMA(20)": "close > sma_20",
    "High Volume (2x Average)": "volume > volume_sma_20 * 2",
    "RSI Overbought": "rsi > 70",
    "RSI Oversold": "rsi < 30",
    "MACD Bullish": "macd > macd_signal",
    "Bollinger Upper Break": "close > bb_upper",
    "Bollinger Lower Break": "close < bb_lower",
    "Price Near 52W High": "close > high_52w * 0.95",
    "Volume Breakout": "volume > volume_sma_50 * 1.5 AND close > sma_50"
  };

  useEffect(() => {
    if (processedData && Array.isArray(processedData)) {
      // Set default date range
      const dates = processedData.map(row => row.date).sort();
      if (dates.length > 0) {
        setDateRange({
          start: dates[0],
          end: dates[dates.length - 1]
        });
      }
    }
  }, [processedData]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleTemplateFilter = async (templateName) => {
    const filterString = templates[templateName];
    await applyFilter(filterString);
  };

  const handleAddCustomCondition = () => {
    setCustomConditions([...customConditions, {
      column: 'close',
      operator: '>',
      value: '0',
      valueType: 'value',
      logic: 'AND'
    }]);
  };

  const handleRemoveCondition = (index) => {
    const newConditions = customConditions.filter((_, i) => i !== index);
    setCustomConditions(newConditions);
  };

  const handleConditionChange = (index, field, value) => {
    const newConditions = [...customConditions];
    newConditions[index][field] = value;
    setCustomConditions(newConditions);
  };

  const buildCustomFilter = () => {
    if (customConditions.length === 0) return '';
    
    let filterString = '';
    customConditions.forEach((condition, index) => {
      if (index > 0) {
        filterString += ` ${condition.logic} `;
      }
      
      const rightSide = condition.valueType === 'column' 
        ? condition.value 
        : condition.value;
      
      filterString += `${condition.column} ${condition.operator} ${rightSide}`;
    });
    
    return filterString;
  };

  const handleApplyCustomFilter = async () => {
    const filterString = buildCustomFilter();
    if (filterString) {
      await applyFilter(filterString);
    }
  };

  const handleApplyJsonFilter = async () => {
    if (!isValid || !jsonFilter.trim()) {
      setValidationError('Please fix validation errors before applying');
      return;
    }
    try {
      const jsonData = JSON.parse(jsonFilter);
      await applyFilter(jsonData);
    } catch (error) {
      setValidationError('Invalid JSON format: ' + error.message);
    }
  };

  useEffect(() => {
    if (!jsonFilter.trim()) {
      setValidationError('');
      setIsValid(false);
      return;
    }

    try {
      const jsonData = JSON.parse(jsonFilter);
      const valid = ajv.validate(jsonSchema, jsonData);
      if (valid) {
        setValidationError('');
        setIsValid(true);
      } else {
        const errors = ajv.errors[0];
        let errorMsg = `Schema error: ${errors.message}`;
        if (errors.instancePath) {
          errorMsg += ` at ${errors.instancePath}`;
        }
        if (errors.params) {
          errorMsg += ` (${JSON.stringify(errors.params)})`;
        }
        setValidationError(errorMsg);
        setIsValid(false);
      }
    } catch (parseError) {
      setValidationError(`JSON syntax error: ${parseError.message}`);
      setIsValid(false);
    }
  }, [jsonFilter]);

  const loadExample = (exampleKey) => {
    if (jsonExamples[exampleKey]) {
      setJsonFilter(jsonExamples[exampleKey]);
      setSelectedExample(exampleKey);
    }
  };

  const handleSaveFilter = async () => {
    if (!filterName) {
      alert('Please enter a filter name');
      return;
    }

    let filterDefinition;
    if (activeTab === 0) {
      // Template filter
      const selectedTemplate = Object.keys(templates)[0]; // Get first template
      filterDefinition = templates[selectedTemplate];
    } else if (activeTab === 1) {
      // Custom filter
      filterDefinition = buildCustomFilter();
    } else {
      // JSON filter
      try {
        filterDefinition = JSON.parse(jsonFilter);
      } catch (error) {
        alert('Invalid JSON format');
        return;
      }
    }

    try {
      await axios.post(`${apiBase}/filters/saved`, {
        name: filterName,
        filter: filterDefinition
      });
      alert('Filter saved successfully!');
      setFilterName('');
      onSaveFilter();
    } catch (error) {
      alert('Error saving filter: ' + error.message);
    }
  };

  const applyFilter = async (filter) => {
    try {
      const response = await axios.post(`${apiBase}/filters/apply`, {
        filter: filter,
        date_range: dateRange.start && dateRange.end ? [dateRange.start, dateRange.end] : null
      });
      
      onFilterResults(response.data.results);
    } catch (error) {
      alert('Error applying filter: ' + error.message);
    }
  };

  const TabPanel = ({ children, value, index }) => {
    return (
      <div hidden={value !== index}>
        {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
      </div>
    );
  };

  if (!processedData) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          Please upload data first in the Upload Data tab.
        </Alert>
      </Box>
    );
  }

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen">
      <div className="mx-auto max-w-7xl py-10 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Filter Builder</h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">Create and apply custom filters to your financial data.</p>
        </div>

        <div className="space-y-12">
          <div className="space-y-6 rounded-lg border border-gray-200/50 dark:border-gray-700/50 bg-white/20 dark:bg-black/20 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Filter Configuration</h2>
            
            <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-300">
                  Filter Name
                </label>
                <div className="mt-2">
                  <input
                    type="text"
                    className="block w-full rounded-lg border-0 bg-background-light/50 dark:bg-background-dark/50 py-2.5 px-3 text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                    value={filterName}
                    onChange={(e) => setFilterName(e.target.value)}
                    placeholder="Enter filter name to save"
                  />
                </div>
              </div>
              <div className="flex items-end">
                <button
                  className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  onClick={handleSaveFilter}
                  disabled={!filterName}
                >
                  Save Filter
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-6 rounded-lg border border-gray-200/50 dark:border-gray-700/50 bg-white/20 dark:bg-black/20 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Filter Builder</h2>
            
            <div className="border-b border-gray-200/50 dark:border-gray-700/50">
              <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                <button
                  onClick={() => handleTabChange(null, 0)}
                  className={`${
                    activeTab === 0
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  } whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium`}
                >
                  Template Filters
                </button>
                <button
                  onClick={() => handleTabChange(null, 1)}
                  className={`${
                    activeTab === 1
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  } whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium`}
                >
                  Custom Filter Builder
                </button>
                <button
                  onClick={() => handleTabChange(null, 2)}
                  className={`${
                    activeTab === 2
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  } whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium`}
                >
                  JSON Filter
                </button>
              </nav>
            </div>

            {activeTab === 0 && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Pre-built Filter Templates</h3>
                
                <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
                  {Object.entries(templates).map(([name, filter]) => (
                    <div key={name} className="rounded-lg border border-gray-200/50 dark:border-gray-700/50 bg-white/20 dark:bg-black/20 p-4">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">{name}</h4>
                      <div className="mt-2">
                        <span className="inline-flex items-center rounded-md bg-primary/20 dark:bg-primary/30 px-2.5 py-0.5 text-xs font-medium text-primary dark:text-primary">
                          {filter}
                        </span>
                      </div>
                      <div className="mt-4">
                        <button
                          className="w-full rounded-lg bg-primary/20 dark:bg-primary/30 px-3 py-1.5 text-sm font-medium text-primary dark:text-primary hover:bg-primary/30 dark:hover:bg-primary/40"
                          onClick={() => handleTemplateFilter(name)}
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 1 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Custom Filter Builder</h3>
                  <button
                    className="rounded-lg bg-primary/20 dark:bg-primary/30 px-3 py-1.5 text-sm font-medium text-primary dark:text-primary hover:bg-primary/30 dark:hover:bg-primary/40"
                    onClick={handleAddCustomCondition}
                  >
                    Add Condition
                  </button>
                </div>

                {customConditions.map((condition, index) => (
                  <div key={index} className="rounded-lg border border-gray-200/50 dark:border-gray-700/50 bg-white/20 dark:bg-black/20 p-4">
                    <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-6">
                      {index > 0 && (
                        <div className="sm:col-span-1">
                          <select
                            className="block w-full rounded-lg border-0 bg-background-light/50 dark:bg-background-dark/50 py-2 px-3 text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm"
                            value={condition.logic}
                            onChange={(e) => handleConditionChange(index, 'logic', e.target.value)}
                          >
                            <option value="AND">AND</option>
                            <option value="OR">OR</option>
                          </select>
                        </div>
                      )}
                      <div className="sm:col-span-1">
                        <select
                          className="block w-full rounded-lg border-0 bg-background-light/50 dark:bg-background-dark/50 py-2 px-3 text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm"
                          value={condition.column}
                          onChange={(e) => handleConditionChange(index, 'column', e.target.value)}
                        >
                          <option value="close">Close</option>
                          <option value="open">Open</option>
                          <option value="high">High</option>
                          <option value="low">Low</option>
                          <option value="volume">Volume</option>
                          <option value="sma_20">SMA(20)</option>
                          <option value="rsi">RSI</option>
                        </select>
                      </div>
                      <div className="sm:col-span-1">
                        <select
                          className="block w-full rounded-lg border-0 bg-background-light/50 dark:bg-background-dark/50 py-2 px-3 text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm"
                          value={condition.operator}
                          onChange={(e) => handleConditionChange(index, 'operator', e.target.value)}
                        >
                          <option value=">">Greater than</option>
                          <option value="<">Less than</option>
                          <option value=">=">Greater than or equal</option>
                          <option value="<=">Less than or equal</option>
                          <option value="==">Equal</option>
                          <option value="!=">Not equal</option>
                        </select>
                      </div>
                      <div className="sm:col-span-1">
                        <select
                          className="block w-full rounded-lg border-0 bg-background-light/50 dark:bg-background-dark/50 py-2 px-3 text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm"
                          value={condition.valueType}
                          onChange={(e) => handleConditionChange(index, 'valueType', e.target.value)}
                        >
                          <option value="value">Value</option>
                          <option value="column">Column</option>
                        </select>
                      </div>
                      <div className="sm:col-span-1">
                        {condition.valueType === 'value' ? (
                          <input
                            type="text"
                            className="block w-full rounded-lg border-0 bg-background-light/50 dark:bg-background-dark/50 py-2 px-3 text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm"
                            value={condition.value}
                            onChange={(e) => handleConditionChange(index, 'value', e.target.value)}
                          />
                        ) : (
                          <select
                            className="block w-full rounded-lg border-0 bg-background-light/50 dark:bg-background-dark/50 py-2 px-3 text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm"
                            value={condition.value}
                            onChange={(e) => handleConditionChange(index, 'value', e.target.value)}
                          >
                            <option value="close">Close</option>
                            <option value="open">Open</option>
                            <option value="high">High</option>
                            <option value="low">Low</option>
                            <option value="volume">Volume</option>
                            <option value="sma_20">SMA(20)</option>
                          </select>
                        )}
                      </div>
                      <div className="sm:col-span-1 flex justify-end">
                        <button
                          className="rounded-lg bg-red-500 px-2 py-1 text-sm font-medium text-white hover:bg-red-600"
                          onClick={() => handleRemoveCondition(index)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="flex justify-end">
                  <button
                    className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    onClick={handleApplyCustomFilter}
                    disabled={customConditions.length === 0}
                  >
                    Apply Filter
                  </button>
                </div>
              </div>
            )}

            {activeTab === 2 && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">JSON Filter Editor</h3>

                <div>
                  <label className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-300">
                    Load Example
                  </label>
                  <div className="mt-2">
                    <select
                      className="block w-full rounded-lg border-0 bg-background-light/50 dark:bg-background-dark/50 py-2.5 px-3 text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm"
                      value={selectedExample}
                      onChange={(e) => loadExample(e.target.value)}
                    >
                      <option value="">Select an example...</option>
                      {Object.keys(jsonExamples).map((key) => (
                        <option key={key} value={key}>
                          {key}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="rounded-lg border border-gray-200/50 dark:border-gray-700/50 bg-white/20 dark:bg-black/20 p-4">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">JSON Filter Guide</h4>
                  <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                    <p><strong>Quick Start:</strong> Define filters using JSON with "logic" (AND/OR) and "conditions" array.</p>
                    <p><strong>Schema Overview:</strong> Root object requires "logic" and "conditions". Conditions are objects with "left", "operator", "right".</p>
                    <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs font-mono">
                      <p>Column: {`{type: "column", name: "close", offset: 0}`}</p>
                      <p>Indicator: {`{type: "indicator", name: "sma", params: [20], column: "close"}`}</p>
                      <p>Constant: {`{type: "constant", value: 100}`}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-300">
                    JSON Filter
                  </label>
                  <div className="mt-2">
                    <textarea
                      rows={12}
                      className="block w-full rounded-lg border-0 bg-background-light/50 dark:bg-background-dark/50 py-2.5 px-3 text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm"
                      value={jsonFilter}
                      onChange={(e) => setJsonFilter(e.target.value)}
                      placeholder='{"logic": "AND", "conditions": [...]}'
                    />
                  </div>
                  {validationError && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationError}</p>
                  )}
                  {isValid && !validationError && (
                    <p className="mt-1 text-sm text-green-600 dark:text-green-400">JSON is valid! Ready to apply.</p>
                  )}
                </div>

                <div className="flex justify-end">
                  <button
                    className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    onClick={handleApplyJsonFilter}
                    disabled={!isValid || !jsonFilter.trim()}
                  >
                    Apply JSON Filter
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterBuilder;