"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { AuthScreen } from "@/components/auth-screen";
import type { UserRole } from "@/lib/models";

const roles: Record<string, UserRole> = { "kost-owner": "kost_owner", "food-merchant": "food_merchant", "errand-provider": "errand_provider" };
export default function RegisterPartnerKindPage() {
  const { kind } = useParams<{ kind: string }>();
  const role = roles[kind];
  if (!role) return <section className="page-wrap py-16 text-center"><h1 className="text-xl font-bold">Jenis kemitraan tidak ditemukan</h1><Link className="button-primary mt-5" href="/mitra/register">Pilih jenis kemitraan</Link></section>;
  return <AuthScreen role={role} mode="register" />;
}
