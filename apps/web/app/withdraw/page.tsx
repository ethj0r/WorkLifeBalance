"use client";
import { useState } from "react";
import { CheckCircle2, Wallet } from "lucide-react";
import { AppHeader } from "@/components/ui/AppHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, SelectInput, TextInput } from "@/components/ui/Field";
import { user } from "@/lib/mock-data";
import { formatIDR } from "@/lib/format";

export default function WithdrawPage() {
  const [done, setDone] = useState(false);
  return (
    <main className="web-page">
      <AppHeader active="withdraw" />
      <section className="narrow-container py-10">
        <div className="mb-8 text-center">
          <div className="eyebrow text-green-700">E-wallet payout</div>
          <h1 className="display-md mt-2">Tarik ke E-Wallet</h1>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-ink-500">Simulasi penarikan saldo carbon credit ke dompet digital pengguna.</p>
        </div>
        {done ? <Success /> : <Form onSubmit={() => setDone(true)} />}
      </section>
    </main>
  );
}
function Form({ onSubmit }: { onSubmit: () => void }) {
  return <Card className="auth-card"><div className="rounded-2xl bg-green-700 p-6 text-green-50"><div className="eyebrow !text-green-50/70">Saldo tersedia</div><div className="figure mt-2 text-5xl font-medium leading-none">{formatIDR(user.balance)}</div><div className="mt-2 text-sm text-green-50/70">Siap ditarik ke e-wallet</div></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><Field label="E-Wallet"><SelectInput><option>DANA</option><option>GoPay</option><option>OVO</option><option>ShopeePay</option></SelectInput></Field><Field label="Nomor tujuan"><TextInput defaultValue="0812 3456 7890" /></Field><Field label="Nominal"><TextInput defaultValue={formatIDR(user.balance)} /></Field></div><Button size="lg" className="mt-6" leftIcon={<Wallet className="h-4 w-4" />} onClick={onSubmit}>Tarik sekarang</Button></Card>;
}
function Success() { return <Card className="auth-card py-16 text-center"><div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-green-100 text-green-700"><CheckCircle2 className="h-10 w-10" /></div><h2 className="display-sm mt-6">Penarikan diproses</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-500">Dana akan masuk ke e-wallet Anda dalam 1×24 jam.</p></Card>; }
