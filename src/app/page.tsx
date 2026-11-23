"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { rehydrateAuthStore, useAuthStore } from "@/stores/auth-store";

export default function HomePage() {
  const { t } = useTranslation();
  const router = useRouter();
  const token = useAuthStore((s) => s.accessToken);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);

  useEffect(() => {
    rehydrateAuthStore();
  }, []);

  useEffect(() => {
    if (!hasHydrated) return;
    router.replace(token ? "/app" : "/login");
  }, [hasHydrated, token, router]);

  return (
    <div className="app-canvas flex min-h-screen items-center justify-center text-sm text-muted">
      {hasHydrated ? t("common.redirecting") : t("common.loading")}
    </div>
  );
}
