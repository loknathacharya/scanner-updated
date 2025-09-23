import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Slider,
} from '@mui/material';
import {
  Notifications,
  NotificationsOff,
  Add,
  Delete,
  Edit,
  ExpandMore,
  PlayArrow,
  Pause,
  VolumeUp,
  VolumeOff,
} from '@mui/icons-material';

const ALERT_CONDITIONS = {
  ABOVE: 'above',
  BELOW: 'below',
  CROSS_ABOVE: 'cross_above',
  CROSS_BELOW: 'cross_below',
  PERCENT_ABOVE: 'percent_above',
  PERCENT_BELOW: 'percent_below',
  CHANGE_PERCENT: 'change_percent',
};

const ALERT_TYPES = {
  PRICE: 'price',
  VOLUME: 'volume',
  INDICATOR: 'indicator',
  PATTERN: 'pattern',
};

const NOTIFICATION_METHODS = {
  VISUAL: 'visual',
  AUDIO: 'audio',
  EMAIL: 'email',
  SMS: 'sms',
  WEBHOOK: 'webhook',
};

const PriceAlertsManager = ({
  symbol,
  currentPrice,
  onAlertCreate,
  onAlertUpdate,
  onAlertDelete,
  onAlertTrigger,
  className = '',
}) => {
  const [alerts, setAlerts] = useState([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingAlert, setEditingAlert] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // New alert form state
  const [newAlert, setNewAlert] = useState({
    type: ALERT_TYPES.PRICE,
    condition: ALERT_CONDITIONS.ABOVE,
    value: '',
    message: '',
    notificationMethods: [NOTIFICATION_METHODS.VISUAL],
    sound: true,
    repeat: false,
    cooldown: 0,
    expiration: null,
  });

  // Load alerts from localStorage or API
  useEffect(() => {
    loadAlerts();
  }, [symbol]);

  const loadAlerts = useCallback(() => {
    try {
      const savedAlerts = localStorage.getItem(`price_alerts_${symbol}`);
      if (savedAlerts) {
        const parsedAlerts = JSON.parse(savedAlerts);
        setAlerts(parsedAlerts);
      }
    } catch (error) {
      console.error('Failed to load alerts:', error);
    }
  }, [symbol]);

  const saveAlerts = useCallback((alertsToSave) => {
    try {
      localStorage.setItem(`price_alerts_${symbol}`, JSON.stringify(alertsToSave));
      setAlerts(alertsToSave);
    } catch (error) {
      console.error('Failed to save alerts:', error);
    }
  }, [symbol]);

  // Check for triggered alerts
  useEffect(() => {
    if (!currentPrice || !notificationsEnabled) return;

    const triggeredAlerts = alerts.filter(alert => {
      if (alert.triggered || alert.paused) return false;

      const now = new Date();
      if (alert.expiration && now > new Date(alert.expiration)) return false;
      if (alert.cooldown && alert.lastTriggered) {
        const cooldownMs = alert.cooldown * 60 * 1000;
        if (now - new Date(alert.lastTriggered) < cooldownMs) return false;
      }

      return checkAlertCondition(alert, currentPrice);
    });

    triggeredAlerts.forEach(alert => {
      triggerAlert(alert);
    });
  }, [currentPrice, alerts, notificationsEnabled]);

  const checkAlertCondition = useCallback((alert, price) => {
    const alertValue = parseFloat(alert.value);

    switch (alert.condition) {
      case ALERT_CONDITIONS.ABOVE:
        return price >= alertValue;
      case ALERT_CONDITIONS.BELOW:
        return price <= alertValue;
      case ALERT_CONDITIONS.CROSS_ABOVE:
        return price >= alertValue && !alert.lastPrice || alert.lastPrice < alertValue;
      case ALERT_CONDITIONS.CROSS_BELOW:
        return price <= alertValue && !alert.lastPrice || alert.lastPrice > alertValue;
      case ALERT_CONDITIONS.PERCENT_ABOVE:
        return price >= (alertValue / 100 + 1) * price;
      case ALERT_CONDITIONS.PERCENT_BELOW:
        return price <= (1 - alertValue / 100) * price;
      default:
        return false;
    }
  }, []);

  const triggerAlert = useCallback((alert) => {
    const updatedAlert = {
      ...alert,
      triggered: true,
      triggeredAt: new Date().toISOString(),
      lastTriggered: new Date().toISOString(),
      triggerCount: (alert.triggerCount || 0) + 1,
    };

    // Update alerts list
    const updatedAlerts = alerts.map(a => a.id === alert.id ? updatedAlert : a);
    saveAlerts(updatedAlerts);

    // Play sound if enabled
    if (soundEnabled && alert.sound) {
      playAlertSound();
    }

    // Show notification
    if (notificationsEnabled) {
      showNotification(alert);
    }

    // Call external trigger handler
    if (onAlertTrigger) {
      onAlertTrigger(updatedAlert);
    }
  }, [alerts, soundEnabled, notificationsEnabled, onAlertTrigger, saveAlerts]);

  const playAlertSound = () => {
    try {
      // Create a simple beep sound
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.error('Failed to play alert sound:', error);
    }
  };

  const showNotification = (alert) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`${symbol} Alert`, {
        body: alert.message || `${alert.condition} ${alert.value}`,
        icon: '/favicon.ico',
        tag: alert.id,
      });
    }
  };

  const handleCreateAlert = useCallback(() => {
    const alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      symbol,
      ...newAlert,
      createdAt: new Date().toISOString(),
      triggered: false,
      paused: false,
      triggerCount: 0,
    };

    const updatedAlerts = [...alerts, alert];
    saveAlerts(updatedAlerts);

    if (onAlertCreate) {
      onAlertCreate(alert);
    }

    // Reset form
    setNewAlert({
      type: ALERT_TYPES.PRICE,
      condition: ALERT_CONDITIONS.ABOVE,
      value: '',
      message: '',
      notificationMethods: [NOTIFICATION_METHODS.VISUAL],
      sound: true,
      repeat: false,
      cooldown: 0,
      expiration: null,
    });

    setIsCreateDialogOpen(false);
  }, [newAlert, alerts, symbol, onAlertCreate, saveAlerts]);

  const handleUpdateAlert = useCallback(() => {
    if (!editingAlert) return;

    const updatedAlerts = alerts.map(alert =>
      alert.id === editingAlert.id ? { ...editingAlert } : alert
    );
    saveAlerts(updatedAlerts);

    if (onAlertUpdate) {
      onAlertUpdate(editingAlert);
    }

    setEditingAlert(null);
  }, [editingAlert, alerts, onAlertUpdate, saveAlerts]);

  const handleDeleteAlert = useCallback((alertId) => {
    const updatedAlerts = alerts.filter(alert => alert.id !== alertId);
    saveAlerts(updatedAlerts);

    if (onAlertDelete) {
      onAlertDelete(alertId);
    }
  }, [alerts, onAlertDelete, saveAlerts]);

  const handleToggleAlert = useCallback((alertId) => {
    const updatedAlerts = alerts.map(alert =>
      alert.id === alertId ? { ...alert, paused: !alert.paused } : alert
    );
    saveAlerts(updatedAlerts);
  }, [alerts, saveAlerts]);

  const handleResetAlert = useCallback((alertId) => {
    const updatedAlerts = alerts.map(alert =>
      alert.id === alertId ? { ...alert, triggered: false, triggerCount: 0 } : alert
    );
    saveAlerts(updatedAlerts);
  }, [alerts, saveAlerts]);

  const formatCondition = (condition, value) => {
    const conditionLabels = {
      [ALERT_CONDITIONS.ABOVE]: `≥ ${value}`,
      [ALERT_CONDITIONS.BELOW]: `≤ ${value}`,
      [ALERT_CONDITIONS.CROSS_ABOVE]: `Cross above ${value}`,
      [ALERT_CONDITIONS.CROSS_BELOW]: `Cross below ${value}`,
      [ALERT_CONDITIONS.PERCENT_ABOVE]: `+${value}% above`,
      [ALERT_CONDITIONS.PERCENT_BELOW]: `-${value}% below`,
    };
    return conditionLabels[condition] || condition;
  };

  const getAlertStatusColor = (alert) => {
    if (alert.triggered) return 'error';
    if (alert.paused) return 'warning';
    return 'success';
  };

  const getAlertStatusLabel = (alert) => {
    if (alert.triggered) return 'Triggered';
    if (alert.paused) return 'Paused';
    return 'Active';
  };

  const activeAlerts = useMemo(() => alerts.filter(a => !a.paused), [alerts]);
  const triggeredAlerts = useMemo(() => alerts.filter(a => a.triggered), [alerts]);
  const pausedAlerts = useMemo(() => alerts.filter(a => a.paused), [alerts]);

  return (
    <Paper
      variant="outlined"
      className={`price-alerts-manager ${className}`}
      sx={{ p: 2, minHeight: '400px' }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Price Alerts - {symbol}
        </Typography>

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <FormControlLabel
            control={
              <Switch
                checked={soundEnabled}
                onChange={(e) => setSoundEnabled(e.target.checked)}
                size="small"
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {soundEnabled ? <VolumeUp fontSize="small" /> : <VolumeOff fontSize="small" />}
                Sound
              </Box>
            }
          />

          <FormControlLabel
            control={
              <Switch
                checked={notificationsEnabled}
                onChange={(e) => setNotificationsEnabled(e.target.checked)}
                size="small"
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {notificationsEnabled ? <Notifications fontSize="small" /> : <NotificationsOff fontSize="small" />}
                Alerts
              </Box>
            }
          />

          <Tooltip title="Create New Alert">
            <IconButton
              size="small"
              onClick={() => setIsCreateDialogOpen(true)}
              color="primary"
            >
              <Add />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {/* Alerts Summary */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Chip
          label={`Active: ${activeAlerts.length}`}
          color="success"
          size="small"
        />
        <Chip
          label={`Triggered: ${triggeredAlerts.length}`}
          color="error"
          size="small"
        />
        <Chip
          label={`Paused: ${pausedAlerts.length}`}
          color="warning"
          size="small"
        />
      </Box>

      {/* Alerts List */}
      <List sx={{ maxHeight: '300px', overflow: 'auto' }}>
        {alerts.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
            No alerts configured. Click the + button to create your first alert.
          </Typography>
        ) : (
          alerts.map((alert) => (
            <ListItem key={alert.id} divider>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {formatCondition(alert.condition, alert.value)}
                    </Typography>
                    <Chip
                      label={getAlertStatusLabel(alert)}
                      color={getAlertStatusColor(alert)}
                      size="small"
                    />
                  </Box>
                }
                secondary={
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {alert.message || 'No message'}
                    </Typography>
                    {alert.triggered && (
                      <Typography variant="caption" color="error" sx={{ display: 'block' }}>
                        Triggered {alert.triggerCount} times
                      </Typography>
                    )}
                  </Box>
                }
              />
              <ListItemSecondaryAction>
                <Tooltip title={alert.paused ? 'Resume' : 'Pause'}>
                  <IconButton
                    size="small"
                    onClick={() => handleToggleAlert(alert.id)}
                  >
                    {alert.paused ? <PlayArrow /> : <Pause />}
                  </IconButton>
                </Tooltip>

                {alert.triggered && (
                  <Tooltip title="Reset Alert">
                    <IconButton
                      size="small"
                      onClick={() => handleResetAlert(alert.id)}
                    >
                      <Edit />
                    </IconButton>
                  </Tooltip>
                )}

                <Tooltip title="Delete Alert">
                  <IconButton
                    size="small"
                    onClick={() => handleDeleteAlert(alert.id)}
                    color="error"
                  >
                    <Delete />
                  </IconButton>
                </Tooltip>
              </ListItemSecondaryAction>
            </ListItem>
          ))
        )}
      </List>

      {/* Create Alert Dialog */}
      <Dialog
        open={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create Price Alert</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Alert Type</InputLabel>
              <Select
                value={newAlert.type}
                label="Alert Type"
                onChange={(e) => setNewAlert(prev => ({ ...prev, type: e.target.value }))}
              >
                <MenuItem value={ALERT_TYPES.PRICE}>Price Alert</MenuItem>
                <MenuItem value={ALERT_TYPES.VOLUME}>Volume Alert</MenuItem>
                <MenuItem value={ALERT_TYPES.INDICATOR}>Indicator Alert</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>Condition</InputLabel>
              <Select
                value={newAlert.condition}
                label="Condition"
                onChange={(e) => setNewAlert(prev => ({ ...prev, condition: e.target.value }))}
              >
                <MenuItem value={ALERT_CONDITIONS.ABOVE}>Price Above</MenuItem>
                <MenuItem value={ALERT_CONDITIONS.BELOW}>Price Below</MenuItem>
                <MenuItem value={ALERT_CONDITIONS.CROSS_ABOVE}>Cross Above</MenuItem>
                <MenuItem value={ALERT_CONDITIONS.CROSS_BELOW}>Cross Below</MenuItem>
                <MenuItem value={ALERT_CONDITIONS.PERCENT_ABOVE}>Percent Above</MenuItem>
                <MenuItem value={ALERT_CONDITIONS.PERCENT_BELOW}>Percent Below</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Value"
              type="number"
              value={newAlert.value}
              onChange={(e) => setNewAlert(prev => ({ ...prev, value: e.target.value }))}
              size="small"
              fullWidth
              helperText={
                newAlert.condition.includes('percent') ?
                'Enter percentage value (e.g., 5 for 5%)' :
                'Enter price value'
              }
            />

            <TextField
              label="Message (Optional)"
              value={newAlert.message}
              onChange={(e) => setNewAlert(prev => ({ ...prev, message: e.target.value }))}
              size="small"
              fullWidth
              placeholder="Alert message when triggered"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={newAlert.sound}
                  onChange={(e) => setNewAlert(prev => ({ ...prev, sound: e.target.checked }))}
                />
              }
              label="Play sound when triggered"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={newAlert.repeat}
                  onChange={(e) => setNewAlert(prev => ({ ...prev, repeat: e.target.checked }))}
                />
              }
              label="Repeat alert"
            />

            {newAlert.repeat && (
              <Box>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Cooldown (minutes): {newAlert.cooldown}
                </Typography>
                <Slider
                  value={newAlert.cooldown}
                  onChange={(e, value) => setNewAlert(prev => ({ ...prev, cooldown: value }))}
                  min={0}
                  max={60}
                  step={5}
                  marks
                  size="small"
                />
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateAlert} variant="contained">
            Create Alert
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default PriceAlertsManager;