"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { rehydrateAuthStore, useAuthStore } from "@/stores/auth-store";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const router = useRouter();
  const token = useAuthStore((s) => s.accessToken);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);

  useEffect(() => {
    rehydrateAuthStore();
  }, []);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!token) router.replace("/login");
  }, [hasHydrated, token, router]);

  if (!hasHydrated) {
    return (
      <div className="app-canvas flex min-h-screen items-center justify-center text-sm text-muted">
        {t("common.loading")}
      </div>
    );
  }

  if (!token) return null;
  return <>{children}</>;
}
