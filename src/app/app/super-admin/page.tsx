"use client";

import { FormEvent, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { api, ApiError } from "@/lib/api";
import { useAccessToken, useMe } from "@/lib/hooks";
import { formatDate } from "@/lib/utils";
import { confirmDialog, toast } from "@/components/feedback";
import { labelStatus } from "@/lib/i18n-labels";
import { cn } from "@/lib/utils";
import { AppPage } from "@/components/layout/app-page";

type TabId =
  | "overview"
  | "requests"
  | "users"
  | "organizations"
  | "usage"
  | "settings"
  | "jobs";

type Overview = {
  users: {
    total: number;
    active: number;
    disabled: number;
    superAdmins: number;
  };
  organizations: { total: number; pendingCreateRequests: number };
  jobs: { failed: number };
  usageThisMonth: {
    requests: number;
    tokensIn: number;
    tokensOut: number;
    costUsdEstimate: number;
    avgLatencyMs: number;
  };
};

type AdminUser = {
  id: string;
  email: string;
  name: string;
  status: string;
  isPlatformAdmin: boolean;
  orgCount: number;
  createdAt: string;
};

type AdminOrg = {
  id: string;
  name: string;
  slug: string;
  plan: string;
  settings?: Record<string, unknown>;
  createdAt: string;
  _count: { members: number; knowledgeBases: number };
};

type AdminCreateRequest = {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  requester?: { id: string; email: string; name: string };
};

type AdminJob = {
  id: string;
  organizationId: string;
  documentId: string;
  status: string;
  errorMessage?: string | null;
  updatedAt: string;
};

type PlatformSettings = {
  defaultEmbeddingProvider: string;
  defaultLlmProvider: string;
  costPer1kInputUsd: number;
  costPer1kOutputUsd: number;
  notes?: string | null;
  runtime?: {
    aiServiceUrl?: string | null;
    nodeEnv?: string;
    platformAdminEmails?: string[];
  };
};

type PlatformUsage = {
  totals: {
    requests: number;
    tokensIn: number;
    tokensOut: number;
    costUsdEstimate: number;
    avgLatencyMs: number;
  };
  byOrganization: Array<{
    organizationId: string;
    name: string;
    slug: string;
    requests: number;
    tokensIn: number;
    tokensOut: number;
    costUsdEstimate: number;
  }>;
  byFeature: Array<{
    feature: string;
    requests: number;
    costUsdEstimate: number;
  }>;
  byProvider: Array<{
    provider: string;
    requests: number;
    costUsdEstimate: number;
  }>;
};

const PROVIDERS = ["mock", "openai", "gemini"] as const;

function money(n: number) {
  return `$${n.toFixed(4)}`;
}

export default function SuperAdminPage() {
  const { t } = useTranslation();
  const { data: me, isLoading: meLoading } = useMe();
  const token = useAccessToken();
  const qc = useQueryClient();
  const [tab, setTab] = useState<TabId>("overview");
  const [userQ, setUserQ] = useState("");
  const enabled = !!token && !!me?.isPlatformAdmin;

  const overview = useQuery({
    queryKey: ["super-admin", "overview"],
    queryFn: () => api<Overview>("/admin/overview"),
    enabled,
    retry: false,
  });

  const users = useQuery({
    queryKey: ["super-admin", "users", userQ],
    queryFn: () =>
      api<AdminUser[]>(
        `/admin/users${userQ.trim() ? `?q=${encodeURIComponent(userQ.trim())}` : ""}`,
      ),
    enabled: enabled && tab === "users",
    retry: false,
  });

  const orgs = useQuery({
    queryKey: ["super-admin", "orgs"],
    queryFn: () => api<AdminOrg[]>("/admin/organizations"),
    enabled: enabled && (tab === "organizations" || tab === "overview"),
    retry: false,
  });

  const createRequests = useQuery({
    queryKey: ["super-admin", "create-requests"],
    queryFn: () =>
      api<AdminCreateRequest[]>("/admin/organization-create-requests"),
    enabled: enabled && (tab === "requests" || tab === "overview"),
    retry: false,
  });

  const usage = useQuery({
    queryKey: ["super-admin", "usage"],
    queryFn: () => api<PlatformUsage>("/admin/usage"),
    enabled: enabled && tab === "usage",
    retry: false,
  });

  const settingsQ = useQuery({
    queryKey: ["super-admin", "settings"],
    queryFn: () => api<PlatformSettings>("/admin/platform-settings"),
    enabled: enabled && tab === "settings",
    retry: false,
  });

  const jobs = useQuery({
    queryKey: ["super-admin", "jobs"],
    queryFn: () => api<AdminJob[]>("/admin/jobs"),
    enabled: enabled && tab === "jobs",
    retry: false,
  });

  const [emb, setEmb] = useState("gemini");
  const [llm, setLlm] = useState("gemini");
  const [costIn, setCostIn] = useState("0.00015");
  const [costOut, setCostOut] = useState("0.0006");
  const [notes, setNotes] = useState("");
  useEffect(() => {
    const s = settingsQ.data;
    if (!s) return;
    setEmb(s.defaultEmbeddingProvider);
    setLlm(s.defaultLlmProvider);
    setCostIn(String(s.costPer1kInputUsd));
    setCostOut(String(s.costPer1kOutputUsd));
    setNotes(s.notes || "");
  }, [settingsQ.data]);

  const tabs: { id: TabId; label: string }[] = [
    { id: "overview", label: t("superAdmin.tabOverview") },
    { id: "requests", label: t("superAdmin.tabRequests") },
    { id: "users", label: t("superAdmin.tabUsers") },
    { id: "organizations", label: t("superAdmin.tabOrgs") },
    { id: "usage", label: t("superAdmin.tabUsage") },
    { id: "settings", label: t("superAdmin.tabSettings") },
    { id: "jobs", label: t("superAdmin.tabJobs") },
  ];

  if (meLoading) {
    return <Card className="p-6 text-sm text-muted">{t("admin.loading")}</Card>;
  }

  if (!me?.isPlatformAdmin) {
    return (
      <Card className="p-6">
        <p className="text-sm text-rose-600">{t("superAdmin.forbidden")}</p>
      </Card>
    );
  }

  async function approveRequest(id: string, name: string) {
    const ok = await confirmDialog({
      title: t("admin.approveOrgTitle"),
      description: t("admin.approveOrgDesc", { name }),
      confirmLabel: t("admin.approve"),
    });
    if (!ok) return;
    try {
      await api(`/admin/organization-create-requests/${id}/approve`, {
        method: "POST",
      });
      await qc.invalidateQueries({ queryKey: ["super-admin"] });
      toast.success(t("admin.approveOk"));
    } catch (err) {
      toast.error(
        t("common.failed"),
        err instanceof ApiError ? err.message : undefined,
      );
    }
  }

  async function rejectRequest(id: string, name: string) {
    const ok = await confirmDialog({
      title: t("admin.rejectOrgTitle"),
      description: t("admin.rejectOrgDesc", { name }),
      confirmLabel: t("admin.reject"),
      danger: true,
    });
    if (!ok) return;
    try {
      await api(`/admin/organization-create-requests/${id}/reject`, {
        method: "POST",
        body: {},
      });
      await qc.invalidateQueries({ queryKey: ["super-admin"] });
      toast.success(t("admin.rejectOk"));
    } catch (err) {
      toast.error(
        t("common.failed"),
        err instanceof ApiError ? err.message : undefined,
      );
    }
  }

  async function patchUser(
    id: string,
    name: string,
    body: { status?: string; isPlatformAdmin?: boolean },
  ) {
    const confirm =
      body.status === "disabled"
        ? {
            title: t("feedback.disableUserTitle"),
            description: t("feedback.disableUserDesc", { name }),
            confirmLabel: t("superAdmin.disableUser"),
            danger: true,
          }
        : body.status === "active"
          ? {
              title: t("feedback.enableUserTitle"),
              description: t("feedback.enableUserDesc", { name }),
              confirmLabel: t("superAdmin.enableUser"),
            }
          : body.isPlatformAdmin === true
            ? {
                title: t("feedback.grantAdminTitle"),
                description: t("feedback.grantAdminDesc", { name }),
                confirmLabel: t("superAdmin.grantAdmin"),
              }
            : {
                title: t("feedback.revokeAdminTitle"),
                description: t("feedback.revokeAdminDesc", { name }),
                confirmLabel: t("superAdmin.revokeAdmin"),
                danger: true,
              };
    const ok = await confirmDialog(confirm);
    if (!ok) return;
    try {
      await api(`/admin/users/${id}`, { method: "PATCH", body });
      await qc.invalidateQueries({ queryKey: ["super-admin", "users"] });
      await qc.invalidateQueries({ queryKey: ["super-admin", "overview"] });
      toast.success(t("common.updated"));
    } catch (err) {
      toast.error(
        t("common.failed"),
        err instanceof ApiError ? err.message : undefined,
      );
    }
  }

  async function deleteOrg(id: string, name: string) {
    const ok = await confirmDialog({
      title: t("feedback.deleteOrgTitle"),
      description: `${t("feedback.deleteOrgDesc")} (${name})`,
      confirmLabel: t("admin.deleteOrg"),
      danger: true,
    });
    if (!ok) return;
    try {
      await api(`/admin/organizations/${id}`, { method: "DELETE" });
      await qc.invalidateQueries({ queryKey: ["super-admin"] });
      toast.success(t("feedback.orgDeleteOk"));
    } catch (err) {
      toast.error(
        t("common.failed"),
        err instanceof ApiError ? err.message : undefined,
      );
    }
  }

  async function saveOrgAi(org: AdminOrg, e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const ok = await confirmDialog({
      title: t("feedback.orgSettingTitle"),
      description: t("feedback.orgSettingDesc"),
      confirmLabel: t("feedback.confirm"),
    });
    if (!ok) return;
    const fd = new FormData(e.currentTarget);
    try {
      await api(`/admin/organizations/${org.id}`, {
        method: "PATCH",
        body: {
          embeddingProvider: String(fd.get("embeddingProvider") || "mock"),
          llmProvider: String(fd.get("llmProvider") || "mock"),
          aiMonthlyQuota: Number(fd.get("aiMonthlyQuota") || 0),
          plan: String(fd.get("plan") || org.plan),
        },
      });
      await qc.invalidateQueries({ queryKey: ["super-admin", "orgs"] });
      toast.success(t("superAdmin.orgSaved"));
    } catch (err) {
      toast.error(
        t("common.failed"),
        err instanceof ApiError ? err.message : undefined,
      );
    }
  }

  async function saveSettings(e: FormEvent) {
    e.preventDefault();
    const ok = await confirmDialog({
      title: t("feedback.orgSettingTitle"),
      description: t("feedback.orgSettingDesc"),
      confirmLabel: t("feedback.confirm"),
    });
    if (!ok) return;
    try {
      await api("/admin/platform-settings", {
        method: "PATCH",
        body: {
          defaultEmbeddingProvider: emb,
          defaultLlmProvider: llm,
          costPer1kInputUsd: Number(costIn),
          costPer1kOutputUsd: Number(costOut),
          notes: notes || null,
        },
      });
      await qc.invalidateQueries({ queryKey: ["super-admin", "settings"] });
      await qc.invalidateQueries({ queryKey: ["super-admin", "overview"] });
      toast.success(t("superAdmin.settingsSaved"));
    } catch (err) {
      toast.error(
        t("common.failed"),
        err instanceof ApiError ? err.message : undefined,
      );
    }
  }

  const ov = overview.data;

  return (
    <AppPage wide className="space-y-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-foreground/70">
          {t("superAdmin.badge")}
        </p>
        <h2 className="font-display mt-2 text-3xl font-semibold tracking-tight">
          {t("superAdmin.title")}
        </h2>
        <p className="mt-1.5 text-sm text-foreground/80">
          {t("superAdmin.subtitle")}
        </p>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-border pb-3">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition",
              tab === item.id
                ? "bg-foreground text-background"
                : "text-muted hover:bg-surface-elevated hover:text-foreground",
            )}
          >
            {item.label}
            {item.id === "requests" &&
              (ov?.organizations.pendingCreateRequests ?? 0) > 0 && (
                <span className="ml-1.5 rounded-full bg-amber-500/20 px-1.5 text-xs text-amber-800 dark:text-amber-200">
                  {ov?.organizations.pendingCreateRequests}
                </span>
              )}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="space-y-4">
          {overview.isLoading ? (
            <p className="text-sm text-muted">{t("admin.loading")}</p>
          ) : overview.error ? (
            <p className="text-sm text-rose-600">
              {(overview.error as Error).message}
            </p>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  {
                    label: t("superAdmin.statUsers"),
                    value: ov?.users.total ?? 0,
                    hint: t("superAdmin.statUsersHint", {
                      active: ov?.users.active ?? 0,
                      admins: ov?.users.superAdmins ?? 0,
                    }),
                  },
                  {
                    label: t("superAdmin.statOrgs"),
                    value: ov?.organizations.total ?? 0,
                    hint: t("superAdmin.statOrgsHint", {
                      pending: ov?.organizations.pendingCreateRequests ?? 0,
                    }),
                  },
                  {
                    label: t("superAdmin.statRequests"),
                    value: ov?.usageThisMonth.requests ?? 0,
                    hint: t("superAdmin.statRequestsHint"),
                  },
                  {
                    label: t("superAdmin.statCost"),
                    value: money(ov?.usageThisMonth.costUsdEstimate ?? 0),
                    hint: t("superAdmin.statCostHint"),
                  },
                ].map((s) => (
                  <Card key={s.label} className="p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted">
                      {s.label}
                    </p>
                    <p className="mt-2 font-display text-2xl font-semibold">
                      {s.value}
                    </p>
                    <p className="mt-1 text-xs text-muted">{s.hint}</p>
                  </Card>
                ))}
              </div>
              {(createRequests.data?.length ?? 0) > 0 && (
                <Card className="p-4">
                  <h3 className="mb-2 font-medium">
                    {t("admin.createRequests")}
                  </h3>
                  <ul className="space-y-2 text-sm">
                    {createRequests.data?.slice(0, 5).map((r) => (
                      <li
                        key={r.id}
                        className="flex flex-wrap items-center justify-between gap-2"
                      >
                        <span>
                          {r.name}{" "}
                          <span className="text-muted">({r.slug})</span>
                        </span>
                        <Button
                          size="sm"
                          onClick={() => approveRequest(r.id, r.name)}
                        >
                          {t("admin.approve")}
                        </Button>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}
            </>
          )}
        </div>
      )}

      {tab === "requests" && (
        <Card className="p-4">
          <h3 className="mb-3 font-medium">{t("admin.createRequests")}</h3>
          {createRequests.isLoading ? (
            <p className="text-sm text-muted">{t("admin.loading")}</p>
          ) : (createRequests.data?.length ?? 0) === 0 ? (
            <p className="text-sm text-muted">
              {t("admin.createRequestsEmpty")}
            </p>
          ) : (
            <ul className="space-y-2 text-sm">
              {createRequests.data?.map((r) => (
                <li
                  key={r.id}
                  className="flex flex-col gap-2 rounded-md border border-border px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium">
                      {r.name}{" "}
                      <span className="font-normal text-muted">({r.slug})</span>
                    </p>
                    <p className="text-xs text-muted">
                      {r.requester?.name || r.requester?.email || "—"} ·{" "}
                      {formatDate(r.createdAt)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => approveRequest(r.id, r.name)}>
                      {t("admin.approve")}
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => rejectRequest(r.id, r.name)}
                    >
                      {t("admin.reject")}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {tab === "users" && (
        <Card className="p-4">
          <div className="mb-3 flex flex-wrap items-end gap-2">
            <div className="min-w-[220px] flex-1">
              <label className="text-xs text-muted">
                {t("superAdmin.searchUsers")}
              </label>
              <Input
                value={userQ}
                onChange={(e) => setUserQ(e.target.value)}
                placeholder="email / name"
              />
            </div>
          </div>
          {users.isLoading ? (
            <p className="text-sm text-muted">{t("admin.loading")}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border text-muted">
                  <tr>
                    <th className="py-2">{t("superAdmin.colUser")}</th>
                    <th className="py-2">{t("superAdmin.colStatus")}</th>
                    <th className="py-2">{t("superAdmin.colOrgs")}</th>
                    <th className="py-2 text-right">{t("common.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {users.data?.map((u) => (
                    <tr key={u.id} className="border-b border-border/60">
                      <td className="py-3">
                        <p className="font-medium">{u.name}</p>
                        <p className="text-xs text-muted">{u.email}</p>
                        {u.isPlatformAdmin && (
                          <Badge tone="info" className="mt-1">
                            {t("superAdmin.roleBadge")}
                          </Badge>
                        )}
                      </td>
                      <td className="py-3">{labelStatus(t, u.status)}</td>
                      <td className="py-3">{u.orgCount}</td>
                      <td className="py-3 text-right">
                        <div className="flex flex-wrap justify-end gap-1">
                          {u.status === "active" ? (
                            <Button
                              size="sm"
                              variant="danger"
                              disabled={u.id === me.id}
                              onClick={() =>
                                void patchUser(u.id, u.name, {
                                  status: "disabled",
                                })
                              }
                            >
                              {t("superAdmin.disableUser")}
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() =>
                                void patchUser(u.id, u.name, {
                                  status: "active",
                                })
                              }
                            >
                              {t("superAdmin.enableUser")}
                            </Button>
                          )}
                          {u.isPlatformAdmin ? (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={u.id === me.id}
                              onClick={() =>
                                void patchUser(u.id, u.name, {
                                  isPlatformAdmin: false,
                                })
                              }
                            >
                              {t("superAdmin.revokeAdmin")}
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                void patchUser(u.id, u.name, {
                                  isPlatformAdmin: true,
                                })
                              }
                            >
                              {t("superAdmin.grantAdmin")}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {tab === "organizations" && (
        <div className="space-y-3">
          {orgs.isLoading ? (
            <p className="text-sm text-muted">{t("admin.loading")}</p>
          ) : (orgs.data?.length ?? 0) === 0 ? (
            <Card className="p-6 text-center text-sm text-muted">
              {t("superAdmin.orgsEmpty", {
                defaultValue: "Chưa có tổ chức nào.",
              })}
            </Card>
          ) : (
            orgs.data?.map((o) => {
              const settings = (o.settings || {}) as Record<string, unknown>;
              const fieldClass =
                "mt-1.5 h-9 w-full rounded-lg border border-border bg-surface-elevated px-2.5 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring";
              return (
                <Card key={o.id} className="p-4 sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-[15px] font-semibold tracking-tight">
                        {o.name}
                        <span className="ml-2 text-sm font-normal text-muted">
                          {o.slug}
                        </span>
                      </h3>
                      <p className="mt-1 text-xs text-muted">
                        {o._count.members} {t("admin.colMembers").toLowerCase()}
                        {" · "}
                        {o._count.knowledgeBases}{" "}
                        {t("admin.colKbs").toLowerCase()}
                        {" · "}
                        {formatDate(o.createdAt)}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="danger"
                      className="shrink-0"
                      onClick={() => deleteOrg(o.id, o.name)}
                    >
                      {t("admin.deleteOrg")}
                    </Button>
                  </div>
                  <form
                    className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
                    onSubmit={(e) => saveOrgAi(o, e)}
                  >
                    <label className="block text-xs font-medium text-muted">
                      {t("superAdmin.embeddingProvider", {
                        defaultValue: "Embedding",
                      })}
                      <select
                        name="embeddingProvider"
                        defaultValue={String(
                          settings.embedding_provider || "mock",
                        )}
                        className={fieldClass}
                      >
                        {PROVIDERS.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block text-xs font-medium text-muted">
                      {t("superAdmin.llmProvider", { defaultValue: "LLM" })}
                      <select
                        name="llmProvider"
                        defaultValue={String(settings.llm_provider || "mock")}
                        className={fieldClass}
                      >
                        {PROVIDERS.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block text-xs font-medium text-muted">
                      {t("superAdmin.aiQuotaShort", {
                        defaultValue: "Hạn mức AI / tháng",
                      })}
                      <Input
                        name="aiMonthlyQuota"
                        type="number"
                        min={0}
                        defaultValue={Number(settings.ai_monthly_quota || 0)}
                        className="mt-1.5 h-9"
                      />
                    </label>
                    <label className="block text-xs font-medium text-muted">
                      {t("superAdmin.plan")}
                      <select
                        name="plan"
                        defaultValue={o.plan || "free"}
                        className={fieldClass}
                      >
                        <option value="free">free</option>
                        <option value="pro">pro</option>
                        <option value="enterprise">enterprise</option>
                      </select>
                    </label>
                    <div className="flex items-end sm:col-span-2 lg:col-span-4">
                      <Button type="submit" className="w-full sm:ml-auto sm:w-auto">
                        {t("common.save")}
                      </Button>
                    </div>
                  </form>
                </Card>
              );
            })
          )}
        </div>
      )}

      {tab === "usage" && (
        <div className="space-y-4">
          {usage.isLoading ? (
            <p className="text-sm text-muted">{t("admin.loading")}</p>
          ) : usage.error ? (
            <p className="text-sm text-rose-600">
              {(usage.error as Error).message}
            </p>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-4">
                <Card className="p-4">
                  <p className="text-xs text-muted">{t("superAdmin.statRequests")}</p>
                  <p className="mt-1 text-xl font-semibold">
                    {usage.data?.totals.requests ?? 0}
                  </p>
                </Card>
                <Card className="p-4">
                  <p className="text-xs text-muted">Tokens in</p>
                  <p className="mt-1 text-xl font-semibold">
                    {usage.data?.totals.tokensIn ?? 0}
                  </p>
                </Card>
                <Card className="p-4">
                  <p className="text-xs text-muted">Tokens out</p>
                  <p className="mt-1 text-xl font-semibold">
                    {usage.data?.totals.tokensOut ?? 0}
                  </p>
                </Card>
                <Card className="p-4">
                  <p className="text-xs text-muted">{t("superAdmin.statCost")}</p>
                  <p className="mt-1 text-xl font-semibold">
                    {money(usage.data?.totals.costUsdEstimate ?? 0)}
                  </p>
                </Card>
              </div>
              <Card className="p-4">
                <h3 className="mb-3 font-medium">
                  {t("superAdmin.costByOrg")}
                </h3>
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-border text-muted">
                    <tr>
                      <th className="py-2">{t("admin.colName")}</th>
                      <th className="py-2">{t("superAdmin.statRequests")}</th>
                      <th className="py-2">{t("superAdmin.statCost")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usage.data?.byOrganization.map((r) => (
                      <tr key={r.organizationId} className="border-b border-border/60">
                        <td className="py-2">
                          {r.name}{" "}
                          <span className="text-muted">({r.slug})</span>
                        </td>
                        <td className="py-2">{r.requests}</td>
                        <td className="py-2">{money(r.costUsdEstimate)}</td>
                      </tr>
                    ))}
                    {(usage.data?.byOrganization.length ?? 0) === 0 && (
                      <tr>
                        <td colSpan={3} className="py-4 text-muted">
                          {t("superAdmin.usageEmpty")}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </Card>
              <div className="grid gap-3 md:grid-cols-2">
                <Card className="p-4">
                  <h3 className="mb-2 font-medium">
                    {t("superAdmin.byFeature")}
                  </h3>
                  <ul className="space-y-1 text-sm">
                    {usage.data?.byFeature.map((r) => (
                      <li key={r.feature} className="flex justify-between">
                        <span>{r.feature}</span>
                        <span className="text-muted">
                          {r.requests} · {money(r.costUsdEstimate)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </Card>
                <Card className="p-4">
                  <h3 className="mb-2 font-medium">
                    {t("superAdmin.byProvider")}
                  </h3>
                  <ul className="space-y-1 text-sm">
                    {usage.data?.byProvider.map((r) => (
                      <li key={r.provider} className="flex justify-between">
                        <span>{r.provider}</span>
                        <span className="text-muted">
                          {r.requests} · {money(r.costUsdEstimate)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </Card>
              </div>
            </>
          )}
        </div>
      )}

      {tab === "settings" && (
        <Card className="p-4">
          <h3 className="font-medium">{t("superAdmin.platformAi")}</h3>
          <p className="mt-1 text-xs text-muted">
            {t("superAdmin.platformAiHint")}
          </p>
          {settingsQ.isLoading ? (
            <p className="mt-4 text-sm text-muted">{t("admin.loading")}</p>
          ) : (
            <form onSubmit={saveSettings} className="mt-4 space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-xs">
                  {t("settings.embeddingProvider")}
                  <select
                    value={emb}
                    onChange={(e) => setEmb(e.target.value)}
                    className="mt-1 w-full rounded-md border border-border bg-transparent px-2 py-2 text-sm"
                  >
                    {PROVIDERS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs">
                  {t("settings.llmProvider")}
                  <select
                    value={llm}
                    onChange={(e) => setLlm(e.target.value)}
                    className="mt-1 w-full rounded-md border border-border bg-transparent px-2 py-2 text-sm"
                  >
                    {PROVIDERS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs">
                  {t("superAdmin.costIn")}
                  <Input
                    value={costIn}
                    onChange={(e) => setCostIn(e.target.value)}
                    className="mt-1"
                  />
                </label>
                <label className="text-xs">
                  {t("superAdmin.costOut")}
                  <Input
                    value={costOut}
                    onChange={(e) => setCostOut(e.target.value)}
                    className="mt-1"
                  />
                </label>
              </div>
              <label className="block text-xs">
                {t("superAdmin.notes")}
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm"
                />
              </label>
              {settingsQ.data?.runtime && (
                <div className="rounded-md border border-border/70 bg-surface-elevated px-3 py-2 text-xs text-muted">
                  <p>
                    AI_SERVICE_URL:{" "}
                    {settingsQ.data.runtime.aiServiceUrl || "—"}
                  </p>
                  <p>NODE_ENV: {settingsQ.data.runtime.nodeEnv}</p>
                  <p>
                    PLATFORM_ADMIN_EMAILS:{" "}
                    {(settingsQ.data.runtime.platformAdminEmails || []).join(
                      ", ",
                    ) || "—"}
                  </p>
                </div>
              )}
              <Button type="submit">{t("common.save")}</Button>
            </form>
          )}
        </Card>
      )}

      {tab === "jobs" && (
        <Card className="p-4">
          <h3 className="mb-3 font-medium">{t("admin.jobs")}</h3>
          {jobs.isLoading ? (
            <p className="text-sm text-muted">{t("admin.loading")}</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {(jobs.data || []).map((j) => (
                <li
                  key={j.id}
                  className="rounded-md border border-border px-3 py-2"
                >
                  <p className="font-medium">
                    {j.id.slice(0, 8)}… · {labelStatus(t, j.status)}
                  </p>
                  <p className="text-xs text-muted">
                    {t("admin.jobOrgLabel")} {j.organizationId.slice(0, 8)} ·{" "}
                    {t("admin.jobDocLabel")} {j.documentId.slice(0, 8)} ·{" "}
                    {formatDate(j.updatedAt)}
                  </p>
                  {j.errorMessage && (
                    <p className="mt-1 text-xs text-rose-600">{j.errorMessage}</p>
                  )}
                </li>
              ))}
              {(jobs.data?.length ?? 0) === 0 && (
                <li className="text-muted">{t("admin.jobsEmpty")}</li>
              )}
            </ul>
          )}
        </Card>
      )}
    </AppPage>
  );
}
