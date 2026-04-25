'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { MapPin, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import 'leaflet/dist/leaflet.css';

// Leaflet harus di-load client-side only (window dependency)
const MapContainer = dynamic(
  () => import('react-leaflet').then((m) => m.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((m) => m.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((m) => m.Marker),
  { ssr: false }
);

interface LeafletMapProps {
  center?: [number, number]; // [lat, lng]
  zoom?: number;
  height?: number;
  showMarker?: boolean;
  onLocationChange?: (lat: number, lng: number) => void;
  children?: React.ReactNode; // untuk DrawPolygonLayer dll
}

// Controller component untuk programmatic map control
function MapController({
  center,
  zoom,
}: {
  center?: [number, number];
  zoom?: number;
}) {
  const [map, setMap] = useState<any>(null);

  useEffect(() => {
    if (!map || !center) return;
    map.flyTo(center, zoom || 17, { duration: 1.2 });
  }, [map, center, zoom]);

  // Hook ke MapContainer
  useEffect(() => {
    if (typeof window === 'undefined') return;
    import('react-leaflet').then(({ useMap }) => {
      // useMap hanya bisa di-call dari component dalam MapContainer
      // jadi kita pakai pattern ref via whenReady di parent
    });
  }, []);

  return null;
}

export function LeafletMap({
  center = [-6.8167, 107.0167], // default: Cianjur, Jawa Barat
  zoom = 13,
  height = 300,
  showMarker = true,
  onLocationChange,
  children,
}: LeafletMapProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Fix untuk default marker icons di Leaflet dengan webpack
    if (typeof window !== 'undefined') {
      import('leaflet').then((L) => {
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl:
            'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          iconUrl:
            'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl:
            'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-shadow.png',
        });
      });
    }
  }, []);

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onLocationChange?.(pos.coords.latitude, pos.coords.longitude);
      },
      (err) => console.error('Geolocation error:', err)
    );
  };

  if (!isClient) {
    return (
      <div
        className="rounded-md bg-green-50 flex items-center justify-center"
        style={{ height }}
      >
        <Loader2 className="animate-spin text-green-700" size={24} />
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        className="rounded-md overflow-hidden border border-[rgba(15,23,42,0.08)]"
        style={{ height }}
      >
        <MapContainer
          center={center}
          zoom={zoom}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; Esri'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            maxZoom={19}
          />
          {showMarker && <Marker position={center} />}
          <MapController center={center} zoom={zoom} />
          {children}
        </MapContainer>
      </div>
      {onLocationChange && (
        <Button
          variant="secondary"
          size="sm"
          leftIcon={MapPin}
          onClick={useMyLocation}
          className="absolute top-3 right-3 z-[400] shadow-md"
        >
          Lokasi Saya
        </Button>
      )}
    </div>
  );
}