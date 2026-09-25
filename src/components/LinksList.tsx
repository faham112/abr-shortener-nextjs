"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { deleteLink } from "@/lib/actions";

type UrlRow = {
  id: number;
  shortCode: string;
  longUrl: string;
  title: string | null;
  clicks: number;
  createdAt: Date | string;
  user?: { name: string } | null;
};

export function LinksList({
  links,
  basePath,
  siteUrl,
  showUser = false,
}: {
  links: UrlRow[];
  basePath: string;
  siteUrl: string;
  showUser?: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function onDelete(id: number) {
    if (!confirm("Delete this link and its stats?")) return;
    start(async () => {
      await deleteLink(id);
      router.refresh();
    });
  }

  if (!links.length) {
    return (
      <div className="card text-center text-[var(--muted)]">
        No links yet. Create your first short link.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {links.map((u) => {
        const short = `${siteUrl.replace(/\/$/, "")}/${u.shortCode}`;
        return (
          <div key={u.id} className="card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={short}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-[var(--heading)] hover:underline"
                >
                  /{u.shortCode}
                </a>
                <span className="badge badge-ok">{u.clicks} clicks</span>
                {showUser && u.user && (
                  <span className="text-xs text-[var(--muted)]">by {u.user.name}</span>
                )}
              </div>
              {u.title && (
                <p className="mt-0.5 truncate text-sm font-medium">{u.title}</p>
              )}
              <p className="truncate text-xs text-[var(--muted)]">{u.longUrl}</p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <button
                type="button"
                className="btn-ghost text-xs"
                onClick={() => {
                  navigator.clipboard.writeText(short);
                }}
              >
                Copy
              </button>
              <Link
                href={`${basePath}?tab=create&edit=${u.id}`}
                className="btn-ghost text-xs"
              >
                Edit
              </Link>
              <Link
                href={`${basePath}?stats=${u.id}`}
                className="btn-ghost text-xs"
              >
                Stats
              </Link>
              <button
                type="button"
                className="btn-ghost text-xs text-[var(--err)]"
                disabled={pending}
                onClick={() => onDelete(u.id)}
              >
                Delete
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
