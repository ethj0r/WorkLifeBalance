import Link from "next/link";
import { Logo } from "./Logo";
import { Button } from "./Button";

export function AppHeader({
  active,
}: {
  active?: "dashboard" | "plots" | "withdraw";
}) {
  const nav = [
    { href: "/dashboard", label: "Dashboard", key: "dashboard" },
    { href: "/plots/new", label: "Daftarkan lahan", key: "plots" },
    { href: "/withdraw", label: "Withdraw", key: "withdraw" },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-[rgba(15,23,42,.08)] bg-paper/95 backdrop-blur">
      <div className="web-container flex h-[72px] items-center justify-between gap-6">
        <Link href="/dashboard" className="flex items-center">
          <Logo />
        </Link>

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

        <div className="hidden md:block" />
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