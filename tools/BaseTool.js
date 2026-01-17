// ============================================================================
// tools/BaseTool.js
// Abstract base class for all drawing tools
// ============================================================================

export class BaseTool {
  constructor(styleManager) {
    this.styleManager = styleManager;

    // Main data storage (can be overridden by subclasses)
    this.items = [];

    // Draft item being created (active drawing)
    this._draft = null;
  }

  // ============================================================================
  // LIFECYCLE METHODS - Override in subclasses
  // ============================================================================

  /**
   * Add a point/click to the tool
   * @param {Object} latlng - { lat: number, lng: number }
   */
  add(latlng) {
    throw new Error('add() must be implemented by subclass');
  }

  /**
   * Finish the current drawing operation
   * Default behavior: add draft to items if valid
   */
  finish() {
    if (this._draft) {
      this.items.push(this._draft);
      this._draft = null;
    }
  }

  /**
   * Draw the tool's content to canvas
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {MapView} map - Map instance for coordinate conversion
   */
  draw(ctx, map) {
    throw new Error('draw() must be implemented by subclass');
  }

  // ============================================================================
  // OPTIONAL INTERACTION METHODS - Override if needed
  // ============================================================================

  /**
   * Handle mouse move events
   * @param {Object} latlng - { lat: number, lng: number }
   */
  onMouseMove(latlng) {
    // Override in subclasses if needed
  }

  /**
   * Handle mouse down events
   * @param {Object} latlng - { lat: number, lng: number }
   */
  onMouseDown(latlng) {
    // Override in subclasses if needed
  }

  /**
   * Handle mouse up events
   * @param {Object} latlng - { lat: number, lng: number }
   */
  onMouseUp(latlng) {
    // Override in subclasses if needed
  }

  // ============================================================================
  // GEOJSON SUPPORT - Override in subclasses
  // ============================================================================

  /**
   * Check if this tool can import a GeoJSON feature
   * @param {Object} feature - GeoJSON feature
   * @returns {boolean}
   */
  static accepts(feature) {
    return false;
  }

  /**
   * Export tool data as GeoJSON features
   * @returns {Array<Object>} Array of GeoJSON features
   */
  toGeoJSON() {
    return [];
  }

  /**
   * Import a GeoJSON feature
   * @param {Object} feature - GeoJSON feature
   */
  fromGeoJSON(feature) {
    // Override in subclasses
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Get current style snapshot for a tool
   * Returns a copy to avoid mutations affecting the manager
   * @param {string} toolName - Name of the tool (points, line, etc.)
   * @returns {Object} Style object
   */
  getStyleSnapshot(toolName) {
    return this.styleManager.getStyle(toolName);
  }

  /**
   * Check if tool is currently drawing (has a draft)
   * @returns {boolean}
   */
  isDrawing() {
    return this._draft !== null;
  }

  /**
   * Cancel the current drawing operation
   */
  cancel() {
    this._draft = null;
  }

  /**
   * Get count of items in this tool
   * @returns {number}
   */
  getItemCount() {
    return this.items.length;
  }

  /**
   * Clear all items from this tool
   */
  clear() {
    this.items.length = 0;
    this._draft = null;
  }

  /**
   * Get all items (read-only access)
   * @returns {Array}
   */
  getItems() {
    return [...this.items];
  }

  /**
   * Remove an item at a specific index
   * @param {number} index - Index to remove
   * @returns {boolean} Success
   */
  removeAt(index) {
    if (index < 0 || index >= this.items.length) {
      return false;
    }

    this.items.splice(index, 1);
    return true;
  }

  /**
   * Get tool type name (derived from class name)
   * @returns {string}
   */
  getTypeName() {
    return this.constructor.name.replace('Tool', '').toLowerCase();
  }

  /**
   * Validate a lat/lng object
   * @param {Object} latlng - Object to validate
   * @returns {boolean}
   */
  isValidLatLng(latlng) {
    return (
      latlng &&
      typeof latlng.lat === 'number' &&
      typeof latlng.lng === 'number' &&
      !isNaN(latlng.lat) &&
      !isNaN(latlng.lng) &&
      latlng.lat >= -90 &&
      latlng.lat <= 90 &&
      latlng.lng >= -180 &&
      latlng.lng <= 180
    );
  }

  /**
   * Clone a lat/lng object
   * @param {Object} latlng - { lat, lng }
   * @returns {Object}
   */
  cloneLatLng(latlng) {
    return {
      lat: latlng.lat,
      lng: latlng.lng
    };
  }

  /**
   * Clone an array of lat/lng objects
   * @param {Array} points - Array of { lat, lng }
   * @returns {Array}
   */
  clonePoints(points) {
    return points.map(p => this.cloneLatLng(p));
  }

  /**
   * Debug: Print tool information
   */
  debug() {
    console.group(`${this.constructor.name} Debug`);
    console.log('Items:', this.items.length);
    console.log('Is Drawing:', this.isDrawing());
    console.log('Draft:', this._draft);
    console.groupEnd();
  }
}