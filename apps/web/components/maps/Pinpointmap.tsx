"use client";

/**
 * PinpointMap.tsx
 *
 * Real interactive map using Leaflet + OpenStreetMap tiles.
 * No API key required. GPS coordinates from browser geolocation API.
 *
 * Features:
 * - Real OSM tile layer (street-level data)
 * - Click anywhere to place / move pin
 * - Drag pin directly
 * - "Gunakan Lokasi Saya" via navigator.geolocation
 * - Reverse geocode display via Nominatim (OSM, free)
 * - Coordinate readout chip
 * - Safe SSR: Leaflet only imported client-side via dynamic import
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { MapPin, Loader2, Navigation, AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

// ── Types ────────────────────────────────────────────────────────────────────

export type LatLng = { lat: number; lng: number };

type Props = {
  value: LatLng | null;
  onChange: (latlng: LatLng | null) => void;
  height?: number;
};

// ── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_CENTER: LatLng = { lat: -6.82, lng: 107.14 }; // Cianjur, West Java
const DEFAULT_ZOOM = 11;
const PIN_ZOOM = 15; // zoom in when pin is placed / geo success

// ── Reverse geocode via Nominatim (free, no key) ─────────────────────────────

async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=id`;
    const res = await fetch(url, {
      headers: { "Accept-Language": "id", "User-Agent": "CarbonLink/1.0" },
    });
    if (!res.ok) return null;
    const data = await res.json();
    // Build a short human-readable address
    const addr = data.address ?? {};
    const parts = [
      addr.village ?? addr.suburb ?? addr.neighbourhood,
      addr.city_district ?? addr.county ?? addr.regency,
      addr.state,
    ].filter(Boolean);
    return parts.join(", ") || data.display_name?.split(",").slice(0, 3).join(",") || null;
  } catch {
    return null;
  }
}

// ── Component ────────────────────────────────────────────────────────────────

export function PinpointMap({ value, onChange, height = 440 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  // Store Leaflet map + marker instances in refs (not state, to avoid re-renders)
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const markerRef = useRef<import("leaflet").Marker | null>(null);

  const [mapReady, setMapReady] = useState(false);
  const [geoState, setGeoState] = useState<"idle" | "loading" | "error">("idle");
  const [geoError, setGeoError] = useState("");
  const [address, setAddress] = useState<string | null>(null);
  const [geocoding, setGeocoding] = useState(false);

  // ── Place or move the draggable marker ──────────────────────────────────
  const placeMarker = useCallback(
    async (L: typeof import("leaflet"), map: import("leaflet").Map, latlng: LatLng) => {
      const { lat, lng } = latlng;

      // Custom green pin icon matching CarbonLink style
      const icon = L.divIcon({
        className: "",
        html: `
          <div style="
            position:relative;
            width:36px;
            height:44px;
            filter: drop-shadow(0 3px 6px rgba(0,0,0,0.28));
          ">
            <svg viewBox="0 0 36 44" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:36px;height:44px">
              <path d="M18 0C8.059 0 0 8.059 0 18c0 13.5 18 26 18 26S36 31.5 36 18C36 8.059 27.941 0 18 0z"
                fill="#2F6840"/>
              <circle cx="18" cy="18" r="8" fill="white"/>
              <circle cx="18" cy="18" r="4" fill="#2F6840"/>
            </svg>
            <div style="
              position:absolute;
              bottom:-4px;
              left:50%;
              transform:translateX(-50%);
              width:12px;
              height:4px;
              background:rgba(0,0,0,0.15);
              border-radius:50%;
              filter:blur(2px);
            "></div>
          </div>`,
        iconSize: [36, 44],
        iconAnchor: [18, 44],
        popupAnchor: [0, -44],
      });

      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        const marker = L.marker([lat, lng], { icon, draggable: true });
        marker.addTo(map);
        marker.on("dragend", (e) => {
          const pos = (e.target as import("leaflet").Marker).getLatLng();
          const newLatLng = { lat: pos.lat, lng: pos.lng };
          onChange(newLatLng);
          doReverseGeocode(newLatLng);
        });
        markerRef.current = marker;
      }

      onChange({ lat, lng });
      doReverseGeocode({ lat, lng });
    },
    [onChange]
  );

  // ── Reverse geocode helper ───────────────────────────────────────────────
  const doReverseGeocode = useCallback(async (latlng: LatLng) => {
    setGeocoding(true);
    setAddress(null);
    const result = await reverseGeocode(latlng.lat, latlng.lng);
    setAddress(result);
    setGeocoding(false);
  }, []);

  // ── Init Leaflet (client-side only) ─────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let mounted = true;

    (async () => {
      // Dynamic import ensures Leaflet never runs on the server
      const L = (await import("leaflet")).default;

      // Fix default icon paths broken by Next.js asset pipeline
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      if (!mounted || !containerRef.current) return;

      const initialCenter: [number, number] = value
        ? [value.lat, value.lng]
        : [DEFAULT_CENTER.lat, DEFAULT_CENTER.lng];

      const map = L.map(containerRef.current, {
        center: initialCenter,
        zoom: value ? PIN_ZOOM : DEFAULT_ZOOM,
        zoomControl: true,
        attributionControl: true,
      });

      // OpenStreetMap tile layer — real street data, free, no key
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '© <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      // Click map to place / move pin
      map.on("click", (e: import("leaflet").LeafletMouseEvent) => {
        placeMarker(L, map, { lat: e.latlng.lat, lng: e.latlng.lng });
        map.flyTo(e.latlng, Math.max(map.getZoom(), PIN_ZOOM), {
          animate: true,
          duration: 0.6,
        });
      });

      mapRef.current = map;

      // If value already exists (e.g. returning to step), place marker immediately
      if (value) {
        await placeMarker(L, map, value);
      }

      if (mounted) setMapReady(true);
    })();

    return () => {
      mounted = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Sync external value changes (e.g. geolocation) into the map ─────────
  useEffect(() => {
    if (!mapReady || !value) return;
    const L = mapRef.current;
    if (!L) return;

    // Move marker to new position if it already exists
    if (markerRef.current) {
      markerRef.current.setLatLng([value.lat, value.lng]);
    }
  }, [value, mapReady]);

  // ── "Gunakan Lokasi Saya" ────────────────────────────────────────────────
  const useMyLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setGeoError("Browser tidak mendukung geolokasi.");
      setGeoState("error");
      return;
    }
    setGeoState("loading");
    setGeoError("");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const latlng: LatLng = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };

        const map = mapRef.current;
        if (map) {
          const L = (await import("leaflet")).default;
          await placeMarker(L, map, latlng);
          map.flyTo([latlng.lat, latlng.lng], PIN_ZOOM, {
            animate: true,
            duration: 1.2,
          });
        }

        setGeoState("idle");
      },
      (err) => {
        const msgs: Record<number, string> = {
          1: "Izin lokasi ditolak. Aktifkan di pengaturan browser.",
          2: "Posisi tidak tersedia saat ini.",
          3: "Waktu habis mengambil lokasi.",
        };
        setGeoError(msgs[err.code] ?? "Gagal mengambil lokasi.");
        setGeoState("error");
      },
      { timeout: 10000, enableHighAccuracy: true, maximumAge: 0 }
    );
  }, [placeMarker]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-3">
      {/* Map container */}
      <div
        className="relative w-full overflow-hidden rounded-2xl border border-[rgba(15,23,42,.1)] shadow-sm"
        style={{ height }}
      >
        {/* Leaflet CSS — injected once */}
        {/* eslint-disable-next-line @next/next/no-css-tags */}
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          crossOrigin=""
        />

        {/* Map DOM target */}
        <div ref={containerRef} className="h-full w-full" />

        {/* Loading skeleton while Leaflet initialises */}
        {!mapReady && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#EDF4F0]">
            <Loader2 className="h-8 w-8 animate-spin text-green-600" />
            <span className="text-sm font-medium text-green-800">
              Memuat peta…
            </span>
          </div>
        )}

        {/* "Klik peta" hint overlay — shown only before pin is placed */}
        {mapReady && !value && (
          <div className="pointer-events-none absolute bottom-10 left-1/2 -translate-x-1/2">
            <div className="flex items-center gap-2 rounded-full border border-green-200 bg-white/90 px-4 py-2 shadow-sm backdrop-blur-sm">
              <MapPin className="h-4 w-4 text-green-700" />
              <span className="text-[13px] font-semibold text-green-800">
                Klik peta untuk pasang titik lahan
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Coordinate + address readout */}
      {value && (
        <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
          <MapPin className="mt-0.5 h-4 w-4 flex-none text-green-700" />
          <div className="min-w-0 flex-1">
            <div className="font-mono text-[13px] font-semibold text-green-800">
              {value.lat.toFixed(6)}°, {value.lng.toFixed(6)}°
            </div>
            {geocoding && (
              <div className="mt-0.5 flex items-center gap-1.5 text-xs text-green-600">
                <Loader2 className="h-3 w-3 animate-spin" />
                Mengambil nama lokasi…
              </div>
            )}
            {!geocoding && address && (
              <div className="mt-0.5 text-xs text-green-700">{address}</div>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              if (markerRef.current) {
                markerRef.current.remove();
                markerRef.current = null;
              }
              setAddress(null);
              onChange(null);
            }}
            className="flex-none rounded-full p-1 text-green-500 hover:bg-green-100 hover:text-green-700"
            aria-label="Hapus pin"
            title="Hapus pin"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Geolocation button */}
      <div className="flex items-center gap-3">
        <Button
          variant="secondary"
          size="sm"
          leftIcon={
            geoState === "loading" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Navigation className="h-4 w-4" />
            )
          }
          onClick={useMyLocation}
          disabled={geoState === "loading"}
        >
          {geoState === "loading" ? "Mengambil lokasi GPS…" : "Gunakan Lokasi Saya"}
        </Button>

        {geoState === "error" && geoError && (
          <span className="flex items-center gap-1.5 text-xs text-[#B23B3B]">
            <AlertCircle className="h-3.5 w-3.5 flex-none" />
            {geoError}
          </span>
        )}
      </div>
    </div>
  );
}