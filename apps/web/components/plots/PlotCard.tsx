import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { decimalID, formatIDRShort } from "@/lib/format";
import type { Plot } from "@/lib/types";
import { MapPolygon } from "./MapPolygon";
import Link from "next/link";

export function PlotCard({ plot }: { plot: Plot }) {
  return (
    <Link href={`/plots/${plot.id}`}>
      <Card className="h-full rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="font-display text-2xl font-medium tracking-[-.01em] text-ink-900">{plot.name}</div>
            <div className="mt-1 text-sm text-ink-500">{plot.location}</div>
          </div>
          <StatusBadge status={plot.status} />
        </div>
        <div className="mt-4"><MapPolygon polygon={plot.polygon} height={150} /></div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-ink-50 p-3"><div className="eyebrow">Luas</div><div className="figure mt-1 text-[28px] font-medium text-ink-900">{decimalID(plot.area)} ha</div></div>
          <div className="rounded-xl bg-green-50 p-3"><div className="eyebrow">Estimasi/thn</div><div className="figure mt-1 text-[28px] font-medium text-ink-900">{formatIDRShort(plot.annualEarnings)}</div></div>
        </div>
      </Card>
    </Link>
  );
}
