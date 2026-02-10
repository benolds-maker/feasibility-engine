import { optimizeYield, DWELLING_TYPES } from '../../../src/engines/yieldEngine.js';

class YieldService {
  optimize(params) {
    return optimizeYield(params);
  }

  getDwellingTypes() {
    return DWELLING_TYPES;
  }
}

export default new YieldService();
