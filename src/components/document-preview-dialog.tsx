"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { SideSheet } from "@/components/side-sheet";
import { cn } from "@/lib/utils";

export type DocumentPreviewPayload = {
  url: string;
  filename: string;
  mimeType: string;
  title?: string;
};

function isImage(mime: string) {
  return mime.startsWith("image/");
}

function isPdf(mime: string) {
  return mime === "application/pdf";
}

function isText(mime: string, filename: string) {
  if (mime.startsWith("text/") || mime === "application/json") return true;
  const lower = filename.toLowerCase();
  return (
    lower.endsWith(".md") ||
    lower.endsWith(".markdown") ||
    lower.endsWith(".txt") ||
    lower.endsWith(".csv") ||
    lower.endsWith(".json")
  );
}

export function DocumentPreviewDialog({
  open,
  payload,
  onClose,
}: {
  open: boolean;
  payload: DocumentPreviewPayload | null;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [text, setText] = useState<string | null>(null);
  const [textError, setTextError] = useState(false);
  const [loadingText, setLoadingText] = useState(false);

  useEffect(() => {
    if (!open || !payload) {
      setText(null);
      setTextError(false);
      setLoadingText(false);
      return;
    }
    if (!isText(payload.mimeType, payload.filename)) {
      setText(null);
      return;
    }
    let cancelled = false;
    setLoadingText(true);
    setTextError(false);
    void fetch(payload.url)
      .then(async (res) => {
        if (!res.ok) throw new Error("fetch failed");
        const body = await res.text();
        if (!cancelled) setText(body);
      })
      .catch(() => {
        if (!cancelled) {
          setText(null);
          setTextError(true);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingText(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, payload]);

  if (!payload) return null;

  const title = payload.title || payload.filename;
  const showImage = isImage(payload.mimeType);
  const showPdf = isPdf(payload.mimeType);
  const showText = isText(payload.mimeType, payload.filename);

  return (
    <SideSheet
      open={open}
      onClose={onClose}
      title={title}
      subtitle={`${payload.filename}${payload.mimeType ? ` · ${payload.mimeType}` : ""}`}
      wide
      headerActions={
        <a
          href={payload.url}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "inline-flex h-9 items-center rounded-lg border border-border px-3 text-xs font-medium",
            "hover:bg-ink-100 dark:hover:bg-ink-800",
          )}
        >
          {t("kb.openExternal")}
        </a>
      }
    >
      <div className="h-full min-h-0 bg-ink-50/50 p-4 dark:bg-ink-950/30 sm:p-5">
        {showImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={payload.url}
            alt={title}
            className="mx-auto max-h-[calc(100dvh-8rem)] max-w-full rounded-lg object-contain"
          />
        ) : showPdf ? (
          <iframe
            title={title}
            src={payload.url}
            className="h-[calc(100dvh-8rem)] w-full rounded-lg border border-border bg-white"
          />
        ) : showText ? (
          loadingText ? (
            <p className="p-6 text-center text-sm text-muted">
              {t("common.loading")}
            </p>
          ) : textError ? (
            <div className="space-y-3 p-6 text-center text-sm">
              <p className="text-muted">{t("kb.previewUnsupported")}</p>
              <a
                href={payload.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-accent-700 underline dark:text-accent-300"
              >
                {t("kb.openExternal")}
              </a>
            </div>
          ) : (
            <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded-xl border border-border bg-surface p-4 font-mono text-[13px] leading-relaxed text-foreground">
              {text}
            </pre>
          )
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-20 text-center">
            <p className="max-w-md text-sm text-muted">
              {t("kb.previewUnsupported")}
            </p>
            <a
              href={payload.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 items-center rounded-lg bg-accent-700 px-4 text-sm font-medium text-white hover:bg-accent-600 dark:bg-accent-400 dark:text-ink-950 dark:hover:bg-accent-300"
            >
              {t("kb.openExternal")}
            </a>
          </div>
        )}
      </div>
    </SideSheet>
  );
}
