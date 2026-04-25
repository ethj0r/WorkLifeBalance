"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PublicHeader } from "@/components/ui/AppHeader";
import { Card } from "@/components/ui/Card";

export default function OTPPage() {
  const router = useRouter();
  const params = useSearchParams();
  const phone = params.get("phone") || "812 3456 7890";
  const [timer, setTimer] = useState(60);
  const [code, setCode] = useState(Array(6).fill(""));
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  useEffect(() => { const t = setInterval(() => setTimer((s) => Math.max(0, s - 1)), 1000); return () => clearInterval(t); }, []);
  function handle(i: number, value: string) {
    const next = [...code]; next[i] = value.slice(-1); setCode(next);
    if (value && i < 5) refs.current[i + 1]?.focus();
    if (next.join("") === "123456") setTimeout(() => router.push("/profile"), 350);
  }
  return (
    <main className="web-page">
      <PublicHeader />
      <section className="web-container auth-shell">
        <div>
          <div className="mb-4 inline-flex rounded-full bg-green-50 px-4 py-2 text-xs font-bold uppercase tracking-[.14em] text-green-700">Verifikasi OTP</div>
          <h1 className="display-lg max-w-3xl">Satu langkah lagi untuk masuk ke CarbonLink.</h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-ink-600">Kode 6 digit memastikan akun terhubung dengan nomor yang benar sebelum data lahan dibuat.</p>
        </div>
        <Card className="auth-card">
          <h2 className="display-sm">Masukkan kode OTP</h2>
          <p className="mt-2 text-sm leading-6 text-ink-700">Kode dikirim ke <b>+62 {phone}</b></p>
          <div className="mt-8 grid grid-cols-6 gap-3">
            {code.map((v, i) => <input key={i} ref={(el) => { refs.current[i] = el; }} inputMode="numeric" maxLength={1} value={v} onChange={(e) => handle(i, e.target.value)} className={`h-16 rounded-[14px] border bg-white text-center font-display text-3xl font-semibold outline-none transition ${v ? "border-green-600 shadow-[0_0_0_3px_rgba(47,104,64,.18)]" : "border-ink-200"}`} />)}
          </div>
          <div className="mt-6 text-center text-sm text-ink-500">{timer > 0 ? <>Kirim ulang dalam <b>{timer}s</b></> : <button onClick={() => setTimer(60)} className="font-semibold text-green-700">Kirim ulang OTP</button>}</div>
          <div className="mt-5 rounded-lg bg-earth-50 p-3 text-center text-xs text-earth-700">Demo: ketik <b>123456</b></div>
        </Card>
      </section>
    </main>
  );
}
