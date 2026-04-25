'use client';

import { useState, useCallback } from 'react';
import { useWizard } from './WizardContext';
import { Field, TextInput } from '@/components/ui/FormFields';
import { AddressAutocomplete } from '@/components/map/AddressAutocomplete';
import { LeafletMap } from '@/components/map/LeafletMap';

// Default center: Cianjur, Jawa Barat (representative lokasi petani agroforestri)
const DEFAULT_CENTER: [number, number] = [-6.8167, 107.0167];

export function Step_Location() {
  const { form, updateForm } = useWizard();
  const [mapCenter, setMapCenter] = useState<[number, number]>(
    form.center_lat && form.center_lng
      ? [form.center_lat, form.center_lng]
      : DEFAULT_CENTER
  );
  const [hasSetLocation, setHasSetLocation] = useState(
    !!(form.center_lat && form.center_lng)
  );

  const handleAddressSelect = useCallback(
    (lat: number, lng: number, displayName: string) => {
      setMapCenter([lat, lng]);
      setHasSetLocation(true);
      updateForm({
        address: displayName,
        center_lat: lat,
        center_lng: lng,
      });
    },
    [updateForm]
  );

  const handleUseMyLocation = useCallback(
    (lat: number, lng: number) => {
      setMapCenter([lat, lng]);
      setHasSetLocation(true);
      updateForm({
        center_lat: lat,
        center_lng: lng,
      });
      // Reverse geocode untuk dapat address (nice to have, not blocking)
      reverseGeocode(lat, lng).then((addr) => {
        if (addr) updateForm({ address: addr });
      });
    },
    [updateForm]
  );

  return (
    <div className="animate-fade-in">
      <h2 className="font-display text-[24px] mb-1">Di mana lahannya?</h2>
      <p className="text-sm text-ink-500 mb-5">
        Ketik alamat atau pakai lokasi sekarang.
      </p>

      <div className="flex flex-col gap-4">
        <Field label="Nama lahan" required hint="Contoh: Kebun Kopi Sumber Asih">
          <TextInput
            value={form.plot_name}
            onChange={(e) => updateForm({ plot_name: e.target.value })}
            placeholder="Beri nama agar mudah dikenali"
            maxLength={80}
          />
        </Field>

        <Field label="Alamat lahan" required>
          <AddressAutocomplete
            value={form.address}
            onChange={(v) => updateForm({ address: v })}
            onLocationSelect={handleAddressSelect}
            placeholder="Cari kelurahan, kecamatan, atau landmark..."
          />
        </Field>

        {/* Map — auto-pan ke alamat yang di-select */}
        <div>
          <div className="text-[13px] font-semibold text-ink-700 mb-1.5">
            Peta lokasi
          </div>
          <LeafletMap
            center={mapCenter}
            zoom={hasSetLocation ? 17 : 13}
            height={280}
            showMarker
            onLocationChange={handleUseMyLocation}
          />
          {!hasSetLocation && (
            <div className="mt-2 text-xs text-ink-500 italic">
              Cari alamat di atas atau klik &ldquo;Lokasi Saya&rdquo; untuk
              auto-pan peta.
            </div>
          )}
          {hasSetLocation && (
            <div className="mt-2 text-xs text-green-700 flex items-center gap-1.5">
              <span>📍</span>
              <span>
                Koordinat: {form.center_lat?.toFixed(5)},{' '}
                {form.center_lng?.toFixed(5)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Reverse geocode helper — Nominatim (gratis, no API key)
async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?` +
        new URLSearchParams({
          lat: lat.toString(),
          lon: lng.toString(),
          format: 'json',
          'accept-language': 'id',
        })
    );
    const data = await res.json();
    return data.display_name || null;
  } catch {
    return null;
  }
}