import Link from 'next/link';
import { Satellite, Wallet, ShieldCheck, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function LandingPage() {
  const valueProps = [
    {
      icon: Satellite,
      title: 'Verifikasi otomatis',
      desc: 'Dari satelit Sentinel-2 dan AI tree counting.',
    },
    {
      icon: Wallet,
      title: 'Pembayaran langsung',
      desc: 'Carbon credit cair ke e-wallet Anda.',
    },
    {
      icon: ShieldCheck,
      title: 'Transparansi penuh',
      desc: 'Lihat verifikasi sampai pendapatan.',
    },
  ];

  return (
    <div className="min-h-screen bg-paper">
      {/* Header */}
      <header className="px-5 md:px-10 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-pill bg-green-700 flex items-center justify-center">
            <span className="text-green-50 font-display text-base font-bold">
              C
            </span>
          </div>
          <span className="font-display text-[20px] font-medium tracking-[-0.01em]">
            CarbonLink
          </span>
        </div>
        <Link href="/auth" className="no-underline border-0">
          <Button variant="ghost" size="sm">
            Masuk
          </Button>
        </Link>
      </header>

      {/* Hero */}
      <section className="px-5 md:px-10 pt-8 md:pt-16 pb-12 md:pb-20 max-w-4xl mx-auto text-center">
        <div className="inline-block px-3 py-1 rounded-pill bg-green-50 text-green-700 text-[11px] font-semibold tracking-[0.06em] uppercase mb-5">
          Untuk Petani Indonesia
        </div>
        <h1 className="display-md md:display-lg mb-4 max-w-2xl mx-auto">
          Lahanmu, pendapatanmu — dari menjaga pohon.
        </h1>
        <p className="text-body md:text-body-lg text-ink-600 max-w-xl mx-auto mb-8">
          Daftarkan lahan agroforestri Anda. Verifikasi otomatis dari satelit
          dan AI. Dapatkan pendapatan dari carbon credit langsung ke e-wallet.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
          <Link href="/auth" className="no-underline border-0 flex-1">
            <Button size="lg" fullWidth rightIcon={ArrowRight}>
              Daftar Sebagai Petani
            </Button>
          </Link>
          <Link href="/auth" className="no-underline border-0 flex-1">
            <Button variant="secondary" size="lg" fullWidth>
              Sudah Punya Akun
            </Button>
          </Link>
        </div>
      </section>

      {/* Value props */}
      <section className="px-5 md:px-10 pb-12 md:pb-20 max-w-4xl mx-auto">
        <div className="grid md:grid-cols-3 gap-3">
          {valueProps.map((v) => {
            const Icon = v.icon;
            return (
              <div
                key={v.title}
                className="flex md:flex-col gap-3.5 p-4 md:p-5 bg-green-50 rounded-md"
              >
                <div className="w-10 h-10 flex-shrink-0 rounded-pill bg-green-700 text-green-50 flex items-center justify-center">
                  <Icon size={20} strokeWidth={1.75} />
                </div>
                <div>
                  <div className="text-[15px] md:text-base font-semibold text-ink-900">
                    {v.title}
                  </div>
                  <div className="text-[13px] md:text-sm text-ink-600 mt-1 leading-relaxed">
                    {v.desc}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section className="px-5 md:px-10 pb-12 md:pb-20 max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="eyebrow mb-2">Bagaimana Cara Kerjanya</div>
          <h2 className="display-sm md:display-md">
            Dari lahan ke pendapatan, dalam 4 langkah.
          </h2>
        </div>
        <div className="space-y-3 max-w-2xl mx-auto">
          {[
            {
              num: '01',
              t: 'Daftarkan Lahan',
              d: 'Gambar batas lahan di peta. Upload foto pohon. 5 menit selesai.',
            },
            {
              num: '02',
              t: 'Verifikasi Otomatis',
              d: 'Satelit menghitung tutupan vegetasi. AI menghitung pohon dari foto. Cross-validate dalam 30 detik.',
            },
            {
              num: '03',
              t: 'Carbon Credit Diterbitkan',
              d: 'Carbon stock dihitung pakai metodologi IPCC. Credit di-tokenize dan listed di pasar.',
            },
            {
              num: '04',
              t: 'Pendapatan Cair',
              d: 'Saat credit terjual, pendapatan langsung masuk ke e-wallet Anda — DANA, GoPay, atau OVO.',
            },
          ].map((step) => (
            <div
              key={step.num}
              className="flex gap-4 p-4 md:p-5 bg-white border border-[rgba(15,23,42,0.08)] rounded-md"
            >
              <div className="font-display text-[28px] md:text-[36px] text-green-700 leading-none flex-shrink-0">
                {step.num}
              </div>
              <div>
                <div className="text-[15px] md:text-base font-semibold text-ink-900">
                  {step.t}
                </div>
                <div className="text-[13px] md:text-sm text-ink-600 mt-1 leading-relaxed">
                  {step.d}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonial — labeled placeholder */}
      <section className="px-5 md:px-10 pb-12 md:pb-20 max-w-3xl mx-auto">
        <div className="bg-earth-50 border border-earth-200 rounded-lg p-6 md:p-8">
          <div className="text-[13px] text-earth-700 mb-3">
            <span className="px-2 py-0.5 bg-earth-200 rounded-pill text-[10px] font-semibold uppercase tracking-wider">
              Demo placeholder
            </span>
          </div>
          <p className="font-display text-[18px] md:text-[20px] text-ink-900 leading-relaxed mb-4">
            &ldquo;Dari kebun kopi 2 hektar saya, dapat tambahan Rp 1,6 juta per
            tahun. Tidak perlu konversi lahan, tidak perlu pinjaman.&rdquo;
          </p>
          <div className="text-sm text-ink-600">
            <b className="text-ink-900">Pak Asep, 52 tahun</b> · Petani kopi
            agroforestri · Cianjur, Jawa Barat
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[rgba(15,23,42,0.08)] px-5 md:px-10 py-6 max-w-6xl mx-auto">
        <div className="text-center text-xs text-ink-500">
          Powered by{' '}
          <span className="text-ink-700 font-semibold">Sentinel-2</span> ·{' '}
          <span className="text-ink-700 font-semibold">IPCC methodology</span>{' '}
          · <span className="text-ink-700 font-semibold">IDXCarbon pricing</span>
        </div>
      </footer>
    </div>
  );
}