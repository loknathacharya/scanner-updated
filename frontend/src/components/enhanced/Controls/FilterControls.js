import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  IconButton,
  Tooltip,
  Chip,
  Divider,
  Alert,
  Paper,
  Grid,
  Switch,
  FormControlLabel,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Checkbox
} from '@mui/material';
import {
  FilterAlt,
  Add,
  Edit,
  Delete,
  Save,
  Cancel,
  Search,
  Clear,
  Info,
  Settings,
  LibraryAdd,
  FolderOpen,
  FilterList,
  Tune,
  FilterNone,
  FilterBAndW,
  FilterVintage,
  FilterDrama,
  FilterFrames,
  Filter9Plus,
  FilterCenterFocus,
  FilterNone as FilterNoneIcon,
  FilterTiltShift,
  FilterHD,
  Filter,
  FilterCenterFocusOutlined,
  FilterFramesOutlined,
  FilterHDOutlined,
  FilterVintageOutlined,
  Filter9PlusOutlined,
  FilterTiltShiftOutlined,
  FilterBAndWOutlined,
  FilterDramaOutlined,
  FilterNoneOutlined,
  FilterAltOutlined,
  FilterListOutlined,
  TuneOutlined
} from '@mui/icons-material';
import './FilterControls.css';

const FilterControls = ({
  onFilterChange = () => {},
  initialFilters = [],
  availableColumns = [],
  disabled = false
}) => {
  const [filters, setFilters] = useState(initialFilters);
  const [newFilter, setNewFilter] = useState({
    column: '',
    operator: 'equals',
    value: '',
    active: true
  });
  const [isAddingFilter, setIsAddingFilter] = useState(false);
  const [isEditingFilter, setIsEditingFilter] = useState(null);
  const [filterPresets, setFilterPresets] = useState([]);
  const [isPresetDialogOpen, setIsPresetDialogOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState('');
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [isCalculating, setIsCalculating] = useState(false);

  // Available operators for different data types
  const operators = {
    string: ['equals', 'not_equals', 'contains', 'not_contains', 'starts_with', 'ends_with', 'is_empty', 'is_not_empty'],
    number: ['equals', 'not_equals', 'greater_than', 'less_than', 'greater_equal', 'less_equal', 'between', 'not_between'],
    date: ['equals', 'not_equals', 'after', 'before', 'between', 'not_between', 'is_empty', 'is_not_empty'],
    boolean: ['equals', 'not_equals']
  };

  // Filter presets
  const defaultPresets = [
    {
      id: 'high_volume',
      name: 'High Volume',
      description: 'Filters stocks with high trading volume',
      filters: [
        { column: 'Volume', operator: 'greater_than', value: '1000000', active: true }
      ]
    },
    {
      id: 'price_range',
      name: 'Price Range',
      description: 'Filters stocks within a specific price range',
      filters: [
        { column: 'Close', operator: 'greater_than', value: '50', active: true },
        { column: 'Close', operator: 'less_than', value: '500', active: true }
      ]
    },
    {
      id: 'momentum',
      name: 'Momentum',
      description: 'Filters stocks with positive momentum',
      filters: [
        { column: 'RSI', operator: 'less_than', value: '70', active: true },
        { column: 'MACD', operator: 'greater_than', value: '0', active: true }
      ]
    }
  ];

  useEffect(() => {
    setFilterPresets(defaultPresets);
  }, []);

  const handleAddFilter = () => {
    if (!newFilter.column || !newFilter.value) return;

    const filter = {
      id: Date.now(),
      ...newFilter
    };

    setFilters([...filters, filter]);
    setNewFilter({
      column: '',
      operator: 'equals',
      value: '',
      active: true
    });
    setIsAddingFilter(false);
    onFilterChange([...filters, filter]);
  };

  const handleEditFilter = (filterId) => {
    const filter = filters.find(f => f.id === filterId);
    if (filter) {
      setNewFilter({ ...filter });
      setIsEditingFilter(filterId);
      setIsAddingFilter(true);
    }
  };

  const handleUpdateFilter = () => {
    if (!newFilter.column || !newFilter.value) return;

    const updatedFilters = filters.map(filter => 
      filter.id === isEditingFilter ? { ...newFilter, id: isEditingFilter } : filter
    );

    setFilters(updatedFilters);
    setNewFilter({
      column: '',
      operator: 'equals',
      value: '',
      active: true
    });
    setIsEditingFilter(null);
    setIsAddingFilter(false);
    onFilterChange(updatedFilters);
  };

  const handleDeleteFilter = (filterId) => {
    const updatedFilters = filters.filter(filter => filter.id !== filterId);
    setFilters(updatedFilters);
    onFilterChange(updatedFilters);
  };

  const handleToggleFilter = (filterId) => {
    const updatedFilters = filters.map(filter => 
      filter.id === filterId ? { ...filter, active: !filter.active } : filter
    );
    setFilters(updatedFilters);
    onFilterChange(updatedFilters);
  };

  const handleClearFilters = () => {
    setFilters([]);
    onFilterChange([]);
  };

  const handleApplyPreset = () => {
    if (selectedPreset) {
      const preset = filterPresets.find(p => p.id === selectedPreset);
      if (preset) {
        setFilters(preset.filters);
        onFilterChange(preset.filters);
        setIsPresetDialogOpen(false);
        setSelectedPreset('');
      }
    }
  };

  const handleSavePreset = () => {
    const presetName = prompt('Enter preset name:');
    if (presetName && filters.length > 0) {
      const newPreset = {
        id: Date.now().toString(),
        name: presetName,
        description: 'Custom filter preset',
        filters: [...filters]
      };
      setFilterPresets([...filterPresets, newPreset]);
      setIsPresetDialogOpen(false);
    }
  };

  const getOperatorLabel = (operator) => {
    const labels = {
      equals: 'Equals',
      not_equals: 'Not Equals',
      contains: 'Contains',
      not_contains: 'Does Not Contain',
      starts_with: 'Starts With',
      ends_with: 'Ends With',
      is_empty: 'Is Empty',
      is_not_empty: 'Is Not Empty',
      greater_than: 'Greater Than',
      less_than: 'Less Than',
      greater_equal: 'Greater Than or Equal',
      less_equal: 'Less Than or Equal',
      between: 'Between',
      not_between: 'Not Between',
      after: 'After',
      before: 'Before',
      boolean_true: 'True',
      boolean_false: 'False'
    };
    return labels[operator] || operator;
  };

  const getDataType = (column) => {
    // This is a simplified version - in a real app, you'd determine this from the data
    const numericColumns = ['Open', 'High', 'Low', 'Close', 'Volume', 'RSI', 'MACD', 'Signal'];
    const dateColumns = ['Date'];
    const booleanColumns = ['Trend'];
    
    if (numericColumns.includes(column)) return 'number';
    if (dateColumns.includes(column)) return 'date';
    if (booleanColumns.includes(column)) return 'boolean';
    return 'string';
  };

  const renderFilterValueInput = (operator, dataType) => {
    switch (operator) {
      case 'is_empty':
      case 'is_not_empty':
        return null;
      case 'between':
      case 'not_between':
        return (
          <Grid container spacing={1}>
            <Grid item xs={5}>
              <TextField
                label="From"
                type={dataType === 'number' ? 'number' : 'text'}
                value={newFilter.value?.from || ''}
                onChange={(e) => setNewFilter({
                  ...newFilter,
                  value: {
                    ...newFilter.value,
                    from: e.target.value
                  }
                })}
                disabled={disabled}
                size="small"
              />
            </Grid>
            <Grid item xs={2} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography>to</Typography>
            </Grid>
            <Grid item xs={5}>
              <TextField
                label="To"
                type={dataType === 'number' ? 'number' : 'text'}
                value={newFilter.value?.to || ''}
                onChange={(e) => setNewFilter({
                  ...newFilter,
                  value: {
                    ...newFilter.value,
                    to: e.target.value
                  }
                })}
                disabled={disabled}
                size="small"
              />
            </Grid>
          </Grid>
        );
      default:
        return (
          <TextField
            label="Value"
            type={dataType === 'number' ? 'number' : 'text'}
            value={newFilter.value}
            onChange={(e) => setNewFilter({ ...newFilter, value: e.target.value })}
            disabled={disabled}
            size="small"
          />
        );
    }
  };

  const steps = ['Basic Filters', 'Advanced Filters', 'Filter Presets'];

  const isFormValid = newFilter.column && newFilter.value;

  return (
    <Card className="filter-controls">
      <CardContent>
        <Box className="controls-header">
          <Typography variant="h6" className="controls-title">
            <FilterAlt className="controls-icon" />
            Filter Controls
          </Typography>
          <Box className="header-actions">
            <FormControlLabel
              control={
                <Switch
                  checked={isAdvancedMode}
                  onChange={(e) => setIsAdvancedMode(e.target.checked)}
                  disabled={disabled}
                  color="primary"
                />
              }
              label="Advanced Mode"
            />
            <Tooltip title="Filter presets">
              <span>
                <IconButton
                  onClick={() => setIsPresetDialogOpen(true)}
                  disabled={disabled}
                  className="preset-button"
                >
                  <LibraryAdd />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        </Box>

        <Divider className="controls-divider" />

        {/* Stepper for guided configuration */}
        {isAdvancedMode && (
          <Box className="configuration-stepper">
            <Stepper activeStep={activeStep} alternativeLabel>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>
        )}

        {/* Active Filters */}
        <Box className="active-filters">
          <Box className="filters-header">
            <Typography variant="subtitle1" className="filters-title">
              Active Filters ({filters.length})
            </Typography>
            <Button
              variant="outlined"
              size="small"
              onClick={handleClearFilters}
              disabled={filters.length === 0 || disabled}
              className="clear-button"
              startIcon={<Clear />}
            >
              Clear All
            </Button>
          </Box>

          {filters.length === 0 ? (
            <Paper className="no-filters">
              <Typography variant="body2" color="text.secondary">
                No filters applied. Add filters to narrow down your results.
              </Typography>
            </Paper>
          ) : (
            <Box className="filters-list">
              {filters.map((filter) => (
                <Paper key={filter.id} className="filter-item">
                  <Box className="filter-content">
                    <Box className="filter-info">
                      <Typography variant="body2" className="filter-column">
                        {filter.column}
                      </Typography>
                      <Typography variant="body2" className="filter-operator">
                        {getOperatorLabel(filter.operator)}
                      </Typography>
                      {filter.operator !== 'is_empty' && filter.operator !== 'is_not_empty' && (
                        <Typography variant="body2" className="filter-value">
                          {typeof filter.value === 'object' 
                            ? `${filter.value.from} - ${filter.value.to}`
                            : filter.value}
                        </Typography>
                      )}
                    </Box>
                    <Box className="filter-actions">
                      <Tooltip title="Toggle active">
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => handleToggleFilter(filter.id)}
                            disabled={disabled}
                          >
                            <Checkbox
                              checked={filter.active}
                              onChange={() => handleToggleFilter(filter.id)}
                              disabled={disabled}
                            />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Edit filter">
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => handleEditFilter(filter.id)}
                            disabled={disabled}
                          >
                            <Edit />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Delete filter">
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteFilter(filter.id)}
                            disabled={disabled}
                          >
                            <Delete />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Box>
                  </Box>
                </Paper>
              ))}
            </Box>
          )}
        </Box>

        {/* Add Filter Section */}
        <Box className="add-filter-section">
          {isAddingFilter ? (
            <Paper className="add-filter-form">
              <Typography variant="subtitle2" className="form-title">
                {isEditingFilter ? 'Edit Filter' : 'Add New Filter'}
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Column</InputLabel>
                    <Select
                      value={newFilter.column}
                      onChange={(e) => {
                        const column = e.target.value;
                        const dataType = getDataType(column);
                        setNewFilter({
                          ...newFilter,
                          column,
                          operator: operators[dataType][0],
                          value: ''
                        });
                      }}
                      disabled={disabled}
                    >
                      {availableColumns.map((column) => (
                        <MenuItem key={column} value={column}>
                          {column}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Operator</InputLabel>
                    <Select
                      value={newFilter.operator}
                      onChange={(e) => setNewFilter({ ...newFilter, operator: e.target.value })}
                      disabled={disabled}
                    >
                      {operators[getDataType(newFilter.column)].map((operator) => (
                        <MenuItem key={operator} value={operator}>
                          {getOperatorLabel(operator)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={4}>
                  {renderFilterValueInput(newFilter.operator, getDataType(newFilter.column))}
                </Grid>

                <Grid item xs={12} md={2}>
                  <Box className="form-actions">
                    <Button
                      variant="contained"
                      size="small"
                      onClick={isEditingFilter ? handleUpdateFilter : handleAddFilter}
                      disabled={!isFormValid || disabled}
                      className="apply-button"
                    >
                      {isEditingFilter ? 'Update' : 'Add'}
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => {
                        setIsAddingFilter(false);
                        setIsEditingFilter(null);
                        setNewFilter({
                          column: '',
                          operator: 'equals',
                          value: '',
                          active: true
                        });
                      }}
                      disabled={disabled}
                      className="cancel-button"
                    >
                      Cancel
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          ) : (
            <Button
              variant="outlined"
              startIcon={<Add />}
              onClick={() => setIsAddingFilter(true)}
              disabled={disabled}
              className="add-filter-button"
            >
              Add Filter
            </Button>
          )}
        </Box>

        {/* Filter Presets Dialog */}
        <Dialog
          open={isPresetDialogOpen}
          onClose={() => setIsPresetDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <FilterAlt className="dialog-icon" />
            Filter Presets
          </DialogTitle>
          <DialogContent>
            <List>
              {filterPresets.map((preset) => (
                <ListItem
                  key={preset.id}
                  button
                  selected={selectedPreset === preset.id}
                  onClick={() => setSelectedPreset(preset.id)}
                >
                  <ListItemText
                    primary={preset.name}
                    secondary={preset.description}
                  />
                  <ListItemSecondaryAction>
                    <Checkbox
                      edge="end"
                      checked={selectedPreset === preset.id}
                      onChange={() => setSelectedPreset(preset.id)}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={handleSavePreset}
              disabled={filters.length === 0 || disabled}
              startIcon={<Save />}
            >
              Save Current as Preset
            </Button>
            <Button
              onClick={handleApplyPreset}
              disabled={!selectedPreset || disabled}
              variant="contained"
              startIcon={<FilterAlt />}
            >
              Apply Preset
            </Button>
            <Button
              onClick={() => setIsPresetDialogOpen(false)}
              disabled={disabled}
            >
              Cancel
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default FilterControls;