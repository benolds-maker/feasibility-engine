import {
  getRCodeRules,
  getAllRCodes,
  checkCompliance,
  calculateBuildableArea,
  calculateBuildableEnvelope,
  calculateParkingRequirements,
} from '../../../src/engines/rCodesEngine.js';

class RCodesService {
  getRCodeRules(rCode) {
    return getRCodeRules(rCode);
  }

  getAllRCodes() {
    return getAllRCodes();
  }

  checkCompliance(params) {
    return checkCompliance(params);
  }

  calculateBuildableArea(lotArea, rCode) {
    return calculateBuildableArea(lotArea, rCode);
  }

  calculateBuildableEnvelope(lotWidth, lotDepth, rCode) {
    return calculateBuildableEnvelope(lotWidth, lotDepth, rCode);
  }

  calculateParkingRequirements(numDwellings, rCode) {
    return calculateParkingRequirements(numDwellings, rCode);
  }
}

export default new RCodesService();
