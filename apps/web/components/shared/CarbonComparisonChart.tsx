'use client';

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  LabelList,
} from 'recharts';
import { Card } from '@/components/ui/Card';
import { fmtIDRshort, fmtIDR } from '@/lib/utils';

interface CarbonComparisonChartProps {
  /** Annual carbon credit earnings in IDR */
  annualCarbonEarnings: number;
  /** Plot area in hectares — untuk hitung sawit revenue */
  areaHectares: number;
}

/**
 * Comparison chart: Carbon Credit vs Konversi Sawit, 5 tahun.
 *
 * Asumsi sawit (rough estimate untuk smallholder Indonesia):
 *   - Revenue gross: ~Rp 8-12 juta/ha/tahun (FFB price × yield 18-25 ton/ha)
 *   - Operating cost: ~50-60% dari revenue (pupuk, tenaga, transport)
 *   - Yield curve: tahun 1-3 produktivitas rendah (immature), tahun 4-7 puncak
 *
 * Carbon credit revenue grows seiring biomass accumulation (~10% YoY).
 */
export function CarbonComparisonChart({
  annualCarbonEarnings,
  areaHectares,
}: CarbonComparisonChartProps) {
  // Carbon credit projection (5 tahun, growth ~10% YoY karena biomass accumulation)
  const carbonProjection = [0, 1, 2, 3, 4].map((y) =>
    Math.round(annualCarbonEarnings * Math.pow(1.1, y))
  );

  // Sawit projection — gross minus cost. Yield curve realistis:
  // Tahun 1: 0% (replanting + immature), Tahun 2: 30%, Tahun 3: 60%, Tahun 4-5: 100%
  const sawitGrossPerHaPerYear = 10_000_000; // Rp 10jt/ha/tahun pada peak
  const yieldCurve = [0, 0.3, 0.6, 1.0, 1.0];
  const opexRatio = 0.55;
  const sawitProjection = yieldCurve.map((mult) => {
    const gross = sawitGrossPerHaPerYear * areaHectares * mult;
    const net = gross * (1 - opexRatio);
    return Math.round(net);
  });

  // ── Konversi cost (replanting): satu-time di Year 0 ──
  const conversionCost = -3_000_000 * areaHectares; // Rp 3jt/ha for clearing + planting
  const sawitWithConversion = [...sawitProjection];
  sawitWithConversion[0] += conversionCost;

  const totalCarbon = carbonProjection.reduce((s, v) => s + v, 0);
  const totalSawit = sawitWithConversion.reduce((s, v) => s + v, 0);
  const carbonAdvantage = totalCarbon - totalSawit;

  // Aggregated chart data — show 5-year totals untuk simplicity
  const chartData = [
    {
      label: 'Carbon Credit',
      total: totalCarbon,
      color: '#234D2E',
      sublabel: 'Lahan tetap hijau',
    },
    {
      label: 'Konversi Sawit',
      total: totalSawit,
      color: '#A88B5C',
      sublabel: 'Hutan dikonversi',
    },
  ];

  return (
    <Card className="p-5">
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <div className="eyebrow">Skenario 5 Tahun</div>
          <div className="font-display text-[18px] mt-0.5 text-ink-900">
            Carbon Credit vs Konversi Sawit
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-ink-500">Selisih</div>
          <div
            className={`figure text-[16px] ${carbonAdvantage > 0 ? 'text-green-700' : 'text-danger'}`}
          >
            {carbonAdvantage > 0 ? '+' : ''}
            {fmtIDRshort(Math.abs(carbonAdvantage))}
          </div>
        </div>
      </div>

      <div style={{ width: '100%', height: 240 }}>
        <ResponsiveContainer>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 10, right: 60, left: 10, bottom: 10 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(15, 23, 42, 0.06)"
              horizontal={false}
            />
            <XAxis
              type="number"
              tickFormatter={(v) => `Rp ${(v / 1_000_000).toFixed(0)}jt`}
              tick={{ fill: '#6B7280', fontSize: 11 }}
              stroke="rgba(15, 23, 42, 0.08)"
            />
            <YAxis
              type="category"
              dataKey="label"
              tick={{ fill: '#0F172A', fontSize: 13, fontWeight: 600 }}
              stroke="rgba(15, 23, 42, 0.08)"
              width={110}
            />
            <Tooltip
              cursor={{ fill: 'rgba(35, 77, 46, 0.05)' }}
              contentStyle={{
                background: '#FFF',
                border: '1px solid rgba(15,23,42,0.08)',
                borderRadius: 8,
                boxShadow: '0 4px 12px rgba(15,23,42,0.06)',
                fontSize: 13,
              }}
              formatter={(v: number) => [fmtIDR(v), 'Total 5 tahun']}
              labelFormatter={(l) => l}
            />
            <Bar dataKey="total" radius={[0, 6, 6, 0]} barSize={42}>
              {chartData.map((entry, idx) => (
                <Cell key={idx} fill={entry.color} />
              ))}
              <LabelList
                dataKey="total"
                position="right"
                formatter={(v: number) => fmtIDRshort(v)}
                style={{
                  fontFamily: 'var(--font-source-serif), serif',
                  fontSize: 14,
                  fontWeight: 500,
                  fill: '#0F172A',
                }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Disclaimer + impact framing */}
      <div className="mt-4 pt-4 border-t border-[rgba(15,23,42,0.06)] space-y-2">
        <div className="flex items-start gap-2 text-xs text-ink-500">
          <span className="mt-0.5">📊</span>
          <span>
            <b className="text-ink-700">Asumsi konservatif:</b> harga IDXCarbon
            stabil, sawit yield 18 ton/ha pada peak, opex 55%, biaya replanting{' '}
            Rp 3jt/ha.
          </span>
        </div>
        {carbonAdvantage > 0 && (
          <div className="flex items-start gap-2 text-xs text-green-700">
            <span className="mt-0.5">🌱</span>
            <span>
              Carbon credit lebih menguntungkan dan{' '}
              <b>lahan tetap menyerap karbon</b> tanpa konversi hutan.
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}