"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      router.replace(session.user.role === "admin" ? "/admin" : "/dashboard");
    }
  }, [status, session, router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await signIn("credentials", {
      email: email.trim(),
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("Galat Email ya Password");
      return;
    }
    router.refresh();
  }

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-[var(--muted)]">Loading…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-5">
      <div className="glass w-full max-w-[400px] p-8 sm:p-10">
        <div className="mb-8 text-center">
          <h1 className="text-[28px] font-bold tracking-tight text-[var(--heading)]">
            ShortLink
          </h1>
          <p className="mt-1 text-[15px] text-[var(--muted)]">Sign in to continue</p>
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-[rgba(215,0,21,0.25)] bg-[var(--err-bg)] px-3 py-3 text-center text-sm text-[var(--err)]">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              className="input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div>
            <label className="label">Password</label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                className="input pr-14"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-xs font-semibold text-[var(--muted)]"
                onClick={() => setShowPass((s) => !s)}
              >
                {showPass ? "Hide" : "Show"}
              </button>
            </div>
          </div>
          <button type="submit" className="btn-primary mt-2 w-full" disabled={loading}>
            {loading ? "Signing in…" : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
