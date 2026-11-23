"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Bell } from "@/components/icons";
import { api } from "@/lib/api";
import { useAccessToken } from "@/lib/hooks";
import { formatDate, cn } from "@/lib/utils";

type AppNotification = {
  id: string;
  type: string;
  title: string;
  body?: string | null;
  link?: string | null;
  createdAt: string;
  unread: boolean;
};

const PANEL_W = 360;

export function NotificationsBell() {
  const { t } = useTranslation();
  const router = useRouter();
  const token = useAccessToken();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState({ top: 56, left: 8, width: PANEL_W });
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setMounted(true), []);

  const unreadQ = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: () => api<{ count: number }>("/notifications/unread-count"),
    enabled: Boolean(token),
    refetchInterval: 30_000,
    retry: false,
  });

  const listQ = useQuery({
    queryKey: ["notifications", "list"],
    queryFn: () => api<AppNotification[]>("/notifications?take=30"),
    enabled: Boolean(token) && open,
    retry: false,
  });

  const markRead = useMutation({
    mutationFn: (id: string) =>
      api(`/notifications/${id}/read`, { method: "PATCH" }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markAll = useMutation({
    mutationFn: () => api("/notifications/read-all", { method: "POST" }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  function placePanel() {
    const r = btnRef.current?.getBoundingClientRect();
    if (!r) return;
    const width = Math.min(PANEL_W, Math.max(240, window.innerWidth - 16));
    const left = Math.min(
      Math.max(8, r.right - width),
      Math.max(8, window.innerWidth - width - 8),
    );
    setPos({ top: r.bottom + 8, left, width });
  }

  function toggleOpen(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (open) {
      setOpen(false);
      return;
    }
    placePanel();
    setOpen(true);
  }

  useEffect(() => {
    if (!open) return;
    placePanel();
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") setOpen(false);
    };
    const onReposition = () => placePanel();
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onReposition);
    window.addEventListener("scroll", onReposition, true);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", onReposition, true);
    };
  }, [open]);

  const count = unreadQ.data?.count ?? 0;
  const items = listQ.data ?? [];

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className="relative inline-flex h-9 w-9 shrink-0 items-center justify-center overflow-visible rounded-lg text-foreground hover:bg-ink-100 dark:hover:bg-ink-800"
        aria-label={t("notifications.title", { defaultValue: "Notifications" })}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={toggleOpen}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <Bell className="h-4 w-4 shrink-0" aria-hidden />
        {count > 0 ? (
          <span className="absolute bottom-0.5 right-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-rose-600 px-1 text-[9px] font-bold leading-none text-white ring-2 ring-surface">
            {count > 99 ? "99+" : count}
          </span>
        ) : null}
      </button>

      {mounted &&
        open &&
        createPortal(
          <div className="fixed inset-0 z-[9999]" role="presentation">
            <button
              type="button"
              className="absolute inset-0 cursor-default bg-black/20"
              aria-label={t("common.close", { defaultValue: "Đóng" })}
              onClick={() => setOpen(false)}
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-label={t("notifications.title", {
                defaultValue: "Thông báo",
              })}
              className="absolute overflow-hidden rounded-xl border border-border bg-surface text-foreground shadow-xl"
              style={{
                top: pos.top,
                left: pos.left,
                width: pos.width,
                maxHeight: "min(70vh, 28rem)",
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2.5">
                <span className="text-sm font-semibold">
                  {t("notifications.title", { defaultValue: "Thông báo" })}
                </span>
                <button
                  type="button"
                  className="text-xs font-medium text-accent-700 disabled:opacity-40 dark:text-accent-300"
                  disabled={count === 0 || markAll.isPending}
                  onClick={() => markAll.mutate()}
                >
                  {t("notifications.markAllRead", {
                    defaultValue: "Đánh dấu đã đọc",
                  })}
                </button>
              </div>
              <div className="max-h-[min(60vh,24rem)] overflow-y-auto">
                {listQ.isLoading ? (
                  <p className="px-3 py-6 text-center text-sm text-muted">
                    {t("common.loading")}
                  </p>
                ) : listQ.isError ? (
                  <p className="px-3 py-6 text-center text-sm text-muted">
                    {t("notifications.loadFailed", {
                      defaultValue: "Không tải được thông báo.",
                    })}
                  </p>
                ) : items.length === 0 ? (
                  <p className="px-3 py-6 text-center text-sm text-muted">
                    {t("notifications.empty", {
                      defaultValue: "Chưa có thông báo.",
                    })}
                  </p>
                ) : (
                  <ul>
                    {items.map((n) => (
                      <li key={n.id}>
                        <button
                          type="button"
                          className={cn(
                            "block w-full border-b border-border/60 px-3 py-2.5 text-left hover:bg-surface-elevated",
                            n.unread && "bg-accent-soft/30",
                          )}
                          onClick={() => {
                            if (n.unread) markRead.mutate(n.id);
                            setOpen(false);
                            if (n.link) router.push(n.link);
                          }}
                        >
                          <span className="block text-sm font-medium">
                            {n.title}
                          </span>
                          {n.body ? (
                            <span className="mt-0.5 block line-clamp-2 text-xs text-muted">
                              {n.body}
                            </span>
                          ) : null}
                          <span className="mt-1 block text-[11px] text-muted">
                            {formatDate(n.createdAt)}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
