"use client";

import { signOut, useSession } from "next-auth/react";
import Link from "next/link";

export function Header({
  title = "ShortLink",
  isAdmin = false,
}: {
  title?: string;
  isAdmin?: boolean;
}) {
  const { data: session } = useSession();

  return (
    <header
      className="sticky top-0 z-40 border-b border-[var(--border)] px-4 py-3"
      style={{ background: "var(--header-bg)", backdropFilter: "blur(22px)" }}
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={isAdmin ? "/admin" : "/dashboard"} className="text-lg font-bold tracking-tight">
            {title}
          </Link>
          {isAdmin && (
            <span className="badge badge-ok text-[10px] uppercase">Admin</span>
          )}
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="hidden text-[var(--muted)] sm:inline">
            {session?.user?.name || session?.user?.email}
          </span>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="btn-ghost text-[var(--muted)]"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
