"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAnalytics, useOrgId, useUsage } from "@/lib/hooks";
import { api, ApiError } from "@/lib/api";
import { useCanViewAnalytics } from "@/lib/org-role";
import { labelStatus } from "@/lib/i18n-labels";
import { confirmDialog, toast } from "@/components/feedback";

type AuditRow = {
  id: string;
  action: string;
  resourceType?: string | null;
  resourceId?: string | null;
  createdAt: string;
  actor?: { name?: string; email?: string } | null;
};

type EvalRow = {
  id: string;
  status: string;
  score?: number | null;
  createdAt: string;
  finishedAt?: string | null;
  error?: string | null;
};

export default function AnalyticsPage() {
  const { t } = useTranslation();
  const orgId = useOrgId();
  const canView = useCanViewAnalytics();
  const { data: usage, isLoading: usageLoading, error: usageError } =
    useUsage(canView);
  const {
    data: analytics,
    isLoading: analyticsLoading,
    error: analyticsError,
  } = useAnalytics(canView);
  const [audits, setAudits] = useState<AuditRow[]>([]);
  const [evals, setEvals] = useState<EvalRow[]>([]);
  const [evalBusy, setEvalBusy] = useState(false);

  useEffect(() => {
    if (!orgId || !canView) return;
    void api<AuditRow[]>(`/organizations/${orgId}/audit-logs?limit=20`, {
      orgId,
    })
      .then(setAudits)
      .catch(() => undefined);
    void api<EvalRow[]>(`/organizations/${orgId}/eval-runs`, { orgId })
      .then(setEvals)
      .catch(() => undefined);
  }, [orgId, canView]);

  if (!orgId) {
    return <Card>{t("common.selectOrgFirst")}</Card>;
  }

  if (!canView) {
    return (
      <Card>
        <p className="text-sm text-rose-600">{t("analytics.forbidden")}</p>
      </Card>
    );
  }

  const totals = usage?.totals;
  const err = (usageError || analyticsError) as Error | null;

  if (err) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="font-display text-3xl font-semibold tracking-tight">
            {t("analytics.title")}
          </h2>
          <p className="mt-1.5 text-sm text-muted">{t("analytics.subtitle")}</p>
        </div>
        <Card>
          <p className="text-sm text-rose-600">
            {err instanceof ApiError
              ? err.message
              : err.message || t("analytics.loadFailed")}
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">
          {t("nav.analytics")}
        </p>
        <h2 className="font-display mt-2 text-3xl font-semibold tracking-tight">
          {t("analytics.title")}
        </h2>
        <p className="mt-1.5 text-sm text-muted">{t("analytics.subtitle")}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-sm text-muted">{t("analytics.requests")}</p>
          <p className="mt-2 text-3xl font-semibold">
            {usageLoading ? "…" : totals?.requests ?? 0}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">{t("analytics.tokensIn")}</p>
          <p className="mt-2 text-3xl font-semibold">
            {usageLoading ? "…" : totals?.tokensIn ?? 0}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">{t("analytics.tokensOut")}</p>
          <p className="mt-2 text-3xl font-semibold">
            {usageLoading ? "…" : totals?.tokensOut ?? 0}
          </p>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <h3 className="font-medium">{t("analytics.documentsByStatus")}</h3>
          <ul className="mt-3 space-y-1 text-sm">
            {analyticsLoading && (
              <li className="text-slate-500">{t("common.loading")}</li>
            )}
            {(analytics?.documentsByStatus || []).map((row) => (
              <li key={row.status} className="flex justify-between">
                <span>{labelStatus(t, row.status)}</span>
                <span className="font-medium">{row._count}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <h3 className="font-medium">{t("analytics.ingestionJobs")}</h3>
          <ul className="mt-3 space-y-1 text-sm">
            {analyticsLoading && (
              <li className="text-slate-500">{t("common.loading")}</li>
            )}
            {(analytics?.ingestionJobsByStatus || []).map((row) => (
              <li key={row.status} className="flex justify-between">
                <span>{labelStatus(t, row.status)}</span>
                <span className="font-medium">{row._count}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <h3 className="font-medium">{t("analytics.usageByFeature")}</h3>
          <ul className="mt-3 space-y-1 text-sm">
            {(usage?.byFeature || []).map((row) => (
              <li key={row.feature} className="flex justify-between gap-3">
                <span>{row.feature}</span>
                <span className="font-medium">
                  {t("analytics.usageRow", {
                    count: row._count,
                    tokensIn: row._sum.tokensIn ?? 0,
                    tokensOut: row._sum.tokensOut ?? 0,
                  })}
                </span>
              </li>
            ))}
            {!usageLoading && (usage?.byFeature?.length ?? 0) === 0 && (
              <li className="text-slate-500">{t("analytics.usageEmpty")}</li>
            )}
          </ul>
        </Card>
        <Card>
          <h3 className="font-medium">{t("analytics.feedbackSection")}</h3>
          <ul className="mt-3 space-y-1 text-sm">
            {(analytics?.feedbackByRating || []).map((row) => (
              <li key={row.rating} className="flex justify-between">
                <span>{row.rating}</span>
                <span className="font-medium">{row._count}</span>
              </li>
            ))}
            {!analyticsLoading &&
              (analytics?.feedbackByRating?.length ?? 0) === 0 && (
                <li className="text-slate-500">{t("analytics.feedbackEmpty")}</li>
              )}
          </ul>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 className="font-medium">{t("analytics.evalTitle")}</h3>
            <Button
              size="sm"
              variant="outline"
              disabled={evalBusy}
              onClick={async () => {
                if (!orgId) return;
                const ok = await confirmDialog({
                  title: t("feedback.runEvalTitle"),
                  description: t("feedback.runEvalDesc"),
                  confirmLabel: t("analytics.runEval"),
                });
                if (!ok) return;
                setEvalBusy(true);
                try {
                  const run = await api<EvalRow>(
                    `/organizations/${orgId}/eval-runs`,
                    { method: "POST", orgId, body: {} },
                  );
                  setEvals((prev) => [run, ...prev]);
                  toast.success(
                    t("analytics.evalDone", {
                      score: run.score != null ? Math.round(run.score * 100) : "—",
                    }),
                  );
                } catch (err) {
                  toast.error(
                    t("common.failed"),
                    err instanceof ApiError ? err.message : String(err),
                  );
                } finally {
                  setEvalBusy(false);
                }
              }}
            >
              {t("analytics.runEval")}
            </Button>
          </div>
          <ul className="mt-3 space-y-1 text-sm">
            {evals.slice(0, 8).map((row) => (
              <li key={row.id} className="flex justify-between gap-2">
                <span>
                  {row.status}
                  {row.score != null ? ` · ${Math.round(row.score * 100)}%` : ""}
                </span>
                <span className="text-xs text-muted">
                  {new Date(row.createdAt).toLocaleString()}
                </span>
              </li>
            ))}
            {evals.length === 0 && (
              <li className="text-slate-500">{t("analytics.evalEmpty")}</li>
            )}
          </ul>
        </Card>
        <Card>
          <h3 className="font-medium">{t("analytics.auditTitle")}</h3>
          <ul className="mt-3 max-h-64 space-y-1 overflow-auto text-sm">
            {audits.map((row) => (
              <li key={row.id} className="border-b border-border/60 py-1">
                <span className="font-medium">{row.action}</span>
                <span className="text-xs text-muted">
                  {" "}
                  · {row.actor?.email || "system"} ·{" "}
                  {new Date(row.createdAt).toLocaleString()}
                </span>
              </li>
            ))}
            {audits.length === 0 && (
              <li className="text-slate-500">{t("analytics.auditEmpty")}</li>
            )}
          </ul>
        </Card>
      </div>
    </div>
  );
}
