"use client";

import { useMemo, useRef, useState } from "react";
import { Pencil, Trash2, Undo2 } from "lucide-react";
import type { PolygonPoint } from "@/lib/types";
import { estimateAreaHaFromSvgPolygon, polygonToSvgPoints } from "@/lib/geo";

type PolygonEditorProps = {
  value: PolygonPoint[];
  onChange: (points: PolygonPoint[]) => void;
  height?: number;
};

const VIEWBOX_WIDTH = 1000;
const VIEWBOX_HEIGHT = 560;

export function PolygonEditor({
  value,
  onChange,
  height = 520,
}: PolygonEditorProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [isDrawing, setIsDrawing] = useState(true);

  const svgPoints = useMemo(() => polygonToSvgPoints(value), [value]);
  const areaHa = useMemo(() => estimateAreaHaFromSvgPolygon(value), [value]);

  function getSvgPoint(clientX: number, clientY: number): PolygonPoint {
    const svg = svgRef.current;

    if (!svg) {
      return { x: 0, y: 0 };
    }

    const rect = svg.getBoundingClientRect();

    const x = ((clientX - rect.left) / rect.width) * VIEWBOX_WIDTH;
    const y = ((clientY - rect.top) / rect.height) * VIEWBOX_HEIGHT;

    return {
      x: Math.max(0, Math.min(VIEWBOX_WIDTH, Math.round(x))),
      y: Math.max(0, Math.min(VIEWBOX_HEIGHT, Math.round(y))),
    };
  }

  function handleCanvasClick(event: React.MouseEvent<SVGSVGElement>) {
    if (!isDrawing) return;
    if (draggingIndex !== null) return;

    const target = event.target as SVGElement;

    if (target.dataset.vertex === "true") {
      return;
    }

    const point = getSvgPoint(event.clientX, event.clientY);
    onChange([...value, point]);
  }

  function handlePointerMove(event: React.PointerEvent<SVGSVGElement>) {
    if (draggingIndex === null) return;

    const point = getSvgPoint(event.clientX, event.clientY);

    const next = value.map((oldPoint, index) =>
      index === draggingIndex ? point : oldPoint
    );

    onChange(next);
  }

  function stopDragging() {
    setDraggingIndex(null);
  }

  function undoLastPoint() {
    onChange(value.slice(0, -1));
  }

  function clearPolygon() {
    onChange([]);
  }

  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-3 shadow-xs">
      <div className="mb-3 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setIsDrawing((current) => !current)}
            className={`grid h-10 w-10 place-items-center rounded-lg transition ${
              isDrawing
                ? "bg-green-100 text-green-700"
                : "text-ink-600 hover:bg-green-50"
            }`}
            title={isDrawing ? "Mode gambar aktif" : "Aktifkan mode gambar"}
          >
            <Pencil className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={undoLastPoint}
            disabled={value.length === 0}
            className="grid h-10 w-10 place-items-center rounded-lg text-ink-700 transition hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-40"
            title="Hapus titik terakhir"
          >
            <Undo2 className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={clearPolygon}
            disabled={value.length === 0}
            className="grid h-10 w-10 place-items-center rounded-lg text-ink-700 transition hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-40"
            title="Hapus semua titik"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-wrap gap-4 text-sm">
          <span>
            <b>{areaHa.toLocaleString("id-ID")} ha</b>{" "}
            <span className="text-ink-500">estimasi luas</span>
          </span>
          <span>
            <b>{value.length}</b>{" "}
            <span className="text-ink-500">vertex</span>
          </span>
        </div>
      </div>

      <div
        className="overflow-hidden rounded-xl border border-[rgba(15,23,42,.08)] bg-gradient-to-br from-green-400 via-green-200 to-green-50"
        style={{ height }}
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
          className="h-full w-full cursor-crosshair touch-none select-none"
          onClick={handleCanvasClick}
          onPointerMove={handlePointerMove}
          onPointerUp={stopDragging}
          onPointerCancel={stopDragging}
          onPointerLeave={stopDragging}
        >
          <defs>
            <pattern
              id="polygon-grid"
              width="50"
              height="50"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 50 0 L 0 0 0 50"
                fill="none"
                stroke="rgba(15,23,42,0.08)"
                strokeWidth="1"
              />
            </pattern>
          </defs>

          <rect width="100%" height="100%" fill="url(#polygon-grid)" />

          <path
            d="M80 480 C220 390 330 430 460 330 C600 220 760 260 920 120"
            fill="none"
            stroke="rgba(35,77,46,0.18)"
            strokeWidth="24"
            strokeLinecap="round"
          />

          <path
            d="M120 120 C220 160 300 120 420 170 C570 235 650 180 840 230"
            fill="none"
            stroke="rgba(255,255,255,0.28)"
            strokeWidth="18"
            strokeLinecap="round"
          />

          {value.length >= 3 && (
            <polygon
              points={svgPoints}
              fill="rgba(35,77,46,0.42)"
              stroke="#234D2E"
              strokeWidth="4"
            />
          )}

          {value.length === 2 && (
            <polyline
              points={svgPoints}
              fill="none"
              stroke="#234D2E"
              strokeWidth="4"
              strokeDasharray="10 8"
            />
          )}

          {value.length === 1 && (
            <circle
              cx={value[0].x}
              cy={value[0].y}
              r="7"
              fill="#234D2E"
            />
          )}

          {value.map((point, index) => (
            <g key={`${point.x}-${point.y}-${index}`}>
              <circle
                cx={point.x}
                cy={point.y}
                r="16"
                fill="rgba(255,255,255,0.92)"
                stroke="#234D2E"
                strokeWidth="3"
                className="cursor-grab active:cursor-grabbing"
                data-vertex="true"
                onPointerDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();

                  setDraggingIndex(index);
                  event.currentTarget.setPointerCapture(event.pointerId);
                }}
              />

              <text
                x={point.x}
                y={point.y + 4}
                textAnchor="middle"
                className="pointer-events-none select-none text-[11px] font-bold"
                fill="#234D2E"
              >
                {index + 1}
              </text>
            </g>
          ))}
        </svg>
      </div>

      <div className="mt-3 rounded-lg bg-earth-50 p-3 text-sm leading-6 text-earth-700">
        Klik area peta untuk menambah titik. Tarik titik bernomor untuk
        mengubah batas. Polygon otomatis tertutup setelah minimal 3 titik.
      </div>
    </div>
  );
}