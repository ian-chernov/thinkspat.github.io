// ============================================================================
// ui/StatusBar.js
// Manages the status display (coordinates, elevation)
// ============================================================================

import { getElevationDebounced } from '../utils/elevation.js';

export class StatusBar {
  constructor(element) {
    this.element = element;
    this.currentLat = null;
    this.currentLng = null;
    this.currentElev = null;
  }

  /**
   * Update status bar with new coordinates
   * @param {Object} latlng - { lat, lng }
   */
  update(latlng) {
    this.currentLat = latlng.lat;
    this.currentLng = latlng.lng;

    // Update display immediately with coordinates
    this.render();

    // Fetch elevation with debouncing
    getElevationDebounced(latlng.lat, latlng.lng, elev => {
      this.currentElev = elev;
      this.render();
    });
  }

  /**
   * Render the current status to the DOM
   */
  render() {
    if (!this.element) return;

    const lat = this.currentLat !== null ? this.currentLat.toFixed(6) : '—';
    const lng = this.currentLng !== null ? this.currentLng.toFixed(6) : '—';
    const elev = this.currentElev !== null ? `${this.currentElev} m` : '…';

    this.element.innerHTML =
      `lat: ${lat}<br>` +
      `lng: ${lng}<br>` +
      `elev: ${elev}`;
  }

  /**
   * Clear the status bar
   */
  clear() {
    this.currentLat = null;
    this.currentLng = null;
    this.currentElev = null;

    if (this.element) {
      this.element.innerHTML = 'lat: —<br>lng: —<br>elev: —';
    }
  }

  /**
   * Set custom text in the status bar
   * @param {string} text - HTML content to display
   */
  setText(text) {
    if (this.element) {
      this.element.innerHTML = text;
    }
  }

  /**
   * Add an additional line to status bar
   * @param {string} key - Key name
   * @param {string} value - Value to display
   */
  addLine(key, value) {
    if (!this.element) return;

    const line = document.createElement('div');
    line.textContent = `${key}: ${value}`;
    this.element.appendChild(line);
  }

  /**
   * Show/hide the status bar
   * @param {boolean} visible - Visibility
   */
  setVisible(visible) {
    if (this.element) {
      this.element.style.display = visible ? 'block' : 'none';
    }
  }
}