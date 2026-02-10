// Financial Calculation Engine
// Comprehensive feasibility analysis for Perth townhouse developments

const CONSTRUCTION_QUALITY = {
  budget: { label: 'Budget', rateMin: 1800, rateMax: 2200, midRate: 2000 },
  standard: { label: 'Standard', rateMin: 2200, rateMax: 2600, midRate: 2400 },
  premium: { label: 'Premium', rateMin: 2600, rateMax: 3200, midRate: 2900 },
};

// WA Stamp Duty rates (2025)
function calculateStampDuty(landValue) {
  if (landValue <= 80000) return landValue * 0.019;
  if (landValue <= 100000) return 1520 + (landValue - 80000) * 0.0285;
  if (landValue <= 250000) return 2090 + (landValue - 100000) * 0.038;
  if (landValue <= 500000) return 7790 + (landValue - 250000) * 0.0475;
  return 19665 + (landValue - 500000) * 0.0515;
}

// Default market prices for Perth townhouses (2025 estimates)
const DEFAULT_MARKET_PRICES = {
  '2bed': { low: 380000, mid: 450000, high: 520000 },
  '3bed': { low: 520000, mid: 620000, high: 720000 },
  '4bed': { low: 680000, mid: 780000, high: 880000 },
};

export function calculateFeasibility(params) {
  const {
    // Land
    landCost,
    lotArea,

    // Yield results
    yield: yieldResult,

    // Financial parameters
    constructionQuality = 'standard',
    targetMargin = 0.20,
    debtRatio = 0.70,
    interestRate = 0.075,
    timelineMonths = 18,

    // Site specifics
    demolitionRequired = false,
    existingStructures = 1,
    siteSlope = 'flat', // flat, moderate, steep

    // Market prices (optional overrides)
    customPrices = null,

    // Report branding
    companyName = '',
  } = params;

  const quality = CONSTRUCTION_QUALITY[constructionQuality] || CONSTRUCTION_QUALITY.standard;
  const numDwellings = yieldResult.totalUnits;
  const totalGFA = yieldResult.totalGFA;

  // ─────────────────────────────────────
  // A. REVENUE (GRV)
  // ─────────────────────────────────────
  const prices = customPrices || DEFAULT_MARKET_PRICES;
  const revenueByType = [];
  let totalGRV = 0;

  for (const detail of yieldResult.dwellingDetails) {
    const typeKey = detail.type.includes('2') ? '2bed' : detail.type.includes('3') ? '3bed' : '4bed';
    const price = prices[typeKey]?.mid || 600000;
    const lineTotal = detail.quantity * price;
    totalGRV += lineTotal;
    revenueByType.push({
      type: detail.type,
      quantity: detail.quantity,
      priceEach: price,
      total: lineTotal,
    });
  }

  // ─────────────────────────────────────
  // B. COSTS (TDC)
  // ─────────────────────────────────────

  // 1. Land & Acquisition
  const stampDuty = calculateStampDuty(landCost);
  const legalFeesAcquisition = 3500;
  const landTotal = landCost + stampDuty + legalFeesAcquisition;

  // 2. Site Preparation
  const demolitionCost = demolitionRequired ? existingStructures * 27500 : 0;
  const siteClearingCost = lotArea > 600 ? 10000 : 7500;
  const earthworksCost = siteSlope === 'steep' ? 50000 : siteSlope === 'moderate' ? 30000 : 15000;
  const siteTotal = demolitionCost + siteClearingCost + earthworksCost;

  // 3. Construction
  const buildingCost = totalGFA * quality.midRate;
  const designContingency = buildingCost * 0.04;
  const constructionContingency = buildingCost * 0.07;
  const constructionTotal = buildingCost + designContingency + constructionContingency;

  // 4. Services Connection
  const waterConnection = numDwellings * 4000;
  const sewerConnection = numDwellings * 4500;
  const powerConnection = numDwellings * 3000;
  const gasConnection = numDwellings * 2000;
  const nbnConnection = numDwellings * 1500;
  const servicesTotal = waterConnection + sewerConnection + powerConnection + gasConnection + nbnConnection;

  // 5. Common Infrastructure
  const drivewayCost = 12000;
  const accessRoadArea = yieldResult.infrastructure?.totalInfraArea || 80;
  const accessRoadCost = accessRoadArea * 275;
  const landscapingCost = (yieldResult.openSpace || 200) * 80;
  const fencingCost = Math.sqrt(lotArea) * 4 * 200; // approximate perimeter
  const stormwaterCost = numDwellings > 4 ? 25000 : 15000;
  const infraTotal = drivewayCost + accessRoadCost + landscapingCost + fencingCost + stormwaterCost;

  // 6. Professional Fees
  const architectFee = buildingCost * 0.055;
  const engineerFee = buildingCost * 0.015;
  const geoReport = 3500;
  const surveyorFee = 5500;
  const townPlannerFee = 10000;
  const buildingPermitFee = buildingCost * 0.01;
  const professionalTotal = architectFee + engineerFee + geoReport + surveyorFee + townPlannerFee + buildingPermitFee;

  // 7. Statutory Fees
  const devApplicationFee = 5500;
  const buildingPermits = numDwellings * 2750;
  const waterCorpFees = numDwellings * 3500;
  const westernPowerFees = numDwellings * 2000;
  const statutoryTotal = devApplicationFee + buildingPermits + waterCorpFees + westernPowerFees;

  // 8. Finance Costs
  const totalPreFinanceCosts = landTotal + siteTotal + constructionTotal + servicesTotal +
    infraTotal + professionalTotal + statutoryTotal;
  const loanAmount = totalPreFinanceCosts * debtRatio;
  const establishmentFee = loanAmount * 0.015;
  // Interest calculated on progressive drawdown (average 60% of loan over period)
  const interestCost = loanAmount * 0.6 * interestRate * (timelineMonths / 12);
  const financeTotal = establishmentFee + interestCost;

  // 9. Marketing & Sales
  const agentCommission = totalGRV * 0.025;
  const marketingCampaign = numDwellings * 5000;
  const salesOffice = 15000;
  const marketingTotal = agentCommission + marketingCampaign + salesOffice;

  // Total Development Cost
  const totalDevelopmentCost = landTotal + siteTotal + constructionTotal + servicesTotal +
    infraTotal + professionalTotal + statutoryTotal + financeTotal + marketingTotal;

  // ─────────────────────────────────────
  // C. PROFITABILITY
  // ─────────────────────────────────────
  const grossProfit = totalGRV - totalDevelopmentCost;
  const profitMargin = totalGRV > 0 ? grossProfit / totalGRV : 0;
  const returnOnCost = totalDevelopmentCost > 0 ? grossProfit / totalDevelopmentCost : 0;
  const equityContribution = totalDevelopmentCost * (1 - debtRatio);
  const returnOnEquity = equityContribution > 0 ? grossProfit / equityContribution : 0;

  // ─────────────────────────────────────
  // D. BREAKEVEN
  // ─────────────────────────────────────
  const requiredGRVForTarget = totalDevelopmentCost / (1 - targetMargin);
  const grvShortfall = requiredGRVForTarget - totalGRV;
  const breakEvenPricePerUnit = totalDevelopmentCost / numDwellings;

  // ─────────────────────────────────────
  // E. SENSITIVITY
  // ─────────────────────────────────────
  const sensitivity = calculateSensitivity({
    totalGRV,
    totalDevelopmentCost,
    buildingCost,
    landCost,
    landTotal,
    siteTotal,
    servicesTotal,
    infraTotal,
    professionalTotal,
    statutoryTotal,
    financeTotal,
    marketingTotal,
    constructionTotal,
    loanAmount,
    interestRate,
    debtRatio,
    timelineMonths,
    numDwellings,
    totalGFA,
    quality,
  });

  return {
    revenue: {
      byType: revenueByType,
      totalGRV,
    },
    costs: {
      land: {
        purchasePrice: landCost,
        stampDuty,
        legalFees: legalFeesAcquisition,
        total: landTotal,
      },
      sitePrep: {
        demolition: demolitionCost,
        siteClearing: siteClearingCost,
        earthworks: earthworksCost,
        total: siteTotal,
      },
      construction: {
        buildingCosts: buildingCost,
        designContingency,
        constructionContingency,
        total: constructionTotal,
        ratePerSqm: quality.midRate,
        qualityLabel: quality.label,
      },
      services: {
        water: waterConnection,
        sewer: sewerConnection,
        power: powerConnection,
        gas: gasConnection,
        nbn: nbnConnection,
        total: servicesTotal,
      },
      infrastructure: {
        driveway: drivewayCost,
        accessRoads: accessRoadCost,
        landscaping: landscapingCost,
        fencing: fencingCost,
        stormwater: stormwaterCost,
        total: infraTotal,
      },
      professional: {
        architect: architectFee,
        engineer: engineerFee,
        geoReport,
        surveyor: surveyorFee,
        townPlanner: townPlannerFee,
        buildingPermit: buildingPermitFee,
        total: professionalTotal,
      },
      statutory: {
        devApplication: devApplicationFee,
        buildingPermits,
        waterCorp: waterCorpFees,
        westernPower: westernPowerFees,
        total: statutoryTotal,
      },
      finance: {
        establishment: establishmentFee,
        interest: interestCost,
        total: financeTotal,
        loanAmount,
        interestRate,
      },
      marketing: {
        agentCommission,
        campaign: marketingCampaign,
        salesOffice,
        total: marketingTotal,
      },
      totalDevelopmentCost,
    },
    profitability: {
      grossProfit,
      profitMargin,
      returnOnCost,
      returnOnEquity,
      equityContribution,
    },
    breakeven: {
      requiredGRVForTarget,
      grvShortfall,
      breakEvenPricePerUnit,
      targetMargin,
    },
    sensitivity,
    metadata: {
      numDwellings,
      totalGFA,
      constructionQuality: quality.label,
      timelineMonths,
      debtRatio,
      interestRate,
      companyName,
    },
  };
}

function calculateSensitivity(params) {
  const {
    totalGRV, totalDevelopmentCost, buildingCost, landCost,
    landTotal, siteTotal, servicesTotal, infraTotal,
    professionalTotal, statutoryTotal, financeTotal, marketingTotal,
    constructionTotal, loanAmount, interestRate, debtRatio,
    timelineMonths, numDwellings, totalGFA, quality,
  } = params;

  // Helper: recalculate margin with adjusted values
  function marginWith(grv, tdc) {
    return grv > 0 ? (grv - tdc) / grv : 0;
  }

  const baseMargin = marginWith(totalGRV, totalDevelopmentCost);

  // Sales price sensitivity: -10%, -5%, base, +5%, +10%
  const salesVariances = [-0.10, -0.05, 0, 0.05, 0.10];
  const salesSensitivity = salesVariances.map(v => ({
    variance: v,
    grv: totalGRV * (1 + v),
    margin: marginWith(totalGRV * (1 + v), totalDevelopmentCost),
  }));

  // Construction cost sensitivity
  const constructionNonBuildCost = totalDevelopmentCost - constructionTotal - landTotal;
  const constructionSensitivity = salesVariances.map(v => {
    const newConstruction = constructionTotal * (1 + v);
    const newTDC = landTotal + siteTotal + newConstruction + servicesTotal + infraTotal +
      professionalTotal + statutoryTotal + financeTotal + marketingTotal;
    return {
      variance: v,
      constructionCost: newConstruction,
      margin: marginWith(totalGRV, newTDC),
    };
  });

  // Land cost sensitivity
  const landSensitivity = salesVariances.map(v => {
    const newLandCost = landCost * (1 + v);
    const newLandTotal = newLandCost + calculateStampDutyInternal(newLandCost) + 3500;
    const newTDC = newLandTotal + siteTotal + constructionTotal + servicesTotal + infraTotal +
      professionalTotal + statutoryTotal + financeTotal + marketingTotal;
    return {
      variance: v,
      landCost: newLandCost,
      margin: marginWith(totalGRV, newTDC),
    };
  });

  // Timeline sensitivity
  const timelineScenarios = [
    { label: 'Fast-tracked (-3 months)', months: timelineMonths - 3 },
    { label: `Base case (${timelineMonths} months)`, months: timelineMonths },
    { label: 'Delayed (+6 months)', months: timelineMonths + 6 },
    { label: 'Major delay (+12 months)', months: timelineMonths + 12 },
  ];

  const timelineSensitivity = timelineScenarios.map(s => {
    const newInterest = loanAmount * 0.6 * interestRate * (s.months / 12);
    const newFinanceTotal = loanAmount * 0.015 + newInterest;
    const newTDC = landTotal + siteTotal + constructionTotal + servicesTotal + infraTotal +
      professionalTotal + statutoryTotal + newFinanceTotal + marketingTotal;
    return {
      ...s,
      interestCost: newInterest,
      margin: marginWith(totalGRV, newTDC),
    };
  });

  // Most sensitive factor
  const salesImpact = Math.abs(salesSensitivity[0].margin - salesSensitivity[4].margin);
  const constructionImpact = Math.abs(constructionSensitivity[0].margin - constructionSensitivity[4].margin);
  const landImpact = Math.abs(landSensitivity[0].margin - landSensitivity[4].margin);

  let mostSensitive = 'Sales prices';
  if (constructionImpact > salesImpact && constructionImpact > landImpact) mostSensitive = 'Construction costs';
  if (landImpact > salesImpact && landImpact > constructionImpact) mostSensitive = 'Land cost';

  return {
    sales: salesSensitivity,
    construction: constructionSensitivity,
    land: landSensitivity,
    timeline: timelineSensitivity,
    baseMargin,
    mostSensitive,
  };
}

function calculateStampDutyInternal(value) {
  return calculateStampDuty(value);
}

export { CONSTRUCTION_QUALITY, DEFAULT_MARKET_PRICES, calculateStampDuty };
