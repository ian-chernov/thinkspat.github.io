// ============================================================================
// utils/hitDetection.js
// Unified hit detection for clicking/selecting geometry
// ============================================================================

import { DrawUtils } from './drawing.js';

export class HitDetector {
  constructor(map, tolerance = 8) {
    this.map = map;
    this.tolerance = tolerance;
  }

  /**
   * Pick an item at a lat/lng location (for MoveTool)
   * Returns the first item found
   * @param {Object} latlng - { lat, lng }
   * @param {Array} tools - Array of tool instances
   * @returns {Object|null} The item that was hit, or null
   */
  pick(latlng, tools) {
    const mousePx = this.map.latLngToScreen(latlng);

    for (const tool of tools) {
      const items = this.extractItems(tool);

      for (const item of items) {
        if (this.hitTest(item, mousePx)) {
          return item;
        }
      }
    }

    return null;
  }

  /**
   * Pick an item for deletion (returns tool array and index)
   * @param {Object} latlng - { lat, lng }
   * @param {Array} tools - Array of tool instances
   * @returns {Object|null} { tool: Array, index: number } or null
   */
  pickForDelete(latlng, tools) {
    const mousePx = this.map.latLngToScreen(latlng);

    for (const tool of tools) {
      const list = this.extractList(tool);
      if (!list) continue;

      for (let i = 0; i < list.length; i++) {
        if (this.hitTest(list[i], mousePx)) {
          return { tool: list, index: i };
        }
      }
    }

    return null;
  }

  /**
   * Test if an item was hit by the mouse
   * @param {Object} item - Geometry item (point, line, polygon, sector, text)
   * @param {Object} mousePx - Mouse position in screen coordinates { x, y }
   * @returns {boolean}
   */
  hitTest(item, mousePx) {
    // Point or Text (single lat/lng, no points array)
    if (item.lat !== undefined && !item.points) {
      return this.hitTestPoint(item, mousePx);
    }

    // Sector (has center property)
    if (item.center) {
      return this.hitTestSector(item, mousePx);
    }

    // Line or Polygon (has points array)
    if (item.points && Array.isArray(item.points)) {
      return this.hitTestPolyline(item, mousePx);
    }

    return false;
  }

  /**
   * Test if a point was hit
   * @param {Object} point - { lat, lng }
   * @param {Object} mousePx - { x, y }
   * @returns {boolean}
   */
  hitTestPoint(point, mousePx) {
    const pointPx = this.map.latLngToScreen(point);
    return this.distancePx(mousePx, pointPx) < this.tolerance;
  }

  /**
   * Test if a sector was hit (tests center point)
   * @param {Object} sector - { center: { lat, lng }, ... }
   * @param {Object} mousePx - { x, y }
   * @returns {boolean}
   */
  hitTestSector(sector, mousePx) {
    const centerPx = this.map.latLngToScreen(sector.center);
    return this.distancePx(mousePx, centerPx) < this.tolerance;
  }

  /**
   * Test if a polyline or polygon was hit
   * Tests each segment of the line/polygon
   * @param {Object} item - { points: Array }
   * @param {Object} mousePx - { x, y }
   * @returns {boolean}
   */
  hitTestPolyline(item, mousePx) {
    if (!item.points || item.points.length < 2) return false;

    // Test each segment
    for (let i = 0; i < item.points.length - 1; i++) {
      const a = this.map.latLngToScreen(item.points[i]);
      const b = this.map.latLngToScreen(item.points[i + 1]);

      if (DrawUtils.distToSegment(mousePx, a, b) < this.tolerance) {
        return true;
      }
    }

    return false;
  }

  /**
   * Calculate distance between two screen points
   * @param {Object} a - { x, y }
   * @param {Object} b - { x, y }
   * @returns {number} Distance in pixels
   */
  distancePx(a, b) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Extract items array from a tool
   * Handles different tool structures (items, points, lines, etc.)
   * @param {Object} tool - Tool instance
   * @returns {Array}
   */
  extractItems(tool) {
    return (
      tool.items ||
      tool.points ||
      tool.texts ||
      tool.lines ||
      tool.polygons ||
      tool.sectors ||
      []
    );
  }

  /**
   * Extract the mutable list from a tool (for deletion)
   * @param {Object} tool - Tool instance
   * @returns {Array|null}
   */
  extractList(tool) {
    return (
      tool.points ||
      tool.texts ||
      tool.lines ||
      tool.polygons ||
      tool.sectors ||
      null
    );
  }

  /**
   * Set hit detection tolerance
   * @param {number} tolerance - Tolerance in pixels
   */
  setTolerance(tolerance) {
    this.tolerance = tolerance;
  }

  /**
   * Get current tolerance
   * @returns {number}
   */
  getTolerance() {
    return this.tolerance;
  }

  /**
   * Pick all items within tolerance (for area selection)
   * @param {Object} latlng - { lat, lng }
   * @param {Array} tools - Array of tool instances
   * @returns {Array} Array of hit items
   */
  pickAll(latlng, tools) {
    const mousePx = this.map.latLngToScreen(latlng);
    const hits = [];

    for (const tool of tools) {
      const items = this.extractItems(tool);

      for (const item of items) {
        if (this.hitTest(item, mousePx)) {
          hits.push({
            item,
            tool,
            toolName: tool.constructor.name
          });
        }
      }
    }

    return hits;
  }

  /**
   * Pick items within a bounding box (for drag selection)
   * @param {Object} bounds - { minLat, maxLat, minLng, maxLng }
   * @param {Array} tools - Array of tool instances
   * @returns {Array} Array of items within bounds
   */
  pickInBounds(bounds, tools) {
    const hits = [];

    for (const tool of tools) {
      const items = this.extractItems(tool);

      for (const item of items) {
        if (this.isInBounds(item, bounds)) {
          hits.push({
            item,
            tool,
            toolName: tool.constructor.name
          });
        }
      }
    }

    return hits;
  }

  /**
   * Check if an item is within geographic bounds
   * @param {Object} item - Geometry item
   * @param {Object} bounds - { minLat, maxLat, minLng, maxLng }
   * @returns {boolean}
   */
  isInBounds(item, bounds) {
    // Point or Text
    if (item.lat !== undefined && !item.points) {
      return this.pointInBounds(item, bounds);
    }

    // Sector (test center)
    if (item.center) {
      return this.pointInBounds(item.center, bounds);
    }

    // Line or Polygon (test if any point is in bounds)
    if (item.points && Array.isArray(item.points)) {
      return item.points.some(p => this.pointInBounds(p, bounds));
    }

    return false;
  }

  /**
   * Check if a point is within bounds
   * @param {Object} point - { lat, lng }
   * @param {Object} bounds - { minLat, maxLat, minLng, maxLng }
   * @returns {boolean}
   */
  pointInBounds(point, bounds) {
    return (
      point.lat >= bounds.minLat &&
      point.lat <= bounds.maxLat &&
      point.lng >= bounds.minLng &&
      point.lng <= bounds.maxLng
    );
  }
}