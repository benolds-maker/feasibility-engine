import { describe, it, expect } from 'vitest';
import { optimizeYield, DWELLING_TYPES } from '../../../src/engines/yieldEngine.js';
import { getRCodeRules } from '../../../src/engines/rCodesEngine.js';

// Standard test property: R60 / 800 sqm (20m × 40m)
const STANDARD_PARAMS = { lotArea: 800, lotWidth: 20, lotDepth: 40, rCode: 'R60' };

describe('optimizeYield — standard property', () => {
  const result = optimizeYield(STANDARD_PARAMS);
  const rules = getRCodeRules('R60');

  it('returns a non-null result', () => {
    expect(result).not.toBeNull();
  });

  it('result is compliant', () => {
    expect(result.compliant).toBe(true);
  });

  it('plot ratio is within R60 limit (≤ 0.70)', () => {
    expect(result.plotRatio).toBeLessThanOrEqual(rules.maxPlotRatio);
  });

  it('site coverage is within R60 limit (≤ 0.65)', () => {
    expect(result.siteCoverageRatio).toBeLessThanOrEqual(rules.maxSiteCoverage);
  });

  it('open space meets R60 minimum (≥ 0.40)', () => {
    expect(result.openSpaceRatio).toBeGreaterThanOrEqual(rules.minOpenSpace);
  });

  it('produces a realistic number of units', () => {
    expect(result.totalUnits).toBeGreaterThanOrEqual(1);
    expect(result.totalUnits).toBeLessThanOrEqual(8);
  });

  it('includes infrastructure breakdown', () => {
    expect(result.infrastructure).toBeDefined();
    expect(result.infrastructure.totalInfraArea).toBeGreaterThan(0);
    expect(result.infrastructure.drivewayArea).toBeGreaterThan(0);
    expect(result.infrastructure.commonLandscaping).toBeGreaterThan(0);
  });

  it('includes parking data', () => {
    expect(result.parking).toBeDefined();
    expect(result.parking.totalBays).toBeGreaterThan(0);
    expect(result.parking.residentBays).toBeGreaterThan(0);
  });

  it('all compliance flags are true', () => {
    expect(result.compliance.plotRatio).toBe(true);
    expect(result.compliance.siteCoverage).toBe(true);
    expect(result.compliance.openSpace).toBe(true);
  });

  it('includes layout information', () => {
    expect(result.layout).toBeDefined();
    expect(['battle-axe', 'wide-frontage', 'standard']).toContain(result.layout);
    expect(result.layoutDescription).toBeDefined();
    expect(result.layoutDescription.length).toBeGreaterThan(0);
  });

  it('includes dwelling details', () => {
    expect(result.dwellingDetails).toBeDefined();
    expect(result.dwellingDetails.length).toBeGreaterThan(0);
    for (const d of result.dwellingDetails) {
      expect(d.type).toBeDefined();
      expect(d.quantity).toBeGreaterThan(0);
      expect(d.avgSize).toBeGreaterThan(0);
      expect(d.totalGFA).toBeGreaterThan(0);
    }
  });

  it('totalGFA matches sum of dwelling GFAs', () => {
    const sumGFA = result.dwellingDetails.reduce((sum, d) => sum + d.totalGFA, 0);
    expect(result.totalGFA).toBe(sumGFA);
  });
});

describe('optimizeYield — different R-Codes', () => {
  it('R40/800sqm produces compliant result', () => {
    const result = optimizeYield({ lotArea: 800, lotWidth: 20, lotDepth: 40, rCode: 'R40' });
    expect(result).not.toBeNull();
    expect(result.compliant).toBe(true);
    expect(result.plotRatio).toBeLessThanOrEqual(0.6);
  });

  it('R20/800sqm produces compliant result with fewer units', () => {
    const result = optimizeYield({ lotArea: 800, lotWidth: 20, lotDepth: 40, rCode: 'R20' });
    expect(result).not.toBeNull();
    // R20 is low density — fewer units expected
    const r60Result = optimizeYield(STANDARD_PARAMS);
    expect(result.totalUnits).toBeLessThanOrEqual(r60Result.totalUnits);
  });

  it('R80/800sqm allows higher density', () => {
    const result = optimizeYield({ lotArea: 800, lotWidth: 20, lotDepth: 40, rCode: 'R80' });
    expect(result).not.toBeNull();
    expect(result.compliant).toBe(true);
    expect(result.plotRatio).toBeLessThanOrEqual(0.8);
  });
});

describe('optimizeYield — edge cases', () => {
  it('returns null for invalid R-Code', () => {
    const result = optimizeYield({ lotArea: 800, lotWidth: 20, lotDepth: 40, rCode: 'R99' });
    expect(result).toBeNull();
  });

  it('handles small lot gracefully', () => {
    const result = optimizeYield({ lotArea: 200, lotWidth: 10, lotDepth: 20, rCode: 'R60' });
    // Should return a result (fallback to 1 unit if needed)
    expect(result).not.toBeNull();
    expect(result.totalUnits).toBeGreaterThanOrEqual(1);
  });
});

describe('DWELLING_TYPES', () => {
  it('exports dwelling type definitions', () => {
    expect(DWELLING_TYPES).toBeDefined();
    expect(DWELLING_TYPES['2bed']).toBeDefined();
    expect(DWELLING_TYPES['3bed']).toBeDefined();
    expect(DWELLING_TYPES['4bed']).toBeDefined();
  });

  it('GFA increases with bedroom count', () => {
    expect(DWELLING_TYPES['3bed'].totalBuildArea).toBeGreaterThan(DWELLING_TYPES['2bed'].totalBuildArea);
    expect(DWELLING_TYPES['4bed'].totalBuildArea).toBeGreaterThan(DWELLING_TYPES['3bed'].totalBuildArea);
  });

  it('footprint is roughly half of GFA (2-storey)', () => {
    for (const type of Object.values(DWELLING_TYPES)) {
      const ratio = type.groundFloorArea / type.totalBuildArea;
      // Ground floor should be ~40-60% of total (2-storey townhouses)
      expect(ratio).toBeGreaterThan(0.35);
      expect(ratio).toBeLessThan(0.65);
    }
  });
});
