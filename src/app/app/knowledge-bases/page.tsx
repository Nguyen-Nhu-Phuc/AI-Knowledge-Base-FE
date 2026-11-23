"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import { Upload } from "@/components/icons";
import { Card } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  useCreateKb,
  useDeleteKb,
  useKnowledgeBases,
  useOrgId,
  useUpdateKb,
} from "@/lib/hooks";
import { formatDate } from "@/lib/utils";
import { ApiError } from "@/lib/api";
import { useCanCreateKb, useCanManageKbAdmin } from "@/lib/org-role";
import { confirmDialog, toast } from "@/components/feedback";
import { labelStatus } from "@/lib/i18n-labels";
import { AppPage } from "@/components/layout/app-page";

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

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    if (!orgId || !canCreate) return;
    setError("");
    try {
      await createKb.mutateAsync({ name, description: description || undefined });
      setName("");
      setDescription("");
      toast.success(t("feedback.createKbOk"));
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : t("kb.createFailed");
      setError(msg);
      toast.error(t("kb.createFailed"), msg);
    }
  }

  return (
    <AppPage>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">
          {t("nav.knowledge")}
        </p>
        <h2 className="font-display mt-2 text-3xl font-semibold tracking-tight">{t("kb.title")}</h2>
        <p className="mt-1.5 max-w-2xl text-sm text-muted">{t("kb.subtitle")}</p>
      </div>

      {!orgId && (
        <Card>
          <p className="text-sm text-amber-700">{t("kb.selectOrgFirst")}</p>
        </Card>
      )}

      {canCreate ? (
        <Card>
          <h3 className="font-medium">{t("kb.createTitle")}</h3>
          <form onSubmit={onCreate} className="mt-4 space-y-3">
            <Input
              placeholder={t("kb.namePlaceholder")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={!orgId}
            />
            <Textarea
              placeholder={t("kb.descriptionPlaceholder")}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={!orgId}
            />
            <Button disabled={!orgId || createKb.isPending}>
              {createKb.isPending ? t("kb.creating") : t("common.create")}
            </Button>
          </form>
        </Card>
      ) : (
        <Card>
          <p className="text-sm text-slate-500">{t("kb.createForbidden")}</p>
        </Card>
      )}

      {(error || isError) && (
        <Card>
          <p className="text-sm text-rose-600">
            {error || (loadError as Error)?.message || t("common.loadFailed")}
          </p>
        </Card>
      )}

      <div>
        {isLoading ? (
          <p className="text-sm text-muted">{t("common.loading")}</p>
        ) : (kbs?.length ?? 0) === 0 ? (
          <p className="rounded-2xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted">
            {t("kb.empty")}
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {kbs?.map((kb) => (
              <div
                key={kb.id}
                className="surface-panel flex flex-col rounded-2xl p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Link
                      href={`/app/knowledge-bases/${kb.id}`}
                      className="font-medium hover:text-accent-700 dark:hover:text-accent-300"
                    >
                      {kb.name}
                    </Link>
                    <p className="mt-1 line-clamp-2 text-xs text-muted">
                      {kb.description || t("kb.subtitle")}
                    </p>
                    <p className="mt-2 text-[11px] text-muted">
                      {formatDate(kb.updatedAt)}
                    </p>
                  </div>
                  <Badge tone={kb.status === "active" ? "success" : "warn"}>
                    {labelStatus(t, kb.status)}
                  </Badge>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    href={`/app/knowledge-bases/${kb.id}`}
                    className={cn(buttonVariants({ size: "sm" }))}
                  >
                    <Upload className="h-3.5 w-3.5" />
                    {t("kb.uploadCta")}
                  </Link>
                  <Link
                    href={`/app/knowledge-bases/${kb.id}`}
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                  >
                    {t("kb.open")}
                  </Link>
                  <Link
                    href={`/app/chat?kbId=${kb.id}`}
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                  >
                    {t("nav.ai")}
                  </Link>
                  {canAdmin && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={updateKb.isPending}
                        onClick={async () => {
                          const archiving = kb.status === "active";
                          const ok = await confirmDialog({
                            title: archiving
                              ? t("feedback.archiveKbTitle")
                              : t("feedback.restoreKbTitle"),
                            description: archiving
                              ? t("feedback.archiveKbDesc")
                              : undefined,
                            confirmLabel: archiving
                              ? t("kb.archive")
                              : t("kb.restore"),
                          });
                          if (!ok) return;
                          updateKb.mutate(
                            {
                              kbId: kb.id,
                              status: archiving ? "archived" : "active",
                            },
                            {
                              onSuccess: () =>
                                toast.success(
                                  archiving
                                    ? t("feedback.archiveOk")
                                    : t("feedback.restoreOk"),
                                ),
                              onError: (err) => {
                                const msg =
                                  err instanceof Error
                                    ? err.message
                                    : t("common.failed");
                                setError(msg);
                                toast.error(t("common.failed"), msg);
                              },
                            },
                          );
                        }}
                      >
                        {kb.status === "active" ? t("kb.archive") : t("kb.restore")}
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        disabled={deleteKb.isPending}
                        onClick={async () => {
                          const ok = await confirmDialog({
                            title: t("feedback.deleteKbTitle"),
                            description: t("feedback.deleteKbDesc"),
                            confirmLabel: t("common.delete"),
                            danger: true,
                          });
                          if (!ok) return;
                          deleteKb.mutate(kb.id, {
                            onSuccess: () => toast.success(t("feedback.deleteOk")),
                            onError: (err) => {
                              const msg =
                                err instanceof Error
                                  ? err.message
                                  : t("feedback.deleteFail");
                              setError(msg);
                              toast.error(t("feedback.deleteFail"), msg);
                            },
                          });
                        }}
                      >
                        {t("kb.deleteKb")}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        {canAdmin && (kbs?.length ?? 0) > 0 && (
          <p className="mt-3 text-xs text-muted">{t("kb.deleteKbHint")}</p>
        )}
        {!canAdmin && (kbs?.length ?? 0) > 0 && (
          <p className="mt-3 text-xs text-muted">{t("kb.deleteKbAdminOnly")}</p>
        )}
      </div>
    </AppPage>
  );
}
