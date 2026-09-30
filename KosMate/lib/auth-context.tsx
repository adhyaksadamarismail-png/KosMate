"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { createId, kosmateRepository } from "@/lib/local-repository";
import type { Account, LoginRole, UserRole } from "@/lib/models";
import { getSupabaseClient } from "@/lib/supabase/client";

type AuthContextValue = {
  user: Omit<Account, "passwordHash" | "passwordSalt"> | null;
  ready: boolean;
  login: (email: string, password: string, role: LoginRole) => Promise<void>;
  register: (input: { name: string; email: string; phone: string; password: string; role: UserRole }) => Promise<void>;
  mockOAuth: (provider: "google" | "apple") => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function digestPassword(password: string, salt: string) {
  const bytes = new TextEncoder().encode(`${salt}:${password}`);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash), (value) => value.toString(16).padStart(2, "0")).join("");
}

function publicAccount(account: Account): Omit<Account, "passwordHash" | "passwordSalt"> {
  const safe: Record<string, unknown> = { ...account };
  delete safe.passwordHash;
  delete safe.passwordSalt;
  return safe as Omit<Account, "passwordHash" | "passwordSalt">;
}

function supabaseAccount(input: { id: string; name?: string | null; email?: string | null; phone?: string | null; role: string; partnerId?: string; createdAt?: string | null }): Omit<Account, "passwordHash" | "passwordSalt"> {
  return { id: input.id, name: input.name ?? "Pengguna KosMate", email: input.email ?? "", phone: input.phone ?? undefined, role: input.role as UserRole, partnerId: input.partnerId, createdAt: input.createdAt ?? new Date().toISOString() };
}

function cacheSupabaseAccount(account: Omit<Account, "passwordHash" | "passwordSalt">) {
  const local = kosmateRepository.read();
  const full: Account = { ...account, passwordSalt: "supabase", passwordHash: "supabase" };
  const partners = account.partnerId && account.role !== "customer" && account.role !== "support"
    ? [...local.partners.filter((item) => item.userId !== account.id), { id: account.partnerId, userId: account.id, type: account.role, displayName: account.name, verified: false, active: true, createdAt: account.createdAt }]
    : local.partners;
  const serviceProviders = account.partnerId && (account.role === "food_merchant" || account.role === "errand_provider")
    ? [...local.serviceProviders.filter((item) => item.userId !== account.id), { id: account.partnerId, userId: account.id, name: account.name, phone: account.phone, area: "Belum diatur", serviceIds: [], products: [], verified: false, active: true }]
    : local.serviceProviders;
  kosmateRepository.write({ ...local, currentUserId: account.id, accounts: [...local.accounts.filter((item) => item.id !== account.id), full], partners, serviceProviders });
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Omit<Account, "passwordHash" | "passwordSalt"> | null>(null);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(() => {
    const data = kosmateRepository.read();
    const account = data.accounts.find((item) => item.id === data.currentUserId);
    setUser(account ? publicAccount(account) : null);
    setReady(true);
  }, []);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) refresh();
    else {
      void supabase.auth.getUser().then(async ({ data }) => {
        if (!data.user) { setUser(null); setReady(true); return; }
        const [{ data: profile }, { data: mitra }] = await Promise.all([
          supabase.from("profiles").select("id,name,email,phone,role,created_at").eq("id", data.user.id).maybeSingle(),
          supabase.from("mitras").select("id,type,status").eq("profile_id", data.user.id).maybeSingle(),
        ]);
        if (profile) { const account = supabaseAccount({ id: profile.id, name: profile.name, email: profile.email, phone: profile.phone, role: mitra?.type ?? profile.role, partnerId: mitra?.id, createdAt: profile.created_at }); setUser(account); cacheSupabaseAccount(account); }
        setReady(true);
      });
      const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!session?.user) { setUser(null); setReady(true); }
      });
      return () => listener.subscription.unsubscribe();
    }
    window.addEventListener("storage", refresh);
    window.addEventListener("kosmate:data-updated", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("kosmate:data-updated", refresh);
    };
  }, [refresh]);

  const login = useCallback(async (email: string, password: string, role: LoginRole) => {
    const supabase = getSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
      if (error || !data.user) throw new Error(error?.message ?? "Email atau kata sandi tidak cocok.");
      const [{ data: profile }, { data: mitra }] = await Promise.all([
        supabase.from("profiles").select("id,name,email,phone,role,created_at").eq("id", data.user.id).maybeSingle(),
        supabase.from("mitras").select("id,type,status").eq("profile_id", data.user.id).maybeSingle(),
      ]);
      if (!profile) throw new Error("Profil belum tersedia. Hubungi CS KosMate.");
      const effectiveRole = mitra?.type ?? profile.role;
      if (role === "partner" && !mitra) throw new Error("Akun ini belum terdaftar sebagai mitra.");
      if (role !== "partner" && role !== effectiveRole) throw new Error("Jenis akun tidak sesuai dengan halaman masuk ini.");
      const account = supabaseAccount({ id: profile.id, name: profile.name, email: profile.email, phone: profile.phone, role: effectiveRole, partnerId: mitra?.id, createdAt: profile.created_at }); setUser(account); cacheSupabaseAccount(account);
      return;
    }
    const data = kosmateRepository.read();
    const account = data.accounts.find((item) => item.email.toLowerCase() === email.trim().toLowerCase() && (role === "partner" ? item.role === "kost_owner" || item.role === "food_merchant" || item.role === "errand_provider" : item.role === role));
    if (!account || account.passwordHash !== await digestPassword(password, account.passwordSalt)) throw new Error("Email atau kata sandi tidak cocok.");
    kosmateRepository.write({ ...data, currentUserId: account.id });
    setUser(publicAccount(account));
  }, []);

  const register = useCallback(async ({ name, email, phone, password, role }: { name: string; email: string; phone: string; password: string; role: UserRole }) => {
    const supabase = getSupabaseClient();
    if (supabase) {
      if (role === "support") throw new Error("Pendaftaran CS tidak tersedia dari halaman publik.");
      const { data, error } = await supabase.auth.signUp({ email: email.trim().toLowerCase(), password, options: { data: { name: name.trim(), phone: phone.trim() } } });
      if (error || !data.user) throw new Error(error?.message ?? "Pendaftaran tidak berhasil.");
      if (!data.session) throw new Error("Akun dibuat. Konfirmasi email terlebih dahulu, lalu masuk.");
      const { error: profileError } = await supabase.from("profiles").upsert({ id: data.user.id, name: name.trim(), email: email.trim().toLowerCase(), phone: phone.trim() || null, role: "customer" });
      if (profileError) throw new Error(profileError.message);
      if (role !== "customer") {
        const mitraId = `mitra-${data.user.id}`;
        const { error: mitraError } = await supabase.from("mitras").upsert({ id: mitraId, profile_id: data.user.id, type: role, status: "pending", display_name: name.trim(), phone: phone.trim() || null });
        if (mitraError) throw new Error(mitraError.message);
        const { error: providerError } = await supabase.from("service_providers").upsert({ id: mitraId, mitra_id: mitraId, name: name.trim(), phone: phone.trim() || null, area: "", service_ids: [], products: [], verified: false, active: true });
        if (role !== "kost_owner" && providerError) throw new Error(providerError.message);
        const { data: profile } = await supabase.from("profiles").select("id,name,email,phone,created_at").eq("id", data.user.id).single();
        setUser(supabaseAccount({ id: data.user.id, name: profile?.name ?? name, email: profile?.email ?? email, phone: profile?.phone ?? phone, role, partnerId: mitraId, createdAt: profile?.created_at }));
      } else {
        const { data: profile } = await supabase.from("profiles").select("id,name,email,phone,created_at").eq("id", data.user.id).single();
        setUser(supabaseAccount({ id: data.user.id, name: profile?.name ?? name, email: profile?.email ?? email, phone: profile?.phone ?? phone, role, createdAt: profile?.created_at }));
      }
      const local = kosmateRepository.read();
      const authUserId = data.user?.id;
      if (!authUserId) throw new Error("Sesi autentikasi belum tersedia. Masuk kembali setelah konfirmasi email.");
      const localAccount: Account = { id: authUserId, name: name.trim(), email: email.trim().toLowerCase(), phone: phone.trim(), role, partnerId: role === "customer" ? undefined : `mitra-${authUserId}`, passwordSalt: "supabase", passwordHash: "supabase", createdAt: new Date().toISOString() };
      const partnerId = localAccount.partnerId;
      kosmateRepository.write({ ...local, currentUserId: localAccount.id, accounts: [...local.accounts.filter((item) => item.id !== localAccount.id), localAccount], partners: role === "customer" ? local.partners : [...local.partners.filter((item) => item.userId !== localAccount.id), { id: partnerId!, userId: localAccount.id, type: role as Exclude<UserRole, "customer" | "support">, displayName: name.trim(), verified: false, active: true, createdAt: localAccount.createdAt }], serviceProviders: role === "customer" || role === "kost_owner" ? local.serviceProviders : [...local.serviceProviders.filter((item) => item.userId !== localAccount.id), { id: partnerId!, userId: localAccount.id, name: name.trim(), phone: phone.trim(), area: "Belum diatur", serviceIds: [], products: [], verified: false, active: true }] });
      return;
    }
    const data = kosmateRepository.read();
    const normalizedEmail = email.trim().toLowerCase();
    if (data.accounts.some((account) => account.email.toLowerCase() === normalizedEmail)) throw new Error("Email ini sudah terdaftar. Silakan masuk.");
    const salt = createId("salt");
    const id = createId(role);
    const account: Account = { id, name: name.trim(), email: normalizedEmail, phone: phone.trim(), role, passwordSalt: salt, passwordHash: await digestPassword(password, salt), createdAt: new Date().toISOString() };
    const next = { ...data, accounts: [...data.accounts, account] };
    if (role === "food_merchant" || role === "errand_provider" || role === "kost_owner") {
      const partnerId = createId("partner");
      account.partnerId = partnerId;
      next.partners = [...next.partners, { id: partnerId, userId: id, type: role, displayName: account.name, verified: false, active: true, createdAt: new Date().toISOString() }];
      if (role === "food_merchant" || role === "errand_provider") next.serviceProviders = [...next.serviceProviders, { id: partnerId, userId: id, name: account.name, phone: account.phone, area: "Bandung", serviceIds: [], products: [], verified: false, active: true }];
      if (role === "food_merchant") next.foodMerchants = [...next.foodMerchants, { id: partnerId, userId: id, slug: account.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || id, name: account.name, photo: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=900&q=80", rating: 0, location: "Lokasi belum diatur", area: "Bandung", estimate: "Belum diatur", available: false, verified: false, menuItemIds: [] }];
    }
    kosmateRepository.write({ ...next, currentUserId: id });
    setUser(publicAccount(account));
  }, []);

  const mockOAuth = useCallback(async (provider: "google" | "apple") => {
    if (getSupabaseClient()) throw new Error(`Login ${provider} membutuhkan konfigurasi OAuth Supabase dan belum diaktifkan.`);
    const data = kosmateRepository.read();
    const email = `${provider}.demo@kosmate.local`;
    let account = data.accounts.find((item) => item.email === email && item.role === "customer");
    if (!account) {
      const salt = createId("oauth-demo-salt");
      account = { id: createId("customer"), name: provider === "google" ? "Customer Demo Google" : "Customer Demo Apple", email, role: "customer", passwordSalt: salt, passwordHash: "mock-oauth-account", createdAt: new Date().toISOString() };
      kosmateRepository.write({ ...data, accounts: [...data.accounts, account], currentUserId: account.id });
    } else {
      kosmateRepository.write({ ...data, currentUserId: account.id });
    }
    setUser(publicAccount(account));
  }, []);

  const logout = useCallback(() => {
    const supabase = getSupabaseClient();
    if (supabase) { void supabase.auth.signOut(); setUser(null); return; }
    const data = kosmateRepository.read();
    kosmateRepository.write({ ...data, currentUserId: undefined });
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, ready, login, register, mockOAuth, logout }), [user, ready, login, register, mockOAuth, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
