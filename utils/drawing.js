// ============================================================================
// utils/drawing.js
// Canvas drawing utilities for points, lines, polygons, text
// ============================================================================

/**
 * Draw a point on canvas
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Object} map - Map instance for coordinate conversion
 * @param {Object} point - Point object { lat, lng, color, symbol }
 */
export function drawPoint(ctx, map, point) {
  const { x, y } = map.latLngToScreen(point);
  const symbol = point.symbol || 'circle';
  const color = point.color || 'black';

  ctx.fillStyle = color;
  ctx.beginPath();

  switch (symbol) {
    case 'square':
      ctx.rect(x - 4, y - 4, 8, 8);
      break;

    case 'triangle':
      ctx.moveTo(x, y - 5);
      ctx.lineTo(x + 5, y + 4);
      ctx.lineTo(x - 5, y + 4);
      ctx.closePath();
      break;

    default: // circle
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.closePath();
  }

  ctx.fill();
}

/**
 * Draw a label for a point
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Object} map - Map instance
 * @param {Object} point - Point object { lat, lng, elev }
 */
export function drawPointLabel(ctx, map, point) {
  const { x, y } = map.latLngToScreen(point);
  const label = `${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}${point.elev ? ` | ${point.elev} m` : ''}`;

  ctx.font = '12px monospace';
  ctx.fillStyle = '#000';
  ctx.fillText(label, x + 8, y + 6);
}

/**
 * Draw a line/polyline on canvas
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Object} map - Map instance
 * @param {Array<Object>} points - Array of { lat, lng }
 * @param {Object} style - Style options { color, width, dashed }
 */
export function drawLine(ctx, map, points, style = {}) {
  if (points.length < 2) return;

  ctx.strokeStyle = style.color || 'black';
  ctx.lineWidth = style.width || 2;
  ctx.setLineDash(style.dashed ? [8, 6] : []);

  ctx.beginPath();
  const p0 = map.latLngToScreen(points[0]);
  ctx.moveTo(p0.x, p0.y);

  for (let i = 1; i < points.length; i++) {
    const p = map.latLngToScreen(points[i]);
    ctx.lineTo(p.x, p.y);
  }

  ctx.stroke();
  ctx.setLineDash([]); // Reset dash
}

/**
 * Draw a polygon on canvas
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Object} map - Map instance
 * @param {Array<Object>} points - Array of { lat, lng }
 * @param {Object} style - Style options { fillColor, strokeColor, alpha, width }
 */
export function drawPolygon(ctx, map, points, style = {}) {
  if (points.length < 3) return;

  const fillColor = style.fillColor || 'green';
  const strokeColor = style.strokeColor || fillColor;
  const alpha = style.alpha !== undefined ? style.alpha : 0.25;
  const lineWidth = style.width || 2;

  ctx.fillStyle = fillColor;
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = lineWidth;

  ctx.beginPath();
  const p0 = map.latLngToScreen(points[0]);
  ctx.moveTo(p0.x, p0.y);

  for (let i = 1; i < points.length; i++) {
    const p = map.latLngToScreen(points[i]);
    ctx.lineTo(p.x, p.y);
  }

  ctx.closePath();

  // Fill with transparency
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fill();
  ctx.restore();

  // Stroke with full opacity
  ctx.stroke();
}

/**
 * Draw text on canvas
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Object} map - Map instance
 * @param {Object} textObj - Text object { lat, lng, text, color, size }
 * @param {boolean} draft - Whether this is a draft (semi-transparent)
 */
export function drawText(ctx, map, textObj, draft = false) {
  const { x, y } = map.latLngToScreen(textObj);

  ctx.font = `${textObj.size || 14}px sans-serif`;
  ctx.fillStyle = textObj.color || 'black';
  ctx.textBaseline = 'top';

  if (draft) {
    ctx.globalAlpha = 0.6;
  }

  ctx.fillText(textObj.text || '', x, y);

  if (draft) {
    ctx.globalAlpha = 1;
  }
}

/**
 * Calculate distance from point to line segment
 * Used for hit detection on lines
 * @param {Object} p - Point { x, y }
 * @param {Object} a - Segment start { x, y }
 * @param {Object} b - Segment end { x, y }
 * @returns {number} Distance in pixels
 */
export function distToSegment(p, a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;

  if (dx === 0 && dy === 0) {
    return Math.hypot(p.x - a.x, p.y - a.y);
  }

  const t =
    ((p.x - a.x) * dx + (p.y - a.y) * dy) /
    (dx * dx + dy * dy);

  const clamped = Math.max(0, Math.min(1, t));

  const x = a.x + clamped * dx;
  const y = a.y + clamped * dy;

  return Math.hypot(p.x - x, p.y - y);
}

/**
 * Draw a circle (for future use - compass rose, radius display, etc.)
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Object} map - Map instance
 * @param {Object} center - Center point { lat, lng }
 * @param {number} radius - Radius in pixels
 * @param {Object} style - Style options
 */
export function drawCircle(ctx, map, center, radius, style = {}) {
  const { x, y } = map.latLngToScreen(center);

  ctx.strokeStyle = style.color || 'black';
  ctx.lineWidth = style.width || 2;

  if (style.fill) {
    ctx.fillStyle = style.fillColor || style.color || 'black';
    ctx.globalAlpha = style.alpha || 0.25;
  }

  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);

  if (style.fill) {
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  ctx.stroke();
}

/**
 * Draw an arrow (for bearing indicators, wind direction, etc.)
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Object} map - Map instance
 * @param {Object} start - Start point { lat, lng }
 * @param {Object} end - End point { lat, lng }
 * @param {Object} style - Style options
 */
export function drawArrow(ctx, map, start, end, style = {}) {
  const p1 = map.latLngToScreen(start);
  const p2 = map.latLngToScreen(end);

  const headLength = style.headLength || 10;
  const headWidth = style.headWidth || 6;

  ctx.strokeStyle = style.color || 'black';
  ctx.fillStyle = style.color || 'black';
  ctx.lineWidth = style.width || 2;

  // Draw line
  ctx.beginPath();
  ctx.moveTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.stroke();

  // Draw arrowhead
  const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);

  ctx.beginPath();
  ctx.moveTo(p2.x, p2.y);
  ctx.lineTo(
    p2.x - headLength * Math.cos(angle - Math.PI / 6),
    p2.y - headLength * Math.sin(angle - Math.PI / 6)
  );
  ctx.lineTo(
    p2.x - headLength * Math.cos(angle + Math.PI / 6),
    p2.y - headLength * Math.sin(angle + Math.PI / 6)
  );
  ctx.closePath();
  ctx.fill();
}

/**
 * Draw a grid (for coordinate reference)
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Object} map - Map instance
 * @param {Object} options - Grid options
 */
export function drawGrid(ctx, map, options = {}) {
  const spacing = options.spacing || 0.1; // degrees
  const color = options.color || 'rgba(0,0,0,0.1)';
  const lineWidth = options.width || 1;

  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;

  // Get map bounds (approximate)
  const bounds = map.map.getBounds();
  const sw = bounds.getSouthWest();
  const ne = bounds.getNorthEast();

  // Draw vertical lines (longitude)
  for (let lng = Math.floor(sw.lng / spacing) * spacing; lng <= ne.lng; lng += spacing) {
    const p1 = map.latLngToScreen({ lat: sw.lat, lng });
    const p2 = map.latLngToScreen({ lat: ne.lat, lng });

    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  }

  // Draw horizontal lines (latitude)
  for (let lat = Math.floor(sw.lat / spacing) * spacing; lat <= ne.lat; lat += spacing) {
    const p1 = map.latLngToScreen({ lat, lng: sw.lng });
    const p2 = map.latLngToScreen({ lat, lng: ne.lng });

    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  }
}

// Export as namespace object as well
export const DrawUtils = {
  drawPoint,
  drawPointLabel,
  drawLine,
  drawPolygon,
  drawText,
  distToSegment,
  drawCircle,
  drawArrow,
  drawGrid
};