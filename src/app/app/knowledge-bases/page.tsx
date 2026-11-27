"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Archive,
  BookOpen,
  MessageSquare,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
  Upload,
} from "@/components/icons";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn, formatDate } from "@/lib/utils";
import {
  useCreateKb,
  useDeleteKb,
  useKnowledgeBases,
  useOrgId,
  useUpdateKb,
} from "@/lib/hooks";
import { ApiError } from "@/lib/api";
import { useCanCreateKb, useCanManageKbAdmin } from "@/lib/org-role";
import { confirmDialog, toast } from "@/components/feedback";
import { labelStatus } from "@/lib/i18n-labels";
import { AppPage } from "@/components/layout/app-page";
import type { KnowledgeBase } from "@/lib/types";

type StatusFilter = "all" | "active" | "archived";

export default function KnowledgeBasesPage() {
  const { t } = useTranslation();
  const orgId = useOrgId();
  const canCreate = useCanCreateKb();
  const canAdmin = useCanManageKbAdmin();
  const { data: kbs, isLoading, isError, error: loadError } = useKnowledgeBases();
  const createKb = useCreateKb();
  const updateKb = useUpdateKb();
  const deleteKb = useDeleteKb();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpenId) return;
    function onDown(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpenId(null);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpenId(null);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpenId]);

  const counts = useMemo(() => {
    const list = kbs || [];
    return {
      total: list.length,
      active: list.filter((k) => k.status === "active").length,
      archived: list.filter((k) => k.status === "archived").length,
    };
  }, [kbs]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (kbs || []).filter((kb) => {
      if (filter !== "all" && kb.status !== filter) return false;
      if (!q) return true;
      return (
        kb.name.toLowerCase().includes(q) ||
        (kb.description || "").toLowerCase().includes(q)
      );
    });
  }, [kbs, filter, query]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    if (!orgId || !canCreate) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    const ok = await confirmDialog({
      title: t("feedback.createKbTitle"),
      description: t("feedback.createKbDesc", { name: trimmed }),
      confirmLabel: t("common.create"),
    });
    if (!ok) return;
    setError("");
    try {
      await createKb.mutateAsync({
        name: trimmed,
        description: description || undefined,
      });
      setName("");
      setDescription("");
      setCreateOpen(false);
      toast.success(t("feedback.createKbOk"));
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : t("kb.createFailed");
      setError(msg);
      toast.error(t("kb.createFailed"), msg);
    }
  }

  async function onArchiveToggle(kb: KnowledgeBase) {
    const archiving = kb.status === "active";
    const ok = await confirmDialog({
      title: archiving ? t("feedback.archiveKbTitle") : t("feedback.restoreKbTitle"),
      description: archiving ? t("feedback.archiveKbDesc") : undefined,
      confirmLabel: archiving ? t("kb.archive") : t("kb.restore"),
    });
    if (!ok) return;
    setMenuOpenId(null);
    updateKb.mutate(
      { kbId: kb.id, status: archiving ? "archived" : "active" },
      {
        onSuccess: () =>
          toast.success(
            archiving ? t("feedback.archiveOk") : t("feedback.restoreOk"),
          ),
        onError: (err) => {
          const msg = err instanceof Error ? err.message : t("common.failed");
          setError(msg);
          toast.error(t("common.failed"), msg);
        },
      },
    );
  }

  async function onDelete(kb: KnowledgeBase) {
    const ok = await confirmDialog({
      title: t("feedback.deleteKbTitle"),
      description: t("feedback.deleteKbDesc"),
      confirmLabel: t("common.delete"),
      danger: true,
    });
    if (!ok) return;
    setMenuOpenId(null);
    deleteKb.mutate(kb.id, {
      onSuccess: () => toast.success(t("feedback.deleteOk")),
      onError: (err) => {
        const msg =
          err instanceof Error ? err.message : t("feedback.deleteFail");
        setError(msg);
        toast.error(t("feedback.deleteFail"), msg);
      },
    });
  }

  const filters: { id: StatusFilter; label: string; count: number }[] = [
    { id: "all", label: t("kb.filterAll"), count: counts.total },
    { id: "active", label: t("kb.filterActive"), count: counts.active },
    { id: "archived", label: t("kb.filterArchived"), count: counts.archived },
  ];

  return (
    <AppPage className="space-y-7 md:space-y-8">
      <header className="relative overflow-hidden rounded-3xl border border-border bg-surface-elevated px-5 py-6 sm:px-7 sm:py-8">
        <div
          className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full opacity-70"
          style={{
            background:
              "radial-gradient(circle, color-mix(in srgb, var(--theme-secondary) 32%, transparent), transparent 70%)",
          }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-24 left-10 h-48 w-48 rounded-full opacity-60"
          style={{
            background:
              "radial-gradient(circle, color-mix(in srgb, var(--theme-tertiary) 28%, transparent), transparent 70%)",
          }}
          aria-hidden
        />

        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0 max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">
              {t("nav.knowledge")}
            </p>
            <h2 className="font-display mt-2 text-3xl font-semibold tracking-tight sm:text-[2.15rem]">
              {t("kb.title")}
            </h2>
            <p className="mt-2 text-sm text-foreground/75 sm:text-[15px]">
              {t("kb.subtitle")}
            </p>
            {!isLoading && orgId ? (
              <p className="mt-3 text-xs font-medium text-muted">
                {t("kb.countLabel", { count: counts.total })}
                {counts.archived > 0
                  ? ` · ${counts.active} ${t("kb.filterActive").toLowerCase()} · ${counts.archived} ${t("kb.filterArchived").toLowerCase()}`
                  : null}
              </p>
            ) : null}
          </div>

          {canCreate && orgId ? (
            <Button
              type="button"
              onClick={() => setCreateOpen((v) => !v)}
              className="shrink-0"
            >
              <Plus className="h-4 w-4" />
              {createOpen ? t("kb.createCancel") : t("kb.createCta")}
            </Button>
          ) : null}
        </div>
      </header>

      {!orgId ? (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
          {t("kb.selectOrgFirst")}
        </div>
      ) : null}

      {canCreate && createOpen && orgId ? (
        <section className="surface-panel rounded-2xl p-5 sm:p-6">
          <h3 className="font-medium">{t("kb.createTitle")}</h3>
          <form onSubmit={onCreate} className="mt-4 grid gap-3 sm:grid-cols-2">
            <Input
              className="sm:col-span-2"
              placeholder={t("kb.namePlaceholder")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
            <Textarea
              className="sm:col-span-2 min-h-[88px]"
              placeholder={t("kb.descriptionPlaceholder")}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <div className="sm:col-span-2 flex flex-wrap gap-2">
              <Button type="submit" disabled={createKb.isPending}>
                {createKb.isPending ? t("kb.creating") : t("common.create")}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setCreateOpen(false)}
              >
                {t("feedback.cancel")}
              </Button>
            </div>
          </form>
        </section>
      ) : null}

      {!canCreate && orgId ? (
        <p className="text-sm text-muted">{t("kb.createForbidden")}</p>
      ) : null}

      {(error || isError) && (
        <p className="text-sm text-rose-600">
          {error || (loadError as Error)?.message || t("common.loadFailed")}
        </p>
      )}

      {orgId ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-1.5">
            {filters.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-colors",
                  filter === f.id
                    ? "bg-foreground text-background"
                    : "bg-ink-100 text-ink-700 hover:bg-ink-200 dark:bg-ink-800 dark:text-ink-200 dark:hover:bg-ink-700",
                )}
              >
                {f.label}
                <span className="tabular-nums opacity-70">{f.count}</span>
              </button>
            ))}
          </div>

          <label className="relative block w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("kb.searchPlaceholder")}
              className="pl-9"
            />
          </label>
        </div>
      ) : null}

      <section>
        {isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-40 animate-pulse rounded-2xl border border-border bg-ink-100/70 dark:bg-ink-800/50"
              />
            ))}
          </div>
        ) : (kbs?.length ?? 0) === 0 ? (
          <div className="flex flex-col items-center rounded-3xl border border-dashed border-border px-6 py-14 text-center">
            <span className="accent-soft mb-4 flex h-14 w-14 items-center justify-center rounded-2xl">
              <BookOpen className="h-6 w-6" />
            </span>
            <p className="font-display text-lg font-semibold">{t("kb.empty")}</p>
            <p className="mt-2 max-w-sm text-sm text-muted">{t("kb.emptyHint")}</p>
            {canCreate && orgId ? (
              <Button
                type="button"
                className="mt-5"
                onClick={() => setCreateOpen(true)}
              >
                <Plus className="h-4 w-4" />
                {t("kb.createCta")}
              </Button>
            ) : null}
          </div>
        ) : filtered.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted">
            {t("kb.noMatch")}
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((kb) => {
              const active = kb.status === "active";
              return (
                <li key={kb.id}>
                  <article
                    className={cn(
                      "group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface-elevated transition-[box-shadow,transform] duration-200",
                      "hover:-translate-y-0.5 hover:shadow-soft",
                      !active && "opacity-90",
                    )}
                  >
                    <div
                      className="h-1.5 w-full"
                      style={{
                        background: active
                          ? "linear-gradient(90deg, var(--theme-primary), var(--theme-secondary))"
                          : "color-mix(in srgb, var(--foreground) 18%, transparent)",
                      }}
                      aria-hidden
                    />

                    <div className="flex flex-1 flex-col p-4 sm:p-5">
                      <div className="flex items-start gap-3">
                        <Link
                          href={`/app/knowledge-bases/${kb.id}`}
                          className="accent-soft flex h-11 w-11 shrink-0 items-center justify-center rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          aria-label={kb.name}
                        >
                          <BookOpen className="h-5 w-5" />
                        </Link>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <Link
                              href={`/app/knowledge-bases/${kb.id}`}
                              className="min-w-0 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                              <h3 className="truncate font-semibold tracking-tight text-foreground group-hover:text-accent-700 dark:group-hover:text-accent-300">
                                {kb.name}
                              </h3>
                            </Link>
                            <Badge tone={active ? "success" : "warn"}>
                              {labelStatus(t, kb.status)}
                            </Badge>
                          </div>
                          <p className="mt-1.5 line-clamp-2 text-sm text-muted">
                            {kb.description || t("kb.defaultDescription")}
                          </p>
                          <p className="mt-2 text-[11px] text-muted">
                            {t("kb.updatedLabel", {
                              date: formatDate(kb.updatedAt),
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="mt-auto flex flex-wrap items-center gap-2 pt-5">
                        <Link
                          href={`/app/knowledge-bases/${kb.id}`}
                          className={cn(buttonVariants({ size: "sm" }))}
                        >
                          <BookOpen className="h-3.5 w-3.5" />
                          {t("kb.open")}
                        </Link>
                        <Link
                          href={`/app/chat?kbId=${kb.id}`}
                          className={cn(
                            buttonVariants({ variant: "outline", size: "sm" }),
                          )}
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                          {t("kb.chatCta")}
                        </Link>
                        {active ? (
                          <Link
                            href={`/app/knowledge-bases/${kb.id}`}
                            className={cn(
                              buttonVariants({ variant: "ghost", size: "sm" }),
                            )}
                          >
                            <Upload className="h-3.5 w-3.5" />
                            {t("kb.uploadCta")}
                          </Link>
                        ) : null}

                        {canAdmin ? (
                          <div
                            className="relative ml-auto"
                            ref={menuOpenId === kb.id ? menuRef : undefined}
                          >
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              aria-label={t("kb.actions")}
                              aria-expanded={menuOpenId === kb.id}
                              onClick={() =>
                                setMenuOpenId((id) =>
                                  id === kb.id ? null : kb.id,
                                )
                              }
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                            {menuOpenId === kb.id ? (
                              <div
                                role="menu"
                                className="absolute bottom-full right-0 z-20 mb-1.5 w-44 overflow-hidden rounded-xl border border-border bg-surface-elevated py-1 shadow-xl"
                              >
                                <button
                                  type="button"
                                  role="menuitem"
                                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] hover:bg-ink-100 dark:hover:bg-ink-800"
                                  disabled={updateKb.isPending}
                                  onClick={() => void onArchiveToggle(kb)}
                                >
                                  <Archive className="h-3.5 w-3.5 shrink-0" />
                                  {active ? t("kb.archive") : t("kb.restore")}
                                </button>
                                <button
                                  type="button"
                                  role="menuitem"
                                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-rose-600 hover:bg-ink-100 dark:text-rose-400 dark:hover:bg-ink-800"
                                  disabled={deleteKb.isPending}
                                  onClick={() => void onDelete(kb)}
                                >
                                  <Trash2 className="h-3.5 w-3.5 shrink-0" />
                                  {t("kb.deleteKb")}
                                </button>
                              </div>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        )}

        {(kbs?.length ?? 0) > 0 ? (
          <p className="mt-4 text-xs text-muted">
            {canAdmin ? t("kb.deleteKbHint") : t("kb.deleteKbAdminOnly")}
          </p>
        ) : null}
      </section>
    </AppPage>
  );
}
