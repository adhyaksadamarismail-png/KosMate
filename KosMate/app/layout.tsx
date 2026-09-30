import type { Metadata } from "next";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { AuthProvider } from "@/lib/auth-context";
import { LocationProvider } from "@/lib/location-context";

export const metadata: Metadata = {
  title: "KosMate — Temukan Kost Nyaman & Layanan Harian",
  description: "Cari kost nyaman dan temukan layanan harian terbaik di sekitar kost Anda bersama KosMate.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body><AuthProvider><LocationProvider><Header /><main>{children}</main><Footer /></LocationProvider></AuthProvider></body></html>;
}
