export function MapPolygon({ polygon, height = 96, ndvi = false }: { polygon: string; height?: number; ndvi?: boolean }) {
  const points = polygon.split(" ").map((p) => p.split(",").map(Number));
  return (
    <div className="relative overflow-hidden rounded-lg border border-[rgba(15,23,42,.08)]" style={{ height, background: ndvi ? "linear-gradient(135deg,#2F6840 0%,#6FAF6C 32%,#C9E2C5 70%,#F1FAF4 100%)" : "linear-gradient(135deg,#6FAF6C 0%,#C9E2C5 60%,#F1FAF4 100%)" }}>
      <svg viewBox="0 0 380 96" className="absolute inset-0 h-full w-full">
        <polygon points={polygon} fill="rgba(35,77,46,.50)" stroke="#234D2E" strokeWidth="2" />
        {points.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="3" fill="#234D2E" stroke="#FFF" strokeWidth="1.5" />)}
      </svg>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,.28),transparent_30%)]" />
    </div>
  );
}
