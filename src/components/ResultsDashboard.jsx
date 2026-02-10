import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  TrendingUp, TrendingDown, DollarSign, Home, AlertTriangle,
  CheckCircle2, XCircle, AlertCircle, Download, RotateCcw,
  Building2, ChevronDown, ChevronUp,
} from 'lucide-react';
import { formatCurrency, formatPercent, formatNumber, formatSqm } from '../utils/format';
import { useState } from 'react';

const PIE_COLORS = [
  '#059669', '#0891b2', '#7c3aed', '#db2777', '#ea580c',
  '#ca8a04', '#4f46e5', '#dc2626', '#16a34a',
];

function MetricCard({ label, value, sub, color = 'slate', icon: Icon }) {
  const colorMap = {
    green: 'border-emerald-200 bg-emerald-50',
    red: 'border-red-200 bg-red-50',
    amber: 'border-amber-200 bg-amber-50',
    blue: 'border-blue-200 bg-blue-50',
    slate: 'border-slate-200 bg-white',
  };
  const textMap = {
    green: 'text-emerald-700',
    red: 'text-red-700',
    amber: 'text-amber-700',
    blue: 'text-blue-700',
    slate: 'text-slate-900',
  };

  return (
    <div className={`rounded-xl border-2 p-5 ${colorMap[color]}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</span>
        {Icon && <Icon size={18} className={textMap[color]} />}
      </div>
      <div className={`mt-2 text-2xl font-bold ${textMap[color]}`}>{value}</div>
      {sub && <div className="mt-1 text-xs text-slate-500">{sub}</div>}
    </div>
  );
}

function Section({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="card">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between text-left"
      >
        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
        {open ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>
      {open && <div className="mt-4">{children}</div>}
    </div>
  );
}

function CostRow({ label, amount, indent = false, bold = false }) {
  return (
    <div className={`flex items-center justify-between py-1.5 ${bold ? 'font-bold text-slate-900 border-t border-slate-200 pt-3' : indent ? 'text-slate-600 pl-4' : 'text-slate-700'}`}>
      <span className={`text-sm ${bold ? 'font-bold' : ''}`}>{label}</span>
      <span className={`text-sm tabular-nums ${bold ? 'font-bold' : ''}`}>{formatCurrency(amount)}</span>
    </div>
  );
}

function RiskBadge({ level }) {
  const map = {
    high: 'bg-red-100 text-red-700 border-red-200',
    medium: 'bg-amber-100 text-amber-700 border-amber-200',
    low: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${map[level]}`}>
      {level}
    </span>
  );
}

export default function ResultsDashboard({ results, onGeneratePDF, onReset }) {
  const { feasibility, yieldResult, compliance, riskAssessment } = results;
  const { revenue, costs, profitability, breakeven, sensitivity, metadata } = feasibility;

  const marginColor = profitability.profitMargin >= 0.20 ? 'green' : profitability.profitMargin >= 0.10 ? 'amber' : 'red';
  const rocColor = profitability.returnOnCost >= 0.15 ? 'green' : profitability.returnOnCost >= 0.10 ? 'amber' : 'red';

  // Cost breakdown for pie chart
  const costPieData = [
    { name: 'Land & Acq.', value: costs.land.total },
    { name: 'Site Prep', value: costs.sitePrep.total },
    { name: 'Construction', value: costs.construction.total },
    { name: 'Services', value: costs.services.total },
    { name: 'Infrastructure', value: costs.infrastructure.total },
    { name: 'Professional', value: costs.professional.total },
    { name: 'Statutory', value: costs.statutory.total },
    { name: 'Finance', value: costs.finance.total },
    { name: 'Marketing', value: costs.marketing.total },
  ].filter(d => d.value > 0);

  // Sensitivity chart data
  const sensitivityData = [-10, -5, 0, 5, 10].map((v, i) => ({
    name: `${v >= 0 ? '+' : ''}${v}%`,
    Sales: parseFloat((sensitivity.sales[i].margin * 100).toFixed(1)),
    Construction: parseFloat((sensitivity.construction[i].margin * 100).toFixed(1)),
    Land: parseFloat((sensitivity.land[i].margin * 100).toFixed(1)),
  }));

  const recIcon = riskAssessment.recommendationLevel === 'green'
    ? <CheckCircle2 className="text-emerald-600" size={28} />
    : riskAssessment.recommendationLevel === 'amber'
      ? <AlertCircle className="text-amber-600" size={28} />
      : <XCircle className="text-red-600" size={28} />;

  const recBg = riskAssessment.recommendationLevel === 'green'
    ? 'border-emerald-300 bg-emerald-50'
    : riskAssessment.recommendationLevel === 'amber'
      ? 'border-amber-300 bg-amber-50'
      : 'border-red-300 bg-red-50';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Feasibility Analysis Results</h2>
          <p className="text-sm text-slate-500">{metadata.numDwellings} dwellings | {formatSqm(metadata.totalGFA)} GFA | {metadata.constructionQuality} quality</p>
        </div>
        <div className="flex gap-3">
          <button onClick={onReset} className="btn-secondary">
            <RotateCcw size={16} />
            New Analysis
          </button>
          <button onClick={onGeneratePDF} className="btn-primary">
            <Download size={16} />
            Download PDF Report
          </button>
        </div>
      </div>

      {/* Recommendation Banner */}
      <div className={`rounded-xl border-2 p-5 ${recBg}`}>
        <div className="flex items-start gap-4">
          {recIcon}
          <div>
            <h3 className="font-bold text-lg text-slate-900">
              {riskAssessment.recommendationLevel === 'green' ? 'Recommended' : riskAssessment.recommendationLevel === 'amber' ? 'Proceed with Caution' : 'Not Recommended'}
            </h3>
            <p className="mt-1 text-sm text-slate-700">{riskAssessment.recommendation}</p>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="Gross Realisation Value"
          value={formatCurrency(revenue.totalGRV)}
          sub={`${metadata.numDwellings} dwellings`}
          color="blue"
          icon={DollarSign}
        />
        <MetricCard
          label="Total Development Cost"
          value={formatCurrency(costs.totalDevelopmentCost)}
          sub={`${formatCurrency(costs.totalDevelopmentCost / metadata.numDwellings)}/unit`}
          color="slate"
          icon={Building2}
        />
        <MetricCard
          label="Gross Profit"
          value={formatCurrency(profitability.grossProfit)}
          sub={profitability.grossProfit >= 0 ? 'Positive return' : 'Loss projected'}
          color={profitability.grossProfit >= 0 ? 'green' : 'red'}
          icon={profitability.grossProfit >= 0 ? TrendingUp : TrendingDown}
        />
        <MetricCard
          label="Profit Margin"
          value={formatPercent(profitability.profitMargin)}
          sub={`Target: ${formatPercent(breakeven.targetMargin)}`}
          color={marginColor}
          icon={TrendingUp}
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-3 gap-4">
        <MetricCard
          label="Return on Cost"
          value={formatPercent(profitability.returnOnCost)}
          color={rocColor}
        />
        <MetricCard
          label="Return on Equity"
          value={formatPercent(profitability.returnOnEquity)}
          sub={`${formatPercent(1 - metadata.debtRatio, 0)} equity contribution`}
        />
        <MetricCard
          label="Breakeven / Unit"
          value={formatCurrency(breakeven.breakEvenPricePerUnit)}
          sub="Min sale price to cover costs"
        />
      </div>

      {/* Development Yield */}
      <Section title="Development Yield">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left">
                  <th className="pb-2 font-semibold text-slate-600">Type</th>
                  <th className="pb-2 font-semibold text-slate-600 text-right">Qty</th>
                  <th className="pb-2 font-semibold text-slate-600 text-right">Avg Size</th>
                  <th className="pb-2 font-semibold text-slate-600 text-right">Total GFA</th>
                </tr>
              </thead>
              <tbody>
                {yieldResult.dwellingDetails.map((d, i) => (
                  <tr key={i} className="border-b border-slate-100">
                    <td className="py-2 text-slate-700">{d.type}</td>
                    <td className="py-2 text-right text-slate-900 font-medium">{d.quantity}</td>
                    <td className="py-2 text-right text-slate-700">{formatSqm(d.avgSize)}</td>
                    <td className="py-2 text-right text-slate-900 font-medium">{formatSqm(d.totalGFA)}</td>
                  </tr>
                ))}
                <tr className="font-bold">
                  <td className="pt-2 text-slate-900">Total</td>
                  <td className="pt-2 text-right text-slate-900">{metadata.numDwellings}</td>
                  <td></td>
                  <td className="pt-2 text-right text-slate-900">{formatSqm(metadata.totalGFA)}</td>
                </tr>
              </tbody>
            </table>

            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Parking Bays</span>
                <span className="font-medium">{yieldResult.parking?.totalBays || 'N/A'} ({yieldResult.parking?.residentBays} resident + {yieldResult.parking?.visitorBays} visitor)</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Plot Ratio</span>
                <span className="font-medium">{formatPercent(yieldResult.plotRatio)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Open Space</span>
                <span className="font-medium">{formatPercent(yieldResult.openSpaceRatio)}</span>
              </div>
            </div>
          </div>
          <div className="rounded-lg bg-slate-50 p-4">
            <h4 className="text-sm font-semibold text-slate-700 mb-2">Site Layout Concept</h4>
            <p className="text-sm text-slate-600 leading-relaxed">{yieldResult.layoutDescription}</p>
          </div>
        </div>
      </Section>

      {/* R-Code Compliance */}
      <Section title="Planning Compliance">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left">
              <th className="pb-2 font-semibold text-slate-600">Requirement</th>
              <th className="pb-2 font-semibold text-slate-600 text-right">Allowed</th>
              <th className="pb-2 font-semibold text-slate-600 text-right">Proposed</th>
              <th className="pb-2 font-semibold text-slate-600 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {compliance.checks.map((c, i) => (
              <tr key={i} className="border-b border-slate-100">
                <td className="py-2 text-slate-700">{c.name}</td>
                <td className="py-2 text-right text-slate-600">{c.allowed}</td>
                <td className="py-2 text-right text-slate-900 font-medium">{c.proposed}</td>
                <td className="py-2 text-center">
                  {c.compliant
                    ? <CheckCircle2 size={18} className="inline text-emerald-500" />
                    : <XCircle size={18} className="inline text-red-500" />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      {/* Revenue */}
      <Section title="Revenue Breakdown">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left">
              <th className="pb-2 font-semibold text-slate-600">Type</th>
              <th className="pb-2 font-semibold text-slate-600 text-right">Qty</th>
              <th className="pb-2 font-semibold text-slate-600 text-right">Price Each</th>
              <th className="pb-2 font-semibold text-slate-600 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {revenue.byType.map((r, i) => (
              <tr key={i} className="border-b border-slate-100">
                <td className="py-2 text-slate-700">{r.type}</td>
                <td className="py-2 text-right">{r.quantity}</td>
                <td className="py-2 text-right">{formatCurrency(r.priceEach)}</td>
                <td className="py-2 text-right font-medium">{formatCurrency(r.total)}</td>
              </tr>
            ))}
            <tr className="font-bold border-t-2 border-slate-300">
              <td className="pt-3" colSpan="3">Total Gross Realisation Value</td>
              <td className="pt-3 text-right">{formatCurrency(revenue.totalGRV)}</td>
            </tr>
          </tbody>
        </table>
      </Section>

      {/* Cost Breakdown */}
      <Section title="Cost Breakdown">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-800 mb-2">Land & Acquisition</h4>
            <CostRow label="Land purchase price" amount={costs.land.purchasePrice} indent />
            <CostRow label="Stamp duty" amount={costs.land.stampDuty} indent />
            <CostRow label="Legal fees" amount={costs.land.legalFees} indent />
            <CostRow label="Subtotal" amount={costs.land.total} bold />

            <h4 className="text-sm font-bold text-slate-800 mt-4 mb-2">Site Preparation</h4>
            <CostRow label="Demolition" amount={costs.sitePrep.demolition} indent />
            <CostRow label="Site clearing" amount={costs.sitePrep.siteClearing} indent />
            <CostRow label="Earthworks" amount={costs.sitePrep.earthworks} indent />
            <CostRow label="Subtotal" amount={costs.sitePrep.total} bold />

            <h4 className="text-sm font-bold text-slate-800 mt-4 mb-2">Construction</h4>
            <CostRow label={`Building (${metadata.numDwellings} units @ $${formatNumber(costs.construction.ratePerSqm)}/sqm)`} amount={costs.construction.buildingCosts} indent />
            <CostRow label="Design contingency (4%)" amount={costs.construction.designContingency} indent />
            <CostRow label="Construction contingency (7%)" amount={costs.construction.constructionContingency} indent />
            <CostRow label="Subtotal" amount={costs.construction.total} bold />

            <h4 className="text-sm font-bold text-slate-800 mt-4 mb-2">Services Connection</h4>
            <CostRow label="Water" amount={costs.services.water} indent />
            <CostRow label="Sewer" amount={costs.services.sewer} indent />
            <CostRow label="Power" amount={costs.services.power} indent />
            <CostRow label="Gas" amount={costs.services.gas} indent />
            <CostRow label="NBN" amount={costs.services.nbn} indent />
            <CostRow label="Subtotal" amount={costs.services.total} bold />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-800 mb-2">Infrastructure</h4>
            <CostRow label="Driveway/crossover" amount={costs.infrastructure.driveway} indent />
            <CostRow label="Access roads" amount={costs.infrastructure.accessRoads} indent />
            <CostRow label="Landscaping" amount={costs.infrastructure.landscaping} indent />
            <CostRow label="Fencing" amount={costs.infrastructure.fencing} indent />
            <CostRow label="Stormwater" amount={costs.infrastructure.stormwater} indent />
            <CostRow label="Subtotal" amount={costs.infrastructure.total} bold />

            <h4 className="text-sm font-bold text-slate-800 mt-4 mb-2">Professional Fees</h4>
            <CostRow label="Architect/designer" amount={costs.professional.architect} indent />
            <CostRow label="Engineer" amount={costs.professional.engineer} indent />
            <CostRow label="Geotech report" amount={costs.professional.geoReport} indent />
            <CostRow label="Surveyor" amount={costs.professional.surveyor} indent />
            <CostRow label="Town planner" amount={costs.professional.townPlanner} indent />
            <CostRow label="Building permit fees" amount={costs.professional.buildingPermit} indent />
            <CostRow label="Subtotal" amount={costs.professional.total} bold />

            <h4 className="text-sm font-bold text-slate-800 mt-4 mb-2">Statutory Fees</h4>
            <CostRow label="Development application" amount={costs.statutory.devApplication} indent />
            <CostRow label="Building permits" amount={costs.statutory.buildingPermits} indent />
            <CostRow label="Water Corporation" amount={costs.statutory.waterCorp} indent />
            <CostRow label="Western Power" amount={costs.statutory.westernPower} indent />
            <CostRow label="Subtotal" amount={costs.statutory.total} bold />

            <h4 className="text-sm font-bold text-slate-800 mt-4 mb-2">Finance</h4>
            <CostRow label="Establishment fees" amount={costs.finance.establishment} indent />
            <CostRow label="Interest during construction" amount={costs.finance.interest} indent />
            <CostRow label="Subtotal" amount={costs.finance.total} bold />

            <h4 className="text-sm font-bold text-slate-800 mt-4 mb-2">Marketing & Sales</h4>
            <CostRow label="Agent commission (2.5%)" amount={costs.marketing.agentCommission} indent />
            <CostRow label="Marketing campaign" amount={costs.marketing.campaign} indent />
            <CostRow label="Sales office/signage" amount={costs.marketing.salesOffice} indent />
            <CostRow label="Subtotal" amount={costs.marketing.total} bold />
          </div>
        </div>
        <div className="mt-6 rounded-lg bg-slate-900 p-4 text-white">
          <div className="flex items-center justify-between text-lg font-bold">
            <span>TOTAL DEVELOPMENT COST</span>
            <span>{formatCurrency(costs.totalDevelopmentCost)}</span>
          </div>
        </div>
      </Section>

      {/* Cost Pie Chart */}
      <Section title="Cost Distribution">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={costPieData}
                cx="50%"
                cy="50%"
                outerRadius={120}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {costPieData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Section>

      {/* Sensitivity */}
      <Section title="Sensitivity Analysis">
        <div className="mb-4">
          <p className="text-sm text-slate-600">
            Most sensitive to: <strong className="text-slate-900">{sensitivity.mostSensitive}</strong>
          </p>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sensitivityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} unit="%" />
              <Tooltip formatter={(value) => `${value}%`} />
              <Legend />
              <Bar dataKey="Sales" fill="#059669" name="Sales Price" />
              <Bar dataKey="Construction" fill="#7c3aed" name="Construction Cost" />
              <Bar dataKey="Land" fill="#db2777" name="Land Cost" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-6">
          <h4 className="text-sm font-bold text-slate-800 mb-3">Timeline Scenarios</h4>
          <div className="grid grid-cols-4 gap-3">
            {sensitivity.timeline.map((s, i) => (
              <div key={i} className={`rounded-lg border p-3 text-center ${i === 1 ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200'}`}>
                <div className="text-xs text-slate-500">{s.label}</div>
                <div className="mt-1 text-lg font-bold text-slate-900">{formatPercent(s.margin)}</div>
                <div className="text-xs text-slate-400">margin</div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Risk Assessment */}
      <Section title="Risk Assessment">
        <div className="flex gap-4 mb-6">
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-center">
            <div className="text-2xl font-bold text-red-700">{riskAssessment.summary.high}</div>
            <div className="text-xs text-red-600">High Risk</div>
          </div>
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-2 text-center">
            <div className="text-2xl font-bold text-amber-700">{riskAssessment.summary.medium}</div>
            <div className="text-xs text-amber-600">Medium Risk</div>
          </div>
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-2 text-center">
            <div className="text-2xl font-bold text-emerald-700">{riskAssessment.summary.low}</div>
            <div className="text-xs text-emerald-600">Low Risk</div>
          </div>
        </div>

        {['Regulatory', 'Market', 'Planning', 'Financial'].map(cat => {
          const catRisks = riskAssessment.risks.filter(r => r.category === cat);
          if (catRisks.length === 0) return null;
          return (
            <div key={cat} className="mb-4">
              <h4 className="text-sm font-bold text-slate-800 mb-2">{cat} Risks</h4>
              <div className="space-y-2">
                {catRisks.map((r, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-lg border border-slate-100 p-3">
                    <RiskBadge level={r.level} />
                    <div>
                      <div className="text-sm font-medium text-slate-800">{r.title}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{r.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </Section>

      {/* Breakeven */}
      <Section title="Breakeven Analysis">
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg bg-slate-50 p-4 text-center">
            <div className="text-xs text-slate-500">Required GRV for {formatPercent(breakeven.targetMargin, 0)} margin</div>
            <div className="mt-1 text-xl font-bold text-slate-900">{formatCurrency(breakeven.requiredGRVForTarget)}</div>
          </div>
          <div className="rounded-lg bg-slate-50 p-4 text-center">
            <div className="text-xs text-slate-500">Current GRV Shortfall</div>
            <div className={`mt-1 text-xl font-bold ${breakeven.grvShortfall > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
              {breakeven.grvShortfall > 0 ? formatCurrency(breakeven.grvShortfall) : 'None — target exceeded'}
            </div>
          </div>
          <div className="rounded-lg bg-slate-50 p-4 text-center">
            <div className="text-xs text-slate-500">Breakeven Price / Unit</div>
            <div className="mt-1 text-xl font-bold text-slate-900">{formatCurrency(breakeven.breakEvenPricePerUnit)}</div>
          </div>
        </div>
      </Section>

      {/* Download */}
      <div className="flex justify-center gap-4 pt-4 pb-8">
        <button onClick={onReset} className="btn-secondary">
          <RotateCcw size={16} />
          Start New Analysis
        </button>
        <button onClick={onGeneratePDF} className="btn-primary text-lg px-8 py-3">
          <Download size={20} />
          Download Full PDF Report
        </button>
      </div>
    </div>
  );
}
