'use client';

import { cn } from '@/lib/utils';

interface MapPolygonProps {
  /**
   * Polygon points dalam format SVG: "x1,y1 x2,y2 x3,y3..."
   * atau GeoJSON yang akan di-normalize ke viewport SVG
   */
  polygon: string | [number, number][];
  height?: number;
  ndvi?: boolean;
  className?: string;
}

/**
 * Static SVG polygon visualization untuk thumbnail/preview.
 * Untuk interactive map (draw, pan, zoom), gunakan LeafletMap.
 */
export function MapPolygon({
  polygon,
  height = 100,
  ndvi = false,
  className,
}: MapPolygonProps) {
  // Normalize input ke SVG points string
  const polygonStr =
    typeof polygon === 'string'
      ? polygon
      : polygon.map(([x, y]) => `${x},${y}`).join(' ');

  const points = polygonStr.split(' ').map((p) => {
    const [x, y] = p.split(',').map(Number);
    return { x, y };
  });

  const gradient = ndvi
    ? 'linear-gradient(135deg, #2F6840 0%, #6FAF6C 30%, #C9E2C5 65%, #F1FAF4 100%)'
    : 'linear-gradient(135deg, #6FAF6C 0%, #C9E2C5 60%, #F1FAF4 100%)';

  return (
    <div
      className={cn('rounded-sm overflow-hidden relative', className)}
      style={{ height, background: gradient }}
    >
      <svg
        viewBox="0 0 380 180"
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="none"
      >
        <polygon
          points={polygonStr}
          fill="rgba(35,77,46,0.45)"
          stroke="#234D2E"
          strokeWidth="2"
        />
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="3"
            fill="#234D2E"
            stroke="#FFF"
            strokeWidth="1.5"
          />
        ))}
      </svg>
    </div>
  );
}