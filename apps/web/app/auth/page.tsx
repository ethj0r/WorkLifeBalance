'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Info, Loader2 } from 'lucide-react';
import { TopBar } from '@/components/ui/Layout';
import { Button } from '@/components/ui/Button';
import { Field, PhoneField } from '@/components/ui/FormFields';
import { sendOtpAction } from './actions';

export default function AuthPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cleanPhone = phone.replace(/\D/g, '');
  const isValidPhone = cleanPhone.length >= 9 && cleanPhone.length <= 13;

  const handleSubmit = async () => {
    if (!isValidPhone) {
      setError('Format nomor HP tidak valid');
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      const fullNumber = '+62' + cleanPhone.replace(/^0/, '');
      const result = await sendOtpAction(fullNumber);

      if (result.success) {
        router.push(`/auth/otp?phone=${encodeURIComponent(fullNumber)}`);
      } else {
        setError(result.error || 'Gagal kirim OTP');
        setSubmitting(false);
      }
    } catch (err) {
      console.error(err);
      setError('Terjadi kesalahan. Coba lagi.');
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper">
      <TopBar title="" onBack={() => router.push('/')} />

      <div className="px-5 py-3 max-w-md mx-auto">
        <h1 className="display-sm mb-2">Masuk dengan nomor HP</h1>
        <p className="text-sm text-ink-500 mb-6">
          Kami akan kirim kode OTP via WhatsApp untuk verifikasi.
        </p>

        <Field
          label="Nomor HP"
          hint="Pastikan nomor aktif untuk menerima OTP"
          error={error || undefined}
        >
          <PhoneField
            value={phone}
            onChange={setPhone}
            placeholder="812 3456 7890"
          />
        </Field>

        <Button
          size="lg"
          fullWidth
          onClick={handleSubmit}
          disabled={!isValidPhone || submitting}
          loading={submitting}
          className="mt-6"
        >
          Kirim Kode OTP
        </Button>

        {/* Demo hint card */}
        <div className="mt-5 p-3.5 bg-earth-50 border border-earth-200 rounded-sm flex gap-2.5">
          <Info
            size={16}
            strokeWidth={1.75}
            className="text-earth-700 flex-shrink-0 mt-0.5"
          />
          <div className="text-xs text-earth-700 leading-relaxed">
            <b>Mode Demo:</b> kode OTP selalu <b className="font-mono">123456</b>.
            Production akan kirim OTP real via WhatsApp Business API.
          </div>
        </div>

        {/* Privacy note */}
        <div className="mt-4 text-xs text-ink-500 text-center leading-relaxed">
          Dengan masuk, Anda menyetujui{' '}
          <a href="#" className="text-green-700">
            Syarat & Ketentuan
          </a>{' '}
          dan{' '}
          <a href="#" className="text-green-700">
            Kebijakan Privasi
          </a>{' '}
          CarbonLink.
        </div>
      </div>
    </div>
  );
}