import { Check } from "lucide-react";

export function WizardStepper({ step, labels, vertical = false }: { step: number; labels: string[]; vertical?: boolean }) {
  if (vertical) {
    return (
      <div>
        <div className="mb-4">
          <div className="eyebrow">Progress</div>
          <div className="mt-1 text-sm font-semibold text-ink-700">Langkah {step + 1} dari {labels.length}</div>
        </div>
        <div className="space-y-3">
          {labels.map((label, i) => {
            const done = i < step;
            const active = i === step;
            return (
              <div key={label} className="flex items-center gap-3">
                <span className={`grid h-8 w-8 place-items-center rounded-full text-xs font-bold ${done ? "bg-green-700 text-green-50" : active ? "border-2 border-green-700 bg-green-50 text-green-700" : "border border-ink-200 bg-white text-ink-500"}`}>{done ? <Check className="h-4 w-4" /> : i + 1}</span>
                <span className={`text-sm ${active ? "font-bold text-green-700" : done ? "font-semibold text-ink-800" : "font-medium text-ink-500"}`}>{label}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-xs font-semibold text-ink-500">
        <span>Langkah {step + 1} dari {labels.length}</span>
        <span>{labels[step]}</span>
      </div>
      <div className="flex gap-1.5">
        {labels.map((label, i) => (
          <div key={label} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-green-700" : "bg-ink-100"}`} />
        ))}
      </div>
    </div>
  );
}
