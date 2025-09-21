import React, { useState } from 'react';
import {
  Box,
  Chip,
  Tooltip,
  Menu,
  MenuItem,
  IconButton,
  Badge,
  Typography
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Sync,
  Info,
  FilterList,
  MoreVert
} from '@mui/icons-material';
import './SignalTypeBadges.css';

/**
 * Signal Type Badges Component for BackTestEngine UI/UX
 * Displays Long/Short/Mixed signal badges with appropriate colors
 * and interactive hover effects with icon integration
 * 
 * Features:
 * - Long/Short/Mixed signal badges with appropriate colors
 * - Interactive hover effects
 * - Icon integration
 * - Filter functionality
 * - Responsive design
 * - Tooltip support
 */
const SignalTypeBadges = ({ 
  signals = [],
  onFilterChange,
  selectedTypes = [],
  showCounts = true,
  showIcons = true,
  className = ""
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [hoveredBadge, setHoveredBadge] = useState(null);

  // Signal type configuration
  const signalTypes = {
    long: {
      label: 'Long',
      color: 'success',
      icon: TrendingUp,
      gradient: 'linear-gradient(135deg, #28a745, #20c997)',
      description: 'Buy signals - Long positions'
    },
    short: {
      label: 'Short', 
      color: 'error',
      icon: TrendingDown,
      gradient: 'linear-gradient(135deg, #dc3545, #fd7e14)',
      description: 'Sell signals - Short positions'
    },
    mixed: {
      label: 'Mixed',
      color: 'info',
      icon: Sync,
      gradient: 'linear-gradient(135deg, #6f42c1, #e83e8c)',
      description: 'Both long and short signals'
    }
  };

  // Count signals by type
  const countSignalsByType = () => {
    return signals.reduce((acc, signal) => {
      acc[signal.type] = (acc[signal.type] || 0) + 1;
      return acc;
    }, {});
  };

  // Get signal count for a specific type
  const getSignalCount = (type) => {
    return countSignalsByType()[type] || 0;
  };

  // Check if a type is selected
  const isTypeSelected = (type) => {
    return selectedTypes.length === 0 || selectedTypes.includes(type);
  };

  // Handle badge click
  const handleBadgeClick = (type) => {
    const newSelectedTypes = selectedTypes.includes(type)
      ? selectedTypes.filter(t => t !== type)
      : [...selectedTypes, type];
    
    if (onFilterChange) {
      onFilterChange(newSelectedTypes);
    }
  };

  // Handle menu interactions
  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // Handle select all/none
  const handleSelectAll = () => {
    const allTypes = Object.keys(signalTypes);
    onFilterChange(allTypes);
  };

  const handleSelectNone = () => {
    onFilterChange([]);
  };

  // Render individual signal badge
  const renderSignalBadge = (type) => {
    const config = signalTypes[type];
    const Icon = config.icon;
    const count = getSignalCount(type);
    const isSelected = isTypeSelected(type);
    
    return (
      <Tooltip
        key={type}
        title={
          <Box className="badge-tooltip">
            <Typography variant="subtitle2" className="tooltip-title">
              {config.label} Signals
            </Typography>
            <Typography variant="body2" className="tooltip-description">
              {config.description}
            </Typography>
            <Typography variant="body2" className="tooltip-count">
              Count: {count}
            </Typography>
          </Box>
        }
        placement="top"
        arrow
      >
        <Chip
          icon={showIcons ? <Icon className="badge-icon" /> : null}
          label={showCounts ? `${config.label} (${count})` : config.label}
          className={`signal-badge ${type} ${isSelected ? 'selected' : ''} ${hoveredBadge === type ? 'hovered' : ''}`}
          onClick={() => handleBadgeClick(type)}
          onMouseEnter={() => setHoveredBadge(type)}
          onMouseLeave={() => setHoveredBadge(null)}
          style={{
            background: isSelected ? config.gradient : 'rgba(0,0,0,0.1)',
            border: isSelected ? '2px solid rgba(255,255,255,0.3)' : '1px solid rgba(0,0,0,0.1)',
            color: isSelected ? 'white' : 'inherit',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
        />
      </Tooltip>
    );
  };

  // Render filter menu
  const renderFilterMenu = () => {
    return (
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        className="filter-menu"
      >
        <MenuItem onClick={handleSelectAll}>
          <FilterList className="menu-icon" />
          <span>Select All</span>
        </MenuItem>
        <MenuItem onClick={handleSelectNone}>
          <FilterList className="menu-icon" />
          <span>Select None</span>
        </MenuItem>
        <div className="menu-divider" />
        {Object.entries(signalTypes).map(([type, config]) => (
          <MenuItem 
            key={type} 
            onClick={() => handleBadgeClick(type)}
            className={isTypeSelected(type) ? 'selected' : ''}
          >
            <div 
              className="menu-badge-color" 
              style={{ background: config.gradient }}
            />
            <span>{config.label}</span>
            <span className="menu-badge-count">({getSignalCount(type)})</span>
          </MenuItem>
        ))}
      </Menu>
    );
  };

  // Get total signal count
  const totalSignals = signals.length;
  const visibleSignals = signals.filter(signal => 
    selectedTypes.length === 0 || selectedTypes.includes(signal.type)
  ).length;

  return (
    <Box className={`signal-type-badges ${className}`}>
      {/* Main badges container */}
      <Box className="badges-container">
        {Object.keys(signalTypes).map(type => renderSignalBadge(type))}
      </Box>

      {/* Filter menu */}
      <Box className="filter-section">
        <Tooltip title="Filter signals">
          <IconButton
            size="small"
            onClick={handleMenuOpen}
            className="filter-button"
          >
            <MoreVert />
          </IconButton>
        </Tooltip>
        
        <Typography 
          variant="caption" 
          className="signal-count"
        >
          {visibleSignals} of {totalSignals} signals
        </Typography>
      </Box>

      {renderFilterMenu()}
    </Box>
  );
};

// Export with default props
SignalTypeBadges.defaultProps = {
  signals: [],
  selectedTypes: [],
  showCounts: true,
  showIcons: true
};

export default SignalTypeBadges;