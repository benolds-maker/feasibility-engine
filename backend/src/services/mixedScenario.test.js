import { describe, it, expect } from 'vitest';
import mixedScenarioService from './mixedScenario.service.js';
import { getRCodeRules } from '../../../src/engines/rCodesEngine.js';

// Standard test property: R60 / 800 sqm (20m × 40m)
const R60_PROPERTY = { lotArea: 800, lotWidth: 20, lotDepth: 40, rCode: 'R60' };

// Standard test property: R40 / 800 sqm
const R40_PROPERTY = { lotArea: 800, lotWidth: 20, lotDepth: 40, rCode: 'R40' };

const DEFAULT_MARKET = { prices: { '2bed': 550000, '3bed': 650000, '4bed': 780000 } };

describe('MixedScenarioService — R60/800sqm compliance', () => {
  const scenarios = mixedScenarioService.generateMixedScenarios(
    R60_PROPERTY, {}, DEFAULT_MARKET
  );
  const rules = getRCodeRules('R60');

  it('generates all 7 scenarios', () => {
    expect(scenarios).toHaveLength(7);
  });

  it('every scenario has plotRatio ≤ 0.70', () => {
    for (const s of scenarios) {
      expect(s.plotRatio).toBeLessThanOrEqual(rules.maxPlotRatio);
    }
  });

  it('every scenario has siteCoverageRatio ≤ 0.65', () => {
    for (const s of scenarios) {
      expect(s.siteCoverageRatio).toBeLessThanOrEqual(rules.maxSiteCoverage);
    }
  });

  it('every scenario has openSpaceRatio ≥ 0.40', () => {
    for (const s of scenarios) {
      expect(s.openSpaceRatio).toBeGreaterThanOrEqual(rules.minOpenSpace);
    }
  });

  it('every scenario satisfies min lot size (lotArea / totalUnits ≥ 120)', () => {
    for (const s of scenarios) {
      const lotSizePerUnit = R60_PROPERTY.lotArea / s.totalUnits;
      expect(lotSizePerUnit).toBeGreaterThanOrEqual(rules.minLotSize);
    }
  });

  it('no scenario exceeds maxGFA cap (800 × 0.7 = 560)', () => {
    const maxGFA = R60_PROPERTY.lotArea * rules.maxPlotRatio;
    for (const s of scenarios) {
      expect(s.totalGFA).toBeLessThanOrEqual(maxGFA);
    }
  });

  it('every scenario has non-zero infrastructure', () => {
    for (const s of scenarios) {
      expect(s.infrastructure).toBeDefined();
      expect(s.infrastructure.totalInfraArea).toBeGreaterThan(0);
    }
  });

  it('every scenario has parking data', () => {
    for (const s of scenarios) {
      expect(s.parking).toBeDefined();
      expect(s.parking.totalBays).toBeGreaterThan(0);
    }
  });

  it('unit counts start at 2 and are realistic (2-6 for 800sqm R60)', () => {
    for (const s of scenarios) {
      expect(s.totalUnits).toBeGreaterThanOrEqual(2);
      expect(s.totalUnits).toBeLessThanOrEqual(6);
    }
  });
});

describe('MixedScenarioService — R40/800sqm compliance', () => {
  const scenarios = mixedScenarioService.generateMixedScenarios(
    R40_PROPERTY, {}, DEFAULT_MARKET
  );
  const rules = getRCodeRules('R40');

  it('generates scenarios', () => {
    expect(scenarios.length).toBeGreaterThan(0);
  });

  it('every scenario has siteCoverageRatio ≤ 0.60', () => {
    for (const s of scenarios) {
      expect(s.siteCoverageRatio).toBeLessThanOrEqual(rules.maxSiteCoverage);
    }
  });

  it('every scenario has openSpaceRatio ≥ 0.45', () => {
    for (const s of scenarios) {
      expect(s.openSpaceRatio).toBeGreaterThanOrEqual(rules.minOpenSpace);
    }
  });

  it('every scenario has plotRatio ≤ 0.60', () => {
    for (const s of scenarios) {
      expect(s.plotRatio).toBeLessThanOrEqual(rules.maxPlotRatio);
    }
  });
});

describe('MixedScenarioService — scenario structure', () => {
  const scenarios = mixedScenarioService.generateMixedScenarios(
    R60_PROPERTY, {}, DEFAULT_MARKET
  );

  it('each scenario has required fields', () => {
    for (const s of scenarios) {
      expect(s.name).toBeDefined();
      expect(s.description).toBeDefined();
      expect(s.strategy).toBeDefined();
      expect(s.riskLevel).toBeDefined();
      expect(s.mix).toBeDefined();
      expect(s.mixBreakdown).toBeDefined();
      expect(typeof s.totalUnits).toBe('number');
      expect(typeof s.totalGFA).toBe('number');
      expect(typeof s.totalFootprint).toBe('number');
      expect(typeof s.estimatedGRV).toBe('number');
      expect(s.estimatedGRV).toBeGreaterThan(0);
    }
  });

  it('compliance object includes R-Code limits for comparison', () => {
    const s = scenarios[0];
    expect(s.compliance.maxPlotRatio).toBe(0.7);
    expect(s.compliance.maxSiteCoverage).toBe(0.65);
    expect(s.compliance.minOpenSpace).toBe(0.40);
    expect(s.compliance.minLotSize).toBe(120);
  });
});

describe('MixedScenarioService — edge cases', () => {
  it('tiny lot (200 sqm R60) produces fewer or no scenarios', () => {
    const tinyProperty = { lotArea: 200, lotWidth: 10, lotDepth: 20, rCode: 'R60' };
    const scenarios = mixedScenarioService.generateMixedScenarios(
      tinyProperty, {}, DEFAULT_MARKET
    );
    // 200 sqm is too small for most mixed configurations (min 2 units)
    // May produce 0 scenarios or very few
    expect(scenarios.length).toBeLessThan(7);
  });

  it('invalid R-Code returns empty array', () => {
    const badProperty = { lotArea: 800, lotWidth: 20, lotDepth: 40, rCode: 'R99' };
    const scenarios = mixedScenarioService.generateMixedScenarios(
      badProperty, {}, DEFAULT_MARKET
    );
    expect(scenarios).toEqual([]);
  });

  it('uses default prices when no market data provided', () => {
    const scenarios = mixedScenarioService.generateMixedScenarios(
      R60_PROPERTY, {}, null
    );
    expect(scenarios.length).toBeGreaterThan(0);
    for (const s of scenarios) {
      expect(s.estimatedGRV).toBeGreaterThan(0);
    }
  });
});
