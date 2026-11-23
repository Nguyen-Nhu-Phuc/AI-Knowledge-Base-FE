import { API_URL, refreshAccessToken } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import type { Citation } from "@/lib/types";

export type ChatStreamHandlers = {
  onConversationCreated?: (conversationId: string) => void;
  onStatus?: (stage: string) => void;
  onDelta?: (text: string) => void;
  onCitations?: (citations: Citation[]) => void;
  onCompleted?: (payload: {
    conversationId: string;
    messageId: string;
    usage?: Record<string, unknown>;
    steps?: unknown;
  }) => void;
  onError?: (message: string) => void;
};

async function openChatStream(
  params: {
    orgId: string;
    kbId: string;
    message: string;
    conversationId?: string | null;
    botId?: string | null;
    research?: boolean;
    rewrite?: boolean;
    signal?: AbortSignal;
  },
  accessToken: string | null,
) {
  return fetch(
    `${API_URL}/organizations/${params.orgId}/knowledge-bases/${params.kbId}/chat`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        "X-Organization-Id": params.orgId,
      },
      body: JSON.stringify({
        message: params.message,
        conversationId: params.conversationId || undefined,
        botId: params.botId || undefined,
        research: params.research || undefined,
        rewrite: params.rewrite || undefined,
      }),
      signal: params.signal,
    },
  );
}

export async function streamChat(params: {
  orgId: string;
  kbId: string;
  message: string;
  conversationId?: string | null;
  botId?: string | null;
  research?: boolean;
  rewrite?: boolean;
  handlers: ChatStreamHandlers;
  signal?: AbortSignal;
}) {
  let token = useAuthStore.getState().accessToken;
  let res = await openChatStream(params, token);

  if (res.status === 401) {
    token = await refreshAccessToken();
    if (!token) {
      useAuthStore.getState().clearSession();
      throw new Error("Session expired. Please sign in again.");
    }
    res = await openChatStream(params, token);
  }

  if (!res.ok || !res.body) {
    let message = `Chat failed (${res.status})`;
    try {
      const err = await res.json();
      if (err.message) message = err.message;
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop() || "";

    for (const part of parts) {
      const lines = part.split("\n");
      let event = "message";
      let data = "";
      for (const line of lines) {
        if (line.startsWith("event:")) event = line.slice(6).trim();
        if (line.startsWith("data:")) data += line.slice(5).trim();
      }
      if (!data) continue;
      const payload = JSON.parse(data) as Record<string, unknown>;

      if (event === "conversation.created") {
        params.handlers.onConversationCreated?.(String(payload.conversationId));
      } else if (event === "status") {
        params.handlers.onStatus?.(String(payload.stage || ""));
      } else if (event === "message.delta") {
        params.handlers.onDelta?.(String(payload.text || ""));
      } else if (event === "message.citations") {
        params.handlers.onCitations?.((payload.citations as Citation[]) || []);
      } else if (event === "message.completed") {
        params.handlers.onCompleted?.(payload as never);
      } else if (event === "error") {
        params.handlers.onError?.(String(payload.message || "Unknown error"));
      }
    }
  }
}
