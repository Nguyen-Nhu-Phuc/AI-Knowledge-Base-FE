"use client";

import { FormEvent, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeCustomizer } from "@/components/theme-customizer";
import { confirmDialog, toast } from "@/components/feedback";
import { api, ApiError } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import {
  useCreateOrg,
  useMe,
  useMyOrgCreateRequests,
  useOrgId,
  useOrganizations,
} from "@/lib/hooks";
import type { Organization, User } from "@/lib/types";
import { useQueryClient } from "@tanstack/react-query";
import { hasMinRole } from "@/stores/auth-store";
import { AppPage } from "@/components/layout/app-page";

function validPassword(value: string) {
  return value.length >= 8 && /[A-Za-z]/.test(value) && /\d/.test(value);
}

export default function SettingsPage() {
  const { t } = useTranslation();
  const { data: me } = useMe();
  const orgId = useOrgId();
  const qc = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  const orgs = useAuthStore((s) => s.organizations);
  const setOrganizations = useAuthStore((s) => s.setOrganizations);
  const setCurrentOrgId = useAuthStore((s) => s.setCurrentOrgId);
  const [name, setName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [orgName, setOrgName] = useState("");
  const [orgSlug, setOrgSlug] = useState("");
  const [renameOrg, setRenameOrg] = useState("");
  const [allowMemberCreateKb, setAllowMemberCreateKb] = useState(false);
  const [embeddingProvider, setEmbeddingProvider] = useState("mock");
  const [llmProvider, setLlmProvider] = useState("mock");
  const [aclMode, setAclMode] = useState("org_wide");
  const [dlpEnabled, setDlpEnabled] = useState(true);
  const [retentionDays, setRetentionDays] = useState("0");
  const [aiQuota, setAiQuota] = useState("0");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const createOrg = useCreateOrg();
  const { data: createRequests } = useMyOrgCreateRequests();
  useOrganizations();

  const currentOrg = orgs.find((o) => o.id === orgId);
  const pendingOrgRequests = (createRequests || []).filter(
    (r) => r.status === "pending",
  );
  const canRenameOrg = hasMinRole(currentOrg?.role, "admin");
  const canDeleteOrg = hasMinRole(currentOrg?.role, "owner");
  const providerOptions = ["mock", "openai", "gemini"] as const;

  useEffect(() => {
    if (me?.name) setName(me.name);
  }, [me?.name]);

  useEffect(() => {
    if (currentOrg?.name) setRenameOrg(currentOrg.name);
    setAllowMemberCreateKb(
      currentOrg?.settings?.allow_member_create_kb === true,
    );
    const emb = currentOrg?.settings?.embedding_provider;
    const llm = currentOrg?.settings?.llm_provider;
    setEmbeddingProvider(
      emb === "openai" || emb === "gemini" || emb === "mock" ? String(emb) : "mock",
    );
    setLlmProvider(
      llm === "openai" || llm === "gemini" || llm === "mock" ? String(llm) : "mock",
    );
    const acl = currentOrg?.settings?.acl_mode;
    setAclMode(acl === "restricted" ? "restricted" : "org_wide");
    setDlpEnabled(currentOrg?.settings?.dlp_enabled !== false);
    setRetentionDays(String(currentOrg?.settings?.retention_days ?? 0));
    setAiQuota(String(currentOrg?.settings?.ai_monthly_quota ?? 0));
  }, [
    currentOrg?.name,
    currentOrg?.settings?.allow_member_create_kb,
    currentOrg?.settings?.embedding_provider,
    currentOrg?.settings?.llm_provider,
    currentOrg?.settings?.acl_mode,
    currentOrg?.settings?.dlp_enabled,
    currentOrg?.settings?.retention_days,
    currentOrg?.settings?.ai_monthly_quota,
  ]);

  async function patchOrgSettings(settings: Record<string, unknown>) {
    if (!orgId) return;
    const updated = await api<Organization>(`/organizations/${orgId}`, {
      method: "PATCH",
      orgId,
      body: { settings },
    });
    setOrganizations(
      orgs.map((o) =>
        o.id === updated.id ? { ...o, settings: updated.settings } : o,
      ),
    );
    await qc.invalidateQueries({ queryKey: ["organizations"] });
  }

  async function saveProfile(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      const user = await api<User>("/users/me", {
        method: "PATCH",
        body: { name },
      });
      setUser(user);
      setMessage(t("settings.profileUpdated"));
      toast.success(t("feedback.profileOk"));
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : t("common.failed");
      setError(msg);
      toast.error(t("common.failed"), msg);
    }
  }

  async function changePassword(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!validPassword(newPassword)) {
      setError(t("auth.passwordHint"));
      toast.warn(t("auth.passwordHint"));
      return;
    }
    try {
      await api("/users/me/password", {
        method: "PATCH",
        body: { currentPassword, newPassword },
      });
      setCurrentPassword("");
      setNewPassword("");
      setMessage(t("settings.passwordUpdated"));
      toast.success(t("feedback.passwordOk"));
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : t("common.failed");
      setError(msg);
      toast.error(t("common.failed"), msg);
    }
  }

  async function createOrgSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      const slug = orgSlug.trim().toLowerCase();
      const result = await createOrg.mutateAsync({
        name: orgName,
        ...(slug ? { slug } : {}),
      });
      setOrgName("");
      setOrgSlug("");
      if (result.status === "pending") {
        setMessage(t("feedback.orgCreatePending"));
        toast.success(t("feedback.orgCreatePending"));
      } else {
        setMessage(t("feedback.orgCreateOk"));
        toast.success(t("feedback.orgCreateOk"));
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("common.failed");
      setError(msg);
      toast.error(t("common.failed"), msg);
    }
  }

  return (
    <AppPage>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-foreground/70">
          {t("nav.settings")}
        </p>
        <h2 className="font-display mt-2 text-3xl font-semibold tracking-tight">
          {t("settings.title")}
        </h2>
        <p className="mt-1.5 text-sm text-foreground/80">{t("settings.subtitle")}</p>
      </div>

      {message && <p className="text-sm text-emerald-600">{message}</p>}
      {error && <p className="text-sm text-rose-600">{error}</p>}

      <ThemeCustomizer />

      <Card>
        <h3 className="font-medium">{t("settings.profile")}</h3>
        <form onSubmit={saveProfile} className="mt-4 space-y-3">
          <Input value={me?.email || ""} disabled />
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
          <Button type="submit">{t("settings.saveProfile")}</Button>
        </form>
      </Card>

      <Card>
        <h3 className="font-medium">{t("settings.changePassword")}</h3>
        <p className="mt-1 text-xs text-foreground/75">{t("auth.passwordHint")}</p>
        <form onSubmit={changePassword} className="mt-4 space-y-3">
          <Input
            type="password"
            placeholder={t("settings.currentPasswordPlaceholder")}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder={t("settings.newPasswordPlaceholder")}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={8}
          />
          <Button type="submit">{t("settings.updatePassword")}</Button>
        </form>
      </Card>

      <Card>
        <h3 className="font-medium">{t("settings.createOrg")}</h3>
        <p className="mt-1 text-xs text-foreground/75">
          {t("settings.createOrgApprovalHint")}
        </p>
        <form onSubmit={createOrgSubmit} className="mt-4 space-y-3">
          <Input
            placeholder={t("settings.orgNamePlaceholder")}
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            required
            minLength={2}
          />
          <Input
            placeholder={t("settings.orgSlugPlaceholder")}
            value={orgSlug}
            onChange={(e) => setOrgSlug(e.target.value)}
            pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
          />
          <Button type="submit" disabled={createOrg.isPending}>
            {t("settings.requestOrg")}
          </Button>
        </form>
        {pendingOrgRequests.length > 0 && (
          <ul className="mt-4 space-y-2 border-t border-border/70 pt-4 text-sm">
            {pendingOrgRequests.map((r) => (
              <li key={r.id} className="flex justify-between gap-2">
                <span>
                  {r.name}{" "}
                  <span className="text-foreground/60">({r.slug})</span>
                </span>
                <span className="text-amber-700 dark:text-amber-300">
                  {t("status.pending")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {orgId && (
        <Card>
          <h3 className="font-medium">{t("settings.currentOrg")}</h3>
          <p className="mt-1 text-xs text-foreground/75">
            {t("settings.orgMetaHint", {
              slug: currentOrg?.slug || "—",
              role: currentOrg?.role
                ? t(`roles.${currentOrg.role}`)
                : "—",
            })}
          </p>
          <form
            className="mt-4 flex flex-wrap gap-2"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!canRenameOrg) return;
              setError("");
              setMessage("");
              try {
                const updated = await api<Organization>(
                  `/organizations/${orgId}`,
                  { method: "PATCH", orgId, body: { name: renameOrg } },
                );
                setOrganizations(
                  orgs.map((o) =>
                    o.id === updated.id ? { ...o, name: updated.name } : o,
                  ),
                );
                await qc.invalidateQueries({ queryKey: ["organizations"] });
                setMessage(t("feedback.orgRenameOk"));
                toast.success(t("feedback.orgRenameOk"));
              } catch (err) {
                const msg =
                  err instanceof ApiError ? err.message : t("common.failed");
                setError(msg);
                toast.error(t("common.failed"), msg);
              }
            }}
          >
            <Input
              value={renameOrg}
              onChange={(e) => setRenameOrg(e.target.value)}
              required
              minLength={2}
              className="min-w-[200px] flex-1"
              disabled={!canRenameOrg}
            />
            {canRenameOrg && (
              <Button type="submit">{t("settings.renameOrg")}</Button>
            )}
            {canDeleteOrg && (
              <Button
                type="button"
                variant="danger"
                onClick={async () => {
                  const ok = await confirmDialog({
                    title: t("feedback.deleteOrgTitle"),
                    description: t("feedback.deleteOrgDesc"),
                    confirmLabel: t("common.delete"),
                    danger: true,
                  });
                  if (!ok) return;
                  setError("");
                  try {
                    await api(`/organizations/${orgId}`, {
                      method: "DELETE",
                      orgId,
                    });
                    const next = orgs.filter((o) => o.id !== orgId);
                    setOrganizations(next);
                    setCurrentOrgId(next[0]?.id ?? null);
                    await qc.invalidateQueries({ queryKey: ["organizations"] });
                    setMessage(t("feedback.orgDeleteOk"));
                    toast.success(t("feedback.orgDeleteOk"));
                  } catch (err) {
                    const msg =
                      err instanceof ApiError
                        ? err.message
                        : t("feedback.deleteFail");
                    setError(msg);
                    toast.error(t("feedback.deleteFail"), msg);
                  }
                }}
              >
                {t("common.delete")}
              </Button>
            )}
          </form>

          {canRenameOrg && (
            <label className="mt-4 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={allowMemberCreateKb}
                onChange={async (e) => {
                  const next = e.target.checked;
                  setAllowMemberCreateKb(next);
                  setError("");
                  setMessage("");
                  try {
                    await patchOrgSettings({ allow_member_create_kb: next });
                    setMessage(t("feedback.orgSettingsOk"));
                    toast.success(t("feedback.orgSettingsOk"));
                  } catch (err) {
                    setAllowMemberCreateKb(!next);
                    const msg =
                      err instanceof ApiError
                        ? err.message
                        : t("common.failed");
                    setError(msg);
                    toast.error(t("common.failed"), msg);
                  }
                }}
              />
              {t("settings.allowMemberCreateKb")}
            </label>
          )}
        </Card>
      )}

      {orgId && canRenameOrg && (
        <Card className="space-y-4 p-4">
          <div>
            <h2 className="font-medium">{t("settings.aiProviders")}</h2>
            <p className="mt-1 text-sm text-foreground/70">
              {t("settings.aiProvidersHint")}
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block text-foreground/80">
                {t("settings.embeddingProvider")}
              </span>
              <select
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                value={embeddingProvider}
                onChange={async (e) => {
                  const next = e.target.value;
                  const prev = embeddingProvider;
                  setEmbeddingProvider(next);
                  setError("");
                  try {
                    await patchOrgSettings({ embedding_provider: next });
                    setMessage(t("settings.aiSaved"));
                    toast.success(t("settings.aiSaved"));
                  } catch (err) {
                    setEmbeddingProvider(prev);
                    const msg =
                      err instanceof ApiError
                        ? err.message
                        : t("common.failed");
                    setError(msg);
                    toast.error(t("common.failed"), msg);
                  }
                }}
              >
                {providerOptions.map((p) => (
                  <option key={p} value={p}>
                    {t(`settings.provider_${p}`)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-foreground/80">
                {t("settings.llmProvider")}
              </span>
              <select
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                value={llmProvider}
                onChange={async (e) => {
                  const next = e.target.value;
                  const prev = llmProvider;
                  setLlmProvider(next);
                  setError("");
                  try {
                    await patchOrgSettings({ llm_provider: next });
                    setMessage(t("settings.aiSaved"));
                    toast.success(t("settings.aiSaved"));
                  } catch (err) {
                    setLlmProvider(prev);
                    const msg =
                      err instanceof ApiError
                        ? err.message
                        : t("common.failed");
                    setError(msg);
                    toast.error(t("common.failed"), msg);
                  }
                }}
              >
                {providerOptions.map((p) => (
                  <option key={p} value={p}>
                    {t(`settings.provider_${p}`)}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="rounded-md border border-border/80 bg-muted/30 px-3 py-2 text-sm">
            <p className="font-medium">{t("settings.ocrCapability")}</p>
            <p className="mt-1 text-foreground/70">{t("settings.ocrHint")}</p>
          </div>
          <label className="block text-sm">
            <span className="mb-1 block text-foreground/80">
              {t("settings.aclMode")}
            </span>
            <select
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              value={aclMode}
              onChange={async (e) => {
                const next = e.target.value;
                const prev = aclMode;
                setAclMode(next);
                try {
                  await patchOrgSettings({ acl_mode: next });
                  toast.success(t("settings.aclSaved"));
                } catch (err) {
                  setAclMode(prev);
                  toast.error(
                    t("common.failed"),
                    err instanceof ApiError ? err.message : t("common.failed"),
                  );
                }
              }}
            >
              <option value="org_wide">{t("settings.acl_org_wide")}</option>
              <option value="restricted">{t("settings.acl_restricted")}</option>
            </select>
            <p className="mt-1 text-xs text-foreground/65">
              {t("settings.aclHint")}
            </p>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={dlpEnabled}
              onChange={async (e) => {
                const next = e.target.checked;
                const prev = dlpEnabled;
                setDlpEnabled(next);
                try {
                  await patchOrgSettings({ dlp_enabled: next });
                  toast.success(t("settings.dlpSaved"));
                } catch (err) {
                  setDlpEnabled(prev);
                  toast.error(
                    t("common.failed"),
                    err instanceof ApiError ? err.message : t("common.failed"),
                  );
                }
              }}
            />
            {t("settings.dlpEnabled")}
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-foreground/80">
              {t("settings.retentionDays")}
            </span>
            <Input
              type="number"
              min={0}
              value={retentionDays}
              onChange={(e) => setRetentionDays(e.target.value)}
              onBlur={async () => {
                try {
                  await patchOrgSettings({
                    retention_days: Number(retentionDays) || 0,
                  });
                  toast.success(t("settings.retentionSaved"));
                } catch (err) {
                  toast.error(
                    t("common.failed"),
                    err instanceof ApiError ? err.message : t("common.failed"),
                  );
                }
              }}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-foreground/80">
              {t("settings.aiQuota")}
            </span>
            <Input
              type="number"
              min={0}
              value={aiQuota}
              onChange={(e) => setAiQuota(e.target.value)}
              onBlur={async () => {
                try {
                  await patchOrgSettings({
                    ai_monthly_quota: Number(aiQuota) || 0,
                  });
                  toast.success(t("settings.quotaSaved"));
                } catch (err) {
                  toast.error(
                    t("common.failed"),
                    err instanceof ApiError ? err.message : t("common.failed"),
                  );
                }
              }}
            />
          </label>
          <p className="text-xs text-amber-700 dark:text-amber-300">
            {t("settings.aiNote")}
          </p>
        </Card>
      )}
    </AppPage>
  );
}
