"use client";

import { useRef } from "react";
import { FileText, UploadCloud, X, CheckCircle2 } from "lucide-react";

type Props = {
  label: string;
  hint?: string;
  accept?: string;
  file: File | null;
  onChange: (file: File | null) => void;
  required?: boolean;
  error?: string;
};

export function FileUploadCard({
  label,
  hint,
  accept = ".pdf,.jpg,.jpeg,.png",
  file,
  onChange,
  required,
  error,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleClick() {
    inputRef.current?.click();
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null;
    onChange(selected);
    e.target.value = "";
  }

  function handleRemove(e: React.MouseEvent) {
    e.stopPropagation();
    onChange(null);
  }

  const hasFile = file !== null;

  return (
    <div className="flex flex-col gap-1.5">
      {/* Label row */}
      <div className="flex items-center gap-1.5">
        <span className="text-[13px] font-semibold text-ink-700">{label}</span>
        {required && (
          <span className="rounded-full bg-earth-100 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-earth-700">
            Wajib
          </span>
        )}
      </div>

      {/* Drop zone / card */}
      <button
        type="button"
        onClick={handleClick}
        className={`group relative flex w-full items-start gap-4 rounded-2xl border-2 border-dashed p-5 text-left transition-all duration-200
          ${hasFile
            ? "border-green-500 bg-green-50 hover:border-green-600"
            : error
            ? "border-[#B23B3B]/50 bg-[#B23B3B]/5 hover:border-[#B23B3B]"
            : "border-ink-200 bg-white hover:border-green-500 hover:bg-green-50/40"
          }`}
      >
        {/* Icon */}
        <div
          className={`grid h-12 w-12 flex-none place-items-center rounded-xl transition-colors
            ${hasFile ? "bg-green-100 text-green-700" : "bg-ink-100 text-ink-500 group-hover:bg-green-100 group-hover:text-green-700"}`}
        >
          {hasFile ? (
            <CheckCircle2 className="h-6 w-6" />
          ) : (
            <FileText className="h-6 w-6" />
          )}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          {hasFile ? (
            <>
              <div className="truncate text-[15px] font-semibold text-ink-900">
                {file.name}
              </div>
              <div className="mt-0.5 text-xs text-ink-500">
                {(file.size / 1024).toFixed(0)} KB ·{" "}
                <span className="text-green-700 font-semibold">Terupload</span>
              </div>
            </>
          ) : (
            <>
              <div className="text-[15px] font-semibold text-ink-700 group-hover:text-green-800">
                Tap untuk upload dokumen
              </div>
              <div className="mt-0.5 text-xs text-ink-500">
                {hint ?? "PDF, JPG, atau PNG · maks. 10 MB"}
              </div>
            </>
          )}
        </div>

        {/* Upload icon or remove */}
        {hasFile ? (
          <button
            type="button"
            onClick={handleRemove}
            className="flex-none rounded-full p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
            aria-label="Hapus file"
          >
            <X className="h-4 w-4" />
          </button>
        ) : (
          <UploadCloud className="h-5 w-5 flex-none text-ink-400 group-hover:text-green-600" />
        )}

        {/* Hidden file input */}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="sr-only"
          onChange={handleChange}
          tabIndex={-1}
        />
      </button>

      {/* Error message */}
      {error && (
        <span className="text-xs text-[#B23B3B]">{error}</span>
      )}
    </div>
  );
}