import type { HTMLAttributes } from "react";

export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`rounded-xl border border-[rgba(15,23,42,0.08)] bg-white p-4 shadow-sm ${className}`} {...props} />;
}
