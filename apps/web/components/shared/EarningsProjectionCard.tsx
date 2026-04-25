'use client';

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { fmtIDR, fmtIDRshort } from '@/lib/utils';
import { IDR_PER_TCO2E } from '@karbonkredit/types';

interface EarningsProjectionCardProps {
  annualSequestrationTco2e: number;
  /** Optional: kalau mau show range bukan single value */
  confidenceLow?: number;
  confidenceHigh?: number;
}

export function EarningsProjectionCard({
  annualSequestrationTco2e,
  confidenceLow,
  confidenceHigh,
}: EarningsProjectionCardProps) {
  const annualEarnings = Math.round(
    annualSequestrationTco2e * IDR_PER_TCO2E
  );

  // 5-year projection dengan growth 10% YoY (biomass accumulation)
  const projection = [1, 2, 3, 4, 5].map((year) => ({
    year: `Thn ${year}`,
    value: Math.round(annualEarnings * Math.pow(1.1, year - 1)),
  }));

  const total5Year = projection.reduce((s, p) => s + p.value, 0);

  return (
    <div className="bg-green-700 text-green-50 rounded-md p-5 relative overflow-hidden">
      {/* Decorative blob */}
      <div className="absolute -right-6 -top-6 w-32 h-32 rounded-pill bg-green-600 opacity-40 pointer-events-none" />

      <div className="relative">
        {/* Header */}
        <div className="eyebrow text-green-50/70">Pendapatan Tahun 1</div>
        <div className="figure text-[36px] text-green-50 mt-1 leading-[1.05]">
          {fmtIDR(annualEarnings)}
        </div>
        <div className="text-xs text-green-50/70 mt-1">
          Berdasarkan harga IDXCarbon ~Rp{' '}
          {(IDR_PER_TCO2E / 1000).toFixed(0)}.000/ton CO2e
        </div>

        {/* Area chart */}
        <div className="mt-5" style={{ width: '100%', height: 100 }}>
          <ResponsiveContainer>
            <AreaChart
              data={projection}
              margin={{ top: 5, right: 0, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient
                  id="areaGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor="#9CC79A" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="#9CC79A" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="year"
                tick={{ fill: 'rgba(241, 250, 244, 0.7)', fontSize: 10 }}
                stroke="rgba(241, 250, 244, 0.15)"
                tickLine={false}
                axisLine={false}
              />
              <YAxis hide />
              <Tooltip
                contentStyle={{
                  background: '#0F172A',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 12,
                  color: '#F1FAF4',
                }}
                formatter={(v: number) => [fmtIDR(v), 'Pendapatan']}
                cursor={{
                  stroke: 'rgba(241, 250, 244, 0.3)',
                  strokeWidth: 1,
                  strokeDasharray: '3 3',
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#9CC79A"
                strokeWidth={2}
                fill="url(#areaGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Footer with 5-year total */}
        <div className="mt-2 pt-3 border-t border-green-50/15 flex items-baseline justify-between">
          <span className="text-xs text-green-50/70">
            Proyeksi 5 tahun (kumulatif)
          </span>
          <span className="figure text-[16px] text-green-50">
            ~{fmtIDRshort(total5Year)}
          </span>
        </div>
      </div>
    </div>
  );
}