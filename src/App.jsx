import { useState, useCallback } from 'react';
import { Building2, ChevronLeft, ChevronRight, Loader2, AlertTriangle } from 'lucide-react';
import WizardProgress from './components/WizardProgress';
import Step1PropertyDetails from './components/Step1PropertyDetails';
import Step2FinancialInputs from './components/Step2FinancialInputs';
import Step3SiteContext from './components/Step3SiteContext';
import Step4ReportPreferences from './components/Step4ReportPreferences';
import ResultsDashboard from './components/ResultsDashboard';
import { generatePDF } from './engines/pdfGenerator';
import { generateReport, ApiError } from './services/api';

const DEFAULT_FORM = {
  // Step 1
  address: '',
  suburb: '',
  postcode: '',
  lotPlan: '',
  lotArea: '',
  lotWidth: '',
  lotDepth: '',
  rCode: 'R30',
  // Step 2
  landCost: '',
  targetMargin: 20,
  constructionQuality: 'standard',
  debtRatio: 70,
  interestRate: 7.5,
  timelineMonths: 18,
  price_2bed: '',
  price_3bed: '',
  price_4bed: '',
  // Step 3
  heritageOverlay: false,
  bushfireProne: false,
  floodRisk: false,
  contaminatedSite: false,
  treePO: false,
  acidSulfateSoils: false,
  demolitionRequired: false,
  existingStructures: 1,
  siteSlope: 'flat',
  lotShape: 'regular',
  streetFrontage: 'adequate',
  largeTrees: false,
  marketTrend: 'stable',
  supplyLevel: 'normal',
  comparableSalesCount: 10,
  avgDaysOnMarket: 30,
  // Step 4
  companyName: '',
  contactPerson: '',
  email: '',
  phone: '',
  reportTitle: '',
  additionalNotes: '',
};

function App() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const canProceedStep1 = formData.lotArea && formData.lotWidth && formData.lotDepth && formData.rCode;
  const canProceedStep2 = formData.landCost;

  const runAnalysis = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await generateReport(formData);
      setResults(data);
    } catch (err) {
      console.error('Analysis error:', err);
      if (err instanceof ApiError) {
        setError(err.message);
      } else if (err.message === 'Failed to fetch') {
        setError('Unable to connect to the server. Please ensure the backend is running.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [formData]);

  const handleGeneratePDF = useCallback(() => {
    if (!results) return;
    try {
      generatePDF(results, formData);
    } catch (err) {
      console.error('PDF generation error:', err);
      alert('An error occurred generating the PDF. Please try again.');
    }
  }, [results, formData]);

  const handleReset = () => {
    setResults(null);
    setError(null);
    setStep(1);
    setFormData(DEFAULT_FORM);
  };

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center max-w-md">
          <AlertTriangle className="mx-auto h-12 w-12 text-amber-500" />
          <h2 className="mt-4 text-xl font-bold text-slate-900">Analysis Failed</h2>
          <p className="mt-2 text-sm text-slate-600">{error}</p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <button onClick={() => { setError(null); setStep(4); }} className="btn-secondary">
              <ChevronLeft size={18} />
              Back
            </button>
            <button onClick={runAnalysis} className="btn-primary">
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-emerald-600" />
          <h2 className="mt-4 text-xl font-bold text-slate-900">Generating Feasibility Analysis</h2>
          <p className="mt-2 text-sm text-slate-500">Calculating yield, costs, and risk assessment...</p>
        </div>
      </div>
    );
  }

  if (results) {
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-5xl items-center gap-3 px-6 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600">
              <Building2 className="text-white" size={22} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">Feasibility Engine</h1>
              <p className="text-xs text-slate-500">Perth Property Development Analysis</p>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-6 py-8">
          <ResultsDashboard
            results={results}
            onGeneratePDF={handleGeneratePDF}
            onReset={handleReset}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-6 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600">
            <Building2 className="text-white" size={22} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Feasibility Engine</h1>
            <p className="text-xs text-slate-500">Perth Property Development Analysis</p>
          </div>
        </div>
      </header>

      {/* Wizard */}
      <main className="mx-auto max-w-3xl px-6 py-8">
        <WizardProgress currentStep={step} />

        {step === 1 && (
          <Step1PropertyDetails data={formData} onChange={setFormData} />
        )}
        {step === 2 && (
          <Step2FinancialInputs data={formData} onChange={setFormData} />
        )}
        {step === 3 && (
          <Step3SiteContext data={formData} onChange={setFormData} />
        )}
        {step === 4 && (
          <Step4ReportPreferences data={formData} onChange={setFormData} />
        )}

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-between">
          {step > 1 ? (
            <button onClick={() => setStep(s => s - 1)} className="btn-secondary">
              <ChevronLeft size={18} />
              Back
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={(step === 1 && !canProceedStep1) || (step === 2 && !canProceedStep2)}
              className="btn-primary"
            >
              Next
              <ChevronRight size={18} />
            </button>
          ) : (
            <button onClick={runAnalysis} className="btn-primary text-base px-8 py-3">
              Generate Report
            </button>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
