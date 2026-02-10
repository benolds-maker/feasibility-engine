import {
  calculateFeasibility,
  CONSTRUCTION_QUALITY,
  DEFAULT_MARKET_PRICES,
  calculateStampDuty,
} from '../../../src/engines/financialEngine.js';

class FinancialService {
  calculate(params) {
    return calculateFeasibility(params);
  }

  getConstructionQuality() {
    return CONSTRUCTION_QUALITY;
  }

  getDefaultMarketPrices() {
    return DEFAULT_MARKET_PRICES;
  }

  calculateStampDuty(value) {
    return calculateStampDuty(value);
  }
}

export default new FinancialService();
