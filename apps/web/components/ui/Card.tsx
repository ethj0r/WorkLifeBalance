'use client';

import { type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import type { PlotStatus } from '@worklifebalance/types';

// ─────────────────────────────────────────────────────────────
// Card
// ─────────────────────────────────────────────────────────────

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'dark' | 'mint' | 'cream';
  hover?: boolean;
}

export function Card({
  variant = 'default',
  hover = false,
  className,
  children,
  ...rest
}: CardProps) {
  const variantClasses = {
    default: 'bg-white border-[rgba(15,23,42,0.08)]',
    dark: 'bg-green-700 text-green-50 border-transparent',
    mint: 'bg-green-50 border-green-200',
    cream: 'bg-earth-50 border-earth-200',
  };
  return (
    <div
      className={cn(
        'border rounded-md shadow-sm p-4 transition-all duration-200 ease-out-expo',
        variantClasses[variant],
        hover && rest.onClick && 'cursor-pointer hover:shadow-md hover:-translate-y-0.5',
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// StatCard — label + figure + sub
// ─────────────────────────────────────────────────────────────

export function StatCard({
  label,
  value,
  sub,
  dark,
  big,
  className,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  dark?: boolean;
  big?: boolean;
  className?: string;
}) {
  return (
    <Card
      variant={dark ? 'dark' : 'default'}
      className={cn('p-3.5', className)}
    >
      <div
        className={cn(
          'text-[11px] font-semibold uppercase tracking-[0.1em]',
          dark ? 'text-green-50/70' : 'text-ink-500'
        )}
      >
        {label}
      </div>
      <div
        className={cn(
          'figure mt-1.5 leading-[1.05]',
          big ? 'text-[32px]' : 'text-[24px]',
          dark ? 'text-green-50' : 'text-ink-900'
        )}
      >
        {value}
      </div>
      {sub && (
        <div
          className={cn(
            'text-xs mt-1',
            dark ? 'text-green-50/70' : 'text-ink-500'
          )}
        >
          {sub}
        </div>
      )}
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────
// StatusBadge — color-coded plot lifecycle
// ─────────────────────────────────────────────────────────────

const statusMap: Record<PlotStatus, { bg: string; fg: string; label: string; dot: string }> = {
  pending: { bg: '#F2E8D4', fg: '#6B5538', label: 'Pending', dot: '#6B5538' },
  verifying: { bg: '#DCE9F5', fg: '#2C5A8A', label: 'Verifying', dot: '#2C5A8A' },
  verified: { bg: '#C9E2C5', fg: '#234D2E', label: 'Verified', dot: '#234D2E' },
  credit_issued: { bg: '#234D2E', fg: '#F1FAF4', label: 'Credit Issued', dot: '#6FAF6C' },
};

export function StatusBadge({ status }: { status: PlotStatus }) {
  const s = statusMap[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill text-xs font-semibold whitespace-nowrap"
      style={{ background: s.bg, color: s.fg }}
    >
      <span
        className="w-1.5 h-1.5 rounded-pill"
        style={{ background: s.dot }}
      />
      {s.label}
    </span>
  );
}