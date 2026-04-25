'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TopBar, BottomBar } from '@/components/ui/Layout';
import { Button } from '@/components/ui/Button';
import { Field, TextInput, Select } from '@/components/ui/FormFields';
import { saveProfileAction } from './actions';

// Provinces list — disederhanakan untuk demo. Production: full 38 provinsi.
const PROVINCES = [
  'Aceh',
  'Sumatera Utara',
  'Sumatera Barat',
  'Riau',
  'Jambi',
  'Sumatera Selatan',
  'Bengkulu',
  'Lampung',
  'Kepulauan Bangka Belitung',
  'Kepulauan Riau',
  'DKI Jakarta',
  'Jawa Barat',
  'Jawa Tengah',
  'DI Yogyakarta',
  'Jawa Timur',
  'Banten',
  'Bali',
  'Nusa Tenggara Barat',
  'Nusa Tenggara Timur',
  'Kalimantan Barat',
  'Kalimantan Tengah',
  'Kalimantan Selatan',
  'Kalimantan Timur',
  'Kalimantan Utara',
  'Sulawesi Utara',
  'Sulawesi Tengah',
  'Sulawesi Selatan',
  'Sulawesi Tenggara',
  'Gorontalo',
  'Sulawesi Barat',
  'Maluku',
  'Maluku Utara',
  'Papua',
  'Papua Barat',
];

// Subset regencies untuk demo — hanya beberapa province yang detail.
// Production: full kabupaten/kota list dari BPS.
const REGENCIES_BY_PROVINCE: Record<string, string[]> = {
  'Jawa Barat': [
    'Bandung',
    'Bandung Barat',
    'Bekasi',
    'Bogor',
    'Cianjur',
    'Cirebon',
    'Garut',
    'Indramayu',
    'Karawang',
    'Kuningan',
    'Majalengka',
    'Pangandaran',
    'Purwakarta',
    'Subang',
    'Sukabumi',
    'Sumedang',
    'Tasikmalaya',
  ],
  'Jawa Tengah': [
    'Banjarnegara',
    'Banyumas',
    'Batang',
    'Blora',
    'Boyolali',
    'Brebes',
    'Cilacap',
    'Demak',
    'Grobogan',
    'Jepara',
    'Karanganyar',
    'Kebumen',
    'Kendal',
    'Klaten',
    'Kudus',
    'Magelang',
    'Pati',
    'Pekalongan',
    'Pemalang',
    'Purbalingga',
    'Purworejo',
    'Rembang',
    'Semarang',
    'Sragen',
    'Sukoharjo',
    'Tegal',
    'Temanggung',
    'Wonogiri',
    'Wonosobo',
  ],
  'Jawa Timur': [
    'Banyuwangi',
    'Blitar',
    'Bojonegoro',
    'Bondowoso',
    'Gresik',
    'Jember',
    'Jombang',
    'Kediri',
    'Lamongan',
    'Lumajang',
    'Madiun',
    'Magetan',
    'Malang',
    'Mojokerto',
    'Nganjuk',
    'Ngawi',
    'Pacitan',
    'Pamekasan',
    'Pasuruan',
    'Ponorogo',
    'Probolinggo',
    'Sampang',
    'Sidoarjo',
    'Situbondo',
    'Sumenep',
    'Trenggalek',
    'Tuban',
    'Tulungagung',
  ],
};

export default function OnboardingPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [province, setProvince] = useState('');
  const [regency, setRegency] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableRegencies = province
    ? REGENCIES_BY_PROVINCE[province] || []
    : [];

  const isValid =
    name.trim().length >= 2 &&
    name.trim().length <= 50 &&
    province.length > 0 &&
    regency.length > 0;

  const handleSubmit = async () => {
    if (!isValid) return;
    setSubmitting(true);
    setError(null);

    try {
      const result = await saveProfileAction({
        display_name: name.trim(),
        province,
        regency,
      });

      if (result.success) {
        router.push('/home');
      } else {
        setError(result.error || 'Gagal simpan profil');
        setSubmitting(false);
      }
    } catch (err) {
      console.error(err);
      setError('Terjadi kesalahan. Coba lagi.');
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper flex flex-col">
      <TopBar title="" />

      <div className="flex-1 px-5 py-3 max-w-md mx-auto w-full">
        <h1 className="display-sm mb-2">
          Halo! Cerita sedikit tentang Anda.
        </h1>
        <p className="text-sm text-ink-500 mb-6">
          Data dasar saja — detail lain ditanya nanti saat daftarkan lahan.
        </p>

        <div className="space-y-4">
          <Field
            label="Nama panggilan"
            required
            hint="Bukan nama legal. Contoh: Pak Asep, Bu Sari"
          >
            <TextInput
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Pak Asep"
              maxLength={50}
              autoComplete="off"
            />
          </Field>

          <Field label="Provinsi" required>
            <Select
              value={province}
              onChange={(e) => {
                setProvince(e.target.value);
                setRegency(''); // reset regency saat provinsi berubah
              }}
            >
              <option value="">— Pilih provinsi —</option>
              {PROVINCES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            label="Kabupaten / Kota"
            required
            hint={
              !province
                ? 'Pilih provinsi terlebih dahulu'
                : availableRegencies.length === 0
                  ? 'Daftar kabupaten untuk provinsi ini akan ditambahkan'
                  : undefined
            }
          >
            <Select
              value={regency}
              onChange={(e) => setRegency(e.target.value)}
              disabled={!province}
            >
              <option value="">— Pilih kabupaten/kota —</option>
              {availableRegencies.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
              {/* Fallback: free input untuk provinsi yang belum di-list */}
              {province && availableRegencies.length === 0 && (
                <option value="lainnya">Lainnya</option>
              )}
            </Select>
          </Field>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-danger-soft text-danger text-sm rounded-sm">
            {error}
          </div>
        )}

        <div className="mt-6 p-3.5 bg-green-50 border border-green-200 rounded-sm text-xs text-green-700">
          <b>Privasi:</b> Data ini hanya untuk personalisasi konten. NIK, KTP,
          dan dokumen lain akan diminta hanya saat Anda mendaftarkan lahan.
        </div>
      </div>

      <BottomBar>
        <Button
          size="lg"
          fullWidth
          onClick={handleSubmit}
          disabled={!isValid || submitting}
          loading={submitting}
        >
          Mulai Pakai CarbonLink
        </Button>
      </BottomBar>
    </div>
  );
}