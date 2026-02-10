import { useState } from 'react';
import { Award, TrendingUp, DollarSign, Home, ArrowUpDown } from 'lucide-react';
import { formatCurrency, formatPercent } from '../utils/format';

const SORT_OPTIONS = [
  { key: 'profitMargin', label: 'Profit Margin' },
  { key: 'grossProfit', label: 'Total Profit' },
  { key: 'totalUnits', label: 'Unit Count' },
];

const RISK_COLORS = {
  'LOW': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'MEDIUM': 'bg-amber-100 text-amber-700 border-amber-200',
  'MEDIUM-HIGH': 'bg-orange-100 text-orange-700 border-orange-200',
  'HIGH': 'bg-red-100 text-red-700 border-red-200',
};

export default function ScenarioComparison({ scenarios, onSelectScenario }) {
  const [sortBy, setSortBy] = useState('profitMargin');

  if (!scenarios || scenarios.length === 0) {
    return (
      <div className="card text-center py-8">
        <p className="text-slate-500">No scenarios could be generated for this property.</p>
      </div>
    );
  }

  // Sort scenarios
  const sorted = [...scenarios].sort((a, b) => {
    if (sortBy === 'profitMargin') return b.financials.profitMargin - a.financials.profitMargin;
    if (sortBy === 'grossProfit') return b.financials.grossProfit - a.financials.grossProfit;
    if (sortBy === 'totalUnits') return b.totalUnits - a.totalUnits;
    return 0;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Scenario Comparison</h2>
          <p className="text-sm text-slate-500">{scenarios.length} mixed-dwelling scenarios ranked by feasibility</p>
        </div>
        <div className="flex items-center gap-2">
          <ArrowUpDown size={16} className="text-slate-400" />
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 focus:outline-none"
          >
            {SORT_OPTIONS.map(opt => (
              <option key={opt.key} value={opt.key}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Scenario Cards */}
      <div className="space-y-4">
        {sorted.map((scenario, idx) => {
          const isRecommended = scenario.rank === 1;
          const margin = scenario.financials.profitMargin;
          const marginColor = margin >= 0.20 ? 'text-emerald-700' : margin >= 0.10 ? 'text-amber-700' : 'text-red-700';

          return (
            <div
              key={scenario.name}
              className={`card relative overflow-hidden transition-all hover:shadow-md ${
                isRecommended ? 'border-2 border-emerald-400 ring-1 ring-emerald-100' : ''
              }`}
            >
              {/* Recommended badge */}
              {isRecommended && (
                <div className="absolute top-0 right-0 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg flex items-center gap-1">
                  <Award size={12} />
                  RECOMMENDED
                </div>
              )}

              <div className="flex flex-col md:flex-row md:items-start gap-4">
                {/* Rank number */}
                <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 text-slate-600 font-bold text-lg">
                  {scenario.rank}
                </div>

                {/* Main content */}
                <div className="flex-1 space-y-3">
                  {/* Title row */}
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{scenario.name}</h3>
                      <p className="text-sm text-slate-500 mt-0.5">{scenario.description}</p>
                    </div>
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${
                      RISK_COLORS[scenario.riskLevel] || RISK_COLORS['LOW']
                    }`}>
                      {scenario.riskLevel} risk
                    </span>
                  </div>

                  {/* Mix breakdown chips */}
                  <div className="flex flex-wrap gap-2">
                    {scenario.mixBreakdown.map(item => (
                      <span
                        key={item.type}
                        className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
                      >
                        <Home size={12} />
                        {item.label}: {item.units} units ({item.percentage}%)
                      </span>
                    ))}
                  </div>

                  {/* Key metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="rounded-lg bg-slate-50 p-3">
                      <div className="text-xs text-slate-500 flex items-center gap-1">
                        <Home size={12} />
                        Total Units
                      </div>
                      <div className="mt-0.5 text-lg font-bold text-slate-900">{scenario.totalUnits}</div>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-3">
                      <div className="text-xs text-slate-500 flex items-center gap-1">
                        <DollarSign size={12} />
                        Revenue (GRV)
                      </div>
                      <div className="mt-0.5 text-lg font-bold text-slate-900">{formatCurrency(scenario.financials.grv)}</div>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-3">
                      <div className="text-xs text-slate-500 flex items-center gap-1">
                        <TrendingUp size={12} />
                        Profit Margin
                      </div>
                      <div className={`mt-0.5 text-lg font-bold ${marginColor}`}>
                        {formatPercent(scenario.financials.profitMargin)}
                      </div>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-3">
                      <div className="text-xs text-slate-500 flex items-center gap-1">
                        <DollarSign size={12} />
                        Gross Profit
                      </div>
                      <div className={`mt-0.5 text-lg font-bold ${scenario.financials.grossProfit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                        {formatCurrency(scenario.financials.grossProfit)}
                      </div>
                    </div>
                  </div>

                  {/* Strategy + select */}
                  <div className="flex items-center justify-between pt-1">
                    <p className="text-xs text-slate-400 italic">{scenario.strategy}</p>
                    {onSelectScenario && (
                      <button
                        type="button"
                        onClick={() => onSelectScenario(scenario)}
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-emerald-700"
                      >
                        Select Scenario
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
