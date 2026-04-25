'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { Loader2, Pencil, Undo2, Redo2, Trash2, Check } from 'lucide-react';
import { calculatePolygonArea, fmtArea } from '@/lib/utils';
import { MIN_AREA_HA, MAX_AREA_HA } from '@worklifebalance/types';
import { cn } from '@/lib/utils';
import 'leaflet/dist/leaflet.css';

const MapContainer = dynamic(
  () => import('react-leaflet').then((m) => m.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((m) => m.TileLayer),
  { ssr: false }
);

interface DrawPolygonMapProps {
  center: [number, number];
  zoom?: number;
  height?: number;
  onPolygonChange: (
    polygonGeoJSON: GeoJSON.Polygon | null,
    areaHectares: number
  ) => void;
}

/**
 * Map dengan draw polygon tools.
 * User klik di peta untuk add vertex, klik vertex pertama untuk close polygon.
 * Real-time area calculation.
 */
export function DrawPolygonMap({
  center,
  zoom = 17,
  height = 380,
  onPolygonChange,
}: DrawPolygonMapProps) {
  const [isClient, setIsClient] = useState(false);
  const [vertices, setVertices] = useState<[number, number][]>([]);
  const [history, setHistory] = useState<[number, number][][]>([[]]);
  const [historyIdx, setHistoryIdx] = useState(0);
  const [tool, setTool] = useState<'pencil' | null>('pencil');
  const mapRef = useRef<any>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Calculate area whenever vertices change
  useEffect(() => {
    if (vertices.length < 3) {
      onPolygonChange(null, 0);
      return;
    }
    // Convert [lat, lng] → [lng, lat] for GeoJSON
    const coords: [number, number][] = vertices.map(([lat, lng]) => [lng, lat]);
    coords.push(coords[0]); // close ring

    const area = calculatePolygonArea(coords);
    const geojson: GeoJSON.Polygon = {
      type: 'Polygon',
      coordinates: [coords],
    };
    onPolygonChange(geojson, area);
  }, [vertices, onPolygonChange]);

  const pushHistory = (next: [number, number][]) => {
    const newHistory = history.slice(0, historyIdx + 1);
    newHistory.push(next);
    setHistory(newHistory);
    setHistoryIdx(newHistory.length - 1);
  };

  const handleMapClick = (e: { latlng: { lat: number; lng: number } }) => {
    if (tool !== 'pencil') return;
    const next: [number, number][] = [
      ...vertices,
      [e.latlng.lat, e.latlng.lng],
    ];
    setVertices(next);
    pushHistory(next);
  };

  const undo = () => {
    if (historyIdx === 0) return;
    setHistoryIdx(historyIdx - 1);
    setVertices(history[historyIdx - 1]);
  };

  const redo = () => {
    if (historyIdx >= history.length - 1) return;
    setHistoryIdx(historyIdx + 1);
    setVertices(history[historyIdx + 1]);
  };

  const clear = () => {
    setVertices([]);
    pushHistory([]);
  };

  const area =
    vertices.length >= 3
      ? calculatePolygonArea(
          vertices.map(([lat, lng]) => [lng, lat]).concat([
            [vertices[0][1], vertices[0][0]],
          ])
        )
      : 0;

  const isValid =
    vertices.length >= 3 && area >= MIN_AREA_HA && area <= MAX_AREA_HA;

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
    <div className="space-y-2.5">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-2.5 bg-white border border-ink-200 rounded-sm">
        <div className="flex gap-1.5">
          {[
            { id: 'pencil' as const, icon: Pencil, label: 'Gambar' },
            { id: 'undo' as const, icon: Undo2, label: 'Undo', onClick: undo },
            { id: 'redo' as const, icon: Redo2, label: 'Redo', onClick: redo },
            { id: 'clear' as const, icon: Trash2, label: 'Clear', onClick: clear },
          ].map((t) => {
            const Icon = t.icon;
            const isActive = t.id === 'pencil' && tool === 'pencil';
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  if (t.id === 'pencil') setTool('pencil');
                  else t.onClick?.();
                }}
                aria-label={t.label}
                className={cn(
                  'w-9 h-9 rounded-xs flex items-center justify-center transition-colors',
                  isActive
                    ? 'bg-green-100 text-green-700'
                    : 'text-ink-700 hover:bg-ink-50'
                )}
              >
                <Icon size={16} strokeWidth={1.75} />
              </button>
            );
          })}
        </div>
        <div className="flex gap-3.5 text-xs">
          <span>
            <b className="text-ink-900 figure">{fmtArea(area)}</b>{' '}
            <span className="text-ink-500">luas</span>
          </span>
          <span>
            <b className="text-ink-900 figure">{vertices.length}</b>{' '}
            <span className="text-ink-500">vertex</span>
          </span>
        </div>
      </div>

      {/* Map */}
      <div
        className="rounded-md overflow-hidden border border-[rgba(15,23,42,0.08)] relative"
        style={{ height }}
      >
        <MapContainer
          center={center}
          zoom={zoom}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom
          ref={mapRef}
        >
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            maxZoom={19}
          />
          <ClickHandler onMapClick={handleMapClick} />
          {vertices.length > 0 && <PolygonOverlay vertices={vertices} />}
        </MapContainer>
      </div>

      {/* Helper hints */}
      {vertices.length === 0 && (
        <div className="p-2.5 bg-earth-50 rounded-sm text-xs text-earth-700 flex gap-2">
          <span>👆</span>
          <span>Tap di peta untuk menandai sudut-sudut lahan Anda. Minimal 3 titik.</span>
        </div>
      )}
      {vertices.length >= 3 && !isValid && (
        <div className="p-2.5 bg-warning-soft rounded-sm text-xs text-warning flex gap-2">
          <span>⚠</span>
          <span>
            {area < MIN_AREA_HA
              ? `Luas minimum ${MIN_AREA_HA} ha`
              : `Luas maksimum ${MAX_AREA_HA} ha (di luar scope smallholder)`}
          </span>
        </div>
      )}
      {isValid && (
        <div className="p-2.5 bg-green-50 rounded-sm text-xs text-green-700 flex gap-2">
          <Check size={14} strokeWidth={2} />
          <span>Polygon valid. Klik &ldquo;Lanjut&rdquo; untuk lanjutkan.</span>
        </div>
      )}
    </div>
  );
}

// Inner components dengan useMap/useMapEvents (hanya bisa dipanggil di dalam MapContainer)
function ClickHandler({
  onMapClick,
}: {
  onMapClick: (e: { latlng: { lat: number; lng: number } }) => void;
}) {
  const [Mod, setMod] = useState<any>(null);
  useEffect(() => {
    import('react-leaflet').then(setMod);
  }, []);
  if (!Mod) return null;
  return <ClickHandlerInner Mod={Mod} onMapClick={onMapClick} />;
}

function ClickHandlerInner({ Mod, onMapClick }: any) {
  Mod.useMapEvents({ click: onMapClick });
  return null;
}

function PolygonOverlay({ vertices }: { vertices: [number, number][] }) {
  const [Mod, setMod] = useState<any>(null);
  useEffect(() => {
    import('react-leaflet').then(setMod);
  }, []);
  if (!Mod || vertices.length < 2) return null;
  const { Polygon, CircleMarker, Polyline } = Mod;

  // Closed polygon kalau 3+ vertex, line kalau 2
  if (vertices.length >= 3) {
    return (
      <>
        <Polygon
          positions={vertices}
          pathOptions={{
            color: '#234D2E',
            fillColor: '#234D2E',
            fillOpacity: 0.3,
            weight: 2,
          }}
        />
        {vertices.map((v, i) => (
          <CircleMarker
            key={i}
            center={v}
            radius={5}
            pathOptions={{
              color: '#FFF',
              fillColor: '#234D2E',
              fillOpacity: 1,
              weight: 2,
            }}
          />
        ))}
      </>
    );
  }
  return (
    <>
      <Polyline
        positions={vertices}
        pathOptions={{ color: '#234D2E', weight: 2 }}
      />
      {vertices.map((v, i) => (
        <CircleMarker
          key={i}
          center={v}
          radius={5}
          pathOptions={{
            color: '#FFF',
            fillColor: '#234D2E',
            fillOpacity: 1,
            weight: 2,
          }}
        />
      ))}
    </>
  );
}