// ============================================================================
// utils/geometry.js
// Geographic calculations (Haversine distance, bearing, projection, etc.)
// ============================================================================

// Earth radius in meters
const EARTH_RADIUS = 6378137;

// Helper: degrees to radians
const toRad = degrees => degrees * Math.PI / 180;

// Helper: radians to degrees
const toDeg = radians => radians * 180 / Math.PI;

/**
 * Calculate distance between two points using Haversine formula
 * @param {Object} a - First point { lat, lng }
 * @param {Object} b - Second point { lat, lng }
 * @returns {number} Distance in meters
 */
export function distance(a, b) {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);

  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);

  const c =
    sinLat * sinLat +
    Math.cos(toRad(a.lat)) *
    Math.cos(toRad(b.lat)) *
    sinLng * sinLng;

  return 2 * EARTH_RADIUS * Math.atan2(Math.sqrt(c), Math.sqrt(1 - c));
}

/**
 * Calculate bearing (direction) from point A to point B
 * @param {Object} a - Start point { lat, lng }
 * @param {Object} b - End point { lat, lng }
 * @returns {number} Bearing in degrees (0-360)
 */
export function bearing(a, b) {
  const y = Math.sin(toRad(b.lng - a.lng)) * Math.cos(toRad(b.lat));
  const x =
    Math.cos(toRad(a.lat)) * Math.sin(toRad(b.lat)) -
    Math.sin(toRad(a.lat)) *
    Math.cos(toRad(b.lat)) *
    Math.cos(toRad(b.lng - a.lng));

  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

/**
 * Project a point from a center by distance and bearing
 * @param {Object} center - Start point { lat, lng }
 * @param {number} dist - Distance in meters
 * @param {number} brg - Bearing in degrees
 * @returns {Object} Projected point { lat, lng }
 */
export function project(center, dist, brg) {
  const b = toRad(brg);
  const lat1 = toRad(center.lat);
  const lng1 = toRad(center.lng);

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(dist / EARTH_RADIUS) +
    Math.cos(lat1) * Math.sin(dist / EARTH_RADIUS) * Math.cos(b)
  );

  const lng2 =
    lng1 +
    Math.atan2(
      Math.sin(b) * Math.sin(dist / EARTH_RADIUS) * Math.cos(lat1),
      Math.cos(dist / EARTH_RADIUS) - Math.sin(lat1) * Math.sin(lat2)
    );

  return {
    lat: toDeg(lat2),
    lng: toDeg(lng2)
  };
}

/**
 * Generate coordinates for a sector (pie slice)
 * @param {Object} sector - { center, radius, bearing, angle }
 * @returns {Array<Array<number>>} Array of [lng, lat] coordinates
 */
export function sectorCoordinates(sector) {
  const coords = [[sector.center.lng, sector.center.lat]];
  const step = 3; // degrees per step

  for (let a = -sector.angle / 2; a <= sector.angle / 2; a += step) {
    const p = project(sector.center, sector.radius, sector.bearing + a);
    coords.push([p.lng, p.lat]);
  }

  // Close the sector back to center
  coords.push([sector.center.lng, sector.center.lat]);

  return coords;
}

/**
 * Calculate area of a polygon using Shoelace formula
 * @param {Array<Object>} points - Array of { lat, lng }
 * @returns {number} Area in square meters
 */
export function polygonArea(points) {
  if (points.length < 3) return 0;

  let area = 0;

  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    area += points[i].lng * points[j].lat;
    area -= points[j].lng * points[i].lat;
  }

  area = Math.abs(area) / 2;

  // Convert to square meters (approximate)
  const metersPerDegree = 111320;
  return area * metersPerDegree * metersPerDegree;
}

/**
 * Calculate total length of a polyline
 * @param {Array<Object>} points - Array of { lat, lng }
 * @returns {number} Length in meters
 */
export function polylineLength(points) {
  if (points.length < 2) return 0;

  let total = 0;

  for (let i = 0; i < points.length - 1; i++) {
    total += distance(points[i], points[i + 1]);
  }

  return total;
}

/**
 * Calculate midpoint between two points
 * @param {Object} a - First point { lat, lng }
 * @param {Object} b - Second point { lat, lng }
 * @returns {Object} Midpoint { lat, lng }
 */
export function midpoint(a, b) {
  const lat1 = toRad(a.lat);
  const lng1 = toRad(a.lng);
  const lat2 = toRad(b.lat);
  const dLng = toRad(b.lng - a.lng);

  const bx = Math.cos(lat2) * Math.cos(dLng);
  const by = Math.cos(lat2) * Math.sin(dLng);

  const lat3 = Math.atan2(
    Math.sin(lat1) + Math.sin(lat2),
    Math.sqrt((Math.cos(lat1) + bx) * (Math.cos(lat1) + bx) + by * by)
  );

  const lng3 = lng1 + Math.atan2(by, Math.cos(lat1) + bx);

  return {
    lat: toDeg(lat3),
    lng: toDeg(lng3)
  };
}

/**
 * Calculate center (centroid) of a polygon
 * @param {Array<Object>} points - Array of { lat, lng }
 * @returns {Object} Center { lat, lng }
 */
export function polygonCenter(points) {
  if (points.length === 0) return { lat: 0, lng: 0 };

  let latSum = 0;
  let lngSum = 0;

  for (const point of points) {
    latSum += point.lat;
    lngSum += point.lng;
  }

  return {
    lat: latSum / points.length,
    lng: lngSum / points.length
  };
}

/**
 * Check if a point is inside a polygon
 * @param {Object} point - { lat, lng }
 * @param {Array<Object>} polygon - Array of { lat, lng }
 * @returns {boolean}
 */
export function pointInPolygon(point, polygon) {
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng;
    const yi = polygon[i].lat;
    const xj = polygon[j].lng;
    const yj = polygon[j].lat;

    const intersect =
      yi > point.lat !== yj > point.lat &&
      point.lng < ((xj - xi) * (point.lat - yi)) / (yj - yi) + xi;

    if (intersect) inside = !inside;
  }

  return inside;
}

/**
 * Format distance for display
 * @param {number} meters - Distance in meters
 * @param {number} decimals - Decimal places
 * @returns {string} Formatted string with units
 */
export function formatDistance(meters, decimals = 2) {
  if (meters < 1000) {
    return `${meters.toFixed(decimals)} m`;
  } else {
    return `${(meters / 1000).toFixed(decimals)} km`;
  }
}

/**
 * Format area for display
 * @param {number} sqMeters - Area in square meters
 * @param {number} decimals - Decimal places
 * @returns {string} Formatted string with units
 */
export function formatArea(sqMeters, decimals = 2) {
  if (sqMeters < 10000) {
    return `${sqMeters.toFixed(decimals)} m²`;
  } else if (sqMeters < 1000000) {
    return `${(sqMeters / 10000).toFixed(decimals)} ha`;
  } else {
    return `${(sqMeters / 1000000).toFixed(decimals)} km²`;
  }
}

/**
 * Normalize longitude to -180 to 180
 * @param {number} lng - Longitude
 * @returns {number} Normalized longitude
 */
export function normalizeLng(lng) {
  while (lng > 180) lng -= 360;
  while (lng < -180) lng += 360;
  return lng;
}

/**
 * Clamp latitude to -90 to 90
 * @param {number} lat - Latitude
 * @returns {number} Clamped latitude
 */
export function clampLat(lat) {
  return Math.max(-90, Math.min(90, lat));
}

// Export as namespace object as well
export const GeoUtils = {
  distance,
  bearing,
  project,
  sectorCoordinates,
  polygonArea,
  polylineLength,
  midpoint,
  polygonCenter,
  pointInPolygon,
  formatDistance,
  formatArea,
  normalizeLng,
  clampLat,
  EARTH_RADIUS
};