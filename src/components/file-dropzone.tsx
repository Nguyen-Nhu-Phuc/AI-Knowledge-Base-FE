"use client";

import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { CloudUpload, FileText, Upload } from "@/components/icons";
import { cn } from "@/lib/utils";

const ACCEPT =
  ".pdf,.docx,.xlsx,.txt,.md,.markdown,.png,.jpg,.jpeg,.webp,.tif,.tiff,application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain,text/markdown,image/*";

const FORMAT_CHIPS = ["PDF", "DOCX", "XLSX", "TXT", "MD", "IMG"] as const;

export function FileDropzone({
  disabled,
  uploading,
  onFiles,
  className,
}: {
  disabled?: boolean;
  uploading?: boolean;
  onFiles: (files: FileList | File[]) => void;
  className?: string;
}) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const dragDepth = useRef(0);

  const blocked = disabled || uploading;

  const takeFiles = useCallback(
    (list: FileList | File[] | null) => {
      if (!list || blocked) return;
      const files = Array.from(list);
      if (!files.length) return;
      onFiles(files);
    },
    [blocked, onFiles],
  );

  return (
    <div className={cn("relative", className)}>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPT}
        className="sr-only"
        disabled={blocked}
        onChange={(e) => {
          takeFiles(e.target.files);
          e.target.value = "";
        }}
      />

      <button
        type="button"
        disabled={blocked}
        onClick={() => inputRef.current?.click()}
        onDragEnter={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (blocked) return;
          dragDepth.current += 1;
          setDragging(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          dragDepth.current = Math.max(0, dragDepth.current - 1);
          if (dragDepth.current === 0) setDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          dragDepth.current = 0;
          setDragging(false);
          takeFiles(e.dataTransfer.files);
        }}
        className={cn(
          "group relative flex w-full flex-col items-center overflow-hidden rounded-2xl border-2 border-dashed px-5 py-8 text-center transition-all duration-200 sm:py-10",
          "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          blocked && "cursor-not-allowed opacity-60",
          !blocked && "cursor-pointer",
          dragging
            ? "scale-[1.01] border-[var(--theme-primary)]"
            : "border-border bg-surface-elevated hover:border-[var(--theme-primary)]/50",
        )}
        style={
          dragging
            ? {
                background:
                  "color-mix(in srgb, var(--theme-primary) 10%, transparent)",
              }
            : undefined
        }
      >
        <div
          className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full opacity-60"
          style={{
            background:
              "radial-gradient(circle, color-mix(in srgb, var(--theme-secondary) 30%, transparent), transparent 70%)",
          }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-14 -left-8 h-32 w-32 rounded-full opacity-50"
          style={{
            background:
              "radial-gradient(circle, color-mix(in srgb, var(--theme-tertiary) 26%, transparent), transparent 70%)",
          }}
          aria-hidden
        />

        <span
          className={cn(
            "relative mb-4 flex h-14 w-14 items-center justify-center rounded-2xl transition-transform duration-200",
            "accent-soft",
            dragging && "scale-110",
            uploading && "animate-pulse",
          )}
        >
          {uploading ? (
            <Upload className="h-6 w-6" />
          ) : (
            <CloudUpload className="h-6 w-6" />
          )}
        </span>

        <p className="relative font-display text-base font-semibold tracking-tight sm:text-lg">
          {uploading ? t("kb.uploading") : t("kb.uploadDropTitle")}
        </p>
        {!uploading ? (
          <p className="relative mt-1.5 text-sm text-muted">
            {t("kb.uploadDropSubtitle")}
          </p>
        ) : null}

        <div className="relative mt-4 flex flex-wrap items-center justify-center gap-1.5">
          {FORMAT_CHIPS.map((chip) => (
            <span
              key={chip}
              className="inline-flex items-center gap-1 rounded-md bg-ink-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-700 dark:bg-ink-800 dark:text-ink-200"
            >
              <FileText className="h-3 w-3 opacity-70" aria-hidden />
              {chip}
            </span>
          ))}
        </div>

        <p className="relative mt-3 text-xs text-muted">{t("kb.uploadMaxSize")}</p>

        {!uploading ? (
          <span className="relative mt-5 inline-flex">
            <span
              className={cn(
                buttonLook(),
                "pointer-events-none group-hover:bg-accent-600 dark:group-hover:bg-accent-300",
              )}
            >
              <Upload className="h-3.5 w-3.5" />
              {t("kb.uploadBrowse")}
            </span>
          </span>
        ) : (
          <div className="relative mt-5 h-1.5 w-40 overflow-hidden rounded-full bg-ink-200 dark:bg-ink-700">
            <div className="upload-bar h-full w-1/2 rounded-full bg-[var(--theme-primary)]" />
          </div>
        )}
      </button>
    </div>
  );
}

function buttonLook() {
  return "inline-flex h-9 items-center gap-2 rounded-lg bg-accent-700 px-4 text-xs font-semibold text-white shadow-soft dark:bg-accent-400 dark:text-ink-950";
}

/** Compact drop target for version upload inside sheets. */
export function FileDropzoneCompact({
  disabled,
  uploading,
  onFiles,
  label,
}: {
  disabled?: boolean;
  uploading?: boolean;
  onFiles: (files: FileList | File[]) => void;
  label: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const blocked = disabled || uploading;

  return (
    <label
      className={cn(
        "inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-accent-700 dark:text-accent-300",
        blocked && "pointer-events-none opacity-50",
      )}
    >
      <Upload className="h-3.5 w-3.5" />
      <span>{uploading ? "…" : label}</span>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={ACCEPT}
        disabled={blocked}
        onChange={(e) => {
          if (e.target.files?.length) onFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </label>
  );
}
