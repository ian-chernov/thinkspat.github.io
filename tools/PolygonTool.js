// ============================================================================
// tools/PolygonTool.js
// ============================================================================
import { BaseTool } from './BaseTool.js';
import { DrawUtils } from '../utils/drawing.js';
import { GeoUtils } from '../utils/geometry.js';

export class PolygonTool extends BaseTool {
  constructor(styleManager) {
    super(styleManager);
    this.polygons = this.items; // Alias for clarity
    this._hover = null;
  }

  static accepts(f) {
    return f.geometry?.type === 'Polygon' && f.properties?.type !== 'sector';
  }

  add(latlng) {
    if (!this._draft) {
      this._draft = {
        points: [],
        ...this.getStyleSnapshot('polygon')
      };
    }

    this._draft.points.push({ lat: latlng.lat, lng: latlng.lng });
  }

  finish() {
    if (this._draft?.points.length > 2) {
      this.polygons.push(this._draft);
    }
    this._draft = null;
    this._hover = null;
  }

  onMouseMove(latlng) {
    if (this._draft) this._hover = latlng;
  }

  draw(ctx, map) {
    // Draw finalized polygons
    for (const poly of this.polygons) {
      DrawUtils.drawPolygon(ctx, map, poly.points, {
        fillColor: poly.color,
        alpha: poly.alpha
      });

      // Draw segment distances
      this.drawSegmentDistances(ctx, map, poly.points);

      // Draw area label
      this.drawAreaLabel(ctx, map, poly.points);
    }

    // Draw draft polygon with hover
    if (this._draft) {
      const pts = [...this._draft.points];
      if (this._hover) pts.push(this._hover);

      DrawUtils.drawPolygon(ctx, map, pts, {
        fillColor: this._draft.color,
        alpha: this._draft.alpha
      });

      // Draw segment distances for draft
      this.drawSegmentDistances(ctx, map, pts);

      // Draw area label for draft (if closed)
      if (pts.length > 2) {
        this.drawAreaLabel(ctx, map, pts);
      }
    }
  }

  /**
   * Draw distance labels on each segment of the polygon
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} map - Map instance
   * @param {Array} points - Polygon points
   */
  drawSegmentDistances(ctx, map, points) {
    if (points.length < 2) return;

    ctx.font = '11px monospace';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';

    // Draw distance for each segment
    for (let i = 0; i < points.length; i++) {
      const p1 = points[i];
      const p2 = points[(i + 1) % points.length];

      // Skip the closing segment if we only have 2 points
      if (points.length === 2 && i === 1) continue;

      const distance = GeoUtils.distance(p1, p2);
      const label = GeoUtils.formatDistance(distance, 1); // 1 decimal place

      // Calculate midpoint of segment
      const mid = GeoUtils.midpoint(p1, p2);
      const { x, y } = map.latLngToScreen(mid);

      // Calculate angle of segment for label rotation
      const screen1 = map.latLngToScreen(p1);
      const screen2 = map.latLngToScreen(p2);
      const angle = Math.atan2(screen2.y - screen1.y, screen2.x - screen1.x);

      // Draw label background
      const metrics = ctx.measureText(label);
      const padding = 3;
      const bgWidth = metrics.width + padding * 2;
      const bgHeight = 14;

      ctx.save();
      ctx.translate(x, y);

      // Rotate label to align with segment (keep text readable)
      let rotation = angle;
      if (Math.abs(rotation) > Math.PI / 2) {
        rotation += Math.PI;
      }
      ctx.rotate(rotation);

      // Background
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.fillRect(-bgWidth / 2, -bgHeight / 2, bgWidth, bgHeight);

      // Border
      ctx.strokeStyle = '#666';
      ctx.lineWidth = 1;
      ctx.strokeRect(-bgWidth / 2, -bgHeight / 2, bgWidth, bgHeight);

      // Text
      ctx.fillStyle = '#333';
      ctx.fillText(label, 0, 0);

      ctx.restore();
    }
  }

  /**
   * Draw area label at the center of the polygon
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} map - Map instance
   * @param {Array} points - Polygon points
   */
  drawAreaLabel(ctx, map, points) {
    if (points.length < 3) return;

    // Calculate area
    const area = GeoUtils.polygonArea(points);
    const label = GeoUtils.formatArea(area);

    // Find center of polygon
    const center = GeoUtils.polygonCenter(points);
    const { x, y } = map.latLngToScreen(center);

    // Draw label
    ctx.font = 'bold 13px monospace';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';

    const metrics = ctx.measureText(label);
    const padding = 6;
    const bgWidth = metrics.width + padding * 2;
    const bgHeight = 20;

    // Background
    ctx.fillStyle = 'rgba(255, 255, 200, 0.95)';
    ctx.fillRect(
      x - bgWidth / 2,
      y - bgHeight / 2,
      bgWidth,
      bgHeight
    );

    // Border
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.strokeRect(
      x - bgWidth / 2,
      y - bgHeight / 2,
      bgWidth,
      bgHeight
    );

    // Text
    ctx.fillStyle = '#000';
    ctx.fillText(label, x, y);
  }

  toGeoJSON() {
    return this.polygons.map(p => ({
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          ...p.points.map(pt => [pt.lng, pt.lat]),
          [p.points[0].lng, p.points[0].lat]
        ]]
      },
      properties: {
        color: p.color,
        alpha: p.alpha,
        area: GeoUtils.polygonArea(p.points)
      }
    }));
  }

  fromGeoJSON(f) {
    if (!PolygonTool.accepts(f)) return;

    const ring = f.geometry.coordinates[0];

    this.polygons.push({
      points: ring.slice(0, -1).map(c => ({
        lng: c[0],
        lat: c[1]
      })),
      color: f.properties?.color ?? 'green',
      alpha: f.properties?.alpha ?? 0.25
    });
  }
}