"use client";

import { useEffect, useState } from "react";
import { initialLocalData } from "@/lib/mock-data";
import { kosmateRepository } from "@/lib/local-repository";
import type { LocalData } from "@/lib/models";
import { getSupabaseClient } from "@/lib/supabase/client";
import { hydrateSupabaseData } from "@/lib/supabase/data-sync";

export function useLocalData() {
  const [data, setData] = useState<LocalData>(initialLocalData);
  useEffect(() => {
    const refresh = () => setData(kosmateRepository.read());
    refresh();
    const supabase = getSupabaseClient();
    const hydrate = () => { void hydrateSupabaseData(kosmateRepository.read()).then(setData).catch((error: unknown) => console.error("Gagal memuat data KosMate", error)); };
    if (supabase) {
      hydrate();
      const { data: authListener } = supabase.auth.onAuthStateChange(() => { queueMicrotask(hydrate); });
      window.addEventListener("focus", hydrate);
      window.addEventListener("kosmate:data-updated", hydrate);
      return () => { authListener.subscription.unsubscribe(); window.removeEventListener("focus", hydrate); window.removeEventListener("kosmate:data-updated", hydrate); };
    }
    window.addEventListener("kosmate:data-updated", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("kosmate:data-updated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);
  return [data, setData] as const;
}
