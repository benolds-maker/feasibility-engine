// OpenStreetMap Geocoding & Boundary Estimation Service
// Uses Nominatim for geocoding and Overpass API for property boundary queries

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';
const OVERPASS_BASE = 'https://overpass-api.de/api/interpreter';
const USER_AGENT = 'PropertyFeasibilityApp/1.0';

class OpenStreetMapService {
  /**
   * Geocode an address string to coordinates, suburb, and postcode.
   * @param {string} address - Full street address
   * @returns {Promise<Object>} { lat, lng, displayName, suburb, postcode, state, boundingBox }
   */
  async geocodeAddress(address) {
    const params = new URLSearchParams({
      q: address,
      format: 'json',
      addressdetails: '1',
      limit: '1',
      countrycodes: 'au',
    });

    const res = await fetch(`${NOMINATIM_BASE}/search?${params}`, {
      headers: { 'User-Agent': USER_AGENT },
    });

    if (!res.ok) {
      throw new Error(`Nominatim API error: ${res.status} ${res.statusText}`);
    }

    const results = await res.json();
    if (!results.length) {
      return null;
    }

    const result = results[0];
    const addr = result.address || {};

    return {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      displayName: result.display_name,
      suburb: addr.suburb || addr.town || addr.city || addr.municipality || '',
      postcode: addr.postcode || '',
      state: addr.state || '',
      boundingBox: result.boundingbox
        ? result.boundingbox.map(Number)
        : null,
    };
  }

  /**
   * Query Overpass API for building/landuse boundaries near a point.
   * @param {number} lat
   * @param {number} lng
   * @param {number} radius - Search radius in meters (default 50)
   * @returns {Promise<Object>} { elements, closestFeature, boundaries }
   */
  async getPropertyBoundaries(lat, lng, radius = 50) {
    const query = `
      [out:json][timeout:10];
      (
        way["building"](around:${radius},${lat},${lng});
        way["landuse"="residential"](around:${radius},${lat},${lng});
        way["boundary"="lot"](around:${radius},${lat},${lng});
      );
      out body;
      >;
      out skel qt;
    `;

    try {
      const res = await fetch(OVERPASS_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': USER_AGENT,
        },
        body: `data=${encodeURIComponent(query)}`,
      });

      if (!res.ok) {
        console.warn(`Overpass API error: ${res.status}. Falling back to estimation.`);
        return null;
      }

      const data = await res.json();
      const elements = data.elements || [];

      // Separate nodes and ways
      const nodes = new Map();
      const ways = [];
      for (const el of elements) {
        if (el.type === 'node') {
          nodes.set(el.id, { lat: el.lat, lon: el.lon });
        } else if (el.type === 'way' && el.nodes) {
          ways.push(el);
        }
      }

      if (ways.length === 0) return null;

      // Find the closest feature to our point
      const closestFeature = this.findClosestFeature(ways, nodes, lat, lng);
      if (!closestFeature) return null;

      const boundaries = this.extractBoundaries(closestFeature, nodes);
      if (!boundaries) return null;

      const dimensions = this.calculateDimensionsFromCoordinates(boundaries);

      return {
        source: 'osm',
        boundaries,
        ...dimensions,
      };
    } catch (err) {
      console.warn('Overpass API query failed:', err.message);
      return null;
    }
  }

  /**
   * Find the way whose centroid is closest to the target point.
   */
  findClosestFeature(ways, nodes, targetLat, targetLng) {
    let closest = null;
    let minDist = Infinity;

    for (const way of ways) {
      const coords = way.nodes
        .map(nid => nodes.get(nid))
        .filter(Boolean);

      if (coords.length < 3) continue;

      // Centroid
      const centLat = coords.reduce((s, c) => s + c.lat, 0) / coords.length;
      const centLon = coords.reduce((s, c) => s + c.lon, 0) / coords.length;
      const dist = this.calculateDistance(targetLat, targetLng, centLat, centLon);

      if (dist < minDist) {
        minDist = dist;
        closest = { way, coords };
      }
    }

    return closest;
  }

  /**
   * Extract coordinate array from a way's nodes.
   */
  extractBoundaries(feature, nodes) {
    if (!feature || !feature.coords) return null;
    return feature.coords.map(c => ({ lat: c.lat, lng: c.lon }));
  }

  /**
   * Calculate lot dimensions (area, frontage, depth) from boundary coordinates.
   * Uses shoelace formula for area, then estimates frontage/depth from bounding box.
   */
  calculateDimensionsFromCoordinates(coordinates) {
    if (!coordinates || coordinates.length < 3) return null;

    const area = this.calculatePolygonArea(coordinates);

    // Bounding box approach for frontage/depth
    const lats = coordinates.map(c => c.lat);
    const lngs = coordinates.map(c => c.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    // Convert bounding box to meters
    const nsSpan = this.calculateDistance(minLat, minLng, maxLat, minLng);
    const ewSpan = this.calculateDistance(minLat, minLng, minLat, maxLng);

    // Frontage = shorter dimension (typically width), depth = longer
    const frontage = Math.min(nsSpan, ewSpan);
    const depth = Math.max(nsSpan, ewSpan);

    return {
      area: Math.round(area),
      frontage: Math.round(frontage * 10) / 10,
      depth: Math.round(depth * 10) / 10,
    };
  }

  /**
   * Shoelace formula for polygon area from lat/lng coordinates.
   * Converts coordinates to meters using local projection.
   */
  calculatePolygonArea(coordinates) {
    if (coordinates.length < 3) return 0;

    // Reference point for local projection
    const refLat = coordinates[0].lat;
    const refLng = coordinates[0].lng;

    // Convert to meters (local tangent plane approximation)
    const metersPerDegreeLat = 111320;
    const metersPerDegreeLng = 111320 * Math.cos(refLat * Math.PI / 180);

    const points = coordinates.map(c => ({
      x: (c.lng - refLng) * metersPerDegreeLng,
      y: (c.lat - refLat) * metersPerDegreeLat,
    }));

    // Shoelace formula
    let area = 0;
    const n = points.length;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      area += points[i].x * points[j].y;
      area -= points[j].x * points[i].y;
    }

    return Math.abs(area) / 2;
  }

  /**
   * Generate estimated lot boundary from area when OSM data unavailable.
   * Uses Perth typical suburban lot aspect ratio of ~2.2:1 (depth:frontage).
   * @param {number} area - Lot area in sqm
   * @returns {Object} { frontage, depth }
   */
  generateEstimatedBoundary(area) {
    const aspectRatio = 2.2; // Perth typical depth:frontage ratio
    const frontage = Math.sqrt(area / aspectRatio);
    const depth = frontage * aspectRatio;

    return {
      frontage: Math.round(frontage * 10) / 10,
      depth: Math.round(depth * 10) / 10,
    };
  }

  /**
   * Haversine formula for distance between two points.
   * @returns {number} Distance in meters
   */
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371000; // Earth radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}

export default new OpenStreetMapService();
