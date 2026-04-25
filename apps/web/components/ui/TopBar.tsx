"use client";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

export function TopBar({ title, backHref, right }: { title?: string; backHref?: string; right?: ReactNode }) {
  const router = useRouter();
  return (
    <div className="sticky top-0 z-20 flex items-center gap-3 border-b border-[rgba(15,23,42,.08)] bg-paper px-4 py-3.5">
      {backHref && (
        <button onClick={() => router.push(backHref)} className="grid h-9 w-9 place-items-center rounded-full hover:bg-ink-50" aria-label="Kembali">
          <ArrowLeft className="h-5 w-5" />
        </button>
      )}
      <div className="flex-1 text-base font-semibold text-ink-900">{title}</div>
      {right}
    </div>
  );
}

export function BottomBar({ children }: { children: ReactNode }) {
  return <div className="sticky bottom-0 z-20 flex gap-2.5 border-t border-[rgba(15,23,42,.08)] bg-paper px-4 py-3">{children}</div>;
}
