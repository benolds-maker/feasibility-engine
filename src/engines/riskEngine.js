// Risk Assessment Engine
// Evaluates regulatory, market, planning, and financial risks

export function assessRisks(params) {
  const {
    // Planning overlays
    heritageOverlay = false,
    bushfireProne = false,
    floodRisk = false,
    contaminatedSite = false,
    treePO = false,
    acidSulfateSoils = false,

    // Market factors
    comparableSalesCount = 10,
    marketTrend = 'stable', // growing, stable, declining
    avgDaysOnMarket = 30,
    supplyLevel = 'normal', // low, normal, high

    // Planning factors
    lotShape = 'regular', // regular, irregular, very_irregular
    streetFrontage = 'adequate', // wide, adequate, limited
    topography = 'flat', // flat, moderate, steep
    largeTrees = false,

    // Financial results
    profitMargin = 0,
    returnOnCost = 0,
    debtRatio = 0.70,
    timelineMonths = 18,
  } = params;

  const risks = [];

  // ─────────────────────────────────────
  // REGULATORY RISKS
  // ─────────────────────────────────────
  if (heritageOverlay) {
    risks.push({
      category: 'Regulatory',
      level: 'high',
      title: 'Heritage Overlay',
      description: 'Heritage overlay may significantly limit development potential, require heritage impact assessments, and restrict demolition/modification.',
    });
  }

  if (floodRisk) {
    risks.push({
      category: 'Regulatory',
      level: 'high',
      title: 'Flood Risk Area',
      description: 'Site falls within a flood-prone area. May affect insurability and require elevated floor levels, increasing construction costs.',
    });
  }

  if (contaminatedSite) {
    risks.push({
      category: 'Regulatory',
      level: 'high',
      title: 'Contaminated Site',
      description: 'Site is on the contaminated sites register. Remediation may be required before development, adding significant cost and timeline uncertainty.',
    });
  }

  if (bushfireProne) {
    risks.push({
      category: 'Regulatory',
      level: 'medium',
      title: 'Bushfire Prone Area',
      description: 'Additional construction requirements under BAL rating assessment. May increase construction costs by 5-15% and require bushfire management plan.',
    });
  }

  if (acidSulfateSoils) {
    risks.push({
      category: 'Regulatory',
      level: 'medium',
      title: 'Acid Sulfate Soils',
      description: 'Acid sulfate soil management plan may be required. Additional earthworks costs and dewatering restrictions may apply.',
    });
  }

  if (treePO) {
    risks.push({
      category: 'Regulatory',
      level: 'medium',
      title: 'Tree Preservation Order',
      description: 'Protected trees on site may constrain building footprint and require arborist reports and protection measures during construction.',
    });
  }

  if (!heritageOverlay && !floodRisk && !contaminatedSite && !bushfireProne && !acidSulfateSoils && !treePO) {
    risks.push({
      category: 'Regulatory',
      level: 'low',
      title: 'No Regulatory Constraints',
      description: 'No significant regulatory overlays identified. Standard planning approval process expected.',
    });
  }

  // ─────────────────────────────────────
  // MARKET RISKS
  // ─────────────────────────────────────
  if (comparableSalesCount < 5) {
    risks.push({
      category: 'Market',
      level: 'medium',
      title: 'Limited Comparable Sales',
      description: `Only ${comparableSalesCount} comparable sales identified. Price estimates carry higher uncertainty.`,
    });
  }

  if (marketTrend === 'declining') {
    risks.push({
      category: 'Market',
      level: 'high',
      title: 'Declining Market',
      description: 'Recent market trend shows declining prices in this area. Sales revenue may be lower than projected.',
    });
  } else if (marketTrend === 'stable') {
    risks.push({
      category: 'Market',
      level: 'low',
      title: 'Stable Market',
      description: 'Market conditions in this area are stable, supporting reliable revenue projections.',
    });
  } else {
    risks.push({
      category: 'Market',
      level: 'low',
      title: 'Growing Market',
      description: 'Market is showing growth, potentially supporting higher-than-projected returns.',
    });
  }

  if (avgDaysOnMarket > 60) {
    risks.push({
      category: 'Market',
      level: 'medium',
      title: 'Extended Sales Timeline',
      description: `Average days on market is ${avgDaysOnMarket} days. Longer sales timeline may increase holding costs.`,
    });
  }

  if (supplyLevel === 'high') {
    risks.push({
      category: 'Market',
      level: 'high',
      title: 'High Supply / Oversupply',
      description: 'High levels of competing stock in the suburb. May face pricing pressure and longer sales periods.',
    });
  }

  // ─────────────────────────────────────
  // PLANNING RISKS
  // ─────────────────────────────────────
  if (lotShape === 'very_irregular') {
    risks.push({
      category: 'Planning',
      level: 'medium',
      title: 'Complex Site Shape',
      description: 'Irregular lot shape may constrain design options and reduce achievable yield.',
    });
  } else if (lotShape === 'irregular') {
    risks.push({
      category: 'Planning',
      level: 'low',
      title: 'Slightly Irregular Shape',
      description: 'Minor lot irregularity. Careful design should accommodate standard development.',
    });
  }

  if (streetFrontage === 'limited') {
    risks.push({
      category: 'Planning',
      level: 'medium',
      title: 'Limited Street Frontage',
      description: 'Narrow street frontage may restrict vehicle access and require battle-axe configuration.',
    });
  }

  if (topography === 'steep') {
    risks.push({
      category: 'Planning',
      level: 'medium',
      title: 'Steep Topography',
      description: 'Significant level changes will increase earthworks and retaining wall costs. Split-level designs may be required.',
    });
  }

  if (largeTrees) {
    risks.push({
      category: 'Planning',
      level: 'medium',
      title: 'Significant Trees Present',
      description: 'Large trees on site may need to be retained, constraining building placement and site layout.',
    });
  }

  // ─────────────────────────────────────
  // FINANCIAL RISKS
  // ─────────────────────────────────────
  if (profitMargin < 0.10) {
    risks.push({
      category: 'Financial',
      level: 'high',
      title: 'Low Profit Margin',
      description: `Projected profit margin of ${(profitMargin * 100).toFixed(1)}% is below the 10% minimum threshold. Insufficient buffer for cost overruns.`,
    });
  } else if (profitMargin < 0.15) {
    risks.push({
      category: 'Financial',
      level: 'medium',
      title: 'Moderate Profit Margin',
      description: `Projected profit margin of ${(profitMargin * 100).toFixed(1)}% provides limited buffer. Aim for 15-20% for comfortable risk coverage.`,
    });
  } else {
    risks.push({
      category: 'Financial',
      level: 'low',
      title: 'Healthy Profit Margin',
      description: `Projected profit margin of ${(profitMargin * 100).toFixed(1)}% provides adequate buffer for cost variations.`,
    });
  }

  if (returnOnCost < 0.12) {
    risks.push({
      category: 'Financial',
      level: 'medium',
      title: 'Low Return on Cost',
      description: `ROC of ${(returnOnCost * 100).toFixed(1)}% is below the 12% industry benchmark for development projects.`,
    });
  }

  if (debtRatio > 0.75) {
    risks.push({
      category: 'Financial',
      level: 'medium',
      title: 'High Debt Proportion',
      description: `${(debtRatio * 100).toFixed(0)}% debt financing increases exposure to interest rate movements and serviceability requirements.`,
    });
  }

  if (timelineMonths > 24) {
    risks.push({
      category: 'Financial',
      level: 'medium',
      title: 'Extended Timeline',
      description: `${timelineMonths}-month timeline increases holding costs and market exposure.`,
    });
  }

  // ─────────────────────────────────────
  // OVERALL RECOMMENDATION
  // ─────────────────────────────────────
  const highRisks = risks.filter(r => r.level === 'high');
  const mediumRisks = risks.filter(r => r.level === 'medium');
  const lowRisks = risks.filter(r => r.level === 'low');

  let recommendation;
  let recommendationLevel;

  if (highRisks.length > 1) {
    recommendation = 'Not Recommended — Multiple significant challenges identified that present substantial risk to project viability. Detailed due diligence required before proceeding.';
    recommendationLevel = 'red';
  } else if (highRisks.length === 1 && profitMargin > 0.18) {
    recommendation = 'Proceed with Caution — One significant risk identified, but healthy margin provides buffer. Conduct detailed due diligence on flagged risk area before committing.';
    recommendationLevel = 'amber';
  } else if (highRisks.length === 1) {
    recommendation = 'Caution Advised — Significant risk identified with insufficient profit margin to absorb potential cost increases. Consider risk mitigation strategies or alternative sites.';
    recommendationLevel = 'amber';
  } else if (mediumRisks.length > 0 && profitMargin > 0.15) {
    recommendation = 'Viable — Moderate risks identified with adequate profit margin. Further investigation warranted to refine cost estimates and confirm market assumptions.';
    recommendationLevel = 'green';
  } else if (mediumRisks.length === 0 && profitMargin > 0.20) {
    recommendation = 'Highly Recommended — Strong opportunity with minimal identified risks and healthy profit margin. Proceed to detailed feasibility and design stage.';
    recommendationLevel = 'green';
  } else if (profitMargin > 0.15) {
    recommendation = 'Viable — Acceptable risk profile with reasonable profit margin. Standard due diligence recommended before proceeding.';
    recommendationLevel = 'green';
  } else {
    recommendation = 'Marginal — Risk-adjusted returns may not justify development. Consider negotiating lower land price or alternative development configurations.';
    recommendationLevel = 'amber';
  }

  return {
    risks,
    summary: {
      high: highRisks.length,
      medium: mediumRisks.length,
      low: lowRisks.length,
      total: risks.length,
    },
    byCategory: {
      regulatory: risks.filter(r => r.category === 'Regulatory'),
      market: risks.filter(r => r.category === 'Market'),
      planning: risks.filter(r => r.category === 'Planning'),
      financial: risks.filter(r => r.category === 'Financial'),
    },
    recommendation,
    recommendationLevel,
  };
}
