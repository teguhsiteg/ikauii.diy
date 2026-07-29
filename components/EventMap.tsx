"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Penterjemah Sandi Polyline Google/Strava
const decodePolyline = (str: string, precision = 5) => {
  let index = 0,
    lat = 0,
    lng = 0,
    coordinates: [number, number][] = [];
  let shift = 0,
    result = 0,
    byte = null,
    latitude_change,
    longitude_change,
    factor = Math.pow(10, precision);
  while (index < str.length) {
    byte = null;
    shift = 0;
    result = 0;
    do {
      byte = str.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    latitude_change = result & 1 ? ~(result >> 1) : result >> 1;
    shift = result = 0;
    do {
      byte = str.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    longitude_change = result & 1 ? ~(result >> 1) : result >> 1;
    lat += latitude_change;
    lng += longitude_change;
    coordinates.push([lat / factor, lng / factor]);
  }
  return coordinates;
};

const WaypointIcons: Record<string, string> = {
  start: "🏁",
  finish: "🏁",
  water_station: "💧",
  medic: "🚑",
  cheering: "📣",
  camera: "📸",
  checkpoint: "📍",
};

export default function EventMap({
  polyline,
  waypoints = [],
}: {
  polyline: string;
  waypoints?: any[];
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapInstance = useRef<L.Map | null>(null);

  useEffect(() => {
    // 1. Pastikan div untuk peta sudah siap di layar
    if (!mapRef.current) return;

    // 2. Decode koordinat rute
    const coordinates = decodePolyline(polyline);
    if (coordinates.length === 0) return;

    // 3. JIKA PETA SUDAH ADA (karena Strict Mode), HANCURKAN DULU!
    if (leafletMapInstance.current) {
      leafletMapInstance.current.remove();
      leafletMapInstance.current = null;
    }

    // 4. Bikin Peta Baru yang Bersih
    const map = L.map(mapRef.current, {
      zoomControl: true,
      attributionControl: false,
    });
    leafletMapInstance.current = map;

    // 5. Tambahkan TileLayer (Desain Peta Dasar)
    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
      {
        maxZoom: 19,
      },
    ).addTo(map);

    // 6. Gambar Garis Rute (Bayangan gelap di bawah)
    L.polyline(coordinates, {
      color: "#0B2239",
      weight: 8,
      lineCap: "round",
      lineJoin: "round",
      opacity: 0.3,
    }).addTo(map);

    // 7. Gambar Garis Rute Utama (Biru Terang di atas)
    L.polyline(coordinates, {
      color: "#1A73E8",
      weight: 5,
      lineCap: "round",
      lineJoin: "round",
      opacity: 1,
    }).addTo(map);

    // 8. Pasang Pin Titik Lokasi
    waypoints.forEach((wp) => {
      if (wp.lat && wp.lng) {
        const emoji = WaypointIcons[wp.type] || "📍";

        // Bikin Ikon Kustom
        const customIcon = L.divIcon({
          className: "custom-div-icon",
          html: `<div style="background-color: white; border: 2px solid #0B2239; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-size: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.3); transform: translate(-5px, -5px);">${emoji}</div>`,
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        });

        // Pasang Marker & Popup
        L.marker([parseFloat(wp.lat), parseFloat(wp.lng)], { icon: customIcon })
          .addTo(map)
          .bindPopup(
            `<div style="font-family: sans-serif; font-weight: bold; color: #1e293b; text-align: center;"><div style="font-size: 20px; margin-bottom: 4px;">${emoji}</div><div style="text-transform: uppercase; letter-spacing: 0.1em; font-size: 10px;">${wp.label}</div></div>`,
          );
      }
    });

    // 9. Auto-Zoom (Pas-kan rute ke tengah layar)
    const bounds = L.latLngBounds(coordinates);
    map.fitBounds(bounds, { padding: [40, 40] });

    // 10. CLEANUP FUNGSI (Sangat penting buat Next.js saat ganti halaman)
    return () => {
      if (leafletMapInstance.current) {
        leafletMapInstance.current.remove();
        leafletMapInstance.current = null;
      }
    };
  }, [polyline, waypoints]);

  if (!polyline) return null;

  return (
    <div
      ref={mapRef}
      style={{
        width: "100%",
        height: "100%",
        zIndex: 10,
        background: "#f8fafc",
      }}
      className="leaflet-map-container"
    />
  );
}
