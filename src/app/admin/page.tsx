import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/Header";
import { LinkForm } from "@/components/LinkForm";
import { LinksList } from "@/components/LinksList";
import { AdminUsers } from "@/components/AdminUsers";
import { createElement } from "react";

export default async function AdminPage(props: {
  searchParams: Promise<{ tab?: string; edit?: string; search?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  if (session.user.role !== "admin") redirect("/dashboard");

  const sp = await props.searchParams;
  const tab = sp.tab || "home";
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
    const row = await prisma.url.findUnique({ where: { id: editId } });
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
    orderBy: { id: "desc" },
    take: 100,
    include: { user: { select: { name: true } } },
  });
  const totalLinks = await prisma.url.count();
  const totalUsers = await prisma.user.count();
  const totalClicks = await prisma.url.aggregate({ _sum: { clicks: true } });
  const clickSum = totalClicks._sum.clicks || 0;

  const users = await prisma.user.findMany({
    orderBy: { id: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      _count: { select: { urls: true } },
    },
  });

  return createElement(
    "div",
    { className: "min-h-screen pb-16" },
    createElement(Header, { title: "ShortLink", isAdmin: true }),
    createElement(
      "main",
      { className: "mx-auto max-w-5xl px-4 py-6" },
      createElement(
        "div",
        { className: "mb-6 flex flex-wrap items-center gap-2" },
        createElement(Link, { href: "/admin?tab=home", className: "rounded-full px-4 py-2 text-sm font-medium" }, "Overview"),
        createElement(Link, { href: "/admin?tab=create", className: "rounded-full px-4 py-2 text-sm font-medium" }, "Create"),
        createElement(Link, { href: "/admin?tab=links", className: "rounded-full px-4 py-2 text-sm font-medium" }, "All Links"),
        createElement(Link, { href: "/admin?tab=users", className: "rounded-full px-4 py-2 text-sm font-medium" }, "Users")
      ),
      tab === "home"
        ? createElement(
            "div",
            { className: "grid grid-cols-2 gap-3 sm:grid-cols-3" },
            createElement("div", { className: "card text-center" },
              createElement("p", { className: "text-2xl font-bold" }, String(totalLinks)),
              createElement("p", { className: "text-xs text-[var(--muted)]" }, "Links")
            ),
            createElement("div", { className: "card text-center" },
              createElement("p", { className: "text-2xl font-bold" }, String(totalUsers)),
              createElement("p", { className: "text-xs text-[var(--muted)]" }, "Users")
            ),
            createElement("div", { className: "card text-center" },
              createElement("p", { className: "text-2xl font-bold" }, String(clickSum)),
              createElement("p", { className: "text-xs text-[var(--muted)]" }, "Total clicks")
            )
          )
        : null,
      tab === "create" ? createElement(LinkForm, { edit: editData }) : null,
      tab === "links"
        ? createElement(LinksList, {
            links: links,
            basePath: "/admin",
            siteUrl: siteUrl,
            showUser: true,
          })
        : null,
      tab === "users"
        ? createElement(AdminUsers, {
            users: users,
            currentUserId: parseInt(session.user.id, 10),
          })
        : null
    )
  );
}
