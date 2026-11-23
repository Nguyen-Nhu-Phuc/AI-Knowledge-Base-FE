export type OrgRole = "owner" | "admin" | "member" | "viewer";

export type User = {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
  isPlatformAdmin?: boolean;
  emailVerifiedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type Organization = {
  id: string;
  name: string;
  slug: string;
  plan?: string;
  role?: OrgRole;
  joinedAt?: string;
  settings?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
};

export type OrgCreateRequestStatus = "pending" | "approved" | "rejected";

export type OrgCreateRequest = {
  id: string;
  name: string;
  slug: string;
  status: OrgCreateRequestStatus;
  reviewNote?: string | null;
  organizationId?: string | null;
  createdAt: string;
  updatedAt?: string;
  reviewedAt?: string | null;
  requester?: { id: string; email: string; name: string };
};

export type CreateOrganizationResult =
  | {
      status: "pending";
      request: OrgCreateRequest;
    }
  | {
      status: "approved";
      id: string;
      name: string;
      slug: string;
      role?: OrgRole;
      plan?: string;
      settings?: Record<string, unknown>;
      createdAt?: string;
      updatedAt?: string;
      request?: OrgCreateRequest;
    };

export type KnowledgeBase = {
  id: string;
  organizationId: string;
  name: string;
  description?: string | null;
  status: "active" | "archived";
  embeddingModel: string;
  embeddingDimensions: number;
  settings?: Record<string, unknown>;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
};

export type DocumentVersion = {
  id: string;
  versionNumber: number;
  mimeType: string;
  byteSize: number;
  checksumSha256?: string;
  storageKey?: string;
  parseStatus: "pending" | "processing" | "succeeded" | "failed";
  originalFilename?: string | null;
  errorMessage?: string | null;
  createdAt?: string;
  createdBy?: string;
};

export type DocumentTrustStatus = "unverified" | "verified" | "rejected";
export type DocumentKind = "file" | "note";

export type DocumentItem = {
  id: string;
  organizationId: string;
  knowledgeBaseId: string;
  title: string;
  status: "pending" | "processing" | "ready" | "failed";
  kind?: DocumentKind;
  trustStatus?: DocumentTrustStatus;
  verifiedAt?: string | null;
  verifiedBy?: string | null;
  expiresAt?: string | null;
  ownerUserId?: string | null;
  externalAcl?: unknown;
  currentVersionId?: string | null;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  currentVersion?: DocumentVersion | null;
};

export type IngestionJob = {
  id: string;
  documentId: string;
  documentVersionId: string;
  status: "queued" | "running" | "succeeded" | "failed";
  attempts: number;
  errorMessage?: string | null;
  startedAt?: string | null;
  finishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Conversation = {
  id: string;
  knowledgeBaseId: string;
  title: string;
  status: "active" | "archived";
  createdAt: string;
  updatedAt: string;
};

export type Citation = {
  id?: string;
  documentId: string;
  documentVersionId: string;
  chunkId: string;
  snippet: string;
  score?: number | null;
  metadata?: Record<string, unknown>;
};

export type MessageFeedback = {
  id?: string;
  rating: "positive" | "negative";
  reason?: string | null;
  comment?: string | null;
};

export type Message = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
  citations?: Citation[];
  feedback?: MessageFeedback | null;
  tokenIn?: number | null;
  tokenOut?: number | null;
  model?: string | null;
  latencyMs?: number | null;
};

export type SearchHit = {
  chunkId: string;
  documentId: string;
  documentVersionId: string;
  knowledgeBaseId?: string;
  content: string;
  score: number;
  title?: string | null;
  tokenCount?: number;
  metadata?: Record<string, unknown>;
};

export type Member = {
  id: string;
  role: OrgRole;
  joinedAt: string;
  user: {
    id: string;
    email: string;
    name: string;
    avatarUrl?: string | null;
    status: string;
  };
};

export type UsageSummary = {
  totals: {
    requests: number;
    tokensIn: number;
    tokensOut: number;
    latencyMsSum: number;
  };
  byFeature: Array<{
    feature: string;
    _count: number;
    _sum: { tokensIn: number | null; tokensOut: number | null };
  }>;
  byModel: Array<{
    model: string;
    _count: number;
    _sum: { tokensIn: number | null; tokensOut: number | null };
  }>;
  recent: Array<Record<string, unknown>>;
};

export type AnalyticsOverview = {
  usage: UsageSummary;
  documentsByStatus: Array<{ status: string; _count: number }>;
  ingestionJobsByStatus: Array<{ status: string; _count: number }>;
  feedbackByRating: Array<{ rating: string; _count: number }>;
};

export type InviteLinkCreated = {
  id: string;
  role: OrgRole;
  expiresAt: string;
  maxUses: number | null;
  token: string;
  acceptUrl: string;
};

export type PresignUploadResponse = {
  documentId: string;
  versionId: string;
  versionNumber: number;
  title: string;
  uploadUrl: string;
  storageKey: string;
  bucket: string;
  expiresInSeconds: number;
  publicEndpoint: string;
};
