"use client";

import { useMemo, useRef, useState } from "react";
import { Loader2, Pencil, Trees, Trash2, Undo2 } from "lucide-react";
import type { PolygonPoint } from "@/lib/types";
import { detectTreesFromFixedImage } from "@/lib/api-detection";

type PolygonEditorProps = {
  value: PolygonPoint[];
  onChange: (points: PolygonPoint[]) => void;
  height?: number;
  onDetectionComplete?: (result: {
    treeCount: number;
  }) => void;
};

export function PolygonEditor({
  value,
  onChange,
  height = 520,
  onDetectionComplete,
}: PolygonEditorProps) {
  const imgRef = useRef<HTMLImageElement | null>(null);

  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [isDrawing, setIsDrawing] = useState(true);
  const [imageSize, setImageSize] = useState({ width: 1000, height: 560 });

  const [detecting, setDetecting] = useState(false);
  const [treeCount, setTreeCount] = useState<number | null>(null);
  const [annotatedImage, setAnnotatedImage] = useState<string | null>(null);
  const [detectError, setDetectError] = useState<string | null>(null);

  const svgPoints = useMemo(
    () => value.map((p) => `${p.x},${p.y}`).join(" "),
    [value]
  );

  function getImagePoint(clientX: number, clientY: number): PolygonPoint {
    const img = imgRef.current;

    if (!img) {
      return { x: 0, y: 0 };
    }

    const rect = img.getBoundingClientRect();

    const x = ((clientX - rect.left) / rect.width) * imageSize.width;
    const y = ((clientY - rect.top) / rect.height) * imageSize.height;

    return {
      x: Math.max(0, Math.min(imageSize.width, Math.round(x))),
      y: Math.max(0, Math.min(imageSize.height, Math.round(y))),
    };
  }

  function handleCanvasClick(event: React.MouseEvent<SVGSVGElement>) {
    if (!isDrawing) return;
    if (draggingIndex !== null) return;

    const target = event.target as SVGElement;

    if (target.dataset.vertex === "true") {
      return;
    }

    const point = getImagePoint(event.clientX, event.clientY);
    onChange([...value, point]);
  }

  function handlePointerMove(event: React.PointerEvent<SVGSVGElement>) {
    if (draggingIndex === null) return;

    const point = getImagePoint(event.clientX, event.clientY);

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
    setTreeCount(null);
    setAnnotatedImage(null);
    setDetectError(null);

    onDetectionComplete?.({
      treeCount: 0,
    });
  }

  async function runDetection() {
    if (value.length < 3) {
      setDetectError("Polygon minimal harus punya 3 titik.");
      return;
    }

    try {
      setDetecting(true);
      setDetectError(null);

      const result = await detectTreesFromFixedImage(value);

      setTreeCount(result.tree_count);
      setAnnotatedImage(result.annotated_image_base64);

      onDetectionComplete?.({
        treeCount: result.tree_count,
      });
    } catch (error) {
      setDetectError(
        error instanceof Error ? error.message : "Gagal menjalankan deteksi."
      );
    } finally {
      setDetecting(false);
    }
  }

  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-3 shadow-xs">
      <div className="mb-3 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-wrap gap-1">
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

          <button
            type="button"
            onClick={runDetection}
            disabled={detecting || value.length < 3}
            className="ml-2 inline-flex h-10 items-center gap-2 rounded-lg bg-green-800 px-4 text-sm font-semibold text-white transition hover:bg-green-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {detecting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trees className="h-4 w-4" />
            )}
            {detecting ? "Mendeteksi..." : "Deteksi pohon"}
          </button>
        </div>

        <div className="flex flex-wrap gap-4 text-sm">
          {treeCount !== null && (
            <span>
              <b>{treeCount}</b>{" "}
              <span className="text-ink-500">pohon terdeteksi</span>
            </span>
          )}

          <span>
            <b>{value.length}</b>{" "}
            <span className="text-ink-500">vertex</span>
          </span>
        </div>
      </div>

      <div
        className="relative overflow-hidden rounded-xl border border-[rgba(15,23,42,.08)] bg-ink-50"
        style={{ height }}
      >
        <img
          ref={imgRef}
          src="/demo/forest.jpg"
          alt="Citra lahan demo"
          draggable={false}
          className="h-full w-full select-none object-cover"
          onLoad={(event) => {
            const img = event.currentTarget;
            setImageSize({
              width: img.naturalWidth,
              height: img.naturalHeight,
            });
          }}
        />

        <svg
          viewBox={`0 0 ${imageSize.width} ${imageSize.height}`}
          className="absolute inset-0 h-full w-full cursor-crosshair touch-none select-none"
          preserveAspectRatio="none"
          onClick={handleCanvasClick}
          onPointerMove={handlePointerMove}
          onPointerUp={stopDragging}
          onPointerCancel={stopDragging}
          onPointerLeave={stopDragging}
        >
          {value.length >= 3 && (
            <polygon
              points={svgPoints}
              fill="rgba(35,77,46,0.35)"
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
        Klik gambar untuk menambah titik. Tarik titik bernomor untuk mengubah
        batas. Setelah minimal 3 titik, klik <b>Deteksi pohon</b> untuk
        menjalankan FastAPI.
      </div>

      {detectError && (
        <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm leading-6 text-red-700">
          {detectError}
        </div>
      )}

      {treeCount !== null && (
        <div className="mt-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          <b>Hasil deteksi:</b> {treeCount} pohon ditemukan di dalam polygon.
        </div>
      )}

      {annotatedImage && (
        <div className="mt-4">
          <div className="mb-2 text-sm font-semibold text-ink-700">
            Gambar hasil anotasi dari FastAPI
          </div>

          <img
            src={`data:image/png;base64,${annotatedImage}`}
            alt="Hasil deteksi pohon"
            className="w-full rounded-xl border border-ink-200"
          />
        </div>
      )}
    </div>
  );
}