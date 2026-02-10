const API_BASE = '/api';

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;

  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!res.ok) {
    let errorData;
    try {
      errorData = await res.json();
    } catch {
      errorData = { error: { message: res.statusText } };
    }
    throw new ApiError(
      errorData?.error?.message || `Request failed (${res.status})`,
      res.status,
      errorData
    );
  }

  return res.json();
}

/**
 * Maps the frontend DEFAULT_FORM shape to the API contract.
 * The API expects: { property, financial, siteContext, report }
 */
export async function generateReport(formData) {
  const body = {
    property: {
      address: formData.address,
      suburb: formData.suburb,
      postcode: formData.postcode,
      lotPlan: formData.lotPlan,
      lotArea: formData.lotArea,
      lotWidth: formData.lotWidth,
      lotDepth: formData.lotDepth,
      rCode: formData.rCode,
    },
    financial: {
      landCost: formData.landCost,
      targetMargin: formData.targetMargin,
      constructionQuality: formData.constructionQuality,
      debtRatio: formData.debtRatio,
      interestRate: formData.interestRate,
      timelineMonths: formData.timelineMonths,
      price_2bed: formData.price_2bed,
      price_3bed: formData.price_3bed,
      price_4bed: formData.price_4bed,
    },
    siteContext: {
      heritageOverlay: formData.heritageOverlay,
      bushfireProne: formData.bushfireProne,
      floodRisk: formData.floodRisk,
      contaminatedSite: formData.contaminatedSite,
      treePO: formData.treePO,
      acidSulfateSoils: formData.acidSulfateSoils,
      demolitionRequired: formData.demolitionRequired,
      existingStructures: formData.existingStructures,
      siteSlope: formData.siteSlope,
      lotShape: formData.lotShape,
      streetFrontage: formData.streetFrontage,
      largeTrees: formData.largeTrees,
      marketTrend: formData.marketTrend,
      supplyLevel: formData.supplyLevel,
      comparableSalesCount: formData.comparableSalesCount,
      avgDaysOnMarket: formData.avgDaysOnMarket,
    },
    report: {
      companyName: formData.companyName,
      contactPerson: formData.contactPerson,
      email: formData.email,
      phone: formData.phone,
      reportTitle: formData.reportTitle,
      additionalNotes: formData.additionalNotes,
    },
  };

  const response = await request('/reports/generate', {
    method: 'POST',
    body: JSON.stringify(body),
  });

  return response.data;
}

/**
 * Look up a property address via OSM geocoding + terrain analysis.
 * Returns geocoded location, lot dimensions, terrain data, and estimated R-Code.
 */
export async function lookupProperty(address) {
  const response = await request('/property/lookup', {
    method: 'POST',
    body: JSON.stringify({ address }),
  });

  return response;
}

/**
 * Generate mixed dwelling scenarios for a property.
 * Returns ranked scenarios with cost analysis.
 */
export async function generateScenarios(params) {
  const { property, financial, marketData } = params;

  const response = await request('/reports/generate/scenarios', {
    method: 'POST',
    body: JSON.stringify({ property, financial, marketData }),
  });

  return response.data;
}
