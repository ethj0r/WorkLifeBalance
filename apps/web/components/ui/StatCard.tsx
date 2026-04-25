import { Card } from "./Card";

export function StatCard({ label, value, sub, dark = false }: { label: string; value: string; sub?: string; dark?: boolean }) {
  return (
    <Card className={dark ? "border-transparent bg-green-700 text-green-50" : ""}>
      <div className={`eyebrow ${dark ? "!text-green-50/70" : ""}`}>{label}</div>
      <div className={`figure mt-1.5 text-3xl font-medium leading-none ${dark ? "text-green-50" : "text-ink-900"}`}>{value}</div>
      {sub && <div className={`mt-1 text-xs ${dark ? "text-green-50/70" : "text-ink-500"}`}>{sub}</div>}
    </Card>
  );
}
