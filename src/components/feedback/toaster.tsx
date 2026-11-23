"use client";

import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { CheckCircle2, CircleAlert, Info, TriangleAlert, X } from "@/components/icons";
import { cn } from "@/lib/utils";
import { useToastStore, type ToastTone } from "@/components/feedback/toast-store";

const ICONS: Record<ToastTone, typeof Info> = {
  success: CheckCircle2,
  error: CircleAlert,
  info: Info,
  warn: TriangleAlert,
};

export function Toaster() {
  const { t } = useTranslation();
  const items = useToastStore((s) => s.items);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-20 z-[80] flex flex-col items-end gap-2 px-4 md:bottom-6 md:right-6 md:left-auto md:w-[380px]"
      aria-live="polite"
    >
      {items.map((item) => (
        <ToastCard
          key={item.id}
          item={item}
          dismissLabel={t("common.dismiss")}
          onDismiss={() => dismiss(item.id)}
        />
      ))}
    </div>
  );
}

function ToastCard({
  item,
  dismissLabel,
  onDismiss,
}: {
  item: { id: string; tone: ToastTone; title: string; description?: string; durationMs: number };
  dismissLabel: string;
  onDismiss: () => void;
}) {
  const Icon = ICONS[item.tone];

  useEffect(() => {
    const timer = window.setTimeout(onDismiss, item.durationMs);
    return () => window.clearTimeout(timer);
  }, [item.durationMs, onDismiss]);

  return (
    <div
      role="status"
      className={cn(
        "pointer-events-auto flex w-full items-start gap-3 rounded-xl border px-3.5 py-3 shadow-panel backdrop-blur-sm animate-[fade-up_0.25s_ease-out]",
        item.tone === "success" &&
          "border-emerald-300/70 bg-emerald-50 text-emerald-950 dark:border-emerald-700 dark:bg-emerald-950/90 dark:text-emerald-50",
        item.tone === "error" &&
          "border-rose-300/70 bg-rose-50 text-rose-950 dark:border-rose-700 dark:bg-rose-950/90 dark:text-rose-50",
        item.tone === "warn" &&
          "border-amber-300/70 bg-amber-50 text-amber-950 dark:border-amber-700 dark:bg-amber-950/90 dark:text-amber-50",
        item.tone === "info" &&
          "border-border bg-surface-elevated text-foreground",
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0 opacity-90" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold leading-snug">{item.title}</p>
        {item.description && (
          <p className="mt-0.5 text-xs leading-relaxed opacity-85">{item.description}</p>
        )}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="rounded-md p-1 opacity-70 hover:opacity-100"
        aria-label={dismissLabel}
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
