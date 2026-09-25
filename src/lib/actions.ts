"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "./auth";
import { prisma } from "./prisma";
import { createUniqueShortCode, normalizeUrl } from "./utils";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

async function requireUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");
  return {
    id: parseInt(session.user.id, 10),
    role: session.user.role || "user",
  };
}

export async function createOrUpdateLink(formData: FormData) {
  const user = await requireUser();
  const longUrlRaw = String(formData.get("long_url") || "").trim();
  const title = String(formData.get("title") || "").trim() || null;
  const description = String(formData.get("description") || "").trim() || null;
  let imageUrl = String(formData.get("image_url") || "").trim() || null;
  const previewEnabled =
    formData.get("preview_enabled") === "on" ||
    formData.get("preview_enabled") === "1";
  const id = parseInt(String(formData.get("id") || "0"), 10);

  if (!longUrlRaw) {
    return { error: "Destination URL required!" };
  }

  const longUrl = normalizeUrl(longUrlRaw);

  const file = formData.get("image_file") as File | null;
  if (file && file.size > 0 && file.size < 5 * 1024 * 1024) {
    const ext = path.extname(file.name).toLowerCase().replace(".", "");
    const allowed = ["jpg", "jpeg", "png", "webp", "gif"];
    if (allowed.includes(ext)) {
      const uploadDir = path.join(process.cwd(), "public", "uploads");
      await mkdir(uploadDir, { recursive: true });
      const newName = `img_${Date.now()}_${Math.random().toString(36).slice(2, 10)}.${ext}`;
      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(path.join(uploadDir, newName), buffer);
      const site =
        process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
      imageUrl = `${site.replace(/\/$/, "")}/uploads/${newName}`;
    }
  }

  try {
    if (id > 0) {
      const existing = await prisma.url.findFirst({
        where: {
          id,
          ...(user.role === "admin" ? {} : { userId: user.id }),
        },
      });
      if (!existing) return { error: "Link not found" };

      await prisma.url.update({
        where: { id },
        data: {
          longUrl,
          title,
          imageUrl,
          description,
          previewEnabled,
        },
      });
      revalidatePath("/dashboard");
      revalidatePath("/admin");
      return { success: true, msg: "updated" };
    }

    const shortCode = await createUniqueShortCode();
    await prisma.url.create({
      data: {
        userId: user.id,
        shortCode,
        longUrl,
        title,
        imageUrl,
        description,
        previewEnabled,
      },
    });
    revalidatePath("/dashboard");
    revalidatePath("/admin");
    return { success: true, msg: "created" };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Database error" };
  }
}

export async function deleteLink(id: number) {
  const user = await requireUser();
  const where =
    user.role === "admin" ? { id } : { id, userId: user.id };

  const existing = await prisma.url.findFirst({ where });
  if (!existing) return { error: "Not found" };

  await prisma.click.deleteMany({ where: { urlId: id } });
  await prisma.url.delete({ where: { id } });
  revalidatePath("/dashboard");
  revalidatePath("/admin");
  return { success: true };
}

export async function createUser(formData: FormData) {
  const user = await requireUser();
  if (user.role !== "admin") return { error: "Forbidden" };

  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const role =
    String(formData.get("role") || "user") === "admin" ? "admin" : "user";

  if (!name || !email || !password) return { error: "All fields required" };

  const bcrypt = await import("bcryptjs");
  const hash = await bcrypt.hash(password, 12);

  try {
    await prisma.user.create({
      data: { name, email, password: hash, role },
    });
    revalidatePath("/admin");
    return { success: true };
  } catch {
    return { error: "Email already exists" };
  }
}

export async function deleteUser(id: number) {
  const user = await requireUser();
  if (user.role !== "admin") return { error: "Forbidden" };
  if (id === user.id) return { error: "Cannot delete yourself" };

  await prisma.user.delete({ where: { id } });
  revalidatePath("/admin");
  return { success: true };
}
