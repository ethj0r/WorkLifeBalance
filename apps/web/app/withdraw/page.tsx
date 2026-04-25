"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/ui/AppHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, SelectInput, TextInput } from "@/components/ui/Field";
import { formatIDR } from "@/lib/format";
import {
  getSessionOrDemo,
  deductBalance,
  type SessionUser,
} from "@/lib/session";
import { updateBalance } from "@/lib/supabase/client";

function parseIDR(raw: string): number {
  const cleaned = raw.replace(/[Rp\s.]/g, "").replace(",", ".");
  return parseInt(cleaned, 10);
}

function formatAsIDR(n: number): string {
  if (isNaN(n) || n === 0) return "";
  return n.toLocaleString("id-ID");
}

export default function WithdrawPage() {
  const router = useRouter();
  const [session, setSession] = useState<SessionUser | null>(null);
  const [withdrawn, setWithdrawn] = useState<number | null>(null); 

  useEffect(() => {
    setSession(getSessionOrDemo());
  }, []);

  async function handleSuccess(amount: number) {
    const newBalance = deductBalance(amount);
    if (session && newBalance !== null) {
      updateBalance(session.id, newBalance).catch(() => {
      });
    }
    setWithdrawn(amount);
  }

  if (!session) {
    return (
      <main className="web-page">
        <AppHeader active="withdraw" />
        <section className="narrow-container py-10">
          <div className="h-48 animate-pulse rounded-2xl bg-ink-100" />
        </section>
      </main>
    );
  }

  return (
    <main className="web-page">
      <AppHeader active="withdraw" />
      <section className="narrow-container py-10">
        <div className="mb-8 text-center">
          <div className="eyebrow text-green-700">E-wallet payout</div>
          <h1 className="display-md mt-2">Tarik ke E-Wallet</h1>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-ink-500">
            Simulasi penarikan saldo carbon credit ke dompet digital pengguna.
          </p>
        </div>

        {withdrawn !== null ? (
          <Success
            amount={withdrawn}
            newBalance={session.balance - withdrawn}
            onBack={() => router.push("/dashboard")}
          />
        ) : (
          <WithdrawForm
            balance={session.balance}
            onSubmit={handleSuccess}
          />
        )}
      </section>
    </main>
  );
}

function WithdrawForm({
  balance,
  onSubmit,
}: {
  balance: number;
  onSubmit: (amount: number) => Promise<void>;
}) {
  const [wallet, setWallet] = useState("DANA");
  const [phone, setPhone] = useState("0812 3456 7890");
  const [nominalRaw, setNominalRaw] = useState(formatAsIDR(balance));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nominalParsed = parseIDR(nominalRaw);
  const isValid =
    !isNaN(nominalParsed) && nominalParsed > 0 && nominalParsed <= balance;

  function handleNominalChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, "");
    const n = parseInt(digits, 10);
    setNominalRaw(isNaN(n) ? "" : formatAsIDR(n));
    setError(null);
  }

  async function handleSubmit() {
    const amount = parseIDR(nominalRaw);

    if (isNaN(amount) || amount <= 0) {
      setError("Masukkan nominal yang valid.");
      return;
    }
    if (amount > balance) {
      setError(
        `Nominal melebihi saldo. Maksimal ${formatIDR(balance)}.`
      );
      return;
    }
    if (phone.replace(/\D/g, "").length < 8) {
      setError("Nomor tujuan tidak valid.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onSubmit(amount);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="auth-card">
      {/* Balance banner */}
      <div className="overflow-hidden rounded-2xl bg-green-700 p-6 text-green-50">
        <div className="eyebrow !text-green-50/70">Saldo tersedia</div>
        <div className="figure mt-2 text-5xl font-medium leading-none">
          {formatIDR(balance)}
        </div>
        <div className="mt-2 text-sm text-green-50/70">
          Siap ditarik ke e-wallet
        </div>
      </div>

      {/* Form fields */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Field label="E-Wallet">
          <SelectInput
            value={wallet}
            onChange={(e) => setWallet(e.target.value)}
          >
            <option>DANA</option>
            <option>GoPay</option>
            <option>OVO</option>
            <option>ShopeePay</option>
          </SelectInput>
        </Field>

        <Field label="Nomor tujuan">
          <TextInput
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            inputMode="tel"
          />
        </Field>

        <Field
          label="Nominal penarikan"
          hint={`Maks. ${formatIDR(balance)}`}
          className="sm:col-span-2"
        >
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-ink-500">
              Rp
            </span>
            <TextInput
              value={nominalRaw}
              onChange={handleNominalChange}
              inputMode="numeric"
              className="pl-10"
            />
          </div>
        </Field>
      </div>

      {/* Quick-select buttons */}
      <div className="mt-3 flex flex-wrap gap-2">
        {[50000, 100000, 200000].map((preset) => {
          const disabled = preset > balance;
          return (
            <button
              key={preset}
              type="button"
              disabled={disabled}
              onClick={() => {
                setNominalRaw(formatAsIDR(preset));
                setError(null);
              }}
              className="rounded-full border border-ink-200 px-3 py-1.5 text-xs font-semibold text-ink-600 transition hover:border-green-600 hover:text-green-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {formatIDR(preset)}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => {
            setNominalRaw(formatAsIDR(balance));
            setError(null);
          }}
          className="rounded-full border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700 transition hover:bg-green-100"
        >
          Semua saldo
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-[#B23B3B]/8 px-4 py-3 text-sm text-[#B23B3B]">
          <AlertCircle className="h-4 w-4 flex-none" />
          {error}
        </div>
      )}

      {/* Insufficient balance warning */}
      {!isNaN(nominalParsed) && nominalParsed > balance && !error && (
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-[#B23B3B]/8 px-4 py-3 text-sm text-[#B23B3B]">
          <AlertCircle className="h-4 w-4 flex-none" />
          Nominal melebihi saldo tersedia ({formatIDR(balance)}).
        </div>
      )}

      <Button
        size="lg"
        className="mt-6"
        leftIcon={<Wallet className="h-4 w-4" />}
        loading={loading}
        disabled={!isValid}
        onClick={handleSubmit}
        fullWidth
      >
        Tarik {nominalParsed > 0 && isValid ? formatIDR(nominalParsed) : "sekarang"}
      </Button>
    </Card>
  );
}

function Success({
  amount,
  newBalance,
  onBack,
}: {
  amount: number;
  newBalance: number;
  onBack: () => void;
}) {
  return (
    <Card className="auth-card py-14 text-center">
      <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-green-100 text-green-700">
        <CheckCircle2 className="h-10 w-10" />
      </div>

      <h2 className="display-sm mt-6">Penarikan diproses</h2>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-500">
        Dana akan masuk ke e-wallet Anda dalam 1×24 jam.
      </p>

      {/* Summary */}
      <div className="mx-auto mt-8 max-w-xs space-y-3 text-left">
        <div className="flex items-center justify-between rounded-xl bg-ink-50 px-4 py-3 text-sm">
          <span className="text-ink-500">Ditarik</span>
          <span className="font-semibold text-ink-900">{formatIDR(amount)}</span>
        </div>
        <div className="flex items-center justify-between rounded-xl bg-green-50 px-4 py-3 text-sm">
          <span className="text-green-700">Sisa saldo</span>
          <span className="font-semibold text-green-900">
            {formatIDR(Math.max(0, newBalance))}
          </span>
        </div>
      </div>

      <Button className="mt-8" onClick={onBack}>
        Kembali ke Dashboard
      </Button>
    </Card>
  );
}