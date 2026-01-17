// ============================================================================
// tools/TextTool.js
// ============================================================================
import { BaseTool } from './BaseTool.js';
import { DrawUtils } from '../utils/drawing.js';

export class TextTool extends BaseTool {
  constructor(styleManager) {
    super(styleManager);
    this.texts = this.items; // Alias for clarity
  }

  static accepts(f) {
    return f.geometry?.type === 'Point' && f.properties?.type === 'text';
  }

  add(latlng) {
    // Create draft on click
    this._draft = {
      lat: latlng.lat,
      lng: latlng.lng,
      ...this.getStyleSnapshot('text')
    };
  }

  finish() {
    if (this._draft && this._draft.text.trim() !== '') {
      this.texts.push(this._draft);
    }
    this._draft = null;
  }

  draw(ctx, map) {
    // Draw finalized texts
    for (const text of this.texts) {
      DrawUtils.drawText(ctx, map, text);
    }

    // Draw draft text
    if (this._draft) {
      DrawUtils.drawText(ctx, map, this._draft, true);
    }
  }

  toGeoJSON() {
    return this.texts.map(t => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [t.lng, t.lat]
      },
      properties: {
        type: 'text',
        text: t.text,
        color: t.color,
        size: t.size
      }
    }));
  }

  fromGeoJSON(f) {
    if (!TextTool.accepts(f)) return;

    const [lng, lat] = f.geometry.coordinates;

    this.texts.push({
      lat,
      lng,
      text: f.properties.text,
      color: f.properties.color || 'black',
      size: f.properties.size || 14
    });
  }
}