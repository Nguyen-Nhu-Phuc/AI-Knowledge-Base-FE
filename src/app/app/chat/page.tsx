"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import { FileText, Plus, ThumbsDown, ThumbsUp, Upload } from "@/components/icons";
import { Card } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  useConversations,
  useKnowledgeBases,
  useMessages,
  useOrgId,
} from "@/lib/hooks";
import { streamChat } from "@/lib/chat-sse";
import { api } from "@/lib/api";
import { useCanWriteDocs } from "@/lib/org-role";
import { confirmDialog, toast } from "@/components/feedback";
import type { Citation, Message } from "@/lib/types";
import { AppPage } from "@/components/layout/app-page";

function ChatPageInner() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const orgId = useOrgId();
  const canWrite = useCanWriteDocs();
  const qc = useQueryClient();
  const { data: kbs } = useKnowledgeBases();
  const { data: conversations } = useConversations();
  const activeKbs = useMemo(
    () => (kbs || []).filter((k) => k.status === "active"),
    [kbs],
  );
  const [kbId, setKbId] = useState(searchParams.get("kbId") || "");
  const [botId] = useState(searchParams.get("botId") || "");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [input, setInput] = useState(searchParams.get("q") || "");
  const [streaming, setStreaming] = useState(false);
  const [status, setStatus] = useState("");
  const [draftAnswer, setDraftAnswer] = useState("");
  const [draftCitations, setDraftCitations] = useState<Citation[]>([]);
  const [research, setResearch] = useState(false);
  const [rewrite, setRewrite] = useState(false);
  const [error, setError] = useState("");
  const [pendingUser, setPendingUser] = useState<Message | null>(null);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const autoSent = useRef(false);

  const { data: messages } = useMessages(conversationId);
  const filteredConversations = useMemo(
    () => (conversations || []).filter((c) => !kbId || c.knowledgeBaseId === kbId),
    [conversations, kbId],
  );

  useEffect(() => {
    const stillValid = activeKbs.some((k) => k.id === kbId);
    if (!stillValid) {
      setKbId(activeKbs[0]?.id || "");
      setConversationId(null);
      setPendingUser(null);
      setDraftAnswer("");
      setDraftCitations([]);
    }
  }, [orgId, activeKbs, kbId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, draftAnswer]);

  async function send(override?: string) {
    const question = (override ?? input).trim();
    if (!orgId || !kbId || !question || streaming) return;
    setStreaming(true);
    setError("");
    setStatus("starting");
    setDraftAnswer("");
    setDraftCitations([]);
    setInput("");
    setPendingUser({
      id: `pending-user-${Date.now()}`,
      role: "user",
      content: question,
      createdAt: new Date().toISOString(),
    });
    try {
      await streamChat({
        orgId,
        kbId,
        message: question,
        conversationId,
        botId: botId || undefined,
        research,
        rewrite,
        handlers: {
          onConversationCreated: (id) => setConversationId(id),
          onStatus: (stage) => setStatus(stage),
          onDelta: (text) => setDraftAnswer((prev) => prev + text),
          onCitations: (cites) => setDraftCitations(cites),
          onCompleted: async (payload) => {
            setConversationId(payload.conversationId);
            setDraftAnswer("");
            setDraftCitations([]);
            setPendingUser(null);
            setStatus("");
            await qc.invalidateQueries({ queryKey: ["conversations", orgId] });
            await qc.invalidateQueries({
              queryKey: ["messages", orgId, payload.conversationId],
            });
          },
          onError: (message) => {
            setError(message);
            toast.error(t("feedback.chatFail"), message);
            setPendingUser(null);
            setDraftAnswer("");
            setDraftCitations([]);
            setInput(question);
          },
        },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("feedback.chatFail");
      setError(msg);
      toast.error(t("feedback.chatFail"), msg);
      setInput(question);
      setPendingUser(null);
      setDraftAnswer("");
      setDraftCitations([]);
    } finally {
      setStreaming(false);
      setStatus("");
    }
  }

  useEffect(() => {
    const q = searchParams.get("q");
    if (!q || autoSent.current || !kbId || !orgId || streaming) return;
    autoSent.current = true;
    void send(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kbId, orgId]);

  async function feedback(messageId: string, rating: "positive" | "negative") {
    if (!orgId) return;
    try {
      await api(`/organizations/${orgId}/messages/${messageId}/feedback`, {
        method: "POST",
        orgId,
        body: { rating },
      });
      await qc.invalidateQueries({
        queryKey: ["messages", orgId, conversationId],
      });
      toast.success(t("feedback.feedbackOk"));
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("common.failed");
      setError(msg);
      toast.error(t("common.failed"), msg);
    }
  }

  async function deleteConversation(id: string) {
    if (!orgId) return;
    const ok = await confirmDialog({
      title: t("feedback.deleteConversationTitle"),
      description: t("feedback.deleteConversationDesc"),
      confirmLabel: t("common.delete"),
      danger: true,
    });
    if (!ok) return;
    try {
      await api(`/organizations/${orgId}/conversations/${id}`, {
        method: "DELETE",
        orgId,
      });
      if (conversationId === id) setConversationId(null);
      await qc.invalidateQueries({ queryKey: ["conversations", orgId] });
      toast.success(t("feedback.deleteOk"));
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("feedback.deleteFail");
      setError(msg);
      toast.error(t("feedback.deleteFail"), msg);
    }
  }

  const liveMessages: Message[] = [
    ...(messages || []),
    ...(pendingUser ? [pendingUser] : []),
    ...(streaming && (draftAnswer || status)
      ? [
          {
            id: "draft",
            role: "assistant" as const,
            content:
              draftAnswer ||
              (status
                ? `… ${
                    status === "starting"
                      ? t("chat.statusStarting")
                      : status
                  }`
                : ""),
            createdAt: new Date().toISOString(),
            citations: draftCitations,
          },
        ]
      : []),
  ];

  const latestCitations =
    draftCitations.length > 0
      ? draftCitations
      : messages?.filter((m) => m.role === "assistant").at(-1)?.citations || [];

  const historyPanel = (
    <>
      <div className="border-b border-border/80 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          {t("chat.conversations")}
        </p>
        <Button
          className="mt-2 w-full"
          size="sm"
          variant="outline"
          onClick={() => {
            setConversationId(null);
            setDraftAnswer("");
            setDraftCitations([]);
            setPendingUser(null);
            setHistoryOpen(false);
          }}
        >
          <Plus className="h-3.5 w-3.5" />
          {t("chat.newConversation")}
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-1.5">
        {filteredConversations.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => {
              setConversationId(c.id);
              setHistoryOpen(false);
            }}
            className={`mb-0.5 w-full rounded-lg px-2.5 py-2 text-left text-[13px] hover:bg-ink-100 dark:hover:bg-ink-800/70 ${
              conversationId === c.id ? "accent-soft font-medium" : ""
            }`}
          >
            <p className="truncate">{c.title}</p>
            <p className="truncate text-[11px] text-muted">
              {new Date(c.updatedAt).toLocaleString()}
            </p>
          </button>
        ))}
      </div>
    </>
  );

  return (
    <AppPage wide className="relative grid h-[min(820px,calc(100dvh-8rem))] gap-3 !space-y-0 md:h-[min(860px,calc(100dvh-7rem))] lg:grid-cols-[220px_minmax(0,1fr)_280px]">
      {/* History — desktop */}
      <aside className="hidden overflow-hidden rounded-2xl border border-border bg-surface-elevated lg:flex lg:flex-col">
        {historyPanel}
      </aside>

      {/* History — mobile sheet */}
      {historyOpen && (
        <div className="fixed inset-0 z-30 lg:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label={t("common.cancel")}
            onClick={() => setHistoryOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-[min(90vw,300px)] flex-col border-r border-border bg-surface shadow-xl">
            {historyPanel}
          </aside>
        </div>
      )}

      {/* Main chat column */}
      <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-border bg-surface-elevated/90">
        <div className="flex flex-wrap items-center gap-2 border-b border-border/80 px-2.5 py-2 sm:px-3 sm:py-2.5">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="lg:hidden"
            onClick={() => setHistoryOpen(true)}
          >
            {t("chat.conversations")}
          </Button>
          <select
            className="h-9 min-w-0 flex-1 rounded-lg border border-border bg-transparent px-2 text-[13px] sm:min-w-[160px] sm:px-2.5"
            value={kbId}
            onChange={(e) => setKbId(e.target.value)}
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
          <label className="flex items-center gap-1.5 text-[11px] text-muted">
            <input type="checkbox" checked={rewrite} onChange={(e) => setRewrite(e.target.checked)} />
            {t("chat.rewrite")}
          </label>
          <label className="flex items-center gap-1.5 text-[11px] text-muted">
            <input type="checkbox" checked={research} onChange={(e) => setResearch(e.target.checked)} />
            {t("chat.research")}
          </label>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="lg:hidden"
            onClick={() => setSourcesOpen(true)}
          >
            {t("chat.sources")}
          </Button>
          {canWrite && kbId && (
            <Link
              href={`/app/knowledge-bases/${kbId}`}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "ml-auto hidden sm:inline-flex",
              )}
            >
              <Upload className="h-3.5 w-3.5" />
              {t("kb.uploadCta")}
            </Link>
          )}
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5">
          {liveMessages.length === 0 && (
            <div className="mx-auto flex max-w-md flex-col items-center px-4 py-16 text-center">
              <div className="accent-soft mb-3 flex h-11 w-11 items-center justify-center rounded-2xl">
                <FileText className="h-5 w-5" />
              </div>
              <h3 className="font-display text-lg font-semibold">{t("chat.emptyTitle")}</h3>
              <p className="mt-2 text-sm text-muted">{t("chat.emptyHint")}</p>
              <p className="mt-3 text-xs text-foreground/75">{t("chat.needDocs")}</p>
              {canWrite && (
                <Link
                  href={kbId ? `/app/knowledge-bases/${kbId}` : "/app/knowledge-bases"}
                  className={cn(buttonVariants({ size: "sm" }), "mt-4")}
                >
                  <Upload className="h-3.5 w-3.5" />
                  {kbId ? t("chat.goUpload") : t("nav.knowledgeBases")}
                </Link>
              )}
            </div>
          )}

          {liveMessages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[92%] rounded-2xl px-3.5 py-2.5 text-[14px] sm:max-w-[80%] ${
                  m.role === "user" ? "chat-bubble-user" : "chat-bubble-assistant"
                }`}
              >
                <p className="prose-chat">{m.content}</p>
                {m.role === "assistant" && (m.citations?.length ?? 0) > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {m.citations!.slice(0, 5).map((c, i) => (
                      <span key={`${c.chunkId}-${i}`} className="cite-chip">
                        [{i + 1}] {c.snippet.slice(0, 28)}
                        {c.snippet.length > 28 ? "…" : ""}
                      </span>
                    ))}
                    {(m.citations!.length ?? 0) > 5 && (
                      <button
                        type="button"
                        className="cite-chip hover:text-accent-700"
                        onClick={() => setSourcesOpen(true)}
                      >
                        +{m.citations!.length - 5} {t("chat.viewSources")}
                      </button>
                    )}
                  </div>
                )}
                {m.role === "assistant" && m.id !== "draft" && (
                  <div className="mt-2 flex gap-1">
                    <button
                      className="rounded p-1 text-muted hover:bg-ink-100 dark:hover:bg-ink-800/70"
                      onClick={() => void feedback(m.id, "positive")}
                    >
                      <ThumbsUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      className="rounded p-1 text-muted hover:bg-ink-100 dark:hover:bg-ink-800/70"
                      onClick={() => void feedback(m.id, "negative")}
                    >
                      <ThumbsDown className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-border/80 p-2 sm:p-3">
          {error && <p className="mb-2 text-sm text-rose-600">{error}</p>}
          <div className="ask-bar flex items-end gap-2 rounded-2xl p-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("chat.placeholder")}
              className="min-h-[44px] border-0 bg-transparent shadow-none focus-visible:ring-0 sm:min-h-[52px]"
              disabled={!kbId || streaming}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
            />
            <Button
              className="shrink-0"
              onClick={() => void send()}
              disabled={!kbId || streaming || !input.trim()}
            >
              {streaming ? "…" : t("chat.send")}
            </Button>
          </div>
        </div>
      </section>

      {/* Sources — desktop column */}
      <aside className="hidden overflow-hidden rounded-2xl border border-border bg-surface-elevated lg:flex lg:flex-col">
        <div className="flex items-center justify-between border-b border-border/80 px-3 py-3">
          <h3 className="text-sm font-semibold">{t("chat.sources")}</h3>
        </div>
        <div className="flex-1 space-y-2 overflow-y-auto p-3">
          {latestCitations.length === 0 ? (
            <p className="text-sm text-muted">{t("chat.emptyHint")}</p>
          ) : (
            latestCitations.map((c, idx) => (
              <div
                key={`${c.chunkId}-${idx}`}
                className="rounded-xl border border-border/80 p-2.5 text-xs"
              >
                <div className="mb-1 flex items-center gap-1.5">
                  <span className="cite-chip">[{idx + 1}]</span>
                  <FileText className="h-3.5 w-3.5 text-muted" />
                  <span className="truncate font-medium">
                    {c.chunkId.slice(0, 8)}…
                  </span>
                </div>
                <p className="leading-relaxed text-muted">{c.snippet}</p>
              </div>
            ))
          )}
        </div>
        {conversationId && (
          <div className="border-t border-border/80 p-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-rose-600"
              onClick={() => void deleteConversation(conversationId)}
            >
              {t("common.delete")}
            </Button>
          </div>
        )}
      </aside>

      {/* Sources — mobile bottom sheet */}
      {sourcesOpen && (
        <div className="fixed inset-0 z-30 lg:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label={t("common.cancel")}
            onClick={() => setSourcesOpen(false)}
          />
          <aside className="absolute inset-x-0 bottom-0 max-h-[70dvh] overflow-hidden rounded-t-2xl border border-border bg-surface shadow-xl safe-bottom-nav">
            <div className="flex items-center justify-between border-b border-border/80 px-3 py-3">
              <h3 className="text-sm font-semibold">{t("chat.sources")}</h3>
              <button
                type="button"
                className="text-[11px] font-medium text-muted"
                onClick={() => setSourcesOpen(false)}
              >
                {t("common.cancel")}
              </button>
            </div>
            <div className="max-h-[55dvh] space-y-2 overflow-y-auto p-3">
              {latestCitations.length === 0 ? (
                <p className="text-sm text-muted">{t("chat.emptyHint")}</p>
              ) : (
                latestCitations.map((c, idx) => (
                  <div
                    key={`${c.chunkId}-${idx}`}
                    className="rounded-xl border border-border/80 p-2.5 text-xs"
                  >
                    <div className="mb-1 flex items-center gap-1.5">
                      <span className="cite-chip">[{idx + 1}]</span>
                      <FileText className="h-3.5 w-3.5 text-muted" />
                    </div>
                    <p className="leading-relaxed text-muted">{c.snippet}</p>
                  </div>
                ))
              )}
            </div>
          </aside>
        </div>
      )}
    </AppPage>
  );
}

function ChatFallback() {
  const { t } = useTranslation();
  return (
    <Card>
      <p className="text-sm text-muted">{t("chat.loading")}</p>
    </Card>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<ChatFallback />}>
      <ChatPageInner />
    </Suspense>
  );
}
