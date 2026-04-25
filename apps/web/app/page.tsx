import Link from "next/link";
import { ArrowRight, BarChart3, CheckCircle2, Leaf, Satellite, ShieldCheck, Wallet } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PublicHeader } from "@/components/ui/AppHeader";

export default function LandingPage() {
  const benefits = [
    { icon: Satellite, title: "Verifikasi otomatis", desc: "Satelit Sentinel-2, NDVI, dan foto lahan dipakai untuk menilai tutupan pohon." },
    { icon: BarChart3, title: "Estimasi pendapatan", desc: "Petani langsung melihat proyeksi carbon credit tahunan dalam rupiah." },
    { icon: Wallet, title: "Pencairan e-wallet", desc: "Saldo hasil penjualan credit ditarik ke DANA, GoPay, OVO, atau rekening mitra." },
  ];

  return (
    <main className="web-page">
      <PublicHeader />
      <section className="web-container grid gap-12 pb-16 pt-14 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:pb-24 lg:pt-20">
        <div>
          <div className="mb-5 inline-flex rounded-full bg-green-50 px-4 py-2 text-xs font-bold uppercase tracking-[.14em] text-green-700">Untuk petani Indonesia</div>
          <h1 className="display-xl max-w-4xl">Lahanmu, pendapatanmu — dari menjaga pohon.</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-ink-700">Daftarkan lahan agroforestri, verifikasi otomatis, lalu dapatkan estimasi pendapatan carbon credit tanpa biaya MRV mahal.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/login"><Button size="lg" leftIcon={<Leaf className="h-5 w-5" />}>Daftar Sebagai Petani</Button></Link>
            <Link href="/login"><Button size="lg" variant="secondary">Saya Sudah Punya Akun</Button></Link>
          </div>
          <div className="mt-8 grid max-w-2xl grid-cols-3 gap-3">
            <MiniStat value="&lt;5 ha" label="plot kecil tetap viable" />
            <MiniStat value="5 tahap" label="verifikasi otomatis" />
            <MiniStat value="Rp" label="langsung ke e-wallet" />
          </div>
        </div>

        <div className="relative">
          <div className="absolute -right-10 -top-10 h-52 w-52 rounded-full bg-green-100 blur-3xl" />
          <Card className="relative overflow-hidden rounded-[28px] p-0 shadow-float">
            <div className="bg-green-700 p-8 text-green-50">
              <div className="eyebrow !text-green-50/70">Dashboard petani</div>
              <div className="mt-3 font-display text-4xl font-medium tracking-[-.02em]">Pak Asep</div>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <Panel label="Saldo tersedia" value="Rp 245.000" dark />
                <Panel label="Estimasi/tahun" value="Rp 5,0 jt" dark />
              </div>
            </div>
            <div className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="font-display text-2xl font-medium">Kebun Kopi Sumber Asih</div>
                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700"><CheckCircle2 className="h-3.5 w-3.5" />Verified</span>
              </div>
              <div className="h-48 overflow-hidden rounded-2xl bg-gradient-to-br from-green-400 via-green-200 to-green-50 p-4">
                <svg viewBox="0 0 520 230" className="h-full w-full">
                  <polygon points="80,50 320,30 440,96 390,180 150,168 60,120" fill="rgba(35,77,46,.55)" stroke="#234D2E" strokeWidth="4" />
                  {[['80','50'],['320','30'],['440','96'],['390','180'],['150','168'],['60','120']].map(([x,y]) => <circle key={x+y} cx={x} cy={y} r="7" fill="#234D2E" stroke="#fff" strokeWidth="3" />)}
                </svg>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-3">
                <Panel label="Luas" value="2,4 ha" />
                <Panel label="Carbon" value="24 ton" />
                <Panel label="Confidence" value="91%" />
              </div>
            </div>
          </Card>
        </div>
      </section>

      <section className="web-container grid gap-4 pb-20 md:grid-cols-3">
        {benefits.map(({ icon: Icon, title, desc }) => (
          <Card key={title} className="rounded-2xl p-6 transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-green-700 text-green-50"><Icon className="h-6 w-6" strokeWidth={1.75} /></div>
            <h2 className="mt-5 font-display text-2xl font-medium">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-ink-600">{desc}</p>
          </Card>
        ))}
      </section>
    </main>
  );
}

function MiniStat({ value, label }: { value: string; label: string }) {
  return <div className="rounded-2xl border border-[rgba(15,23,42,.08)] bg-white/70 p-4"><div className="figure text-2xl font-medium text-green-700" dangerouslySetInnerHTML={{ __html: value }} /><div className="mt-1 text-xs leading-5 text-ink-500">{label}</div></div>;
}

function Panel({ label, value, dark = false }: { label: string; value: string; dark?: boolean }) {
  return <div className={`rounded-2xl p-4 ${dark ? "bg-white/10" : "bg-green-50"}`}><div className={`eyebrow ${dark ? "!text-green-50/70" : ""}`}>{label}</div><div className={`figure mt-2 text-2xl font-medium ${dark ? "text-green-50" : "text-ink-900"}`}>{value}</div></div>;
}
