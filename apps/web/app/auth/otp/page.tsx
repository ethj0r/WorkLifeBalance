'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { TopBar } from '@/components/ui/Layout';
import { verifyOtpAction } from '../actions';

function OtpPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phone = searchParams.get('phone') || '';

  const [code, setCode] = useState<string[]>(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(60);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer
  useEffect(() => {
    if (timer === 0) return;
    const t = setInterval(() => setTimer((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [timer]);

  // Auto-focus first input on mount
  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  // Auto-submit when all 6 digits entered
  useEffect(() => {
    const fullCode = code.join('');
    if (fullCode.length === 6 && !verifying) {
      handleVerify(fullCode);
    }
  }, [code]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (idx: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...code];
    next[idx] = digit;
    setCode(next);

    if (digit && idx < 5) {
      inputsRef.current[idx + 1]?.focus();
    }
    setError(null);
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[idx] && idx > 0) {
      inputsRef.current[idx - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setCode(pasted.split(''));
      inputsRef.current[5]?.focus();
    }
  };

  const handleVerify = async (fullCode: string) => {
    setVerifying(true);
    setError(null);

    try {
      const result = await verifyOtpAction(phone, fullCode);

      if (result.success) {
        // First-time user → onboarding, returning user → home
        router.push(result.isNewUser ? '/onboarding' : '/home');
      } else {
        setError(result.error || 'Kode OTP salah');
        setCode(['', '', '', '', '', '']);
        inputsRef.current[0]?.focus();
        setVerifying(false);
      }
    } catch (err) {
      console.error(err);
      setError('Terjadi kesalahan. Coba lagi.');
      setVerifying(false);
    }
  };

  const handleResend = () => {
    setTimer(60);
    setCode(['', '', '', '', '', '']);
    setError(null);
    inputsRef.current[0]?.focus();
    // TODO: call resendOtpAction kalau real OTP integration
  };

  // Display formatted phone for user
  const displayPhone = phone.startsWith('+62')
    ? '+62 ' + phone.slice(3, 6) + ' ' + phone.slice(6, 10) + ' ' + phone.slice(10)
    : phone;

  return (
    <div className="min-h-screen bg-paper">
      <TopBar
        title="Verifikasi OTP"
        onBack={() => router.push('/auth')}
      />

      <div className="px-5 py-3 max-w-md mx-auto">
        <p className="text-sm text-ink-700 mb-6">
          Masukkan 6 digit kode yang dikirim ke{' '}
          <b className="text-ink-900">{displayPhone}</b>
        </p>

        {/* OTP input boxes */}
        <div className="flex gap-2 justify-between mb-5">
          {code.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { inputsRef.current[i] = el; }}
              type="text"
              inputMode="numeric"
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onPaste={handlePaste}
              maxLength={1}
              disabled={verifying}
              aria-label={`Digit ${i + 1}`}
              className={`
                w-12 h-14 text-2xl font-medium text-center
                font-display tracking-[-0.01em] text-ink-900
                rounded-md outline-none transition-all bg-white
                border-[1.5px] disabled:opacity-50
                ${
                  digit
                    ? 'border-green-600 bg-green-50/30'
                    : 'border-ink-200 focus:border-green-600 focus:ring-2 focus:ring-green-100'
                }
                ${error ? 'border-danger' : ''}
              `}
            />
          ))}
        </div>

        {/* Error or verifying state */}
        {verifying && (
          <div className="text-center text-sm text-ink-500 flex items-center justify-center gap-2 mb-4">
            <Loader2 size={14} className="animate-spin" />
            Memverifikasi...
          </div>
        )}
        {error && (
          <div className="text-center text-sm text-danger mb-4">{error}</div>
        )}

        {/* Resend timer */}
        <div className="text-center text-[13px] text-ink-500">
          {timer > 0 ? (
            <>
              Kirim ulang dalam{' '}
              <b className="text-ink-700 font-mono">{timer}s</b>
            </>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              className="text-green-700 font-semibold border-0 bg-transparent cursor-pointer"
            >
              Kirim ulang OTP
            </button>
          )}
        </div>

        {/* Demo hint */}
        <div className="mt-6 text-center text-xs text-ink-400">
          Demo: ketik <b className="font-mono text-ink-600">123456</b>
        </div>
      </div>
    </div>
  );
}

export default function OtpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-paper" />}>
      <OtpPageInner />
    </Suspense>
  );
}