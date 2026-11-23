"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api, ApiError } from "@/lib/api";
import { safeNextPath, useAuthStore } from "@/stores/auth-store";
import type { Organization, User } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthShell } from "@/components/auth-shell";
import { toast } from "@/components/feedback";

function LoginForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useAuthStore((s) => s.accessToken);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const setSession = useAuthStore((s) => s.setSession);
  const setOrganizations = useAuthStore((s) => s.setOrganizations);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!hasHydrated || !token) return;
    router.replace(safeNextPath(searchParams.get("next")));
  }, [hasHydrated, token, router, searchParams]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await api<{ accessToken: string; user: User }>("/auth/login", {
        method: "POST",
        body: { email, password },
        auth: false,
      });
      setSession(data.accessToken, data.user);
      const orgs = await api<Organization[]>("/organizations");
      setOrganizations(orgs);
      toast.success(t("feedback.loginOk"));
      router.replace(safeNextPath(searchParams.get("next")));
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : t("auth.loginFailed");
      setError(msg);
      toast.error(t("auth.loginFailed"), msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title={t("auth.signIn")} subtitle={t("auth.signInSubtitle")}>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium">{t("common.email")}</label>
          <Input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("auth.emailPlaceholder")}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">{t("common.password")}</label>
          <Input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <Button className="w-full" disabled={loading}>
          {loading ? t("auth.signingIn") : t("auth.signIn")}
        </Button>
      </form>
      <p className="mt-5 text-sm text-muted">
        {t("auth.noAccount")}{" "}
        <Link href="/register" className="font-medium text-accent-700 hover:underline dark:text-accent-300">
          {t("auth.register")}
        </Link>
      </p>
    </AuthShell>
  );
}

export default function LoginPage() {
  const { t } = useTranslation();
  return (
    <Suspense
      fallback={
        <div className="app-canvas flex min-h-screen items-center justify-center text-sm text-muted">
          {t("common.loading")}
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
