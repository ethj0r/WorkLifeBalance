'use client';

import Link from 'next/link';
import { MapPolygon } from '@/components/map/MapPolygon';
import { Card, StatusBadge } from '@/components/ui/Card';
import { fmtArea, fmtIDRshort } from '@/lib/utils';
import type { PlotWithDetails } from '@worklifebalance/types';

interface PlotCardProps {
  plot: PlotWithDetails;
  /**
   * Optional polygon string untuk preview (format SVG: "x1,y1 x2,y2...")
   * Kalau tidak ada, akan generate dari polygon_geojson.
   */
  previewPolygon?: string;
}

/**
 * Plot card di homepage list. Klik = navigate ke /plot/[id].
 */
export function PlotCard({ plot, previewPolygon }: PlotCardProps) {
  const polygonStr = previewPolygon || generatePreviewPolygon(plot);

  return (
    <Link href={`/plot/${plot.id}`} className="block no-underline border-0">
      <Card hover onClick={() => {}} className="hover:border-green-200">
        <div className="flex justify-between items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="font-display text-[18px] text-ink-900 font-medium tracking-[-0.01em] truncate">
              {plot.name}
            </div>
            <div className="text-[13px] text-ink-500 mt-0.5 truncate">
              {plot.address || 'Lokasi belum diset'}
            </div>
          </div>
          <StatusBadge status={plot.status} />
        </div>

        <div className="mt-3">
          <MapPolygon
            polygon={polygonStr}
            height={88}
            ndvi={plot.status === 'credit_issued' || plot.status === 'verified'}
          />
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <div>
            <div className="eyebrow">Luas</div>
            <div className="figure text-[20px] text-ink-900 mt-0.5">
              {fmtArea(plot.area_hectares)}
            </div>
          </div>
          <div>
            <div className="eyebrow">Estimasi/thn</div>
            <div className="figure text-[20px] text-ink-900 mt-0.5">
              {plot.annual_earnings_idr > 0
                ? fmtIDRshort(plot.annual_earnings_idr)
                : '—'}
            </div>
          </div>
        </div>

        {plot.ownership_type === 'on_behalf' && plot.land_owner && (
          <div className="mt-3 pt-3 border-t border-[rgba(15,23,42,0.06)] text-xs text-earth-700 flex items-center gap-1.5">
            <span>🤝</span>
            <span className="truncate">
              Lahan milik <b>{plot.land_owner.full_name}</b>
            </span>
          </div>
        )}
      </Card>
    </Link>
  );
}

/**
 * Generate dummy SVG polygon string untuk preview kalau plot belum punya
 * polygon_geojson yang valid.
 */
function generatePreviewPolygon(plot: PlotWithDetails): string {
  if (plot.polygon_geojson) {
    const ring = plot.polygon_geojson.coordinates[0];
    if (!ring || ring.length < 3) return DEFAULT_POLYGON;

    const lngs = ring.map((c) => c[0]);
    const lats = ring.map((c) => c[1]);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const rangeLng = maxLng - minLng || 1;
    const rangeLat = maxLat - minLat || 1;

    return ring
      .slice(0, -1)
      .map((c) => {
        const x = ((c[0] - minLng) / rangeLng) * 320 + 30;
        const y = 150 - ((c[1] - minLat) / rangeLat) * 120 + 15;
        return `${x.toFixed(0)},${y.toFixed(0)}`;
      })
      .join(' ');
  }
  return DEFAULT_POLYGON;
}

const DEFAULT_POLYGON = '60,40 220,28 320,70 290,150 110,148 50,110';