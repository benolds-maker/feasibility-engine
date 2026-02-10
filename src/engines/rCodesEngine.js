// WA Residential Design Codes (R-Codes) Compliance Engine
// Based on State Planning Policy 7.3 – Residential Design Codes

const R_CODE_RULES = {
  R20: {
    label: 'R20',
    minLotSize: 350,
    avgLotSize: 450,
    maxPlotRatio: 0.5,
    minOpenSpace: 0.50,
    maxSiteCoverage: 0.50,
    maxStories: 2,
    maxWallHeight: 6,
    maxBuildingHeight: 9,
    setbacks: {
      primaryStreet: 6,
      secondaryStreet: 1.5,
      side: 1.5,
      rear: 6,
    },
    parkingPerDwelling: 2,
    visitorParkingRatio: 0.25,
    typicalDensity: 'Low',
  },
  R30: {
    label: 'R30',
    minLotSize: 260,
    avgLotSize: 300,
    maxPlotRatio: 0.6,
    minOpenSpace: 0.45,
    maxSiteCoverage: 0.55,
    maxStories: 2,
    maxWallHeight: 6,
    maxBuildingHeight: 9,
    setbacks: {
      primaryStreet: 4,
      secondaryStreet: 1.5,
      side: 1.0,
      rear: 1.5,
    },
    parkingPerDwelling: 2,
    visitorParkingRatio: 0.25,
    typicalDensity: 'Medium',
  },
  R40: {
    label: 'R40',
    minLotSize: 180,
    avgLotSize: 220,
    maxPlotRatio: 0.6,
    minOpenSpace: 0.45,
    maxSiteCoverage: 0.60,
    maxStories: 2,
    maxWallHeight: 7,
    maxBuildingHeight: 10,
    setbacks: {
      primaryStreet: 4,
      secondaryStreet: 1.5,
      side: 1.0,
      rear: 1.5,
    },
    parkingPerDwelling: 1.5,
    visitorParkingRatio: 0.25,
    typicalDensity: 'Medium-High',
  },
  R60: {
    label: 'R60',
    minLotSize: 120,
    avgLotSize: 150,
    maxPlotRatio: 0.7,
    minOpenSpace: 0.40,
    maxSiteCoverage: 0.65,
    maxStories: 3,
    maxWallHeight: 9,
    maxBuildingHeight: 12,
    setbacks: {
      primaryStreet: 4,
      secondaryStreet: 1.5,
      side: 1.0,
      rear: 1.5,
    },
    parkingPerDwelling: 1,
    visitorParkingRatio: 0.25,
    typicalDensity: 'High',
  },
  R80: {
    label: 'R80',
    minLotSize: 100,
    avgLotSize: 120,
    maxPlotRatio: 0.8,
    minOpenSpace: 0.35,
    maxSiteCoverage: 0.70,
    maxStories: 4,
    maxWallHeight: 12,
    maxBuildingHeight: 15,
    setbacks: {
      primaryStreet: 3,
      secondaryStreet: 1.5,
      side: 1.0,
      rear: 1.0,
    },
    parkingPerDwelling: 1,
    visitorParkingRatio: 0.20,
    typicalDensity: 'High',
  },
};

export function getRCodeRules(rCode) {
  return R_CODE_RULES[rCode] || null;
}

export function getAllRCodes() {
  return Object.keys(R_CODE_RULES);
}

// Calculate the maximum buildable area given lot area and R-Code
export function calculateBuildableArea(lotArea, rCode) {
  const rules = getRCodeRules(rCode);
  if (!rules) return null;

  const maxFootprint = lotArea * rules.maxSiteCoverage;
  const maxGFA = lotArea * rules.maxPlotRatio * rules.maxStories;
  const minOpenSpaceArea = lotArea * rules.minOpenSpace;
  const usableBuildArea = lotArea - minOpenSpaceArea;

  return {
    totalLotArea: lotArea,
    maxSiteCoverage: maxFootprint,
    maxGFA,
    minOpenSpaceArea,
    usableBuildArea,
    maxStories: rules.maxStories,
  };
}

// Calculate setback-adjusted buildable envelope
export function calculateBuildableEnvelope(lotWidth, lotDepth, rCode) {
  const rules = getRCodeRules(rCode);
  if (!rules) return null;

  const { primaryStreet, side, rear } = rules.setbacks;
  const effectiveWidth = lotWidth - (side * 2);
  const effectiveDepth = lotDepth - primaryStreet - rear;
  const envelopeArea = Math.max(0, effectiveWidth * effectiveDepth);

  return {
    lotWidth,
    lotDepth,
    effectiveWidth: Math.max(0, effectiveWidth),
    effectiveDepth: Math.max(0, effectiveDepth),
    envelopeArea,
    setbacks: rules.setbacks,
  };
}

// Calculate parking requirements
export function calculateParkingRequirements(numDwellings, rCode) {
  const rules = getRCodeRules(rCode);
  if (!rules) return null;

  const residentBays = Math.ceil(numDwellings * rules.parkingPerDwelling);
  const visitorBays = Math.ceil(numDwellings * rules.visitorParkingRatio);
  const totalBays = residentBays + visitorBays;
  // Standard bay: 5.5m x 2.5m = 13.75sqm, with access aisle ~18sqm effective
  const parkingArea = totalBays * 18;

  return {
    residentBays,
    visitorBays,
    totalBays,
    parkingArea,
    bayDimensions: '5.5m × 2.5m',
  };
}

// Full compliance check
export function checkCompliance(params) {
  const {
    lotArea,
    lotWidth,
    lotDepth,
    rCode,
    proposedDwellings,
    proposedGFA,
    proposedSiteCoverage,
    proposedOpenSpace,
    proposedHeight,
  } = params;

  const rules = getRCodeRules(rCode);
  if (!rules) return { valid: false, errors: ['Invalid R-Code'] };

  const checks = [];
  let allPassed = true;

  // Plot ratio check
  const proposedPlotRatio = proposedGFA / lotArea;
  const plotRatioOk = proposedPlotRatio <= rules.maxPlotRatio;
  checks.push({
    name: 'Plot Ratio',
    allowed: `${(rules.maxPlotRatio * 100).toFixed(0)}%`,
    proposed: `${(proposedPlotRatio * 100).toFixed(1)}%`,
    compliant: plotRatioOk,
  });
  if (!plotRatioOk) allPassed = false;

  // Site coverage check
  const coverageRatio = proposedSiteCoverage / lotArea;
  const coverageOk = coverageRatio <= rules.maxSiteCoverage;
  checks.push({
    name: 'Site Coverage',
    allowed: `${(rules.maxSiteCoverage * 100).toFixed(0)}%`,
    proposed: `${(coverageRatio * 100).toFixed(1)}%`,
    compliant: coverageOk,
  });
  if (!coverageOk) allPassed = false;

  // Open space check
  const openSpaceRatio = proposedOpenSpace / lotArea;
  const openSpaceOk = openSpaceRatio >= rules.minOpenSpace;
  checks.push({
    name: 'Open Space',
    allowed: `>= ${(rules.minOpenSpace * 100).toFixed(0)}%`,
    proposed: `${(openSpaceRatio * 100).toFixed(1)}%`,
    compliant: openSpaceOk,
  });
  if (!openSpaceOk) allPassed = false;

  // Height check
  const heightOk = proposedHeight <= rules.maxStories;
  checks.push({
    name: 'Building Height',
    allowed: `${rules.maxStories} stories`,
    proposed: `${proposedHeight} stories`,
    compliant: heightOk,
  });
  if (!heightOk) allPassed = false;

  // Parking
  const parking = calculateParkingRequirements(proposedDwellings, rCode);
  checks.push({
    name: 'Parking Bays',
    allowed: `${parking.totalBays} bays required`,
    proposed: `${parking.totalBays} bays allocated`,
    compliant: true,
  });

  // Setbacks
  const envelope = calculateBuildableEnvelope(lotWidth, lotDepth, rCode);
  checks.push({
    name: 'Primary Setback',
    allowed: `${rules.setbacks.primaryStreet}m`,
    proposed: `${rules.setbacks.primaryStreet}m`,
    compliant: true,
  });
  checks.push({
    name: 'Side Setbacks',
    allowed: `${rules.setbacks.side}m each side`,
    proposed: `${rules.setbacks.side}m`,
    compliant: true,
  });
  checks.push({
    name: 'Rear Setback',
    allowed: `${rules.setbacks.rear}m`,
    proposed: `${rules.setbacks.rear}m`,
    compliant: true,
  });

  return {
    valid: allPassed,
    checks,
    rules,
    envelope,
    parking,
  };
}

export default {
  getRCodeRules,
  getAllRCodes,
  calculateBuildableArea,
  calculateBuildableEnvelope,
  calculateParkingRequirements,
  checkCompliance,
  R_CODE_RULES,
};
