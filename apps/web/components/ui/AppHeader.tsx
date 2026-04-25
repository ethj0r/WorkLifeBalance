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
      <div className="web-container flex h-[72px] items-center justify-between">
        
        {/* Left */}
        <Link href="/dashboard" className="flex items-center">
          <Logo />
        </Link>

        {/* Center nav */}
        <nav className="hidden items-center gap-1 md:flex">
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

        {displayName ? (
          <div className="hidden sm:flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-full border border-[rgba(15,23,42,.08)] bg-white px-3 py-1.5 text-sm font-semibold text-ink-700 shadow-xs">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-green-700 text-[11px] font-bold text-white">
                {displayName.charAt(0).toUpperCase()}
              </span>
              {displayName}
            </div>
          </div>
        ) : (
          <div />
        )}
      </div>
    </header>
  );
}

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-[rgba(15,23,42,.08)] bg-paper/95 backdrop-blur">
      <div className="web-container flex h-[72px] items-center justify-between">
        
        <Link href="/" className="flex items-center">
          <Logo />
        </Link>

        <div className="flex items-center gap-4">
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