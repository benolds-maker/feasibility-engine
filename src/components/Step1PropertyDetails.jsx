import { useState } from 'react';
import { MapPin, Ruler, Grid3x3, Search, Loader2, Info, Mountain } from 'lucide-react';
import { getAllRCodes, getRCodeRules } from '../engines/rCodesEngine';
import { lookupProperty } from '../services/api';

export default function Step1PropertyDetails({ data, onChange }) {
  const rCodes = getAllRCodes();
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState(null);

  const update = (field, value) => {
    onChange({ ...data, [field]: value });
  };

  const selectedRules = data.rCode ? getRCodeRules(data.rCode) : null;

  const handleLookup = async () => {
    if (!data.address || data.address.trim().length < 5) {
      setLookupError('Please enter a street address first.');
      return;
    }

    setLookupLoading(true);
    setLookupError(null);

    try {
      const result = await lookupProperty(data.address);

      if (result.success && result.property) {
        const p = result.property;
        onChange({
          ...data,
          suburb: p.suburb || data.suburb,
          postcode: p.postcode || data.postcode,
          lotArea: p.lotArea || data.lotArea,
          lotWidth: p.frontage || data.lotWidth,
          lotDepth: p.depth || data.lotDepth,
          rCode: p.rCode || data.rCode,
          // Store lookup metadata for later use
          terrainAnalysis: result.terrainAnalysis || null,
          propertyLookupData: p,
        });
      } else {
        setLookupError('Address not found. Please check and try again.');
      }
    } catch (err) {
      if (err.message === 'Failed to fetch') {
        setLookupError('Unable to connect to server. Is the backend running?');
      } else {
        setLookupError(err.message || 'Lookup failed. Please try again.');
      }
    } finally {
      setLookupLoading(false);
    }
  };

  const terrain = data.terrainAnalysis;
  const dataQuality = data.propertyLookupData?.dataQuality;

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
          <div className="flex gap-2">
            <input
              type="text"
              className="input-field flex-1"
              placeholder="e.g. 123 Example Street, Morley WA 6062"
              value={data.address || ''}
              onChange={e => update('address', e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleLookup(); } }}
            />
            <button
              type="button"
              onClick={handleLookup}
              disabled={lookupLoading}
              className="inline-flex items-center gap-2 rounded-lg border-2 border-emerald-500 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition-all hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {lookupLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Search size={16} />
              )}
              {lookupLoading ? 'Looking up...' : 'Lookup Address'}
            </button>
          </div>
          {lookupError && (
            <p className="mt-1.5 text-sm text-red-600">{lookupError}</p>
          )}
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

        {/* Data Quality Badge */}
        {dataQuality && (
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              dataQuality === 'GOOD'
                ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                : 'bg-amber-100 text-amber-700 border border-amber-200'
            }`}>
              {dataQuality === 'GOOD' ? 'OSM Data' : 'Estimated'}
            </span>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Info size={12} />
              {dataQuality === 'GOOD'
                ? 'Dimensions from OpenStreetMap — verify with survey'
                : 'Estimated from typical Perth lot — enter actual dimensions if known'}
            </span>
          </div>
        )}
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

      {/* Terrain Summary Card */}
      {terrain && (
        <div className="card space-y-3 border-2 border-sky-200 bg-sky-50/50">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <Mountain size={18} className="text-sky-600" />
            Terrain Analysis
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-lg bg-white p-3 border border-sky-100">
              <div className="text-xs text-slate-500">Category</div>
              <div className="mt-0.5 text-sm font-bold text-slate-900">{terrain.category}</div>
            </div>
            <div className="rounded-lg bg-white p-3 border border-sky-100">
              <div className="text-xs text-slate-500">Total Fall</div>
              <div className="mt-0.5 text-sm font-bold text-slate-900">{terrain.totalFall}m</div>
            </div>
            <div className="rounded-lg bg-white p-3 border border-sky-100">
              <div className="text-xs text-slate-500">Suitability</div>
              <div className={`mt-0.5 text-sm font-bold ${
                terrain.suitability?.rating === 'EXCELLENT' ? 'text-emerald-700' :
                terrain.suitability?.rating === 'GOOD' ? 'text-emerald-600' :
                terrain.suitability?.rating === 'MODERATE' ? 'text-amber-600' :
                'text-red-600'
              }`}>{terrain.suitability?.label}</div>
            </div>
            <div className="rounded-lg bg-white p-3 border border-sky-100">
              <div className="text-xs text-slate-500">Cost Impact</div>
              <div className={`mt-0.5 text-sm font-bold ${
                terrain.terrainCosts?.costImpactPercent > 10 ? 'text-red-600' :
                terrain.terrainCosts?.costImpactPercent > 0 ? 'text-amber-600' :
                'text-emerald-700'
              }`}>+{terrain.terrainCosts?.costImpactPercent || 0}%</div>
            </div>
          </div>
          {terrain.suitability?.description && (
            <p className="text-xs text-slate-600">{terrain.suitability.description}</p>
          )}
        </div>
      )}

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
              <span>Open space: &ge;{(selectedRules.minOpenSpace * 100)}%</span>
              <span>Front setback: {selectedRules.setbacks.primaryStreet}m</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
