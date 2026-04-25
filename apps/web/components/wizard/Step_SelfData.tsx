'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, RotateCcw } from 'lucide-react';
import { useWizard } from './WizardContext';
import { Field, TextInput } from '@/components/ui/FormFields';
import { Button } from '@/components/ui/Button';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export function Step_SelfData() {
  const { form, updateForm } = useWizard();
  const [savedIdentity, setSavedIdentity] = useState<{
    full_name: string;
    nik: string;
    ktp_photo_url: string | null;
  } | null>(null);
  const [showForm, setShowForm] = useState(true);

  // Adaptive heading & description based on ownership
  const heading =
    form.ownership === 'on_behalf' ? 'Data diri Anda (Pendaftar)' : 'Data diri Anda';
  const description =
    form.ownership === 'on_behalf'
      ? 'Data ini terpisah dari pemilik lahan. Hanya diminta sekali.'
      : 'Sebagai pemilik dan pendaftar lahan. Hanya diminta sekali.';

  // Fetch saved user_identities — kalau ada, tawarkan auto-fill
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user || cancelled) return;

        const { data } = await supabase
          .from('user_identities')
          .select('full_name, nik, ktp_photo_url')
          .eq('user_id', user.id)
          .maybeSingle();

        if (cancelled) return;
        if (data) {
          setSavedIdentity(data);
          setShowForm(false); // tampilkan opsi "gunakan data tersimpan" dulu
        }
      } catch (err) {
        // Kalau Supabase belum di-setup, fail silently
        console.warn('Could not fetch user identity:', err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const useSavedData = () => {
    if (!savedIdentity) return;
    updateForm({
      registrant_full_name: savedIdentity.full_name,
      registrant_nik: savedIdentity.nik,
      registrant_ktp_photo_url: savedIdentity.ktp_photo_url || undefined,
    });
    setShowForm(false);
  };

  const editData = () => {
    setShowForm(true);
  };

  // NIK validation
  const nikError =
    form.registrant_nik &&
    form.registrant_nik.length > 0 &&
    form.registrant_nik.length !== 16
      ? `NIK harus 16 digit (saat ini: ${form.registrant_nik.length})`
      : undefined;

  // Mock KTP upload
  const handleKtpUpload = () => {
    updateForm({
      registrant_ktp_photo_url: 'mock://registrant-ktp-' + Date.now() + '.jpg',
    });
  };

  return (
    <div className="animate-fade-in">
      <h2 className="font-display text-[24px] mb-1">{heading}</h2>
      <p className="text-sm text-ink-500 mb-5">{description}</p>

      {/* Saved data card — hanya muncul kalau ada saved identity & form disembunyikan */}
      {savedIdentity && !showForm && (
        <div className="mb-5">
          <div className="p-4 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-start gap-3">
              <CheckCircle2
                size={20}
                strokeWidth={1.75}
                className="text-green-700 flex-shrink-0 mt-0.5"
              />
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold text-green-700 mb-1">
                  Data tersimpan terdeteksi
                </div>
                <div className="text-sm text-ink-900 font-semibold">
                  {savedIdentity.full_name}
                </div>
                <div className="text-xs text-ink-500 mt-0.5 font-mono">
                  NIK: {savedIdentity.nik.slice(0, 4)}····{savedIdentity.nik.slice(-4)}
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button size="sm" onClick={useSavedData} fullWidth>
                Gunakan data ini
              </Button>
              <Button
                size="sm"
                variant="secondary"
                leftIcon={RotateCcw}
                onClick={editData}
              >
                Ganti
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Form — shown kalau no saved data, atau user pilih edit */}
      {showForm && (
        <div className="flex flex-col gap-4">
          <Field label="Nama lengkap" required>
            <TextInput
              value={form.registrant_full_name}
              onChange={(e) =>
                updateForm({ registrant_full_name: e.target.value })
              }
              placeholder="Sesuai KTP"
              autoComplete="off"
            />
          </Field>

          <Field
            label="NIK"
            required
            error={nikError}
            hint={!nikError ? '16 digit sesuai KTP' : undefined}
          >
            <TextInput
              value={form.registrant_nik}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, '').slice(0, 16);
                updateForm({ registrant_nik: v });
              }}
              placeholder="3201XXXXXXXXXXXX"
              inputMode="numeric"
              maxLength={16}
              hasError={!!nikError}
            />
          </Field>

          <Field label="Foto KTP" required>
            {!form.registrant_ktp_photo_url ? (
              <button
                type="button"
                onClick={handleKtpUpload}
                className="
                  w-full p-4 border border-dashed border-ink-300 rounded-sm
                  bg-white text-center transition-all
                  hover:border-green-400 hover:bg-green-50/50
                "
              >
                <div className="text-2xl mb-1">📸</div>
                <div className="text-[13px] font-semibold text-ink-700">
                  Tap untuk upload KTP
                </div>
                <div className="text-xs text-ink-500 mt-1">
                  JPG/PNG, maksimal 5 MB
                </div>
              </button>
            ) : (
              <div className="p-4 border border-dashed border-green-400 rounded-sm bg-green-50 text-center">
                <CheckCircle2
                  size={20}
                  strokeWidth={1.75}
                  className="text-green-700 inline-block"
                />
                <div className="text-[13px] font-semibold text-green-700 mt-1">
                  KTP terupload — Verified
                </div>
                <button
                  type="button"
                  onClick={() =>
                    updateForm({ registrant_ktp_photo_url: undefined })
                  }
                  className="text-xs text-ink-500 underline mt-1.5"
                >
                  Ganti foto
                </button>
              </div>
            )}
          </Field>
        </div>
      )}
    </div>
  );
}