"use client";
import { useState, type ReactNode } from "react";
import { Info, ShieldCheck, Smartphone, Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Field, PhoneField } from "@/components/ui/Field";
import { PublicHeader } from "@/components/ui/AppHeader";
import { Card } from "@/components/ui/Card";
import { setPendingPhone } from "@/lib/session";

export default function LoginPage() {
  const [phone, setPhone] = useState("812 3456 7890");
  const router = useRouter();

  function handleSend() {
    const normalised = phone.trim();
    setPendingPhone(normalised);
    router.push(`/otp?phone=${encodeURIComponent(normalised)}`);
  }

  return (
    <main className="web-page">
      <PublicHeader />
      <section className="web-container auth-shell">
        <div>
          <div className="mb-4 inline-flex rounded-full bg-green-50 px-4 py-2 text-xs font-bold uppercase tracking-[.14em] text-green-700">Masuk</div>
          <h1 className="display-lg max-w-3xl">Verifikasi ringan, akses pendapatan carbon credit.</h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-ink-600">Gunakan nomor HP aktif. OTP demo dikirim secara mock agar flow bisa dites cepat untuk hackathon dan final project.</p>
          <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">
            <Feature icon={<Smartphone className="h-5 w-5" />} title="OTP WhatsApp" />
            <Feature icon={<ShieldCheck className="h-5 w-5" />} title="Data aman" />
            <Feature icon={<Wallet className="h-5 w-5" />} title="E-wallet ready" />
          </div>
        </div>
        <Card className="auth-card">
          <h2 className="display-sm">Masuk dengan nomor HP</h2>
          <p className="mt-2 text-sm leading-6 text-ink-500">Kami akan kirim kode OTP via WhatsApp untuk verifikasi.</p>
          <div className="mt-8">
            <Field label="Nomor HP" hint="Pastikan nomor aktif untuk menerima OTP">
              <PhoneField value={phone} onChange={setPhone} />
            </Field>
          </div>
          <Button fullWidth size="lg" className="mt-6" onClick={handleSend}>Kirim Kode OTP</Button>
          <div className="mt-5 flex gap-2 rounded-lg bg-earth-50 p-3 text-xs text-earth-700">
            <Info className="h-4 w-4 flex-none" />
            <span>Demo: kode OTP adalah <b>123456</b></span>
          </div>
        </Card>
      </section>
    </main>
  );
}

function Feature({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-[rgba(15,23,42,.08)] bg-white/70 p-4 text-sm font-semibold text-ink-700">
      <span className="text-green-700">{icon}</span>{title}
    </div>
  );
}