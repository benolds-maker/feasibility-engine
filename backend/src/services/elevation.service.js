// Elevation & Terrain Analysis Service
// Uses Open-Meteo Elevation API (free, no auth, ~90m DEM resolution)
// with Geoscience Australia ELVIS as fallback

const OPEN_METEO_BASE = 'https://api.open-meteo.com/v1';
const ELVIS_BASE = 'https://elevation.fsdf.org.au/api/v1';

const TERRAIN_CATEGORIES = {
  FLAT: { label: 'Flat', maxFall: 1.5, costMultiplier: 1.0 },
  GENTLE_SLOPE: { label: 'Gentle Slope', maxFall: 3.0, costMultiplier: 1.08 },
  MODERATE_SLOPE: { label: 'Moderate Slope', maxFall: 6.0, costMultiplier: 1.20 },
  STEEP_SLOPE: { label: 'Steep Slope', maxFall: Infinity, costMultiplier: 1.50 },
};

class ElevationService {
  /**
   * Get elevation for a single point.
   * Primary: Open-Meteo (free, reliable). Fallback: ELVIS.
   * @param {number} lat
   * @param {number} lng
   * @returns {Promise<number|null>} Elevation in meters
   */
  async getElevation(lat, lng) {
    // Try Open-Meteo first (supports batch queries via comma-separated coords)
    try {
      const res = await fetch(
        `${OPEN_METEO_BASE}/elevation?latitude=${lat}&longitude=${lng}`
      );

      if (res.ok) {
        const data = await res.json();
        if (data.elevation && data.elevation.length > 0 && data.elevation[0] !== null) {
          return data.elevation[0];
        }
      }
    } catch (err) {
      console.warn('Open-Meteo elevation query failed:', err.message);
    }

    // Fallback to ELVIS
    try {
      const res = await fetch(
        `${ELVIS_BASE}/elevation?lat=${lat}&lon=${lng}&format=json`,
        { headers: { 'User-Agent': 'PropertyFeasibilityApp/1.0' } }
      );

      if (!res.ok) return null;

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) return null;

      const data = await res.json();
      return data.elevation ?? data.value ?? null;
    } catch (err) {
      console.warn('ELVIS elevation query failed:', err.message);
      return null;
    }
  }

  /**
   * Get elevations for multiple boundary corner points.
   * Uses Open-Meteo batch endpoint for efficiency (single HTTP call).
   * @param {Array<{lat: number, lng: number}>} boundaryPoints
   * @returns {Promise<Array<{lat, lng, elevation}>>}
   */
  async getSiteElevations(boundaryPoints) {
    if (!boundaryPoints || boundaryPoints.length === 0) return [];

    // Try batch query via Open-Meteo (comma-separated coordinates)
    try {
      const lats = boundaryPoints.map(p => p.lat).join(',');
      const lngs = boundaryPoints.map(p => p.lng).join(',');
      const res = await fetch(
        `${OPEN_METEO_BASE}/elevation?latitude=${lats}&longitude=${lngs}`
      );

      if (res.ok) {
        const data = await res.json();
        if (data.elevation && data.elevation.length === boundaryPoints.length) {
          return boundaryPoints.map((pt, i) => ({
            lat: pt.lat,
            lng: pt.lng,
            elevation: data.elevation[i],
          }));
        }
      }
    } catch (err) {
      console.warn('Open-Meteo batch elevation failed:', err.message);
    }

    // Fallback: individual queries
    const results = await Promise.all(
      boundaryPoints.map(async (pt) => {
        const elevation = await this.getElevation(pt.lat, pt.lng);
        return { lat: pt.lat, lng: pt.lng, elevation };
      })
    );

    return results;
  }

  /**
   * Full terrain analysis with cost implications.
   * @param {Array<{lat, lng}>} boundaryPoints - Site corner coordinates
   * @param {number} siteArea - Site area in sqm
   * @returns {Promise<Object>} Complete terrain analysis with costs
   */
  async analyzeTerrainWithCosts(boundaryPoints, siteArea) {
    const elevations = await this.getSiteElevations(boundaryPoints);
    const validElevations = elevations.filter(e => e.elevation !== null);

    if (validElevations.length < 2) {
      return this.getDefaultTerrainAnalysis(siteArea);
    }

    const elevationValues = validElevations.map(e => e.elevation);
    const minElevation = Math.min(...elevationValues);
    const maxElevation = Math.max(...elevationValues);
    const avgElevation = elevationValues.reduce((s, v) => s + v, 0) / elevationValues.length;
    const totalFall = maxElevation - minElevation;

    const category = this.categorizeTerrain(totalFall);
    const terrainCosts = this.calculateTerrainCosts(category, totalFall, siteArea);
    const suitability = this.assessSuitability(category, totalFall);
    const considerations = this.getDevelopmentConsiderations(category, totalFall);

    return {
      elevations: validElevations,
      minElevation: Math.round(minElevation * 100) / 100,
      maxElevation: Math.round(maxElevation * 100) / 100,
      avgElevation: Math.round(avgElevation * 100) / 100,
      totalFall: Math.round(totalFall * 100) / 100,
      category: category.label,
      categoryKey: Object.keys(TERRAIN_CATEGORIES).find(
        k => TERRAIN_CATEGORIES[k] === category
      ),
      costMultiplier: category.costMultiplier,
      terrainCosts,
      suitability,
      considerations,
      dataSource: 'geoscience_australia',
    };
  }

  /**
   * Categorize terrain based on total fall across the site.
   * @param {number} totalFall - Elevation difference in meters
   * @returns {Object} Terrain category
   */
  categorizeTerrain(totalFall) {
    if (totalFall < 1.5) return TERRAIN_CATEGORIES.FLAT;
    if (totalFall < 3.0) return TERRAIN_CATEGORIES.GENTLE_SLOPE;
    if (totalFall < 6.0) return TERRAIN_CATEGORIES.MODERATE_SLOPE;
    return TERRAIN_CATEGORIES.STEEP_SLOPE;
  }

  /**
   * Calculate terrain-specific additional costs.
   * @param {Object} category - Terrain category
   * @param {number} totalFall - Total fall in meters
   * @param {number} siteArea - Site area in sqm
   * @returns {Object} Detailed terrain cost breakdown
   */
  calculateTerrainCosts(category, totalFall, siteArea) {
    // Earthworks: ranges from $15/sqm (flat) to $150/sqm (steep)
    let earthworksRate;
    if (totalFall < 1.5) earthworksRate = 15;
    else if (totalFall < 3.0) earthworksRate = 40;
    else if (totalFall < 6.0) earthworksRate = 80;
    else earthworksRate = 150;

    const earthworksCost = Math.round(siteArea * earthworksRate);

    // Retaining walls: $400/m² of wall face
    // Wall height proportional to fall, wall length estimated as site perimeter fraction
    const wallHeight = Math.max(0, totalFall - 0.5); // Allow 0.5m natural grade
    const estimatedWallLength = totalFall > 1.5
      ? Math.sqrt(siteArea) * 0.8 // ~80% of one side length
      : 0;
    const wallArea = wallHeight * estimatedWallLength;
    const retainingWallCost = Math.round(wallArea * 400);

    // Foundation upgrades for steep sites
    const foundationUpgrade = totalFall > 6 ? 15000 : totalFall > 3 ? 8000 : 0;

    // Soil disposal: $35/m³, estimated volume based on cut/fill
    const estimatedCutVolume = totalFall > 1.5
      ? (siteArea * totalFall * 0.3) // ~30% of theoretical prism needs removal
      : 0;
    const soilDisposalCost = Math.round(estimatedCutVolume * 35);

    const totalTerrainCost = earthworksCost + retainingWallCost + foundationUpgrade + soilDisposalCost;

    return {
      earthworks: { rate: earthworksRate, cost: earthworksCost },
      retainingWalls: {
        wallHeight: Math.round(wallHeight * 10) / 10,
        wallLength: Math.round(estimatedWallLength * 10) / 10,
        wallArea: Math.round(wallArea),
        cost: retainingWallCost,
      },
      foundationUpgrade,
      soilDisposal: {
        volume: Math.round(estimatedCutVolume),
        cost: soilDisposalCost,
      },
      total: totalTerrainCost,
      costImpactPercent: Math.round((category.costMultiplier - 1) * 100),
    };
  }

  /**
   * Assess overall site suitability based on terrain.
   * @returns {Object} { rating, label, description }
   */
  assessSuitability(category, totalFall) {
    if (totalFall < 1.5) {
      return {
        rating: 'EXCELLENT',
        label: 'Excellent',
        description: 'Flat site ideal for standard construction methods. Minimal earthworks required.',
      };
    }
    if (totalFall < 3.0) {
      return {
        rating: 'GOOD',
        label: 'Good',
        description: 'Gentle slope manageable with minor site works. May allow split-level designs.',
      };
    }
    if (totalFall < 6.0) {
      return {
        rating: 'MODERATE',
        label: 'Moderate',
        description: 'Moderate slope requires significant earthworks and retaining. Split-level or stepped designs recommended.',
      };
    }
    return {
      rating: 'CHALLENGING',
      label: 'Challenging',
      description: 'Steep site requires specialist engineering, major earthworks, and extensive retaining walls. Higher construction costs expected.',
    };
  }

  /**
   * Get development considerations as string array based on terrain.
   * @returns {string[]} Array of recommendations
   */
  getDevelopmentConsiderations(category, totalFall) {
    const considerations = [];

    if (totalFall >= 1.5) {
      considerations.push('Engage geotechnical engineer early for site investigation');
    }
    if (totalFall >= 3.0) {
      considerations.push('Consider split-level or stepped building designs to work with the slope');
      considerations.push('Retaining wall design and engineering will be required');
    }
    if (totalFall >= 6.0) {
      considerations.push('Specialist structural engineer required for foundation design');
      considerations.push('Significant cut-and-fill earthworks with soil disposal logistics');
      considerations.push('Consider stormwater management implications of slope');
    }
    if (totalFall < 1.5) {
      considerations.push('Standard slab-on-ground construction suitable');
      considerations.push('Ensure adequate site drainage to prevent water pooling');
    }

    return considerations;
  }

  /**
   * Default terrain analysis when elevation API is unavailable.
   * Assumes flat terrain (conservative for cost estimation).
   */
  getDefaultTerrainAnalysis(siteArea) {
    const category = TERRAIN_CATEGORIES.FLAT;
    return {
      elevations: [],
      minElevation: null,
      maxElevation: null,
      avgElevation: null,
      totalFall: 0,
      category: category.label,
      categoryKey: 'FLAT',
      costMultiplier: category.costMultiplier,
      terrainCosts: {
        earthworks: { rate: 15, cost: Math.round(siteArea * 15) },
        retainingWalls: { wallHeight: 0, wallLength: 0, wallArea: 0, cost: 0 },
        foundationUpgrade: 0,
        soilDisposal: { volume: 0, cost: 0 },
        total: Math.round(siteArea * 15),
        costImpactPercent: 0,
      },
      suitability: {
        rating: 'EXCELLENT',
        label: 'Excellent',
        description: 'Elevation data unavailable — assumed flat. Verify on-site.',
      },
      considerations: [
        'Elevation data could not be retrieved — site inspection recommended',
        'Cost estimates assume flat terrain; adjust if slope is present',
      ],
      dataSource: 'default_assumption',
    };
  }
}

export default new ElevationService();
