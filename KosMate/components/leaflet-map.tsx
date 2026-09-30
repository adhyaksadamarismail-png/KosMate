"use client";

import { useEffect, useRef } from "react";
import type { Location } from "@/lib/models";

export type MapPoint = Location & { id: string; label: string };

type LeafletMapProps = {
  points: MapPoint[];
  route?: boolean;
  className?: string;
  zoom?: number;
};

// Approximate demo coordinates: the pin placement is illustrative and is not geocoded.
const DEMO_CENTER: [number, number] = [-6.9, 107.61];

export function LeafletMap({ points, route = false, className = "", zoom = 14 }: LeafletMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const pointsKey = JSON.stringify(points ?? []);

  useEffect(() => {
    let disposed = false;
    let resizeObserver: ResizeObserver | undefined;
    let resizeTimer: number | undefined;
    let activeMap: import("leaflet").Map | null = null;
    void (async () => {
      const L = await import("leaflet");
      if (disposed || !containerRef.current) return;
      const parsedPoints: unknown = JSON.parse(pointsKey || "[]");
      const mapPoints = Array.isArray(parsedPoints) ? parsedPoints as MapPoint[] : [];
      const firstPoint = mapPoints[0];
      const center: [number, number] = firstPoint ? [firstPoint.latitude, firstPoint.longitude] : DEMO_CENTER;
      const map = L.map(containerRef.current, { scrollWheelZoom: false, zoomControl: true }).setView(center, zoom);
      activeMap = map;
      mapRef.current = map;
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      const latLngs: [number, number][] = [];
      for (const point of mapPoints) {
        const latLng: [number, number] = [point.latitude, point.longitude];
        latLngs.push(latLng);
        const icon = L.divIcon({
          className: "kosmate-leaflet-pin",
          html: '<span class="kosmate-leaflet-pin-core"></span>',
          iconSize: [28, 36],
          iconAnchor: [14, 34],
        });
        const popup = document.createElement("div");
        popup.textContent = `${point.label} · Lokasi simulasi`;
        L.marker(latLng, { icon }).addTo(map).bindPopup(popup);
      }
      if (route && latLngs.length > 1) {
        const [from, to] = [latLngs[0], latLngs[latLngs.length - 1]];
        const bend = (index: number, offset: number): [number, number] => [from[0] + (to[0] - from[0]) * index + offset, from[1] + (to[1] - from[1]) * index - offset];
        const mockRoadShape: [number, number][] = [from, bend(0.33, 0.0014), bend(0.68, -0.0008), to];
        L.polyline(mockRoadShape, { color: "#087743", weight: 4, opacity: 0.8, dashArray: "8 8" }).addTo(map);
      }
      if (latLngs.length > 1) map.fitBounds(L.latLngBounds(latLngs).pad(0.22));
      const invalidateIfActive = () => {
        if (!disposed && mapRef.current === map && map.getContainer().isConnected) map.invalidateSize();
      };
      resizeObserver = new ResizeObserver(invalidateIfActive);
      resizeObserver.observe(containerRef.current);
      resizeTimer = window.setTimeout(invalidateIfActive, 80);
    })();
    return () => {
      disposed = true;
      if (resizeTimer !== undefined) window.clearTimeout(resizeTimer);
      resizeObserver?.disconnect();
      if (activeMap) {
        if (mapRef.current === activeMap) mapRef.current = null;
        activeMap.remove();
      }
    };
  }, [pointsKey, route, zoom]);

  return <div ref={containerRef} className={`leaflet-map ${className}`} role="img" aria-label="Peta OpenStreetMap simulasi dengan lokasi mock" />;
}
