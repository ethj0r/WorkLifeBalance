import { Bell, Leaf, Satellite, TrendingUp, Wallet } from "lucide-react";
import Link from "next/link";
import { AppHeader } from "@/components/ui/AppHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PlotCard } from "@/components/plots/PlotCard";
import { StatCard } from "@/components/ui/StatCard";
import { formatIDR, formatIDRShort, decimalID } from "@/lib/format";
import { plots, user } from "@/lib/mock-data";

export default function DashboardPage() {
  const totalArea = plots.reduce((s, p) => s + p.area, 0);
  const totalEarn = plots.reduce((s, p) => s + p.annualEarnings, 0);
  const avgConfidence = Math.round(plots.reduce((s, p) => s + p.confidence, 0) / plots.length);

  return (
    <main className="web-page">
      <AppHeader active="dashboard" />
      <section className="web-container py-8 lg:py-10">
        <div className="mb-8 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <div className="text-sm text-ink-500">Halo,</div>
            <h1 className="display-md">{user.name}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-600">Pantau lahan, status verifikasi MRV, estimasi carbon credit, dan saldo yang siap ditarik.</p>
          </div>
          <button className="flex w-fit items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink-700 shadow-xs"><Bell className="h-4 w-4" />3 notifikasi</button>
        </div>

        <div className="dashboard-grid">
          <div className="space-y-6">
            <Card className="overflow-hidden rounded-[24px] p-0">
              <div className="relative bg-green-700 p-7 text-green-50 md:p-8">
                <div className="absolute -right-12 -top-12 h-56 w-56 rounded-full bg-green-600 opacity-50" />
                <div className="relative grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
                  <div>
                    <div className="eyebrow !text-green-50/70">Saldo tersedia</div>
                    <div className="figure mt-2 text-5xl font-medium leading-none md:text-6xl">{formatIDR(user.balance)}</div>
                    <div className="mt-2 text-sm text-green-50/70">Estimasi tahunan seluruh lahan: {formatIDRShort(totalEarn)}</div>
                  </div>
                  <Link href="/withdraw"><Button variant="dark" className="bg-white/15 text-green-50 hover:bg-white/20" leftIcon={<Wallet className="h-4 w-4" />}>Tarik ke E-Wallet</Button></Link>
                </div>
              </div>
            </Card>

            <div className="grid gap-3 sm:grid-cols-3">
              <StatCard label="Total lahan" value={String(plots.length)} sub={`${decimalID(totalArea)} ha total`} />
              <StatCard label="Confidence rata-rata" value={`${avgConfidence}%`} sub="satelit + foto" />
              <StatCard label="Carbon/tahun" value="72 ton" sub="estimasi CO2e" />
            </div>

            <section>
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <h2 className="font-display text-3xl font-medium">Lahan Saya</h2>
                  <p className="mt-1 text-sm text-ink-500">{plots.length} lahan terdaftar</p>
                </div>
                <Link href="/plots/new"><Button leftIcon={<Leaf className="h-4 w-4" />}>Daftarkan lahan</Button></Link>
              </div>
              <div className="grid gap-4 md:grid-cols-2">{plots.map((plot) => <PlotCard key={plot.id} plot={plot} />)}</div>
            </section>
          </div>

          <aside className="space-y-4">
            <Card className="rounded-2xl p-5">
              <div className="flex items-center gap-2"><Satellite className="h-5 w-5 text-green-700" /><h2 className="font-semibold">MRV queue</h2></div>
              <div className="mt-4 space-y-3 text-sm">
                <QueueRow title="Kebun Campur Lembah Padi" value="Verifying" />
                <QueueRow title="Kebun Cengkeh Bukit Hijau" value="Verified" />
                <QueueRow title="Kebun Kopi Sumber Asih" value="Credit issued" />
              </div>
            </Card>
            <Card className="rounded-2xl bg-earth-50 p-5">
              <div className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-earth-700" /><h2 className="font-semibold text-earth-900">Insight bulan ini</h2></div>
              <p className="mt-3 text-sm leading-6 text-earth-700">Lahan dengan confidence di atas 85% lebih siap masuk buyer matching. Tambahkan dokumen legal untuk menaikkan trust score.</p>
            </Card>
          </aside>
        </div>
      </section>
    </main>
  );
}

function QueueRow({ title, value }: { title: string; value: string }) {
  return <div className="flex items-center justify-between gap-3 border-b border-[rgba(15,23,42,.08)] pb-3 last:border-0 last:pb-0"><span className="text-ink-600">{title}</span><span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-bold text-green-700">{value}</span></div>;
}
