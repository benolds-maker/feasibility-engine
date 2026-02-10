// Mixed Dwelling Scenario Generator
// Generates 7 mixed-dwelling configurations for comparison analysis

import { calculateBuildableArea } from '../../../src/engines/rCodesEngine.js';

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

class MixedScenarioService {
  /**
   * Generate all mixed scenarios that fit the site constraints.
   * @param {Object} property - { lotArea, lotWidth, lotDepth, rCode }
   * @param {Object} constraints - Override constraints (optional)
   * @param {Object} marketData - { prices: { 2bed, 3bed, 4bed } }
   * @returns {Array<Object>} Array of viable scenarios sorted by estimated profit margin
   */
  generateMixedScenarios(property, constraints, marketData) {
    const { lotArea, rCode } = property;

    // Get R-Code buildable area constraints
    const buildable = calculateBuildableArea(lotArea, rCode);
    if (!buildable) return [];

    const maxFootprint = constraints?.maxFootprint || buildable.maxSiteCoverage;
    const maxGFA = constraints?.maxGFA || buildable.maxGFA;

    const defaultPrices = { '2bed': 550000, '3bed': 650000, '4bed': 780000 };
    const prices = marketData?.prices || defaultPrices;

    const scenarios = [];

    for (const def of SCENARIO_DEFINITIONS) {
      const config = this.calculateMixedConfig(maxFootprint, maxGFA, UNIT_TEMPLATES, def.ratios);

      if (config) {
        const scenario = this.createScenario(def, config, prices, lotArea);
        if (scenario) {
          scenarios.push(scenario);
        }
      }
    }

    return scenarios;
  }

  /**
   * Calculate the optimal unit counts for a given ratio within constraints.
   * Iterates from 4 to 20 total units, checks footprint/GFA, requires 70–95% utilization.
   * @returns {Object|null} Best config or null if none viable
   */
  calculateMixedConfig(maxFootprint, maxGFA, templates, ratios) {
    let bestConfig = null;
    let bestUtilization = 0;

    for (let totalTarget = 4; totalTarget <= 20; totalTarget++) {
      // Convert ratios to unit counts (round to whole numbers)
      const counts = {};
      let assigned = 0;
      const types = Object.keys(ratios).filter(k => ratios[k] > 0);

      for (let i = 0; i < types.length; i++) {
        const type = types[i];
        if (i === types.length - 1) {
          // Last type gets the remainder
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

      // Check constraints
      if (totalFootprint > maxFootprint) continue;
      if (totalGFA > maxGFA) continue;

      // Check utilization (50–95% of maxGFA)
      const utilization = totalGFA / maxGFA;
      if (utilization < 0.50 || utilization > 0.95) continue;

      // Prefer higher utilization
      if (utilization > bestUtilization) {
        bestUtilization = utilization;
        bestConfig = {
          counts,
          totalUnits: actualTotal,
          totalFootprint: Math.round(totalFootprint),
          totalGFA: Math.round(totalGFA),
          totalParking: Math.ceil(totalParking),
          utilization: Math.round(utilization * 100),
        };
      }
    }

    return bestConfig;
  }

  /**
   * Build a complete scenario object with mix breakdown and financial estimates.
   */
  createScenario(definition, config, prices, lotArea) {
    const { counts, totalUnits, totalFootprint, totalGFA, totalParking, utilization } = config;

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
      plotRatio: totalGFA / lotArea,
    };
  }
}

export default new MixedScenarioService();
