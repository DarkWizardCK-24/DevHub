"use client";

import { Search, X } from "lucide-react";
import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const SearchInput = forwardRef<
  HTMLInputElement,
  Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> & { value: string; onValueChange: (value: string) => void }
>(function SearchInput({ value, onValueChange, className, placeholder = "Search", ...props }, ref) {
  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-faint" />
      <input
        ref={ref}
        type="search"
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-9 w-full rounded-[var(--radius-control)] border border-line/80 bg-surface pr-8 pl-9 text-xs placeholder:text-faint shadow-xs transition-all focus:border-accent focus:ring-2 focus:ring-accent/15 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
        {...props}
      />
      {value && (
        <button
          type="button"
          onClick={() => onValueChange("")}
          aria-label="Clear search"
          className="absolute top-1/2 right-2 grid size-7 -translate-y-1/2 place-items-center rounded-full text-faint hover:bg-raised hover:text-ink"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
});
