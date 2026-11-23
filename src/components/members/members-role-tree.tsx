"use client";

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, ChevronRight, FolderTree, UserRound, Users } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { labelRole } from "@/lib/i18n-labels";
import type { Member, OrgRole } from "@/lib/types";

const ROLE_ORDER: OrgRole[] = ["owner", "admin", "member", "viewer"];

type Props = {
  orgName?: string;
  members: Member[];
  currentUserId?: string;
  className?: string;
};

export function MembersRoleTree({
  orgName,
  members,
  currentUserId,
  className,
}: Props) {
  const { t } = useTranslation();
  const [openRoles, setOpenRoles] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(ROLE_ORDER.map((r) => [r, true])),
  );
  const [orgOpen, setOrgOpen] = useState(true);

  const grouped = useMemo(() => {
    const map = new Map<OrgRole, Member[]>();
    for (const role of ROLE_ORDER) map.set(role, []);
    for (const m of members) {
      const list = map.get(m.role) ?? [];
      list.push(m);
      map.set(m.role, list);
    }
    for (const role of ROLE_ORDER) {
      map.get(role)?.sort((a, b) =>
        a.user.name.localeCompare(b.user.name, undefined, { sensitivity: "base" }),
      );
    }
    return map;
  }, [members]);

  function toggleRole(role: OrgRole) {
    setOpenRoles((prev) => ({ ...prev, [role]: !prev[role] }));
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2">
        <FolderTree className="h-4 w-4 text-muted" aria-hidden />
        <h3 className="font-medium">{t("members.treeTitle")}</h3>
        <Badge className="ml-auto">{members.length}</Badge>
      </div>
      <p className="text-xs text-muted">{t("members.treeHint")}</p>

      <ul className="mt-2 space-y-0.5 text-sm" role="tree" aria-label={t("members.treeTitle")}>
        <li role="treeitem" aria-expanded={orgOpen}>
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
            onClick={() => setOrgOpen((v) => !v)}
          >
            {orgOpen ? (
              <ChevronDown className="h-4 w-4 shrink-0 text-muted" />
            ) : (
              <ChevronRight className="h-4 w-4 shrink-0 text-muted" />
            )}
            <Users className="h-4 w-4 shrink-0 text-accent-600 dark:text-accent-400" />
            <span className="font-medium">
              {orgName || t("members.treeOrgFallback")}
            </span>
            <span className="text-xs text-muted">
              ({t("members.treePeople", { count: members.length })})
            </span>
          </button>

          {orgOpen && (
            <ul className="ml-4 border-l border-slate-200 pl-3 dark:border-slate-800" role="group">
              {ROLE_ORDER.map((role) => {
                const list = grouped.get(role) ?? [];
                const open = openRoles[role] !== false;
                return (
                  <li key={role} role="treeitem" aria-expanded={open} className="mt-0.5">
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
                      onClick={() => toggleRole(role)}
                    >
                      {open ? (
                        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted" />
                      )}
                      <span className="font-medium">{labelRole(t, role)}</span>
                      <Badge>{list.length}</Badge>
                    </button>

                    {open && (
                      <ul
                        className="ml-4 border-l border-slate-200 pl-3 dark:border-slate-800"
                        role="group"
                      >
                        {list.length === 0 ? (
                          <li className="px-2 py-1.5 text-xs text-muted">
                            {t("members.treeEmptyGroup")}
                          </li>
                        ) : (
                          list.map((m) => {
                            const isSelf = m.user.id === currentUserId;
                            return (
                              <li
                                key={m.id}
                                role="treeitem"
                                className="flex items-center gap-2 rounded-lg px-2 py-1.5"
                              >
                                <UserRound className="h-3.5 w-3.5 shrink-0 text-muted" />
                                <div className="min-w-0 flex-1">
                                  <p className="truncate font-medium">
                                    {m.user.name}
                                    {isSelf ? (
                                      <span className="ml-1 text-xs font-normal text-muted">
                                        ({t("members.treeYou")})
                                      </span>
                                    ) : null}
                                  </p>
                                  <p className="truncate text-xs text-muted">
                                    {m.user.email}
                                  </p>
                                </div>
                              </li>
                            );
                          })
                        )}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </li>
      </ul>
    </div>
  );
}
