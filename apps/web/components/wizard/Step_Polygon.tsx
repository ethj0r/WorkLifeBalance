'use client';

import { useCallback, useState } from 'react';
import { Info, Circle } from 'lucide-react';
import { useWizard } from './WizardContext';
import { DrawPolygonMap } from '@/components/map/DrawPolygonMap';
import { Button } from '@/components/ui/Button';
import { Field, TextInput } from '@/components/ui/FormFields';
import { fmtArea } from '@/lib/utils';

// Default center kalau user skip step Location (edge case)
const FALLBACK_CENTER: [number, number] = [-6.8167, 107.0167];

export function Step_Polygon() {
  const { form, updateForm } = useWizard();
  const [mode, setMode] = useState<'draw' | 'radius'>('draw');
  const [radius, setRadius] = useState<string>('50'); // meter

  const center: [number, number] =
    form.center_lat && form.center_lng
      ? [form.center_lat, form.center_lng]
      : FALLBACK_CENTER;

  const handlePolygonChange = useCallback(
    (geojson: GeoJSON.Polygon | null, areaHa: number) => {
      updateForm({
        polygon_geojson: geojson || undefined,
        area_hectares: areaHa,
      });
    },
    [updateForm]
  );

  // Generate circle polygon dari radius (fallback mode)
  const generateRadiusPolygon = () => {
    const radiusM = parseFloat(radius);
    if (isNaN(radiusM) || radiusM < 10 || radiusM > 1000) return;

    const [lat, lng] = center;
    const earthRadius = 6371000; // meters
    const numPoints = 32;
    const coords: [number, number][] = [];

    for (let i = 0; i < numPoints; i++) {
      const angle = (i * 2 * Math.PI) / numPoints;
      const dLat = (radiusM / earthRadius) * (180 / Math.PI);
      const dLng =
        ((radiusM / earthRadius) * (180 / Math.PI)) /
        Math.cos((lat * Math.PI) / 180);

      coords.push([
        lng + dLng * Math.cos(angle),
        lat + dLat * Math.sin(angle),
      ]);
    }
    coords.push(coords[0]); // close ring

    const areaHa = (Math.PI * radiusM * radiusM) / 10000;
    updateForm({
      polygon_geojson: {
        type: 'Polygon',
        coordinates: [coords],
      },
      area_hectares: areaHa,
    });
  };

  return (
    <div className="animate-fade-in">
      <h2 className="font-display text-[24px] mb-1">Gambar batas lahan</h2>
      <p className="text-sm text-ink-500 mb-4">
        {mode === 'draw'
          ? 'Tap di peta untuk menandai sudut-sudut lahan.'
          : 'Pakai radius dari titik tengah sebagai estimasi.'}
      </p>

      {/* Mode toggle */}
      <div className="flex gap-2 mb-4 p-1 bg-ink-50 rounded-sm w-fit">
        <button
          type="button"
          onClick={() => setMode('draw')}
          className={`px-3 py-1.5 text-[13px] font-semibold rounded-xs transition-all ${
            mode === 'draw'
              ? 'bg-white text-ink-900 shadow-xs'
              : 'text-ink-500 hover:text-ink-700'
          }`}
        >
          Gambar polygon
        </button>
        <button
          type="button"
          onClick={() => setMode('radius')}
          className={`px-3 py-1.5 text-[13px] font-semibold rounded-xs transition-all ${
            mode === 'radius'
              ? 'bg-white text-ink-900 shadow-xs'
              : 'text-ink-500 hover:text-ink-700'
          }`}
        >
          Radius
        </button>
      </div>

      {/* Draw mode */}
      {mode === 'draw' && (
        <DrawPolygonMap
          center={center}
          zoom={17}
          height={380}
          onPolygonChange={handlePolygonChange}
        />
      )}

      {/* Radius mode (fallback untuk petani yang tidak yakin batasnya) */}
      {mode === 'radius' && (
        <div className="space-y-4">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <Field
                label="Radius (meter)"
                hint="Antara 10–1000 meter"
              >
                <TextInput
                  type="number"
                  value={radius}
                  onChange={(e) => setRadius(e.target.value)}
                  inputMode="numeric"
                  min={10}
                  max={1000}
                />
              </Field>
            </div>
            <Button onClick={generateRadiusPolygon} variant="secondary">
              Generate
            </Button>
          </div>

          {form.area_hectares && form.area_hectares > 0 && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-sm flex items-center gap-3">
              <Circle
                size={18}
                strokeWidth={1.75}
                className="text-green-700"
              />
              <div className="flex-1">
                <div className="text-[13px] text-green-700 font-semibold">
                  Lingkaran berhasil di-generate
                </div>
                <div className="text-xs text-green-700/80 mt-0.5">
                  Luas: {fmtArea(form.area_hectares)} · radius {radius} m
                </div>
              </div>
            </div>
          )}

          <div className="p-3 bg-earth-50 rounded-sm text-xs text-earth-700 flex gap-2">
            <Info size={14} strokeWidth={1.75} className="flex-shrink-0 mt-0.5" />
            <span>
              <b>Mode radius adalah estimasi.</b> Untuk akurasi lebih baik,
              gunakan mode &ldquo;Gambar polygon&rdquo;. Verifikasi satelit
              tetap berjalan, tapi confidence score mungkin lebih rendah.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}