"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Eye, Upload } from "@/components/icons";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  useDeleteKb,
  useDocumentChunks,
  useDocumentJobs,
  useDocumentVersions,
  useDocuments,
  useKnowledgeBases,
  useOrgId,
  useUpdateKb,
} from "@/lib/hooks";
import { formatBytes, formatDate } from "@/lib/utils";
import { uploadDocument } from "@/lib/upload";
import { api, ApiError } from "@/lib/api";
import { useCanManageKbAdmin, useCanWriteDocs } from "@/lib/org-role";
import { confirmDialog, toast } from "@/components/feedback";
import { labelStatus } from "@/lib/i18n-labels";

type AclRow = {
  id: string;
  principalType: string;
  principalId: string;
  permission: string;
};

function statusTone(status: string) {
  if (status === "ready" || status === "succeeded") return "success" as const;
  if (status === "failed") return "danger" as const;
  if (
    status === "processing" ||
    status === "pending" ||
    status === "queued" ||
    status === "running"
  ) {
    return "warn" as const;
  }
  return "default" as const;
}

export default function KnowledgeBaseDetailPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams<{ kbId: string }>();
  const kbId = params.kbId;
  const orgId = useOrgId();
  const canWrite = useCanWriteDocs();
  const canAcl = useCanManageKbAdmin();
  const canAdmin = canAcl;
  const qc = useQueryClient();
  const updateKb = useUpdateKb();
  const deleteKb = useDeleteKb();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: kbs, isError: kbsError, error: kbsErr } = useKnowledgeBases();
  const {
    data: docs,
    isLoading,
    isError: docsError,
    error: docsErr,
  } = useDocuments(kbId);
  const kb = useMemo(() => kbs?.find((k) => k.id === kbId), [kbs, kbId]);
  const kbActive = kb?.status === "active";
  const canMutate = canWrite && kbActive;
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [expandedChunks, setExpandedChunks] = useState<Record<string, boolean>>(
    {},
  );
  const [showAllChunks, setShowAllChunks] = useState(false);
  const [kbAcls, setKbAcls] = useState<AclRow[]>([]);
  const [aclType, setAclType] = useState<"user" | "role">("role");
  const [aclPrincipal, setAclPrincipal] = useState("viewer");
  const selectedDoc = docs?.find((d) => d.id === selectedDocId) ?? null;
  const { data: versions } = useDocumentVersions(selectedDocId);
  const { data: jobs } = useDocumentJobs(selectedDocId);
  const { data: chunks } = useDocumentChunks(
    selectedDocId,
    selectedDoc?.status,
  );

  useEffect(() => {
    setExpandedChunks({});
    setShowAllChunks(false);
  }, [selectedDocId]);

  useEffect(() => {
    if (!orgId || !kbId || !canAcl) return;
    void api<AclRow[]>(`/organizations/${orgId}/knowledge-bases/${kbId}/acls`, {
      orgId,
    })
      .then(setKbAcls)
      .catch(() => setKbAcls([]));
  }, [orgId, kbId, canAcl]);

  async function onUpload(files: FileList | null, documentId?: string) {
    if (!files?.length || !orgId || !canMutate) return;
    setUploading(true);
    setError("");
    try {
      for (const file of Array.from(files)) {
        await uploadDocument({ orgId, kbId, file, documentId });
      }
      await qc.invalidateQueries({ queryKey: ["documents", orgId, kbId] });
      if (documentId) {
        await qc.invalidateQueries({
          queryKey: ["document-versions", orgId, documentId],
        });
        await qc.invalidateQueries({
          queryKey: ["document-jobs", orgId, documentId],
        });
        await qc.invalidateQueries({
          queryKey: ["document-chunks", orgId, documentId],
        });
      }
      toast.success(t("feedback.uploadOk"), t("feedback.uploadOkDesc"));
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("feedback.uploadFail");
      setError(msg);
      toast.error(t("feedback.uploadFail"), msg);
    } finally {
      setUploading(false);
    }
  }

  async function reprocess(docId: string) {
    if (!orgId || !canMutate) return;
    const ok = await confirmDialog({
      title: t("feedback.reprocessTitle"),
      description: t("feedback.reprocessDesc"),
      confirmLabel: t("feedback.confirm"),
    });
    if (!ok) return;
    try {
      await api(`/organizations/${orgId}/documents/${docId}/reprocess`, {
        method: "POST",
        orgId,
      });
      await qc.invalidateQueries({ queryKey: ["documents", orgId, kbId] });
      await qc.invalidateQueries({ queryKey: ["document-jobs", orgId, docId] });
      await qc.invalidateQueries({
        queryKey: ["document-chunks", orgId, docId],
      });
      toast.success(t("feedback.reprocessOk"));
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : t("feedback.reprocessFail");
      setError(msg);
      toast.error(t("feedback.reprocessFail"), msg);
    }
  }

  async function removeDoc(docId: string) {
    if (!orgId || !canMutate) return;
    const ok = await confirmDialog({
      title: t("feedback.deleteDocTitle"),
      description: t("feedback.deleteDocDesc"),
      confirmLabel: t("common.delete"),
      danger: true,
    });
    if (!ok) return;
    try {
      await api(`/organizations/${orgId}/documents/${docId}`, {
        method: "DELETE",
        orgId,
      });
      if (selectedDocId === docId) setSelectedDocId(null);
      await qc.invalidateQueries({ queryKey: ["documents", orgId, kbId] });
      toast.success(t("feedback.deleteOk"));
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : t("feedback.deleteFail");
      setError(msg);
      toast.error(t("feedback.deleteFail"), msg);
    }
  }

  async function viewDocument(docId: string, versionId?: string) {
    if (!orgId) return;
    try {
      const qs = versionId
        ? `?versionId=${encodeURIComponent(versionId)}`
        : "";
      const data = await api<{
        url: string;
        filename: string;
        disposition: string;
      }>(`/organizations/${orgId}/documents/${docId}/download-url${qs}`, {
        orgId,
      });
      window.open(data.url, "_blank", "noopener,noreferrer");
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : t("kb.viewFail");
      toast.error(t("kb.viewFail"), msg);
    }
  }

  async function activateVersion(docId: string, versionId: string) {
    if (!orgId || !canMutate) return;
    try {
      await api(
        `/organizations/${orgId}/documents/${docId}/versions/${versionId}/activate`,
        { method: "POST", orgId },
      );
      await qc.invalidateQueries({ queryKey: ["documents", orgId, kbId] });
      await qc.invalidateQueries({
        queryKey: ["document-versions", orgId, docId],
      });
      await qc.invalidateQueries({
        queryKey: ["document-chunks", orgId, docId],
      });
      toast.success(t("common.updated"));
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : t("common.failed");
      setError(msg);
      toast.error(t("common.failed"), msg);
    }
  }

  async function retryJob(jobId: string, docId: string) {
    if (!orgId || !canMutate) return;
    try {
      await api(`/organizations/${orgId}/jobs/${jobId}/retry`, {
        method: "POST",
        orgId,
      });
      await qc.invalidateQueries({ queryKey: ["documents", orgId, kbId] });
      await qc.invalidateQueries({ queryKey: ["document-jobs", orgId, docId] });
      toast.success(t("feedback.reprocessOk"));
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : t("common.failed");
      setError(msg);
      toast.error(t("common.failed"), msg);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/app/knowledge-bases" className="text-sm text-sky-600 hover:underline">
            ← {t("common.back")}
          </Link>
          <h2 className="mt-2 text-2xl font-semibold">{kb?.name || t("kb.defaultName")}</h2>
          <p className="text-sm text-slate-500">
            {kb?.description || t("kb.defaultDescription")}
            {kb && (
              <>
                {" "}
                <Badge tone={kb.status === "active" ? "success" : "warn"}>
                  {labelStatus(t, kb.status)}
                </Badge>
              </>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/app/chat?kbId=${kbId}`}
            className="inline-flex h-10 items-center rounded-md bg-sky-600 px-4 text-sm font-medium text-white hover:bg-sky-500"
          >
            {t("chat.openChat")}
          </Link>
          <Link
            href={`/app/search?kbId=${kbId}`}
            className="inline-flex h-10 items-center rounded-md border border-slate-300 px-4 text-sm dark:border-slate-700"
          >
            {t("nav.search")}
          </Link>
          {canAdmin && kb && (
            <>
              <Button
                type="button"
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
                  try {
                    await updateKb.mutateAsync({
                      kbId,
                      status: archiving ? "archived" : "active",
                    });
                    toast.success(
                      archiving
                        ? t("feedback.archiveOk")
                        : t("feedback.restoreOk"),
                    );
                  } catch (err) {
                    toast.error(
                      t("common.failed"),
                      err instanceof ApiError ? err.message : t("common.failed"),
                    );
                  }
                }}
              >
                {kb.status === "active" ? t("kb.archive") : t("kb.restore")}
              </Button>
              <Button
                type="button"
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
                  try {
                    await deleteKb.mutateAsync(kbId);
                    toast.success(t("feedback.deleteOk"));
                    router.push("/app/knowledge-bases");
                  } catch (err) {
                    toast.error(
                      t("feedback.deleteFail"),
                      err instanceof ApiError
                        ? err.message
                        : t("feedback.deleteFail"),
                    );
                  }
                }}
              >
                {t("kb.deleteKb")}
              </Button>
            </>
          )}
        </div>
      </div>

      {(kbsError || docsError) && (
        <Card>
          <p className="text-sm text-rose-600">
            {(kbsErr as Error)?.message ||
              (docsErr as Error)?.message ||
              t("kb.loadFailed")}
          </p>
        </Card>
      )}

      {!kbActive && kb && (
        <Card>
          <p className="text-sm text-amber-700 dark:text-amber-300">
            {t("kb.archivedBanner")}
          </p>
        </Card>
      )}

      {canMutate ? (
        <>
        <Card className="border-accent-300 dark:border-accent-700">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="flex items-center gap-2 font-medium">
                <Upload className="h-4 w-4" />
                {t("kb.uploadTitle")}
              </h3>
              <p className="mt-1 text-sm text-foreground/75">{t("kb.uploadHint")}</p>
              <p className="mt-1 text-xs text-foreground/65">{t("kb.uploadHere")}</p>
              <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">{t("kb.uploadTip")}</p>
            </div>
            <Button
              type="button"
              disabled={!orgId || uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4" />
              {uploading ? t("kb.uploading") : t("kb.chooseFiles")}
            </Button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.docx,.xlsx,.txt,.md,.markdown,.png,.jpg,.jpeg,.webp,.tif,.tiff,application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain,text/markdown,image/*"
            className="sr-only"
            disabled={!orgId || uploading}
            onChange={(e) => {
              void onUpload(e.target.files);
              e.target.value = "";
            }}
          />
        </Card>
        <Card className="space-y-2 p-4">
          <h3 className="font-medium">{t("kb.noteTitle")}</h3>
          <p className="text-xs text-muted">{t("kb.noteHint")}</p>
          <Input
            id="note-title"
            placeholder={t("kb.noteTitlePlaceholder")}
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              const title = (e.target as HTMLInputElement).value.trim();
              const contentEl = document.getElementById(
                "note-content",
              ) as HTMLTextAreaElement | null;
              const content = contentEl?.value || "";
              if (!title || !orgId) return;
              void (async () => {
                try {
                  await api(`/organizations/${orgId}/knowledge-bases/${kbId}/notes`, {
                    method: "POST",
                    orgId,
                    body: { title, content },
                  });
                  (e.target as HTMLInputElement).value = "";
                  if (contentEl) contentEl.value = "";
                  toast.success(t("kb.noteCreated"));
                  await qc.invalidateQueries({ queryKey: ["documents", orgId, kbId] });
                } catch (err) {
                  toast.error(
                    t("common.failed"),
                    err instanceof ApiError ? err.message : String(err),
                  );
                }
              })();
            }}
          />
          <textarea
            id="note-content"
            className="min-h-[80px] w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            placeholder={t("kb.noteContentPlaceholder")}
          />
        </Card>
        </>
      ) : (
        <Card>
          <p className="text-sm text-foreground/80">
            {canWrite ? t("kb.archivedNoUpload") : t("kb.viewerNoUpload")}
          </p>
        </Card>
      )}

      {error && (
        <Card>
          <p className="text-sm text-rose-600">{error}</p>
        </Card>
      )}

      <Card>
        <h3 className="mb-4 font-medium">{t("kb.documentsTitle")}</h3>
        {isLoading ? (
          <p className="text-sm text-slate-500">{t("common.loading")}</p>
        ) : (docs?.length ?? 0) === 0 ? (
          <p className="text-sm text-slate-500">{t("kb.documentsEmpty")}</p>
        ) : (
          <div className="table-scroll">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-slate-500 dark:border-slate-800">
                <tr>
                  <th className="py-2 pr-3">{t("kb.colTitle")}</th>
                  <th className="py-2 pr-3">{t("kb.colStatus")}</th>
                  <th className="py-2 pr-3">{t("kb.colTrust")}</th>
                  <th className="py-2 pr-3">{t("kb.colParse")}</th>
                  <th className="py-2 pr-3">{t("kb.colSize")}</th>
                  <th className="py-2 pr-3">{t("kb.colUpdated")}</th>
                  <th className="py-2">{t("common.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {docs?.map((doc) => {
                  const busy = ["pending", "processing"].includes(doc.status);
                  return (
                    <tr
                      key={doc.id}
                      className={`border-b border-slate-100 dark:border-slate-900 ${
                        selectedDocId === doc.id ? "bg-sky-50/50 dark:bg-sky-950/20" : ""
                      }`}
                    >
                      <td className="py-3 pr-3 font-medium">
                        {doc.title}
                        {doc.kind === "note" ? (
                          <span className="ml-2 text-xs text-muted">note</span>
                        ) : null}
                      </td>
                      <td className="py-3 pr-3">
                        <Badge tone={statusTone(doc.status)}>
                          {labelStatus(t, doc.status)}
                        </Badge>
                      </td>
                      <td className="py-3 pr-3">
                        <Badge
                          tone={
                            doc.trustStatus === "verified"
                              ? "success"
                              : doc.trustStatus === "rejected"
                                ? "danger"
                                : "default"
                          }
                        >
                          {t(`kb.trust_${doc.trustStatus || "unverified"}`)}
                        </Badge>
                      </td>
                      <td className="py-3 pr-3">
                        <Badge tone={statusTone(doc.currentVersion?.parseStatus || "")}>
                          {labelStatus(t, doc.currentVersion?.parseStatus)}
                        </Badge>
                      </td>
                      <td className="py-3 pr-3 text-slate-500">
                        {doc.currentVersion
                          ? formatBytes(doc.currentVersion.byteSize)
                          : "—"}
                      </td>
                      <td className="py-3 pr-3 text-slate-500">
                        {formatDate(doc.updatedAt)}
                      </td>
                      <td className="py-3">
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={!doc.currentVersion}
                            title={t("kb.viewDoc")}
                            aria-label={t("kb.viewDoc")}
                            onClick={() => void viewDocument(doc.id)}
                          >
                            <Eye className="h-4 w-4" />
                            <span className="hidden sm:inline">
                              {t("kb.viewDoc")}
                            </span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setSelectedDocId((id) =>
                                id === doc.id ? null : doc.id,
                              )
                            }
                          >
                            {t("kb.details")}
                          </Button>
                          {canMutate && (
                            <>
                              {doc.trustStatus !== "verified" ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={async () => {
                                    try {
                                      await api(
                                        `/organizations/${orgId}/documents/${doc.id}/governance`,
                                        {
                                          method: "PATCH",
                                          orgId,
                                          body: { verify: true },
                                        },
                                      );
                                      toast.success(t("kb.verifiedOk"));
                                      await qc.invalidateQueries({
                                        queryKey: ["documents", orgId, kbId],
                                      });
                                    } catch (err) {
                                      toast.error(
                                        t("common.failed"),
                                        err instanceof ApiError
                                          ? err.message
                                          : String(err),
                                      );
                                    }
                                  }}
                                >
                                  {t("kb.verify")}
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={async () => {
                                    try {
                                      await api(
                                        `/organizations/${orgId}/documents/${doc.id}/governance`,
                                        {
                                          method: "PATCH",
                                          orgId,
                                          body: { verify: false },
                                        },
                                      );
                                      toast.success(t("kb.unverifiedOk"));
                                      await qc.invalidateQueries({
                                        queryKey: ["documents", orgId, kbId],
                                      });
                                    } catch (err) {
                                      toast.error(
                                        t("common.failed"),
                                        err instanceof ApiError
                                          ? err.message
                                          : String(err),
                                      );
                                    }
                                  }}
                                >
                                  {t("kb.unverify")}
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={busy}
                                onClick={() => reprocess(doc.id)}
                              >
                                {t("kb.reprocess")}
                              </Button>
                              <Button
                                size="sm"
                                variant="danger"
                                disabled={busy}
                                onClick={() => removeDoc(doc.id)}
                              >
                                {t("common.delete")}
                              </Button>
                            </>
                          )}
                        </div>
                        {doc.status === "failed" && (
                          <p className="mt-1 max-w-md text-xs text-rose-600">
                            {t("kb.failedHint")}
                            {doc.currentVersion?.errorMessage
                              ? ` (${doc.currentVersion.errorMessage})`
                              : ""}
                          </p>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {selectedDocId && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="font-medium">{t("kb.versionsTitle")}</h3>
              {canMutate && (
                <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-sky-700">
                  <span>{t("kb.newVersion")}</span>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.docx,.xlsx,.txt,.md,.markdown,.png,.jpg,.jpeg,.webp,.tif,.tiff,image/*"
                    disabled={uploading}
                    onChange={(e) => {
                      void onUpload(e.target.files, selectedDocId);
                      e.target.value = "";
                    }}
                  />
                </label>
              )}
            </div>
            <ul className="space-y-2 text-sm">
              {(versions || []).map((v) => (
                <li
                  key={v.id}
                  className="flex items-center justify-between gap-2 rounded-md border border-slate-200 px-3 py-2 dark:border-slate-800"
                >
                  <div>
                    <p className="font-medium">
                      v{v.versionNumber}{" "}
                      <Badge tone={statusTone(v.parseStatus)}>
                        {labelStatus(t, v.parseStatus)}
                      </Badge>
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatBytes(v.byteSize)} · {formatDate(v.createdAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      title={t("kb.viewDoc")}
                      aria-label={t("kb.viewDoc")}
                      onClick={() =>
                        void viewDocument(selectedDocId, v.id)
                      }
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {canMutate &&
                      selectedDoc?.currentVersionId !== v.id && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => activateVersion(selectedDocId, v.id)}
                        >
                          {t("kb.activateVersion")}
                        </Button>
                      )}
                  </div>
                </li>
              ))}
              {(versions?.length ?? 0) === 0 && (
                <li className="text-slate-500">{t("kb.versionsEmpty")}</li>
              )}
            </ul>
          </Card>

          <Card>
            <h3 className="mb-3 font-medium">{t("kb.jobsTitle")}</h3>
            <ul className="space-y-2 text-sm">
              {(jobs || []).map((j) => (
                <li
                  key={j.id}
                  className="flex items-center justify-between gap-2 rounded-md border border-slate-200 px-3 py-2 dark:border-slate-800"
                >
                  <div>
                    <p className="font-medium">
                      <Badge tone={statusTone(j.status)}>
                        {labelStatus(t, j.status)}
                      </Badge>{" "}
                      <span className="text-xs text-slate-500">
                        {t("kb.attempts", { count: j.attempts })}
                      </span>
                    </p>
                    {j.errorMessage && (
                      <p className="mt-1 text-xs text-rose-600">{j.errorMessage}</p>
                    )}
                  </div>
                  {canMutate && j.status === "failed" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => retryJob(j.id, selectedDocId)}
                    >
                      {t("kb.retryJob")}
                    </Button>
                  )}
                </li>
              ))}
              {(jobs?.length ?? 0) === 0 && (
                <li className="text-slate-500">{t("kb.jobsEmpty")}</li>
              )}
            </ul>
          </Card>

          <Card className="lg:col-span-2">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-medium">
                {t("kb.chunksTitle", { count: chunks?.length ?? 0 })}
              </h3>
              {(chunks?.length ?? 0) > 20 && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setShowAllChunks((v) => !v)}
                >
                  {showAllChunks
                    ? t("kb.chunksShowLess")
                    : t("kb.chunksShowAll", { count: chunks?.length ?? 0 })}
                </Button>
              )}
            </div>
            <div className="max-h-[28rem] space-y-2 overflow-y-auto text-sm">
              {(chunks || [])
                .slice(0, showAllChunks ? undefined : 20)
                .map((c) => {
                  const open = !!expandedChunks[c.id];
                  const long = c.content.length > 600;
                  return (
                    <div
                      key={c.id}
                      className="rounded-md border border-slate-200 px-3 py-2 dark:border-slate-800"
                    >
                      <p className="text-xs text-slate-500">
                        #{c.chunkIndex} ·{" "}
                        {t("kb.tokens", { count: c.tokenCount })} ·{" "}
                        {t("kb.chars", { count: c.content.length })}
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-slate-700 dark:text-slate-300">
                        {open || !long
                          ? c.content
                          : `${c.content.slice(0, 600)}…`}
                      </p>
                      {long && (
                        <button
                          type="button"
                          className="mt-1 text-xs text-primary underline-offset-2 hover:underline"
                          onClick={() =>
                            setExpandedChunks((prev) => ({
                              ...prev,
                              [c.id]: !prev[c.id],
                            }))
                          }
                        >
                          {open ? t("kb.chunkCollapse") : t("kb.chunkExpand")}
                        </button>
                      )}
                    </div>
                  );
                })}
              {(chunks?.length ?? 0) === 0 && (
                <p className="text-slate-500">{t("kb.chunksEmpty")}</p>
              )}
            </div>
          </Card>
        </div>
      )}

      {canAcl && (
        <Card className="mt-4 space-y-5 p-5">
          <div>
            <h3 className="text-base font-medium text-foreground">
              {t("acl.title")}
            </h3>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted">
              {t("acl.hint")}
            </p>
          </div>

          <form
            className="grid gap-3 sm:grid-cols-[11rem_minmax(0,1fr)_auto] sm:items-end"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!orgId) return;
              try {
                await api(
                  `/organizations/${orgId}/knowledge-bases/${kbId}/acls`,
                  {
                    method: "POST",
                    orgId,
                    body: {
                      principalType: aclType,
                      principalId: aclPrincipal.trim(),
                      permission: "read",
                    },
                  },
                );
                const rows = await api<AclRow[]>(
                  `/organizations/${orgId}/knowledge-bases/${kbId}/acls`,
                  { orgId },
                );
                setKbAcls(rows);
                toast.success(t("acl.saved"));
              } catch (err) {
                toast.error(
                  t("common.failed"),
                  err instanceof ApiError ? err.message : String(err),
                );
              }
            }}
          >
            <label className="block min-w-0">
              <span className="mb-1.5 block text-xs font-medium text-muted">
                {t("acl.principalType")}
              </span>
              <select
                className="flex h-11 w-full rounded-xl border border-border bg-surface-elevated px-3.5 text-sm text-foreground outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-ring"
                value={aclType}
                onChange={(e) => {
                  const next = e.target.value as "user" | "role";
                  setAclType(next);
                  setAclPrincipal(next === "role" ? "viewer" : "");
                }}
              >
                <option value="role">{t("acl.typeRole")}</option>
                <option value="user">{t("acl.typeUser")}</option>
              </select>
            </label>

            <label className="block min-w-0">
              <span className="mb-1.5 block text-xs font-medium text-muted">
                {aclType === "role"
                  ? t("acl.roleLabel")
                  : t("acl.userIdLabel")}
              </span>
              {aclType === "role" ? (
                <select
                  className="flex h-11 w-full rounded-xl border border-border bg-surface-elevated px-3.5 text-sm text-foreground outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-ring"
                  value={aclPrincipal}
                  onChange={(e) => setAclPrincipal(e.target.value)}
                  required
                >
                  <option value="viewer">viewer</option>
                  <option value="member">member</option>
                </select>
              ) : (
                <Input
                  value={aclPrincipal}
                  onChange={(e) => setAclPrincipal(e.target.value)}
                  placeholder={t("acl.userIdPlaceholder")}
                  required
                />
              )}
            </label>

            <Button type="submit" className="h-11 w-full sm:w-auto sm:px-5">
              {t("acl.add")}
            </Button>
          </form>

          <div className="border-t border-border pt-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
              {t("acl.listTitle")}
            </p>
            {kbAcls.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted">
                {t("acl.empty")}
              </p>
            ) : (
              <ul className="space-y-2">
                {kbAcls.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface-elevated px-3.5 py-2.5 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">
                        {a.principalType === "role"
                          ? t("acl.rowRole", { id: a.principalId })
                          : t("acl.rowUser", { id: a.principalId })}
                      </p>
                      <p className="text-xs text-muted">
                        {t("acl.permission")}: {a.permission}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="shrink-0"
                      onClick={async () => {
                        if (!orgId) return;
                        await api(
                          `/organizations/${orgId}/knowledge-bases/${kbId}/acls/${a.id}`,
                          { method: "DELETE", orgId },
                        );
                        setKbAcls((prev) =>
                          prev.filter((x) => x.id !== a.id),
                        );
                      }}
                    >
                      {t("common.delete")}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
