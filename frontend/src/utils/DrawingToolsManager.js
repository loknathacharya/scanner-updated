/**
 * DrawingToolsManager - Advanced drawing tools management system
 * Handles creation, persistence, and management of various drawing tools
 */

export const DRAWING_TOOL_TYPES = {
  TREND_LINE: 'trend_line',
  FIBONACCI_RETRACEMENT: 'fibonacci_retracement',
  RECTANGLE: 'rectangle',
  ELLIPSE: 'ellipse',
  TEXT_ANNOTATION: 'text_annotation',
  ARROW: 'arrow',
  HORIZONTAL_LINE: 'horizontal_line',
  VERTICAL_LINE: 'vertical_line',
  PRICE_ALERT: 'price_alert',
};

export const DRAWING_STYLES = {
  LINE_WIDTH: [1, 2, 3, 4, 5],
  LINE_STYLES: ['solid', 'dashed', 'dotted'],
  COLORS: [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
    '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D7BDE2'
  ],
  FIBONACCI_LEVELS: [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1.0, 1.236, 1.382, 1.618],
};

export class DrawingTool {
  constructor(type, options = {}) {
    this.id = `drawing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.type = type;
    this.points = options.points || [];
    this.style = {
      color: options.color || DRAWING_STYLES.COLORS[0],
      lineWidth: options.lineWidth || 2,
      lineStyle: options.lineStyle || 'solid',
      fillColor: options.fillColor || null,
      fillOpacity: options.fillOpacity || 0.1,
      fontSize: options.fontSize || 12,
      fontFamily: options.fontFamily || 'Arial',
      textAlign: options.textAlign || 'center',
      ...options.style,
    };
    this.properties = {
      label: options.label || '',
      visible: options.visible !== false,
      locked: options.locked || false,
      extended: options.extended || false,
      ...options.properties,
    };
    this.metadata = {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: options.createdBy || 'user',
      ...options.metadata,
    };
  }

  updatePoints(points) {
    this.points = points;
    this.metadata.updatedAt = new Date().toISOString();
  }

  updateStyle(style) {
    this.style = { ...this.style, ...style };
    this.metadata.updatedAt = new Date().toISOString();
  }

  updateProperties(properties) {
    this.properties = { ...this.properties, ...properties };
    this.metadata.updatedAt = new Date().toISOString();
  }

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      points: this.points,
      style: this.style,
      properties: this.properties,
      metadata: this.metadata,
    };
  }

  static fromJSON(data) {
    const tool = new DrawingTool(data.type, {
      points: data.points,
      style: data.style,
      properties: data.properties,
      metadata: data.metadata,
    });
    tool.id = data.id;
    return tool;
  }
}

export class DrawingToolsManager {
  constructor(chartInstance, options = {}) {
    this.chart = chartInstance;
    this.tools = new Map();
    this.activeTool = null;
    this.isDrawing = false;
    this.drawingPoints = [];
    this.options = {
      enablePersistence: options.enablePersistence !== false,
      storageKey: options.storageKey || 'tradingview_drawing_tools',
      maxTools: options.maxTools || 100,
      snapToPrice: options.snapToPrice !== false,
      snapToTime: options.snapToTime !== false,
      ...options,
    };

    this.eventHandlers = new Map();
    this.loadPersistedTools();
  }

  // Tool creation methods
  createTrendLine(points, options = {}) {
    const tool = new DrawingTool(DRAWING_TOOL_TYPES.TREND_LINE, {
      points,
      ...options,
    });
    return this.addTool(tool);
  }

  createFibonacciRetracement(points, options = {}) {
    const tool = new DrawingTool(DRAWING_TOOL_TYPES.FIBONACCI_RETRACEMENT, {
      points,
      ...options,
    });
    return this.addTool(tool);
  }

  createRectangle(points, options = {}) {
    const tool = new DrawingTool(DRAWING_TOOL_TYPES.RECTANGLE, {
      points,
      ...options,
    });
    return this.addTool(tool);
  }

  createEllipse(points, options = {}) {
    const tool = new DrawingTool(DRAWING_TOOL_TYPES.ELLIPSE, {
      points,
      ...options,
    });
    return this.addTool(tool);
  }

  createTextAnnotation(point, text, options = {}) {
    const tool = new DrawingTool(DRAWING_TOOL_TYPES.TEXT_ANNOTATION, {
      points: [point],
      label: text,
      ...options,
    });
    return this.addTool(tool);
  }

  createArrow(points, options = {}) {
    const tool = new DrawingTool(DRAWING_TOOL_TYPES.ARROW, {
      points,
      ...options,
    });
    return this.addTool(tool);
  }

  createHorizontalLine(price, options = {}) {
    const tool = new DrawingTool(DRAWING_TOOL_TYPES.HORIZONTAL_LINE, {
      points: [{ price }],
      ...options,
    });
    return this.addTool(tool);
  }

  createVerticalLine(time, options = {}) {
    const tool = new DrawingTool(DRAWING_TOOL_TYPES.VERTICAL_LINE, {
      points: [{ time }],
      ...options,
    });
    return this.addTool(tool);
  }

  createPriceAlert(price, condition = 'above', options = {}) {
    const tool = new DrawingTool(DRAWING_TOOL_TYPES.PRICE_ALERT, {
      points: [{ price }],
      properties: {
        alertPrice: price,
        condition,
        triggered: false,
        ...options.properties,
      },
      ...options,
    });
    return this.addTool(tool);
  }

  // Tool management
  addTool(tool) {
    if (this.tools.size >= this.options.maxTools) {
      throw new Error('Maximum number of drawing tools reached');
    }

    this.tools.set(tool.id, tool);
    this.renderTool(tool);
    this.savePersistedTools();
    return tool;
  }

  removeTool(toolId) {
    const tool = this.tools.get(toolId);
    if (tool) {
      this.removeToolFromChart(tool);
      this.tools.delete(toolId);
      this.savePersistedTools();
      return true;
    }
    return false;
  }

  getTool(toolId) {
    return this.tools.get(toolId);
  }

  getAllTools() {
    return Array.from(this.tools.values());
  }

  getToolsByType(type) {
    return this.getAllTools().filter(tool => tool.type === type);
  }

  clearAllTools() {
    this.tools.forEach(tool => this.removeToolFromChart(tool));
    this.tools.clear();
    this.savePersistedTools();
  }

  // Tool selection and editing
  selectTool(toolId) {
    this.deselectAllTools();
    const tool = this.tools.get(toolId);
    if (tool) {
      tool.properties.selected = true;
      this.renderTool(tool);
      return tool;
    }
    return null;
  }

  deselectAllTools() {
    this.tools.forEach(tool => {
      tool.properties.selected = false;
      this.renderTool(tool);
    });
  }

  updateTool(toolId, updates) {
    const tool = this.tools.get(toolId);
    if (tool) {
      if (updates.points) tool.updatePoints(updates.points);
      if (updates.style) tool.updateStyle(updates.style);
      if (updates.properties) tool.updateProperties(updates.properties);

      this.removeToolFromChart(tool);
      this.renderTool(tool);
      this.savePersistedTools();
      return tool;
    }
    return null;
  }

  // Drawing interaction
  startDrawing(toolType, options = {}) {
    this.activeTool = toolType;
    this.isDrawing = true;
    this.drawingPoints = [];
    this.drawingOptions = options;

    this.emit('drawing-start', { toolType, options });
  }

  addDrawingPoint(point) {
    if (!this.isDrawing) return;

    this.drawingPoints.push(point);

    if (this.shouldCompleteDrawing()) {
      this.completeDrawing();
    }
  }

  shouldCompleteDrawing() {
    const requiredPoints = this.getRequiredPointsForTool(this.activeTool);
    return this.drawingPoints.length >= requiredPoints;
  }

  getRequiredPointsForTool(toolType) {
    const pointRequirements = {
      [DRAWING_TOOL_TYPES.TREND_LINE]: 2,
      [DRAWING_TOOL_TYPES.FIBONACCI_RETRACEMENT]: 2,
      [DRAWING_TOOL_TYPES.RECTANGLE]: 2,
      [DRAWING_TOOL_TYPES.ELLIPSE]: 2,
      [DRAWING_TOOL_TYPES.TEXT_ANNOTATION]: 1,
      [DRAWING_TOOL_TYPES.ARROW]: 2,
      [DRAWING_TOOL_TYPES.HORIZONTAL_LINE]: 1,
      [DRAWING_TOOL_TYPES.VERTICAL_LINE]: 1,
      [DRAWING_TOOL_TYPES.PRICE_ALERT]: 1,
    };
    return pointRequirements[toolType] || 2;
  }

  completeDrawing() {
    if (!this.isDrawing || this.drawingPoints.length === 0) return;

    try {
      let tool;
      switch (this.activeTool) {
        case DRAWING_TOOL_TYPES.TREND_LINE:
          tool = this.createTrendLine(this.drawingPoints, this.drawingOptions);
          break;
        case DRAWING_TOOL_TYPES.FIBONACCI_RETRACEMENT:
          tool = this.createFibonacciRetracement(this.drawingPoints, this.drawingOptions);
          break;
        case DRAWING_TOOL_TYPES.RECTANGLE:
          tool = this.createRectangle(this.drawingPoints, this.drawingOptions);
          break;
        case DRAWING_TOOL_TYPES.ELLIPSE:
          tool = this.createEllipse(this.drawingPoints, this.drawingOptions);
          break;
        case DRAWING_TOOL_TYPES.TEXT_ANNOTATION:
          tool = this.createTextAnnotation(this.drawingPoints[0], this.drawingOptions.text || 'Text', this.drawingOptions);
          break;
        case DRAWING_TOOL_TYPES.ARROW:
          tool = this.createArrow(this.drawingPoints, this.drawingOptions);
          break;
        case DRAWING_TOOL_TYPES.HORIZONTAL_LINE:
          tool = this.createHorizontalLine(this.drawingPoints[0].price, this.drawingOptions);
          break;
        case DRAWING_TOOL_TYPES.VERTICAL_LINE:
          tool = this.createVerticalLine(this.drawingPoints[0].time, this.drawingOptions);
          break;
        case DRAWING_TOOL_TYPES.PRICE_ALERT:
          tool = this.createPriceAlert(this.drawingPoints[0].price, this.drawingOptions.condition || 'above', this.drawingOptions);
          break;
        default:
          throw new Error(`Unknown drawing tool type: ${this.activeTool}`);
      }

      this.emit('drawing-complete', { tool, toolType: this.activeTool });
    } catch (error) {
      this.emit('drawing-error', { error, toolType: this.activeTool });
    }

    this.isDrawing = false;
    this.activeTool = null;
    this.drawingPoints = [];
  }

  cancelDrawing() {
    this.isDrawing = false;
    this.activeTool = null;
    this.drawingPoints = [];
    this.emit('drawing-cancel', {});
  }

  // Rendering
  renderTool(tool) {
    this.removeToolFromChart(tool);

    if (!tool.properties.visible) return;

    // This would be implemented based on the specific chart library being used
    // For now, we'll provide a generic interface
    this.renderToolImplementation(tool);
  }

  renderToolImplementation(tool) {
    // This method should be overridden or extended based on the chart library
    // For lightweight-charts, this would create the appropriate series or primitives
    console.log('Rendering tool:', tool.type, tool.id);
  }

  removeToolFromChart(tool) {
    // This method should be overridden or extended based on the chart library
    console.log('Removing tool from chart:', tool.id);
  }

  // Persistence
  savePersistedTools() {
    if (!this.options.enablePersistence) return;

    try {
      const toolsData = Array.from(this.tools.values()).map(tool => tool.toJSON());
      localStorage.setItem(this.options.storageKey, JSON.stringify(toolsData));
    } catch (error) {
      console.error('Failed to save drawing tools:', error);
    }
  }

  loadPersistedTools() {
    if (!this.options.enablePersistence) return;

    try {
      const saved = localStorage.getItem(this.options.storageKey);
      if (saved) {
        const toolsData = JSON.parse(saved);
        toolsData.forEach(toolData => {
          const tool = DrawingTool.fromJSON(toolData);
          this.tools.set(tool.id, tool);
          this.renderTool(tool);
        });
      }
    } catch (error) {
      console.error('Failed to load drawing tools:', error);
    }
  }

  clearPersistedTools() {
    if (!this.options.enablePersistence) return;

    try {
      localStorage.removeItem(this.options.storageKey);
    } catch (error) {
      console.error('Failed to clear persisted tools:', error);
    }
  }

  // Event system
  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event).push(handler);
  }

  off(event, handler) {
    if (!this.eventHandlers.has(event)) return;

    const handlers = this.eventHandlers.get(event);
    const index = handlers.indexOf(handler);
    if (index > -1) {
      handlers.splice(index, 1);
    }
  }

  emit(event, data) {
    if (!this.eventHandlers.has(event)) return;

    this.eventHandlers.get(event).forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error('Event handler error:', error);
      }
    });
  }

  // Utility methods
  exportTools() {
    return Array.from(this.tools.values()).map(tool => tool.toJSON());
  }

  importTools(toolsData) {
    this.clearAllTools();
    toolsData.forEach(toolData => {
      const tool = DrawingTool.fromJSON(toolData);
      this.tools.set(tool.id, tool);
      this.renderTool(tool);
    });
    this.savePersistedTools();
  }

  // Cleanup
  destroy() {
    this.clearAllTools();
    this.eventHandlers.clear();
    this.chart = null;
  }
}

export default DrawingToolsManager;