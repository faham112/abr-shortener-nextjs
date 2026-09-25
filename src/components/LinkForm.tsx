"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createOrUpdateLink } from "@/lib/actions";

type EditData = {
  id: number;
  longUrl: string;
  title: string | null;
  description: string | null;
  imageUrl: string | null;
  previewEnabled: boolean;
} | null;

export function LinkForm({ edit }: { edit?: EditData }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await createOrUpdateLink(fd);
      if (res.error) {
        setError(res.error);
        return;
      }
      router.push(
        edit
          ? window.location.pathname.includes("admin")
            ? "/admin?tab=links&msg=updated"
            : "/dashboard?tab=links&msg=updated"
          : window.location.pathname.includes("admin")
            ? "/admin?tab=links&msg=created"
            : "/dashboard?tab=links&msg=created"
      );
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-4" encType="multipart/form-data">
      <h2 className="text-lg font-semibold">
        {edit ? "Edit link" : "Create short link"}
      </h2>
      {error && (
        <div className="rounded-xl bg-[var(--err-bg)] px-3 py-2 text-sm text-[var(--err)]">
          {error}
        </div>
      )}
      {edit && <input type="hidden" name="id" value={edit.id} />}
      <div>
        <label className="label">Destination URL *</label>
        <input
          name="long_url"
          className="input"
          placeholder="https://example.com/page"
          defaultValue={edit?.longUrl || ""}
          required
        />
      </div>
      <div>
        <label className="label">OG Title (optional)</label>
        <input
          name="title"
          className="input"
          placeholder="Breaking News"
          defaultValue={edit?.title || ""}
        />
      </div>
      <div>
        <label className="label">OG Description (optional)</label>
        <textarea
          name="description"
          className="input min-h-[80px] resize-y"
          placeholder="Latest updates..."
          defaultValue={edit?.description || ""}
        />
      </div>
      <div>
        <label className="label">OG Image URL (optional)</label>
        <input
          name="image_url"
          className="input"
          placeholder="https://..."
          defaultValue={edit?.imageUrl || ""}
        />
      </div>
      <div>
        <label className="label">Or upload image</label>
        <input
          type="file"
          name="image_file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="input file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--primary)] file:px-3 file:py-1 file:text-sm file:text-[var(--btn-text)]"
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="preview_enabled"
          defaultChecked={edit ? edit.previewEnabled : true}
          className="h-4 w-4 rounded"
        />
        Enable link preview for bots (WhatsApp, Facebook, etc.)
      </label>
      <button type="submit" className="btn-primary" disabled={pending}>
        {pending ? "Saving…" : edit ? "Update link" : "Create link"}
      </button>
    </form>
  );
}
