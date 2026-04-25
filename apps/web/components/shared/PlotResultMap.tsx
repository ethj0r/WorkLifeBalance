'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import 'leaflet/dist/leaflet.css';

const MapContainer = dynamic(
  () => import('react-leaflet').then((m) => m.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((m) => m.TileLayer),
  { ssr: false }
);

interface PlotResultMapProps {
  polygonGeoJSON: GeoJSON.Polygon;
  ndviScore: number;
  height?: number;
}

/**
 * Read-only map untuk plot result/detail page.
 * Polygon overlay + optional NDVI heatmap toggle.
 */
export function PlotResultMap({'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import 'leaflet/dist/leaflet.css';

const MapContainer = dynamic(
  () => import('react-leaflet').then((m) => m.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((m) => m.TileLayer),
  { ssr: false }
);

interface PlotResultMapProps {
  polygonGeoJSON: GeoJSON.Polygon;
  ndviScore: number;
  height?: number;
}

/**
 * Read-only map untuk plot result/detail page.
 * Polygon overlay + optional NDVI heatmap toggle.
 */
export function PlotResultMap({
  polygonGeoJSON,
  ndviScore,
  height = 280,
}: PlotResultMapProps) {
  const [isClient, setIsClient] = useState(false);
  const [showNDVI, setShowNDVI] = useState(true);

  useEffect(() => setIsClient(true), []);

  // Calculate centroid dari polygon untuk default map center
  const center = calculateCentroid(polygonGeoJSON);

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
    <div className="space-y-2">
      <div
        className="rounded-md overflow-hidden border border-[rgba(15,23,42,0.08)] relative"
        style={{ height }}
      >
        <MapContainer
          center={center}
          zoom={17}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={false}
        >
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            maxZoom={19}
          />
          <PolygonLayer
            polygonGeoJSON={polygonGeoJSON}
            ndviScore={showNDVI ? ndviScore : null}
          />
        </MapContainer>

        {/* Toggle NDVI overlay */}
        <button
          type="button"
          onClick={() => setShowNDVI(!showNDVI)}
          className="
            absolute top-3 right-3 z-[400]
            px-3 py-1.5 rounded-pill bg-white/95 backdrop-blur-sm shadow-md
            text-xs font-semibold text-ink-700 flex items-center gap-1.5
            hover:bg-white transition-colors
          "
        >
          {showNDVI ? (
            <>
              <EyeOff size={12} strokeWidth={2} />
              Sembunyikan NDVI
            </>
          ) : (
            <>
              <Eye size={12} strokeWidth={2} />
              Tampilkan NDVI
            </>
          )}
        </button>

        {/* NDVI legend */}
        {showNDVI && (
          <div className="absolute bottom-3 left-3 z-[400] px-2.5 py-1.5 rounded-sm bg-white/95 backdrop-blur-sm shadow-sm text-[10px]">
            <div className="text-ink-500 font-semibold mb-1">NDVI</div>
            <div className="flex items-center gap-0.5">
              <span className="w-3 h-2.5 bg-[#234D2E] rounded-l-xs" />
              <span className="w-3 h-2.5 bg-[#6FAF6C]" />
              <span className="w-3 h-2.5 bg-[#C9E2C5]" />
              <span className="w-3 h-2.5 bg-[#F1FAF4] rounded-r-xs" />
            </div>
            <div className="flex justify-between mt-0.5 text-[9px] text-ink-500">
              <span>1.0</span>
              <span>0.0</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Inner: render polygon dengan styling. Dipisah karena pakai useMap dari leaflet
// yang butuh dipanggil dalam MapContainer.
// ─────────────────────────────────────────────────────────────
function PolygonLayer({
  polygonGeoJSON,
  ndviScore,
}: {
  polygonGeoJSON: GeoJSON.Polygon;
  ndviScore: number | null;
}) {
  const [Mod, setMod] = useState<any>(null);
  useEffect(() => {
    import('react-leaflet').then(setMod);
  }, []);

  if (!Mod) return null;
  const { Polygon } = Mod;

  // Convert GeoJSON [lng, lat] → Leaflet [lat, lng]
  const positions: [number, number][] = polygonGeoJSON.coordinates[0]
    .slice(0, -1) // remove closing duplicate
    .map((c: number[]) => [c[1], c[0]]);

  // NDVI-based coloring
  const ndviColor =
    ndviScore !== null
      ? ndviScore >= 0.6
        ? '#234D2E' // High density → forest green
        : ndviScore >= 0.4
          ? '#6FAF6C' // Medium → sage
          : '#C9E2C5' // Low → mist green
      : '#234D2E';

  return (
    <Polygon
      positions={positions}
      pathOptions={{
        color: '#234D2E',
        fillColor: ndviColor,
        fillOpacity: ndviScore !== null ? 0.55 : 0.3,
        weight: 2.5,
      }}
    />
  );
}

function calculateCentroid(polygon: GeoJSON.Polygon): [number, number] {
  const ring = polygon.coordinates[0];
  let lat = 0;
  let lng = 0;
  const n = ring.length - 1; // skip closing duplicate
  for (let i = 0; i < n; i++) {
    lng += ring[i][0];
    lat += ring[i][1];
  }
  return [lat / n, lng / n];
}
  polygonGeoJSON,
  ndviScore,
  height = 280,
}: PlotResultMapProps) {
  const [isClient, setIsClient] = useState(false);
  const [showNDVI, setShowNDVI] = useState(true);

  useEffect(() => setIsClient(true), []);

  // Calculate centroid dari polygon untuk default map center
  const center = calculateCentroid(polygonGeoJSON);

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
    <div className="space-y-2">
      <div
        className="rounded-md overflow-hidden border border-[rgba(15,23,42,0.08)] relative"
        style={{ height }}
      >
        <MapContainer
          center={center}
          zoom={17}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={false}
        >
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            maxZoom={19}
          />
          <PolygonLayer
            polygonGeoJSON={polygonGeoJSON}
            ndviScore={showNDVI ? ndviScore : null}
          />
        </MapContainer>

        {/* Toggle NDVI overlay */}
        <button
          type="button"
          onClick={() => setShowNDVI(!showNDVI)}
          className="
            absolute top-3 right-3 z-[400]
            px-3 py-1.5 rounded-pill bg-white/95 backdrop-blur-sm shadow-md
            text-xs font-semibold text-ink-700 flex items-center gap-1.5
            hover:bg-white transition-colors
          "
        >
          {showNDVI ? (
            <>
              <EyeOff size={12} strokeWidth={2} />
              Sembunyikan NDVI
            </>
          ) : (
            <>
              <Eye size={12} strokeWidth={2} />
              Tampilkan NDVI
            </>
          )}
        </button>

        {/* NDVI legend */}
        {showNDVI && (
          <div className="absolute bottom-3 left-3 z-[400] px-2.5 py-1.5 rounded-sm bg-white/95 backdrop-blur-sm shadow-sm text-[10px]">
            <div className="text-ink-500 font-semibold mb-1">NDVI</div>
            <div className="flex items-center gap-0.5">
              <span className="w-3 h-2.5 bg-[#234D2E] rounded-l-xs" />
              <span className="w-3 h-2.5 bg-[#6FAF6C]" />
              <span className="w-3 h-2.5 bg-[#C9E2C5]" />
              <span className="w-3 h-2.5 bg-[#F1FAF4] rounded-r-xs" />
            </div>
            <div className="flex justify-between mt-0.5 text-[9px] text-ink-500">
              <span>1.0</span>
              <span>0.0</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Inner: render polygon dengan styling. Dipisah karena pakai useMap dari leaflet
// yang butuh dipanggil dalam MapContainer.
// ─────────────────────────────────────────────────────────────
function PolygonLayer({
  polygonGeoJSON,
  ndviScore,
}: {
  polygonGeoJSON: GeoJSON.Polygon;
  ndviScore: number | null;
}) {
  const [Mod, setMod] = useState<any>(null);
  useEffect(() => {
    import('react-leaflet').then(setMod);
  }, []);

  if (!Mod) return null;
  const { Polygon } = Mod;

  // Convert GeoJSON [lng, lat] → Leaflet [lat, lng]
  const positions: [number, number][] = polygonGeoJSON.coordinates[0]
    .slice(0, -1) // remove closing duplicate
    .map((c: number[]) => [c[1], c[0]]);

  // NDVI-based coloring
  const ndviColor =
    ndviScore !== null
      ? ndviScore >= 0.6
        ? '#234D2E' // High density → forest green
        : ndviScore >= 0.4
          ? '#6FAF6C' // Medium → sage
          : '#C9E2C5' // Low → mist green
      : '#234D2E';

  return (
    <Polygon
      positions={positions}
      pathOptions={{
        color: '#234D2E',
        fillColor: ndviColor,
        fillOpacity: ndviScore !== null ? 0.55 : 0.3,
        weight: 2.5,
      }}
    />
  );
}

function calculateCentroid(polygon: GeoJSON.Polygon): [number, number] {
  const ring = polygon.coordinates[0];
  let lat = 0;
  let lng = 0;
  const n = ring.length - 1; // skip closing duplicate
  for (let i = 0; i < n; i++) {
    lng += ring[i][0];
    lat += ring[i][1];
  }
  return [lat / n, lng / n];
}