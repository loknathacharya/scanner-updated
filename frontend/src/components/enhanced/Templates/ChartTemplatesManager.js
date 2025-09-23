import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Slider,
} from '@mui/material';
import {
  Save,
  Folder,
  Delete,
  Edit,
  ExpandMore,
  Star,
  StarBorder,
  Share,
  Download,
  Upload,
  Settings,
} from '@mui/icons-material';

const ChartTemplatesManager = ({
  chartConfig,
  onTemplateLoad,
  onTemplateSave,
  onTemplateDelete,
  className = '',
}) => {
  const [templates, setTemplates] = useState([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // New template form state
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    category: 'custom',
    isPublic: false,
    tags: [],
    config: {},
  });

  // Load templates from localStorage or API
  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = useCallback(() => {
    try {
      const savedTemplates = localStorage.getItem('chart_templates');
      if (savedTemplates) {
        const parsedTemplates = JSON.parse(savedTemplates);
        setTemplates(parsedTemplates);
      } else {
        // Load default templates
        setTemplates(getDefaultTemplates());
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
      setTemplates(getDefaultTemplates());
    }
  }, []);

  const saveTemplates = useCallback((templatesToSave) => {
    try {
      localStorage.setItem('chart_templates', JSON.stringify(templatesToSave));
      setTemplates(templatesToSave);
    } catch (error) {
      console.error('Failed to save templates:', error);
    }
  }, []);

  const getDefaultTemplates = () => [
    {
      id: 'default_candlestick',
      name: 'Default Candlestick',
      description: 'Standard candlestick chart with basic indicators',
      category: 'default',
      isPublic: true,
      tags: ['candlestick', 'basic'],
      config: {
        chartType: 'candlestick',
        indicators: ['SMA', 'EMA', 'RSI'],
        timeFrame: '1D',
        theme: 'dark',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 0,
      isDefault: true,
    },
    {
      id: 'default_line',
      name: 'Default Line Chart',
      description: 'Simple line chart for price tracking',
      category: 'default',
      isPublic: true,
      tags: ['line', 'simple'],
      config: {
        chartType: 'line',
        indicators: [],
        timeFrame: '1D',
        theme: 'dark',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 0,
      isDefault: true,
    },
    {
      id: 'advanced_analysis',
      name: 'Advanced Analysis',
      description: 'Comprehensive technical analysis setup',
      category: 'analysis',
      isPublic: true,
      tags: ['analysis', 'indicators', 'advanced'],
      config: {
        chartType: 'candlestick',
        indicators: ['SMA', 'EMA', 'RSI', 'MACD', 'Bollinger Bands', 'Stochastic'],
        timeFrame: '1D',
        theme: 'dark',
        showVolume: true,
        showGrid: true,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 0,
      isDefault: true,
    },
  ];

  const handleCreateTemplate = useCallback(() => {
    const template = {
      id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...newTemplate,
      config: chartConfig || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 0,
      isDefault: false,
    };

    const updatedTemplates = [...templates, template];
    saveTemplates(updatedTemplates);

    if (onTemplateSave) {
      onTemplateSave(template);
    }

    // Reset form
    setNewTemplate({
      name: '',
      description: '',
      category: 'custom',
      isPublic: false,
      tags: [],
      config: {},
    });

    setIsCreateDialogOpen(false);
  }, [newTemplate, chartConfig, templates, onTemplateSave, saveTemplates]);

  const handleUpdateTemplate = useCallback(() => {
    if (!editingTemplate) return;

    const updatedTemplate = {
      ...editingTemplate,
      updatedAt: new Date().toISOString(),
    };

    const updatedTemplates = templates.map(template =>
      template.id === editingTemplate.id ? updatedTemplate : template
    );
    saveTemplates(updatedTemplates);

    if (onTemplateSave) {
      onTemplateSave(updatedTemplate);
    }

    setEditingTemplate(null);
  }, [editingTemplate, templates, onTemplateSave, saveTemplates]);

  const handleDeleteTemplate = useCallback((templateId) => {
    const updatedTemplates = templates.filter(template => template.id !== templateId);
    saveTemplates(updatedTemplates);

    if (onTemplateDelete) {
      onTemplateDelete(templateId);
    }
  }, [templates, onTemplateDelete, saveTemplates]);

  const handleLoadTemplate = useCallback((template) => {
    // Update usage count
    const updatedTemplate = {
      ...template,
      usageCount: (template.usageCount || 0) + 1,
      updatedAt: new Date().toISOString(),
    };

    const updatedTemplates = templates.map(t =>
      t.id === template.id ? updatedTemplate : t
    );
    saveTemplates(updatedTemplates);

    if (onTemplateLoad) {
      onTemplateLoad(template.config);
    }

    setSelectedTemplate(template);
  }, [templates, onTemplateLoad, saveTemplates]);

  const handleToggleFavorite = useCallback((templateId) => {
    const updatedTemplates = templates.map(template =>
      template.id === templateId
        ? { ...template, isFavorite: !template.isFavorite }
        : template
    );
    saveTemplates(updatedTemplates);
  }, [templates, saveTemplates]);

  const handleExportTemplate = useCallback((template) => {
    const dataStr = JSON.stringify(template, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

    const exportFileDefaultName = `${template.name.replace(/\s+/g, '_')}_template.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }, []);

  const handleImportTemplate = useCallback((event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const template = JSON.parse(e.target.result);
          template.id = `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          template.imported = true;
          template.createdAt = new Date().toISOString();
          template.updatedAt = new Date().toISOString();

          const updatedTemplates = [...templates, template];
          saveTemplates(updatedTemplates);
        } catch (error) {
          console.error('Failed to import template:', error);
          alert('Invalid template file format');
        }
      };
      reader.readAsText(file);
    }
  }, [templates, saveTemplates]);

  const filteredTemplates = useMemo(() => {
    return templates.filter(template => {
      // Filter logic can be added here (by category, tags, etc.)
      return true;
    });
  }, [templates]);

  const categories = useMemo(() => {
    const cats = [...new Set(templates.map(t => t.category))];
    return cats.sort();
  }, [templates]);

  const getCategoryColor = (category) => {
    const colors = {
      default: 'primary',
      analysis: 'secondary',
      custom: 'success',
      imported: 'warning',
    };
    return colors[category] || 'default';
  };

  return (
    <Paper
      variant="outlined"
      className={`chart-templates-manager ${className}`}
      sx={{ p: 2, minHeight: '400px' }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Chart Templates
        </Typography>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Import Template">
            <IconButton size="small" component="label">
              <Upload />
              <input
                type="file"
                accept=".json"
                hidden
                onChange={handleImportTemplate}
              />
            </IconButton>
          </Tooltip>

          <Tooltip title="Create Template">
            <IconButton
              size="small"
              onClick={() => setIsCreateDialogOpen(true)}
              color="primary"
            >
              <Save />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {/* Templates List */}
      <List sx={{ maxHeight: '300px', overflow: 'auto' }}>
        {filteredTemplates.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
            No templates available. Create your first template to get started.
          </Typography>
        ) : (
          filteredTemplates.map((template) => (
            <ListItem key={template.id} divider>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {template.name}
                    </Typography>
                    <Chip
                      label={template.category}
                      color={getCategoryColor(template.category)}
                      size="small"
                    />
                    {template.isDefault && (
                      <Chip label="Default" size="small" variant="outlined" />
                    )}
                  </Box>
                }
                secondary={
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {template.description}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      Used {template.usageCount || 0} times
                    </Typography>
                  </Box>
                }
              />
              <ListItemSecondaryAction>
                <Tooltip title="Load Template">
                  <IconButton
                    size="small"
                    onClick={() => handleLoadTemplate(template)}
                    color={selectedTemplate?.id === template.id ? 'primary' : 'default'}
                  >
                    <Folder />
                  </IconButton>
                </Tooltip>

                <Tooltip title={template.isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}>
                  <IconButton
                    size="small"
                    onClick={() => handleToggleFavorite(template.id)}
                  >
                    {template.isFavorite ? <Star /> : <StarBorder />}
                  </IconButton>
                </Tooltip>

                <Tooltip title="Export Template">
                  <IconButton
                    size="small"
                    onClick={() => handleExportTemplate(template)}
                  >
                    <Download />
                  </IconButton>
                </Tooltip>

                {!template.isDefault && (
                  <Tooltip title="Delete Template">
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteTemplate(template.id)}
                      color="error"
                    >
                      <Delete />
                    </IconButton>
                  </Tooltip>
                )}
              </ListItemSecondaryAction>
            </ListItem>
          ))
        )}
      </List>

      {/* Create Template Dialog */}
      <Dialog
        open={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create Chart Template</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Template Name"
              value={newTemplate.name}
              onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
              size="small"
              fullWidth
              required
            />

            <TextField
              label="Description"
              value={newTemplate.description}
              onChange={(e) => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
              size="small"
              fullWidth
              multiline
              rows={2}
            />

            <FormControl fullWidth size="small">
              <InputLabel>Category</InputLabel>
              <Select
                value={newTemplate.category}
                label="Category"
                onChange={(e) => setNewTemplate(prev => ({ ...prev, category: e.target.value }))}
              >
                <MenuItem value="custom">Custom</MenuItem>
                <MenuItem value="analysis">Analysis</MenuItem>
                <MenuItem value="trading">Trading</MenuItem>
                <MenuItem value="indicators">Indicators</MenuItem>
              </Select>
            </FormControl>

            <FormControlLabel
              control={
                <Switch
                  checked={newTemplate.isPublic}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, isPublic: e.target.checked }))}
                />
              }
              label="Make template public"
            />

            <TextField
              label="Tags (comma separated)"
              value={newTemplate.tags.join(', ')}
              onChange={(e) => setNewTemplate(prev => ({
                ...prev,
                tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)
              }))}
              size="small"
              fullWidth
              helperText="Add tags to help organize your templates"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateTemplate}
            variant="contained"
            disabled={!newTemplate.name.trim()}
          >
            Create Template
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default ChartTemplatesManager;