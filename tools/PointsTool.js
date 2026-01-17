// ============================================================================
// tools/PointsTool.js
// ============================================================================
import { BaseTool } from './BaseTool.js';
import { DrawUtils } from '../utils/drawing.js';
import { getElevation } from '../utils/elevation.js';

export class PointsTool extends BaseTool {
  constructor(styleManager, drawCallback) {
    super(styleManager);
    this.points = this.items; // Alias for clarity
    this.drawCallback = drawCallback;
  }

  static accepts(f) {
    return f.geometry?.type === 'Point' && !f.properties?.type;
  }

  add(latlng) {
    const point = {
      lat: latlng.lat,
      lng: latlng.lng,
      elev: null,
      ...this.getStyleSnapshot('points')
    };

    this.points.push(point);

    // Fetch elevation asynchronously
    getElevation(point.lat, point.lng)
      .then(e => {
        point.elev = e;
        this.drawCallback?.();
      })
      .catch(() => {});
  }

  draw(ctx, map) {
    for (const point of this.points) {
      DrawUtils.drawPoint(ctx, map, point);
      DrawUtils.drawPointLabel(ctx, map, point);
    }
  }

  toGeoJSON() {
    return this.points.map(p => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [p.lng, p.lat]
      },
      properties: {
        elevation: p.elev,
        color: p.color,
        symbol: p.symbol
      }
    }));
  }

  fromGeoJSON(f) {
    if (!PointsTool.accepts(f)) return;

    const [lng, lat] = f.geometry.coordinates;

    this.points.push({
      lat,
      lng,
      elev: f.properties?.elevation ?? null,
      color: f.properties?.color ?? 'black',
      symbol: f.properties?.symbol ?? 'circle'
    });
  }
}