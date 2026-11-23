"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  BarChart3,
  Bot,
  ChevronDown,
  CircleHelp,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Moon,
  MoreHorizontal,
  PanelLeft,
  PanelLeftClose,
  Search,
  Settings,
  Shield,
  Sun,
  Users,
  X,
} from "@/components/icons";
import { useTheme } from "next-themes";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/brand-logo";
import { LanguageSwitcher } from "@/components/language-switcher";
import { NotificationsBell } from "@/components/notifications-bell";
import { useThemePrefs } from "@/components/theme-prefs-provider";
import { useMe, useOrganizations } from "@/lib/hooks";
import { hasMinRole } from "@/stores/auth-store";
import { useCurrentOrgRole } from "@/lib/org-role";
import { Badge } from "@/components/ui/badge";
import { confirmDialog, toast } from "@/components/feedback";
import { labelRole } from "@/lib/i18n-labels";

const SIDEBAR_KEY = "akb-sidebar-open";

type NavItem = {
  href: string;
  label: string;
  short: string;
  icon: React.ComponentType<{ className?: string }>;
  minRole?: "admin";
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const { setAppearance } = useThemePrefs();
  const user = useAuthStore((s) => s.user);
  const orgs = useAuthStore((s) => s.organizations);
  const currentOrgId = useAuthStore((s) => s.currentOrgId);
  const setCurrentOrgId = useAuthStore((s) => s.setCurrentOrgId);
  const clearSession = useAuthStore((s) => s.clearSession);
  const { data: me } = useMe();
  const orgRole = useCurrentOrgRole();
  useOrganizations();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarReady, setSidebarReady] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(SIDEBAR_KEY);
      if (raw === "0") setSidebarOpen(false);
      if (raw === "1") setSidebarOpen(true);
    } catch {
      // ignore
    }
    setSidebarReady(true);
  }, []);

  // Page itself must not scroll — only the main column scrolls
  useEffect(() => {
    const html = document.documentElement;
    const prevHtml = html.style.overflow;
    const prevBody = document.body.style.overflow;
    html.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      html.style.overflow = prevHtml;
      document.body.style.overflow = prevBody;
    };
  }, []);

  useEffect(() => {
    setMobileNavOpen(false);
    setUserMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!userMenuOpen) return;
    const onDown = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest?.(
        "[data-user-menu]",
      );
      if (!el) setUserMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setUserMenuOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [userMenuOpen]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileNavOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [mobileNavOpen]);

  function toggleSidebar() {
    setSidebarOpen((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(SIDEBAR_KEY, next ? "1" : "0");
      } catch {
        // ignore
      }
      return next;
    });
  }

  const baseNav: NavItem[] = [
    {
      href: "/app",
      label: t("nav.dashboard"),
      short: t("nav.dashboard"),
      icon: LayoutDashboard,
    },
    {
      href: "/app/knowledge-bases",
      label: t("nav.knowledgeBases"),
      short: t("nav.knowledge"),
      icon: BookOpen,
    },
    {
      href: "/app/chat",
      label: t("nav.aiChat"),
      short: t("nav.ai"),
      icon: MessageSquare,
    },
    { href: "/app/bots", label: t("nav.bots"), short: t("nav.bots"), icon: Bot },
    {
      href: "/app/search",
      label: t("nav.search"),
      short: t("nav.search"),
      icon: Search,
    },
    {
      href: "/app/members",
      label: t("nav.members"),
      short: t("nav.members"),
      icon: Users,
    },
    {
      href: "/app/people",
      label: t("nav.people"),
      short: t("nav.people"),
      icon: Users,
    },
    {
      href: "/app/analytics",
      label: t("nav.analytics"),
      short: t("nav.analytics"),
      icon: BarChart3,
      minRole: "admin",
    },
    {
      href: "/app/connectors",
      label: t("nav.connectors"),
      short: t("nav.connectors"),
      icon: BookOpen,
      minRole: "admin",
    },
    {
      href: "/app/settings",
      label: t("nav.settings"),
      short: t("nav.settings"),
      icon: Settings,
    },
    {
      href: "/app/help",
      label: t("nav.help"),
      short: t("nav.guide"),
      icon: CircleHelp,
    },
  ];

  const items = useMemo(
    () => [
      ...baseNav.filter(
        (item) => !item.minRole || hasMinRole(orgRole, item.minRole),
      ),
      ...(me?.isPlatformAdmin
        ? [
            {
              href: "/app/super-admin",
              label: t("nav.superAdmin"),
              short: t("nav.superAdminShort"),
              icon: Shield,
            } satisfies NavItem,
          ]
        : []),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [orgRole, me?.isPlatformAdmin, t],
  );

  const primaryMobileHrefs = new Set([
    "/app",
    "/app/knowledge-bases",
    "/app/chat",
    "/app/search",
  ]);
  const mobilePrimary = items.filter((i) => primaryMobileHrefs.has(i.href));
  const moreActive = items.some(
    (i) =>
      !primaryMobileHrefs.has(i.href) &&
      (pathname === i.href ||
        (i.href !== "/app" && pathname.startsWith(i.href))),
  );

  async function logout() {
    const ok = await confirmDialog({
      title: t("feedback.logoutTitle"),
      description: t("feedback.logoutDesc"),
      confirmLabel: t("common.logout"),
      danger: true,
    });
    if (!ok) return;
    try {
      await api("/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    clearSession();
    toast.info(t("feedback.logoutOk"));
    router.replace("/login");
  }

  function renderNavLinks(opts: {
    collapsed?: boolean;
    onNavigate?: () => void;
  }) {
    return items.map((item) => {
      const active =
        pathname === item.href ||
        (item.href !== "/app" && pathname.startsWith(item.href));
      const Icon = item.icon;
      return (
        <Link
          key={item.href}
          href={item.href}
          data-active={active}
          title={item.label}
          onClick={opts.onNavigate}
          className={cn(
            "nav-item flex h-10 w-full shrink-0 items-center rounded-lg text-[13px]",
            opts.collapsed ? "justify-center px-2" : "gap-2 px-2.5",
            active
              ? "font-medium"
              : "text-ink-700 hover:bg-ink-100 dark:text-ink-200 dark:hover:bg-ink-800",
          )}
        >
          <Icon className="h-4 w-4 shrink-0 opacity-80" />
          {!opts.collapsed && (
            <span className="min-w-0 flex-1 truncate leading-none">
              {item.label}
            </span>
          )}
        </Link>
      );
    });
  }

  function UserCard({ compact }: { compact?: boolean }) {
    const initial = (user?.name || "?").slice(0, 1).toUpperCase();

    const logoutItem = (
      <button
        type="button"
        role="menuitem"
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-[13px] text-rose-600 hover:bg-ink-100 dark:text-rose-400 dark:hover:bg-ink-800"
        onClick={() => {
          setUserMenuOpen(false);
          void logout();
        }}
      >
        <LogOut className="h-4 w-4 shrink-0" />
        {t("common.logout")}
      </button>
    );

    if (compact) {
      return (
        <div data-user-menu className="relative flex justify-center">
          <button
            type="button"
            title={user?.name || t("common.logout")}
            aria-expanded={userMenuOpen}
            aria-haspopup="menu"
            onClick={() => setUserMenuOpen((v) => !v)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft text-[11px] font-semibold text-accent-soft-fg ring-offset-2 hover:ring-2 hover:ring-border"
          >
            {initial}
          </button>
          {userMenuOpen ? (
            <div
              role="menu"
              className="absolute bottom-full left-1/2 z-[60] mb-2 w-48 -translate-x-1/2 overflow-hidden rounded-xl border border-border bg-surface-elevated shadow-xl"
            >
              <div className="border-b border-border/70 px-3 py-2">
                <p className="truncate text-[12px] font-medium text-foreground">
                  {user?.name}
                </p>
                <p className="truncate text-[10px] text-muted">{user?.email}</p>
              </div>
              {logoutItem}
            </div>
          ) : null}
        </div>
      );
    }

    return (
      <div data-user-menu className="relative">
        <button
          type="button"
          aria-expanded={userMenuOpen}
          aria-haspopup="menu"
          onClick={() => setUserMenuOpen((v) => !v)}
          className="flex w-full items-center gap-2.5 rounded-xl border border-border bg-surface-elevated p-2.5 text-left transition-colors hover:bg-ink-100 dark:hover:bg-ink-800"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-[11px] font-semibold text-accent-soft-fg">
            {initial}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-medium text-foreground">
              {user?.name}
            </span>
            <span className="block truncate text-[11px] text-muted">
              {user?.email}
            </span>
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-muted transition-transform duration-150",
              userMenuOpen && "rotate-180",
            )}
          />
        </button>
        {userMenuOpen ? (
          <div
            role="menu"
            className="absolute bottom-full left-0 right-0 z-[60] mb-1.5 overflow-hidden rounded-xl border border-border bg-surface-elevated shadow-xl"
          >
            {logoutItem}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <>
      {/* fixed inset-0 = full viewport; sidebar never moves when content scrolls */}
      <div className="app-canvas fixed inset-0 z-[1] overflow-hidden pt-[var(--safe-top)] text-foreground">
        <div className="flex h-full w-full min-w-0">
          {/* Desktop sidebar — full viewport height, stays put */}
          <aside
            className={cn(
              "hidden h-full shrink-0 flex-col self-stretch border-r border-border bg-surface transition-[width] duration-200 md:flex",
              sidebarOpen
                ? "w-[var(--app-sidebar-w)]"
                : "w-[var(--app-sidebar-w-collapsed)]",
              !sidebarReady && "invisible",
            )}
          >
            <div
              className={cn(
                "box-border flex h-[var(--app-topbar-h)] shrink-0 items-center border-b border-border",
                sidebarOpen ? "px-4" : "justify-center px-2",
              )}
            >
              <BrandLogo compact={!sidebarOpen} />
            </div>

            <nav
              className={cn(
                "min-h-0 flex-1 space-y-0.5 overflow-y-auto overscroll-contain",
                sidebarOpen ? "px-2.5 py-3" : "px-1.5 py-3",
              )}
            >
              {renderNavLinks({ collapsed: !sidebarOpen })}
            </nav>

            <div
              className={cn(
                "relative z-20 mt-auto shrink-0 overflow-visible border-t border-border bg-surface",
                sidebarOpen ? "p-3" : "p-2",
              )}
            >
              <UserCard compact={!sidebarOpen} />
            </div>
          </aside>

          {/* Main column */}
          <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            <header className="box-border flex h-[var(--app-topbar-h)] shrink-0 items-center overflow-visible border-b border-border bg-surface px-[var(--app-main-pad-x)]">
              <div className="flex h-9 w-full min-w-0 items-center justify-between gap-2 overflow-visible sm:gap-3">
                <div className="flex min-w-0 flex-1 items-center gap-1.5 sm:gap-2.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 shrink-0 md:hidden"
                    onClick={() => setMobileNavOpen(true)}
                    aria-label={t("nav.openMenu")}
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="hidden h-9 w-9 shrink-0 md:inline-flex"
                    onClick={toggleSidebar}
                    aria-label={
                      sidebarOpen
                        ? t("nav.collapseSidebar")
                        : t("nav.expandSidebar")
                    }
                  >
                    {sidebarOpen ? (
                      <PanelLeftClose className="h-4 w-4" />
                    ) : (
                      <PanelLeft className="h-4 w-4" />
                    )}
                  </Button>
                  <select
                    className="h-9 min-w-0 max-w-[50vw] flex-1 rounded-lg border border-border bg-surface-elevated px-2.5 text-[13px] text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring sm:max-w-[280px] sm:flex-none"
                    value={currentOrgId ?? ""}
                    onChange={(e) => setCurrentOrgId(e.target.value || null)}
                  >
                    {orgs.length === 0 && (
                      <option value="">{t("common.noOrganization")}</option>
                    )}
                    {orgs.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name}
                      </option>
                    ))}
                  </select>
                  {orgRole && (
                    <Badge
                      tone="info"
                      className="hidden shrink-0 sm:inline-flex"
                    >
                      {labelRole(t, orgRole)}
                    </Badge>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push("/app/search")}
                    aria-label={t("dashboard.quickSearch")}
                  >
                    <Search className="h-4 w-4" />
                    <span className="hidden sm:inline">
                      {t("dashboard.quickSearch")}
                    </span>
                  </Button>
                  <NotificationsBell />
                  <LanguageSwitcher />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
                    onClick={() =>
                      setAppearance(
                        resolvedTheme === "dark" ? "light" : "dark",
                      )
                    }
                    aria-label={t("common.toggleTheme")}
                  >
                    {resolvedTheme === "dark" ? (
                      <Sun className="h-4 w-4" />
                    ) : (
                      <Moon className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </header>

            <main className="page-enter min-h-0 w-full flex-1 overflow-y-auto overscroll-contain px-[var(--app-main-pad-x)] pb-[calc(var(--mobile-nav-h)+var(--safe-bottom)+1rem)] pt-4 md:pb-8 md:pt-6">
              {children}
            </main>
          </div>
        </div>
      </div>

      {/* Mobile drawer — outside shell flex so it never steals layout slots */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/45"
            aria-label={t("nav.closeMenu")}
            onClick={() => setMobileNavOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex h-full w-[min(88vw,280px)] flex-col border-r border-border bg-surface pt-[var(--safe-top)] shadow-xl">
            <div className="box-border flex h-[var(--app-topbar-h)] shrink-0 items-center justify-between gap-2 border-b border-border px-3">
              <BrandLogo className="min-w-0" />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0"
                onClick={() => setMobileNavOpen(false)}
                aria-label={t("nav.closeMenu")}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <nav className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-2 py-2">
              {renderNavLinks({
                onNavigate: () => setMobileNavOpen(false),
              })}
            </nav>
            <div className="relative z-20 mt-auto shrink-0 overflow-visible border-t border-border/70 p-3 pb-[max(0.75rem,var(--safe-bottom))]">
              <UserCard />
            </div>
          </aside>
        </div>
      )}

      {/* Mobile bottom nav — outside shell flex */}
      <nav className="safe-bottom-nav fixed inset-x-0 bottom-0 z-20 flex border-t border-border bg-surface md:hidden">
        {mobilePrimary.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/app" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex h-[3.25rem] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-medium",
                active ? "accent-soft" : "text-muted",
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="max-w-full truncate leading-none">
                {item.short}
              </span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMobileNavOpen(true)}
          className={cn(
            "flex h-[3.25rem] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-medium",
            moreActive || mobileNavOpen ? "accent-soft" : "text-muted",
          )}
        >
          <MoreHorizontal className="h-5 w-5 shrink-0" />
          <span className="leading-none">{t("nav.more")}</span>
        </button>
      </nav>
    </>
  );
}
