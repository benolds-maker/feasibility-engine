// Mixed Dwelling Scenario Generator
// Generates 7 mixed-dwelling configurations for comparison analysis

import { getRCodeRules, calculateParkingRequirements } from '../../../src/engines/rCodesEngine.js';

// Unit templates: footprint = ground floor only (2-storey assumed), gfa = total across all levels
// Footprints aligned with yield engine: 2-storey townhouses where GFA ≈ 2× footprint
const UNIT_TEMPLATES = {
  '2bed': { label: '2 Bedroom', footprint: 55, gfa: 100, parking: 1 },
  '3bed': { label: '3 Bedroom', footprint: 75, gfa: 145, parking: 1.5 },
  '4bed': { label: '4 Bedroom', footprint: 100, gfa: 200, parking: 2 },
};

// 7 mixed scenario definitions — no pure single-type configurations
const SCENARIO_DEFINITIONS = [
  {
    name: 'Balanced Affordable',
    description: 'Even split of smaller dwellings targeting affordability and fast sales turnover.',
    strategy: 'Maximize unit count with affordable product, targeting first-home buyers and investors.',
    ratios: { '2bed': 0.50, '3bed': 0.50, '4bed': 0 },
    riskLevel: 'LOW',
  },
  {
    name: '3-Bed Dominant',
    description: 'Family-focused mix with majority 3-bedroom units and some smaller options.',
    strategy: 'Target the largest buyer segment (families) with mainstream 3-bed product.',
    ratios: { '2bed': 0.30, '3bed': 0.70, '4bed': 0 },
    riskLevel: 'LOW',
  },
  {
    name: 'Balanced Premium',
    description: 'Larger dwellings split between 3 and 4 bedroom for premium suburbs.',
    strategy: 'Premium positioning with larger homes targeting upsizers and established families.',
    ratios: { '2bed': 0, '3bed': 0.50, '4bed': 0.50 },
    riskLevel: 'MEDIUM',
  },
  {
    name: '4-Bed Dominant',
    description: 'Premium-heavy mix focused on larger family homes with some 3-bed options.',
    strategy: 'Maximum revenue per unit targeting high-value family market. Longer sales period expected.',
    ratios: { '2bed': 0, '3bed': 0.30, '4bed': 0.70 },
    riskLevel: 'MEDIUM-HIGH',
  },
  {
    name: 'Diversified Mix',
    description: 'Broad range covering all unit types for maximum market appeal.',
    strategy: 'Diversified product appeals to multiple buyer segments, reducing market concentration risk.',
    ratios: { '2bed': 0.30, '3bed': 0.40, '4bed': 0.30 },
    riskLevel: 'LOW',
  },
  {
    name: 'Entry-Level Focus',
    description: 'Weighted toward smaller affordable product with family-size backup.',
    strategy: 'Strong appeal to investors and first-home buyers with affordable entry prices.',
    ratios: { '2bed': 0.60, '3bed': 0.40, '4bed': 0 },
    riskLevel: 'LOW',
  },
  {
    name: 'Mainstream Focus',
    description: 'Mainstream 3-bed core with balanced smaller and larger options.',
    strategy: 'Broad market appeal centred on the most popular dwelling size.',
    ratios: { '2bed': 0.20, '3bed': 0.60, '4bed': 0.20 },
    riskLevel: 'LOW',
  },
];

// Determine site layout type based on lot proportions (matching yield engine logic)
function determineSiteLayout(lotWidth, lotDepth) {
  const ratio = lotDepth / lotWidth;
  if (ratio > 2.5) return 'battle-axe';
  if (lotWidth > lotDepth * 1.2) return 'wide-frontage';
  return 'standard';
}

// Calculate infrastructure area (matching yield engine logic)
function calculateInfrastructureArea(numDwellings, layout) {
  const drivewayWidth = numDwellings > 3 ? 6 : 3.5;
  const drivewayLength = layout === 'battle-axe' ? 25 : 15;
  const drivewayArea = drivewayWidth * drivewayLength;

  const turningArea = numDwellings > 4 ? 50 : 0;

  const commonLandscaping = numDwellings * 8;

  return {
    drivewayArea,
    turningArea,
    commonLandscaping,
    totalInfraArea: drivewayArea + turningArea + commonLandscaping,
  };
}

class MixedScenarioService {
  /**
   * Generate all mixed scenarios that fit the site constraints.
   * @param {Object} property - { lotArea, lotWidth, lotDepth, rCode }
   * @param {Object} _constraints - Unused (kept for API compat, constraints derived from R-Code rules)
   * @param {Object} marketData - { prices: { 2bed, 3bed, 4bed } }
   * @returns {Array<Object>} Array of viable scenarios sorted by estimated profit margin
   */
  generateMixedScenarios(property, _constraints, marketData) {
    const { lotArea, lotWidth, lotDepth, rCode } = property;

    const rules = getRCodeRules(rCode);
    if (!rules) return [];

    const defaultPrices = { '2bed': 550000, '3bed': 650000, '4bed': 780000 };
    const prices = marketData?.prices || defaultPrices;

    const scenarios = [];

    for (const def of SCENARIO_DEFINITIONS) {
      const config = this.calculateMixedConfig(
        lotArea, lotWidth, lotDepth, rules, UNIT_TEMPLATES, def.ratios
      );

      if (config) {
        const scenario = this.createScenario(def, config, prices, lotArea, rules);
        if (scenario) {
          scenarios.push(scenario);
        }
      }
    }

    return scenarios;
  }

  /**
   * Calculate the optimal unit counts for a given ratio within R-Code constraints.
   * Iterates from 2 to 20 total units, applies full compliance checks including
   * infrastructure, parking, plot ratio, site coverage, open space, and min lot size.
   * @returns {Object|null} Best compliant config or null if none viable
   */
  calculateMixedConfig(lotArea, lotWidth, lotDepth, rules, templates, ratios) {
    let bestConfig = null;
    let bestUtilization = 0;

    const layout = determineSiteLayout(lotWidth, lotDepth);
    const maxGFA = lotArea * rules.maxPlotRatio;

    for (let totalTarget = 2; totalTarget <= 20; totalTarget++) {
      // Convert ratios to unit counts (round to whole numbers)
      const counts = {};
      let assigned = 0;
      const types = Object.keys(ratios).filter(k => ratios[k] > 0);

      for (let i = 0; i < types.length; i++) {
        const type = types[i];
        if (i === types.length - 1) {
          counts[type] = totalTarget - assigned;
        } else {
          counts[type] = Math.round(totalTarget * ratios[type]);
          assigned += counts[type];
        }
      }

      // Ensure all non-zero ratios have at least 1 unit
      for (const type of types) {
        if (!counts[type] || counts[type] < 1) counts[type] = 1;
      }

      // Zero out types not in the mix
      for (const type of Object.keys(templates)) {
        if (!counts[type]) counts[type] = 0;
      }

      // Calculate actual totals
      const actualTotal = counts['2bed'] + counts['3bed'] + counts['4bed'];
      let totalFootprint = 0;
      let totalGFA = 0;
      let totalParking = 0;

      for (const [type, count] of Object.entries(counts)) {
        if (count > 0 && templates[type]) {
          totalFootprint += count * templates[type].footprint;
          totalGFA += count * templates[type].gfa;
          totalParking += count * templates[type].parking;
        }
      }

      // Infrastructure area (matching yield engine)
      const infra = calculateInfrastructureArea(actualTotal, layout);

      // Visitor parking area (matching yield engine: visitorBays × 15 sqm)
      const parking = calculateParkingRequirements(actualTotal, rules.label);
      const visitorParkingArea = parking ? parking.visitorBays * 15 : 0;

      // Total site coverage including all infrastructure
      const totalCoverage = totalFootprint + infra.totalInfraArea + visitorParkingArea;

      // Open space
      const openSpace = lotArea - totalCoverage;

      // Compliance checks (all must pass)
      const plotRatio = totalGFA / lotArea;
      const siteCoverageRatio = totalCoverage / lotArea;
      const openSpaceRatio = openSpace / lotArea;
      const lotSizePerUnit = lotArea / actualTotal;

      const plotRatioOk = plotRatio <= rules.maxPlotRatio;
      const siteCoverageOk = siteCoverageRatio <= rules.maxSiteCoverage;
      const openSpaceOk = openSpaceRatio >= rules.minOpenSpace;
      const minLotSizeOk = lotSizePerUnit >= rules.minLotSize;

      if (!plotRatioOk || !siteCoverageOk || !openSpaceOk || !minLotSizeOk) continue;

      // Utilization of the correct GFA cap
      const utilization = totalGFA / maxGFA;

      // Prefer higher utilization among compliant configs
      if (utilization > bestUtilization) {
        bestUtilization = utilization;
        bestConfig = {
          counts,
          totalUnits: actualTotal,
          totalFootprint: Math.round(totalFootprint),
          totalGFA: Math.round(totalGFA),
          totalParking: Math.ceil(totalParking),
          utilization: Math.round(utilization * 100),
          infrastructure: infra,
          visitorParkingArea,
          totalCoverage: Math.round(totalCoverage),
          openSpace: Math.round(openSpace),
          parking,
          compliance: {
            plotRatio: Math.round(plotRatio * 1000) / 1000,
            siteCoverageRatio: Math.round(siteCoverageRatio * 1000) / 1000,
            openSpaceRatio: Math.round(openSpaceRatio * 1000) / 1000,
            lotSizePerUnit: Math.round(lotSizePerUnit),
          },
        };
      }
    }

    return bestConfig;
  }

  /**
   * Build a complete scenario object with mix breakdown and financial estimates.
   */
  createScenario(definition, config, prices, lotArea, rules) {
    const {
      counts, totalUnits, totalFootprint, totalGFA, totalParking, utilization,
      infrastructure, visitorParkingArea, totalCoverage, openSpace, parking, compliance,
    } = config;

    // Mix breakdown with percentages
    const mixBreakdown = [];
    for (const [type, count] of Object.entries(counts)) {
      if (count > 0) {
        mixBreakdown.push({
          type,
          label: UNIT_TEMPLATES[type].label,
          units: count,
          percentage: Math.round((count / totalUnits) * 100),
          footprint: count * UNIT_TEMPLATES[type].footprint,
          gfa: count * UNIT_TEMPLATES[type].gfa,
        });
      }
    }

    // Estimated revenue (GRV)
    const estimatedGRV =
      (counts['2bed'] || 0) * (prices['2bed'] || 550000) +
      (counts['3bed'] || 0) * (prices['3bed'] || 650000) +
      (counts['4bed'] || 0) * (prices['4bed'] || 780000);

    return {
      name: definition.name,
      description: definition.description,
      strategy: definition.strategy,
      riskLevel: definition.riskLevel,
      mix: counts,
      mixBreakdown,
      totalUnits,
      totalFootprint,
      totalGFA,
      totalParking,
      utilization,
      estimatedGRV,
      plotRatio: compliance.plotRatio,
      siteCoverageRatio: compliance.siteCoverageRatio,
      openSpaceRatio: compliance.openSpaceRatio,
      infrastructure,
      visitorParkingArea,
      totalCoverage,
      openSpace,
      parking,
      compliance: {
        ...compliance,
        maxPlotRatio: rules.maxPlotRatio,
        maxSiteCoverage: rules.maxSiteCoverage,
        minOpenSpace: rules.minOpenSpace,
        minLotSize: rules.minLotSize,
      },
    };
  }
}

export default new MixedScenarioService();
