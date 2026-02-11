// OpenStreetMap Geocoding & Boundary Estimation Service
// Uses Photon (primary) + Nominatim (fallback) for geocoding and Overpass API for property boundary queries

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';
const PHOTON_BASE = 'https://photon.komoot.io';
const OVERPASS_BASE = 'https://overpass-api.de/api/interpreter';
const USER_AGENT = 'PropertyFeasibilityApp/1.0';

// Perth CBD coordinates for location bias
const PERTH_LAT = -31.95;
const PERTH_LNG = 115.86;

class OpenStreetMapService {
  /**
   * Geocode an address using Photon API (Komoot).
   * Better fuzzy matching than Nominatim for Australian street addresses.
   * @param {string} address
   * @returns {Promise<Object|null>}
   */
  async geocodeWithPhoton(address) {
    const params = new URLSearchParams({
      q: address,
      lat: String(PERTH_LAT),
      lon: String(PERTH_LNG),
      limit: '5',
      lang: 'en',
    });

    const res = await fetch(`${PHOTON_BASE}/api/?${params}`, {
      headers: { 'User-Agent': USER_AGENT },
    });

    if (!res.ok) {
      console.warn(`Photon API error: ${res.status} ${res.statusText}`);
      return null;
    }

    const data = await res.json();
    const features = data.features || [];

    // Filter to Australian results only
    const auFeatures = features.filter(
      f => f.properties?.countrycode === 'AU'
    );

    if (!auFeatures.length) return null;

    const feature = auFeatures[0];
    const props = feature.properties || {};
    const [lng, lat] = feature.geometry?.coordinates || [0, 0];

    const suburb = props.district || props.city || props.locality || props.county || '';
    const postcode = props.postcode || '';
    const state = props.state || '';

    // Build a readable display name
    const parts = [];
    if (props.housenumber && props.street) parts.push(`${props.housenumber} ${props.street}`);
    else if (props.street) parts.push(props.street);
    else if (props.name) parts.push(props.name);
    if (suburb) parts.push(suburb);
    if (state) parts.push(state);
    if (postcode) parts.push(postcode);
    parts.push('Australia');
    const displayName = parts.join(', ');

    return {
      lat,
      lng,
      displayName,
      suburb,
      postcode,
      state,
      boundingBox: null,
    };
  }

  /**
   * Geocode using Nominatim (original approach).
   * @param {string} address
   * @returns {Promise<Object|null>}
   */
  async geocodeWithNominatim(address) {
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
      console.warn(`Nominatim API error: ${res.status} ${res.statusText}`);
      return null;
    }

    const results = await res.json();
    if (!results.length) return null;

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
   * Strip the leading house number from an address string.
   * "45 Ocean View Drive, Edgewater" -> "Ocean View Drive, Edgewater"
   */
  stripHouseNumber(address) {
    return address.replace(/^\s*\d+[A-Za-z]?\s+/, '');
  }

  /**
   * Geocode an address string to coordinates, suburb, and postcode.
   * Multi-strategy: Photon -> Nominatim (full) -> Nominatim (without house number)
   * @param {string} address - Full street address
   * @returns {Promise<Object>} { lat, lng, displayName, suburb, postcode, state, boundingBox }
   */
  async geocodeAddress(address) {
    // Strategy 1: Photon (best fuzzy matching for Australian addresses)
    try {
      const photonResult = await this.geocodeWithPhoton(address);
      if (photonResult) {
        console.log('[geocode] Resolved via Photon:', photonResult.displayName);
        return photonResult;
      }
    } catch (err) {
      console.warn('[geocode] Photon failed:', err.message);
    }

    // Strategy 2: Nominatim with full address
    try {
      const nominatimResult = await this.geocodeWithNominatim(address);
      if (nominatimResult) {
        console.log('[geocode] Resolved via Nominatim (full):', nominatimResult.displayName);
        return nominatimResult;
      }
    } catch (err) {
      console.warn('[geocode] Nominatim (full) failed:', err.message);
    }

    // Strategy 3: Nominatim without house number (gets street-level result)
    const strippedAddress = this.stripHouseNumber(address);
    if (strippedAddress !== address) {
      // Try with "Western Australia" appended if not already present
      const queries = [strippedAddress];
      if (!/western\s+australia|WA\b/i.test(strippedAddress)) {
        queries.push(`${strippedAddress}, Western Australia`);
      }
      for (const query of queries) {
        try {
          const fallbackResult = await this.geocodeWithNominatim(query);
          if (fallbackResult) {
            console.log('[geocode] Resolved via Nominatim (no house number):', fallbackResult.displayName);
            return fallbackResult;
          }
        } catch (err) {
          console.warn('[geocode] Nominatim (stripped) failed:', err.message);
        }
      }
    }

    // All strategies exhausted
    return null;
  }

  /**
   * Autocomplete address suggestions using Photon API.
   * Returns formatted Australian address suggestions for partial text input.
   * @param {string} query - Partial address text (min 4 chars recommended)
   * @returns {Promise<Array>} [{ address, suburb, postcode }]
   */
  async autocompleteAddress(query) {
    if (!query || query.trim().length < 3) return [];

    const params = new URLSearchParams({
      q: query,
      lat: String(PERTH_LAT),
      lon: String(PERTH_LNG),
      limit: '6',
      lang: 'en',
    });

    const res = await fetch(`${PHOTON_BASE}/api/?${params}`, {
      headers: { 'User-Agent': USER_AGENT },
    });

    if (!res.ok) return [];

    const data = await res.json();
    const features = data.features || [];

    // Filter to Australian results and map to suggestion format
    const seen = new Set();
    const suggestions = [];

    for (const feature of features) {
      const props = feature.properties || {};
      if (props.countrycode !== 'AU') continue;

      const suburb = props.district || props.city || props.locality || props.county || '';
      const postcode = props.postcode || '';
      const state = props.state || '';

      // Build formatted address
      const parts = [];
      if (props.housenumber && props.street) parts.push(`${props.housenumber} ${props.street}`);
      else if (props.street) parts.push(props.street);
      else if (props.name) parts.push(props.name);
      else continue; // skip results with no useful name

      if (suburb) parts.push(suburb);
      // Add state abbreviation
      const stateAbbrev = this.abbreviateState(state);
      if (stateAbbrev) parts.push(stateAbbrev);
      if (postcode) parts.push(postcode);

      const address = parts.join(', ');

      // Deduplicate
      if (seen.has(address)) continue;
      seen.add(address);

      suggestions.push({ address, suburb, postcode });

      if (suggestions.length >= 5) break;
    }

    return suggestions;
  }

  /**
   * Abbreviate Australian state name.
   */
  abbreviateState(state) {
    const map = {
      'western australia': 'WA',
      'new south wales': 'NSW',
      'victoria': 'VIC',
      'queensland': 'QLD',
      'south australia': 'SA',
      'tasmania': 'TAS',
      'northern territory': 'NT',
      'australian capital territory': 'ACT',
    };
    return map[(state || '').toLowerCase()] || '';
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
