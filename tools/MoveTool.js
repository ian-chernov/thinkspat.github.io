// ============================================================================
// tools/MoveTool.js
// ============================================================================

export class MoveTool {
  constructor(toolManager, map, hitDetector) {
    this.toolManager = toolManager;
    this.map = map;
    this.hitDetector = hitDetector;
    this.isMoveTool = true;

    this._target = null;
    this._origin = null;
    this._start = null;
  }

  onMouseDown(latlng) {
    const tools = this.toolManager.getAllTools().filter(t => !t.isMoveTool);
    const hit = this.hitDetector.pick(latlng, tools);
    if (!hit) return;

    this._target = hit;
    this._origin = this.clone(hit);
    this._start = latlng;
  }

  onMouseMove(latlng) {
    if (!this._target) return;

    const dLat = latlng.lat - this._start.lat;
    const dLng = latlng.lng - this._start.lng;

    this.applyDelta(this._target, this._origin, dLat, dLng);
  }

  finish() {
    this._target = null;
    this._origin = null;
    this._start = null;
  }

  draw() {
    // Move tool doesn't draw anything
  }

  clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  applyDelta(target, origin, dLat, dLng) {
    // Point or Text (has lat/lng directly)
    if (target.lat !== undefined && !target.points) {
      target.lat = origin.lat + dLat;
      target.lng = origin.lng + dLng;
      return;
    }

    // Sector (has center)
    if (target.center) {
      target.center.lat = origin.center.lat + dLat;
      target.center.lng = origin.center.lng + dLng;
      return;
    }

    // Line or Polygon (has points array)
    if (target.points) {
      for (let i = 0; i < target.points.length; i++) {
        target.points[i].lat = origin.points[i].lat + dLat;
        target.points[i].lng = origin.points[i].lng + dLng;
      }
    }
  }
}