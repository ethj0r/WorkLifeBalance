import type { PolygonPoint } from "@/lib/types";

export function polygonToSvgPoints(points: PolygonPoint[]) {
  return points.map((point) => `${point.x},${point.y}`).join(" ");
}

export function calculatePolygonAreaPixels(points: PolygonPoint[]) {
  if (points.length < 3) return 0;

  let sum = 0;

  for (let i = 0; i < points.length; i += 1) {
    const current = points[i];
    const next = points[(i + 1) % points.length];

    sum += current.x * next.y - next.x * current.y;
  }

  return Math.abs(sum) / 2;
}

export function estimateAreaHaFromSvgPolygon(
  points: PolygonPoint[],
  options?: {
    /**
     * Demo conversion only.
     * In production, replace this with real geospatial area calculation
     * from latitude/longitude polygon coordinates.
     */
    hectaresPerPixelArea?: number;
  }
) {
  const hectaresPerPixelArea = options?.hectaresPerPixelArea ?? 0.00008;
  const pixelArea = calculatePolygonAreaPixels(points);

  return Number((pixelArea * hectaresPerPixelArea).toFixed(2));
}