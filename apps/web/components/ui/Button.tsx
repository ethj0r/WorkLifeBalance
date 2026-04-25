'use client';

import { type ButtonHTMLAttributes, type ReactNode, forwardRef } from 'react';
import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'dark';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'size'> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  leftIcon?: LucideIcon;
  rightIcon?: LucideIcon;
  loading?: boolean;
  children?: ReactNode;
}

const sizeClasses: Record<Size, string> = {
  sm: 'px-4 py-2 text-[13px] gap-1.5',
  md: 'px-[22px] py-3 text-[15px] gap-2',
  lg: 'px-7 py-[15px] text-base gap-2',
};

const iconSizes: Record<Size, number> = { sm: 14, md: 16, lg: 18 };

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-green-700 text-green-50 shadow-xs hover:bg-green-800 disabled:opacity-50',
  secondary:
    'bg-transparent text-ink-900 border border-ink-300 hover:bg-ink-50 disabled:opacity-50',
  ghost:
    'bg-transparent text-green-700 hover:bg-green-50 rounded-sm disabled:opacity-50',
  dark: 'bg-ink-900 text-white hover:bg-ink-800 disabled:opacity-50',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      fullWidth,
      leftIcon: LeftIcon,
      rightIcon: RightIcon,
      loading,
      disabled,
      className,
      children,
      ...rest
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center font-semibold rounded-pill transition-all duration-200 ease-out-expo cursor-pointer disabled:cursor-not-allowed font-sans',
          sizeClasses[size],
          variantClasses[variant],
          fullWidth && 'w-full',
          className
        )}
        {...rest}
      >
        {loading ? (
          <span
            className="inline-block rounded-pill border-2 border-current border-t-transparent animate-spin"
            style={{ width: iconSizes[size], height: iconSizes[size] }}
          />
        ) : (
          LeftIcon && <LeftIcon size={iconSizes[size]} strokeWidth={1.75} />
        )}
        {children}
        {RightIcon && !loading && (
          <RightIcon size={iconSizes[size]} strokeWidth={1.75} />
        )}
      </button>
    );
  }
);
Button.displayName = 'Button';