// ============================================================================
// core/AppState.js
// Central application state management
// ============================================================================

import { EventBus } from './EventBus.js';
import { ToolManager } from './ToolManager.js';
import { StyleManager } from './StyleManager.js';

export class AppState {
  constructor() {
    // Initialize core systems
    this.eventBus = new EventBus();
    this.toolManager = new ToolManager(this.eventBus);
    this.styleManager = new StyleManager();

    // Current mode
    this.currentMode = 'explore';

    // Map reference (set later by main.js)
    this.map = null;
  }

  /**
   * Set the active tool mode
   * @param {string} mode - Mode name (explore, points, line, etc.)
   */
  setMode(mode) {
    if (this.currentMode === mode) return;

    const previousMode = this.currentMode;
    this.currentMode = mode;

    // Update tool manager
    this.toolManager.setActive(mode);

    // Emit event for UI updates
    this.eventBus.emit('mode:changed', {
      mode,
      previousMode,
      tool: this.toolManager.getActive()
    });
  }

  /**
   * Get current mode name
   * @returns {string}
   */
  getMode() {
    return this.currentMode;
  }

  /**
   * Get the currently active tool
   * @returns {Object|null}
   */
  getActiveTool() {
    return this.toolManager.getActive();
  }

  /**
   * Set map reference
   * @param {MapView} map
   */
  setMap(map) {
    this.map = map;
  }

  /**
   * Get all drawing tools (excludes move/delete)
   * @returns {Array}
   */
  getDrawingTools() {
    return this.toolManager.getAllTools()
      .filter(tool => tool && !tool.isMoveTool && tool.toGeoJSON);
  }

  /**
   * Clear all data from all tools
   */
  clearAll() {
    const tools = this.toolManager.getAllTools();

    for (const tool of tools) {
      if (tool?.items) {
        tool.items.length = 0;
      }
      if (tool?.points) {
        tool.points.length = 0;
      }
      if (tool?.lines) {
        tool.lines.length = 0;
      }
      if (tool?.polygons) {
        tool.polygons.length = 0;
      }
      if (tool?.sectors) {
        tool.sectors.length = 0;
      }
      if (tool?.texts) {
        tool.texts.length = 0;
      }
    }

    this.eventBus.emit('data:cleared');
  }

  /**
   * Get statistics about current data
   * @returns {Object}
   */
  getStats() {
    const tools = this.getDrawingTools();

    return {
      points: this._countItems('points', tools),
      lines: this._countItems('lines', tools),
      polygons: this._countItems('polygons', tools),
      sectors: this._countItems('sectors', tools),
      texts: this._countItems('texts', tools),
      total: tools.reduce((sum, tool) => {
        const items = tool?.items || tool?.points || tool?.lines ||
                     tool?.polygons || tool?.sectors || tool?.texts || [];
        return sum + items.length;
      }, 0)
    };
  }

  /**
   * Helper to count items of a specific type
   * @private
   */
  _countItems(type, tools) {
    const tool = tools.find(t => t?.[type]);
    return tool?.[type]?.length || 0;
  }
}