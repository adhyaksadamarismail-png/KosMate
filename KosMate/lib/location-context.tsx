"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";

export type ActiveLocation = { latitude: number; longitude: number; city: string; address: string; id?: string; isMock: boolean };
type LocationValue = { location: ActiveLocation | null; setLocation: (value: ActiveLocation) => void; locate: () => Promise<void>; ready: boolean };
const KEY = "kosmate.active-location.v1";
const Context = createContext<LocationValue | null>(null);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [location, setCurrent] = useState<ActiveLocation | null>(null);
  const [ready, setReady] = useState(false);
  const setLocation = useCallback((value: ActiveLocation) => {
    setCurrent(value);
    localStorage.setItem(KEY, JSON.stringify(value));
    const supabase = getSupabaseClient();
    if (supabase) void (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;
      const row = { id: value.id ?? `location-${auth.user.id}`, profile_id: auth.user.id, latitude: value.latitude, longitude: value.longitude, city: value.city, address: value.address, is_mock: value.isMock };
      const { error } = await supabase.from("locations").upsert(row);
      if (error) console.error("Lokasi belum tersinkron ke Supabase", error.message);
      else await supabase.from("profiles").update({ active_location_id: row.id }).eq("id", auth.user.id);
    })();
  }, []);
  useEffect(() => {
    try { const stored = localStorage.getItem(KEY); if (stored) setCurrent(JSON.parse(stored) as ActiveLocation); } catch { localStorage.removeItem(KEY); }
    setReady(true);
  }, []);
  const locate = useCallback(() => new Promise<void>((resolve, reject) => {
    if (!navigator.geolocation) { reject(new Error("Perangkat ini tidak menyediakan lokasi. Pilih kota secara manual.")); return; }
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      setLocation({ latitude: coords.latitude, longitude: coords.longitude, city: "Lokasi saya", address: "Lokasi dari perangkat", isMock: false }); resolve();
    }, () => reject(new Error("Izin lokasi tidak tersedia. Pilih kota secara manual.")), { enableHighAccuracy: true, timeout: 10000 });
  }), [setLocation]);
  const value = useMemo(() => ({ location, setLocation, locate, ready }), [location, setLocation, locate, ready]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useActiveLocation() { const value = useContext(Context); if (!value) throw new Error("useActiveLocation must be used inside LocationProvider"); return value; }
