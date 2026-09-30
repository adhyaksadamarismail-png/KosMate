import { LeafletMap, type MapPoint } from "@/components/leaflet-map";

const demoPoints: MapPoint[] = [
  { id: "mock-kost-1", label: "Kost Putri Melati", latitude: -6.897, longitude: 107.604, address: "Area demo Bandung", isMock: true },
  { id: "mock-kost-2", label: "Kost Senja Residence", latitude: -6.889, longitude: 107.61, address: "Area demo Bandung", isMock: true },
  { id: "mock-kost-3", label: "Kost Putra Nyaman", latitude: -6.881, longitude: 107.616, address: "Area demo Bandung", isMock: true },
];

export function MapPreview({ className = "", points = demoPoints, route = false }: { className?: string; points?: MapPoint[]; route?: boolean }) {
  return <div className={`relative isolate overflow-hidden rounded-2xl border border-emerald-100 ${className}`}>
    <LeafletMap points={points} route={route} className="h-full min-h-[200px]" />
    <span className="pointer-events-none absolute bottom-3 left-3 z-[400] rounded-lg bg-white/95 px-2.5 py-1.5 text-[10px] font-semibold text-slate-600 shadow-sm">Marker dan titik koordinat simulasi</span>
  </div>;
}
