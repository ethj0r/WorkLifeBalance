"use client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, TextInput } from "@/components/ui/Field";
import { PublicHeader } from "@/components/ui/AppHeader";
import { useState } from "react";
import { updateProfile, supabaseAvailable } from "@/lib/supabase/client";
import {
  getSession,
  setSession,
  updateSessionProfile,
  DEMO_USER,
} from "@/lib/session";

export default function ProfilePage() {
  const router = useRouter();

  const session = getSession();
  const [name, setName] = useState(session?.display_name || DEMO_USER.display_name);
  const [province, setProvince] = useState(session?.province || DEMO_USER.province);
  const [regency, setRegency] = useState(session?.regency || DEMO_USER.regency);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (saving) return;
    setSaving(true);

    const patch = {
      display_name: name.trim() || DEMO_USER.display_name,
      province: province.trim() || DEMO_USER.province,
      regency: regency.trim() || DEMO_USER.regency,
    };

    try {
      if (supabaseAvailable && session && session.id !== "demo") {
        await updateProfile(session.id, patch);
      }

      if (session) {
        updateSessionProfile(patch);
      } else {
        setSession({ ...DEMO_USER, ...patch });
      }

      router.push("/dashboard");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="web-page">
      <PublicHeader />
      <section className="web-container auth-shell">
        <div>
          <div className="mb-4 inline-flex rounded-full bg-green-50 px-4 py-2 text-xs font-bold uppercase tracking-[.14em] text-green-700">Profil Pengguna</div>
          <h1 className="display-lg max-w-3xl">Kenali pengguna sebelum lahan diverifikasi.</h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-ink-600">Data dasar ini dipakai untuk personalisasi dashboard dan menjadi fondasi data kepemilikan lahan.</p>
        </div>
        <Card className="auth-card">
          <h2 className="display-sm">Halo! Cerita sedikit tentang Anda.</h2>
          <p className="mt-2 text-sm leading-6 text-ink-500">Data dasar saja — detail lain ditanya nanti saat daftarkan lahan.</p>
          <div className="mt-8 grid gap-4">
            <Field label="Nama panggilan">
              <TextInput value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Provinsi">
                <TextInput value={province} onChange={(e) => setProvince(e.target.value)} />
              </Field>
              <Field label="Kabupaten / Kota">
                <TextInput value={regency} onChange={(e) => setRegency(e.target.value)} />
              </Field>
            </div>
          </div>
          <Button fullWidth size="lg" className="mt-8" loading={saving} onClick={handleSave}>
            Mulai Pakai CarbonLink
          </Button>
        </Card>
      </section>
    </main>
  );
}