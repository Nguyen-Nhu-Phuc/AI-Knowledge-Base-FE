import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        "flex h-11 w-full rounded-xl border border-border bg-surface-elevated px-3.5 py-2 text-sm text-foreground outline-none transition-shadow placeholder:text-ink-500 focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-80 disabled:text-muted dark:placeholder:text-ink-400",
        className,
      )}
      ref={ref}
      {...props}
    />
  ),
);
Input.displayName = "Input";
