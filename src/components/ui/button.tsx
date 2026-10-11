import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { Spinner } from "./spinner";

const variants = {
  primary: "bg-accent-grad text-accent-ink shadow-glow hover:brightness-110 active:scale-[0.98] transition-all",
  secondary: "bg-surface text-ink border border-line hover:bg-surface-2 hover:border-line-strong shadow-card active:scale-[0.98] transition-all",
  ghost: "text-muted hover:text-ink hover:bg-surface-2 active:scale-[0.98] transition-all",
  danger: "bg-coral text-white shadow-sm hover:opacity-95 active:scale-[0.98] transition-all",
} as const;

const sizes = {
  sm: "h-8 px-3 text-[13px] gap-1.5",
  md: "h-9 px-3.5 text-sm gap-2",
  lg: "h-11 px-5 text-[14px] gap-2",
  icon: "size-9",
} as const;

export type ButtonVariant = keyof typeof variants;

/** Shared so links can look like buttons without nesting <button> in <a>. */
export function buttonStyles({ variant = "primary", size = "md" }: { variant?: ButtonVariant; size?: keyof typeof sizes } = {}) {
  return cn(
    "inline-flex select-none items-center justify-center whitespace-nowrap rounded-[var(--radius-control)] font-medium tracking-tight",
    "transition-[background-color,border-color,filter,transform,box-shadow,opacity] duration-150",
    "disabled:pointer-events-none disabled:opacity-50",
    variants[variant],
    sizes[size],
  );
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: keyof typeof sizes;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", loading = false, disabled, children, type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(buttonStyles({ variant, size }), className)}
      {...props}
    >
      {loading && <Spinner size="sm" className="text-current" label="Working" />}
      {children}
    </button>
  );
});
