import { DollarSign, TrendingUp, Building2, Loader2, MapPin } from 'lucide-react';
import { CONSTRUCTION_QUALITY, DEFAULT_MARKET_PRICES } from '../engines/financialEngine';
import { formatCurrency } from '../utils/format';

export default function Step2FinancialInputs({ data, onChange }) {
  const update = (field, value) => {
    onChange({ ...data, [field]: value });
  };

  const updatePrice = (field, value) => {
    onChange({ ...data, [field]: value, _pricesSource: 'user' });
  };

  const resetToSuburbPrices = () => {
    if (!data._suburbPrices) return;
    onChange({
      ...data,
      price_2bed: data._suburbPrices.price_2bed,
      price_3bed: data._suburbPrices.price_3bed,
      price_4bed: data._suburbPrices.price_4bed,
      _pricesSource: 'suburb',
    });
  };

  const pricesSource = data._pricesSource || 'default';
  const suburbPrices = data._suburbPrices;
  const suburb = data.suburb;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <DollarSign className="text-emerald-600" size={22} />
          Financial Inputs
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Set your acquisition cost, target returns, and financing assumptions.
        </p>
      </div>

      {/* Land Cost */}
      <div className="card space-y-4">
        <h3 className="font-semibold text-slate-800">Land Acquisition</h3>
        <div>
          <label className="input-label">Land Acquisition Cost ($)</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">$</span>
            <input
              type="number"
              className="input-field pl-8"
              placeholder="e.g. 850000"
              value={data.landCost || ''}
              onChange={e => update('landCost', parseFloat(e.target.value) || '')}
            />
          </div>
        </div>
      </div>

      {/* Target Returns */}
      <div className="card space-y-4">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
          <TrendingUp size={18} className="text-slate-500" />
          Target Returns
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="input-label">Target Profit Margin (%)</label>
            <div className="relative">
              <input
                type="number"
                className="input-field pr-8"
                placeholder="20"
                value={data.targetMargin ?? 20}
                onChange={e => update('targetMargin', parseFloat(e.target.value) || 20)}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">%</span>
            </div>
          </div>
          <div>
            <label className="input-label">Development Timeline (months)</label>
            <input
              type="number"
              className="input-field"
              placeholder="18"
              value={data.timelineMonths ?? 18}
              onChange={e => update('timelineMonths', parseInt(e.target.value) || 18)}
            />
          </div>
        </div>
      </div>

      {/* Construction Quality */}
      <div className="card space-y-4">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
          <Building2 size={18} className="text-slate-500" />
          Construction Quality
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {Object.entries(CONSTRUCTION_QUALITY).map(([key, q]) => (
            <button
              key={key}
              type="button"
              onClick={() => update('constructionQuality', key)}
              className={`rounded-lg border-2 p-4 text-left transition-all ${
                data.constructionQuality === key
                  ? 'border-emerald-500 bg-emerald-50 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="font-bold text-slate-900">{q.label}</div>
              <div className="mt-1 text-xs text-slate-500">
                ${q.rateMin.toLocaleString()} – ${q.rateMax.toLocaleString()} /sqm
              </div>
              <div className="mt-0.5 text-xs font-medium text-emerald-600">
                Mid: ${q.midRate.toLocaleString()}/sqm
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Financing */}
      <div className="card space-y-4">
        <h3 className="font-semibold text-slate-800">Financing Structure</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="input-label">
              Debt Ratio: {data.debtRatio ?? 70}%
            </label>
            <input
              type="range"
              min="0"
              max="90"
              step="5"
              className="w-full accent-emerald-600"
              value={data.debtRatio ?? 70}
              onChange={e => update('debtRatio', parseInt(e.target.value))}
            />
            <div className="flex justify-between text-xs text-slate-400">
              <span>0% (All equity)</span>
              <span>90% (Max leverage)</span>
            </div>
          </div>
          <div>
            <label className="input-label">Interest Rate (%)</label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                className="input-field pr-8"
                placeholder="7.5"
                value={data.interestRate ?? 7.5}
                onChange={e => update('interestRate', parseFloat(e.target.value) || 7.5)}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Market Prices Override */}
      <div className="card space-y-4">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
          Expected Sale Prices
          {pricesSource === 'loading' && (
            <span className="ml-2 inline-flex items-center gap-1 text-xs font-normal text-amber-600">
              <Loader2 size={12} className="animate-spin" />
              Loading prices for {suburb}...
            </span>
          )}
          {pricesSource === 'suburb' && suburbPrices && (
            <span className="ml-2 inline-flex items-center gap-1 text-xs font-normal text-emerald-600">
              <MapPin size={12} />
              Suburb estimate for {suburbPrices.suburb}
            </span>
          )}
          {pricesSource === 'user' && (
            <span className="ml-2 text-xs font-normal text-slate-400">(Custom override)</span>
          )}
          {pricesSource === 'default' && (
            <span className="ml-2 text-xs font-normal text-slate-400">
              {suburb ? '(Optional — Perth-wide defaults)' : '(Optional — defaults shown)'}
            </span>
          )}
        </h3>

        {/* Tier label */}
        {pricesSource === 'suburb' && suburbPrices?.tier && (
          <p className="text-xs text-slate-500 -mt-2">Based on {suburbPrices.tier} suburb pricing tier</p>
        )}

        <div className="grid grid-cols-3 gap-4">
          {[
            { key: '2bed', label: '2-Bedroom' },
            { key: '3bed', label: '3-Bedroom' },
            { key: '4bed', label: '4-Bedroom' },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="input-label">{label}</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">$</span>
                <input
                  type="number"
                  className="input-field pl-8"
                  placeholder={DEFAULT_MARKET_PRICES[key].mid.toLocaleString()}
                  value={data[`price_${key}`] || ''}
                  onChange={e => updatePrice(`price_${key}`, parseFloat(e.target.value) || '')}
                />
              </div>
              <div className="mt-1 text-xs text-slate-400">
                {pricesSource === 'suburb' && suburbPrices
                  ? `Suburb estimate for ${suburbPrices.suburb}`
                  : `Default: ${formatCurrency(DEFAULT_MARKET_PRICES[key].mid)}`}
              </div>
            </div>
          ))}
        </div>

        {/* Reset to suburb estimates */}
        {pricesSource === 'user' && suburbPrices && (
          <button
            type="button"
            onClick={resetToSuburbPrices}
            className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 hover:underline"
          >
            <MapPin size={11} />
            Reset to suburb estimates for {suburbPrices.suburb}
          </button>
        )}
      </div>
    </div>
  );
}
