import { cn } from "@/lib/utils";

export function Badge({
  className,
  children,
  tone = "default",
}: {
  className?: string;
  children: React.ReactNode;
  tone?: "default" | "success" | "warn" | "danger" | "info";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
        tone === "default" && "bg-ink-100 text-ink-700 dark:bg-ink-800 dark:text-ink-200",
        tone === "success" && "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
        tone === "warn" && "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
        tone === "danger" && "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200",
        tone === "info" && "accent-soft",
        className,
      )}
    >
      {children}
    </span>
  );
}
