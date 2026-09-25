"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, createElement, FormEvent } from "react";
import { createUser, deleteUser } from "@/lib/actions";

type UserRow = {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt: Date | string;
  _count: { urls: number };
};

export function AdminUsers(props: {
  users: UserRow[];
  currentUserId: number;
}) {
  const { users, currentUserId } = props;
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  function onCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    start(async () => {
      const res = await createUser(fd);
      if (res.error) {
        setError(res.error);
        return;
      }
      (e.target as HTMLFormElement).reset();
      router.refresh();
    });
  }

  function onDelete(id: number) {
    if (!confirm("Delete this user and all their links?")) return;
    start(async () => {
      const res = await deleteUser(id);
      if (res.error) alert(res.error);
      router.refresh();
    });
  }

  return createElement(
    "div",
    { className: "space-y-6" },
    createElement(
      "form",
      { onSubmit: onCreate, className: "card space-y-3" },
      createElement("h2", { className: "text-lg font-semibold" }, "Add user"),
      error
        ? createElement(
            "div",
            { className: "rounded-xl bg-[var(--err-bg)] px-3 py-2 text-sm text-[var(--err)]" },
            error
          )
        : null,
      createElement(
        "div",
        { className: "grid gap-3 sm:grid-cols-2" },
        createElement(
          "div",
          null,
          createElement("label", { className: "label" }, "Name"),
          createElement("input", { name: "name", className: "input", required: true })
        ),
        createElement(
          "div",
          null,
          createElement("label", { className: "label" }, "Email"),
          createElement("input", {
            name: "email",
            type: "email",
            className: "input",
            required: true,
          })
        ),
        createElement(
          "div",
          null,
          createElement("label", { className: "label" }, "Password"),
          createElement("input", {
            name: "password",
            type: "password",
            className: "input",
            required: true,
          })
        ),
        createElement(
          "div",
          null,
          createElement("label", { className: "label" }, "Role"),
          createElement(
            "select",
            { name: "role", className: "input", defaultValue: "user" },
            createElement("option", { value: "user" }, "User"),
            createElement("option", { value: "admin" }, "Admin")
          )
        )
      ),
      createElement(
        "button",
        { type: "submit", className: "btn-primary", disabled: pending },
        pending ? "Creating..." : "Create user"
      )
    ),
    createElement(
      "div",
      { className: "card overflow-x-auto" },
      createElement("h2", { className: "mb-3 text-lg font-semibold" }, "Users"),
      createElement(
        "table",
        { className: "w-full min-w-[500px] text-left text-sm" },
        createElement(
          "thead",
          null,
          createElement(
            "tr",
            { className: "border-b border-[var(--border)] text-[var(--muted)]" },
            createElement("th", { className: "py-2 pr-2" }, "Name"),
            createElement("th", { className: "py-2 pr-2" }, "Email"),
            createElement("th", { className: "py-2 pr-2" }, "Role"),
            createElement("th", { className: "py-2 pr-2" }, "Links"),
            createElement("th", { className: "py-2" }, "Actions")
          )
        ),
        createElement(
          "tbody",
          null,
          users.map(function (u) {
            return createElement(
              "tr",
              { key: u.id, className: "border-b border-[var(--border)]/50" },
              createElement("td", { className: "py-2 pr-2 font-medium" }, u.name),
              createElement("td", { className: "py-2 pr-2" }, u.email),
              createElement("td", { className: "py-2 pr-2" }, u.role),
              createElement("td", { className: "py-2 pr-2" }, String(u._count.urls)),
              createElement(
                "td",
                { className: "py-2" },
                u.id !== currentUserId
                  ? createElement(
                      "button",
                      {
                        type: "button",
                        className: "text-xs text-[var(--err)]",
                        disabled: pending,
                        onClick: function () {
                          onDelete(u.id);
                        },
                      },
                      "Delete"
                    )
                  : null
              )
            );
          })
        )
      )
    )
  );
}
