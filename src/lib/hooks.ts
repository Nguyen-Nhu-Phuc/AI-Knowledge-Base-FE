"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import type {
  AnalyticsOverview,
  Conversation,
  DocumentItem,
  DocumentVersion,
  IngestionJob,
  KnowledgeBase,
  Member,
  Message,
  OrgRole,
  CreateOrganizationResult,
  Organization,
  OrgCreateRequest,
  SearchHit,
  UsageSummary,
  User,
} from "@/lib/types";

export function useOrgId() {
  return useAuthStore((s) => s.currentOrgId);
}

export function useAccessToken() {
  return useAuthStore((s) => s.accessToken);
}

export function useMe() {
  const token = useAccessToken();
  return useQuery({
    queryKey: ["me"],
    queryFn: () => api<User>("/users/me"),
    enabled: !!token,
  });
}

export function useOrganizations() {
  const token = useAccessToken();
  const setOrganizations = useAuthStore((s) => s.setOrganizations);
  return useQuery({
    queryKey: ["organizations"],
    queryFn: async () => {
      const orgs = await api<Organization[]>("/organizations");
      setOrganizations(orgs);
      return orgs;
    },
    enabled: !!token,
  });
}

export function useKnowledgeBases() {
  const orgId = useOrgId();
  return useQuery({
    queryKey: ["kbs", orgId],
    queryFn: () =>
      api<KnowledgeBase[]>(`/organizations/${orgId}/knowledge-bases`),
    enabled: !!orgId,
  });
}

export function useDocuments(kbId?: string) {
  const orgId = useOrgId();
  return useQuery({
    queryKey: ["documents", orgId, kbId],
    queryFn: () =>
      api<DocumentItem[]>(
        `/organizations/${orgId}/knowledge-bases/${kbId}/documents`,
      ),
    enabled: !!orgId && !!kbId,
    refetchInterval: (query) => {
      const data = query.state.data;
      const busy = data?.some((d) =>
        ["pending", "processing"].includes(d.status),
      );
      return busy ? 3000 : false;
    },
  });
}

export function useDocumentVersions(docId?: string | null) {
  const orgId = useOrgId();
  return useQuery({
    queryKey: ["document-versions", orgId, docId],
    queryFn: () =>
      api<DocumentVersion[]>(
        `/organizations/${orgId}/documents/${docId}/versions`,
      ),
    enabled: !!orgId && !!docId,
  });
}

export function useDocumentJobs(docId?: string | null) {
  const orgId = useOrgId();
  return useQuery({
    queryKey: ["document-jobs", orgId, docId],
    queryFn: () =>
      api<IngestionJob[]>(`/organizations/${orgId}/documents/${docId}/jobs`),
    enabled: !!orgId && !!docId,
    refetchInterval: (query) => {
      const busy = query.state.data?.some((j) =>
        ["queued", "running"].includes(j.status),
      );
      return busy ? 3000 : false;
    },
  });
}

export function useDocumentChunks(
  docId?: string | null,
  docStatus?: string | null,
) {
  const orgId = useOrgId();
  const busy = !!docStatus && ["pending", "processing"].includes(docStatus);
  return useQuery({
    queryKey: ["document-chunks", orgId, docId],
    queryFn: () =>
      api<
        Array<{
          id: string;
          chunkIndex: number;
          content: string;
          tokenCount: number;
          metadata: Record<string, unknown>;
          createdAt: string;
        }>
      >(`/organizations/${orgId}/documents/${docId}/chunks`),
    enabled: !!orgId && !!docId,
    refetchInterval: (query) => {
      if (busy) return 3000;
      const empty = (query.state.data?.length ?? 0) === 0;
      // Keep polling briefly after ready until chunks appear.
      return empty && docStatus === "ready" ? 3000 : false;
    },
  });
}

export function useMembers() {
  const orgId = useOrgId();
  return useQuery({
    queryKey: ["members", orgId],
    queryFn: () => api<Member[]>(`/organizations/${orgId}/members`),
    enabled: !!orgId,
  });
}

export function useConversations() {
  const orgId = useOrgId();
  return useQuery({
    queryKey: ["conversations", orgId],
    queryFn: () =>
      api<Conversation[]>(`/organizations/${orgId}/conversations`),
    enabled: !!orgId,
  });
}

export function useMessages(conversationId?: string | null) {
  const orgId = useOrgId();
  return useQuery({
    queryKey: ["messages", orgId, conversationId],
    queryFn: () =>
      api<Message[]>(
        `/organizations/${orgId}/conversations/${conversationId}/messages`,
      ),
    enabled: !!orgId && !!conversationId,
  });
}

export function useUsage(enabled = true) {
  const orgId = useOrgId();
  return useQuery({
    queryKey: ["usage", orgId],
    queryFn: () => api<UsageSummary>(`/organizations/${orgId}/usage`),
    enabled: !!orgId && enabled,
    retry: false,
  });
}

export function useAnalytics(enabled = true) {
  const orgId = useOrgId();
  return useQuery({
    queryKey: ["analytics", orgId],
    queryFn: () =>
      api<AnalyticsOverview>(`/organizations/${orgId}/analytics/overview`),
    enabled: !!orgId && enabled,
    retry: false,
  });
}

export function useMyOrgCreateRequests() {
  const token = useAccessToken();
  return useQuery({
    queryKey: ["organizations", "create-requests"],
    queryFn: () => api<OrgCreateRequest[]>("/organizations/create-requests"),
    enabled: !!token,
  });
}

export function useCreateOrg() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; slug?: string }) =>
      api<CreateOrganizationResult>("/organizations", {
        method: "POST",
        body,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["organizations"] });
      qc.invalidateQueries({ queryKey: ["organizations", "create-requests"] });
    },
  });
}

export function useCreateKb() {
  const orgId = useOrgId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; description?: string }) =>
      api<KnowledgeBase>(`/organizations/${orgId}/knowledge-bases`, {
        method: "POST",
        body,
        orgId,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["kbs", orgId] }),
  });
}

export function useUpdateKb() {
  const orgId = useOrgId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      kbId,
      ...body
    }: {
      kbId: string;
      name?: string;
      description?: string | null;
      status?: "active" | "archived";
    }) =>
      api<KnowledgeBase>(`/organizations/${orgId}/knowledge-bases/${kbId}`, {
        method: "PATCH",
        body,
        orgId,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["kbs", orgId] }),
  });
}

export function useDeleteKb() {
  const orgId = useOrgId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (kbId: string) =>
      api<{ success: boolean }>(
        `/organizations/${orgId}/knowledge-bases/${kbId}`,
        { method: "DELETE", orgId },
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["kbs", orgId] }),
  });
}

export function useSearch(kbId?: string) {
  const orgId = useOrgId();
  return useMutation({
    mutationFn: (input: string | { query: string; verifiedOnly?: boolean }) => {
      const query = typeof input === "string" ? input : input.query;
      const verifiedOnly =
        typeof input === "string" ? false : Boolean(input.verifiedOnly);
      return api<{ results: SearchHit[]; rewrittenQuery?: string }>(
        `/organizations/${orgId}/knowledge-bases/${kbId}/search`,
        {
          method: "POST",
          body: { query, topK: 10, verifiedOnly },
          orgId,
        },
      );
    },
  });
}

export function useUpdateMemberRole() {
  const orgId = useOrgId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: OrgRole }) =>
      api(`/organizations/${orgId}/members/${userId}`, {
        method: "PATCH",
        orgId,
        body: { role },
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["members", orgId] });
      await qc.invalidateQueries({ queryKey: ["organizations"] });
    },
  });
}

export function useRemoveMember() {
  const orgId = useOrgId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      api(`/organizations/${orgId}/members/${userId}`, {
        method: "DELETE",
        orgId,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["members", orgId] }),
  });
}
