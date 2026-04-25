import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

export function Field({ label, hint, error, children }: { label?: string; hint?: string; error?: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      {label && <span className="text-[13px] font-semibold text-ink-700">{label}</span>}
      {children}
      {error ? <span className="text-xs text-[#B23B3B]">{error}</span> : hint ? <span className="text-xs text-ink-500">{hint}</span> : null}
    </label>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`focus-ring w-full rounded-lg border border-ink-200 bg-white px-3.5 py-2.5 text-[15px] text-ink-900 outline-none ${props.className ?? ""}`} />;
}

export function SelectInput(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`focus-ring w-full rounded-lg border border-ink-200 bg-white px-3.5 py-2.5 text-[15px] text-ink-900 outline-none ${props.className ?? ""}`} />;
}

export function PhoneField({ value, onChange }: { value?: string; onChange?: (value: string) => void }) {
  return (
    <div className="focus-within:shadow-[0_0_0_3px_rgba(47,104,64,.18)] flex overflow-hidden rounded-lg border border-ink-200 bg-white focus-within:border-green-600">
      <span className="border-r border-ink-200 bg-ink-50 px-3 py-2.5 text-sm text-ink-700">+62</span>
      <input value={value ?? ""} onChange={(e) => onChange?.(e.target.value)} placeholder="812 3456 7890" className="min-w-0 flex-1 border-0 bg-transparent px-3 py-2.5 text-[15px] outline-none" />
    </div>
  );
}
