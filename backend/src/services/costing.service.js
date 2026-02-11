// Terrain-Adjusted Costing Service
// Comprehensive development cost estimation incorporating terrain analysis

class CostingService {
  /**
   * Calculate total development cost with terrain adjustments.
   * @param {Object} params
   * @param {number} params.totalGFA - Total gross floor area in sqm
   * @param {number} params.totalUnits - Number of dwelling units
   * @param {number} params.lotArea - Site area in sqm
   * @param {Object} params.terrainAnalysis - From elevation service (optional)
   * @param {string} params.constructionQuality - 'budget'|'standard'|'premium'
   * @param {number} params.landCost - Land purchase price
   * @param {number} params.timelineMonths - Project timeline
   * @param {number} params.interestRate - Annual interest rate (decimal, e.g. 0.07)
   * @param {number} params.debtRatio - Loan-to-cost ratio (decimal, e.g. 0.70)
   * @returns {Object} Detailed cost breakdown
   */
  calculateTotalCost(params) {
    const {
      totalGFA,
      totalUnits,
      lotArea,
      terrainAnalysis = null,
      constructionQuality = 'standard',
      customBuildCostPerSqm = null,
      landCost = 0,
      timelineMonths = 18,
      interestRate = 0.07,
      debtRatio = 0.70,
    } = params;

    const terrainMultiplier = terrainAnalysis?.costMultiplier || 1.0;

    // ── Base Construction ──────────────────────────
    const baseRates = { budget: 2000, standard: 2400, premium: 2900 };
    const baseRate = (constructionQuality === 'custom' && customBuildCostPerSqm)
      ? customBuildCostPerSqm
      : (baseRates[constructionQuality] || 2400);
    const adjustedRate = Math.round(baseRate * terrainMultiplier);
    const baseBuildCost = totalGFA * adjustedRate;

    // ── Terrain Costs ──────────────────────────────
    const terrainCosts = terrainAnalysis?.terrainCosts || {
      earthworks: { cost: Math.round(lotArea * 15) },
      retainingWalls: { cost: 0 },
      foundationUpgrade: 0,
      soilDisposal: { cost: 0 },
      total: Math.round(lotArea * 15),
    };

    const earthworksCost = terrainCosts.earthworks?.cost || 0;
    const retainingWallCost = terrainCosts.retainingWalls?.cost || 0;
    const foundationUpgrade = terrainCosts.foundationUpgrade || 0;
    const soilDisposalCost = terrainCosts.soilDisposal?.cost || 0;
    const totalTerrainCost = earthworksCost + retainingWallCost + foundationUpgrade + soilDisposalCost;

    // ── Site Works ─────────────────────────────────
    const servicesPerUnit = 14000; // water, sewer, power, gas, NBN combined
    const servicesCost = totalUnits * servicesPerUnit;

    const drivewayPerUnit = 8000;
    const drivewayCost = totalUnits * drivewayPerUnit;

    const landscapingRate = 50; // per sqm of open space
    const estimatedOpenSpace = Math.max(lotArea * 0.35, lotArea - totalGFA * 0.5);
    const landscapingCost = Math.round(estimatedOpenSpace * landscapingRate);

    const estimatedPerimeter = Math.sqrt(lotArea) * 4;
    const fencingRate = 200; // per linear meter
    const fencingCost = Math.round(estimatedPerimeter * fencingRate);

    const totalSiteWorks = servicesCost + drivewayCost + landscapingCost + fencingCost;

    // ── Professional Fees ──────────────────────────
    const architectFee = Math.round(baseBuildCost * 0.06); // 6%
    const engineerFee = Math.round(baseBuildCost * 0.02); // 2%
    const surveyorFee = 8000;
    const totalFall = terrainAnalysis?.totalFall || 0;
    const geoFee = totalFall > 3 ? 15000 : totalFall > 1.5 ? 10000 : 5000;
    const plannerFee = 12000;
    const totalProfessional = architectFee + engineerFee + surveyorFee + geoFee + plannerFee;

    // ── Authority/Statutory Fees ───────────────────
    const daFee = 18000;
    const buildingPermitPerUnit = 3500;
    const waterCorpPerUnit = 2800;
    const westernPowerPerUnit = 3200;
    const totalAuthority = daFee +
      (totalUnits * buildingPermitPerUnit) +
      (totalUnits * waterCorpPerUnit) +
      (totalUnits * westernPowerPerUnit);

    // ── Subtotal before contingency/finance ────────
    const subtotal = baseBuildCost + totalTerrainCost + totalSiteWorks +
      totalProfessional + totalAuthority;

    // ── Contingency (5%) ───────────────────────────
    const contingency = Math.round(subtotal * 0.05);

    // ── Finance Costs ──────────────────────────────
    const totalPreFinance = landCost + subtotal + contingency;
    const loanAmount = totalPreFinance * debtRatio;
    // Interest on progressive drawdown: 50% average draw over construction period
    const financeCost = Math.round(loanAmount * 0.5 * interestRate * (timelineMonths / 12));

    // ── Marketing (2.5% of estimated GRV or flat rate) ──
    // Estimate GRV from unit count for marketing calculation
    const estimatedGRVPerUnit = 650000; // conservative average
    const estimatedGRV = totalUnits * estimatedGRVPerUnit;
    const marketingCost = Math.round(estimatedGRV * 0.025);

    // ── Total Development Cost ─────────────────────
    const totalDevelopmentCost = landCost + subtotal + contingency + financeCost + marketingCost;

    return {
      construction: {
        baseRate,
        adjustedRate,
        terrainMultiplier,
        totalGFA,
        cost: baseBuildCost,
      },
      terrain: {
        earthworks: earthworksCost,
        retainingWalls: retainingWallCost,
        foundationUpgrade,
        soilDisposal: soilDisposalCost,
        total: totalTerrainCost,
      },
      siteWorks: {
        services: servicesCost,
        driveways: drivewayCost,
        landscaping: landscapingCost,
        fencing: fencingCost,
        total: totalSiteWorks,
      },
      professional: {
        architect: architectFee,
        engineer: engineerFee,
        surveyor: surveyorFee,
        geotech: geoFee,
        planner: plannerFee,
        total: totalProfessional,
      },
      authority: {
        developmentApplication: daFee,
        buildingPermits: totalUnits * buildingPermitPerUnit,
        waterCorp: totalUnits * waterCorpPerUnit,
        westernPower: totalUnits * westernPowerPerUnit,
        total: totalAuthority,
      },
      contingency,
      finance: financeCost,
      marketing: marketingCost,
      landCost,
      totalDevelopmentCost,
      costPerDwelling: Math.round(totalDevelopmentCost / totalUnits),
      costPerSqm: Math.round(totalDevelopmentCost / totalGFA),
    };
  }
}

export default new CostingService();
