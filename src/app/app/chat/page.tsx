"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  FileText,
  Plus,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  Upload,
} from "@/components/icons";
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

function scorePercent(score?: number | null) {
  if (score == null || Number.isNaN(score)) return null;
  const pct = score <= 1 ? score * 100 : score;
  return Math.max(4, Math.min(100, Math.round(pct)));
}

function chatStatusLabel(
  t: (key: string) => string,
  stage: string,
) {
  switch (stage) {
    case "starting":
      return t("chat.statusStarting");
    case "retrieving":
      return t("chat.statusRetrieving");
    case "generating":
      return t("chat.statusGenerating");
    case "researching":
      return t("chat.statusResearching");
    default:
      return stage;
  }
}

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
  const messagesPaneRef = useRef<HTMLDivElement>(null);
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
    const pane = messagesPaneRef.current;
    if (!pane) return;
    pane.scrollTo({ top: pane.scrollHeight, behavior: "smooth" });
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
      if (conversationId === id) {
        setConversationId(null);
        setDraftAnswer("");
        setDraftCitations([]);
        setPendingUser(null);
        setError("");
      }
      await qc.invalidateQueries({ queryKey: ["conversations", orgId] });
      await qc.invalidateQueries({ queryKey: ["messages", orgId, id] });
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
              (status ? `… ${chatStatusLabel(t, status)}` : ""),
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
      <div className="flex shrink-0 items-center gap-2 border-b border-border px-3 py-3">
        <p className="min-w-0 flex-1 truncate text-sm font-semibold">
          {t("chat.conversations")}
        </p>
        <Button
          className="h-9 shrink-0"
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
      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {filteredConversations.length === 0 ? (
          <p className="px-2 py-6 text-center text-xs text-muted">
            {t("chat.emptyHint")}
          </p>
        ) : (
          filteredConversations.map((c) => (
            <div
              key={c.id}
              className={cn(
                "mb-1 flex items-stretch gap-0.5 rounded-xl transition-colors hover:bg-ink-100 dark:hover:bg-ink-800/70",
                conversationId === c.id && "accent-soft",
              )}
            >
              <button
                type="button"
                onClick={() => {
                  setConversationId(c.id);
                  setHistoryOpen(false);
                }}
                className={cn(
                  "min-w-0 flex-1 px-3 py-2.5 text-left text-[13px]",
                  conversationId === c.id && "font-medium",
                )}
              >
                <p className="truncate">{c.title}</p>
                <p className="mt-0.5 truncate text-[11px] text-muted">
                  {new Date(c.updatedAt).toLocaleString()}
                </p>
              </button>
              <button
                type="button"
                className="m-1 flex h-8 w-8 shrink-0 items-center justify-center self-center rounded-lg text-muted hover:bg-rose-500/10 hover:text-rose-600"
                aria-label={t("common.delete")}
                title={t("common.delete")}
                onClick={(e) => {
                  e.stopPropagation();
                  void deleteConversation(c.id);
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </>
  );

  const sourcesList = (
    <div className="space-y-2">
      {latestCitations.length === 0 ? (
        <p className="text-sm text-muted">{t("chat.sourcesEmpty")}</p>
      ) : (
        latestCitations.map((c, idx) => {
          const pct = scorePercent(c.score);
          const barColor =
            idx % 2 === 0 ? "var(--theme-primary)" : "var(--theme-secondary)";
          return (
            <div
              key={`${c.chunkId}-${idx}`}
              className="rounded-xl border border-border bg-surface-elevated p-3"
            >
              <div className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 shrink-0" style={{ color: barColor }} />
                <span className="truncate font-medium">
                  [{idx + 1}] {c.snippet.slice(0, 36)}
                  {c.snippet.length > 36 ? "…" : ""}
                </span>
                {pct != null ? (
                  <span className="ml-auto text-xs font-semibold" style={{ color: barColor }}>
                    {pct}%
                  </span>
                ) : (
                  <span className="cite-chip ml-auto">[{idx + 1}]</span>
                )}
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted">{c.snippet}</p>
              {pct != null ? (
                <div className="chat-score-track mt-2">
                  <div
                    className="chat-score-fill"
                    style={{ width: `${pct}%`, background: barColor }}
                  />
                </div>
              ) : null}
            </div>
          );
        })
      )}
    </div>
  );

  return (
    <AppPage
      wide
      className={cn(
        "relative flex min-h-0 flex-1 flex-col gap-3 !space-y-0",
        "lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:grid-rows-[minmax(0,1fr)]",
      )}
    >
      {/* History — desktop */}
      <aside className="hidden min-h-0 overflow-hidden rounded-[1.25rem] border border-border bg-surface-elevated shadow-sm lg:flex lg:h-full lg:flex-col">
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

      <div className="chat-stage min-h-0 flex-1">
        <div className="chat-window">
          <div className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-3 sm:px-4">
            <div className="chat-traffic hidden sm:inline-flex" aria-hidden>
              <span className="bg-[#ff5f57]" />
              <span className="bg-[#febc2e]" />
              <span className="bg-[#28c840]" />
            </div>
            <span className="shrink-0 text-sm font-semibold">{t("nav.aiChat")}</span>

            <div className="ml-auto flex h-9 min-w-0 items-center gap-2 overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-9 shrink-0 lg:hidden"
                onClick={() => setHistoryOpen(true)}
              >
                {t("chat.conversations")}
              </Button>
              <select
                className="h-9 min-w-0 max-w-[10rem] shrink rounded-lg border border-border bg-background px-2.5 text-[13px] sm:max-w-[14rem]"
                value={kbId}
                onChange={(e) => setKbId(e.target.value)}
                aria-label={t("chat.selectKb")}
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
              <label className="hidden h-9 shrink-0 cursor-pointer items-center gap-2 rounded-lg px-1 text-xs text-muted md:inline-flex">
                <input
                  type="checkbox"
                  className="size-3.5 rounded border-border"
                  checked={rewrite}
                  onChange={(e) => setRewrite(e.target.checked)}
                />
                {t("chat.rewrite")}
              </label>
              <label className="hidden h-9 shrink-0 cursor-pointer items-center gap-2 rounded-lg px-1 text-xs text-muted md:inline-flex">
                <input
                  type="checkbox"
                  className="size-3.5 rounded border-border"
                  checked={research}
                  onChange={(e) => setResearch(e.target.checked)}
                />
                {t("chat.research")}
              </label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-9 shrink-0 lg:hidden"
                onClick={() => setSourcesOpen(true)}
              >
                {t("chat.sources")}
              </Button>
              {canWrite && kbId ? (
                <Link
                  href={`/app/knowledge-bases/${kbId}`}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "hidden h-9 shrink-0 md:inline-flex",
                  )}
                >
                  <Upload className="h-3.5 w-3.5" />
                  {t("kb.uploadCta")}
                </Link>
              ) : null}
            </div>
          </div>

          <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1.3fr)_minmax(220px,0.7fr)]">
            <div className="flex min-h-0 flex-col">
              <div
                ref={messagesPaneRef}
                className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-3 py-4 sm:px-5 sm:py-5"
              >
                {liveMessages.length === 0 && (
                  <div className="mx-auto flex max-w-md flex-col items-center justify-center px-4 py-10 text-center sm:py-16">
                    <div className="landing-soft-primary mb-4 flex h-12 w-12 items-center justify-center rounded-2xl">
                      <FileText className="h-5 w-5" />
                    </div>
                    <h3 className="font-display text-lg font-semibold tracking-tight">
                      {t("chat.emptyTitle")}
                    </h3>
                    <p className="mt-2 text-sm text-muted">{t("chat.emptyHint")}</p>
                    <p className="mt-3 text-xs text-muted">{t("chat.needDocs")}</p>
                    {canWrite ? (
                      <Link
                        href={kbId ? `/app/knowledge-bases/${kbId}` : "/app/knowledge-bases"}
                        className={cn(buttonVariants({ size: "sm" }), "mt-5 h-9")}
                      >
                        <Upload className="h-3.5 w-3.5" />
                        {kbId ? t("chat.goUpload") : t("nav.knowledgeBases")}
                      </Link>
                    ) : null}
                  </div>
                )}

                {liveMessages.map((m) => (
                  <div
                    key={m.id}
                    className={cn(
                      "flex",
                      m.role === "user" ? "justify-end" : "justify-start",
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[94%] px-4 py-3 text-[15px] leading-relaxed sm:max-w-[88%]",
                        m.role === "user" ? "chat-bubble-user" : "chat-bubble-assistant",
                      )}
                    >
                      <p className="prose-chat">{m.content}</p>
                      {m.role === "assistant" && (m.citations?.length ?? 0) > 0 ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {m.citations!.slice(0, 5).map((c, i) => (
                            <span
                              key={`${c.chunkId}-${i}`}
                              className={cn("cite-chip", i % 2 === 1 && "cite-chip-alt")}
                            >
                              <FileText className="h-3 w-3" />
                              [{i + 1}] {c.snippet.slice(0, 24)}
                              {c.snippet.length > 24 ? "…" : ""}
                            </span>
                          ))}
                          {(m.citations!.length ?? 0) > 5 ? (
                            <button
                              type="button"
                              className="cite-chip hover:opacity-90"
                              onClick={() => setSourcesOpen(true)}
                            >
                              +{m.citations!.length - 5} {t("chat.viewSources")}
                            </button>
                          ) : null}
                        </div>
                      ) : null}
                      {m.role === "assistant" && m.id !== "draft" ? (
                        <div className="mt-2 flex gap-1">
                          <button
                            type="button"
                            className="rounded-md p-1 text-muted hover:bg-ink-100 dark:hover:bg-ink-800/70"
                            onClick={() => void feedback(m.id, "positive")}
                          >
                            <ThumbsUp className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            className="rounded-md p-1 text-muted hover:bg-ink-100 dark:hover:bg-ink-800/70"
                            onClick={() => void feedback(m.id, "negative")}
                          >
                            <ThumbsDown className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>

              <div className="shrink-0 border-t border-border bg-surface-elevated/80 p-3 sm:p-4">
                {error ? <p className="mb-2 text-sm text-rose-600">{error}</p> : null}
                <div className="ask-bar flex min-w-0 items-center gap-2 rounded-xl p-2">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={t("chat.placeholder")}
                    rows={1}
                    className="!min-h-9 max-h-32 min-w-0 flex-1 resize-none border-0 bg-transparent px-2 py-2 text-sm shadow-none focus-visible:ring-0"
                    disabled={!kbId || streaming}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        void send();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    size="sm"
                    className="h-9 w-9 shrink-0 px-0 sm:w-auto sm:gap-1.5 sm:px-3"
                    onClick={() => void send()}
                    disabled={!kbId || streaming || !input.trim()}
                    aria-label={t("chat.send")}
                  >
                    {streaming ? (
                      <span className="px-1">…</span>
                    ) : (
                      <>
                        <ArrowRight className="h-4 w-4" />
                        <span className="hidden sm:inline">{t("chat.send")}</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <aside className="hidden min-h-0 flex-col border-l border-border bg-background/70 lg:flex">
              <div className="flex h-12 shrink-0 items-center justify-between border-b border-border px-4">
                <h3 className="text-sm font-semibold">{t("chat.sources")}</h3>
                {latestCitations.length > 0 ? (
                  <span className="landing-soft-secondary inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold">
                    <Check className="h-3.5 w-3.5" />
                    {latestCitations.length}
                  </span>
                ) : null}
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">{sourcesList}</div>
              {conversationId ? (
                <div className="shrink-0 border-t border-border p-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 w-full text-rose-600"
                    onClick={() => void deleteConversation(conversationId)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {t("common.delete")}
                  </Button>
                </div>
              ) : null}
            </aside>
          </div>
        </div>
      </div>

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
            <div className="flex items-center justify-between border-b border-border px-3 py-3">
              <h3 className="text-sm font-semibold">{t("chat.sources")}</h3>
              <button
                type="button"
                className="text-[11px] font-medium text-muted"
                onClick={() => setSourcesOpen(false)}
              >
                {t("common.cancel")}
              </button>
            </div>
            <div className="max-h-[55dvh] overflow-y-auto p-3">{sourcesList}</div>
            {conversationId ? (
              <div className="shrink-0 border-t border-border p-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 w-full text-rose-600"
                  onClick={() => {
                    setSourcesOpen(false);
                    void deleteConversation(conversationId);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {t("common.delete")}
                </Button>
              </div>
            ) : null}
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
