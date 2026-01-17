// ============================================================================
// tools/SectorTool.js
// ============================================================================
import { BaseTool } from './BaseTool.js';
import { GeoUtils } from '../utils/geometry.js';
import { getElevation } from '../utils/elevation.js';

export class SectorTool extends BaseTool {
  constructor(styleManager) {
    super(styleManager);
    this.sectors = this.items; // Alias for clarity
  }

  static accepts(f) {
    return f.geometry?.type === 'Polygon' && f.properties?.type === 'sector';
  }

  setAngle(deg) {
    const style = this.styleManager.getStyle('sector');
    style.angle = deg;
    this.styleManager.setStyle('sector', style);
    if (this._draft) this._draft.angle = deg;
  }

  add(latlng) {
    if (!this._draft) {
      // First click: set center
      this._draft = {
        center: { lat: latlng.lat, lng: latlng.lng },
        radius: 0,
        bearing: 0,
        elev: null,
        ...this.getStyleSnapshot('sector')
      };

      getElevation(latlng.lat, latlng.lng)
        .then(e => {
          if (this._draft) this._draft.elev = e;
        })
        .catch(() => {});
      return;
    }

    // Second click: finalize sector
    this.sectors.push(this._draft);
    this._draft = null;
  }

  onMouseMove(latlng) {
    if (!this._draft) return;

    const c = this._draft.center;
    this._draft.radius = GeoUtils.distance(c, latlng);
    this._draft.bearing = GeoUtils.bearing(c, latlng);
  }

  draw(ctx, map) {
    // Draw finalized sectors
    for (const sector of this.sectors) {
      this.drawSector(ctx, map, sector);
      this.drawSectorMeasurements(ctx, map, sector);
    }

    // Draw draft sector
    if (this._draft && this._draft.radius > 0) {
      this.drawSector(ctx, map, this._draft);
      this.drawSectorMeasurements(ctx, map, this._draft);
    }
  }

  drawSector(ctx, map, sector) {
    const pts = GeoUtils.sectorCoordinates(sector);

    ctx.beginPath();
    const p0 = map.latLngToScreen({ lat: pts[0][1], lng: pts[0][0] });
    ctx.moveTo(p0.x, p0.y);

    for (let i = 1; i < pts.length; i++) {
      const p = map.latLngToScreen({ lat: pts[i][1], lng: pts[i][0] });
      ctx.lineTo(p.x, p.y);
    }

    ctx.closePath();

    // Fill with transparency
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = sector.color;
    ctx.fill();
    ctx.restore();

    // Solid outline
    ctx.strokeStyle = sector.color;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  /**
   * Draw all measurements for the sector
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} map - Map instance
   * @param {Object} sector - Sector object
   */
  drawSectorMeasurements(ctx, map, sector) {
    if (sector.radius === 0) return;

    const center = sector.center;
    const radius = sector.radius;
    const bearing = sector.bearing;
    const angle = sector.angle;

    // Calculate edge points
    const leftBearing = bearing - angle / 2;
    const rightBearing = bearing + angle / 2;

    const leftEdge = GeoUtils.project(center, radius, leftBearing);
    const rightEdge = GeoUtils.project(center, radius, rightBearing);
    const centerLine = GeoUtils.project(center, radius, bearing);

    // Draw Line 1 (left edge) label
    this.drawEdgeLabel(ctx, map, center, leftEdge, 'Line 1', sector.color);

    // Draw Line 2 (right edge) label
    this.drawEdgeLabel(ctx, map, center, rightEdge, 'Line 2', sector.color);

    // Draw center line label
    this.drawCenterLineLabel(ctx, map, center, centerLine, radius);

    // Draw radius label at center
    this.drawRadiusLabel(ctx, map, center, radius, angle);
  }

  /**
   * Draw label on an edge line
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} map - Map instance
   * @param {Object} start - Start point
   * @param {Object} end - End point
   * @param {string} text - Label text
   * @param {string} color - Line color
   */
  drawEdgeLabel(ctx, map, start, end, text, color) {
    const distance = GeoUtils.distance(start, end);
    const label = `${text}: ${GeoUtils.formatDistance(distance, 1)}`;

    // Find point 70% along the line (closer to edge)
    const labelPoint = {
      lat: start.lat + (end.lat - start.lat) * 0.7,
      lng: start.lng + (end.lng - start.lng) * 0.7
    };

    const { x, y } = map.latLngToScreen(labelPoint);

    // Calculate angle for rotation
    const screen1 = map.latLngToScreen(start);
    const screen2 = map.latLngToScreen(end);
    const angle = Math.atan2(screen2.y - screen1.y, screen2.x - screen1.x);

    ctx.font = '11px monospace';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';

    const metrics = ctx.measureText(label);
    const padding = 3;
    const bgWidth = metrics.width + padding * 2;
    const bgHeight = 14;

    ctx.save();
    ctx.translate(x, y);

    let rotation = angle;
    if (Math.abs(rotation) > Math.PI / 2) {
      rotation += Math.PI;
    }
    ctx.rotate(rotation);

    // Background
    ctx.fillStyle = 'rgba(255, 240, 245, 0.9)';
    ctx.fillRect(-bgWidth / 2, -bgHeight / 2, bgWidth, bgHeight);

    // Border
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.strokeRect(-bgWidth / 2, -bgHeight / 2, bgWidth, bgHeight);

    // Text
    ctx.fillStyle = '#000';
    ctx.fillText(label, 0, 0);

    ctx.restore();
  }

  /**
   * Draw center line label with dashed line
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} map - Map instance
   * @param {Object} center - Center point
   * @param {Object} end - End point on arc
   * @param {number} radius - Radius in meters
   */
  drawCenterLineLabel(ctx, map, center, end, radius) {
    const centerPx = map.latLngToScreen(center);
    const endPx = map.latLngToScreen(end);

    // Draw dashed center line
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(centerPx.x, centerPx.y);
    ctx.lineTo(endPx.x, endPx.y);
    ctx.stroke();
    ctx.restore();

    // Draw label
    const label = `Center: ${GeoUtils.formatDistance(radius, 1)}`;

    const labelPoint = {
      lat: center.lat + (end.lat - center.lat) * 0.5,
      lng: center.lng + (end.lng - center.lng) * 0.5
    };

    const { x, y } = map.latLngToScreen(labelPoint);

    ctx.font = 'bold 11px monospace';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';

    const metrics = ctx.measureText(label);
    const padding = 3;
    const bgWidth = metrics.width + padding * 2;
    const bgHeight = 14;

    // Background (yellow)
    ctx.fillStyle = 'rgba(255, 255, 200, 0.95)';
    ctx.fillRect(x - bgWidth / 2, y - bgHeight / 2, bgWidth, bgHeight);

    // Border
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x - bgWidth / 2, y - bgHeight / 2, bgWidth, bgHeight);

    // Text
    ctx.fillStyle = '#000';
    ctx.fillText(label, x, y);
  }

  /**
   * Draw radius and area label at sector center
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} map - Map instance
   * @param {Object} center - Center point
   * @param {number} radius - Radius in meters
   * @param {number} angle - Angle in degrees
   */
  drawRadiusLabel(ctx, map, center, radius, angle) {
    const { x, y } = map.latLngToScreen(center);

    // Calculate sector area (portion of circle)
    const fullCircleArea = Math.PI * radius * radius;
    const sectorArea = fullCircleArea * (angle / 360);

    const radiusText = `R: ${GeoUtils.formatDistance(radius, 1)}`;
    const areaText = `Area: ${GeoUtils.formatArea(sectorArea, 1)}`;
    const angleText = `${angle}°`;

    ctx.font = 'bold 12px monospace';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';

    // Calculate background size for multi-line
    const metrics1 = ctx.measureText(radiusText);
    const metrics2 = ctx.measureText(areaText);
    const metrics3 = ctx.measureText(angleText);

    const maxWidth = Math.max(metrics1.width, metrics2.width, metrics3.width);
    const padding = 5;
    const bgWidth = maxWidth + padding * 2;
    const bgHeight = 50;

    // Background (light blue)
    ctx.fillStyle = 'rgba(200, 230, 255, 0.95)';
    ctx.fillRect(x - bgWidth / 2, y - bgHeight / 2, bgWidth, bgHeight);

    // Border
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.strokeRect(x - bgWidth / 2, y - bgHeight / 2, bgWidth, bgHeight);

    // Draw three lines of text
    ctx.fillStyle = '#000';
    ctx.font = 'bold 11px monospace';
    ctx.fillText(radiusText, x, y - 12);
    ctx.fillText(areaText, x, y + 2);
    ctx.fillText(angleText, x, y + 16);
  }

  toGeoJSON() {
    return this.sectors.map(s => ({
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [GeoUtils.sectorCoordinates(s)]
      },
      properties: {
        type: 'sector',
        center: s.center,
        radius: s.radius,
        bearing: s.bearing,
        angle: s.angle,
        elevation: s.elev,
        color: s.color,
        area: Math.PI * s.radius * s.radius * (s.angle / 360)
      }
    }));
  }

  fromGeoJSON(f) {
    if (!SectorTool.accepts(f)) return;

    this.sectors.push({
      center: f.properties.center,
      radius: f.properties.radius,
      bearing: f.properties.bearing,
      angle: f.properties.angle,
      elev: f.properties.elevation,
      color: f.properties?.color || 'black'
    });
  }
}