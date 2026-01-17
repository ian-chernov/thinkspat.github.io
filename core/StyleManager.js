// ============================================================================
// core/StyleManager.js
// Centralized style management for all drawing tools
// ============================================================================

export class StyleManager {
  constructor() {
    // Default styles for each tool
    this.styles = {
      points: {
        color: 'black',
        symbol: 'circle'  // circle, triangle, square
      },

      line: {
        color: 'black',
        style: 'solid'    // solid, dashed
      },

      polygon: {
        color: 'green',
        alpha: 0.25       // Fill opacity
      },

      sector: {
        color: 'black',
        angle: 60         // Degrees
      },

      text: {
        value: '',
        color: 'black',
        size: 14          // Font size in pixels
      }
    };

    // Available options
    this.options = {
      colors: ['black', 'blue', 'red', 'green', 'yellow'],
      symbols: ['circle', 'triangle', 'square'],
      lineStyles: ['solid', 'dashed']
    };
  }

  /**
   * Get a copy of the style for a specific tool
   * Returns a copy to prevent external mutation
   * @param {string} toolName - Name of the tool (points, line, polygon, etc.)
   * @returns {Object} Style object
   */
  getStyle(toolName) {
    if (!this.styles[toolName]) {
      console.warn(`StyleManager: Unknown tool "${toolName}"`);
      return {};
    }

    // Return a shallow copy to prevent mutations
    return { ...this.styles[toolName] };
  }

  /**
   * Update style properties for a tool
   * @param {string} toolName - Name of the tool
   * @param {Object} updates - Properties to update
   */
  setStyle(toolName, updates) {
    if (!this.styles[toolName]) {
      console.warn(`StyleManager: Unknown tool "${toolName}"`);
      return;
    }

    // Merge updates into existing style
    Object.assign(this.styles[toolName], updates);
  }

  /**
   * Update a single style property (used by UI bindings)
   * @param {string} toolName - Name of the tool
   * @param {string} property - Property name (color, symbol, etc.)
   * @param {*} value - New value
   */
  updateProperty(toolName, property, value) {
    if (!this.styles[toolName]) {
      console.warn(`StyleManager: Unknown tool "${toolName}"`);
      return;
    }

    this.styles[toolName][property] = value;
  }

  /**
   * Alias for updateProperty - used by UIManager
   * @param {string} toolName - Name of the tool
   * @param {string} property - Property name
   * @param {*} value - New value
   */
  updateFromUI(toolName, property, value) {
    this.updateProperty(toolName, property, value);
  }

  /**
   * Reset a tool's style to defaults
   * @param {string} toolName - Name of the tool
   */
  reset(toolName) {
    const defaults = this.getDefaults();

    if (defaults[toolName]) {
      this.styles[toolName] = { ...defaults[toolName] };
    }
  }

  /**
   * Reset all styles to defaults
   */
  resetAll() {
    const defaults = this.getDefaults();
    this.styles = JSON.parse(JSON.stringify(defaults));
  }

  /**
   * Get default styles (useful for reset)
   * @returns {Object}
   */
  getDefaults() {
    return {
      points: {
        color: 'black',
        symbol: 'circle'
      },

      line: {
        color: 'black',
        style: 'solid'
      },

      polygon: {
        color: 'green',
        alpha: 0.25
      },

      sector: {
        color: 'black',
        angle: 60
      },

      text: {
        value: '',
        color: 'black',
        size: 14
      }
    };
  }

  /**
   * Get available options for UI dropdowns
   * @returns {Object}
   */
  getOptions() {
    return { ...this.options };
  }

  /**
   * Get available colors
   * @returns {string[]}
   */
  getColors() {
    return [...this.options.colors];
  }

  /**
   * Get available symbols
   * @returns {string[]}
   */
  getSymbols() {
    return [...this.options.symbols];
  }

  /**
   * Get available line styles
   * @returns {string[]}
   */
  getLineStyles() {
    return [...this.options.lineStyles];
  }

  /**
   * Export current styles as JSON (for saving preferences)
   * @returns {Object}
   */
  export() {
    return JSON.parse(JSON.stringify(this.styles));
  }

  /**
   * Import styles from JSON (for loading preferences)
   * @param {Object} stylesObj - Styles object to import
   */
  import(stylesObj) {
    if (!stylesObj || typeof stylesObj !== 'object') {
      console.warn('StyleManager: Invalid import data');
      return;
    }

    // Only import known tools
    for (const [toolName, style] of Object.entries(stylesObj)) {
      if (this.styles[toolName]) {
        this.styles[toolName] = { ...style };
      }
    }
  }

  /**
   * Validate a color value
   * @param {string} color - Color to validate
   * @returns {boolean}
   */
  isValidColor(color) {
    return this.options.colors.includes(color);
  }

  /**
   * Validate a symbol value
   * @param {string} symbol - Symbol to validate
   * @returns {boolean}
   */
  isValidSymbol(symbol) {
    return this.options.symbols.includes(symbol);
  }

  /**
   * Validate a line style value
   * @param {string} style - Style to validate
   * @returns {boolean}
   */
  isValidLineStyle(style) {
    return this.options.lineStyles.includes(style);
  }

  /**
   * Get a formatted style description for display
   * @param {string} toolName - Name of the tool
   * @returns {string}
   */
  getDescription(toolName) {
    const style = this.styles[toolName];
    if (!style) return 'Unknown tool';

    const parts = [];

    if (style.color) {
      parts.push(`color: ${style.color}`);
    }

    if (style.symbol) {
      parts.push(`symbol: ${style.symbol}`);
    }

    if (style.style) {
      parts.push(`style: ${style.style}`);
    }

    if (style.alpha !== undefined) {
      parts.push(`opacity: ${(style.alpha * 100).toFixed(0)}%`);
    }

    if (style.angle !== undefined) {
      parts.push(`angle: ${style.angle}°`);
    }

    if (style.size !== undefined) {
      parts.push(`size: ${style.size}px`);
    }

    return parts.join(', ');
  }
}