import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export default async function HomePage() {
  let session = null;
  try {
    session = await getServerSession(authOptions);
  } catch (e) {
    console.error("HomePage session error:", e);
    redirect("/login");
  }
  if (!session) redirect("/login");
  if (session.user?.role === "admin") redirect("/admin");
  redirect("/dashboard");
}
