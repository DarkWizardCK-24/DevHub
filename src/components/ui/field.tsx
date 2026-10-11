"use client";

import { Eye, EyeOff } from "lucide-react";
import { forwardRef, useId, useState, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const controlBase =
  "w-full rounded-[var(--radius-control)] border bg-surface px-3.5 text-[13px] text-ink placeholder:text-faint shadow-xs transition-all " +
  "focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15 disabled:opacity-60";

interface FieldShellProps {
  label: string;
  error?: string;
  hint?: ReactNode;
  id: string;
  children: ReactNode;
  trailingLabel?: ReactNode;
}

/** Label + control + hint/error, wired up with aria attributes for screen readers. */
function FieldShell({ label, error, hint, id, children, trailingLabel }: FieldShellProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-xs font-medium text-ink tracking-tight">
          {label}
        </label>
        {trailingLabel}
      </div>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-xs text-coral" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-[11px] text-faint">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: ReactNode;
  trailingLabel?: ReactNode;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, error, hint, trailingLabel, className, type = "text", id: idProp, ...props },
  ref,
) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const [revealed, setRevealed] = useState(false);
  const isPassword = type === "password";

  return (
    <FieldShell label={label} error={error} hint={hint} id={id} trailingLabel={trailingLabel}>
      <div className="relative">
        <input
          ref={ref}
          id={id}
          type={isPassword && revealed ? "text" : type}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          className={cn(controlBase, "h-10", error ? "border-coral" : "border-line/80 hover:border-line-strong", isPassword && "pr-9", className)}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setRevealed((value) => !value)}
            aria-label={revealed ? "Hide password" : "Show password"}
            className="absolute inset-y-0 right-0 grid w-9 place-items-center text-faint hover:text-ink"
          >
            {revealed ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        )}
      </div>
    </FieldShell>
  );
});

export interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  hint?: ReactNode;
}

export const TextAreaField = forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(function TextAreaField(
  { label, error, hint, className, id: idProp, ...props },
  ref,
) {
  const autoId = useId();
  const id = idProp ?? autoId;
  return (
    <FieldShell label={label} error={error} hint={hint} id={id}>
      <textarea
        ref={ref}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={cn(controlBase, "min-h-24 py-2.5", error ? "border-coral" : "border-line", className)}
        {...props}
      />
    </FieldShell>
  );
});
