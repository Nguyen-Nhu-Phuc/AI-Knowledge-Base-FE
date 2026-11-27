"use client";

import { FormEvent, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  useMembers,
  useOrgId,
  useRemoveMember,
  useUpdateMemberRole,
} from "@/lib/hooks";
import { api, ApiError } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import type { InviteLinkCreated, OrgRole } from "@/lib/types";
import { useAuthStore } from "@/stores/auth-store";
import { useCanManageMembers } from "@/lib/org-role";
import { confirmDialog, toast } from "@/components/feedback";
import { labelRole } from "@/lib/i18n-labels";
import { MembersRoleTree } from "@/components/members/members-role-tree";
import { UserAvatar } from "@/components/user-avatar";
import { AppPage } from "@/components/layout/app-page";

const ASSIGNABLE_ROLES: OrgRole[] = ["admin", "member", "viewer"];

export default function MembersPage() {
  const { t } = useTranslation();
  const orgId = useOrgId();
  const qc = useQueryClient();
  const me = useAuthStore((s) => s.user);
  const setOrganizations = useAuthStore((s) => s.setOrganizations);
  const orgs = useAuthStore((s) => s.organizations);
  const currentOrg = orgs.find((o) => o.id === orgId);
  const canManage = useCanManageMembers();
  const { data: members, isLoading } = useMembers();

  const updateRole = useUpdateMemberRole();
  const removeMember = useRemoveMember();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<OrgRole>("member");
  const [inviteUrl, setInviteUrl] = useState("");
  const [error, setError] = useState("");

  async function addMember(e: FormEvent) {
    e.preventDefault();
    if (!orgId) return;
    const ok = await confirmDialog({
      title: t("feedback.addMemberTitle"),
      description: t("feedback.addMemberDesc", {
        email,
        role: labelRole(t, role),
      }),
      confirmLabel: t("members.addCta"),
    });
    if (!ok) return;
    setError("");
    try {
      await api(`/organizations/${orgId}/members`, {
        method: "POST",
        orgId,
        body: { email, role },
      });
      setEmail("");
      await qc.invalidateQueries({ queryKey: ["members", orgId] });
      toast.success(t("feedback.memberAddOk"));
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : t("common.failed");
      setError(msg);
      toast.error(t("common.failed"), msg);
    }
  }

  async function createInviteLink() {
    if (!orgId) return;
    const ok = await confirmDialog({
      title: t("feedback.inviteLinkTitle"),
      description: t("feedback.inviteLinkDesc", {
        role: labelRole(t, role),
      }),
      confirmLabel: t("members.inviteLink"),
    });
    if (!ok) return;
    setError("");
    try {
      const data = await api<InviteLinkCreated>(
        `/organizations/${orgId}/invite-links`,
        {
          method: "POST",
          orgId,
          body: { role, expiresInDays: 7 },
        },
      );
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      setInviteUrl(`${origin}/invite/${data.token}`);
      toast.success(t("feedback.inviteOk"));
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : t("common.failed");
      setError(msg);
      toast.error(t("common.failed"), msg);
    }
  }

  return (
    <AppPage>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">
          {t("nav.members")}
        </p>
        <h2 className="font-display mt-2 text-3xl font-semibold tracking-tight">
          {t("members.title")}
        </h2>
        <p className="mt-1.5 max-w-2xl text-sm text-muted">{t("members.subtitle")}</p>
      </div>

      {error && (
        <Card>
          <p className="text-sm text-rose-600">{error}</p>
        </Card>
      )}

      {canManage ? (
        <Card>
          <h3 className="font-medium">{t("members.addMember")}</h3>
          <form onSubmit={addMember} className="mt-4 grid gap-3 md:grid-cols-4">
            <Input
              type="email"
              placeholder={t("members.emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <select
              className="h-10 rounded-md border border-slate-300 bg-transparent px-3 text-sm dark:border-slate-700"
              value={role}
              onChange={(e) => setRole(e.target.value as OrgRole)}
            >
              {ASSIGNABLE_ROLES.map((r) => (
                <option key={r} value={r}>
                  {labelRole(t, r)}
                </option>
              ))}
            </select>
            <Button type="submit">{t("members.addCta")}</Button>
            <Button type="button" variant="outline" onClick={createInviteLink}>
              {t("members.inviteLink")}
            </Button>
          </form>
          {inviteUrl && (
            <p className="mt-3 break-all text-xs text-sky-700 dark:text-sky-300">
              {inviteUrl}
            </p>
          )}
        </Card>
      ) : (
        <Card>
          <p className="text-sm text-slate-500">{t("members.manageForbidden")}</p>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(260px,320px)_1fr]">
        <Card>
          {isLoading ? (
            <p className="text-sm text-slate-500">{t("members.loading")}</p>
          ) : (
            <MembersRoleTree
              orgName={currentOrg?.name}
              members={members ?? []}
              currentUserId={me?.id}
            />
          )}
        </Card>

        <Card>
          <h3 className="mb-3 font-medium">{t("members.listTitle")}</h3>
          {isLoading ? (
            <p className="text-sm text-slate-500">{t("members.loading")}</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-slate-500 dark:border-slate-800">
                <tr>
                  <th className="py-2">{t("common.name")}</th>
                  <th className="py-2">{t("common.email")}</th>
                  <th className="py-2">{t("members.role")}</th>
                  <th className="py-2">{t("members.joined")}</th>
                  <th className="py-2 text-right">{t("common.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {members?.map((m) => {
                  const isSelf = m.user.id === me?.id;
                  const isOwner = m.role === "owner";
                  return (
                    <tr
                      key={m.id}
                      className="border-b border-slate-100 dark:border-slate-900"
                    >
                      <td className="py-3">
                        <div className="flex items-center gap-2.5">
                          <UserAvatar
                            name={m.user.name}
                            avatarUrl={m.user.avatarUrl}
                            className="h-8 w-8 text-[11px]"
                          />
                          <span className="font-medium">{m.user.name}</span>
                        </div>
                      </td>
                      <td className="py-3">{m.user.email}</td>
                      <td className="py-3">
                        {isOwner || isSelf || !canManage ? (
                          <Badge>{labelRole(t, m.role)}</Badge>
                        ) : (
                          <select
                            className="h-8 rounded-md border border-slate-300 bg-transparent px-2 text-xs dark:border-slate-700"
                            value={m.role}
                            disabled={updateRole.isPending}
                            onChange={(e) => {
                              const nextRole = e.target.value as OrgRole;
                              const prevRole = m.role;
                              if (nextRole === prevRole) return;
                              void (async () => {
                                const ok = await confirmDialog({
                                  title: t("feedback.roleChangeTitle"),
                                  description: t("feedback.roleChangeDesc", {
                                    name: m.user.name,
                                    from: labelRole(t, prevRole),
                                    to: labelRole(t, nextRole),
                                  }),
                                  confirmLabel: t("feedback.confirm"),
                                });
                                if (!ok) {
                                  e.target.value = prevRole;
                                  return;
                                }
                                updateRole.mutate(
                                  { userId: m.user.id, role: nextRole },
                                  {
                                    onSuccess: () => {
                                      toast.success(t("feedback.roleOk"));
                                      if (m.user.id === me?.id && orgId) {
                                        setOrganizations(
                                          orgs.map((o) =>
                                            o.id === orgId
                                              ? { ...o, role: nextRole }
                                              : o,
                                          ),
                                        );
                                      }
                                    },
                                    onError: (err) => {
                                      e.target.value = prevRole;
                                      const msg =
                                        err instanceof Error
                                          ? err.message
                                          : t("common.failed");
                                      setError(msg);
                                      toast.error(t("common.failed"), msg);
                                    },
                                  },
                                );
                              })();
                            }}
                          >
                            {ASSIGNABLE_ROLES.map((r) => (
                              <option key={r} value={r}>
                                {labelRole(t, r)}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td className="py-3 text-slate-500">
                        {formatDate(m.joinedAt)}
                      </td>
                      <td className="py-3 text-right">
                        {canManage && !isOwner && !isSelf && (
                          <Button
                            size="sm"
                            variant="danger"
                            disabled={removeMember.isPending}
                            onClick={async () => {
                              const ok = await confirmDialog({
                                title: t("feedback.memberRemoveTitle"),
                                description: `${t("feedback.memberRemoveDesc")} (${m.user.email})`,
                                confirmLabel: t("common.delete"),
                                danger: true,
                              });
                              if (!ok) return;
                              removeMember.mutate(m.user.id, {
                                onSuccess: () =>
                                  toast.success(t("feedback.memberRemoveOk")),
                                onError: (err) => {
                                  const msg =
                                    err instanceof Error
                                      ? err.message
                                      : t("common.failed");
                                  setError(msg);
                                  toast.error(t("common.failed"), msg);
                                },
                              });
                            }}
                          >
                            {t("members.remove")}
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </AppPage>
  );
}
