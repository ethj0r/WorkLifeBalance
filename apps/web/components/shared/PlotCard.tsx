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
  // Generate SVG polygon string dari GeoJSON kalau tidak ada preview
  const polygonStr = previewPolygon || generatePreviewPolygon(plot);

  return (
    <Link href={`/plot/${plot.id}`} className="block no-underline border-0">
      <Card hover onClick={() => {}} className="hover:border-green-200">
        <div className="flex justify-between items-start gap-3">
          <div className="min-w-0 f