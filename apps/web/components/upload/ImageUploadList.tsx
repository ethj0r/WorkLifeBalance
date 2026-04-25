"use client";

import { useRef, useEffect } from "react";
import { Camera, Plus, X, CheckCircle2, AlertCircle } from "lucide-react";

type ImageEntry = {
  file: File;
  previewUrl: string;
};

type Props = {
  images: ImageEntry[];
  onChange: (images: ImageEntry[]) => void;
  minRequired?: number;
  error?: string;
};

export type { ImageEntry };

const PHOTO_HINTS = [
  "Tegakan pohon & kondisi kanopi",
  "Batas lahan & pinggiran kebun",
  "Tanaman dominan dari dekat",
  "Kondisi tanah & vegetasi bawah",
];

export function ImageUploadList({
  images,
  onChange,
  minRequired = 3,
  error,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    };
  }, []);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    const newEntries: ImageEntry[] = files.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    onChange([...images, ...newEntries]);
    e.target.value = "";
  }

  function handleRemove(index: number) {
    const removed = images[index];
    URL.revokeObjectURL(removed.previewUrl);
    onChange(images.filter((_, i) => i !== index));
  }

  const count = images.length;
  const satisfied = count >= minRequired;

  return (
    <div className="space-y-3">
      {/* Header row */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-bold transition-colors
              ${satisfied ? "bg-green-100 text-green-700" : "bg-earth-100 text-earth-700"}`}
          >
            {satisfied ? (
              <CheckCircle2 className="h-3.5 w-3.5" />
            ) : (
              <AlertCircle className="h-3.5 w-3.5" />
            )}
            {count} / {minRequired} foto minimum
          </span>
        </div>

        {/* <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-full border border-ink-200 bg-white px-4 py-2 text-[13px] font-semibold text-ink-700 shadow-xs transition hover:border-green-600 hover:bg-green-50 hover:text-green-700"
        >
          <Plus className="h-4 w-4" />
          Tambah foto
        </button> */}
      </div>

      {/* Hidden file input — multiple */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={handleInputChange}
      />

      {/* Uploaded images — vertical list */}
      {images.length > 0 && (
        <div className="space-y-3">
          {images.map((img, i) => (
            <div
              key={img.previewUrl}
              className="group relative flex items-start gap-4 overflow-hidden rounded-2xl border border-ink-100 bg-white p-3 shadow-xs transition hover:border-green-200 hover:shadow-sm"
            >
              {/* Thumbnail */}
              <div className="relative h-24 w-24 flex-none overflow-hidden rounded-xl bg-ink-100 md:h-28 md:w-28">
                <img
                  src={img.previewUrl}
                  alt={`Foto lahan ${i + 1}`}
                  className="h-full w-full object-cover"
                />
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1 py-1">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-green-700 text-[11px] font-bold text-white">
                    {i + 1}
                  </span>
                  <span className="text-[13px] font-semibold text-green-700">
                    Foto {i + 1}
                  </span>
                </div>

                <div className="mt-1.5 truncate text-[13px] font-medium text-ink-700">
                  {img.file.name}
                </div>

                <div className="mt-0.5 text-xs text-ink-500">
                  {(img.file.size / 1024).toFixed(0)} KB
                  {PHOTO_HINTS[i] && (
                    <>
                      {" "}·{" "}
                      <span className="text-ink-400">{PHOTO_HINTS[i]}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Remove button */}
              <button
                type="button"
                onClick={() => handleRemove(i)}
                className="mt-1 flex-none rounded-full p-1.5 text-ink-400 opacity-0 transition group-hover:opacity-100 hover:bg-ink-100 hover:text-ink-700"
                aria-label={`Hapus foto ${i + 1}`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Empty state + slot cards for remaining required photos */}
      {count < minRequired && (
        <div className="space-y-2">
          {Array.from({ length: minRequired - count }).map((_, i) => {
            const slotIndex = count + i;
            const hint = PHOTO_HINTS[slotIndex] ?? "Foto kondisi lahan";
            return (
              <button
                key={i}
                type="button"
                onClick={() => inputRef.current?.click()}
                className="group flex w-full items-center gap-4 rounded-2xl border-2 border-dashed border-ink-200 bg-white p-4 text-left transition hover:border-green-500 hover:bg-green-50/40"
              >
                <div className="grid h-14 w-14 flex-none place-items-center rounded-xl bg-ink-100 text-ink-400 group-hover:bg-green-100 group-hover:text-green-600">
                  <Camera className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-[14px] font-semibold text-ink-600 group-hover:text-green-800">
                    Foto {slotIndex + 1} — {hint}
                  </div>
                  <div className="mt-0.5 text-xs text-ink-400">
                    Tap untuk pilih gambar
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-[#B23B3B]/8 px-4 py-3 text-sm text-[#B23B3B]">
          <AlertCircle className="h-4 w-4 flex-none" />
          {error}
        </div>
      )}
    </div>
  );
}