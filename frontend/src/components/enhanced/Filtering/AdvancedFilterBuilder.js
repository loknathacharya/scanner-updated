import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Tooltip,
  Divider,
  Chip,
  Paper,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Collapse,
} from '@mui/material';
import {
  Add,
  Delete,
  FilterList,
  Save,
  FolderOpen,
  ExpandMore,
  ChevronRight,
} from '@mui/icons-material';
import './AdvancedFilterBuilder.css';

const AdvancedFilterBuilder = ({ onApplyFilters, onSaveFilters, onLoadFilters, disabled = false }) => {
  const [filterGroups, setFilterGroups] = useState([
    {
      id: 1,
      type: 'AND',
      filters: [{ id: 1, field: '', operator: '', value: '' }],
      isExpanded: true,
    },
  ]);
  const [isExpanded, setIsExpanded] = useState(true);

  const handleAddFilter = (groupId) => {
    setFilterGroups(
      filterGroups.map((group) =>
        group.id === groupId
          ? {
              ...group,
              filters: [
                ...group.filters,
                { id: Date.now(), field: '', operator: '', value: '' },
              ],
            }
          : group
      )
    );
  };

  const handleRemoveFilter = (groupId, filterId) => {
    setFilterGroups(
      filterGroups.map((group) =>
        group.id === groupId
          ? {
              ...group,
              filters: group.filters.filter((f) => f.id !== filterId),
            }
          : group
      )
    );
  };

  const handleAddGroup = () => {
    setFilterGroups([
      ...filterGroups,
      {
        id: Date.now(),
        type: 'AND',
        filters: [{ id: Date.now(), field: '', operator: '', value: '' }],
        isExpanded: true,
      },
    ]);
  };

  const handleRemoveGroup = (groupId) => {
    setFilterGroups(filterGroups.filter((g) => g.id !== groupId));
  };

  const handleFilterChange = (groupId, filterId, field, value) => {
    setFilterGroups(
      filterGroups.map((group) =>
        group.id === groupId
          ? {
              ...group,
              filters: group.filters.map((f) =>
                f.id === filterId ? { ...f, [field]: value } : f
              ),
            }
          : group
      )
    );
  };

  const handleGroupTypeChange = (groupId, type) => {
    setFilterGroups(
      filterGroups.map((group) =>
        group.id === groupId ? { ...group, type } : group
      )
    );
  };

  const toggleGroupExpansion = (groupId) => {
    setFilterGroups(
      filterGroups.map((group) =>
        group.id === groupId ? { ...group, isExpanded: !group.isExpanded } : group
      )
    );
  };

  const fieldOptions = [
    { value: 'price', label: 'Price' },
    { value: 'volume', label: 'Volume' },
    { value: 'market_cap', label: 'Market Cap' },
    { value: 'pe_ratio', label: 'P/E Ratio' },
    { value: 'dividend_yield', label: 'Dividend Yield' },
  ];

  const operatorOptions = {
    price: [
      { value: 'gt', label: '>' },
      { value: 'lt', label: '<' },
      { value: 'gte', label: '>=' },
      { value: 'lte', label: '<=' },
      { value: 'eq', label: '=' },
    ],
    volume: [
        { value: 'gt', label: '>' },
        { value: 'lt', label: '<' },
        { value: 'gte', label: '>=' },
        { value: 'lte', label: '<=' },
    ],
    market_cap: [
        { value: 'gt', label: '>' },
        { value: 'lt', label: '<' },
    ],
    pe_ratio: [
        { value: 'gt', label: '>' },
        { value: 'lt', label: '<' },
    ],
    dividend_yield: [
        { value: 'gt', label: '>' },
        { value: 'lt', label: '<' },
    ],
  };

  return (
    <Card className="advanced-filter-builder-card">
      <CardContent>
        <Box className="builder-header">
          <Typography variant="h6" className="builder-title">
            <FilterList /> Advanced Filter Builder
          </Typography>
          <IconButton onClick={() => setIsExpanded(!isExpanded)}>
            {isExpanded ? <ExpandMore /> : <ChevronRight />}
          </IconButton>
        </Box>
        <Collapse in={isExpanded}>
          <Divider />
          <Box p={2}>
            {filterGroups.map((group, groupIndex) => (
              <Paper key={group.id} className="filter-group">
                <Box className="group-header">
                  <FormControl size="small">
                    <Select
                      value={group.type}
                      onChange={(e) => handleGroupTypeChange(group.id, e.target.value)}
                      disabled={disabled}
                    >
                      <MenuItem value="AND">AND</MenuItem>
                      <MenuItem value="OR">OR</MenuItem>
                    </Select>
                  </FormControl>
                  <Box>
                    <Tooltip title="Add Filter to Group">
                      <span>
                        <IconButton onClick={() => handleAddFilter(group.id)} disabled={disabled}>
                          <Add />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="Remove Group">
                      <span>
                        <IconButton onClick={() => handleRemoveGroup(group.id)} disabled={disabled || filterGroups.length === 1}>
                          <Delete />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <IconButton onClick={() => toggleGroupExpansion(group.id)}>
                      {group.isExpanded ? <ExpandMore /> : <ChevronRight />}
                    </IconButton>
                  </Box>
                </Box>
                <Collapse in={group.isExpanded}>
                  <Box p={2}>
                    {group.filters.map((filter) => (
                      <Grid container spacing={2} key={filter.id} className="filter-row">
                        <Grid item xs={12} md={4}>
                          <FormControl fullWidth size="small">
                            <InputLabel>Field</InputLabel>
                            <Select
                              value={filter.field}
                              onChange={(e) => handleFilterChange(group.id, filter.id, 'field', e.target.value)}
                              disabled={disabled}
                            >
                              {fieldOptions.map((opt) => (
                                <MenuItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} md={3}>
                          <FormControl fullWidth size="small" disabled={!filter.field}>
                            <InputLabel>Operator</InputLabel>
                            <Select
                              value={filter.operator}
                              onChange={(e) => handleFilterChange(group.id, filter.id, 'operator', e.target.value)}
                              disabled={disabled}
                            >
                              {filter.field && operatorOptions[filter.field]?.map((opt) => (
                                <MenuItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Value"
                            value={filter.value}
                            onChange={(e) => handleFilterChange(group.id, filter.id, 'value', e.target.value)}
                            disabled={disabled || !filter.operator}
                          />
                        </Grid>
                        <Grid item xs={12} md={1}>
                          <Tooltip title="Remove Filter">
                            <span>
                              <IconButton onClick={() => handleRemoveFilter(group.id, filter.id)} disabled={disabled || group.filters.length === 1}>
                                <Delete />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </Grid>
                      </Grid>
                    ))}
                  </Box>
                </Collapse>
              </Paper>
            ))}
            <Button
              startIcon={<Add />}
              onClick={handleAddGroup}
              disabled={disabled}
              className="add-group-btn"
            >
              Add Group
            </Button>
          </Box>
          <Divider />
          <Box className="builder-actions">
            <Button
              startIcon={<FolderOpen />}
              onClick={onLoadFilters}
              disabled={disabled}
            >
              Load
            </Button>
            <Button
              startIcon={<Save />}
              onClick={() => onSaveFilters(filterGroups)}
              disabled={disabled}
            >
              Save
            </Button>
            <Button
              variant="contained"
              startIcon={<FilterList />}
              onClick={() => onApplyFilters(filterGroups)}
              disabled={disabled}
            >
              Apply Filters
            </Button>
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default AdvancedFilterBuilder;