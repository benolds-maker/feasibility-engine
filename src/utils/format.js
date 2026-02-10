export function formatCurrency(value) {
  if (value == null || isNaN(value)) return '$0';
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPercent(value, decimals = 1) {
  if (value == null || isNaN(value)) return '0%';
  return `${(value * 100).toFixed(decimals)}%`;
}

export function formatNumber(value, decimals = 0) {
  if (value == null || isNaN(value)) return '0';
  return new Intl.NumberFormat('en-AU', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatSqm(value) {
  return `${formatNumber(value)} sqm`;
}
