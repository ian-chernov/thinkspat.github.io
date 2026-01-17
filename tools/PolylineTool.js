// ============================================================================
// tools/PolylineTool.js
// ============================================================================
import { BaseTool } from './BaseTool.js';
import { DrawUtils } from '../utils/drawing.js';
import { GeoUtils } from '../utils/geometry.js';
import { getElevation } from '../utils/elevation.js';

export class PolylineTool extends BaseTool {
  constructor(styleManager) {
    super(styleManager);
    this.lines = this.items; // Alias for clarity
    this._hover = null;
  }

  static accepts(f) {
    return f.geometry?.type === 'LineString';
  }

  add(latlng) {
    if (!this._draft) {
      this._draft = {
        points: [],
        ...this.getStyleSnapshot('line')
      };
    }

    const p = { lat: latlng.lat, lng: latlng.lng, elev: null };
    this._draft.points.push(p);

    // Fetch elevation asynchronously
    getElevation(p.lat, p.lng)
      .then(e => (p.elev = e))
      .catch(() => {});
  }

  finish() {
    if (this._draft?.points.length > 1) {
      this.lines.push(this._draft);
    }
    this._draft = null;
    this._hover = null;
  }

  onMouseMove(latlng) {
    if (this._draft) this._hover = latlng;
  }

  draw(ctx, map) {
    // Draw finalized lines
    for (const line of this.lines) {
      DrawUtils.drawLine(ctx, map, line.points, {
        color: line.color,
        dashed: line.style === 'dashed'
      });

      // Draw distance label
      this.drawDistanceLabel(ctx, map, line.points);
    }

    // Draw draft line with hover
    if (this._draft) {
      const pts = [...this._draft.points];
      if (this._hover) pts.push(this._hover);

      DrawUtils.drawLine(ctx, map, pts, {
        color: this._draft.color,
        dashed: this._draft.style === 'dashed'
      });

      // Draw distance label for draft
      this.drawDistanceLabel(ctx, map, pts);
    }
  }

  /**
   * Draw distance label at the midpoint of the line
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} map - Map instance
   * @param {Array} points - Line points
   */
  drawDistanceLabel(ctx, map, points) {
    if (points.length < 2) return;

    // Calculate total distance
    const distance = GeoUtils.polylineLength(points);
    const label = GeoUtils.formatDistance(distance);

    // Find midpoint of the line
    const midIndex = Math.floor(points.length / 2);
    let midPoint;

    if (points.length % 2 === 0) {
      // Even number of points - interpolate between two middle points
      midPoint = GeoUtils.midpoint(points[midIndex - 1], points[midIndex]);
    } else {
      // Odd number of points - use the middle point
      midPoint = points[midIndex];
    }

    const { x, y } = map.latLngToScreen(midPoint);

    // Draw label background
    ctx.font = '12px monospace';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';

    const metrics = ctx.measureText(label);
    const padding = 4;
    const bgWidth = metrics.width + padding * 2;
    const bgHeight = 16;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillRect(
      x - bgWidth / 2,
      y - bgHeight / 2,
      bgWidth,
      bgHeight
    );

    // Draw label border
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.strokeRect(
      x - bgWidth / 2,
      y - bgHeight / 2,
      bgWidth,
      bgHeight
    );

    // Draw label text
    ctx.fillStyle = '#000';
    ctx.fillText(label, x, y);
  }

  toGeoJSON() {
    return this.lines.map(l => ({
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: l.points.map(p => [p.lng, p.lat])
      },
      properties: {
        color: l.color,
        style: l.style,
        distance: GeoUtils.polylineLength(l.points)
      }
    }));
  }

  fromGeoJSON(f) {
    if (!PolylineTool.accepts(f)) return;

    this.lines.push({
      points: f.geometry.coordinates.map(c => ({
        lng: c[0],
        lat: c[1],
        elev: null
      })),
      color: f.properties?.color || 'black',
      style: f.properties?.style || 'solid'
    });
  }
}