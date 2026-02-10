import { Router } from 'express';
import { validateReportRequest } from '../middleware/validateRequest.js';
import yieldService from '../services/yield.service.js';
import rcodesService from '../services/rcodes.service.js';
import financialService from '../services/financial.service.js';
import riskService from '../services/risk.service.js';

const router = Router();

// POST /api/reports/generate
router.post('/generate', validateReportRequest, (req, res, next) => {
  try {
    const { property, financial, siteContext = {}, report = {} } = req.body;

    // 1. Yield optimization
    const yieldResult = yieldService.optimize({
      lotArea: Number(property.lotArea),
      lotWidth: Number(property.lotWidth),
      lotDepth: Number(property.lotDepth),
      rCode: property.rCode,
    });

    // 2. Compliance check
    const compliance = rcodesService.checkCompliance({
      lotArea: Number(property.lotArea),
      lotWidth: Number(property.lotWidth),
      lotDepth: Number(property.lotDepth),
      rCode: property.rCode,
      proposedDwellings: yieldResult.totalUnits,
      proposedGFA: yieldResult.totalGFA,
      proposedSiteCoverage: yieldResult.totalCoverage,
      proposedOpenSpace: yieldResult.openSpace,
      proposedHeight: 2,
    });

    // 3. Custom prices — merge user overrides with defaults
    const DEFAULT_MARKET_PRICES = financialService.getDefaultMarketPrices();
    const customPrices = {};
    ['2bed', '3bed', '4bed'].forEach(key => {
      const userPrice = financial[`price_${key}`];
      customPrices[key] = {
        ...DEFAULT_MARKET_PRICES[key],
        mid: userPrice ? Number(userPrice) : DEFAULT_MARKET_PRICES[key].mid,
      };
    });

    // 4. Financial feasibility
    // Normalize percentages: frontend sends 20 for 20%, engine expects 0.20
    const feasibility = financialService.calculate({
      landCost: Number(financial.landCost),
      lotArea: Number(property.lotArea),
      yield: yieldResult,
      constructionQuality: financial.constructionQuality || 'standard',
      targetMargin: (financial.targetMargin ?? 20) / 100,
      debtRatio: (financial.debtRatio ?? 70) / 100,
      interestRate: (financial.interestRate ?? 7.5) / 100,
      timelineMonths: Number(financial.timelineMonths) || 18,
      demolitionRequired: Boolean(siteContext.demolitionRequired),
      existingStructures: Number(siteContext.existingStructures) || 1,
      siteSlope: siteContext.siteSlope || 'flat',
      customPrices,
      companyName: report.companyName || '',
    });

    // 5. Risk assessment
    const riskAssessment = riskService.assess({
      heritageOverlay: Boolean(siteContext.heritageOverlay),
      bushfireProne: Boolean(siteContext.bushfireProne),
      floodRisk: Boolean(siteContext.floodRisk),
      contaminatedSite: Boolean(siteContext.contaminatedSite),
      treePO: Boolean(siteContext.treePO),
      acidSulfateSoils: Boolean(siteContext.acidSulfateSoils),
      comparableSalesCount: Number(siteContext.comparableSalesCount) || 10,
      marketTrend: siteContext.marketTrend || 'stable',
      avgDaysOnMarket: Number(siteContext.avgDaysOnMarket) || 30,
      supplyLevel: siteContext.supplyLevel || 'normal',
      lotShape: siteContext.lotShape || 'regular',
      streetFrontage: siteContext.streetFrontage || 'adequate',
      topography: siteContext.siteSlope || 'flat',
      largeTrees: Boolean(siteContext.largeTrees),
      profitMargin: feasibility.profitability.profitMargin,
      returnOnCost: feasibility.profitability.returnOnCost,
      debtRatio: (financial.debtRatio ?? 70) / 100,
      timelineMonths: Number(financial.timelineMonths) || 18,
    });

    res.json({
      success: true,
      data: { feasibility, yieldResult, compliance, riskAssessment },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/reports/generate/pdf
router.post('/generate/pdf', validateReportRequest, async (req, res, next) => {
  try {
    // Dynamically import PDF service only when needed (jsPDF is heavy)
    const { default: pdfService } = await import('../services/pdf.service.js');
    const { property, financial, siteContext = {}, report = {} } = req.body;

    // Run the same analysis pipeline
    const yieldResult = yieldService.optimize({
      lotArea: Number(property.lotArea),
      lotWidth: Number(property.lotWidth),
      lotDepth: Number(property.lotDepth),
      rCode: property.rCode,
    });

    const compliance = rcodesService.checkCompliance({
      lotArea: Number(property.lotArea),
      lotWidth: Number(property.lotWidth),
      lotDepth: Number(property.lotDepth),
      rCode: property.rCode,
      proposedDwellings: yieldResult.totalUnits,
      proposedGFA: yieldResult.totalGFA,
      proposedSiteCoverage: yieldResult.totalCoverage,
      proposedOpenSpace: yieldResult.openSpace,
      proposedHeight: 2,
    });

    const DEFAULT_MARKET_PRICES = financialService.getDefaultMarketPrices();
    const customPrices = {};
    ['2bed', '3bed', '4bed'].forEach(key => {
      const userPrice = financial[`price_${key}`];
      customPrices[key] = {
        ...DEFAULT_MARKET_PRICES[key],
        mid: userPrice ? Number(userPrice) : DEFAULT_MARKET_PRICES[key].mid,
      };
    });

    const feasibility = financialService.calculate({
      landCost: Number(financial.landCost),
      lotArea: Number(property.lotArea),
      yield: yieldResult,
      constructionQuality: financial.constructionQuality || 'standard',
      targetMargin: (financial.targetMargin ?? 20) / 100,
      debtRatio: (financial.debtRatio ?? 70) / 100,
      interestRate: (financial.interestRate ?? 7.5) / 100,
      timelineMonths: Number(financial.timelineMonths) || 18,
      demolitionRequired: Boolean(siteContext.demolitionRequired),
      existingStructures: Number(siteContext.existingStructures) || 1,
      siteSlope: siteContext.siteSlope || 'flat',
      customPrices,
      companyName: report.companyName || '',
    });

    const riskAssessment = riskService.assess({
      heritageOverlay: Boolean(siteContext.heritageOverlay),
      bushfireProne: Boolean(siteContext.bushfireProne),
      floodRisk: Boolean(siteContext.floodRisk),
      contaminatedSite: Boolean(siteContext.contaminatedSite),
      treePO: Boolean(siteContext.treePO),
      acidSulfateSoils: Boolean(siteContext.acidSulfateSoils),
      comparableSalesCount: Number(siteContext.comparableSalesCount) || 10,
      marketTrend: siteContext.marketTrend || 'stable',
      avgDaysOnMarket: Number(siteContext.avgDaysOnMarket) || 30,
      supplyLevel: siteContext.supplyLevel || 'normal',
      lotShape: siteContext.lotShape || 'regular',
      streetFrontage: siteContext.streetFrontage || 'adequate',
      topography: siteContext.siteSlope || 'flat',
      largeTrees: Boolean(siteContext.largeTrees),
      profitMargin: feasibility.profitability.profitMargin,
      returnOnCost: feasibility.profitability.returnOnCost,
      debtRatio: (financial.debtRatio ?? 70) / 100,
      timelineMonths: Number(financial.timelineMonths) || 18,
    });

    const results = { feasibility, yieldResult, compliance, riskAssessment };
    const formData = { ...property, ...financial, ...siteContext, ...report };

    const { buffer, filename } = pdfService.generate(results, formData);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(Buffer.from(buffer));
  } catch (err) {
    next(err);
  }
});

export default router;
