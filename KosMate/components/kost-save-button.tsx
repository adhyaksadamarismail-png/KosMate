"use client";

import { useState } from "react";
import { Bookmark, Check } from "lucide-react";

export function KostSaveButton() {
  const [saved, setSaved] = useState(false);
  return <button className="button-secondary shrink-0" onClick={() => setSaved(!saved)} aria-pressed={saved}><Bookmark size={16} fill={saved ? "currentColor" : "none"} />{saved ? <><Check size={14} />Tersimpan</> : "Simpan"}</button>;
}
