import { assessRisks } from '../../../src/engines/riskEngine.js';

class RiskService {
  assess(params) {
    return assessRisks(params);
  }
}

export default new RiskService();
