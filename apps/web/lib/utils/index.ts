import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind class names dengan deduplication.
 * Pattern standard untuk shadcn/ui dan banyak design system lainnya.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─────────────────────────────────────────────────────────────
// Currency formatters — Indonesian locale
// ─────────────────────────────────────────────────────────────

/** Full IDR format: "Rp 245.000" */
export const fmtIDR = (n: number) => 'Rp ' + n.toLocaleString('id-ID');

/** Short IDR for big numbers: "Rp 1,5 jt" */
export const fmtIDRshort = (n: number) =>
  'Rp ' + (n / 1_000_000).toFixed(1).replace('.', ',') + ' jt';

// ─────────────────────────────────────────────────────────────
// Number formatters
// ─────────────────────────────────────────────────────────────

/** Area in hectares: "2,4 ha" */
export const fmtArea = (ha: number) =>
  ha.toLocaleString('id-ID', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  }) + ' ha';

/** Generic Indonesian-locale number with controlled decimals */
export const fmtNumber = (n: number, decimals = 1) =>
  n.toLocaleString('id-ID', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

// ─────────────────────────────────────────────────────────────
// Polygon area calculation (in hectares)
// ─────────────────────────────────────────────────────────────

/**
 * Calculate area of a polygon in hectares using shoelace formula
 * with spherical earth approximation.
 *
 * Input: Array of [lng, lat] coordinate pairs (GeoJSON convention).
 * Output: Area in hectares.
 *
 * Note: Akurasi ~1-2% untuk plot kecil (<10 ha). Untuk akurasi tinggi
 * di production, gunakan Turf.js (`@turf/turf`).
 */
export function calculatePolygonArea(coords: [number, number][]): number {
  if (coords.length < 3) return 0;

  const earthRadius = 6371000; // meters
  let area = 0;

  for (let i = 0; i < coords.length; i++) {
    const [lng1, lat1] = coords[i];
    const [lng2, lat2] = coords[(i + 1) % coords.length];
    area +=
      ((lng2 - lng1) * Math.PI) / 180 *
      (2 + Math.sin((lat1 * Math.PI) / 180) + Math.sin((lat2 * Math.PI) / 180));
  }

  area = Math.abs((area * earthRadius * earthRadius) / 2);
  return area / 10_000; // m² → hektar
}

// ─────────────────────────────────────────────────────────────
// Misc
// ─────────────────────────────────────────────────────────────

/** Sleep helper untuk mock delay (verification animation) */
export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));