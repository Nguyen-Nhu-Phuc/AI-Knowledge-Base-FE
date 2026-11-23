import type { TFunction } from "i18next";

const ROLE_KEYS = new Set(["owner", "admin", "member", "viewer"]);
const STATUS_KEYS = new Set([
  "active",
  "archived",
  "ready",
  "pending",
  "processing",
  "failed",
  "queued",
  "running",
  "succeeded",
]);

export function labelRole(t: TFunction, role?: string | null) {
  if (!role) return "—";
  return ROLE_KEYS.has(role) ? t(`roles.${role}`) : role;
}

export function labelStatus(t: TFunction, status?: string | null) {
  if (!status) return "—";
  return STATUS_KEYS.has(status) ? t(`status.${status}`) : status;
}
