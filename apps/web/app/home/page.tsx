import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Plus, Bell, MapPin, Satellite, ScrollText, Wallet } from 'lucide-react';
import {
  getCurrentUserProfile,
  getUserPlots,
  getUserBalance,
} from '@/lib/api/plots';
import { Button } from '@/components/ui/Button';
import { StatCard } from '@/components/ui/Card';
import { FAB } from '@/components/ui/Layout';
import { PlotCard } from '@/components/shared/PlotCard';
import { HomeBalanceCard } from '@/components/shared/HomeBalanceCard';
import { fmtArea } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [user, plots, balance] = await Promise.all([
    getCurrentUserProfile(),
    getUserPlots(),
    getUserBalance(),
  ]);

  // Belum complete profile setup
  if (!user) {
    redirect('/onboarding');
  }

  const hasPlots = plots.length > 0;
  const totalArea = plots.reduce((s: any, p: any) => s + (p.area_hectares || 0), 0);
  const totalAnnualEarnings = plots.reduce(
    (s: any, p: any) => s + (p.annual_earnings_idr || 0),
    0
  );
  const avgConfidence =
    plots.length > 0
      ? Math.round(
          plots.reduce(
            (s: any, p: any) => s + (p.verification?.confidence_score || 0),
            0
          ) / plots.filter((p: any) => p.verification).length || 0
        )
      : 0;

  return (
    <div className="min-h-screen bg-paper relative">
      {/* Header — greeting + bell */}
      <div className="px-5 pt-5 pb-2 flex items-center justify-between">
        <div>
          <div className="text-[13px] text-ink-500">Halo,</div>
          <div className="font-display text-[22px] font-medium text-ink-900 tracking-[-0.01em]">
            {user.display_name}
          </div>
        </div>
        <button
          className="w-10 h-10 rounded-pill bg-white shadow-xs flex items-center justify-center hover:shadow-sm transition-shadow"
          aria-label="Notifikasi"
        >
          <Bell size={18} strokeWidth={1.75} />
        </button>
      </div>

      {hasPlots ? (
        <ConditionB
          plots={plots}
          balance={balance}
          totalArea={totalArea}
          totalAnnualEarnings={totalAnnualEarnings}
          avgConfidence={avgConfidence}
        />
      ) : (
        <ConditionA />
      )}

      <FAB onClick={undefined} />
      <Link
        href="/wizard"
        aria-label="Tambah Lahan"
        className="fixed right-5 bottom-7 w-14 h-14 rounded-pill bg-green-700 text-green-50 shadow-float flex items-center justify-center z-20 hover:bg-green-800 transition-colors no-underline border-0"
      >
        <Plus size={24} strokeWidth={1.75} />
      </Link>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Kondisi A — Zero state (belum ada lahan)
// ─────────────────────────────────────────────────────────────
function ConditionA() {
  const steps = [
    { icon: MapPin, t: 'Daftar Lahan', d: 'Gambar batas lahan di peta' },
    { icon: Satellite, t: 'Verifikasi Otomatis', d: 'Satelit + AI tree counting' },
    { icon: ScrollText, t: 'Carbon Credit Terbit', d: 'Sertifikat dari verifikasi' },
    { icon: Wallet, t: 'Pendapatan Cair', d: 'Langsung ke e-wallet' },
  ];

  return (
    <div className="px-5 pb-32">
      {/* Big CTA card */}
      <div className="mt-3 bg-gradient-to-br from-green-700 to-green-600 text-green-50 rounded-lg p-6 text-center relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-pill bg-green-500 opacity-30" />
        <div className="relative">
          <h2 className="font-display text-[24px] text-green-50 mb-2 tracking-[-0.01em]">
            Mulai dari sini
          </h2>
          <p className="text-sm text-green-50/80 mb-5 max-w-[280px] mx-auto">
            Daftarkan lahan pertamamu. Verifikasi gratis dalam 30 detik.
          </p>
          <Link href="/wizard" className="inline-block no-underline border-0">
            <Button
              size="lg"
              className="bg-white text-green-700 hover:bg-green-50"
              leftIcon={Plus}
            >
              Daftarkan Lahan Saya
            </Button>
          </Link>
        </div>
      </div>

      {/* How it works */}
      <h3 className="font-display text-[20px] mt-7 mb-4">
        Bagaimana cara kerjanya?
      </h3>
      <div className="space-y-3">
        {steps.map((s, i) => {
          const Icon = s.icon;
          return (
            <div
              key={i}
              className="flex items-center gap-3.5 p-4 bg-white border border-[rgba(15,23,42,0.08)] rounded-md"
            >
              <div className="w-10 h-10 flex-shrink-0 rounded-pill bg-green-100 text-green-700 flex items-center justify-center">
                <Icon size={20} strokeWidth={1.75} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[15px] font-semibold text-ink-900">
                  {s.t}
                </div>
                <div className="text-[13px] text-ink-500 mt-0.5">{s.d}</div>
              </div>
              <div className="font-display text-[20px] text-ink-300">
                {i + 1}
              </div>
            </div>
          );
        })}
      </div>

      {/* FAQ teaser */}
      <h3 className="font-display text-[20px] mt-7 mb-3">Pertanyaan umum</h3>
      <div className="space-y-2">
        {[
          'Apa itu carbon credit?',
          'Berapa pendapatan yang bisa saya dapat?',
          'Apakah aman? Bagaimana data saya dilindungi?',
        ].map((q) => (
          <button
            key={q}
            className="w-full text-left p-3.5 bg-white border border-[rgba(15,23,42,0.08)] rounded-sm text-[14px] text-ink-700 hover:border-green-300 transition-colors flex items-center justify-between"
          >
            <span>{q}</span>
            <span className="text-ink-400">→</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Kondisi B — Returning user (sudah punya lahan)
// ─────────────────────────────────────────────────────────────
function ConditionB({
  plots,
  balance,
  totalArea,
  totalAnnualEarnings,
  avgConfidence,
}: {
  plots: Awaited<ReturnType<typeof getUserPlots>>;
  balance: number;
  totalArea: number;
  totalAnnualEarnings: number;
  avgConfidence: number;
}) {
  return (
    <>
      {/* Balance card */}
      <div className="px-5 pt-3">
        <HomeBalanceCard
          balance={balance}
          totalAnnualEarnings={totalAnnualEarnings}
        />
      </div>

      {/* Stats row */}
      <div className="px-5 pt-3.5 grid grid-cols-2 gap-2.5">
        <StatCard
          label="Total Lahan"
          value={plots.length}
          sub={`${fmtArea(totalArea)} total`}
        />
        <StatCard
          label="Confidence Rata-rata"
          value={avgConfidence > 0 ? `${avgConfidence}%` : '—'}
          sub="satelit + foto"
        />
      </div>

      {/* Plots list */}
      <div className="px-5 pt-5 pb-32">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-display text-[20px]">Lahan Saya</h3>
          <span className="text-xs text-ink-500">{plots.length} lahan</span>
        </div>
        <div className="space-y-3">
          {plots.map((p) => (
            <PlotCard key={p.id} plot={p} />
          ))}
        </div>
      </div>
    </>
  );
}