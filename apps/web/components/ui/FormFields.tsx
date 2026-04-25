'use client';

import { type InputHTMLAttributes, type ReactNode, forwardRef } from 'react';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────────────────────
// Field — wrapper untuk label + hint + error
// ─────────────────────────────────────────────────────────────

export function Field({
  label,
  hint,
  error,
  required,
  children,
  className,
}: {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label className="text-[13px] font-semibold text-ink-700">
          {label}
          {required && <span className="text-danger ml-0.5">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <span className="text-xs text-danger">{error}</span>
      ) : hint ? (
        <span className="text-xs text-ink-500">{hint}</span>
      ) : null}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// TextInput
// ─────────────────────────────────────────────────────────────

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  ({ hasError, className, ...rest }, ref) => (
    <input
      ref={ref}
      className={cn(
        'font-sans text-[15px] px-3.5 py-[11px] rounded-sm bg-white text-ink-900',
        'border border-ink-200 outline-none w-full transition-colors',
        'focus:border-green-600 focus:ring-2 focus:ring-green-100',
        'placeholder:text-ink-400',
        hasError && 'border-danger focus:border-danger focus:ring-danger-soft',
        className
      )}
      {...rest}
    />
  )
);
TextInput.displayName = 'TextInput';

// ─────────────────────────────────────────────────────────────
// PhoneField — Indonesia format dengan +62 prefix
// ─────────────────────────────────────────────────────────────

export function PhoneField({
  value,
  onChange,
  placeholder = '812 3456 7890',
}: {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex border border-ink-200 rounded-sm bg-white overflow-hidden focus-within:border-green-600 focus-within:ring-2 focus-within:ring-green-100">
      <span className="px-3 py-[11px] bg-ink-50 text-ink-700 text-sm border-r border-ink-200 flex items-center font-medium">
        +62
      </span>
      <input
        value={value || ''}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        inputMode="numeric"
        className="border-0 outline-none px-3 py-[11px] text-[15px] flex-1 font-sans"
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Select
// ─────────────────────────────────────────────────────────────

export const Select = forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...rest }, ref) => (
  <select
    ref={ref}
    className={cn(
      'font-sans text-[15px] px-3.5 py-[11px] rounded-sm bg-white text-ink-900',
      'border border-ink-200 outline-none w-full transition-colors cursor-pointer',
      'focus:border-green-600 focus:ring-2 focus:ring-green-100',
      className
    )}
    {...rest}
  >
    {children}
  </select>
));

Select.displayName = 'Select';

// ─────────────────────────────────────────────────────────────
// TreeChips — multi-select chips for dominant tree types
// ─────────────────────────────────────────────────────────────

export function TreeChips({
  options,
  value,
  onChange,
}: {
  options: readonly string[];
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const toggle = (t: string) => {
    onChange(value.includes(t) ? value.filter((x) => x !== t) : [...value, t]);
  };
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((t) => {
        const on = value.includes(t);
        return (
          <button
            key={t}
            type="button"
            onClick={() => toggle(t)}
            className={cn(
              'px-3 py-1.5 rounded-pill text-[13px] font-semibold transition-all border',
              on
                ? 'bg-green-700 text-green-50 border-green-700'
                : 'bg-white text-ink-700 border-ink-200 hover:border-green-400'
            )}
          >
            {t}
          </button>
        );
      })}
    </div>
  );
}