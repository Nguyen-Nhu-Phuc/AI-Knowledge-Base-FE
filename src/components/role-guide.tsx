"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { BookOpen, Check, CircleHelp, MessageSquare, Search, X } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import {
  useCanCreateKb,
  useCanManageMembers,
  useCanViewAnalytics,
  useCanWriteDocs,
  useCurrentOrgRole,
} from "@/lib/org-role";
import { hasMinRole } from "@/stores/auth-store";
import { labelRole } from "@/lib/i18n-labels";

function CapRow({
  label,
  ok,
  maybe,
}: {
  label: string;
  ok: boolean;
  maybe?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <li className="flex items-center justify-between gap-3 text-[13px]">
      <span className="text-ink-700 dark:text-ink-200">{label}</span>
      {maybe ? (
        <span className="text-[11px] font-medium text-amber-700 dark:text-amber-300">
          {t("dashboard.cap_maybe")}
        </span>
      ) : ok ? (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
          <Check className="h-3.5 w-3.5" />
          {t("dashboard.cap_yes")}
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted">
          <X className="h-3.5 w-3.5" />
          {t("dashboard.cap_no")}
        </span>
      )}
    </li>
  );
}

export function RoleGuide({ showGuideLink = true }: { showGuideLink?: boolean }) {
  const { t } = useTranslation();
  const role = useCurrentOrgRole();
  const canWrite = useCanWriteDocs();
  const canCreateKb = useCanCreateKb();
  const canMembers = useCanManageMembers();
  const canAnalytics = useCanViewAnalytics();
  const canDeleteOrg = hasMinRole(role, "owner");
  const createKbMaybe =
    hasMinRole(role, "member") && !hasMinRole(role, "admin") && !canCreateKb;

  if (!role) return null;

  return (
    <section className="surface-panel rounded-2xl p-4 md:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold">{t("dashboard.yourRole")}</p>
          <Badge tone="info">{labelRole(t, role)}</Badge>
        </div>
        {showGuideLink && (
          <Link
            href="/app/help"
            className="inline-flex items-center gap-1 text-xs font-semibold text-accent-700 hover:underline dark:text-accent-300"
          >
            <CircleHelp className="h-3.5 w-3.5" />
            {t("dashboard.openGuide")}
          </Link>
        )}
      </div>

      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">
        {t("dashboard.youCan")}
      </p>
      <ul className="space-y-2">
        <CapRow label={t("dashboard.cap_ask")} ok />
        <CapRow label={t("dashboard.cap_upload")} ok={canWrite} />
        <CapRow
          label={t("dashboard.cap_createKb")}
          ok={canCreateKb}
          maybe={createKbMaybe}
        />
        <CapRow label={t("dashboard.cap_members")} ok={canMembers} />
        <CapRow label={t("dashboard.cap_analytics")} ok={canAnalytics} />
        <CapRow label={t("dashboard.cap_deleteOrg")} ok={canDeleteOrg} />
      </ul>
    </section>
  );
}

export function HowToSteps() {
  const { t } = useTranslation();
  const steps = [
    {
      href: "/app/knowledge-bases",
      icon: BookOpen,
      title: t("dashboard.step1"),
      desc: t("dashboard.step1Desc"),
    },
    {
      href: "/app/search",
      icon: Search,
      title: t("dashboard.step2"),
      desc: t("dashboard.step2Desc"),
    },
    {
      href: "/app/chat",
      icon: MessageSquare,
      title: t("dashboard.step3"),
      desc: t("dashboard.step3Desc"),
    },
  ];

  return (
    <section>
      <h3 className="mb-3 text-sm font-semibold text-muted">{t("dashboard.stepsTitle")}</h3>
      <div className="grid gap-3 sm:grid-cols-3">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <Link
              key={step.href}
              href={step.href}
              className="surface-panel rounded-2xl p-4 transition hover:shadow-soft"
            >
              <span className="accent-soft mb-3 flex h-9 w-9 items-center justify-center rounded-xl">
                <Icon className="h-4 w-4" />
              </span>
              <p className="text-sm font-medium">{step.title}</p>
              <p className="mt-1 text-xs text-muted">{step.desc}</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
