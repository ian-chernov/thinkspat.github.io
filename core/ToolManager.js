// ============================================================================
// core/ToolManager.js
// Manages tool registration, lifecycle, and active tool state
// ============================================================================

export class ToolManager {
  constructor(eventBus) {
    this.eventBus = eventBus;

    // Map of tool name -> tool instance
    this.tools = new Map();

    // Currently active tool name
    this.activeTool = null;

    // Tool registration order (for iteration)
    this.registrationOrder = [];
  }

  /**
   * Register a tool with a name
   * @param {string} name - Tool name (explore, points, line, etc.)
   * @param {Object|null} tool - Tool instance or null for explore mode
   */
  register(name, tool) {
    if (this.tools.has(name)) {
      console.warn(`ToolManager: Tool "${name}" already registered, overwriting`);
    }

    this.tools.set(name, tool);

    // Track registration order
    if (!this.registrationOrder.includes(name)) {
      this.registrationOrder.push(name);
    }

    // Set first registered tool as active if none set
    if (!this.activeTool) {
      this.activeTool = name;
    }
  }

  /**
   * Unregister a tool
   * @param {string} name - Tool name to remove
   */
  unregister(name) {
    if (!this.tools.has(name)) {
      console.warn(`ToolManager: Tool "${name}" not found`);
      return;
    }

    this.tools.delete(name);

    // Remove from registration order
    const index = this.registrationOrder.indexOf(name);
    if (index > -1) {
      this.registrationOrder.splice(index, 1);
    }

    // If active tool was unregistered, switch to first available
    if (this.activeTool === name) {
      this.activeTool = this.registrationOrder[0] || null;
    }
  }

  /**
   * Set the active tool
   * @param {string} name - Tool name to activate
   * @returns {boolean} Success
   */
  setActive(name) {
    if (!this.tools.has(name)) {
      console.warn(`ToolManager: Tool "${name}" not found`);
      return false;
    }

    const previousTool = this.activeTool;
    this.activeTool = name;

    // Emit tool changed event
    this.eventBus.emit('tool:changed', {
      name,
      tool: this.getActive(),
      previousName: previousTool,
      previousTool: this.tools.get(previousTool)
    });

    return true;
  }

  /**
   * Get the currently active tool instance
   * @returns {Object|null}
   */
  getActive() {
    return this.tools.get(this.activeTool);
  }

  /**
   * Get the currently active tool name
   * @returns {string|null}
   */
  getActiveName() {
    return this.activeTool;
  }

  /**
   * Get a specific tool by name
   * @param {string} name - Tool name
   * @returns {Object|null}
   */
  getTool(name) {
    return this.tools.get(name) || null;
  }

  /**
   * Get all registered tools as an array
   * @returns {Array<Object>}
   */
  getAllTools() {
    return Array.from(this.tools.values()).filter(tool => tool !== null);
  }

  /**
   * Get all tool names
   * @returns {Array<string>}
   */
  getAllToolNames() {
    return Array.from(this.tools.keys());
  }

  /**
   * Get tools in registration order
   * @returns {Array<{name: string, tool: Object}>}
   */
  getToolsInOrder() {
    return this.registrationOrder.map(name => ({
      name,
      tool: this.tools.get(name)
    }));
  }

  /**
   * Get only drawing tools (excludes explore, move, delete)
   * @returns {Array<Object>}
   */
  getDrawingTools() {
    const excludeNames = ['explore', 'move', 'delete'];

    return Array.from(this.tools.entries())
      .filter(([name, tool]) => !excludeNames.includes(name) && tool !== null)
      .map(([_, tool]) => tool);
  }

  /**
   * Get tools by type/class
   * @param {string} className - Class name to filter by
   * @returns {Array<Object>}
   */
  getToolsByType(className) {
    return this.getAllTools().filter(tool =>
      tool && tool.constructor.name === className
    );
  }

  /**
   * Check if a tool is registered
   * @param {string} name - Tool name
   * @returns {boolean}
   */
  hasTool(name) {
    return this.tools.has(name);
  }

  /**
   * Check if a tool is currently active
   * @param {string} name - Tool name
   * @returns {boolean}
   */
  isActive(name) {
    return this.activeTool === name;
  }

  /**
   * Get count of registered tools
   * @returns {number}
   */
  getToolCount() {
    return this.tools.size;
  }

  /**
   * Execute a method on the active tool if it exists
   * @param {string} methodName - Method to call
   * @param {...*} args - Arguments to pass
   * @returns {*} Return value from method or undefined
   */
  executeOnActive(methodName, ...args) {
    const tool = this.getActive();

    if (tool && typeof tool[methodName] === 'function') {
      return tool[methodName](...args);
    }

    return undefined;
  }

  /**
   * Execute a method on all tools that have it
   * @param {string} methodName - Method to call
   * @param {...*} args - Arguments to pass
   * @returns {Array} Array of return values
   */
  executeOnAll(methodName, ...args) {
    const results = [];

    for (const tool of this.getAllTools()) {
      if (tool && typeof tool[methodName] === 'function') {
        results.push(tool[methodName](...args));
      }
    }

    return results;
  }

  /**
   * Finish/complete the active tool's current operation
   * Useful for double-click or Enter key to finish drawing
   */
  finishActiveTool() {
    const tool = this.getActive();

    if (tool && typeof tool.finish === 'function') {
      tool.finish();
      this.eventBus.emit('tool:finished', {
        name: this.activeTool,
        tool
      });
    }
  }

  /**
   * Clear all data from all drawing tools
   */
  clearAllData() {
    const drawingTools = this.getDrawingTools();

    for (const tool of drawingTools) {
      // Clear common data arrays
      if (tool.items) tool.items.length = 0;
      if (tool.points) tool.points.length = 0;
      if (tool.lines) tool.lines.length = 0;
      if (tool.polygons) tool.polygons.length = 0;
      if (tool.sectors) tool.sectors.length = 0;
      if (tool.texts) tool.texts.length = 0;
    }

    this.eventBus.emit('tools:data-cleared');
  }

  /**
   * Get statistics about all tools
   * @returns {Object}
   */
  getStats() {
    const stats = {
      totalTools: this.getToolCount(),
      activeToolName: this.activeTool,
      tools: {}
    };

    for (const [name, tool] of this.tools.entries()) {
      if (!tool) {
        stats.tools[name] = { count: 0 };
        continue;
      }

      const count =
        tool.items?.length ||
        tool.points?.length ||
        tool.lines?.length ||
        tool.polygons?.length ||
        tool.sectors?.length ||
        tool.texts?.length ||
        0;

      stats.tools[name] = { count };
    }

    return stats;
  }

  /**
   * Debug: Print tool information to console
   */
  debug() {
    console.group('ToolManager Debug');
    console.log('Active Tool:', this.activeTool);
    console.log('Registered Tools:', this.getAllToolNames());
    console.log('Tool Count:', this.getToolCount());
    console.log('Stats:', this.getStats());
    console.groupEnd();
  }
}