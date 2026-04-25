import { notFound } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, FileText, Camera, Wallet, Users } from 'lucide-react';
import { TopBar, BottomBar } from '@/components/ui/Layout';
import { Card, StatCard, StatusBadge } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PlotResultMap } from '@/components/shared/PlotResultMap';
import { EarningsProjectionCard } from '@/components/shared/EarningsProjectionCard';
import { CarbonComparisonChart } from '@/components/shared/CarbonComparisonChart';
import { getPlotById } from '@/lib/api/plots';
import { fmtArea, fmtIDR, fmtNumber } from '@/lib/utils';

export const dynamic = 'force-dynamic';

interface PlotPageProps {
  params: { id: string };
  searchParams: { from?: string };
}

export default async function PlotDetailPage({
  params,
  searchParams,
}: PlotPageProps) {
  const plot = await getPlotById(params.id);
  if (!plot) notFound();

  const justVerified = searchParams.from === 'verify';
  const verification = plot.verification;
  const carbon = plot.carbon_estimate;

  return (
    <div className="min-h-screen bg-paper pb-32">
      <TopBar
        title={plot.name}
        onBack={undefined}
        right={<StatusBadge status={plot.status} />}
      />

      <div className="px-5 py-5 max-w-3xl mx-auto space-y-5">
        {/* Just-verified banner */}
        {justVerified && (
          <div className="p-3.5 bg-green-50 border border-green-200 rounded-md flex items-start gap-3">
            <CheckCircle2
              size={20}
              strokeWidth={1.75}
              className="text-green-700 mt-0.5 flex-shrink-0"
            />
            <div className="flex-1">
              <div className="text-[14px] font-semibold text-green-700">
                Verifikasi selesai!
              </div>
              <div className="text-xs text-green-700/80 mt-0.5">
                Carbon credit akan diterbitkan dalam 7 hari kerja setelah
                final review.
              </div>
            </div>
          </div>
        )}

        {/* On-behalf disclosure */}
        {plot.ownership_type === 'on_behalf' && plot.land_owner && (
          <div className="p-3.5 bg-earth-50 border border-earth-200 rounded-md flex items-start gap-3">
            <Users
              size={20}
              strokeWidth={1.75}
              className="text-earth-700 mt-0.5 flex-shrink-0"
            />
            <div className="flex-1 text-[13px] text-earth-900">
              <b>Lahan ini milik {plot.land_owner.full_name}.</b> Anda
              terdaftar sebagai pengelola. Pendapatan masuk ke akun Anda —
              pastikan menyalurkan ke pemilik sesuai kesepakatan.
            </div>
          </div>
        )}

        {/* ───── SECTION 1: Map ───── */}
        {plot.polygon_geojson && verification && (
          <div>
            <h3 className="font-display text-[20px] mb-3">Peta Lahan</h3>
            <PlotResultMap
              polygonGeoJSON={plot.polygon_geojson}
              ndviScore={verification.ndvi_score || 0}
              height={300}
            />
          </div>
        )}

        {/* ───── SECTION 2: Verification Stats ───── */}
        {verification && (
          <div>
            <h3 className="font-display text-[20px] mb-3">Hasil Verifikasi</h3>
            <div className="grid grid-cols-2 gap-2.5">
              <StatCard
                label="Luas"
                value={fmtArea(plot.area_hectares)}
              />
              <StatCard
                label="Tutupan"
                value={`${Math.round((verification.ndvi_score || 0) * 100)}%`}
                sub={ndviLabel(verification.ndvi_score || 0)}
              />
              <StatCard
                label="Pohon Terdeteksi"
                value={verification.tree_count_photo || 0}
                sub={`+ ${verification.tree_count_satellite || 0} dari satelit`}
              />
              <StatCard
                label="Confidence"
                value={`${verification.confidence_score || 0}%`}
                sub="cross-validated"
              />
            </div>
          </div>
        )}

        {/* ───── SECTION 3: Carbon Stock ───── */}
        {carbon && (
          <div>
            <h3 className="font-display text-[20px] mb-3">
              Estimasi Carbon Stock
            </h3>
            <Card className="p-5">
              <div className="eyebrow">Sequestration Tahunan</div>
              <div className="figure text-[36px] text-ink-900 mt-1 leading-[1.05]">
                {fmtNumber(carbon.annual_sequestration_tco2e, 1)}{' '}
                <span className="text-base font-sans font-medium text-ink-500">
                  ton CO2e/tahun
                </span>
              </div>
              <div className="mt-1 text-xs text-ink-500">
                Range: {fmtNumber(carbon.confidence_range_low, 1)} –{' '}
                {fmtNumber(carbon.confidence_range_high, 1)} · Total stored:{' '}
                {fmtNumber(carbon.total_stored_tco2e, 0)} ton
              </div>
              <div className="mt-2 text-[11px] text-ink-400">
                Methodology: {carbon.methodology}
              </div>
            </Card>
          </div>
        )}

        {/* ───── SECTION 4: Earnings Projection ───── */}
        {carbon && (
          <div>
            <h3 className="font-display text-[20px] mb-3">
              Proyeksi Pendapatan
            </h3>
            <EarningsProjectionCard
              annualSequestrationTco2e={carbon.annual_sequestration_tco2e}
              confidenceLow={carbon.confidence_range_low}
              confidenceHigh={carbon.confidence_range_high}
            />
          </div>
        )}

        {/* ───── SECTION 5: Comparison Chart (KILLER) ───── */}
        {carbon && (
          <div>
            <h3 className="font-display text-[20px] mb-3">
              Carbon Credit vs Konversi Sawit
            </h3>
            <CarbonComparisonChart
              annualCarbonEarnings={Math.round(
                carbon.annual_sequestration_tco2e * 70_000
              )}
              areaHectares={plot.area_hectares}
            />
          </div>
        )}

        {/* ───── SECTION 6: Activity Timeline (untuk returning visit) ───── */}
        {!justVerified && plot.status === 'credit_issued' && (
          <div>
            <h3 className="font-display text-[20px] mb-3">Aktivitas</h3>
            <ActivityTimeline plotId={plot.id} />
          </div>
        )}

        {/* ───── SECTION 7: Risk Alerts (predictive) ───── */}
        {!justVerified && verification && (
          <div className="p-3.5 bg-green-50 border border-green-200 rounded-md flex items-start gap-3">
            <CheckCircle2
              size={18}
              strokeWidth={1.75}
              className="text-green-700 mt-0.5 flex-shrink-0"
            />
            <div className="text-[13px] text-green-700">
              <b>Kondisi lahan stabil.</b> Tidak ada perubahan signifikan
              terdeteksi bulan ini.
            </div>
          </div>
        )}
      </div>

      {/* ───── Sticky bottom action bar ───── */}
      <BottomBar>
        {justVerified ? (
          <>
            <Link href="/home" className="no-underline border-0 flex-shrink-0">
              <Button variant="secondary">Beranda</Button>
            </Link>
            <Link
              href="/wizard"
              className="no-underline border-0 flex-1"
            >
              <Button fullWidth>Daftarkan Lahan Lain</Button>
            </Link>
          </>
        ) : (
          <>
            <Button variant="secondary" leftIcon={Camera}>
              Update Foto
            </Button>
            <Link
              href="/withdraw"
              className="no-underline border-0 flex-1"
            >
              <Button
                fullWidth
                leftIcon={Wallet}
                disabled={plot.annual_earnings_idr === 0}
              >
                Cairkan Pendapatan
              </Button>
            </Link>
          </>
        )}
      </BottomBar>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function ndviLabel(score: number): string {
  if (score >= 0.6) return 'High Density';
  if (score >= 0.4) return 'Medium Density';
  return 'Low Density';
}

// Mock activity timeline — untuk demo. Production: fetch dari transactions.
function ActivityTimeline({ plotId }: { plotId: string }) {
  const events = [
    {
      date: '20 Apr 2026',
      type: 'payment',
      text: 'Rp 245.000 dari PT Hijau Lestari',
    },
    {
      date: '18 Apr 2026',
      type: 'buyer',
      text: '3,5 ton CO2e dibeli oleh PT Hijau Lestari',
    },
    {
      date: '12 Apr 2026',
      type: 'credit',
      text: '3,5 ton CO2e diterbitkan',
    },
  ];

  return (
    <div className="space-y-0">
      {events.map((e, i) => (
        <div key={i} className="flex gap-3.5 py-2.5">
          <div className="flex flex-col items-center flex-shrink-0">
            <div
              className="w-2.5 h-2.5 rounded-pill bg-green-600 mt-1"
              style={{ boxShadow: '0 0 0 4px var(--green-100)' }}
            />
            {i < events.length - 1 && (
              <div className="w-px flex-1 bg-ink-200 mt-1" />
            )}
          </div>
          <div className="pb-3">
            <div className="text-sm font-semibold text-ink-900">{e.text}</div>
            <div className="text-xs text-ink-500 mt-0.5">{e.date}</div>
          </div>
        </div>
      ))}
    </div>
  );
}