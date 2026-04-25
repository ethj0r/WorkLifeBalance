import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Leaf, Satellite, TrendingUp, Wallet } from "lucide-react";
import { AppHeader } from "@/components/ui/AppHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { MapPolygon } from "@/components/plots/MapPolygon";
import { plots } from "@/lib/mock-data";
import { decimalID, formatIDR, formatIDRShort } from "@/lib/format";

export default function PlotDetailPage({ params, searchParams }: { params: { id: string }; searchParams?: { new?: string } }) {
  const plot = plots.find((p) => p.id === params.id);
  if (!plot) notFound();
  return (
    <main className="web-page">
      <AppHeader active="dashboard" />
      <section className="web-container py-8 lg:py-10">
        {searchParams?.new && <div className="mb-6 flex gap-2 rounded-2xl bg-green-50 p-4 text-sm font-semibold text-green-700"><CheckCircle2 className="h-5 w-5 flex-none" /> Verifikasi awal selesai. Estimasi pendapatan sudah bisa dilihat.</div>}
        <div className="mb-8 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <div className="mb-3"><StatusBadge status={plot.status} /></div>
            <h1 className="display-md">{plot.name}</h1>
            <p className="mt-2 text-sm text-ink-500">{plot.location}</p>
          </div>
          <div className="flex gap-2"><Link href="/withdraw"><Button leftIcon={<Wallet className="h-4 w-4" />}>Tarik pendapatan</Button></Link><Button variant="secondary" leftIcon={<Leaf className="h-4 w-4" />}>Sertifikat</Button></div>
        </div>

        <div className="dashboard-grid">
          <div className="space-y-5">
            <Card className="rounded-[24px] p-4"><MapPolygon polygon={plot.polygon} height={420} ndvi /></Card>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Metric label="Luas" value={`${decimalID(plot.area)} ha`} />
              <Metric label="Confidence" value={`${plot.confidence}%`} />
              <Metric label="Carbon/tahun" value={`${decimalID(plot.carbonTons)} ton`} />
              <Metric label="Estimasi" value={formatIDRShort(plot.annualEarnings)} />
            </div>
            <Card className="rounded-2xl p-6">
              <div className="flex items-center gap-2"><Satellite className="h-5 w-5 text-green-700" /><h2 className="font-semibold">Hasil MRV otomatis</h2></div>
              <div className="mt-5 grid gap-3 text-sm md:grid-cols-3">
                <InfoBox label="NDVI" value={String(plot.ndvi).replace(".", ",")} />
                <InfoBox label="Pohon dominan" value={plot.trees.join(", ")} />
                <InfoBox label="Metode" value="Sentinel-2 + foto + IPCC Tier 1" />
              </div>
            </Card>
          </div>

          <aside className="space-y-5">
            <Card className="rounded-2xl p-6">
              <div className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-green-700" /><h2 className="font-semibold">Proyeksi pendapatan</h2></div>
              <p className="mt-3 text-sm leading-6 text-ink-500">Estimasi ini masih mock untuk MVP. Angka final bergantung pada metodologi, kualitas data, dan harga pembeli.</p>
              <div className="mt-5 rounded-2xl bg-green-700 p-5 text-green-50"><div className="eyebrow !text-green-50/70">Estimasi tahunan</div><div className="figure mt-2 text-4xl font-medium">{formatIDR(plot.annualEarnings)}</div></div>
            </Card>
            <Card className="rounded-2xl bg-earth-50 p-6">
              <div className="eyebrow text-earth-700">Catatan kualitas</div>
              <p className="mt-3 text-sm leading-6 text-earth-700">Untuk menaikkan kualitas credit, tambahkan dokumen legal dan foto pohon berkala agar audit trail lebih kuat.</p>
            </Card>
          </aside>
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) { return <Card className="p-4"><div className="eyebrow">{label}</div><div className="figure mt-2 text-3xl font-medium">{value}</div></Card>; }
function InfoBox({ label, value }: { label: string; value: string }) { return <div className="rounded-xl bg-ink-50 p-4"><div className="eyebrow">{label}</div><div className="mt-2 font-semibold text-ink-900">{value}</div></div>; }
