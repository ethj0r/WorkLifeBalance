'use client';

import { type ReactNode } from 'react';
import { ArrowLeft, Plus, Check, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────────────────────
// TopBar
// ─────────────────────────────────────────────────────────────

export function TopBar({
  title,
  onBack,
  right,
}: {
  title?: string;
  onBack?: () => void;
  right?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5 bg-paper border-b border-[rgba(15,23,42,0.08)] sticky top-0 z-10">
      {onBack && (
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-pill flex items-center justify-center hover:bg-ink-50 transition-colors"
          aria-label="Kembali"
        >
          <ArrowLeft size={20} strokeWidth={1.75} />
        </button>
      )}
      <div className="font-sans text-base font-semibold text-ink-900 flex-1 truncate">
        {title}
      </div>
      {right}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// BottomBar — sticky action bar at bottom
// ─────────────────────────────────────────────────────────────

export function BottomBar({ children }: { children: ReactNode }) {
  return (
    <div className="sticky bottom-0 px-4 py-3 bg-paper border-t border-[rgba(15,23,42,0.08)] flex gap-2.5 z-10">
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// FAB — floating action button
// ─────────────────────────────────────────────────────────────

export function FAB({
  onClick,
  icon: Icon = Plus,
  label,
}: {
  onClick?: () => void;
  icon?: LucideIcon;
  label?: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label || 'Action'}
      className="fixed right-4 bottom-6 w-14 h-14 rounded-pill bg-green-700 text-green-50 shadow-float flex items-center justify-center z-20 hover:bg-green-800 transition-colors"
    >
      <Icon size={24} strokeWidth={1.75} />
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// WizardStepper — top progress indicator for multi-step
// ─────────────────────────────────────────────────────────────

export function WizardStepper({
  step,
  total,
  labels,
}: {
  step: number;
  total: number;
  labels: string[];
}) {
  return (
    <div className="px-4 py-3 border-b border-[rgba(15,23,42,0.08)] bg-paper">
      <div className="flex items-center gap-1.5">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'h-1 rounded-pill transition-all duration-200',
              i === step ? 'flex-none min-w-[32px]' : 'flex-1',
              i < step
                ? 'bg-green-700'
                : i === step
                  ? 'bg-green-500'
                  : 'bg-ink-100'
            )}
          />
        ))}
      </div>
      <div className="flex justify-between mt-2">
        <span className="text-xs font-semibold uppercase tracking-[0.06em] text-ink-500">
          Langkah {step + 1} / {total}
        </span>
        <span className="text-xs text-ink-700 font-semibold">
          {labels[step]}
        </span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// LiveProgress — verification stages (the wow moment)
// ─────────────────────────────────────────────────────────────

export interface ProgressStage {
  title: string;
  detail?: string;
  state: 'pending' | 'active' | 'done';
}

export function LiveProgress({ stages }: { stages: ProgressStage[] }) {
  return (
    <div className="flex flex-col gap-1">
      {stages.map((stg, i) => (
        <div key={i} className="flex items-start gap-3.5 py-2.5">
          <div
            className={cn(
              'w-7 h-7 rounded-pill flex-shrink-0 flex items-center justify-center transition-all',
              stg.state === 'done' && 'bg-green-100 text-green-700',
              stg.state === 'active' && 'bg-green-700 text-white',
              stg.state === 'pending' && 'bg-ink-50 text-ink-400'
            )}
          >
            {stg.state === 'done' && <Check size={14} strokeWidth={2.5} />}
            {stg.state === 'active' && (
              <span
                className="w-3 h-3 border-2 border-green-50/40 border-t-white rounded-pill animate-spin"
              />
            )}
            {stg.state === 'pending' && (
              <span className="text-xs font-semibold">{i + 1}</span>
            )}
          </div>
          <div className="flex-1 pt-0.5">
            <div
              className={cn(
                'text-sm font-semibold',
                stg.state === 'pending' ? 'text-ink-500' : 'text-ink-900'
              )}
            >
              {stg.title}
            </div>
            {stg.state !== 'pending' && stg.detail && (
              <div className="text-[13px] text-ink-500 mt-0.5">{stg.detail}</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Sparkline — minimal area chart
// ─────────────────────────────────────────────────────────────

export function Sparkline({
  values,
  color = '#234D2E',
  height = 60,
  fill = true,
}: {
  values: number[];
  color?: string;
  height?: number;
  fill?: boolean;
}) {
  if (values.length === 0) return null;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const w = 280;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = height - ((v - min) / range) * (height - 8) - 4;
    return [x, y] as const;
  });
  const d = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join(' ');
  return (
    <svg
      viewBox={`0 0 ${w} ${height}`}
      style={{ width: '100%', height }}
      role="img"
      aria-label="trend chart"
    >
      {fill && (
        <path
          d={`${d} L${w},${height} L0,${height} Z`}
          fill={color}
          fillOpacity="0.12"
        />
      )}
      <path
        d={d}
        stroke={color}
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}