import * as React from "react";
import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    className={cn(
      "flex min-h-[88px] w-full rounded-xl border border-border bg-surface-elevated px-3.5 py-2.5 text-sm text-foreground outline-none transition-shadow placeholder:text-ink-500 focus-visible:ring-2 focus-visible:ring-ring dark:placeholder:text-ink-400",
      className,
    )}
    ref={ref}
    {...props}
  />
));
Textarea.displayName = "Textarea";
