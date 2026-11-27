"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { X } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Full-height right drawer portaled to body — avoids app-shell stacking / scroll traps. */
export function SideSheet({
  open,
  onClose,
  title,
  subtitle,
  headerActions,
  children,
  wide = false,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
  wide?: boolean;
  className?: string;
}) {
  const { t } = useTranslation();

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-ink-950/45"
        aria-label={t("common.close")}
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "relative z-[1] flex h-full w-full flex-col border-l border-border bg-surface-elevated shadow-panel",
          "translate-x-0 transition-transform duration-200 ease-out",
          "pt-[var(--safe-top)] pb-[var(--safe-bottom)]",
          wide ? "max-w-3xl sm:max-w-4xl" : "max-w-xl sm:max-w-2xl",
          className,
        )}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border px-4 py-3.5 sm:px-5">
          <div className="min-w-0 pt-0.5">
            <h2 className="truncate font-display text-base font-semibold tracking-tight sm:text-lg">
              {title}
            </h2>
            {subtitle ? (
              <p className="mt-0.5 truncate text-xs text-muted">{subtitle}</p>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {headerActions}
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-9 w-9"
              aria-label={t("common.close")}
              title={t("common.close")}
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {children}
        </div>
      </aside>
    </div>,
    document.body,
  );
}
