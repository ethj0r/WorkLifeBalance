import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "dark" | "danger";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: ReactNode;
};

export function Button({ variant = "primary", size = "md", fullWidth, loading, leftIcon, children, className = "", disabled, ...props }: Props) {
  const variants = {
    primary: "bg-green-700 text-green-50 hover:bg-green-800 shadow-xs",
    secondary: "bg-transparent text-ink-900 border border-ink-300 hover:border-ink-900 hover:bg-ink-50",
    ghost: "bg-transparent text-green-700 hover:bg-green-50",
    dark: "bg-ink-900 text-white hover:bg-ink-800",
    danger: "bg-[#B23B3B] text-white hover:brightness-95",
  };
  const sizes = {
    sm: "px-4 py-2 text-[13px]",
    md: "px-5 py-3 text-[15px]",
    lg: "px-7 py-[15px] text-base",
  };
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${fullWidth ? "w-full" : ""} ${className}`}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : leftIcon}
      {children}
    </button>
  );
}
