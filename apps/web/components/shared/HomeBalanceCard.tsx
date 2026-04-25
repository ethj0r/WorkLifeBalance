'use client';

import Link from 'next/link';
import { Wallet } from 'lucide-react';
import { fmtIDR, fmtIDRshort } from '@/lib/utils';

interface HomeBalanceCardProps {
  balance: number;
  totalAnnualEarnings: number;
}

export function HomeBalanceCard({
  balance,
  totalAnnualEarnings,
}: HomeBalanceCardProps) {
  return (
    <div className="bg-green-700 text-green-50 rounded-lg p-[18px] relative overflow-hidden">
      {/* Decorative circle */}
      <div className="absolute -right-5 -top-5 w-[120px] h-[120px] rounded-pill bg-green-600 opacity-50" />

      <div className="relative">
        <div className="eyebrow text-green-50/70">Saldo Tersedia</div>
        <div className="figure text-[32px] text-green-50 mt-1 leading-[1.05]">
          {fmtIDR(balance)}
        </div>
        <div className="text-xs text-green-50/70 mt-1">
          Estimasi tahunan: {fmtIDRshort(totalAnnualEarnings)}
        </div>
        <Link
          href="/withdraw"
          className="mt-3.5 inline-flex items-center gap-2 px-4 py-2 rounded-pill bg-white/15 text-green-50 text-[13px] font-semibold hover:bg-white/25 transition-colors border-0"
        >
          <Wallet size={14} strokeWidth={1.75} />
          Tarik ke E-Wallet
        </Link>
      </div>
    </div>
  );
}