"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Apple, BadgeCheck, House, LockKeyhole, Mail, UserRound } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import type { LoginRole, UserRole } from "@/lib/models";

export function AuthScreen({ role, mode }: { role: LoginRole | UserRole; mode: "login" | "register" }) {
  const { user, ready, login, register, mockOAuth } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [oauthMessage, setOauthMessage] = useState("");
  const isPartner = role === "partner" || role === "kost_owner" || role === "food_merchant" || role === "errand_provider";
  const roleTitle = role === "kost_owner" ? "Pemilik Kost" : role === "food_merchant" ? "Mitra Makanan" : role === "errand_provider" ? "Jasa Suruh" : role === "support" ? "Customer Service" : isPartner ? "Mitra KosMate" : "Customer";
  const loginRole: LoginRole = isPartner ? "partner" : role;
  const accountRole: UserRole = role === "partner" ? "errand_provider" : role;

  useEffect(() => {
    if (ready && user && (isPartner ? user.role !== "customer" && user.role !== "support" : user.role === role)) router.replace(role === "support" ? "/internal/cs" : isPartner ? "/mitra/dashboard" : "/pesanan");
  }, [isPartner, ready, role, router, user]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "login") await login(email, password, loginRole);
      else await register({ name, email, phone, password, role: accountRole });
      const next = new URLSearchParams(window.location.search).get("next");
      const safeNext = next?.startsWith("/") && !next.startsWith("//") ? next : role === "support" ? "/internal/cs" : isPartner ? mode === "register" ? "/mitra/verifikasi" : "/mitra/dashboard" : "/pesanan";
      router.replace(safeNext);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Tidak dapat memproses permintaan.");
    } finally {
      setBusy(false);
    }
  }

  async function handleMockOAuth(provider: "google" | "apple") {
    setError("");
    setOauthMessage("Provider login berjalan dalam mode simulasi lokal.");
    setBusy(true);
    try {
      await mockOAuth(provider);
      router.replace("/pesanan");
    } catch {
      setError("Login demo belum dapat dimulai. Silakan gunakan email.");
    } finally {
      setBusy(false);
    }
  }

  return <section className="page-wrap py-10 sm:py-16">
    <div className="mx-auto grid max-w-4xl overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-card md:grid-cols-[.88fr_1.12fr]">
      <div className="flex flex-col justify-between bg-emerald-800 p-7 text-white sm:p-9"><Link href="/" className="flex items-center gap-2 text-lg font-extrabold"><span className="grid size-9 place-items-center rounded-xl bg-white/15"><House size={19} /></span>KosMate</Link><div className="py-8"><span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold"><BadgeCheck size={14} /> {isPartner ? roleTitle : role === "support" ? "Akses internal" : "Teman hidup anak kos"}</span><h1 className="mt-5 text-3xl font-black leading-tight">{mode === "login" ? "Selamat datang kembali" : isPartner ? `Daftar sebagai ${roleTitle}` : "Mulai lebih mudah bersama KosMate"}</h1><p className="mt-3 text-sm leading-6 text-emerald-50/80">{isPartner ? `Kelola ${roleTitle.toLowerCase()} kamu dengan KosMate.` : role === "support" ? "Masuk ke dashboard Customer Service KosMate." : "Cari kost nyaman dan pesan layanan harian dengan praktis."}</p></div><p className="text-xs text-emerald-100/70">Prototype lokal KosMate</p></div>
      <div className="p-6 sm:p-9"><div className="mb-6"><p className="text-xs font-bold uppercase tracking-[.15em] text-emerald-700">{role === "support" ? "Akses internal" : isPartner ? "Akun mitra" : "Akun customer"}</p><h2 className="mt-2 text-2xl font-extrabold text-slate-900">{mode === "login" ? "Masuk" : "Daftar"}</h2><p className="mt-1 text-sm text-slate-500">{mode === "login" ? "Masukkan detail akunmu untuk melanjutkan." : "Isi informasi berikut untuk membuat akun."}</p>{role === "support" && <p className="mt-3 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-900">Akun CS demo: <strong>cs@kosmate.local</strong> · kata sandi <strong>kosmate123</strong></p>}</div>
        {role === "customer" && <div className="mb-5 grid gap-2 sm:grid-cols-2"><button type="button" disabled={busy} onClick={() => void handleMockOAuth("apple")} className="button-secondary w-full !py-3"><Apple size={17}/>Continue with Apple</button><button type="button" disabled={busy} onClick={() => void handleMockOAuth("google")} className="button-secondary w-full !py-3"><span className="font-black text-base text-blue-600">G</span>Continue with Google</button><p className="text-center text-xs text-slate-400 sm:col-span-2">Tombol ini hanya membuat sesi mock lokal; OAuth belum dihubungkan.</p></div>}
        {oauthMessage && <p role="status" className="mb-4 text-xs text-emerald-700">{oauthMessage}</p>}
        <form onSubmit={handleSubmit} className="grid gap-4">
          {mode === "register" && <><label className="form-label">Nama lengkap<span className="form-control"><UserRound size={17} /><input required value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder="Nama kamu" /></span></label>{isPartner && <label className="form-label">Nomor telepon<span className="form-control"><UserRound size={17} /><input required value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" placeholder="08xxxxxxxxxx" /></span></label>}</>}
          <label className="form-label">Email<span className="form-control"><Mail size={17} /><input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="nama@email.com" /></span></label>
          <label className="form-label">Kata sandi<span className="form-control"><LockKeyhole size={17} /><input required minLength={8} type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === "login" ? "current-password" : "new-password"} placeholder="Minimal 8 karakter" /></span></label>
          {error && <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2.5 text-sm text-rose-700">{error}</p>}
          <button disabled={busy} className="button-primary mt-1 w-full !py-3 disabled:cursor-wait disabled:opacity-60">{busy ? "Memproses..." : mode === "login" ? role === "customer" ? "Continue with Email" : "Masuk" : role === "customer" ? "Daftar dengan Email" : "Buat akun"}</button>
        </form>
        <p className="mt-5 text-center text-sm text-slate-500">{mode === "login" ? "Belum punya akun?" : "Sudah punya akun?"} <Link className="font-bold text-emerald-800" href={mode === "login" ? isPartner ? "/mitra/register" : "/register" : isPartner ? "/mitra/login" : "/login"}>{mode === "login" ? "Daftar" : "Masuk"}</Link></p>
        <div className="mt-6 border-t border-slate-100 pt-4 text-center text-xs text-slate-500">{isPartner ? "Ingin menggunakan KosMate sebagai customer?" : "Ingin menawarkan kost atau layanan?"} <Link href={isPartner ? "/login" : "/mitra/login"} className="font-bold text-emerald-800">{isPartner ? "Masuk customer" : "Masuk sebagai mitra"}</Link></div>
      </div>
    </div>
  </section>;
}
