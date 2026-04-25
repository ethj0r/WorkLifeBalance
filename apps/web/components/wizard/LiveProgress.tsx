import { Check, Loader2 } from "lucide-react";

export function LiveProgress({ stage }: { stage: number }) {
  const stages = [
    ["Plot Registered", "Polygon disimpan · 1,8 ha"],
    ["Satellite Imagery — Sentinel-2", "NDVI: 0,68 · High Density"],
    ["Photo AI Analysis", "32 pohon terdeteksi"],
    ["Cross-Validation", "Satelit dan foto cocok"],
    ["Carbon Stock Estimation", "Estimasi IPCC Tier 1 selesai"],
  ];
  return (
    <div className="rounded-xl border border-[rgba(15,23,42,.08)] bg-white p-4 shadow-sm">
      {stages.map(([title, detail], i) => {
        const done = i < stage;
        const active = i === stage;
        return (
          <div key={title} className="flex gap-3 py-2">
            <div className={`grid h-6 w-6 flex-none place-items-center rounded-full text-xs font-bold ${done ? "bg-green-100 text-green-700" : active ? "bg-green-700 text-white" : "bg-ink-50 text-ink-400"}`}>
              {done ? <Check className="h-3.5 w-3.5" /> : active ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : i + 1}
            </div>
            <div>
              <div className={`text-sm font-semibold ${active ? "text-green-700" : done ? "text-ink-900" : "text-ink-500"}`}>{title}</div>
              {(done || active) && <div className="mt-0.5 text-[13px] text-ink-500">{detail}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
