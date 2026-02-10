export function validateReportRequest(req, res, next) {
  const { property, financial } = req.body;
  const errors = [];

  if (!property) {
    errors.push('property object is required');
  } else {
    if (!property.lotArea) errors.push('property.lotArea is required');
    if (!property.lotWidth) errors.push('property.lotWidth is required');
    if (!property.lotDepth) errors.push('property.lotDepth is required');
    if (!property.rCode) errors.push('property.rCode is required');
  }

  if (!financial) {
    errors.push('financial object is required');
  } else {
    if (!financial.landCost) errors.push('financial.landCost is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: errors,
      },
    });
  }

  next();
}
