import { FileText, Building } from 'lucide-react';

export default function Step4ReportPreferences({ data, onChange }) {
  const update = (field, value) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <FileText className="text-emerald-600" size={22} />
          Report Preferences
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Customize your report branding and details.
        </p>
      </div>

      {/* Company Branding */}
      <div className="card space-y-4">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
          <Building size={18} className="text-slate-500" />
          Company Branding
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="input-label">Company Name</label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Perth Property Developments Pty Ltd"
              value={data.companyName || ''}
              onChange={e => update('companyName', e.target.value)}
            />
          </div>
          <div>
            <label className="input-label">Contact Person</label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. John Smith"
              value={data.contactPerson || ''}
              onChange={e => update('contactPerson', e.target.value)}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="input-label">Email</label>
            <input
              type="email"
              className="input-field"
              placeholder="e.g. john@example.com"
              value={data.email || ''}
              onChange={e => update('email', e.target.value)}
            />
          </div>
          <div>
            <label className="input-label">Phone</label>
            <input
              type="tel"
              className="input-field"
              placeholder="e.g. 0412 345 678"
              value={data.phone || ''}
              onChange={e => update('phone', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Report Details */}
      <div className="card space-y-4">
        <h3 className="font-semibold text-slate-800">Report Details</h3>
        <div>
          <label className="input-label">Report Title / Reference</label>
          <input
            type="text"
            className="input-field"
            placeholder="e.g. Feasibility Assessment — 123 Example St, Morley"
            value={data.reportTitle || ''}
            onChange={e => update('reportTitle', e.target.value)}
          />
          <p className="mt-1 text-xs text-slate-400">
            Auto-generated from address if left blank
          </p>
        </div>
        <div>
          <label className="input-label">Additional Notes</label>
          <textarea
            className="input-field min-h-[80px] resize-y"
            placeholder="Any additional context for this feasibility assessment..."
            value={data.additionalNotes || ''}
            onChange={e => update('additionalNotes', e.target.value)}
          />
        </div>
      </div>

      {/* Summary Preview */}
      <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50 p-6">
        <h3 className="font-bold text-emerald-900">Ready to Generate Report</h3>
        <p className="mt-2 text-sm text-emerald-700">
          Click "Generate Report" below to run the full feasibility analysis. The system will:
        </p>
        <ul className="mt-3 space-y-1 text-sm text-emerald-700">
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Calculate R-Code compliance and development yield
          </li>
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Estimate all development costs and revenue
          </li>
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Run sensitivity and risk analysis
          </li>
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Generate a professional PDF report
          </li>
        </ul>
      </div>
    </div>
  );
}
