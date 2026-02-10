import { MapPin, Ruler, Grid3x3 } from 'lucide-react';
import { getAllRCodes, getRCodeRules } from '../engines/rCodesEngine';

export default function Step1PropertyDetails({ data, onChange }) {
  const rCodes = getAllRCodes();

  const update = (field, value) => {
    onChange({ ...data, [field]: value });
  };

  const selectedRules = data.rCode ? getRCodeRules(data.rCode) : null;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <MapPin className="text-emerald-600" size={22} />
          Property Details
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Enter the target property information for feasibility analysis.
        </p>
      </div>

      {/* Address */}
      <div className="card space-y-4">
        <h3 className="font-semibold text-slate-800">Location</h3>
        <div>
          <label className="input-label">Street Address</label>
          <input
            type="text"
            className="input-field"
            placeholder="e.g. 123 Example Street, Morley WA 6062"
            value={data.address || ''}
            onChange={e => update('address', e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="input-label">Suburb</label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Morley"
              value={data.suburb || ''}
              onChange={e => update('suburb', e.target.value)}
            />
          </div>
          <div>
            <label className="input-label">Postcode</label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. 6062"
              value={data.postcode || ''}
              onChange={e => update('postcode', e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="input-label">Lot / Plan Number (optional)</label>
          <input
            type="text"
            className="input-field"
            placeholder="e.g. Lot 42 on Plan 12345"
            value={data.lotPlan || ''}
            onChange={e => update('lotPlan', e.target.value)}
          />
        </div>
      </div>

      {/* Site dimensions */}
      <div className="card space-y-4">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
          <Ruler size={18} className="text-slate-500" />
          Site Dimensions
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="input-label">Lot Area (sqm)</label>
            <input
              type="number"
              className="input-field"
              placeholder="e.g. 800"
              value={data.lotArea || ''}
              onChange={e => update('lotArea', parseFloat(e.target.value) || '')}
            />
          </div>
          <div>
            <label className="input-label">Lot Width (m)</label>
            <input
              type="number"
              className="input-field"
              placeholder="e.g. 20"
              value={data.lotWidth || ''}
              onChange={e => update('lotWidth', parseFloat(e.target.value) || '')}
            />
          </div>
          <div>
            <label className="input-label">Lot Depth (m)</label>
            <input
              type="number"
              className="input-field"
              placeholder="e.g. 40"
              value={data.lotDepth || ''}
              onChange={e => update('lotDepth', parseFloat(e.target.value) || '')}
            />
          </div>
        </div>
      </div>

      {/* Zoning */}
      <div className="card space-y-4">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
          <Grid3x3 size={18} className="text-slate-500" />
          Zoning Classification
        </h3>
        <div>
          <label className="input-label">R-Code</label>
          <div className="grid grid-cols-5 gap-2">
            {rCodes.map(code => (
              <button
                key={code}
                type="button"
                onClick={() => update('rCode', code)}
                className={`rounded-lg border-2 px-4 py-3 text-center text-sm font-bold transition-all ${
                  data.rCode === code
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                {code}
              </button>
            ))}
          </div>
        </div>
        {selectedRules && (
          <div className="mt-3 rounded-lg bg-emerald-50 p-4">
            <p className="text-sm font-semibold text-emerald-800">
              {selectedRules.label} — {selectedRules.typicalDensity} Density
            </p>
            <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-emerald-700">
              <span>Min lot size: {selectedRules.minLotSize} sqm</span>
              <span>Max plot ratio: {(selectedRules.maxPlotRatio * 100)}%</span>
              <span>Max stories: {selectedRules.maxStories}</span>
              <span>Site coverage: {Math.round(selectedRules.maxSiteCoverage * 100)}%</span>
              <span>Open space: ≥{(selectedRules.minOpenSpace * 100)}%</span>
              <span>Front setback: {selectedRules.setbacks.primaryStreet}m</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
