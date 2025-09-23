/**
 * Chart Configuration Management Utilities
 * Comprehensive configuration management for TradingView chart themes, layouts, and user preferences
 *
 * Features:
 * - Theme Management (dark/light themes, custom color schemes)
 * - Layout Management (single/multi-panel, responsive layouts)
 * - User Preferences (default settings, validation, import/export)
 * - Configuration Validation (sanitization, fallbacks, error handling)
 */

import { formatCurrency, formatPercentage } from './formatting.js';

// Configuration constants
export const CONFIG_CONSTANTS = {
  STORAGE_KEYS: {
    THEMES: 'chart_themes',
    LAYOUTS: 'chart_layouts',
    PREFERENCES: 'chart_preferences',
    USER_CONFIG: 'chart_user_config'
  },

  THEME_TYPES: {
    DARK: 'dark',
    LIGHT: 'light',
    CUSTOM: 'custom'
  },

  LAYOUT_TYPES: {
    SINGLE: 'single',
    MULTI_PANEL: 'multi_panel',
    RESPONSIVE: 'responsive'
  },

  CHART_TYPES: {
    LINE: 'line',
    CANDLESTICK: 'candlestick',
    BAR: 'bar',
    AREA: 'area',
    HISTOGRAM: 'histogram'
  },

  TIMEFRAMES: {
    '1m': '1m',
    '5m': '5m',
    '15m': '15m',
    '1h': '1h',
    '4h': '4h',
    '1d': '1d',
    '1w': '1w',
    '1M': '1M'
  }
};

/**
 * Theme Management Class
 * Handles dark/light theme configurations and custom color schemes
 */
export class ThemeManager {
  constructor() {
    this.themes = new Map();
    this.currentTheme = null;
    this.initializeDefaultThemes();
    this.loadPersistedThemes();
  }

  /**
   * Initialize default themes
   */
  initializeDefaultThemes() {
    const defaultThemes = {
      [CONFIG_CONSTANTS.THEME_TYPES.DARK]: {
        name: 'Dark Theme',
        type: CONFIG_CONSTANTS.THEME_TYPES.DARK,
        colors: {
          background: '#1a1a1a',
          text: '#ffffff',
          grid: '#333333',
          upCandle: '#26a69a',
          downCandle: '#ef5350',
          upCandleBorder: '#26a69a',
          downCandleBorder: '#ef5350',
          volumeUp: '#26a69a',
          volumeDown: '#ef5350',
          crosshair: '#ffffff',
          tooltipBackground: '#2a2a2a',
          tooltipText: '#ffffff'
        },
        settings: {
          gridOpacity: 0.3,
          textSize: 12,
          showGrid: true,
          showCrosshair: true
        }
      },
      [CONFIG_CONSTANTS.THEME_TYPES.LIGHT]: {
        name: 'Light Theme',
        type: CONFIG_CONSTANTS.THEME_TYPES.LIGHT,
        colors: {
          background: '#ffffff',
          text: '#000000',
          grid: '#e0e0e0',
          upCandle: '#26a69a',
          downCandle: '#ef5350',
          upCandleBorder: '#26a69a',
          downCandleBorder: '#ef5350',
          volumeUp: '#26a69a',
          volumeDown: '#ef5350',
          crosshair: '#000000',
          tooltipBackground: '#ffffff',
          tooltipText: '#000000'
        },
        settings: {
          gridOpacity: 0.2,
          textSize: 12,
          showGrid: true,
          showCrosshair: true
        }
      }
    };

    Object.entries(defaultThemes).forEach(([key, theme]) => {
      this.themes.set(key, theme);
    });
  }

  /**
   * Load persisted themes from localStorage
   */
  loadPersistedThemes() {
    try {
      const stored = localStorage.getItem(CONFIG_CONSTANTS.STORAGE_KEYS.THEMES);
      if (stored) {
        const parsedThemes = JSON.parse(stored);
        Object.entries(parsedThemes).forEach(([key, theme]) => {
          this.themes.set(key, theme);
        });
      }

      // Load current theme preference
      const currentThemeKey = localStorage.getItem(`${CONFIG_CONSTANTS.STORAGE_KEYS.THEMES}_current`);
      if (currentThemeKey && this.themes.has(currentThemeKey)) {
        this.currentTheme = this.themes.get(currentThemeKey);
      } else {
        this.currentTheme = this.themes.get(CONFIG_CONSTANTS.THEME_TYPES.DARK);
      }
    } catch (error) {
      console.warn('Error loading persisted themes:', error);
      this.currentTheme = this.themes.get(CONFIG_CONSTANTS.THEME_TYPES.DARK);
    }
  }

  /**
   * Save themes to localStorage
   */
  savePersistedThemes() {
    try {
      const themesObj = Object.fromEntries(this.themes);
      localStorage.setItem(CONFIG_CONSTANTS.STORAGE_KEYS.THEMES, JSON.stringify(themesObj));
      if (this.currentTheme) {
        localStorage.setItem(`${CONFIG_CONSTANTS.STORAGE_KEYS.THEMES}_current`, this.currentTheme.type);
      }
    } catch (error) {
      console.error('Error saving themes to localStorage:', error);
    }
  }

  /**
   * Get current theme
   * @returns {Object} Current theme configuration
   */
  getCurrentTheme() {
    return this.currentTheme;
  }

  /**
   * Set current theme
   * @param {string} themeKey - Theme key to set as current
   * @returns {boolean} Success status
   */
  setCurrentTheme(themeKey) {
    if (this.themes.has(themeKey)) {
      this.currentTheme = this.themes.get(themeKey);
      this.savePersistedThemes();
      return true;
    }
    return false;
  }

  /**
   * Create custom theme
   * @param {string} name - Theme name
   * @param {Object} colors - Color configuration
   * @param {Object} settings - Theme settings
   * @returns {string} Theme key
   */
  createCustomTheme(name, colors, settings = {}) {
    const themeKey = `${CONFIG_CONSTANTS.THEME_TYPES.CUSTOM}_${Date.now()}`;
    const theme = {
      name,
      type: themeKey,
      colors: { ...colors },
      settings: { ...settings }
    };

    this.themes.set(themeKey, theme);
    this.savePersistedThemes();
    return themeKey;
  }

  /**
   * Update existing theme
   * @param {string} themeKey - Theme key to update
   * @param {Object} updates - Updates to apply
   * @returns {boolean} Success status
   */
  updateTheme(themeKey, updates) {
    if (!this.themes.has(themeKey)) {
      return false;
    }

    const theme = this.themes.get(themeKey);
    const updatedTheme = {
      ...theme,
      ...updates,
      colors: { ...theme.colors, ...(updates.colors || {}) },
      settings: { ...theme.settings, ...(updates.settings || {}) }
    };

    this.themes.set(themeKey, updatedTheme);
    this.savePersistedThemes();
    return true;
  }

  /**
   * Delete custom theme
   * @param {string} themeKey - Theme key to delete
   * @returns {boolean} Success status
   */
  deleteTheme(themeKey) {
    if (!this.themes.has(themeKey) || themeKey === CONFIG_CONSTANTS.THEME_TYPES.DARK || themeKey === CONFIG_CONSTANTS.THEME_TYPES.LIGHT) {
      return false;
    }

    this.themes.delete(themeKey);
    this.savePersistedThemes();
    return true;
  }

  /**
   * Get all themes
   * @returns {Array} Array of theme objects
   */
  getAllThemes() {
    return Array.from(this.themes.values());
  }

  /**
   * Get theme by key
   * @param {string} themeKey - Theme key
   * @returns {Object} Theme configuration
   */
  getTheme(themeKey) {
    return this.themes.get(themeKey);
  }

  /**
   * Export theme configuration
   * @param {string} themeKey - Theme key to export
   * @returns {Object} Exported theme configuration
   */
  exportTheme(themeKey) {
    const theme = this.themes.get(themeKey);
    if (!theme) {
      throw new Error(`Theme ${themeKey} not found`);
    }

    return {
      ...theme,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };
  }

  /**
   * Import theme configuration
   * @param {Object} themeConfig - Theme configuration to import
   * @returns {string} Imported theme key
   */
  importTheme(themeConfig) {
    const { name, colors, settings } = themeConfig;
    if (!name || !colors) {
      throw new Error('Invalid theme configuration');
    }

    return this.createCustomTheme(name, colors, settings);
  }
}

/**
 * Layout Management Class
 * Handles chart layout configurations and responsive layouts
 */
export class LayoutManager {
  constructor() {
    this.layouts = new Map();
    this.currentLayout = null;
    this.initializeDefaultLayouts();
    this.loadPersistedLayouts();
  }

  /**
   * Initialize default layouts
   */
  initializeDefaultLayouts() {
    const defaultLayouts = {
      [CONFIG_CONSTANTS.LAYOUT_TYPES.SINGLE]: {
        name: 'Single Panel',
        type: CONFIG_CONSTANTS.LAYOUT_TYPES.SINGLE,
        panels: [
          {
            id: 'main',
            height: 100,
            chartType: CONFIG_CONSTANTS.CHART_TYPES.CANDLESTICK,
            indicators: [],
            showVolume: true
          }
        ],
        settings: {
          responsive: false,
          minPanelHeight: 200,
          maxPanelHeight: 800
        }
      },
      [CONFIG_CONSTANTS.LAYOUT_TYPES.MULTI_PANEL]: {
        name: 'Multi Panel',
        type: CONFIG_CONSTANTS.LAYOUT_TYPES.MULTI_PANEL,
        panels: [
          {
            id: 'price',
            height: 60,
            chartType: CONFIG_CONSTANTS.CHART_TYPES.CANDLESTICK,
            indicators: ['SMA', 'EMA'],
            showVolume: false
          },
          {
            id: 'volume',
            height: 20,
            chartType: CONFIG_CONSTANTS.CHART_TYPES.HISTOGRAM,
            indicators: [],
            showVolume: false
          },
          {
            id: 'indicators',
            height: 20,
            chartType: CONFIG_CONSTANTS.CHART_TYPES.LINE,
            indicators: ['RSI', 'MACD'],
            showVolume: false
          }
        ],
        settings: {
          responsive: false,
          minPanelHeight: 150,
          maxPanelHeight: 400
        }
      },
      [CONFIG_CONSTANTS.LAYOUT_TYPES.RESPONSIVE]: {
        name: 'Responsive Layout',
        type: CONFIG_CONSTANTS.LAYOUT_TYPES.RESPONSIVE,
        panels: [
          {
            id: 'main',
            height: 70,
            chartType: CONFIG_CONSTANTS.CHART_TYPES.CANDLESTICK,
            indicators: ['SMA'],
            showVolume: true
          },
          {
            id: 'indicators',
            height: 30,
            chartType: CONFIG_CONSTANTS.CHART_TYPES.LINE,
            indicators: ['RSI'],
            showVolume: false
          }
        ],
        settings: {
          responsive: true,
          breakpoints: {
            mobile: { panels: ['main'] },
            tablet: { panels: ['main', 'indicators'] },
            desktop: { panels: ['main', 'indicators'] }
          },
          minPanelHeight: 150,
          maxPanelHeight: 600
        }
      }
    };

    Object.entries(defaultLayouts).forEach(([key, layout]) => {
      this.layouts.set(key, layout);
    });
  }

  /**
   * Load persisted layouts from localStorage
   */
  loadPersistedLayouts() {
    try {
      const stored = localStorage.getItem(CONFIG_CONSTANTS.STORAGE_KEYS.LAYOUTS);
      if (stored) {
        const parsedLayouts = JSON.parse(stored);
        Object.entries(parsedLayouts).forEach(([key, layout]) => {
          this.layouts.set(key, layout);
        });
      }

      // Load current layout preference
      const currentLayoutKey = localStorage.getItem(`${CONFIG_CONSTANTS.STORAGE_KEYS.LAYOUTS}_current`);
      if (currentLayoutKey && this.layouts.has(currentLayoutKey)) {
        this.currentLayout = this.layouts.get(currentLayoutKey);
      } else {
        this.currentLayout = this.layouts.get(CONFIG_CONSTANTS.LAYOUT_TYPES.SINGLE);
      }
    } catch (error) {
      console.warn('Error loading persisted layouts:', error);
      this.currentLayout = this.layouts.get(CONFIG_CONSTANTS.LAYOUT_TYPES.SINGLE);
    }
  }

  /**
   * Save layouts to localStorage
   */
  savePersistedLayouts() {
    try {
      const layoutsObj = Object.fromEntries(this.layouts);
      localStorage.setItem(CONFIG_CONSTANTS.STORAGE_KEYS.LAYOUTS, JSON.stringify(layoutsObj));
      if (this.currentLayout) {
        localStorage.setItem(`${CONFIG_CONSTANTS.STORAGE_KEYS.LAYOUTS}_current`, this.currentLayout.type);
      }
    } catch (error) {
      console.error('Error saving layouts to localStorage:', error);
    }
  }

  /**
   * Get current layout
   * @returns {Object} Current layout configuration
   */
  getCurrentLayout() {
    return this.currentLayout;
  }

  /**
   * Set current layout
   * @param {string} layoutKey - Layout key to set as current
   * @returns {boolean} Success status
   */
  setCurrentLayout(layoutKey) {
    if (this.layouts.has(layoutKey)) {
      this.currentLayout = this.layouts.get(layoutKey);
      this.savePersistedLayouts();
      return true;
    }
    return false;
  }

  /**
   * Create custom layout
   * @param {string} name - Layout name
   * @param {Array} panels - Panel configurations
   * @param {Object} settings - Layout settings
   * @returns {string} Layout key
   */
  createCustomLayout(name, panels, settings = {}) {
    const layoutKey = `custom_${Date.now()}`;
    const layout = {
      name,
      type: layoutKey,
      panels: [...panels],
      settings: { ...settings }
    };

    this.layouts.set(layoutKey, layout);
    this.savePersistedLayouts();
    return layoutKey;
  }

  /**
   * Update existing layout
   * @param {string} layoutKey - Layout key to update
   * @param {Object} updates - Updates to apply
   * @returns {boolean} Success status
   */
  updateLayout(layoutKey, updates) {
    if (!this.layouts.has(layoutKey)) {
      return false;
    }

    const layout = this.layouts.get(layoutKey);
    const updatedLayout = {
      ...layout,
      ...updates,
      panels: updates.panels ? [...updates.panels] : layout.panels,
      settings: { ...layout.settings, ...(updates.settings || {}) }
    };

    this.layouts.set(layoutKey, updatedLayout);
    this.savePersistedLayouts();
    return true;
  }

  /**
   * Delete custom layout
   * @param {string} layoutKey - Layout key to delete
   * @returns {boolean} Success status
   */
  deleteLayout(layoutKey) {
    if (!this.layouts.has(layoutKey) || layoutKey === CONFIG_CONSTANTS.LAYOUT_TYPES.SINGLE ||
        layoutKey === CONFIG_CONSTANTS.LAYOUT_TYPES.MULTI_PANEL || layoutKey === CONFIG_CONSTANTS.LAYOUT_TYPES.RESPONSIVE) {
      return false;
    }

    this.layouts.delete(layoutKey);
    this.savePersistedLayouts();
    return true;
  }

  /**
   * Get all layouts
   * @returns {Array} Array of layout objects
   */
  getAllLayouts() {
    return Array.from(this.layouts.values());
  }

  /**
   * Get layout by key
   * @param {string} layoutKey - Layout key
   * @returns {Object} Layout configuration
   */
  getLayout(layoutKey) {
    return this.layouts.get(layoutKey);
  }

  /**
   * Get responsive layout for screen size
   * @param {string} screenSize - Screen size (mobile, tablet, desktop)
   * @returns {Object} Responsive layout configuration
   */
  getResponsiveLayout(screenSize) {
    if (!this.currentLayout || this.currentLayout.type !== CONFIG_CONSTANTS.LAYOUT_TYPES.RESPONSIVE) {
      return this.currentLayout;
    }

    const breakpoints = this.currentLayout.settings.breakpoints;
    if (breakpoints && breakpoints[screenSize]) {
      const responsiveConfig = breakpoints[screenSize];
      return {
        ...this.currentLayout,
        panels: this.currentLayout.panels.filter(panel =>
          responsiveConfig.panels.includes(panel.id)
        )
      };
    }

    return this.currentLayout;
  }
}

/**
 * User Preferences Management Class
 * Handles user-specific chart settings and preferences
 */
export class UserPreferencesManager {
  constructor() {
    this.preferences = new Map();
    this.currentUser = 'default';
    this.initializeDefaultPreferences();
    this.loadPersistedPreferences();
  }

  /**
   * Initialize default preferences
   */
  initializeDefaultPreferences() {
    const defaultPreferences = {
      chart: {
        timeframe: '1h',
        chartType: CONFIG_CONSTANTS.CHART_TYPES.CANDLESTICK,
        showVolume: true,
        showGrid: true,
        showCrosshair: true,
        autoSave: true
      },
      indicators: {
        defaultIndicators: ['SMA', 'EMA', 'RSI'],
        showIndicators: true,
        indicatorSettings: {
          SMA: { period: 20, color: '#2962FF' },
          EMA: { period: 12, color: '#FF6B35' },
          RSI: { period: 14, overbought: 70, oversold: 30 }
        }
      },
      trading: {
        defaultQuantity: 100,
        riskPerTrade: 2,
        maxOpenTrades: 5,
        stopLossType: 'percentage',
        takeProfitType: 'percentage'
      },
      display: {
        language: 'en',
        timezone: 'UTC',
        dateFormat: 'YYYY-MM-DD',
        numberFormat: 'US',
        theme: CONFIG_CONSTANTS.THEME_TYPES.DARK,
        layout: CONFIG_CONSTANTS.LAYOUT_TYPES.SINGLE
      },
      notifications: {
        enabled: true,
        soundEnabled: false,
        priceAlerts: true,
        indicatorAlerts: true,
        tradeAlerts: true
      }
    };

    this.preferences.set('default', defaultPreferences);
  }

  /**
   * Load persisted preferences from localStorage
   */
  loadPersistedPreferences() {
    try {
      const stored = localStorage.getItem(CONFIG_CONSTANTS.STORAGE_KEYS.PREFERENCES);
      if (stored) {
        const parsedPreferences = JSON.parse(stored);
        Object.entries(parsedPreferences).forEach(([key, preferences]) => {
          this.preferences.set(key, preferences);
        });
      }

      // Load current user preference
      const currentUser = localStorage.getItem(`${CONFIG_CONSTANTS.STORAGE_KEYS.PREFERENCES}_user`);
      if (currentUser && this.preferences.has(currentUser)) {
        this.currentUser = currentUser;
      }
    } catch (error) {
      console.warn('Error loading persisted preferences:', error);
    }
  }

  /**
   * Save preferences to localStorage
   */
  savePersistedPreferences() {
    try {
      const preferencesObj = Object.fromEntries(this.preferences);
      localStorage.setItem(CONFIG_CONSTANTS.STORAGE_KEYS.PREFERENCES, JSON.stringify(preferencesObj));
      localStorage.setItem(`${CONFIG_CONSTANTS.STORAGE_KEYS.PREFERENCES}_user`, this.currentUser);
    } catch (error) {
      console.error('Error saving preferences to localStorage:', error);
    }
  }

  /**
   * Get current user preferences
   * @returns {Object} Current user preferences
   */
  getCurrentPreferences() {
    return this.preferences.get(this.currentUser) || this.preferences.get('default');
  }

  /**
   * Set current user
   * @param {string} userKey - User key
   * @returns {boolean} Success status
   */
  setCurrentUser(userKey) {
    if (this.preferences.has(userKey)) {
      this.currentUser = userKey;
      this.savePersistedPreferences();
      return true;
    }
    return false;
  }

  /**
   * Create user profile
   * @param {string} userKey - User key
   * @param {Object} preferences - User preferences
   * @returns {boolean} Success status
   */
  createUserProfile(userKey, preferences = {}) {
    if (this.preferences.has(userKey)) {
      return false;
    }

    const defaultPrefs = this.preferences.get('default');
    const userPreferences = {
      ...defaultPrefs,
      ...preferences,
      userKey,
      createdAt: new Date().toISOString()
    };

    this.preferences.set(userKey, userPreferences);
    this.savePersistedPreferences();
    return true;
  }

  /**
   * Update user preferences
   * @param {Object} updates - Updates to apply
   * @param {string} userKey - User key (optional, uses current user if not provided)
   * @returns {boolean} Success status
   */
  updatePreferences(updates, userKey = null) {
    const targetUser = userKey || this.currentUser;
    if (!this.preferences.has(targetUser)) {
      return false;
    }

    const currentPrefs = this.preferences.get(targetUser);
    const updatedPrefs = {
      ...currentPrefs,
      ...updates,
      chart: { ...currentPrefs.chart, ...(updates.chart || {}) },
      indicators: { ...currentPrefs.indicators, ...(updates.indicators || {}) },
      trading: { ...currentPrefs.trading, ...(updates.trading || {}) },
      display: { ...currentPrefs.display, ...(updates.display || {}) },
      notifications: { ...currentPrefs.notifications, ...(updates.notifications || {}) },
      updatedAt: new Date().toISOString()
    };

    this.preferences.set(targetUser, updatedPrefs);
    this.savePersistedPreferences();
    return true;
  }

  /**
   * Delete user profile
   * @param {string} userKey - User key to delete
   * @returns {boolean} Success status
   */
  deleteUserProfile(userKey) {
    if (userKey === 'default' || !this.preferences.has(userKey)) {
      return false;
    }

    this.preferences.delete(userKey);
    this.savePersistedPreferences();

    if (this.currentUser === userKey) {
      this.currentUser = 'default';
      this.savePersistedPreferences();
    }

    return true;
  }

  /**
   * Get all user profiles
   * @returns {Array} Array of user profile objects
   */
  getAllUserProfiles() {
    return Array.from(this.preferences.entries()).map(([key, prefs]) => ({
      userKey: key,
      ...prefs
    }));
  }

  /**
   * Export user preferences
   * @param {string} userKey - User key to export
   * @returns {Object} Exported preferences
   */
  exportPreferences(userKey = null) {
    const targetUser = userKey || this.currentUser;
    const preferences = this.preferences.get(targetUser);
    if (!preferences) {
      throw new Error(`User ${targetUser} not found`);
    }

    return {
      ...preferences,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };
  }

  /**
   * Import user preferences
   * @param {Object} preferencesData - Preferences data to import
   * @param {string} userKey - User key to import to
   * @returns {boolean} Success status
   */
  importPreferences(preferencesData, userKey) {
    try {
      const { chart, indicators, trading, display, notifications } = preferencesData;

      if (!chart || !indicators || !trading || !display || !notifications) {
        throw new Error('Invalid preferences data structure');
      }

      return this.createUserProfile(userKey, preferencesData);
    } catch (error) {
      console.error('Error importing preferences:', error);
      return false;
    }
  }
}

/**
 * Configuration Validation Utilities
 * Validates and sanitizes configuration objects
 */
export class ConfigurationValidator {
  /**
   * Validate theme configuration
   * @param {Object} theme - Theme configuration to validate
   * @returns {Object} Validation result
   */
  static validateTheme(theme) {
    const errors = [];
    const warnings = [];

    // Required fields
    if (!theme.name || typeof theme.name !== 'string') {
      errors.push('Theme name is required and must be a string');
    }

    if (!theme.colors || typeof theme.colors !== 'object') {
      errors.push('Theme colors configuration is required');
    } else {
      // Validate color fields
      const requiredColors = ['background', 'text', 'upCandle', 'downCandle'];
      requiredColors.forEach(color => {
        if (!theme.colors[color]) {
          errors.push(`Required color '${color}' is missing`);
        }
      });

      // Validate color formats
      Object.entries(theme.colors).forEach(([key, value]) => {
        if (value && !this.isValidColor(value)) {
          warnings.push(`Color '${key}' format may be invalid: ${value}`);
        }
      });
    }

    // Validate settings
    if (theme.settings) {
      if (typeof theme.settings.gridOpacity !== 'undefined' &&
          (theme.settings.gridOpacity < 0 || theme.settings.gridOpacity > 1)) {
        errors.push('Grid opacity must be between 0 and 1');
      }

      if (typeof theme.settings.textSize !== 'undefined' &&
          (theme.settings.textSize < 8 || theme.settings.textSize > 24)) {
        warnings.push('Text size should be between 8 and 24 pixels');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate layout configuration
   * @param {Object} layout - Layout configuration to validate
   * @returns {Object} Validation result
   */
  static validateLayout(layout) {
    const errors = [];
    const warnings = [];

    // Required fields
    if (!layout.name || typeof layout.name !== 'string') {
      errors.push('Layout name is required and must be a string');
    }

    if (!layout.panels || !Array.isArray(layout.panels) || layout.panels.length === 0) {
      errors.push('Layout must have at least one panel');
    } else {
      // Validate panels
      layout.panels.forEach((panel, index) => {
        if (!panel.id || typeof panel.id !== 'string') {
          errors.push(`Panel ${index} must have a valid ID`);
        }

        if (typeof panel.height !== 'number' || panel.height <= 0 || panel.height > 100) {
          errors.push(`Panel ${index} height must be between 1 and 100`);
        }

        if (!panel.chartType || !Object.values(CONFIG_CONSTANTS.CHART_TYPES).includes(panel.chartType)) {
          errors.push(`Panel ${index} must have a valid chart type`);
        }
      });

      // Validate total height
      const totalHeight = layout.panels.reduce((sum, panel) => sum + panel.height, 0);
      if (totalHeight !== 100) {
        warnings.push(`Total panel height should equal 100%, currently ${totalHeight}%`);
      }
    }

    // Validate settings
    if (layout.settings) {
      if (layout.settings.responsive && !layout.settings.breakpoints) {
        warnings.push('Responsive layout should have breakpoint configurations');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate user preferences
   * @param {Object} preferences - Preferences to validate
   * @returns {Object} Validation result
   */
  static validatePreferences(preferences) {
    const errors = [];
    const warnings = [];

    // Validate chart preferences
    if (preferences.chart) {
      if (!Object.values(CONFIG_CONSTANTS.TIMEFRAMES).includes(preferences.chart.timeframe)) {
        errors.push('Invalid timeframe specified');
      }

      if (!Object.values(CONFIG_CONSTANTS.CHART_TYPES).includes(preferences.chart.chartType)) {
        errors.push('Invalid chart type specified');
      }
    }

    // Validate trading preferences
    if (preferences.trading) {
      if (preferences.trading.defaultQuantity <= 0) {
        errors.push('Default quantity must be greater than 0');
      }

      if (preferences.trading.riskPerTrade <= 0 || preferences.trading.riskPerTrade > 100) {
        errors.push('Risk per trade must be between 0 and 100');
      }

      if (preferences.trading.maxOpenTrades < 1) {
        errors.push('Maximum open trades must be at least 1');
      }
    }

    // Validate display preferences
    if (preferences.display) {
      if (!['en', 'es', 'fr', 'de', 'ja', 'zh'].includes(preferences.display.language)) {
        warnings.push('Unsupported language, defaulting to English');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Sanitize theme configuration
   * @param {Object} theme - Theme configuration to sanitize
   * @returns {Object} Sanitized theme configuration
   */
  static sanitizeTheme(theme) {
    const sanitized = { ...theme };

    // Sanitize colors
    if (sanitized.colors) {
      Object.keys(sanitized.colors).forEach(key => {
        if (!this.isValidColor(sanitized.colors[key])) {
          // Replace invalid colors with defaults
          const defaults = {
            background: '#1a1a1a',
            text: '#ffffff',
            upCandle: '#26a69a',
            downCandle: '#ef5350'
          };
          sanitized.colors[key] = defaults[key] || '#000000';
        }
      });
    }

    // Sanitize settings
    if (sanitized.settings) {
      if (typeof sanitized.settings.gridOpacity === 'number') {
        sanitized.settings.gridOpacity = Math.max(0, Math.min(1, sanitized.settings.gridOpacity));
      }

      if (typeof sanitized.settings.textSize === 'number') {
        sanitized.settings.textSize = Math.max(8, Math.min(24, sanitized.settings.textSize));
      }
    }

    return sanitized;
  }

  /**
   * Sanitize layout configuration
   * @param {Object} layout - Layout configuration to sanitize
   * @returns {Object} Sanitized layout configuration
   */
  static sanitizeLayout(layout) {
    const sanitized = { ...layout };

    // Sanitize panels
    if (sanitized.panels && Array.isArray(sanitized.panels)) {
      sanitized.panels = sanitized.panels.map(panel => ({
        ...panel,
        height: Math.max(1, Math.min(100, panel.height || 50)),
        chartType: Object.values(CONFIG_CONSTANTS.CHART_TYPES).includes(panel.chartType)
          ? panel.chartType
          : CONFIG_CONSTANTS.CHART_TYPES.CANDLESTICK
      }));
    }

    return sanitized;
  }

  /**
   * Sanitize preferences
   * @param {Object} preferences - Preferences to sanitize
   * @returns {Object} Sanitized preferences
   */
  static sanitizePreferences(preferences) {
    const sanitized = { ...preferences };

    // Sanitize chart preferences
    if (sanitized.chart) {
      sanitized.chart.timeframe = Object.values(CONFIG_CONSTANTS.TIMEFRAMES).includes(sanitized.chart.timeframe)
        ? sanitized.chart.timeframe
        : '1h';

      sanitized.chart.chartType = Object.values(CONFIG_CONSTANTS.CHART_TYPES).includes(sanitized.chart.chartType)
        ? sanitized.chart.chartType
        : CONFIG_CONSTANTS.CHART_TYPES.CANDLESTICK;
    }

    // Sanitize trading preferences
    if (sanitized.trading) {
      sanitized.trading.defaultQuantity = Math.max(1, sanitized.trading.defaultQuantity || 100);
      sanitized.trading.riskPerTrade = Math.max(0.1, Math.min(100, sanitized.trading.riskPerTrade || 2));
      sanitized.trading.maxOpenTrades = Math.max(1, sanitized.trading.maxOpenTrades || 5);
    }

    return sanitized;
  }

  /**
   * Check if color is valid
   * @param {string} color - Color to validate
   * @returns {boolean} Is valid color
   */
  static isValidColor(color) {
    if (!color || typeof color !== 'string') {
      return false;
    }

    // Check hex colors
    if (color.match(/^#[0-9A-Fa-f]{6}$/) || color.match(/^#[0-9A-Fa-f]{3}$/)) {
      return true;
    }

    // Check rgb/rgba colors
    if (color.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/)) {
      return true;
    }

    if (color.match(/^rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)$/)) {
      return true;
    }

    // Check named colors (basic set)
    const namedColors = ['black', 'white', 'red', 'green', 'blue', 'yellow', 'purple', 'orange', 'gray', 'brown'];
    return namedColors.includes(color.toLowerCase());
  }

  /**
   * Get default configuration fallbacks
   * @param {string} configType - Type of configuration
   * @returns {Object} Default configuration
   */
  static getDefaultConfig(configType) {
    const defaults = {
      theme: {
        name: 'Default Theme',
        type: CONFIG_CONSTANTS.THEME_TYPES.DARK,
        colors: {
          background: '#1a1a1a',
          text: '#ffffff',
          grid: '#333333',
          upCandle: '#26a69a',
          downCandle: '#ef5350',
          upCandleBorder: '#26a69a',
          downCandleBorder: '#ef5350',
          volumeUp: '#26a69a',
          volumeDown: '#ef5350',
          crosshair: '#ffffff',
          tooltipBackground: '#2a2a2a',
          tooltipText: '#ffffff'
        },
        settings: {
          gridOpacity: 0.3,
          textSize: 12,
          showGrid: true,
          showCrosshair: true
        }
      },
      layout: {
        name: 'Default Layout',
        type: CONFIG_CONSTANTS.LAYOUT_TYPES.SINGLE,
        panels: [
          {
            id: 'main',
            height: 100,
            chartType: CONFIG_CONSTANTS.CHART_TYPES.CANDLESTICK,
            indicators: [],
            showVolume: true
          }
        ],
        settings: {
          responsive: false,
          minPanelHeight: 200,
          maxPanelHeight: 800
        }
      },
      preferences: {
        chart: {
          timeframe: '1h',
          chartType: CONFIG_CONSTANTS.CHART_TYPES.CANDLESTICK,
          showVolume: true,
          showGrid: true,
          showCrosshair: true,
          autoSave: true
        },
        indicators: {
          defaultIndicators: ['SMA', 'EMA', 'RSI'],
          showIndicators: true,
          indicatorSettings: {
            SMA: { period: 20, color: '#2962FF' },
            EMA: { period: 12, color: '#FF6B35' },
            RSI: { period: 14, overbought: 70, oversold: 30 }
          }
        },
        trading: {
          defaultQuantity: 100,
          riskPerTrade: 2,
          maxOpenTrades: 5,
          stopLossType: 'percentage',
          takeProfitType: 'percentage'
        },
        display: {
          language: 'en',
          timezone: 'UTC',
          dateFormat: 'YYYY-MM-DD',
          numberFormat: 'US',
          theme: CONFIG_CONSTANTS.THEME_TYPES.DARK,
          layout: CONFIG_CONSTANTS.LAYOUT_TYPES.SINGLE
        },
        notifications: {
          enabled: true,
          soundEnabled: false,
          priceAlerts: true,
          indicatorAlerts: true,
          tradeAlerts: true
        }
      }
    };

    return defaults[configType] || {};
  }
}

/**
 * Main Chart Configuration Manager
 * Orchestrates all configuration management components
 */
export class ChartConfigManager {
  constructor() {
    this.themeManager = new ThemeManager();
    this.layoutManager = new LayoutManager();
    this.preferencesManager = new UserPreferencesManager();
    this.validator = ConfigurationValidator;
    this.initialized = false;
  }

  /**
   * Initialize the configuration manager
   * @returns {Promise} Initialization promise
   */
  async initialize() {
    try {
      // All managers are initialized in constructor
      this.initialized = true;
      console.log('ChartConfigManager initialized successfully');
      return { success: true };
    } catch (error) {
      console.error('Error initializing ChartConfigManager:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get complete configuration snapshot
   * @returns {Object} Complete configuration
   */
  getCompleteConfiguration() {
    return {
      theme: this.themeManager.getCurrentTheme(),
      layout: this.layoutManager.getCurrentLayout(),
      preferences: this.preferencesManager.getCurrentPreferences(),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Apply configuration from object
   * @param {Object} config - Configuration to apply
   * @returns {Object} Application result
   */
  applyConfiguration(config) {
    const results = {
      success: true,
      applied: [],
      errors: []
    };

    try {
      // Apply theme
      if (config.theme) {
        const themeResult = this.themeManager.setCurrentTheme(config.theme.type);
        if (themeResult) {
          results.applied.push('theme');
        } else {
          results.errors.push('Failed to apply theme');
          results.success = false;
        }
      }

      // Apply layout
      if (config.layout) {
        const layoutResult = this.layoutManager.setCurrentLayout(config.layout.type);
        if (layoutResult) {
          results.applied.push('layout');
        } else {
          results.errors.push('Failed to apply layout');
          results.success = false;
        }
      }

      // Apply preferences
      if (config.preferences) {
        const preferencesResult = this.preferencesManager.updatePreferences(config.preferences);
        if (preferencesResult) {
          results.applied.push('preferences');
        } else {
          results.errors.push('Failed to apply preferences');
          results.success = false;
        }
      }

    } catch (error) {
      results.success = false;
      results.errors.push(error.message);
    }

    return results;
  }

  /**
   * Export complete configuration
   * @returns {Object} Exported configuration
   */
  exportConfiguration() {
    return {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      configuration: this.getCompleteConfiguration()
    };
  }

  /**
   * Import complete configuration
   * @param {Object} configData - Configuration data to import
   * @returns {Object} Import result
   */
  importConfiguration(configData) {
    const results = {
      success: true,
      imported: [],
      errors: []
    };

    try {
      const { configuration } = configData;

      if (!configuration) {
        throw new Error('Invalid configuration data');
      }

      // Validate configuration before applying
      if (configuration.theme) {
        const themeValidation = this.validator.validateTheme(configuration.theme);
        if (!themeValidation.isValid) {
          results.errors.push(`Theme validation failed: ${themeValidation.errors.join(', ')}`);
          results.success = false;
        }
      }

      if (configuration.layout) {
        const layoutValidation = this.validator.validateLayout(configuration.layout);
        if (!layoutValidation.isValid) {
          results.errors.push(`Layout validation failed: ${layoutValidation.errors.join(', ')}`);
          results.success = false;
        }
      }

      if (configuration.preferences) {
        const preferencesValidation = this.validator.validatePreferences(configuration.preferences);
        if (!preferencesValidation.isValid) {
          results.errors.push(`Preferences validation failed: ${preferencesValidation.errors.join(', ')}`);
          results.success = false;
        }
      }

      // Apply configuration if validation passed
      if (results.success) {
        const applyResult = this.applyConfiguration(configuration);
        results.applied = applyResult.applied;
        results.errors.push(...applyResult.errors);
        results.success = applyResult.success;
      }

    } catch (error) {
      results.success = false;
      results.errors.push(error.message);
    }

    return results;
  }

  /**
   * Reset to default configuration
   * @returns {Object} Reset result
   */
  resetToDefaults() {
    try {
      this.themeManager.setCurrentTheme(CONFIG_CONSTANTS.THEME_TYPES.DARK);
      this.layoutManager.setCurrentLayout(CONFIG_CONSTANTS.LAYOUT_TYPES.SINGLE);
      this.preferencesManager.setCurrentUser('default');

      return {
        success: true,
        message: 'Configuration reset to defaults'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get configuration summary
   * @returns {Object} Configuration summary
   */
  getConfigurationSummary() {
    const config = this.getCompleteConfiguration();

    return {
      theme: {
        name: config.theme?.name || 'Unknown',
        type: config.theme?.type || 'Unknown'
      },
      layout: {
        name: config.layout?.name || 'Unknown',
        type: config.layout?.type || 'Unknown',
        panels: config.layout?.panels?.length || 0
      },
      preferences: {
        user: this.preferencesManager.currentUser,
        timeframe: config.preferences?.chart?.timeframe || 'Unknown',
        chartType: config.preferences?.chart?.chartType || 'Unknown'
      },
      lastUpdated: config.timestamp
    };
  }
}

// Utility functions
export const ConfigUtils = {
  /**
   * Deep clone configuration object
   * @param {Object} config - Configuration to clone
   * @returns {Object} Cloned configuration
   */
  deepClone: (config) => {
    return JSON.parse(JSON.stringify(config));
  },

  /**
   * Merge configurations with priority
   * @param {Object} baseConfig - Base configuration
   * @param {Object} overrideConfig - Override configuration
   * @returns {Object} Merged configuration
   */
  mergeConfigs: (baseConfig, overrideConfig) => {
    const merged = ConfigUtils.deepClone(baseConfig);

    function mergeRecursive(target, source) {
      Object.keys(source).forEach(key => {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
          if (!target[key]) target[key] = {};
          mergeRecursive(target[key], source[key]);
        } else {
          target[key] = source[key];
        }
      });
    }

    mergeRecursive(merged, overrideConfig);
    return merged;
  },

  /**
   * Generate configuration hash
   * @param {Object} config - Configuration to hash
   * @returns {string} Configuration hash
   */
  generateConfigHash: (config) => {
    const configStr = JSON.stringify(config, Object.keys(config).sort());
    let hash = 0;
    for (let i = 0; i < configStr.length; i++) {
      const char = configStr.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  },

  /**
   * Validate configuration completeness
   * @param {Object} config - Configuration to validate
   * @returns {Object} Validation result
   */
  validateConfigCompleteness: (config) => {
    const requiredSections = ['theme', 'layout', 'preferences'];
    const missing = [];
    const incomplete = [];

    requiredSections.forEach(section => {
      if (!config[section]) {
        missing.push(section);
      } else {
        // Check for required fields in each section
        switch (section) {
          case 'theme':
            if (!config.theme.colors || !config.theme.settings) {
              incomplete.push(`${section} (missing colors or settings)`);
            }
            break;
          case 'layout':
            if (!config.layout.panels) {
              incomplete.push(`${section} (missing panels)`);
            }
            break;
          case 'preferences':
            if (!config.preferences.chart) {
              incomplete.push(`${section} (missing chart settings)`);
            }
            break;
        }
      }
    });

    return {
      isComplete: missing.length === 0 && incomplete.length === 0,
      missing,
      incomplete
    };
  }
};

// Export default configuration manager instance
export const chartConfigManager = new ChartConfigManager();

export default {
  ChartConfigManager,
  ThemeManager,
  LayoutManager,
  UserPreferencesManager,
  ConfigurationValidator,
  ConfigUtils,
  chartConfigManager,
  CONFIG_CONSTANTS
};