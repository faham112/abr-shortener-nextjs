import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/Header";
import { LinkForm } from "@/components/LinkForm";
import { LinksList } from "@/components/LinksList";
import { createElement } from "react";

export default async function DashboardPage(props: {
  searchParams: Promise<{ tab?: string; edit?: string; search?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  if (session.user.role === "admin") redirect("/admin");

  const userId = parseInt(session.user.id, 10);
  const sp = await props.searchParams;
  const tab = sp.tab || "create";
  const editId = sp.edit ? parseInt(sp.edit, 10) : 0;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  let editData = null as null | {
    id: number;
    longUrl: string;
    title: string | null;
    description: string | null;
    imageUrl: string | null;
    previewEnabled: boolean;
  };
  if (editId > 0) {
    const row = await prisma.url.findFirst({ where: { id: editId, userId } });
    if (row) {
      editData = {
        id: row.id,
        longUrl: row.longUrl,
        title: row.title,
        description: row.description,
        imageUrl: row.imageUrl,
        previewEnabled: row.previewEnabled,
      };
    }
  }

  const links = await prisma.url.findMany({
    where: { userId },
    orderBy: { id: "desc" },
    take: 100,
  });
  const totalLinks = await prisma.url.count({ where: { userId } });
  const totalClicks = await prisma.url.aggregate({
    where: { userId },
    _sum: { clicks: true },
  });
  const clickSum = totalClicks._sum.clicks || 0;

  return createElement(
    "div",
    { className: "min-h-screen pb-16" },
    createElement(Header, { title: "ShortLink" }),
    createElement(
      "main",
      { className: "mx-auto max-w-5xl px-4 py-6" },
      createElement(
        "div",
        { className: "mb-6 flex flex-wrap items-center gap-2" },
        createElement(Link, { href: "/dashboard?tab=create", className: "rounded-full px-4 py-2 text-sm font-medium" }, "Create"),
        createElement(Link, { href: "/dashboard?tab=links", className: "rounded-full px-4 py-2 text-sm font-medium" }, "My Links")
      ),
      createElement(
        "div",
        { className: "mb-6 grid grid-cols-2 gap-3" },
        createElement("div", { className: "card text-center" },
          createElement("p", { className: "text-2xl font-bold" }, String(totalLinks)),
          createElement("p", { className: "text-xs text-[var(--muted)]" }, "Links")
        ),
        createElement("div", { className: "card text-center" },
          createElement("p", { className: "text-2xl font-bold" }, String(clickSum)),
          createElement("p", { className: "text-xs text-[var(--muted)]" }, "Total clicks")
        )
      ),
      tab === "create" ? createElement(LinkForm, { edit: editData }) : null,
      tab === "links"
        ? createElement(LinksList, { links: links, basePath: "/dashboard", siteUrl: siteUrl })
        : null
    )
  );
}
