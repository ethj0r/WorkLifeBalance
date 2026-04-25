'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { TopBar, BottomBar } from '@/components/ui/Layout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { fmtIDR } from '@/lib/utils';
import { withdrawAction } from './actions';

const METHODS = [
  { id: 'DANA', label: 'DANA', icon: '💙' },
  { id: 'GoPay', label: 'GoPay', icon: '💚' },
  { id: 'OVO', label: 'OVO', icon: '💜' },
  { id: 'Bank', label: 'Transfer Bank', icon: '🏦' },
];

interface WithdrawPageProps {
  searchParams: { balance?: string };
}

export default function WithdrawPage({ searchParams }: WithdrawPageProps) {
  const router = useRouter();
  const balance = parseInt(searchParams.balance || '245000');

  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [method, setMethod] = useState<string>('DANA');
  const [submitting, setSubmitting] = useState(false);
  const [trxId, setTrxId] = useState<string>('');

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      const result = await withdrawAction({ amount_idr: balance, method });
      if (result.success) {
        setTrxId(result.transactionId || `TRX-${Date.now()}`);
        setStep(2);
      } else {
        alert(result.error || 'Gagal menarik dana');
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan. Coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  // Success state
  if (step === 2) {
    return (
      <div className="min-h-screen bg-paper flex flex-col">
        <TopBar title="" />
        <div className="flex-1 flex flex-col items-center justify-center px-5 py-8 max-w-md mx-auto text-center">
          <div className="w-20 h-20 rounded-pill bg-green-100 text-green-700 flex items-center justify-center mb-5">
            <CheckCircle2 size={40} strokeWidth={1.75} />
          </div>
          <h1 className="display-sm mb-2">Penarikan berhasil</h1>
          <p className="text-sm text-ink-600 mb-1">
            <b className="text-ink-900">{fmtIDR(balance)}</b> akan ditransfer
            dalam 1×24 jam ke <b>{method}</b>.
          </p>
          <div className="mt-4 px-3 py-1.5 rounded-sm bg-ink-50 font-mono text-xs text-ink-500">
            {trxId}
          </div>

          <div className="mt-6 p-3.5 bg-earth-50 border border-earth-200 rounded-sm text-xs text-earth-700">
            <b>Mode Demo:</b> Tidak ada transfer real. Production akan integrate
            dengan payment gateway resmi (DANA Business, Midtrans, Xendit).
          </div>
        </div>
        <BottomBar>
          <Link href="/home" className="no-underline border-0 w-full">
            <Button size="lg" fullWidth>
              Kembali ke Beranda
            </Button>
          </Link>
        </BottomBar>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper">
      <TopBar
        title="Tarik Pendapatan"
        onBack={() => (step > 0 ? setStep((step - 1) as 0 | 1) : router.push('/home'))}
      />

      <div className="px-5 py-3 max-w-md mx-auto">
        {/* Step 0: Pilih metode */}
        {step === 0 && (
          <>
            {/* Balance card */}
            <div className="bg-green-700 text-green-50 rounded-md p-[18px] mb-5 relative overflow-hidden">
              <div className="absolute -right-5 -top-5 w-[120px] h-[120px] rounded-pill bg-green-600 opacity-50" />
              <div className="relative">
                <div className="eyebrow text-green-50/70">Saldo Tersedia</div>
                <div className="figure text-[28px] text-green-50 mt-1">
                  {fmtIDR(balance)}
                </div>
              </div>
            </div>

            <h3 className="font-display text-[20px] mb-3">Pilih metode</h3>
            <div className="space-y-2">
              {METHODS.map((m) => (
                <label
                  key={m.id}
                  className={`
                    flex items-center gap-3 p-3.5 bg-white rounded-sm cursor-pointer
                    transition-all
                    ${
                      method === m.id
                        ? 'border-[1.5px] border-green-700 bg-green-50/30'
                        : 'border-[1.5px] border-ink-200 hover:border-green-300'
                    }
                  `}
                >
                  <input
                    type="radio"
                    checked={method === m.id}
                    onChange={() => setMethod(m.id)}
                    className="w-4 h-4 accent-green-700 cursor-pointer"
                  />
                  <span className="text-xl">{m.icon}</span>
                  <span className="text-[15px] font-semibold flex-1">{m.label}</span>
                </label>
              ))}
            </div>
          </>
        )}

        {/* Step 1: Konfirmasi */}
        {step === 1 && (
          <>
            <h2 className="display-sm mb-4">Konfirmasi Penarikan</h2>
            <Card className="mb-3">
              <div className="flex justify-between py-2 text-sm">
                <span className="text-ink-500">Jumlah</span>
                <b className="text-ink-900 figure">{fmtIDR(balance)}</b>
              </div>
              <div className="flex justify-between py-2 border-t border-[rgba(15,23,42,0.06)] text-sm">
                <span className="text-ink-500">Metode</span>
                <b className="text-ink-900">{method}</b>
              </div>
              <div className="flex justify-between py-2 border-t border-[rgba(15,23,42,0.06)] text-sm">
                <span className="text-ink-500">Estimasi waktu</span>
                <b className="text-ink-900">1×24 jam</b>
              </div>
              <div className="flex justify-between py-2 border-t border-[rgba(15,23,42,0.06)] text-sm">
                <span className="text-ink-500">Biaya admin</span>
                <b className="text-green-700">Gratis</b>
              </div>
            </Card>
            <div className="p-3.5 bg-info-soft text-info text-xs rounded-sm">
              Setelah konfirmasi, dana akan dikirim ke akun {method} terdaftar.
              Untuk perubahan akun, hubungi customer service.
            </div>
          </>
        )}
      </div>

      <BottomBar>
        <Button
          size="lg"
          fullWidth
          onClick={() => (step === 0 ? setStep(1) : handleConfirm())}
          disabled={submitting}
          loading={submitting}
        >
          {step === 0 ? 'Lanjut' : 'Konfirmasi Penarikan'}
        </Button>
      </BottomBar>
    </div>
  );
}