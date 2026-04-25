"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Logo } from "./Logo";
import { Button } from "./Button";
import { getSessionOrDemo } from "@/lib/session";

export function AppHeader({
  active,
}: {
  active?: "dashboard" | "plots" | "withdraw";
}) {
  const [displayName, setDisplayName] = useState<string>("");

  useEffect(() => {
    const s = getSessionOrDemo();
    setDisplayName(s.display_name || "");
  }, []);

  const nav = [
    { href: "/dashboard", label: "Dashboard", key: "dashboard" },
    { href: "/plots/new", label: "Daftarkan lahan", key: "plots" },
    { href: "/withdraw", label: "Withdraw", key: "withdraw" },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-[rgba(15,23,42,.08)] bg-paper/95 backdrop-blur">
      <div className="relative flex h-[72px] items-center px-6 sm:px-8 lg:px-10">
        <Link
          href="/dashboard"
          className="absolute left-6 flex items-center sm:left-8 lg:left-10"
        >
          <Logo />
        </Link>

        <nav className="mx-auto hidden items-center gap-1 md:flex">
          {nav.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                active === item.key
                  ? "bg-green-50 text-green-700"
                  : "text-ink-600 hover:bg-white hover:text-ink-900"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* User chip — only renders when name is available */}
        {displayName && (
          <div className="absolute right-6 hidden items-center gap-2 sm:right-8 lg:right-10 md:flex">
            <div className="flex items-center gap-2 rounded-full border border-[rgba(15,23,42,.08)] bg-white px-3 py-1.5 text-sm font-semibold text-ink-700 shadow-xs">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-green-700 text-[11px] font-bold text-white">
                {displayName.charAt(0).toUpperCase()}
              </span>
              {displayName}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-[rgba(15,23,42,.08)] bg-paper/95 backdrop-blur">
      <div className="web-container flex h-[72px] items-center justify-between gap-6">
        <Link href="/">
          <Logo />
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="hidden text-sm font-semibold text-green-700 sm:block"
          >
            Masuk
          </Link>

          <Link href="/login">
            <Button size="sm">Daftar</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}