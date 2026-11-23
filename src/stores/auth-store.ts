"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Organization, OrgRole, User } from "@/lib/types";

type AuthState = {
  accessToken: string | null;
  user: User | null;
  organizations: Organization[];
  currentOrgId: string | null;
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  setSession: (token: string, user: User) => void;
  setUser: (user: User) => void;
  setOrganizations: (orgs: Organization[]) => void;
  setCurrentOrgId: (orgId: string | null) => void;
  clearSession: () => void;
  currentOrg: () => Organization | undefined;
  currentRole: () => OrgRole | undefined;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      user: null,
      organizations: [],
      currentOrgId: null,
      hasHydrated: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),
      setSession: (token, user) =>
        set({ accessToken: token, user, hasHydrated: true }),
      setUser: (user) => set({ user }),
      setOrganizations: (orgs) =>
        set((state) => ({
          organizations: orgs,
          currentOrgId:
            state.currentOrgId && orgs.some((o) => o.id === state.currentOrgId)
              ? state.currentOrgId
              : orgs[0]?.id ?? null,
        })),
      setCurrentOrgId: (orgId) => set({ currentOrgId: orgId }),
      clearSession: () =>
        set({
          accessToken: null,
          user: null,
          organizations: [],
          currentOrgId: null,
          hasHydrated: true,
        }),
      currentOrg: () => {
        const { organizations, currentOrgId } = get();
        return organizations.find((o) => o.id === currentOrgId);
      },
      currentRole: () => get().currentOrg()?.role,
    }),
    {
      name: "akb-auth",
      // Always return a storage object so persist middleware stays enabled on SSR.
      storage: createJSONStorage(() => {
        if (typeof window === "undefined") {
          return {
            getItem: () => null,
            setItem: () => undefined,
            removeItem: () => undefined,
          };
        }
        return window.localStorage;
      }),
      skipHydration: true,
      partialize: (state) => ({
        accessToken: state.accessToken,
        user: state.user,
        organizations: state.organizations,
        currentOrgId: state.currentOrgId,
      }),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.warn("[auth] rehydrate failed", error);
        }
        useAuthStore.setState({ hasHydrated: true });
      },
    },
  ),
);

/** Call once on the client after mount (see Providers). */
export function rehydrateAuthStore() {
  if (typeof window === "undefined") return;
  const persistApi = useAuthStore.persist;
  if (!persistApi) {
    useAuthStore.setState({ hasHydrated: true });
    return;
  }
  if (persistApi.hasHydrated()) {
    useAuthStore.setState({ hasHydrated: true });
    return;
  }
  void persistApi.rehydrate();
}

const ROLE_RANK: Record<OrgRole, number> = {
  viewer: 1,
  member: 2,
  admin: 3,
  owner: 4,
};

/** Mirrors apps/api RolesGuard ranking. */
export function hasMinRole(
  role: OrgRole | undefined | null,
  min: OrgRole,
): boolean {
  if (!role) return false;
  return ROLE_RANK[role] >= ROLE_RANK[min];
}

/** Safe in-app path only (blocks //evil.com open redirects). */
export function safeNextPath(next: string | null | undefined, fallback = "/app") {
  if (!next) return fallback;
  if (!next.startsWith("/")) return fallback;
  if (next.startsWith("//")) return fallback;
  if (next.startsWith("/\\")) return fallback;
  return next;
}
