"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition, createElement } from "react";
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

export function LinksList(props: {
  links: UrlRow[];
  basePath: string;
  siteUrl: string;
  showUser?: boolean;
}) {
  const { links, basePath, siteUrl, showUser = false } = props;
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
    return createElement(
      "div",
      { className: "card text-center text-[var(--muted)]" },
      "No links yet. Create your first short link."
    );
  }

  return createElement(
    "div",
    { className: "space-y-3" },
    links.map(function (u) {
      const short = siteUrl.replace(/\/$/, "") + "/" + u.shortCode;
      const clickLabel = String(u.clicks) + " clicks";
      return createElement(
        "div",
        {
          key: u.id,
          className:
            "card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
        },
        createElement(
          "div",
          { className: "min-w-0 flex-1" },
          createElement(
            "div",
            { className: "flex flex-wrap items-center gap-2" },
            createElement(
              "a",
              {
                href: short,
                target: "_blank",
                rel: "noreferrer",
                className:
                  "font-semibold text-[var(--heading)] hover:underline",
              },
              "/" + u.shortCode
            ),
            createElement("span", { className: "badge badge-ok" }, clickLabel),
            showUser && u.user
              ? createElement(
                  "span",
                  { className: "text-xs text-[var(--muted)]" },
                  "by " + u.user.name
                )
              : null
          ),
          u.title
            ? createElement(
                "p",
                { className: "mt-0.5 truncate text-sm font-medium" },
                u.title
              )
            : null,
          createElement(
            "p",
            { className: "truncate text-xs text-[var(--muted)]" },
            u.longUrl
          )
        ),
        createElement(
          "div",
          { className: "flex shrink-0 flex-wrap gap-2" },
          createElement(
            "button",
            {
              type: "button",
              className: "btn-ghost text-xs",
              onClick: function () {
                navigator.clipboard.writeText(short);
              },
            },
            "Copy"
          ),
          createElement(
            Link,
            {
              href: basePath + "?tab=create&edit=" + u.id,
              className: "btn-ghost text-xs",
            },
            "Edit"
          ),
          createElement(
            Link,
            {
              href: basePath + "?stats=" + u.id,
              className: "btn-ghost text-xs",
            },
            "Stats"
          ),
          createElement(
            "button",
            {
              type: "button",
              className: "btn-ghost text-xs text-[var(--err)]",
              disabled: pending,
              onClick: function () {
                onDelete(u.id);
              },
            },
            "Delete"
          )
        )
      );
    })
  );
}
