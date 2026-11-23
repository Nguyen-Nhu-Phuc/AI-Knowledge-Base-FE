"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { ArrowRight, BookOpen, MessageSquare, Search, Sparkles } from "@/components/icons";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HowToSteps, RoleGuide } from "@/components/role-guide";
import { AppPage } from "@/components/layout/app-page";
import { toast } from "@/components/feedback";
import {
  useCreateOrg,
  useKnowledgeBases,
  useMyOrgCreateRequests,
  useOrganizations,
} from "@/lib/hooks";
import { useAuthStore } from "@/stores/auth-store";
import { Badge } from "@/components/ui/badge";
import { labelStatus } from "@/lib/i18n-labels";

export default function DashboardPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: orgs, isLoading: orgsLoading } = useOrganizations();
  const { data: kbs } = useKnowledgeBases();
  const { data: createRequests } = useMyOrgCreateRequests();
  const currentOrgId = useAuthStore((s) => s.currentOrgId);
  const createOrg = useCreateOrg();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [error, setError] = useState("");
  const [ask, setAsk] = useState("");
  const pendingRequests = (createRequests || []).filter(
    (r) => r.status === "pending",
  );

  const activeKbs = useMemo(
    () => (kbs || []).filter((k) => k.status === "active"),
    [kbs],
  );
  const defaultKbId = activeKbs[0]?.id;

  async function onCreateOrg(e: FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const result = await createOrg.mutateAsync({
        name,
        slug: slug || undefined,
      });
      setName("");
      setSlug("");
      if (result.status === "pending") {
        toast.success(t("feedback.orgCreatePending"));
      } else {
        toast.success(t("feedback.orgCreateOk"));
      }
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : t("dashboard.createOrgFailed");
      setError(msg);
      toast.error(t("dashboard.createOrgFailed"), msg);
    }
  }

  function goAsk(e: FormEvent) {
    e.preventDefault();
    if (!ask.trim() || !defaultKbId) return;
    const q = encodeURIComponent(ask.trim());
    router.push(`/app/chat?kbId=${defaultKbId}&q=${q}`);
  }

  return (
    <AppPage className="space-y-8 md:space-y-10">
      <section className="text-center">
        <div className="mx-auto mb-4 inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-elevated px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted">
          <Sparkles className="h-3.5 w-3.5 text-accent-600" />
          {t("nav.appName")}
        </div>
        <h2 className="font-display text-3xl font-semibold tracking-tight md:text-[2.35rem]">
          {t("dashboard.title")}
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-muted md:text-base">
          {t("dashboard.subtitle")}
        </p>

        <form
          onSubmit={goAsk}
          className="ask-bar mx-auto mt-6 flex w-full max-w-3xl flex-col gap-3 rounded-2xl p-3 text-left sm:mt-7 sm:p-4"
        >
          <label className="sr-only">{t("dashboard.askPlaceholder")}</label>
          <textarea
            value={ask}
            onChange={(e) => setAsk(e.target.value)}
            rows={3}
            placeholder={t("dashboard.askPlaceholder")}
            dir="ltr"
            className="block w-full resize-none overflow-y-auto border-0 bg-transparent px-1 py-1 text-left text-sm leading-relaxed text-foreground outline-none placeholder:text-left placeholder:text-muted"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void goAsk(e as unknown as FormEvent);
              }
            }}
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={!ask.trim() || !defaultKbId}
              className="shrink-0"
            >
              {t("dashboard.askCta")}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </form>
        <p className="mt-3 text-xs text-muted">{t("dashboard.askHint")}</p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/app/search")}
          >
            <Search className="h-3.5 w-3.5" />
            {t("dashboard.quickSearch")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/app/chat")}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            {t("nav.aiChat")}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/app/help")}
          >
            {t("dashboard.openGuide")}
          </Button>
        </div>
      </section>

      <HowToSteps />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <section className="min-w-0 text-left">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-muted">
              {t("dashboard.featured")}
            </h3>
            <Link
              href="/app/knowledge-bases"
              className="text-xs font-semibold text-accent-700 hover:underline dark:text-accent-300"
            >
              {t("common.manage")}
            </Link>
          </div>
          {(activeKbs.length ?? 0) === 0 ? (
            <div className="rounded-2xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted">
              {t("dashboard.noKbs")}
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {activeKbs.slice(0, 6).map((kb) => (
                <Link
                  key={kb.id}
                  href={`/app/knowledge-bases/${kb.id}`}
                  className="surface-panel group rounded-2xl p-4 transition hover:shadow-soft"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="accent-soft flex h-9 w-9 shrink-0 items-center justify-center rounded-xl">
                        <BookOpen className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-medium group-hover:text-accent-700 dark:group-hover:text-accent-300">
                          {kb.name}
                        </p>
                        <p className="mt-0.5 line-clamp-1 text-xs text-muted">
                          {kb.description || t("kb.subtitle")}
                        </p>
                      </div>
                    </div>
                    <Badge tone="success" className="shrink-0">
                      {labelStatus(t, kb.status)}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
        <RoleGuide />
      </div>

      {!orgsLoading && (orgs?.length ?? 0) === 0 && (
        <Card className="overflow-hidden p-0 text-left">
          <div className="border-b border-border/70 px-5 py-4">
            <h3 className="font-display text-lg font-semibold">
              {t("dashboard.createFirstOrg")}
            </h3>
            <p className="mt-1 text-xs text-muted">
              {t("dashboard.createOrgApprovalHint")}
            </p>
          </div>
          <form
            onSubmit={onCreateOrg}
            className="grid gap-3 p-5 md:grid-cols-[1.2fr_1fr_auto]"
          >
            <Input
              placeholder={t("dashboard.orgNamePlaceholder")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              placeholder={t("dashboard.slugPlaceholder")}
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
            />
            <Button disabled={createOrg.isPending}>
              {createOrg.isPending
                ? t("dashboard.creating")
                : t("dashboard.requestOrg")}
            </Button>
          </form>
          {error && <p className="px-5 pb-4 text-sm text-rose-600">{error}</p>}
          {pendingRequests.length > 0 && (
            <ul className="space-y-2 border-t border-border/70 px-5 py-4 text-sm">
              {pendingRequests.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between gap-2"
                >
                  <span>
                    {r.name}{" "}
                    <span className="text-muted">({r.slug})</span>
                  </span>
                  <Badge tone="warn">{t("status.pending")}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
    </AppPage>
  );
}
