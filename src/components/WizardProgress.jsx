import { Check } from 'lucide-react';

const STEPS = [
  { num: 1, label: 'Property Details' },
  { num: 2, label: 'Financial Inputs' },
  { num: 3, label: 'Site Context' },
  { num: 4, label: 'Report Preferences' },
];

export default function WizardProgress({ currentStep }) {
  return (
    <nav className="mb-8">
      <ol className="flex items-center gap-2">
        {STEPS.map((step, i) => {
          const isActive = currentStep === step.num;
          const isComplete = currentStep > step.num;
          return (
            <li key={step.num} className="flex items-center gap-2 flex-1">
              <div className="flex items-center gap-3 flex-1">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                    isComplete
                      ? 'bg-emerald-600 text-white'
                      : isActive
                        ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                        : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {isComplete ? <Check size={18} /> : step.num}
                </div>
                <span
                  className={`text-sm font-medium hidden sm:block ${
                    isActive ? 'text-emerald-700' : isComplete ? 'text-slate-700' : 'text-slate-400'
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`h-0.5 flex-1 min-w-[20px] ${
                    isComplete ? 'bg-emerald-500' : 'bg-slate-200'
                  }`}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
