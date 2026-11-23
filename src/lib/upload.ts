import { api } from "@/lib/api";
import type { DocumentItem, PresignUploadResponse } from "@/lib/types";

/** Mirrors apps/api/src/common/constants/upload.constants.ts */
export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "text/markdown",
  "text/x-markdown",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/tiff",
] as const;

export const ALLOWED_EXTENSIONS = [
  ".pdf",
  ".docx",
  ".xlsx",
  ".txt",
  ".md",
  ".markdown",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".tif",
  ".tiff",
] as const;
export const DEFAULT_MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

async function sha256Hex(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hash = await crypto.subtle.digest("SHA-256", buffer);
  return [...new Uint8Array(hash)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function guessMime(filename: string): string {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".docx")) {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
  if (lower.endsWith(".xlsx")) {
    return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  }
  if (lower.endsWith(".md") || lower.endsWith(".markdown")) return "text/markdown";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".tif") || lower.endsWith(".tiff")) return "image/tiff";
  return "text/plain";
}

export async function uploadDocument(params: {
  orgId: string;
  kbId: string;
  file: File;
  title?: string;
  /** Upload a new version for an existing document */
  documentId?: string;
}): Promise<DocumentItem> {
  const { orgId, kbId, file, title, documentId } = params;

  if (file.size > DEFAULT_MAX_UPLOAD_BYTES) {
    throw new Error(`File exceeds max size of ${DEFAULT_MAX_UPLOAD_BYTES} bytes`);
  }

  const ext = `.${file.name.split(".").pop()?.toLowerCase() || ""}`;
  if (!(ALLOWED_EXTENSIONS as readonly string[]).includes(ext)) {
    throw new Error(`Unsupported file type. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}`);
  }

  let mimeType = file.type || guessMime(file.name);
  if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(mimeType)) {
    mimeType = guessMime(file.name);
  }

  const presign = await api<PresignUploadResponse>(
    `/organizations/${orgId}/knowledge-bases/${kbId}/documents/upload-url`,
    {
      method: "POST",
      orgId,
      body: {
        filename: file.name,
        mimeType,
        byteSize: file.size,
        title: title || file.name,
        ...(documentId ? { documentId } : {}),
      },
    },
  );

  // Do not set Content-Length — forbidden header; browser derives it from body.
  // Content-Type must match what was signed in the presigned URL.
  const put = await fetch(presign.uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": mimeType,
    },
    body: file,
  });
  if (!put.ok) {
    throw new Error(`Upload to storage failed (${put.status})`);
  }

  const checksum = await sha256Hex(file);

  return api<DocumentItem>(
    `/organizations/${orgId}/knowledge-bases/${kbId}/documents`,
    {
      method: "POST",
      orgId,
      body: {
        title: title || file.name,
        storageKey: presign.storageKey,
        mimeType,
        byteSize: file.size,
        checksum,
        documentId: presign.documentId,
        versionId: presign.versionId,
        originalFilename: file.name,
      },
    },
  );
}
