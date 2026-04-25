'use client';

import { useWizard } from './WizardContext';
import { MapPolygon } from '@/components/map/MapPolygon';
import { Card } from '@/components/ui/Card';
import { fmtArea } from '@/lib/utils';

const LAND_TYPE_LABELS: Record<string, string> = {
  agroforestri: 'Agroforestri',
  kebun_campur: 'Kebun Campur',
  kebun_monokultur: 'Kebun Monokultur',
  sawah_pohon_penyangga: 'Sawah dengan Pohon Penyangga',
  hutan_adat: 'Hutan Adat',
  lainnya: 'Lainnya',
};

const RELATIONSHIP_LABELS: Record<string, string> = {
  orang_tua: 'Orang Tua',
  kakek_nenek: 'Kakek / Nenek',
  saudara: 'Saudara',
  anggota_koperasi: 'Anggota Koperasi',
  tetangga: 'Tetangga',
  lainnya: 'Lainnya',
};

export function Step_Review() {
  const { form, updateForm } = useWizard();

  // Generate preview polygon SVG dari GeoJSON
  const polygonSVG = form.polygon_geojson
    ? geoJSONToSVGPoints(form.polygon_geojson)
    : '60,40 220,28 320,70 290,150 110,148 50,110';

  return (
    <div className="animate-fade-in space-y-3">
      <h2 className="font-display text-[24px] mb-1">Review & konfirmasi</h2>
      <p className="text-sm text-ink-500 mb-4">
        Pastikan semua data benar sebelum daftarkan.
      </p>

      {/* Plot section */}
      <Card className="p-4">
        <div className="eyebrow mb-2">Lahan</div>
        <div className="font-display text-[18px] font-medium text-ink-900">
          {form.plot_name || '—'}
        </div>
        <div className="text-[13px] text-ink-500 mt-1">
          {form.address || 'Lokasi belum diset'}
        </div>
        <div className="mt-3">
          <MapPolygon polygon={polygonSVG} height={120} />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="eyebrow">Luas</div>
            <div className="figure text-[18px] mt-0.5">
              {form.area_hectares ? fmtArea(form.area_hectares) : '—'}
            </div>
          </div>
          <div>
            <div className="eyebrow">Jenis</div>
            <div className="text-ink-900 font-semibold mt-0.5">
              {form.land_type ? LAND_TYPE_LABELS[form.land_type] : '—'}
            </div>
          </div>
        </div>
      </Card>

      {/* Pemilik lahan */}
      <Card className="p-4">
        <div className="eyebrow mb-2">Pemilik Lahan</div>
        {form.ownership === 'self' ? (
          <>
            <div className="text-[15px] font-semibold text-ink-900">
              {form.registrant_full_name || '—'}{' '}
              <span className="text-xs font-normal text-ink-500">
                (Anda sendiri)
              </span>
            </div>
            <div className="text-xs text-ink-500 mt-0.5 font-mono">
              NIK: {form.registrant_nik?.slice(0, 4)}····
              {form.registrant_nik?.slice(-4)}
            </div>
          </>
        ) : (
          <>
            <div className="text-[15px] font-semibold text-ink-900">
              {form.owner_full_name || '—'}
            </div>
            <div className="text-xs text-ink-500 mt-0.5 font-mono">
              NIK: {form.owner_nik?.slice(0, 4)}····{form.owner_nik?.slice(-4)}
            </div>
            {form.owner_relationship && (
              <div className="text-xs text-ink-500 mt-1">
                Hubungan dengan Anda:{' '}
                <span className="text-ink-700 font-semibold">
                  {RELATIONSHIP_LABELS[form.owner_relationship]}
                </span>
              </div>
            )}
            {form.owner_phone_number && (
              <div className="text-xs text-ink-500 mt-1">
                Notifikasi akan dikirim ke +62 {form.owner_phone_number}
              </div>
            )}
          </>
        )}
      </Card>

      {/* Pendaftar (kalau on_behalf) */}
      {form.ownership === 'on_behalf' && (
        <Card className="p-4">
          <div className="eyebrow mb-2">Anda sebagai Pendaftar</div>
          <div className="text-[15px] font-semibold text-ink-900">
            {form.registrant_full_name || '—'}
          </div>
          <div className="text-xs text-ink-500 mt-0.5 font-mono">
            NIK: {form.registrant_nik?.slice(0, 4)}····
            {form.registrant_nik?.slice(-4)}
          </div>
        </Card>
      )}

      {/* Pohon dominan */}
      <Card className="p-4">
        <div className="eyebrow mb-2">Pohon Dominan</div>
        <div className="flex flex-wrap gap-1.5">
          {form.dominant_tree_types.length === 0 ? (
            <span className="text-sm text-ink-500">—</span>
          ) : (
            form.dominant_tree_types.map((t) => (
              <span
                key={t}
                className="px-2.5 py-1 rounded-pill bg-green-100 text-green-700 text-xs font-semibold"
              >
                {t}
              </span>
            ))
          )}
        </div>
        {form.managed_since_year && (
          <div className="text-xs text-ink-500 mt-3">
            Dikelola sejak{' '}
            <span className="text-ink-700 font-semibold">
              {form.managed_since_year}
            </span>{' '}
            ({new Date().getFullYear() - form.managed_since_year} tahun)
          </div>
        )}
      </Card>

      {/* Foto */}
      <Card className="p-4">
        <div className="eyebrow mb-2">Foto & Dokumen</div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-ink-700">
            <b>{form.photos.length}</b> foto kondisi lahan
          </span>
          <span className="text-ink-500">
            {form.legal_documents.length} dokumen legal
          </span>
        </div>
      </Card>

      {/* Disclaimer — only for on_behalf */}
      {form.ownership === 'on_behalf' && (
        <div className="p-4 bg-earth-50 border border-earth-200 rounded-md">
          <div className="text-[13px] font-semibold text-earth-700 mb-2 flex items-center gap-1.5">
            <span>⚠</span>
            <span>Pernyataan Hukum</span>
          </div>
          <ol className="text-[13px] text-earth-900 space-y-1 ml-5 list-decimal">
            <li>Saya telah mendapat persetujuan dari pemilik lahan.</li>
            <li>
              Saya akan menyalurkan pendapatan carbon credit kepada pemilik
              sesuai kesepakatan.
            </li>
            <li>Data yang saya berikan adalah benar dan dapat dipertanggungjawabkan.</li>
          </ol>
          <label className="flex gap-2.5 mt-3.5 cursor-pointer items-start">
            <input
              type="checkbox"
              checked={form.consent_acknowledged}
              onChange={(e) =>
                updateForm({ consent_acknowledged: e.target.checked })
              }
              className="mt-0.5 w-4 h-4 accent-green-700 cursor-pointer flex-shrink-0"
            />
            <span className="text-[13px] text-earth-900 font-semibold">
              Saya menyetujui pernyataan di atas dan bersedia bertanggungjawab
              secara hukum.
            </span>
          </label>
        </div>
      )}

      {/* Lighter disclaimer untuk self ownership */}
      {form.ownership === 'self' && (
        <div className="p-3.5 bg-green-50 border border-green-200 rounded-md text-[13px] text-green-700">
          <span className="font-semibold">Saya menyatakan</span> bahwa data
          yang diberikan benar dan lahan ini benar milik saya secara legal.
        </div>
      )}
    </div>
  );
}

// Helper: convert GeoJSON polygon ke SVG points string untuk preview thumbnail
function geoJSONToSVGPoints(polygon: GeoJSON.Polygon): string {
  const ring = polygon.coordinates[0];
  if (!ring || ring.length < 4) return '60,40 220,28 320,70 290,150 110,148 50,110';

  const lngs = ring.map((c) => c[0]);
  const lats = ring.map((c) => c[1]);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const rangeLng = maxLng - minLng || 1;
  const rangeLat = maxLat - minLat || 1;

  return ring
    .slice(0, -1) // remove closing duplicate
    .map((c) => {
      const x = ((c[0] - minLng) / rangeLng) * 320 + 30;
      const y = 150 - ((c[1] - minLat) / rangeLat) * 120 + 15;
      return `${x.toFixed(0)},${y.toFixed(0)}`;
    })
    .join(' ');
}