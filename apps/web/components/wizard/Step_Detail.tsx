'use client';

import { useWizard } from './WizardContext';
import { Field, TextInput, Select, TreeChips } from '@/components/ui/FormFields';
import { TREE_TYPES, type LandType } from '@worklifebalance/types';

const LAND_TYPE_OPTIONS: { value: LandType; label: string; desc: string }[] = [
  {
    value: 'agroforestri',
    label: 'Agroforestri',
    desc: 'Tanaman keras + tanaman semusim',
  },
  {
    value: 'kebun_campur',
    label: 'Kebun Campur',
    desc: 'Berbagai jenis tanaman keras',
  },
  {
    value: 'kebun_monokultur',
    label: 'Kebun Monokultur',
    desc: 'Satu jenis tanaman dominan',
  },
  {
    value: 'sawah_pohon_penyangga',
    label: 'Sawah dengan Pohon Penyangga',
    desc: 'Sawah + pohon di pematang/sekeliling',
  },
  {
    value: 'hutan_adat',
    label: 'Hutan Adat',
    desc: 'Hutan dengan pengelolaan tradisional',
  },
  { value: 'lainnya', label: 'Lainnya', desc: '' },
];

export function Step_Detail() {
  const { form, updateForm } = useWizard();

  const currentYear = new Date().getFullYear();
  const yearError =
    form.managed_since_year &&
    (form.managed_since_year < 1950 || form.managed_since_year > currentYear)
      ? `Tahun harus antara 1950–${currentYear}`
      : undefined;

  return (
    <div className="animate-fade-in">
      <h2 className="font-display text-[24px] mb-1">Detail lahan</h2>
      <p className="text-sm text-ink-500 mb-5">
        Informasi ini meningkatkan akurasi verifikasi.
      </p>

      <div className="flex flex-col gap-5">
        <Field label="Jenis lahan" required>
          <Select
            value={form.land_type || ''}
            onChange={(e) =>
              updateForm({ land_type: e.target.value as LandType })
            }
          >
            <option value="">— Pilih jenis lahan —</option>
            {LAND_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
                {o.desc && ` — ${o.desc}`}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          label="Tahun mulai dikelola"
          required
          error={yearError}
          hint={!yearError ? 'Tahun mulai lahan ini ditanam/dikelola' : undefined}
        >
          <TextInput
            type="number"
            value={form.managed_since_year?.toString() || ''}
            onChange={(e) => {
              const v = parseInt(e.target.value);
              updateForm({
                managed_since_year: isNaN(v) ? undefined : v,
              });
            }}
            placeholder="2008"
            inputMode="numeric"
            min={1950}
            max={currentYear}
            hasError={!!yearError}
          />
        </Field>

        <Field
          label="Jenis pohon dominan"
          required
          hint={
            form.dominant_tree_types.length === 0
              ? 'Pilih minimal 1 jenis'
              : `${form.dominant_tree_types.length} jenis dipilih`
          }
        >
          <TreeChips
            options={TREE_TYPES}
            value={form.dominant_tree_types}
            onChange={(next) => updateForm({ dominant_tree_types: next })}
          />
        </Field>

        <Field
          label="Estimasi jumlah pohon"
          hint="Tidak yakin? Lewati — sistem akan hitung dari foto + satelit"
        >
          <TextInput
            type="number"
            value={form.estimated_tree_count?.toString() || ''}
            onChange={(e) => {
              const v = parseInt(e.target.value);
              updateForm({
                estimated_tree_count: isNaN(v) ? undefined : v,
              });
            }}
            placeholder="Opsional"
            inputMode="numeric"
            min={1}
          />
        </Field>
      </div>

      {/* Info card untuk methodology — surface ke juri */}
      {form.land_type && form.dominant_tree_types.length > 0 && (
        <div className="mt-5 p-3.5 bg-info-soft rounded-md text-xs text-info">
          <b>Carbon estimation methodology:</b> IPCC Tier 1 untuk{' '}
          <span className="lowercase">
            {LAND_TYPE_OPTIONS.find((o) => o.value === form.land_type)?.label}
          </span>{' '}
          tropis. Biomass per hektar dihitung berdasarkan jenis pohon dominan
          dan umur pengelolaan.
        </div>
      )}
    </div>
  );
}