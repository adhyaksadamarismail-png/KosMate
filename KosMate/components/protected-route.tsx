"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import type { LoginRole, UserRole } from "@/lib/models";

export function ProtectedRoute({ role, children }: { role: LoginRole | UserRole | "authenticated"; children: React.ReactNode }) {
  const { user, ready } = useAuth();
  const router = useRouter();
  const expectedPath = role === "partner" ? "/mitra/login" : role === "support" ? "/internal/cs/login" : "/login";
  const hasAccess = role === "authenticated" ? !!user : role === "partner" ? !!user && user.role !== "customer" && user.role !== "support" : !!user && user.role === role;

  useEffect(() => {
    if (ready && !hasAccess) router.replace(expectedPath);
  }, [expectedPath, hasAccess, ready, role, router]);

  if (!ready || !hasAccess) return <div className="page-wrap py-20"><div className="mx-auto max-w-lg rounded-3xl border border-slate-100 bg-white p-8 text-center shadow-card"><h1 className="text-xl font-extrabold">Halaman terbatas</h1><p className="mt-2 text-sm text-slate-500">Masuk untuk melanjutkan ke halaman ini.</p><Link className="button-primary mt-5" href={expectedPath}>Masuk</Link></div></div>;
  return children;
}
