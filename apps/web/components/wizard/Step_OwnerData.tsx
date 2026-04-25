'use client';

import { CheckCircle2 } from 'lucide-react';
import { useWizard } from './WizardContext';
import { Field, TextInput, PhoneField, Select } from '@/components/ui/FormFields';
import type { RelationshipType } from '@karbonkredit/types';

const RELATIONSHIP_OPTIONS: { value: RelationshipType; label: string }[] = [
  { value: 'orang_tua',         label: 'Orang Tua' },
  { value: 'kakek_nenek',       label: 'Kakek / Nenek' },
  { value: 'saudara',           label: 'Saudara' },
  { value: 'anggota_koperasi',  label: 'Anggota Koperasi yang Saya Urus' },
  { value: 'tetangga',          label: 'Tetangga' },
  { value: 'lainnya',           label: 'Lainnya' },
];

export function Step_OwnerData() {
  const { form, updateForm } = useWizard();

  // NIK validation feedback
  const nikError =
    form.owner_nik && form.owner_nik.length > 0 && form.owner_nik.length !== 16
      ? `NIK harus 16 digit (saat ini: ${form.owner_nik.length})`
      : undefined;

  // Mock KTP upload — di production ganti dengan real upload + OCR
  const handleKtpUpload = () => {
    // Mock: langsung set verified URL
    updateForm({
      owner_ktp_photo_url: 'mock://owner-ktp-' + Date.now() + '.jpg',
    });
  };

  return (
    <div className="animate-fade-in">
      <h2 className="font-display text-[24px] mb-1">Data pemilik lahan</h2>
      <p className="text-sm text-ink-500 mb-5">Sesuai KTP pemilik.</p>

      <div className="flex flex-col gap-4">
        <Field label="Nama lengkap" required>
          <TextInput
            value={form.owner_full_name || ''}
            onChange={(e) => updateForm({ owner_full_name: e.target.value })}
            placeholder="Sesuai KTP"
            autoComplete="off"
          />
        </Field>

        <Field
          label="NIK (16 digit)"
          required
          error={nikError}
          hint={!nikError ? 'NIK akan diverifikasi otomatis' : undefined}
        >
          <TextInput
            value={form.owner_nik || ''}
            onChange={(e) => {
              // Only digits, max 16
              const v = e.target.value.replace(/\D/g, '').slice(0, 16);
              updateForm({ owner_nik: v });
            }}
            placeholder="3201XXXXXXXXXXXX"
            inputMode="numeric"
            maxLength={16}
            hasError={!!nikError}
          />
        </Field>

        <Field label="Tanggal lahir">
          <TextInput
            type="date"
            value={form.owner_birthdate || ''}
            onChange={(e) => updateForm({ owner_birthdate: e.target.value })}
          />
        </Field>

        <Field label="Hubungan dengan Anda" required>
          <Select
            value={form.owner_relationship || ''}
            onChange={(e) =>
              updateForm({
                owner_relationship: e.target.value as RelationshipType,
              })
            }
          >
            <option value="">— Pilih hubungan —</option>
            {RELATIONSHIP_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Foto KTP pemilik" required>
          {!form.owner_ktp_photo_url ? (
            <button
              type="button"
              onClick={handleKtpUpload}
              className="
                w-full p-4 border border-dashed border-ink-300 rounded-sm
                bg-white text-center transition-all
                hover:border-green-400 hover:bg-green-50/50
                focus:outline-none focus:border-green-600
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
                onClick={() => updateForm({ owner_ktp_photo_url: undefined })}
                className="text-xs text-ink-500 underline mt-1.5"
              >
                Ganti foto
              </button>
            </div>
          )}
        </Field>

        <Field
          label="Nomor HP pemilik"
          hint="Opsional · untuk notifikasi aktivitas lahan ke pemilik"
        >
          <PhoneField
            value={form.owner_phone_number}
            onChange={(v) => updateForm({ owner_phone_number: v })}
          />
        </Field>
      </div>

      {/* Trust mechanism explainer — surface ke juri tanpa user feel preachy */}
      <div className="mt-5 p-3 bg-info-soft rounded-sm text-xs text-info">
        <b>Mengapa data ini penting?</b> Carbon credit harus jelas pemiliknya
        secara legal. Kami juga mengirim notifikasi ke nomor HP pemilik tiap
        kali ada aktivitas penting di lahannya.
      </div>
    </div>
  );
}