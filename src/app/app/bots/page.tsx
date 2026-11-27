"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api, ApiError } from "@/lib/api";
import { useKnowledgeBases, useOrgId } from "@/lib/hooks";
import { useCanManageKbAdmin } from "@/lib/org-role";
import { confirmDialog, toast } from "@/components/feedback";
import { AppPage } from "@/components/layout/app-page";

type Bot = {
  id: string;
  name: string;
  description?: string | null;
  systemPrompt: string;
  status: string;
  knowledgeBaseId: string;
  knowledgeBase?: { id: string; name: string };
};

export default function BotsPage() {
  const { t } = useTranslation();
  const orgId = useOrgId();
  const canAdmin = useCanManageKbAdmin();
  const { data: kbs } = useKnowledgeBases();
  const [bots, setBots] = useState<Bot[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [systemPrompt, setSystemPrompt] = useState(
    "You are an enterprise knowledge assistant. Answer ONLY using the provided context and cite sources with [n].",
  );
  const [kbId, setKbId] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!orgId) return;
    const data = await api<Bot[]>(`/organizations/${orgId}/bots`, { orgId });
    setBots(data);
  }, [orgId]);

  useEffect(() => {
    void load().catch(() => undefined);
  }, [load]);

  useEffect(() => {
    if (!kbId && kbs?.[0]?.id) setKbId(kbs[0].id);
  }, [kbs, kbId]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    if (!orgId || !canAdmin) return;
    const trimmed = name.trim();
    if (!trimmed || !kbId) return;
    const ok = await confirmDialog({
      title: t("feedback.createBotTitle"),
      description: t("feedback.createBotDesc", { name: trimmed }),
      confirmLabel: t("bots.create"),
    });
    if (!ok) return;
    setLoading(true);
    try {
      await api(`/organizations/${orgId}/bots`, {
        method: "POST",
        orgId,
        body: {
          name: trimmed,
          description: description || undefined,
          systemPrompt,
          knowledgeBaseId: kbId,
        },
      });
      toast.success(t("bots.created"));
      setName("");
      setDescription("");
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

  return (
    <AppPage>
      <div>
        <h1 className="text-xl font-semibold">{t("bots.title")}</h1>
        <p className="mt-1 text-sm text-muted">{t("bots.hint")}</p>
      </div>

      {canAdmin ? (
        <Card className="space-y-3 p-4">
          <h2 className="font-medium">{t("bots.add")}</h2>
          <form className="space-y-3" onSubmit={onCreate}>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("bots.name")}
              required
            />
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("bots.description")}
            />
            <select
              className="flex h-11 w-full rounded-xl border border-border bg-surface-elevated px-3.5 text-sm"
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
            <Textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder={t("bots.systemPrompt")}
              rows={4}
            />
            <Button type="submit" disabled={loading || !kbId}>
              {t("bots.create")}
            </Button>
          </form>
        </Card>
      ) : (
        <Card className="p-4 text-sm text-muted">{t("bots.adminOnly")}</Card>
      )}

      <Card className="space-y-2 p-4">
        <h2 className="font-medium">{t("bots.list")}</h2>
        {bots.length === 0 && (
          <p className="text-sm text-muted">{t("bots.empty")}</p>
        )}
        {bots.map((b) => (
          <div
            key={b.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border px-3 py-2 text-sm"
          >
            <div className="min-w-0">
              <p className="font-medium">
                {b.name} · {b.status}
              </p>
              <p className="text-xs text-muted">
                KB: {b.knowledgeBase?.name || b.knowledgeBaseId.slice(0, 8)}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  window.location.href = `/app/chat?kbId=${b.knowledgeBaseId}&botId=${b.id}`;
                }}
              >
                {t("bots.openChat")}
              </Button>
              {canAdmin && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    const ok = await confirmDialog({
                      title: t("feedback.deleteBotTitle"),
                      description: t("feedback.deleteBotDesc", { name: b.name }),
                      confirmLabel: t("common.delete"),
                      danger: true,
                    });
                    if (!ok) return;
                    try {
                      await api(`/organizations/${orgId}/bots/${b.id}`, {
                        method: "DELETE",
                        orgId,
                      });
                      toast.success(t("bots.deleted"));
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
              )}
            </div>
          </div>
        ))}
      </Card>
    </AppPage>
  );
}
