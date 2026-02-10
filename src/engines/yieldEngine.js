// Yield Optimization Engine
// Determines maximum viable dwelling count and mix for a site

import { getRCodeRules, calculateParkingRequirements, calculateBuildableEnvelope } from './rCodesEngine.js';

const DWELLING_TYPES = {
  '2bed': {
    label: '2 Bedroom',
    groundFloorArea: 55, // sqm ground floor footprint
    totalBuildArea: 100, // sqm total (2 story)
    internalGarage: 18,
    minLotWidth: 6,
    stories: 2,
  },
  '3bed': {
    label: '3 Bedroom',
    groundFloorArea: 70,
    totalBuildArea: 145,
    internalGarage: 20,
    minLotWidth: 7.5,
    stories: 2,
  },
  '4bed': {
    label: '4 Bedroom',
    groundFloorArea: 95,
    totalBuildArea: 200,
    internalGarage: 22,
    minLotWidth: 9,
    stories: 2,
  },
};

// Determine site layout type based on lot proportions
function determineSiteLayout(lotWidth, lotDepth) {
  const ratio = lotDepth / lotWidth;
  if (ratio > 2.5) return 'battle-axe';
  if (lotWidth > lotDepth * 1.2) return 'wide-frontage';
  return 'standard';
}

// Calculate common infrastructure area (driveways, access)
function calculateInfrastructureArea(numDwellings, layout) {
  // Shared driveway: 3.5m wide minimum (6m for two-way)
  const drivewayWidth = numDwellings > 3 ? 6 : 3.5;
  const drivewayLength = layout === 'battle-axe' ? 25 : 15;
  const drivewayArea = drivewayWidth * drivewayLength;

  // Turning areas for more than 4 dwellings
  const turningArea = numDwellings > 4 ? 50 : 0;

  // Common landscaping / pedestrian paths
  const commonLandscaping = numDwellings * 8;

  return {
    drivewayArea,
    turningArea,
    commonLandscaping,
    totalInfraArea: drivewayArea + turningArea + commonLandscaping,
  };
}

// Main yield optimization function
export function optimizeYield(params) {
  const {
    lotArea,
    lotWidth,
    lotDepth,
    rCode,
  } = params;

  const rules = getRCodeRules(rCode);
  if (!rules) return null;

  const layout = determineSiteLayout(lotWidth, lotDepth);
  const envelope = calculateBuildableEnvelope(lotWidth, lotDepth, rCode);

  // Calculate the maximum number of dwellings by trying different counts
  let bestResult = null;

  for (let totalUnits = 1; totalUnits <= 20; totalUnits++) {
    // Try various mixes
    const mixes = generateMixes(totalUnits, lotWidth, rules);

    for (const mix of mixes) {
      const result = evaluateMix(mix, lotArea, lotWidth, lotDepth, rules, layout, envelope);
      if (result.compliant) {
        // Score by estimated revenue (higher value mixes preferred), then by unit count
        const score = result.estimatedRevenue;
        const bestScore = bestResult ? bestResult.estimatedRevenue : 0;
        if (!bestResult || score > bestScore) {
          bestResult = result;
        }
      }
    }
  }

  if (!bestResult) {
    // Fallback: at least 1 unit should be possible on most lots
    bestResult = evaluateMix(
      { '2bed': 1, '3bed': 0, '4bed': 0 },
      lotArea, lotWidth, lotDepth, rules, layout, envelope
    );
  }

  return {
    ...bestResult,
    layout,
    layoutDescription: getLayoutDescription(layout, bestResult),
    rCode,
    rules,
  };
}

function generateMixes(totalUnits, lotWidth, rules) {
  const mixes = [];

  // Heuristic: allocate based on lot width and code density
  for (let fourBed = 0; fourBed <= Math.min(totalUnits, Math.floor(totalUnits * 0.3)); fourBed++) {
    for (let threeBed = 0; threeBed <= totalUnits - fourBed; threeBed++) {
      const twoBed = totalUnits - fourBed - threeBed;
      mixes.push({ '2bed': twoBed, '3bed': threeBed, '4bed': fourBed });
    }
  }

  return mixes;
}

function evaluateMix(mix, lotArea, lotWidth, lotDepth, rules, layout, envelope) {
  const totalUnits = mix['2bed'] + mix['3bed'] + mix['4bed'];
  if (totalUnits === 0) return { compliant: false, totalUnits: 0, estimatedRevenue: 0 };

  // Estimate revenue for scoring (uses default Perth market prices)
  const REVENUE_ESTIMATE = { '2bed': 450000, '3bed': 620000, '4bed': 780000 };
  const estimatedRevenue = mix['2bed'] * REVENUE_ESTIMATE['2bed'] +
    mix['3bed'] * REVENUE_ESTIMATE['3bed'] +
    mix['4bed'] * REVENUE_ESTIMATE['4bed'];

  // Calculate total GFA
  const totalGFA =
    mix['2bed'] * DWELLING_TYPES['2bed'].totalBuildArea +
    mix['3bed'] * DWELLING_TYPES['3bed'].totalBuildArea +
    mix['4bed'] * DWELLING_TYPES['4bed'].totalBuildArea;

  // Calculate ground floor coverage (site coverage)
  const totalFootprint =
    mix['2bed'] * DWELLING_TYPES['2bed'].groundFloorArea +
    mix['3bed'] * DWELLING_TYPES['3bed'].groundFloorArea +
    mix['4bed'] * DWELLING_TYPES['4bed'].groundFloorArea;

  // Infrastructure
  const infra = calculateInfrastructureArea(totalUnits, layout);

  // Parking
  const parking = calculateParkingRequirements(totalUnits, rules.label);
  // External parking (visitor bays + any overflow)
  const externalParkingArea = parking.visitorBays * 15;

  // Total impervious/built area
  const totalCoverage = totalFootprint + infra.totalInfraArea + externalParkingArea;

  // Open space
  const openSpace = lotArea - totalCoverage;

  // Compliance checks
  const plotRatio = totalGFA / lotArea;
  const siteCoverageRatio = totalCoverage / lotArea;
  const openSpaceRatio = openSpace / lotArea;

  const plotRatioOk = plotRatio <= rules.maxPlotRatio;
  const siteCoverageOk = siteCoverageRatio <= rules.maxSiteCoverage;
  const openSpaceOk = openSpaceRatio >= rules.minOpenSpace;
  const fitsInEnvelope = totalCoverage <= envelope.envelopeArea + infra.totalInfraArea;

  const compliant = plotRatioOk && siteCoverageOk && openSpaceOk;

  return {
    mix,
    totalUnits,
    totalGFA,
    totalFootprint,
    estimatedRevenue,
    infrastructure: infra,
    parking,
    totalCoverage,
    openSpace,
    plotRatio,
    siteCoverageRatio,
    openSpaceRatio,
    compliant,
    compliance: {
      plotRatio: plotRatioOk,
      siteCoverage: siteCoverageOk,
      openSpace: openSpaceOk,
      envelope: fitsInEnvelope,
    },
    dwellingDetails: [
      ...(mix['2bed'] > 0 ? [{
        type: '2 Bedroom',
        quantity: mix['2bed'],
        avgSize: DWELLING_TYPES['2bed'].totalBuildArea,
        totalGFA: mix['2bed'] * DWELLING_TYPES['2bed'].totalBuildArea,
      }] : []),
      ...(mix['3bed'] > 0 ? [{
        type: '3 Bedroom',
        quantity: mix['3bed'],
        avgSize: DWELLING_TYPES['3bed'].totalBuildArea,
        totalGFA: mix['3bed'] * DWELLING_TYPES['3bed'].totalBuildArea,
      }] : []),
      ...(mix['4bed'] > 0 ? [{
        type: '4 Bedroom',
        quantity: mix['4bed'],
        avgSize: DWELLING_TYPES['4bed'].totalBuildArea,
        totalGFA: mix['4bed'] * DWELLING_TYPES['4bed'].totalBuildArea,
      }] : []),
    ],
  };
}

function getLayoutDescription(layout, result) {
  if (!result) return 'Unable to determine layout.';
  const { totalUnits, mix } = result;

  const descriptions = {
    'battle-axe': `Battle-axe configuration with shared driveway access from the street. ${totalUnits} dwellings arranged along the driveway with individual access to each unit. Deep lot allows for rear positioning of units with private courtyard spaces.`,
    'wide-frontage': `Linear frontage configuration maximizing street presence. ${totalUnits} dwellings arranged side-by-side with individual street access where possible. Wide lot allows for varied facade treatments and direct vehicle access.`,
    'standard': `Standard grouped dwelling configuration with ${totalUnits > 3 ? 'central' : 'side'} shared driveway. ${totalUnits} dwellings arranged to maximize private open space for each unit while maintaining efficient common area usage.`,
  };

  return descriptions[layout] || descriptions['standard'];
}

export { DWELLING_TYPES };
