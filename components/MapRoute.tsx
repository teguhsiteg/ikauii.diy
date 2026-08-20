"use client";

import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Penterjemah Sandi Polyline Google/Strava
const decodePolyline = (str: string, precision = 5) => {
  let index = 0,
    lat = 0,
    lng = 0;
  const coordinates: [number, number][] = [];
  let shift = 0,
    result = 0,
    byte = null,
    latitude_change,
    longitude_change;
  const factor = Math.pow(10, precision);
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

type Waypoint = {
  lat: number | string;
  lng: number | string;
  type?: string;
  name?: string;
  label?: string;
};

// Fitur Auto-Zoom agar rute pas di tengah layar
function MapFitter({ bounds }: { bounds: L.LatLngBoundsExpression | null }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && (bounds as any).length > 0) {
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [bounds, map]);
  return null;
}

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
  coords,
  polyline,
  waypoints = [],
}: {
  polyline?: string;
  waypoints?: Waypoint[];
  coords?: [number, number][];
  theme?: "light" | "dark";
}) {
  const [isMounted, setIsMounted] = useState(false);
  const [mapKey, setMapKey] = useState("");

  useEffect(() => {
    // 🔥 SOLUSI ANTI-ERROR: Generate Key unik saat pertama kali mount
    // Ini memaksa React membuang div peta lama yang nyangkut di Strict Mode
    setMapKey(Date.now().toString() + Math.random().toString());
    setIsMounted(true);
  }, []);

  if (!isMounted || !mapKey)
    return (
      <div className="w-full h-full bg-slate-100 animate-pulse flex items-center justify-center text-slate-400 font-bold text-xs">
        Memuat Peta...
      </div>
    );
  if (!polyline && !coords) return null;

  const coordinates = coords || (polyline ? decodePolyline(polyline) : []);

  if (coordinates.length === 0) return null;

  // Hitung kotak batas (Bounding Box) rute
  const lats = coordinates.map((c) => c[0]);
  const lngs = coordinates.map((c) => c[1]);
  const bounds: L.LatLngBoundsExpression = [
    [Math.min(...lats), Math.min(...lngs)],
    [Math.max(...lats), Math.max(...lngs)],
  ];

  // Bikin ikon kustom pakai DivIcon biar bisa pake Emoji/Tailwind
  const createCustomIcon = (type: string) => {
    const emoji = WaypointIcons[type] || "📍";
    return L.divIcon({
      className: "custom-div-icon",
      html: `<div style="background-color: white; border: 2px solid #0B2239; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-size: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.3); transform: translate(-5px, -5px);">${emoji}</div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    });
  };

  return (
    <MapContainer
      key={mapKey} // 🔥 INI KUNCI UTAMA SOLUSINYA
      bounds={bounds}
      zoomControl={true}
      attributionControl={false}
      style={{
        width: "100%",
        height: "100%",
        background: "#f8fafc",
        zIndex: 10,
      }}
    >
      <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />

      {/* Garis Rute */}
      <Polyline
        positions={coordinates}
        pathOptions={{
          color: "#1A73E8",
          weight: 6,
          lineCap: "round",
          lineJoin: "round",
          opacity: 0.8,
        }}
      />

      {/* Garis Bayangan Biar Keren */}
      <Polyline
        positions={coordinates}
        pathOptions={{
          color: "#0B2239",
          weight: 2,
          lineCap: "round",
          lineJoin: "round",
          opacity: 1,
        }}
      />

      {/* Titik Lokasi Fasilitas */}
      {waypoints.map((wp, idx) => {
        if (!wp.lat || !wp.lng) return null;
        return (
          <Marker
            key={idx}
            position={[parseFloat(String(wp.lat)), parseFloat(String(wp.lng))]}
            icon={createCustomIcon(wp.type as string)}
          >
            <Popup className="font-sans font-bold text-slate-800 text-center">
              <div className="text-xl mb-1">{WaypointIcons[wp.type as string]}</div>
              <div className="uppercase tracking-widest text-[10px]">
                {wp.label}
              </div>
            </Popup>
          </Marker>
        );
      })}

      <MapFitter bounds={bounds} />
    </MapContainer>
  );
}
