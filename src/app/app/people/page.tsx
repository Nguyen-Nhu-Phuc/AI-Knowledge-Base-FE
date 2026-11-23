"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, ApiError } from "@/lib/api";
import { useOrgId } from "@/lib/hooks";
import { useCanManageKbAdmin } from "@/lib/org-role";
import { toast } from "@/components/feedback";
import { AppPage } from "@/components/layout/app-page";

type Entity = {
  id: string;
  name: string;
  type: string;
  _count?: { links: number };
  links?: Array<{
    document?: { id: string; title: string; knowledgeBaseId: string } | null;
  }>;
};

export default function PeoplePage() {
  const { t } = useTranslation();
  const orgId = useOrgId();
  const canAdmin = useCanManageKbAdmin();
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Entity[]>([]);
  const [busy, setBusy] = useState(false);

  async function load(query = q) {
    if (!orgId) return;
    const data = await api<Entity[]>(
      `/organizations/${orgId}/entities${query ? `?q=${encodeURIComponent(query)}` : "?type=person"}`,
      { orgId },
    );
    setItems(data);
  }

  useEffect(() => {
    void load().catch(() => undefined);
  }, [orgId]);

  return (
    <AppPage>
      <div>
        <h1 className="text-xl font-semibold">{t("people.title")}</h1>
        <p className="mt-1 text-sm text-foreground/70">{t("people.hint")}</p>
      </div>

      <Card className="flex flex-wrap gap-2 p-4">
        <Input
          className="min-w-[200px] flex-1"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("people.search")}
          onKeyDown={(e) => e.key === "Enter" && void load()}
        />
        <Button variant="outline" onClick={() => void load()}>
          {t("common.search")}
        </Button>
        {canAdmin && (
          <Button
            disabled={busy}
            onClick={async () => {
              if (!orgId) return;
              setBusy(true);
              try {
                const res = await api<{ people: number; links: number }>(
                  `/organizations/${orgId}/entities/rebuild`,
                  { method: "POST", orgId },
                );
                toast.success(
                  t("people.rebuilt", {
                    people: res.people,
                    links: res.links,
                  }),
                );
                await load("");
              } catch (err) {
                toast.error(
                  t("common.failed"),
                  err instanceof ApiError ? err.message : String(err),
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            {t("people.rebuild")}
          </Button>
        )}
      </Card>

      <Card className="space-y-2 p-4">
        {items.length === 0 && (
          <p className="text-sm text-foreground/60">{t("people.empty")}</p>
        )}
        {items.map((e) => (
          <div key={e.id} className="rounded-md border border-border px-3 py-2 text-sm">
            <p className="font-medium">
              {e.name}{" "}
              <span className="text-xs text-muted">
                {e.type}
                {e._count ? ` · ${e._count.links} links` : ""}
              </span>
            </p>
            {e.links?.length ? (
              <ul className="mt-1 list-disc pl-5 text-xs text-foreground/70">
                {e.links.map((l, i) =>
                  l.document ? (
                    <li key={i}>{l.document.title}</li>
                  ) : null,
                )}
              </ul>
            ) : null}
          </div>
        ))}
      </Card>
    </AppPage>
  );
}
