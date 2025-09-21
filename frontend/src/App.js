import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Chip
} from '@mui/material';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  Tabs,
  Tab,
  Paper,
  CssBaseline,
  ThemeProvider,
  createTheme,
  Switch,
  FormControlLabel
} from '@mui/material';
import { Upload, Build, Assessment, Insights, Star } from '@mui/icons-material';
import FileUpload from './components/FileUpload';
import FilterBuilder from './components/FilterBuilder';
import ResultsTable from './components/ResultsTable';
import Backtesting from './views/Backtesting';
import EnhancedBacktesting from './views/EnhancedBacktesting';
import axios from 'axios';

// Import enhanced styles
import './styles/enhanced/professional-theme.css';
import './styles/enhanced/gradient-components.css';
import './styles/enhanced/badge-system.css';
import './styles/enhanced/responsive-layouts.css';
import './styles/backtest-design.css';

// Create a custom dark theme matching the design inspiration
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#1173d4', // Matches the design's primary color
    },
    secondary: {
      main: '#6b7280',
    },
    background: {
      default: '#0b1114', // Dark page background
      paper: '#0f1720',   // Dark Paper/Card background
    },
    text: {
      primary: '#e6eef3', // Light text for dark background
      secondary: '#9ca3af',
    },
  },
  typography: {
    fontFamily: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      'sans-serif',
    ].join(','),
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '0.25rem',
          fontWeight: '500',
        },
      },
    },
    MuiInput: {
      styleOverrides: {
        root: {
          borderRadius: '0.25rem',
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: '0.25rem',
        },
      },
    },
  },
});

function App() {
  const [activeTab, setActiveTab] = useState(0);
  const [useEnhancedUI, setUseEnhancedUI] = useState(true);
  const [processedData, setProcessedData] = useState(null);
  const [dataSummary, setDataSummary] = useState(null);
  const [scanResults, setScanResults] = useState(null);
  const [savedFilters, setSavedFilters] = useState({});

  const API_BASE = 'http://localhost:8000/api';

  useEffect(() => {
    // Load saved filters on component mount
    loadSavedFilters();
  }, []);

  // Ensure activeTab stays valid when toggling Enhanced UI (adds/removes the 5th tab)
  useEffect(() => {
    const lastIndex = useEnhancedUI ? 4 : 3;
    if (activeTab > lastIndex) setActiveTab(0);
  }, [useEnhancedUI, activeTab]);

  const loadSavedFilters = async () => {
    try {
      const response = await axios.get(`${API_BASE}/filters/saved`);
      setSavedFilters(response.data.saved_filters);
    } catch (error) {
      console.error('Error loading saved filters:', error);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleDataUpload = async (data) => {
    setProcessedData(data);
    setScanResults(null);
    setDataSummary(null); // Clear previous summary

    // Load data summary after upload
    try {
      const response = await axios.get(`${API_BASE}/data/summary`);
      console.log('App loaded data summary:', response.data);
      setDataSummary(response.data);
    } catch (error) {
      console.error('Error loading data summary in App:', error);
    }
  };

  const handleFilterResults = (results) => {
    setScanResults(results);
    setActiveTab(2); // Switch to results tab
  };

  const TabPanel = ({ children, value, index }) => {
    return (
      <div hidden={value !== index}>
        {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
      </div>
    );
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className="App">
        <AppBar position="static" elevation={0}>
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              📊 BackTestEngine Pro
            </Typography>
            <FormControlLabel
              control={<Switch checked={useEnhancedUI} onChange={() => setUseEnhancedUI(!useEnhancedUI)} />}
              label="Enhanced UI"
            />
          </Toolbar>
        </AppBar>

        <Container maxWidth="xl" sx={{ mt: 2 }}>
          <Paper elevation={1}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              variant="fullWidth"
            >
              <Tab icon={<Upload />} label="Upload Data" />
              <Tab icon={<Build />} label="Build Filters" />
              <Tab icon={<Assessment />} label="Results" />
              <Tab icon={<Insights />} label="Backtesting" />
              {useEnhancedUI && <Tab icon={<Star />} label="Enhanced" />}
            </Tabs>

            <>
              <TabPanel value={activeTab} index={0}>
                <FileUpload
                  onDataUpload={handleDataUpload}
                  apiBase={API_BASE}
                />
                {dataSummary && (
                  <Box sx={{ mt: 3, p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      📋 Data Preview & Summary
                    </Typography>
                    
                    {/* Summary Cards */}
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                      <Grid xs={12} sm={6} md={3}>
                        <Card variant="outlined">
                          <CardContent>
                            <Typography color="text.secondary" gutterBottom>
                              Symbols
                            </Typography>
                            <Typography variant="h5">
                              {dataSummary.unique_symbols || 'N/A'}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid xs={12} sm={6} md={3}>
                        <Card variant="outlined">
                          <CardContent>
                            <Typography color="text.secondary" gutterBottom>
                              Date Range
                            </Typography>
                            <Typography variant="h6">
                              {dataSummary.date_range?.min ? new Date(dataSummary.date_range.min).toLocaleDateString() : 'N/A'} -{' '}
                              {dataSummary.date_range?.max ? new Date(dataSummary.date_range.max).toLocaleDateString() : 'N/A'}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid xs={12} sm={6} md={3}>
                        <Card variant="outlined">
                          <CardContent>
                            <Typography color="text.secondary" gutterBottom>
                              Columns
                            </Typography>
                            <Typography variant="h5">
                              {dataSummary.shape?.[1] || 'N/A'}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid xs={12} sm={6} md={3}>
                        <Card variant="outlined">
                          <CardContent>
                            <Typography color="text.secondary" gutterBottom>
                              Records
                            </Typography>
                            <Typography variant="h5">
                              {dataSummary.shape?.[0] || 'N/A'}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    </Grid>

                    {/* Columns Chips */}
                    <Typography variant="subtitle2" gutterBottom sx={{ mb: 1 }}>
                      Columns:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                      {dataSummary.columns?.slice(0, 10).map((column, index) => (
                        <Chip key={index} label={column} size="small" variant="outlined" />
                      ))}
                      {dataSummary.columns?.length > 10 && (
                        <Chip label={`+${dataSummary.columns.length - 10} more`} size="small" />
                      )}
                    </Box>

                    {/* Data Preview Table */}
                    {dataSummary.preview && dataSummary.preview.length > 0 && (
                      <>
                        <Typography variant="subtitle2" gutterBottom sx={{ mb: 1 }}>
                          Preview (First 5 Rows):
                        </Typography>
                        <Box sx={{ overflowX: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600, backgroundColor: 'transparent' }}>
                            <thead>
                              <tr>
                                {Object.keys(dataSummary.preview[0]).map((header) => (
                                  <th
                                    key={header}
                                    style={{
                                      textAlign: 'left',
                                      padding: '12px 16px',
                                      borderBottom: '2px solid',
                                      borderColor: 'divider',
                                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                      fontWeight: '600',
                                      color: 'text.primary',
                                      whiteSpace: 'nowrap'
                                    }}
                                  >
                                    {header}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {dataSummary.preview.map((row, rowIndex) => (
                                <tr key={rowIndex} style={{ backgroundColor: rowIndex % 2 === 0 ? 'rgba(255, 255, 255, 0.02)' : 'transparent' }}>
                                  {Object.keys(row).map((header, cellIndex) => {
                                    const cell = row[header];
                                    const isVolumeColumn = header.toLowerCase().includes('volume') ||
                                      header.toLowerCase().includes('vol') ||
                                      header.toLowerCase().includes('qty') ||
                                      header.toLowerCase().includes('quantity');

                                    return (
                                      <td
                                        key={cellIndex}
                                        style={{
                                          padding: '12px 16px',
                                          borderBottom: '1px solid',
                                          borderColor: 'divider',
                                          whiteSpace: 'nowrap',
                                          color: 'text.primary',
                                          maxWidth: '150px',
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis'
                                        }}
                                      >
                                        {typeof cell === 'object'
                                          ? JSON.stringify(cell)
                                          : typeof cell === 'number'
                                          ? isVolumeColumn
                                            ? Math.round(cell).toLocaleString()
                                            : cell.toFixed(2)
                                          : String(cell)
                                        }
                                      </td>
                                    );
                                  })}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </Box>
                      </>
                    )}
                  </Box>
                )}
              </TabPanel>

              <TabPanel value={activeTab} index={1}>
                <FilterBuilder
                  processedData={processedData}
                  savedFilters={savedFilters}
                  onFilterResults={handleFilterResults}
                  apiBase={API_BASE}
                  onSaveFilter={loadSavedFilters}
                />
              </TabPanel>

              <TabPanel value={activeTab} index={2}>
                <ResultsTable
                  results={scanResults}
                  processedData={processedData}
                  apiBase={API_BASE}
                />
              </TabPanel>

              <TabPanel value={activeTab} index={3}>
                <Backtesting
                  filteredResults={scanResults || []}
                  ohlcvData={processedData ? processedData.ohlcv : []}
                  apiBase={API_BASE}
                />
              </TabPanel>

              {useEnhancedUI && (
                <TabPanel value={activeTab} index={4}>
                  <EnhancedBacktesting />
                </TabPanel>
              )}
            </>
          </Paper>
        </Container>
      </div>
    </ThemeProvider>
  );
}

export default App;
