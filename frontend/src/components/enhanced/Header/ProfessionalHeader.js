import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Chip,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Badge,
  Avatar,
  Tooltip
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications,
  AccountCircle,
  Settings,
  TrendingUp,
  TrendingDown,
  Sync
} from '@mui/icons-material';
import './ProfessionalHeader.css';

/**
 * Professional Header Component for BackTestEngine UI/UX
 * Matches the gradient header design from BackTestEngine.py lines 1313-1364
 * 
 * Features:
 * - Gradient background using linear-gradient(90deg, #1f77b4, #ff7f0e)
 * - Professional typography and spacing
 * - Status indicators and branding
 * - Responsive design
 * - Interactive elements with hover effects
 */
const ProfessionalHeader = ({ 
  title = "BackTestEngine", 
  subtitle = "Advanced Trading Strategy Analysis",
  user = null,
  notifications = [],
  onMenuClick,
  onSettingsClick,
  onProfileClick,
  className = ""
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileMenuAnchor, setMobileMenuAnchor] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);

  // Handle scroll effect for header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle menu interactions
  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleMobileMenuOpen = (event) => {
    setMobileMenuAnchor(event.currentTarget);
  };

  const handleMobileMenuClose = () => {
    setMobileMenuAnchor(null);
  };

  // Status indicators
  const getStatusIndicators = () => {
    return (
      <Box className="status-indicators">
        <Chip 
          icon={<TrendingUp />} 
          label="System Active" 
          size="small"
          className="status-chip active"
        />
        <Chip 
          icon={<Sync />} 
          label="Real-time" 
          size="small"
          className="status-chip sync"
        />
      </Box>
    );
  };

  // User menu
  const renderUserMenu = () => {
    if (!user) return null;

    return (
      <Box className="user-menu">
        <Tooltip title="Notifications">
          <IconButton 
            size="large" 
            color="inherit"
            className="notification-button"
          >
            <Badge badgeContent={notifications.length} color="error">
              <Notifications />
            </Badge>
          </IconButton>
        </Tooltip>
        
        <Tooltip title="Account">
          <IconButton 
            size="large" 
            color="inherit"
            onClick={handleMenuOpen}
          >
            <Avatar className="user-avatar">
              {user.name.charAt(0).toUpperCase()}
            </Avatar>
          </IconButton>
        </Tooltip>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          className="user-dropdown"
        >
          <MenuItem onClick={handleMenuClose}>
            <AccountCircle className="menu-icon" />
            <span>Profile</span>
          </MenuItem>
          <MenuItem onClick={onSettingsClick}>
            <Settings className="menu-icon" />
            <span>Settings</span>
          </MenuItem>
          <MenuItem onClick={handleMenuClose}>
            <TrendingUp className="menu-icon" />
            <span>Analytics</span>
          </MenuItem>
          <MenuItem onClick={handleMenuClose}>
            <TrendingDown className="menu-icon" />
            <span>Performance</span>
          </MenuItem>
        </Menu>
      </Box>
    );
  };

  // Mobile menu
  const renderMobileMenu = () => {
    return (
      <Menu
        anchorEl={mobileMenuAnchor}
        open={Boolean(mobileMenuAnchor)}
        onClose={handleMobileMenuClose}
        className="mobile-menu"
      >
        <MenuItem onClick={handleMobileMenuClose}>
          <TrendingUp className="menu-icon" />
          <span>Dashboard</span>
        </MenuItem>
        <MenuItem onClick={handleMobileMenuClose}>
          <TrendingDown className="menu-icon" />
          <span>Backtesting</span>
        </MenuItem>
        <MenuItem onClick={onSettingsClick}>
          <Settings className="menu-icon" />
          <span>Settings</span>
        </MenuItem>
        {renderUserMenu()}
      </Menu>
    );
  };

  return (
    <AppBar 
      position="fixed" 
      className={`professional-header ${isScrolled ? 'scrolled' : ''} ${className}`}
    >
      <Toolbar className="header-toolbar">
        {/* Mobile menu button */}
        <Box className="mobile-menu-section">
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={handleMobileMenuOpen}
            className="mobile-menu-button"
          >
            <MenuIcon />
          </IconButton>
        </Box>

        {/* Logo and branding */}
        <Box className="branding-section">
          <Box className="logo-container">
            <div className="logo-icon">📊</div>
          </Box>
          <Box className="text-container">
            <Typography 
              variant="h6" 
              component="h1" 
              className="header-title"
            >
              {title}
            </Typography>
            <Typography 
              variant="caption" 
              className="header-subtitle"
            >
              {subtitle}
            </Typography>
          </Box>
        </Box>

        {/* Desktop navigation */}
        <Box className="desktop-nav">
          <Button 
            color="inherit" 
            className="nav-button"
            onClick={onMenuClick}
          >
            Dashboard
          </Button>
          <Button 
            color="inherit" 
            className="nav-button"
            onClick={onMenuClick}
          >
            Backtesting
          </Button>
          <Button 
            color="inherit" 
            className="nav-button"
            onClick={onMenuClick}
          >
            Analytics
          </Button>
        </Box>

        {/* Status indicators */}
        <Box className="status-section">
          {getStatusIndicators()}
        </Box>

        {/* User menu */}
        <Box className="user-section">
          {renderUserMenu()}
        </Box>
      </Toolbar>
      
      {renderMobileMenu()}
    </AppBar>
  );
};

export default ProfessionalHeader;