// ============================================================================
// utils/elevation.js
// Elevation API integration with caching and debouncing
// ============================================================================

/* ===================== CACHE ===================== */

const cache = new Map();

/**
 * Clear the elevation cache
 */
export function clearCache() {
  cache.clear();
}

/**
 * Get cache size
 * @returns {number} Number of cached entries
 */
export function getCacheSize() {
  return cache.size;
}

/**
 * Get cache statistics
 * @returns {Object} Cache stats
 */
export function getCacheStats() {
  return {
    size: cache.size,
    keys: Array.from(cache.keys())
  };
}

/* ===================== DEBOUNCE UTILITY ===================== */

/**
 * Debounce a function call
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(fn, delay) {
  let timer = null;

  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/* ===================== ELEVATION FETCHING ===================== */

/**
 * Fetch elevation for a coordinate
 * Uses open-elevation.com API (free, no API key required)
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<number|null>} Elevation in meters, or null if unavailable
 */
export async function getElevation(lat, lng) {
  // Create cache key (4 decimal places ~11m precision)
  const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;

  // Check cache first
  if (cache.has(key)) {
    return cache.get(key);
  }

  try {
    const res = await fetch(
      `https://api.open-elevation.com/api/v1/lookup?locations=${lat},${lng}`
    );

    if (!res.ok) {
      console.warn(`Elevation API returned ${res.status}`);
      return null;
    }

    const data = await res.json();

    if (data.results?.[0]) {
      const elev = Math.round(data.results[0].elevation);

      // Cache the result
      cache.set(key, elev);

      return elev;
    }
  } catch (error) {
    console.warn('Elevation fetch failed:', error.message);
  }

  return null;
}

/**
 * Fetch elevation for multiple coordinates (batch request)
 * @param {Array<Object>} points - Array of { lat, lng }
 * @returns {Promise<Array<number|null>>} Array of elevations
 */
export async function getElevationBatch(points) {
  if (!points || points.length === 0) {
    return [];
  }

  // Check which points are already cached
  const results = new Array(points.length).fill(null);
  const toFetch = [];
  const fetchIndices = [];

  for (let i = 0; i < points.length; i++) {
    const key = `${points[i].lat.toFixed(4)},${points[i].lng.toFixed(4)}`;

    if (cache.has(key)) {
      results[i] = cache.get(key);
    } else {
      toFetch.push(points[i]);
      fetchIndices.push(i);
    }
  }

  // If everything was cached, return immediately
  if (toFetch.length === 0) {
    return results;
  }

  // Build batch request URL
  const locations = toFetch
    .map(p => `${p.lat},${p.lng}`)
    .join('|');

  try {
    const res = await fetch(
      `https://api.open-elevation.com/api/v1/lookup?locations=${locations}`
    );

    if (!res.ok) {
      console.warn(`Elevation API returned ${res.status}`);
      return results;
    }

    const data = await res.json();

    if (data.results) {
      data.results.forEach((result, i) => {
        const elev = Math.round(result.elevation);
        const originalIndex = fetchIndices[i];
        const point = points[originalIndex];
        const key = `${point.lat.toFixed(4)},${point.lng.toFixed(4)}`;

        // Cache and store result
        cache.set(key, elev);
        results[originalIndex] = elev;
      });
    }
  } catch (error) {
    console.warn('Batch elevation fetch failed:', error.message);
  }

  return results;
}

/* ===================== DEBOUNCED API ===================== */

/**
 * Debounced elevation fetcher (for mouse movement)
 * Waits 300ms after last call before fetching
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {Function} callback - Called with elevation when ready
 */
export const getElevationDebounced = debounce(
  async (lat, lng, callback) => {
    const elev = await getElevation(lat, lng);

    if (elev !== null && typeof callback === 'function') {
      callback(elev);
    }
  },
  300
);

/* ===================== ELEVATION PROFILES ===================== */

/**
 * Get elevation profile for a line
 * @param {Array<Object>} points - Array of { lat, lng }
 * @param {number} samples - Number of sample points (default: points.length)
 * @returns {Promise<Array<Object>>} Array of { lat, lng, elev, distance }
 */
export async function getElevationProfile(points, samples = null) {
  if (!points || points.length < 2) {
    return [];
  }

  // Use actual points if samples not specified
  const samplePoints = samples ? interpolatePoints(points, samples) : points;

  // Fetch elevations for all sample points
  const elevations = await getElevationBatch(samplePoints);

  // Calculate cumulative distance
  let totalDistance = 0;
  const profile = samplePoints.map((point, i) => {
    if (i > 0) {
      totalDistance += haversineDistance(
        samplePoints[i - 1],
        samplePoints[i]
      );
    }

    return {
      lat: point.lat,
      lng: point.lng,
      elev: elevations[i],
      distance: totalDistance
    };
  });

  return profile;
}

/**
 * Interpolate points along a line
 * @param {Array<Object>} points - Original points
 * @param {number} count - Number of points to generate
 * @returns {Array<Object>} Interpolated points
 */
function interpolatePoints(points, count) {
  if (points.length >= count) {
    return points;
  }

  const result = [points[0]];
  const segmentCount = count - 1;

  for (let i = 1; i <= segmentCount; i++) {
    const t = i / segmentCount;
    const totalLength = points.length - 1;
    const segment = t * totalLength;
    const index = Math.floor(segment);
    const fraction = segment - index;

    if (index >= points.length - 1) {
      result.push(points[points.length - 1]);
    } else {
      const a = points[index];
      const b = points[index + 1];

      result.push({
        lat: a.lat + (b.lat - a.lat) * fraction,
        lng: a.lng + (b.lng - a.lng) * fraction
      });
    }
  }

  return result;
}

/**
 * Calculate Haversine distance between two points
 * @param {Object} a - { lat, lng }
 * @param {Object} b - { lat, lng }
 * @returns {number} Distance in meters
 */
function haversineDistance(a, b) {
  const R = 6378137; // Earth radius in meters
  const toRad = deg => deg * Math.PI / 180;

  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);

  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);

  const c =
    sinLat * sinLat +
    Math.cos(toRad(a.lat)) *
    Math.cos(toRad(b.lat)) *
    sinLng * sinLng;

  return 2 * R * Math.atan2(Math.sqrt(c), Math.sqrt(1 - c));
}

/* ===================== STATISTICS ===================== */

/**
 * Calculate elevation statistics for a profile
 * @param {Array<Object>} profile - Array from getElevationProfile
 * @returns {Object} Statistics { min, max, gain, loss, avgGrade }
 */
export function getElevationStats(profile) {
  if (!profile || profile.length === 0) {
    return { min: 0, max: 0, gain: 0, loss: 0, avgGrade: 0 };
  }

  const elevations = profile.map(p => p.elev).filter(e => e !== null);

  if (elevations.length === 0) {
    return { min: 0, max: 0, gain: 0, loss: 0, avgGrade: 0 };
  }

  let min = elevations[0];
  let max = elevations[0];
  let gain = 0;
  let loss = 0;

  for (let i = 1; i < profile.length; i++) {
    const elev = profile[i].elev;
    if (elev === null) continue;

    min = Math.min(min, elev);
    max = Math.max(max, elev);

    const prevElev = profile[i - 1].elev;
    if (prevElev !== null) {
      const diff = elev - prevElev;
      if (diff > 0) gain += diff;
      if (diff < 0) loss += Math.abs(diff);
    }
  }

  const totalDistance = profile[profile.length - 1].distance;
  const totalElevChange = gain + loss;
  const avgGrade = totalDistance > 0 ? (totalElevChange / totalDistance) * 100 : 0;

  return {
    min: Math.round(min),
    max: Math.round(max),
    gain: Math.round(gain),
    loss: Math.round(loss),
    avgGrade: avgGrade.toFixed(1)
  };
}