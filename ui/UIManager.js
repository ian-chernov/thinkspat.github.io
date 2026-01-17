// ============================================================================
// ui/UIManager.js
// Manages all DOM interactions and UI bindings
// ============================================================================

export class UIManager {
  constructor(appState, renderCallback) {
    this.appState = appState;
    this.renderCallback = renderCallback;
    this.elements = {};
  }

  /**
   * Initialize all UI components
   */
  init() {
    this.cacheElements();
    this.initModeSelector();
    this.initToolOptions();
    this.initMapControls();
    this.initEventListeners();
  }

  /**
   * Cache DOM element references
   */
  cacheElements() {
    this.elements = {
      modeSelect: document.getElementById('mode'),
      modeOptions: document.querySelectorAll('.mode-options'),

      // Map controls
      mapSelect: document.getElementById('mapSelect'),
      mapOpacity: document.getElementById('mapOpacity'),

      // Tool-specific controls
      sectorAngle: document.getElementById('sector-angle'),

      // Tool option inputs
      pointColor: document.getElementById('point-color'),
      pointSymbol: document.getElementById('point-symbol'),

      lineColor: document.getElementById('line-color'),
      lineStyle: document.getElementById('line-style'),

      polygonColor: document.getElementById('polygon-color'),

      sectorColor: document.getElementById('sector-color'),

      textValue: document.getElementById('text-value'),
      textColor: document.getElementById('text-color'),
      textSize: document.getElementById('text-size')
    };
  }

  /**
   * Initialize mode selector dropdown
   */
  initModeSelector() {
    const { modeSelect } = this.elements;
    if (!modeSelect) return;

    modeSelect.addEventListener('change', e => {
      this.appState.setMode(e.target.value);
      this.updateCursor();
    });
  }

  /**
   * Initialize all tool option controls
   */
  initToolOptions() {
    // Points
    this.bindOption('pointColor', 'points', 'color');
    this.bindOption('pointSymbol', 'points', 'symbol');

    // Line
    this.bindOption('lineColor', 'line', 'color');
    this.bindOption('lineStyle', 'line', 'style');

    // Polygon
    this.bindOption('polygonColor', 'polygon', 'color');

    // Sector
    this.bindOption('sectorColor', 'sector', 'color');
    this.initSectorAngle();

    // Text
    this.bindOption('textValue', 'text', 'value', 'input');
    this.bindOption('textColor', 'text', 'color');
    this.bindOption('textSize', 'text', 'size', 'input', v => parseInt(v, 10) || 14);

    // Initialize color selects with options
    this.initColorSelects();
  }

  /**
   * Bind a UI input to a style property
   * @param {string} elementKey - Key in this.elements
   * @param {string} toolName - Tool name
   * @param {string} styleProp - Style property name
   * @param {string} eventType - Event type (change or input)
   * @param {Function} transform - Transform function for value
   */
  bindOption(elementKey, toolName, styleProp, eventType = 'change', transform = v => v) {
    const el = this.elements[elementKey];
    if (!el) return;

    el.addEventListener(eventType, e => {
      const value = transform(e.target.value);
      this.appState.styleManager.updateFromUI(toolName, styleProp, value);
    });
  }

  /**
   * Initialize sector angle control
   */
  initSectorAngle() {
    const { sectorAngle } = this.elements;
    if (!sectorAngle) return;

    sectorAngle.addEventListener('input', e => {
      const value = parseFloat(e.target.value);
      if (Number.isFinite(value)) {
        this.appState.styleManager.setStyle('sector', { angle: value });

        // Update active tool if it's a sector
        const tool = this.appState.getActiveTool();
        if (tool?.setAngle) {
          tool.setAngle(value);
          this.renderCallback();
        }
      }
    });
  }

  /**
   * Initialize color select dropdowns
   */
  initColorSelects() {
    const colors = this.appState.styleManager.getColors();
    const selectIds = [
      'pointColor',
      'lineColor',
      'polygonColor',
      'sectorColor',
      'textColor'
    ];

    for (const key of selectIds) {
      const sel = this.elements[key];
      if (!sel) continue;

      sel.innerHTML = '';
      for (const color of colors) {
        const opt = document.createElement('option');
        opt.value = color;
        opt.textContent = color;
        sel.appendChild(opt);
      }
    }
  }

  /**
   * Initialize map controls (base layer, opacity)
   */
  initMapControls() {
    const { mapSelect, mapOpacity } = this.elements;

    // Base layer selector
    if (mapSelect && this.appState.map) {
      const names = this.appState.map.getBaseLayerNames();

      mapSelect.innerHTML = '';
      for (const name of names) {
        const opt = document.createElement('option');
        opt.value = name;
        opt.textContent = name;
        mapSelect.appendChild(opt);
      }

      mapSelect.value = 'OSM';
      mapSelect.addEventListener('change', e => {
        this.appState.map.setBaseLayer(e.target.value);
      });
    }

    // Map opacity control
    if (mapOpacity && this.appState.map) {
      mapOpacity.addEventListener('input', e => {
        this.appState.map.setBaseOpacity(parseFloat(e.target.value));
      });
    }
  }

  /**
   * Initialize event listeners for app state changes
   */
  initEventListeners() {
    // Listen to mode changes
    this.appState.eventBus.on('mode:changed', data => {
      this.updateModeUI(data.mode);
    });

    // Listen to redraw requests
    this.appState.eventBus.on('redraw', () => {
      this.renderCallback();
    });
  }

  /**
   * Update UI when mode changes
   * @param {string} mode - New mode name
   */
  updateModeUI(mode) {
    const { modeSelect, modeOptions } = this.elements;

    // Update select value
    if (modeSelect) {
      modeSelect.value = mode;
    }

    // Show/hide mode-specific options
    modeOptions.forEach(block => {
      block.style.display = block.dataset.mode === mode ? 'flex' : 'none';
    });

    this.updateCursor();
    this.renderCallback();
  }

  /**
   * Update cursor based on current mode
   */
  updateCursor() {
    const mode = this.appState.getMode();
    document.body.style.cursor = mode === 'move' ? 'move' : 'default';
  }

  /**
   * Show a notification message
   * @param {string} message - Message to display
   * @param {string} type - Type (info, success, error)
   * @param {number} duration - Duration in ms
   */
  showNotification(message, type = 'info', duration = 3000) {
    // Create notification element
    const notif = document.createElement('div');
    notif.className = `notification notification-${type}`;
    notif.textContent = message;
    notif.style.cssText = `
      position: fixed;
      top: 60px;
      right: 10px;
      background: white;
      padding: 10px 15px;
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      z-index: 1000;
      animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(notif);

    // Auto-remove after duration
    setTimeout(() => {
      notif.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => notif.remove(), 300);
    }, duration);
  }

  /**
   * Update UI to reflect current tool statistics
   */
  updateStats() {
    const stats = this.appState.getStats();

    console.log('Current Stats:', stats);
    // Could update a stats panel if you add one to HTML
  }

  /**
   * Enable/disable UI controls
   * @param {boolean} enabled - Enable or disable
   */
  setEnabled(enabled) {
    const controls = [
      this.elements.modeSelect,
      this.elements.mapSelect,
      this.elements.mapOpacity,
      ...Object.values(this.elements).filter(el =>
        el?.tagName === 'INPUT' || el?.tagName === 'SELECT'
      )
    ];

    for (const control of controls) {
      if (control) {
        control.disabled = !enabled;
      }
    }
  }

  /**
   * Reset all tool options to defaults
   */
  resetOptions() {
    this.appState.styleManager.resetAll();

    // Update UI to reflect defaults
    const defaults = this.appState.styleManager.getDefaults();

    if (this.elements.pointColor) this.elements.pointColor.value = defaults.points.color;
    if (this.elements.pointSymbol) this.elements.pointSymbol.value = defaults.points.symbol;
    if (this.elements.lineColor) this.elements.lineColor.value = defaults.line.color;
    if (this.elements.lineStyle) this.elements.lineStyle.value = defaults.line.style;
    if (this.elements.polygonColor) this.elements.polygonColor.value = defaults.polygon.color;
    if (this.elements.sectorColor) this.elements.sectorColor.value = defaults.sector.color;
    if (this.elements.sectorAngle) this.elements.sectorAngle.value = defaults.sector.angle;
    if (this.elements.textColor) this.elements.textColor.value = defaults.text.color;
    if (this.elements.textSize) this.elements.textSize.value = defaults.text.size;
    if (this.elements.textValue) this.elements.textValue.value = defaults.text.value;

    this.showNotification('Options reset to defaults', 'success');
  }
}