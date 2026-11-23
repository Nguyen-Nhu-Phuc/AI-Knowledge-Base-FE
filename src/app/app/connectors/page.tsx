"use client";

import { FormEvent, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, ApiError } from "@/lib/api";
import { useKnowledgeBases, useOrgId } from "@/lib/hooks";
import { useCanManageKbAdmin } from "@/lib/org-role";
import { toast } from "@/components/feedback";
import { AppPage } from "@/components/layout/app-page";

type ConnectorType =
  | "local_folder"
  | "google_drive"
  | "notion"
  | "confluence"
  | "slack_export";

type Connector = {
  id: string;
  name: string;
  type: string;
  status: string;
  knowledgeBaseId: string;
  lastSyncAt?: string | null;
  config?: Record<string, unknown>;
  syncRuns?: Array<{ id: string; status: string; createdAt: string; error?: string | null }>;
};

export default function ConnectorsPage() {
  const { t } = useTranslation();
  const orgId = useOrgId();
  const canManage = useCanManageKbAdmin();
  const { data: kbs } = useKnowledgeBases();
  const [items, setItems] = useState<Connector[]>([]);
  const [name, setName] = useState("Local inbox");
  const [type, setType] = useState<ConnectorType>("local_folder");
  const [kbId, setKbId] = useState("");
  const [folderPath, setFolderPath] = useState("");
  const [folderId, setFolderId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [exportPath, setExportPath] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    if (!orgId || !canManage) return;
    const data = await api<Connector[]>(`/organizations/${orgId}/connectors`, {
      orgId,
    });
    setItems(data);
  }

  useEffect(() => {
    void load().catch(() => undefined);
  }, [orgId, canManage]);

  useEffect(() => {
    if (!kbId && kbs?.[0]?.id) setKbId(kbs[0].id);
  }, [kbs, kbId]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    if (!orgId) return;
    setLoading(true);
    try {
      let config: Record<string, unknown> = {};
      if (type === "local_folder") config = { folderPath };
      else if (type === "google_drive")
        config = { folderId, accessToken: accessToken || undefined };
      else config = { exportPath };
      await api(`/organizations/${orgId}/connectors`, {
        method: "POST",
        orgId,
        body: { name, type, knowledgeBaseId: kbId, config },
      });
      toast.success(t("connectors.created"));
      setName("");
      await load();
    } catch (err) {
      toast.error(
        t("common.failed"),
        err instanceof ApiError ? err.message : String(err),
      );
    } finally {
      setLoading(false);
    }
  }

  if (!canManage) {
    return (
      <Card className="p-4 text-sm text-foreground/70">{t("connectors.adminOnly")}</Card>
    );
  }

  return (
    <AppPage>
      <div>
        <h1 className="text-xl font-semibold">{t("connectors.title")}</h1>
        <p className="mt-1 text-sm text-foreground/70">{t("connectors.hint")}</p>
      </div>

      <Card className="space-y-3 p-4">
        <h2 className="font-medium">{t("connectors.add")}</h2>
        <form className="space-y-3" onSubmit={onCreate}>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("connectors.name")}
            required
          />
          <select
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            value={type}
            onChange={(e) => setType(e.target.value as ConnectorType)}
          >
            <option value="local_folder">{t("connectors.type_local")}</option>
            <option value="google_drive">{t("connectors.type_drive")}</option>
            <option value="notion">{t("connectors.type_notion")}</option>
            <option value="confluence">{t("connectors.type_confluence")}</option>
            <option value="slack_export">{t("connectors.type_slack")}</option>
          </select>
          <select
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            value={kbId}
            onChange={(e) => setKbId(e.target.value)}
            required
          >
            {(kbs || []).map((k) => (
              <option key={k.id} value={k.id}>
                {k.name}
              </option>
            ))}
          </select>
          {type === "local_folder" && (
            <Input
              value={folderPath}
              onChange={(e) => setFolderPath(e.target.value)}
              placeholder={t("connectors.folderPath")}
              required
            />
          )}
          {type === "google_drive" && (
            <>
              <Input
                value={folderId}
                onChange={(e) => setFolderId(e.target.value)}
                placeholder={t("connectors.driveFolderId")}
                required
              />
              <Input
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                placeholder={t("connectors.driveToken")}
              />
            </>
          )}
          {(type === "notion" ||
            type === "confluence" ||
            type === "slack_export") && (
            <Input
              value={exportPath}
              onChange={(e) => setExportPath(e.target.value)}
              placeholder={t("connectors.exportPath")}
              required
            />
          )}
          <Button type="submit" disabled={loading || !kbId}>
            {t("connectors.create")}
          </Button>
        </form>
      </Card>

      <Card className="space-y-2 p-4">
        <h2 className="font-medium">{t("connectors.list")}</h2>
        {items.length === 0 && (
          <p className="text-sm text-foreground/60">{t("connectors.empty")}</p>
        )}
        {items.map((c) => (
          <div
            key={c.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border px-3 py-2 text-sm"
          >
            <div>
              <p className="font-medium">
                {c.name} · {c.type} · {c.status}
              </p>
              <p className="text-xs text-foreground/60">
                KB {c.knowledgeBaseId.slice(0, 8)}… ·{" "}
                {c.lastSyncAt
                  ? t("connectors.lastSync", { at: c.lastSyncAt })
                  : t("connectors.neverSynced")}
              </p>
              {c.syncRuns?.[0]?.error && (
                <p className="text-xs text-rose-600">{c.syncRuns[0].error}</p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  try {
                    await api(
                      `/organizations/${orgId}/connectors/${c.id}/sync`,
                      { method: "POST", orgId },
                    );
                    toast.success(t("connectors.syncQueued"));
                    await load();
                  } catch (err) {
                    toast.error(
                      t("common.failed"),
                      err instanceof ApiError ? err.message : String(err),
                    );
                  }
                }}
              >
                {t("connectors.sync")}
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={async () => {
                  try {
                    await api(`/organizations/${orgId}/connectors/${c.id}`, {
                      method: "DELETE",
                      orgId,
                    });
                    toast.success(t("connectors.deleted"));
                    await load();
                  } catch (err) {
                    toast.error(
                      t("common.failed"),
                      err instanceof ApiError ? err.message : String(err),
                    );
                  }
                }}
              >
                {t("common.delete")}
              </Button>
            </div>
          </div>
        ))}
      </Card>
    </AppPage>
  );
}
