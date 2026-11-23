"use client";

import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useConfirmStore } from "@/components/feedback/confirm-store";

export function ConfirmDialogHost() {
  const { t } = useTranslation();
  const open = useConfirmStore((s) => s.open);
  const options = useConfirmStore((s) => s.options);
  const close = useConfirmStore((s) => s.close);
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    confirmRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  if (!open || !options) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-ink-950/55 backdrop-blur-[2px]"
        aria-label={t("feedback.cancel")}
        onClick={() => close(false)}
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby={options.description ? "confirm-desc" : undefined}
        className="relative z-[1] w-full max-w-md rounded-2xl border border-border bg-surface-elevated p-5 shadow-panel"
      >
        <h2 id="confirm-title" className="font-display text-lg font-semibold tracking-tight">
          {options.title}
        </h2>
        {options.description && (
          <p id="confirm-desc" className="mt-2 text-sm text-foreground/80">
            {options.description}
          </p>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => close(false)}>
            {options.cancelLabel || t("feedback.cancel")}
          </Button>
          <Button
            ref={confirmRef}
            type="button"
            variant={options.danger ? "danger" : "default"}
            onClick={() => close(true)}
          >
            {options.confirmLabel || t("feedback.confirm")}
          </Button>
        </div>
      </div>
    </div>
  );
}
