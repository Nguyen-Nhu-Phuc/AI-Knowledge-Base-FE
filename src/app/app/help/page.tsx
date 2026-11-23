"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import {
  BarChart3,
  BookOpen,
  CircleHelp,
  LayoutDashboard,
  MessageSquare,
  Search,
  Settings,
  Users,
} from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { RoleGuide } from "@/components/role-guide";
import { useCurrentOrgRole } from "@/lib/org-role";
import { labelRole } from "@/lib/i18n-labels";
import { AppPage } from "@/components/layout/app-page";

const DEMO_ACCOUNTS = [
  { role: "owner", email: "demo@akb.local" },
  { role: "admin", email: "admin@akb.local" },
  { role: "member", email: "member@akb.local" },
  { role: "viewer", email: "viewer@akb.local" },
] as const;

export default function HelpPage() {
  const { t } = useTranslation();
  const role = useCurrentOrgRole();

  const menus = [
    { href: "/app", icon: LayoutDashboard, label: t("nav.dashboard"), desc: t("help.menu_home") },
    {
      href: "/app/knowledge-bases",
      icon: BookOpen,
      label: t("nav.knowledgeBases"),
      desc: t("help.menu_kb"),
    },
    { href: "/app/chat", icon: MessageSquare, label: t("nav.aiChat"), desc: t("help.menu_chat") },
    { href: "/app/search", icon: Search, label: t("nav.search"), desc: t("help.menu_search") },
    { href: "/app/members", icon: Users, label: t("nav.members"), desc: t("help.menu_members") },
    {
      href: "/app/analytics",
      icon: BarChart3,
      label: t("nav.analytics"),
      desc: t("help.menu_analytics"),
    },
    { href: "/app/settings", icon: Settings, label: t("nav.settings"), desc: t("help.menu_settings") },
    { href: "/app/help", icon: CircleHelp, label: t("nav.help"), desc: t("help.menu_help") },
  ];

  return (
    <AppPage>
      <header>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <h2 className="font-display text-2xl font-semibold tracking-tight">{t("help.title")}</h2>
          {role && <Badge tone="info">{labelRole(t, role)}</Badge>}
        </div>
        <p className="text-sm text-muted">{t("help.subtitle")}</p>
      </header>

      <RoleGuide showGuideLink={false} />

      <section className="surface-panel rounded-2xl p-4 md:p-5">
        <h3 className="mb-3 text-sm font-semibold">{t("help.accounts")}</h3>
        <ul className="divide-y divide-border/60">
          {DEMO_ACCOUNTS.map((a) => (
            <li key={a.email} className="flex items-center justify-between gap-3 py-2.5 text-sm">
              <Badge tone={a.role === "viewer" ? "default" : "info"}>
                {labelRole(t, a.role)}
              </Badge>
              <code className="truncate text-[13px] text-muted">{a.email}</code>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-muted">{t("help.demoPassword")}</p>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-muted">{t("help.menus")}</h3>
        <div className="grid gap-2">
          {menus.map((m) => {
            const Icon = m.icon;
            return (
              <Link
                key={m.href}
                href={m.href}
                className="surface-panel flex items-start gap-3 rounded-xl p-3.5 transition hover:shadow-soft"
              >
                <span className="accent-soft mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{m.label}</p>
                  <p className="mt-0.5 text-xs text-muted">{m.desc}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="surface-panel rounded-2xl p-4 md:p-5">
        <h3 className="mb-3 text-sm font-semibold">{t("help.tips")}</h3>
        <ol className="list-decimal space-y-2 pl-4 text-sm text-ink-700 dark:text-ink-200">
          <li>{t("help.tip1")}</li>
          <li>{t("help.tip2")}</li>
          <li>{t("help.tip3")}</li>
          <li>{t("help.tip4")}</li>
        </ol>
      </section>
    </AppPage>
  );
}
