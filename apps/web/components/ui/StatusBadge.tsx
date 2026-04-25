import type { PlotStatus } from "@/lib/types";

const map: Record<PlotStatus, { bg: string; fg: string; label: string; dot: string }> = {
  pending: { bg: "#F2E8D4", fg: "#6B5538", label: "Pending", dot: "#6B5538" },
  verifying: { bg: "#DCE9F5", fg: "#2C5A8A", label: "Verifying", dot: "#2C5A8A" },
  verified: { bg: "#C9E2C5", fg: "#234D2E", label: "Verified", dot: "#234D2E" },
  credit_issued: { bg: "#234D2E", fg: "#F1FAF4", label: "Credit Issued", dot: "#6FAF6C" },
};

export function StatusBadge({ status }: { status: PlotStatus }) {
  const s = map[status];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold" style={{ background: s.bg, color: s.fg }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.dot }} />
      {s.label}
    </span>
  );
}
