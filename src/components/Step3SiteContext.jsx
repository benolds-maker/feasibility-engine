import { AlertTriangle, TreePine, Mountain } from 'lucide-react';

export default function Step3SiteContext({ data, onChange }) {
  const update = (field, value) => {
    onChange({ ...data, [field]: value });
  };

  const toggleOverlay = (field) => {
    update(field, !data[field]);
  };

  const overlays = [
    { key: 'heritageOverlay', label: 'Heritage Overlay', icon: '🏛️', desc: 'Heritage-listed building or area' },
    { key: 'bushfireProne', label: 'Bushfire Prone', icon: '🔥', desc: 'Bushfire attack level rating applies' },
    { key: 'floodRisk', label: 'Flood Risk Area', icon: '🌊', desc: 'Within flood-prone mapping' },
    { key: 'contaminatedSite', label: 'Contaminated Site', icon: '☣️', desc: 'On contaminated sites register' },
    { key: 'treePO', label: 'Tree Preservation', icon: '🌳', desc: 'Tree preservation order applies' },
    { key: 'acidSulfateSoils', label: 'Acid Sulfate Soils', icon: '⚗️', desc: 'Acid sulfate soil risk area' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <AlertTriangle className="text-emerald-600" size={22} />
          Site Context
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Identify known constraints and overlays. These affect risk assessment and cost estimates.
        </p>
      </div>

      {/* Planning Overlays */}
      <div className="card space-y-4">
        <h3 className="font-semibold text-slate-800">Planning Overlays</h3>
        <p className="text-sm text-slate-500">Select any that apply to this site.</p>
        <div className="grid grid-cols-2 gap-3">
          {overlays.map(o => (
            <button
              key={o.key}
              type="button"
              onClick={() => toggleOverlay(o.key)}
              className={`flex items-start gap-3 rounded-lg border-2 p-4 text-left transition-all ${
                data[o.key]
                  ? 'border-red-400 bg-red-50'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <span className="text-2xl">{o.icon}</span>
              <div>
                <div className={`font-semibold text-sm ${data[o.key] ? 'text-red-700' : 'text-slate-700'}`}>
                  {o.label}
                </div>
                <div className="text-xs text-slate-500">{o.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Existing Structures */}
      <div className="card space-y-4">
        <h3 className="font-semibold text-slate-800">Existing Structures</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="input-label">Demolition Required?</label>
            <div className="flex gap-3">
              {[
                { value: true, label: 'Yes' },
                { value: false, label: 'No' },
              ].map(opt => (
                <button
                  key={String(opt.value)}
                  type="button"
                  onClick={() => update('demolitionRequired', opt.value)}
                  className={`flex-1 rounded-lg border-2 py-2.5 text-sm font-medium transition-all ${
                    data.demolitionRequired === opt.value
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          {data.demolitionRequired && (
            <div>
              <label className="input-label">Number of Structures</label>
              <input
                type="number"
                min="1"
                className="input-field"
                value={data.existingStructures ?? 1}
                onChange={e => update('existingStructures', parseInt(e.target.value) || 1)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Site Characteristics */}
      <div className="card space-y-4">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
          <Mountain size={18} className="text-slate-500" />
          Site Characteristics
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="input-label">Topography</label>
            <div className="space-y-2">
              {['flat', 'moderate', 'steep'].map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => update('siteSlope', opt)}
                  className={`w-full rounded-lg border-2 py-2 text-sm font-medium capitalize transition-all ${
                    (data.siteSlope || 'flat') === opt
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="input-label">Lot Shape</label>
            <div className="space-y-2">
              {[
                { value: 'regular', label: 'Regular' },
                { value: 'irregular', label: 'Irregular' },
                { value: 'very_irregular', label: 'Very Irregular' },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => update('lotShape', opt.value)}
                  className={`w-full rounded-lg border-2 py-2 text-sm font-medium transition-all ${
                    (data.lotShape || 'regular') === opt.value
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="input-label">Street Frontage</label>
            <div className="space-y-2">
              {[
                { value: 'wide', label: 'Wide (>20m)' },
                { value: 'adequate', label: 'Adequate (12-20m)' },
                { value: 'limited', label: 'Limited (<12m)' },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => update('streetFrontage', opt.value)}
                  className={`w-full rounded-lg border-2 py-2 text-sm font-medium transition-all ${
                    (data.streetFrontage || 'adequate') === opt.value
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              checked={data.largeTrees || false}
              onChange={e => update('largeTrees', e.target.checked)}
            />
            <div>
              <span className="text-sm font-medium text-slate-700">Significant trees on site</span>
              <p className="text-xs text-slate-500">Large trees that may need to be retained or removed</p>
            </div>
          </label>
        </div>
      </div>

      {/* Market Context */}
      <div className="card space-y-4">
        <h3 className="font-semibold text-slate-800">Market Context</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="input-label">Market Trend</label>
            <select
              className="input-field"
              value={data.marketTrend || 'stable'}
              onChange={e => update('marketTrend', e.target.value)}
            >
              <option value="growing">Growing</option>
              <option value="stable">Stable</option>
              <option value="declining">Declining</option>
            </select>
          </div>
          <div>
            <label className="input-label">Supply Level</label>
            <select
              className="input-field"
              value={data.supplyLevel || 'normal'}
              onChange={e => update('supplyLevel', e.target.value)}
            >
              <option value="low">Low (undersupply)</option>
              <option value="normal">Normal</option>
              <option value="high">High (oversupply)</option>
            </select>
          </div>
          <div>
            <label className="input-label">Comparable Sales Count</label>
            <input
              type="number"
              className="input-field"
              placeholder="10"
              value={data.comparableSalesCount ?? 10}
              onChange={e => update('comparableSalesCount', parseInt(e.target.value) || 10)}
            />
          </div>
          <div>
            <label className="input-label">Avg Days on Market</label>
            <input
              type="number"
              className="input-field"
              placeholder="30"
              value={data.avgDaysOnMarket ?? 30}
              onChange={e => update('avgDaysOnMarket', parseInt(e.target.value) || 30)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
