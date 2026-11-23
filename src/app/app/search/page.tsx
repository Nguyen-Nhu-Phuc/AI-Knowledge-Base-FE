"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { FileText, MessageSquare, Search as SearchIcon } from "@/components/icons";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useKnowledgeBases, useOrgId, useSearch } from "@/lib/hooks";
import type { SearchHit } from "@/lib/types";
import { ApiError } from "@/lib/api";
import { toast } from "@/components/feedback";
import { AppPage } from "@/components/layout/app-page";

function SearchPageInner() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const orgId = useOrgId();
  const { data: kbs } = useKnowledgeBases();
  const activeKbs = useMemo(
    () => (kbs || []).filter((k) => k.status === "active"),
    [kbs],
  );
  const [kbId, setKbId] = useState(searchParams.get("kbId") || "");
  const [query, setQuery] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [results, setResults] = useState<SearchHit[]>([]);
  const [error, setError] = useState("");
  const search = useSearch(kbId);

  useEffect(() => {
    const stillValid = activeKbs.some((k) => k.id === kbId);
    if (!stillValid) {
      setKbId(activeKbs[0]?.id || "");
      setResults([]);
    }
  }, [orgId, activeKbs, kbId]);

  async function onSearch() {
    if (!kbId || !query.trim()) return;
    setError("");
    try {
      const data = await search.mutateAsync({
        query: query.trim(),
        verifiedOnly,
      });
      setResults(data.results || []);
    } catch (err) {
      setResults([]);
      const msg = err instanceof ApiError ? err.message : t("feedback.searchFail");
      setError(msg);
      toast.error(t("feedback.searchFail"), msg);
    }
  }

  const top = results[0];

  return (
    <AppPage>
      <div className="text-center md:text-left">
        <h2 className="font-display text-3xl font-semibold tracking-tight">
          {t("search.title")}
        </h2>
        <p className="mt-1.5 text-sm text-muted">{t("search.subtitle")}</p>
      </div>

      {/* Glean-style search bar */}
      <div className="ask-bar space-y-2 rounded-2xl p-3">
        <select
          className="h-9 w-full rounded-lg border border-border bg-transparent px-2.5 text-[13px]"
          value={kbId}
          onChange={(e) => {
            setKbId(e.target.value);
            setResults([]);
          }}
        >
          {activeKbs.length === 0 && (
            <option value="">{t("chat.selectKb")}</option>
          )}
          {activeKbs.map((kb) => (
            <option key={kb.id} value={kb.id}>
              {kb.name}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          <div className="relative min-w-0 flex-1">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              className="pl-9"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("search.placeholder")}
              onKeyDown={(e) => e.key === "Enter" && void onSearch()}
            />
          </div>
          <Button onClick={onSearch} disabled={search.isPending || !kbId}>
            {search.isPending ? t("common.loading") : t("search.submit")}
          </Button>
        </div>
        <label className="flex items-center gap-2 px-1 text-xs text-muted">
          <input
            type="checkbox"
            checked={verifiedOnly}
            onChange={(e) => setVerifiedOnly(e.target.checked)}
          />
          {t("search.verifiedOnly")}
        </label>
        {error && <p className="text-sm text-rose-600">{error}</p>}
      </div>

      {/* AI Answers strip (Glean pattern) */}
      {top && (
        <Card className="accent-soft border-accent-300 dark:border-accent-700">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide">
              {t("search.topResults")}
            </p>
            <Link
              href={`/app/chat?kbId=${kbId}&q=${encodeURIComponent(query)}`}
              className="inline-flex items-center gap-1 text-xs font-semibold underline-offset-2 hover:underline"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              {t("search.askInstead")}
            </Link>
          </div>
          <p className="font-medium">{top.title || t("search.untitledDocument")}</p>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {top.content.slice(0, 360)}
            {top.content.length > 360 ? "…" : ""}
          </p>
        </Card>
      )}

      <div className="space-y-2">
        {results.map((hit, i) => (
          <article
            key={hit.chunkId}
            className="surface-panel rounded-2xl p-4 transition hover:shadow-soft"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <span className="cite-chip">[{i + 1}]</span>
                <FileText className="h-4 w-4 shrink-0 text-muted" />
                <p className="truncate font-medium">
                  {hit.title || t("search.untitledDocument")}
                </p>
              </div>
              <p className="shrink-0 text-[11px] text-muted">
                {t("search.score")} {(hit.score * 100).toFixed(1)}%
              </p>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {hit.content.slice(0, 420)}
              {hit.content.length > 420 ? "…" : ""}
            </p>
          </article>
        ))}
        {!search.isPending && !error && results.length === 0 && (
          <p className="py-8 text-center text-sm text-muted">{t("search.empty")}</p>
        )}
      </div>
    </AppPage>
  );
}

function SearchFallback() {
  const { t } = useTranslation();
  return (
    <Card>
      <p className="text-sm text-muted">{t("search.loading")}</p>
    </Card>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchFallback />}>
      <SearchPageInner />
    </Suspense>
  );
}
