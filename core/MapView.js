// ============================================================================
// core/MapView.js
// Leaflet map wrapper with base layer management
// ============================================================================

export class MapView {
  constructor() {
    // Initialize Leaflet map
    this.map = L.map('map').setView([50, 14], 13);

    // Define available base layers
    this.baseLayers = {
      'OSM': L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          maxZoom: 19,
          attribution: '© OpenStreetMap'
        }
      ),

      'OpenTopoMap': L.tileLayer(
        'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
        {
          maxZoom: 17,
          attribution: '© OpenTopoMap'
        }
      ),

      'Esri Topo': L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/' +
          'World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
        { attribution: '© Esri' }
      ),

      'Esri Imagery': L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/' +
          'World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { attribution: '© Esri' }
      ),

      'Sentinel-2': L.tileLayer(
        'https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2020_3857/default/' +
        'GoogleMapsCompatible/{z}/{y}/{x}.jpg',
        {
          attribution: '© EOX / Sentinel-2',
          maxZoom: 19
        }
      )
    };

    // Track active layer
    this._activeBase = null;
    this.setBaseLayer('OSM'); // Set default
  }

  // ==========================================================================
  // BASE LAYER MANAGEMENT
  // ==========================================================================

  /**
   * Set the active base layer
   * @param {string} name - Layer name
   */
  setBaseLayer(name) {
    const layer = this.baseLayers[name];
    if (!layer) {
      console.warn(`MapView: Unknown layer "${name}"`);
      return;
    }

    // Remove current layer
    if (this._activeBase) {
      this.map.removeLayer(this._activeBase);
    }

    // Add new layer
    this._activeBase = layer;
    layer.addTo(this.map);
  }

  /**
   * Set base layer opacity
   * @param {number} alpha - Opacity (0-1)
   */
  setBaseOpacity(alpha) {
    if (this._activeBase?.setOpacity) {
      this._activeBase.setOpacity(alpha);
    }
  }

  /**
   * Get list of available base layer names
   * @returns {string[]}
   */
  getBaseLayerNames() {
    return Object.keys(this.baseLayers);
  }

  /**
   * Get currently active base layer name
   * @returns {string|null}
   */
  getActiveLayerName() {
    for (const [name, layer] of Object.entries(this.baseLayers)) {
      if (layer === this._activeBase) {
        return name;
      }
    }
    return null;
  }

  // ==========================================================================
  // EVENT HANDLERS
  // ==========================================================================

  /**
   * Register click handler
   * @param {Function} callback - Called with { lat, lng }
   */
  onClick(callback) {
    this.map.on('click', e => callback(e.latlng));
  }

  /**
   * Register double-click handler
   * @param {Function} callback - Called on double click
   */
  onDoubleClick(callback) {
    this.map.on('dblclick', callback);
  }

  /**
   * Register mouse down handler
   * @param {Function} callback - Called with { lat, lng }
   */
  onMouseDown(callback) {
    this.map.on('mousedown', e => callback(e.latlng));
  }

  /**
   * Register mouse up handler
   * @param {Function} callback - Called on mouse up
   */
  onMouseUp(callback) {
    this.map.on('mouseup', callback);
  }

  /**
   * Register mouse move handler
   * @param {Function} callback - Called with { lat, lng }
   */
  onMouseMove(callback) {
    this.map.on('mousemove', e => callback(e.latlng));
  }

  /**
   * Register map move/zoom handler
   * @param {Function} callback - Called on move or zoom
   */
  onMove(callback) {
    this.map.on('move zoom', callback);
  }

  // ==========================================================================
  // COORDINATE CONVERSION
  // ==========================================================================

  /**
   * Convert lat/lng to screen coordinates
   * @param {Object} latlng - { lat, lng }
   * @returns {Object} { x, y } in pixels
   */
  latLngToScreen(latlng) {
    return this.map.latLngToContainerPoint(latlng);
  }

  /**
   * Convert screen coordinates to lat/lng
   * @param {Object} point - { x, y } in pixels
   * @returns {Object} { lat, lng }
   */
  screenToLatLng(point) {
    return this.map.containerPointToLatLng(point);
  }

  // ==========================================================================
  // MAP CONTROL
  // ==========================================================================

  /**
   * Set map view to coordinates and zoom
   * @param {Object} latlng - { lat, lng }
   * @param {number} zoom - Zoom level
   */
  setView(latlng, zoom) {
    this.map.setView(latlng, zoom);
  }

  /**
   * Get current map center
   * @returns {Object} { lat, lng }
   */
  getCenter() {
    return this.map.getCenter();
  }

  /**
   * Get current zoom level
   * @returns {number}
   */
  getZoom() {
    return this.map.getZoom();
  }

  /**
   * Get map bounds
   * @returns {Object} Leaflet LatLngBounds
   */
  getBounds() {
    return this.map.getBounds();
  }

  /**
   * Fit map to bounds
   * @param {Array<Object>} points - Array of { lat, lng }
   */
  fitBounds(points) {
    if (!points || points.length === 0) return;

    const bounds = L.latLngBounds(points.map(p => [p.lat, p.lng]));
    this.map.fitBounds(bounds, { padding: [50, 50] });
  }

  /**
   * Pan to coordinates
   * @param {Object} latlng - { lat, lng }
   */
  panTo(latlng) {
    this.map.panTo(latlng);
  }

  /**
   * Zoom in
   */
  zoomIn() {
    this.map.zoomIn();
  }

  /**
   * Zoom out
   */
  zoomOut() {
    this.map.zoomOut();
  }

  // ==========================================================================
  // UTILITY
  // ==========================================================================

  /**
   * Invalidate map size (call after container resize)
   */
  invalidateSize() {
    this.map.invalidateSize();
  }

  /**
   * Remove the map and clean up
   */
  destroy() {
    this.map.remove();
  }

  /**
   * Get the underlying Leaflet map instance
   * @returns {L.Map}
   */
  getLeafletMap() {
    return this.map;
  }
}