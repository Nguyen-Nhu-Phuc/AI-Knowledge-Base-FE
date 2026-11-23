"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { api, ApiError } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import type { Organization } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "@/components/feedback";

export default function InviteAcceptPage() {
  const { t } = useTranslation();
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const token = useAuthStore((s) => s.accessToken);
  const setOrganizations = useAuthStore((s) => s.setOrganizations);
  const setCurrentOrgId = useAuthStore((s) => s.setCurrentOrgId);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function accept() {
    if (!token) {
      router.push(`/login?next=/invite/${params.token}`);
      return;
    }
    setStatus("loading");
    setMessage("");
    try {
      const result = await api<{ organizationId: string; role: string }>(
        `/invite-links/${params.token}/accept`,
        { method: "POST" },
      );
      const orgs = await api<Organization[]>("/organizations");
      setOrganizations(orgs);
      if (result.organizationId) setCurrentOrgId(result.organizationId);
      await qc.invalidateQueries({ queryKey: ["organizations"] });
      await qc.invalidateQueries({ queryKey: ["members"] });
      setStatus("done");
      setMessage(t("feedback.inviteAcceptOk"));
      toast.success(t("feedback.inviteAcceptOk"));
      setTimeout(() => router.replace("/app"), 800);
    } catch (err) {
      setStatus("error");
      const msg =
        err instanceof ApiError ? err.message : t("feedback.inviteAcceptFail");
      setMessage(msg);
      toast.error(t("feedback.inviteAcceptFail"), msg);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <Card className="w-full max-w-md space-y-4">
        <h1 className="text-2xl font-semibold">{t("members.inviteTitle")}</h1>
        <p className="text-sm text-slate-500">{t("members.inviteDesc")}</p>
        {!token && (
          <p className="text-sm text-amber-700 dark:text-amber-300">
            {t("members.inviteSignInPrefix")}{" "}
            <Link
              href={`/login?next=/invite/${params.token}`}
              className="underline"
            >
              {t("auth.signIn")}
            </Link>{" "}
            {t("members.inviteSignInSuffix")}
          </p>
        )}
        {message && (
          <p
            className={`text-sm ${
              status === "error" ? "text-rose-600" : "text-emerald-600"
            }`}
          >
            {message}
          </p>
        )}
        <Button onClick={accept} disabled={status === "loading" || status === "done"}>
          {status === "loading"
            ? t("members.inviteAccepting")
            : t("members.inviteAcceptCta")}
        </Button>
      </Card>
    </div>
  );
}
