"use client";

import { useAuthStore } from "@/stores/auth-store";
import type { OrgRole, Organization } from "@/lib/types";
import { hasMinRole } from "@/stores/auth-store";

export function useCurrentOrg(): Organization | undefined {
  const orgs = useAuthStore((s) => s.organizations);
  const orgId = useAuthStore((s) => s.currentOrgId);
  return orgs.find((o) => o.id === orgId);
}

export function useCurrentOrgRole(): OrgRole | undefined {
  return useCurrentOrg()?.role;
}

export function useCanWriteDocs(): boolean {
  return hasMinRole(useCurrentOrgRole(), "member");
}

export function useCanManageMembers(): boolean {
  return hasMinRole(useCurrentOrgRole(), "admin");
}

export function useCanManageKbAdmin(): boolean {
  return hasMinRole(useCurrentOrgRole(), "admin");
}

export function useCanCreateKb(): boolean {
  const org = useCurrentOrg();
  const role = org?.role;
  if (hasMinRole(role, "admin")) return true;
  if (!hasMinRole(role, "member")) return false;
  return org?.settings?.allow_member_create_kb === true;
}

export function useCanViewAnalytics(): boolean {
  return hasMinRole(useCurrentOrgRole(), "admin");
}
