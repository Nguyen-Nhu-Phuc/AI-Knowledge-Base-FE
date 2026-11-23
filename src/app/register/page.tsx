"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api, ApiError } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import type { Organization, User } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthShell } from "@/components/auth-shell";
import { toast } from "@/components/feedback";

export default function RegisterPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const token = useAuthStore((s) => s.accessToken);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const setSession = useAuthStore((s) => s.setSession);
  const setOrganizations = useAuthStore((s) => s.setOrganizations);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (hasHydrated && token) router.replace("/app");
  }, [hasHydrated, token, router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    if (
      password.length < 8 ||
      !/[A-Za-z]/.test(password) ||
      !/\d/.test(password)
    ) {
      setError(t("auth.passwordRule"));
      toast.warn(t("auth.passwordRule"));
      setLoading(false);
      return;
    }
    try {
      const data = await api<{ accessToken: string; user: User }>("/auth/register", {
        method: "POST",
        body: { name, email, password },
        auth: false,
      });
      setSession(data.accessToken, data.user);
      const orgs = await api<Organization[]>("/organizations");
      setOrganizations(orgs);
      toast.success(t("feedback.registerOk"));
      router.replace("/app");
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : t("auth.registrationFailed");
      setError(msg);
      toast.error(t("auth.registrationFailed"), msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title={t("auth.createAccount")} subtitle={t("auth.createAccountSubtitle")}>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium">{t("common.name")}</label>
          <Input required value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">{t("common.email")}</label>
          <Input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">{t("common.password")}</label>
          <Input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("auth.passwordHint")}
          />
        </div>
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <Button className="w-full" disabled={loading}>
          {loading ? t("auth.creating") : t("auth.createAccount")}
        </Button>
      </form>
      <p className="mt-5 text-sm text-muted">
        {t("auth.alreadyHaveAccount")}{" "}
        <Link href="/login" className="font-medium text-accent-700 hover:underline dark:text-accent-300">
          {t("auth.signIn")}
        </Link>
      </p>
    </AuthShell>
  );
}
