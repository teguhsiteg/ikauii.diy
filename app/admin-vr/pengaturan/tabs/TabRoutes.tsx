import React from "react";
import { toast } from "@/lib/toast";

// 🔥 MESIN RAHASIA: ENCODER KOORDINAT KE POLYLINE
const encodePolyline = (coordinates: [number, number][]) => {
  let result = "";
  let prevLat = 0;
  let prevLng = 0;

  for (let i = 0; i < coordinates.length; i++) {
    const lat = Math.round(coordinates[i][0] * 1e5);
    const lng = Math.round(coordinates[i][1] * 1e5);

    const dLat = lat - prevLat;
    const dLng = lng - prevLng;

    prevLat = lat;
    prevLng = lng;

    const encodeNumber = (num: number) => {
      let sgnNum = num << 1;
      if (num < 0) sgnNum = ~sgnNum;
      let encoded = "";
      while (sgnNum >= 0x20) {
        encoded += String.fromCharCode((0x20 | (sgnNum & 0x1f)) + 63);
        sgnNum >>= 5;
      }
      encoded += String.fromCharCode(sgnNum + 63);
      return encoded;
    };

    result += encodeNumber(dLat) + encodeNumber(dLng);
  }
  return result;
};

export default function TabRoutes({ vrSettings, handlePackageChange }: any) {
  // 🔥 FUNGSI SAKTI: BACA FILE GPX LALU JADIKAN POLYLINE
  const handleGpxUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    pkgId: string,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, "text/xml");

        // Cari tag <trkpt> (Track Point) di file GPX
        const trkpts = xmlDoc.getElementsByTagName("trkpt");
        const coords: [number, number][] = [];

        for (let i = 0; i < trkpts.length; i++) {
          const lat = parseFloat(trkpts[i].getAttribute("lat") || "0");
          const lon = parseFloat(trkpts[i].getAttribute("lon") || "0");
          coords.push([lat, lon]);
        }

        if (coords.length > 0) {
          const encodedStr = encodePolyline(coords);
          // Langsung tembak ke inputan polyline
          handlePackageChange("offline", pkgId, "polyline", encodedStr);
          toast.success(`Berhasil! ${coords.length} titik koordinat diekstrak dari GPX.`);
        } else {
          toast.error("Gagal: Tidak ada data rute/track point dalam file GPX ini.");
        }
      } catch (error) {
        console.error(error);
        toast.error("File GPX rusak atau format tidak sesuai.");
      }
    };
    reader.readAsText(file);
    // Reset input file biar bisa upload file yang sama lagi kalau error
    e.target.value = "";
  };

  const addWaypoint = (pkgId: string, currentWaypoints: any[] = []) => {
    const newWp = {
      id: Date.now().toString(),
      type: "water_station",
      label: "",
      lat: "",
      lng: "",
    };
    handlePackageChange("offline", pkgId, "waypoints", [
      ...currentWaypoints,
      newWp,
    ]);
  };

  const updateWaypoint = (
    pkgId: string,
    currentWaypoints: any[],
    wpId: string,
    field: string,
    value: string,
  ) => {
    const updated = currentWaypoints.map((wp) =>
      wp.id === wpId ? { ...wp, [field]: value } : wp,
    );
    handlePackageChange("offline", pkgId, "waypoints", updated);
  };

  const removeWaypoint = (
    pkgId: string,
    currentWaypoints: any[],
    wpId: string,
  ) => {
    const updated = currentWaypoints.filter((wp) => wp.id !== wpId);
    handlePackageChange("offline", pkgId, "waypoints", updated);
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 border-slate-200 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="lg:col-span-4">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <svg
            className="w-5 h-5 text-indigo-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
            />
          </svg>
          Custom Maps & Rute
        </h3>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
          Atur jalur lari (Polyline GPS) dan titik lokasi penting (Water
          Station, Medis) untuk setiap kategori jarak secara interaktif.
        </p>
      </div>

      <div className="lg:col-span-8 space-y-6">
        {!vrSettings.offlinePackages ||
        vrSettings.offlinePackages.length === 0 ? (
          <div className="bg-white p-10 rounded-xl border border-slate-200 text-center shadow-sm">
            <div className="text-4xl mb-3">🚷</div>
            <h3 className="font-bold text-slate-700 text-sm">
              Belum Ada Kategori Tiket
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Silakan buat opsi paket offline di tab &quot;Setup Offline Run&quot;
              terlebih dahulu.
            </p>
          </div>
        ) : (
          vrSettings.offlinePackages.map((pkg: any) => (
            <div
              key={pkg.id}
              className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md"
            >
              <div className="bg-slate-50 px-5 py-4 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-100 px-2.5 py-1 rounded-md mb-1.5 inline-block">
                    Kategori {pkg.jarak}
                  </span>
                  <h4 className="font-bold text-slate-800 text-sm">
                    {pkg.nama || "Tanpa Nama"}
                  </h4>
                </div>
              </div>

              <div className="p-5 space-y-6">
                {/* 🔥 UPLOAD GPX & POLYLINE 🔥 */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                      Sandi Rute (Polyline)
                    </label>

                    {/* TOMBOL AUTO CONVERT GPX */}
                    <label className="text-[10px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg cursor-pointer transition-colors shadow-sm flex items-center gap-1.5">
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                        />
                      </svg>
                      Auto-Generate dari File GPX
                      <input
                        type="file"
                        accept=".gpx"
                        className="hidden"
                        onChange={(e) => handleGpxUpload(e, pkg.id)}
                      />
                    </label>
                  </div>
                  <textarea
                    rows={3}
                    value={pkg.polyline || ""}
                    onChange={(e) =>
                      handlePackageChange(
                        "offline",
                        pkg.id,
                        "polyline",
                        e.target.value,
                      )
                    }
                    placeholder="Contoh: _p~iF~ps|U_ulLnnqC_mqNvxq`@"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none text-slate-600"
                  ></textarea>
                </div>

                {/* 🔥 DAFTAR TITIK LOKASI (WAYPOINTS) 🔥 */}
                <div className="pt-5 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                      Titik Fasilitas (Waypoints)
                    </label>
                    <button
                      type="button"
                      onClick={() => addWaypoint(pkg.id, pkg.waypoints)}
                      className="text-[10px] font-bold bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-3 py-1.5 rounded-lg border border-indigo-100 transition-colors flex items-center gap-1.5"
                    >
                      <span>+</span> Tambah Titik
                    </button>
                  </div>

                  {!pkg.waypoints || pkg.waypoints.length === 0 ? (
                    <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl bg-slate-50">
                      <p className="text-xs text-slate-400 font-medium">
                        Belum ada titik fasilitas yang ditambahkan.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {pkg.waypoints.map((wp: any) => (
                        <div
                          key={wp.id}
                          className="flex flex-col sm:flex-row gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm relative group"
                        >
                          <div className="w-full sm:w-1/4">
                            <label className="block text-[9px] font-bold text-slate-400 mb-1 uppercase">
                              Jenis Titik
                            </label>
                            <div className="relative">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm">
                                {WaypointIcons[wp.type] || "📍"}
                              </span>
                              <select
                                value={wp.type}
                                onChange={(e) =>
                                  updateWaypoint(
                                    pkg.id,
                                    pkg.waypoints,
                                    wp.id,
                                    "type",
                                    e.target.value,
                                  )
                                }
                                className="w-full pl-8 pr-2 py-2 bg-slate-50 border border-slate-200 rounded-md text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 appearance-none cursor-pointer"
                              >
                                <option value="start">Start</option>
                                <option value="finish">Finish</option>
                                <option value="water_station">
                                  Water Station
                                </option>
                                <option value="medic">Tim Medis</option>
                                <option value="cheering">Cheering Zone</option>
                                <option value="camera">Fotografer</option>
                                <option value="checkpoint">Check Point</option>
                              </select>
                            </div>
                          </div>

                          <div className="w-full sm:w-1/4">
                            <label className="block text-[9px] font-bold text-slate-400 mb-1 uppercase">
                              Label (Nama)
                            </label>
                            <input
                              type="text"
                              value={wp.label}
                              onChange={(e) =>
                                updateWaypoint(
                                  pkg.id,
                                  pkg.waypoints,
                                  wp.id,
                                  "label",
                                  e.target.value,
                                )
                              }
                              placeholder="Misal: WS 1"
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-xs outline-none focus:border-indigo-500"
                            />
                          </div>

                          <div className="w-full sm:w-1/4">
                            <label className="block text-[9px] font-bold text-slate-400 mb-1 uppercase">
                              Latitude
                            </label>
                            <input
                              type="text"
                              value={wp.lat}
                              onChange={(e) =>
                                updateWaypoint(
                                  pkg.id,
                                  pkg.waypoints,
                                  wp.id,
                                  "lat",
                                  e.target.value,
                                )
                              }
                              placeholder="-7.68779"
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-xs font-mono outline-none focus:border-indigo-500"
                            />
                          </div>

                          <div className="w-full sm:w-1/4">
                            <label className="block text-[9px] font-bold text-slate-400 mb-1 uppercase">
                              Longitude
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={wp.lng}
                                onChange={(e) =>
                                  updateWaypoint(
                                    pkg.id,
                                    pkg.waypoints,
                                    wp.id,
                                    "lng",
                                    e.target.value,
                                  )
                                }
                                placeholder="110.41327"
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-xs font-mono outline-none focus:border-indigo-500"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  removeWaypoint(pkg.id, pkg.waypoints, wp.id)
                                }
                                className="w-9 shrink-0 flex items-center justify-center bg-rose-50 text-rose-500 rounded-md border border-rose-100 hover:bg-rose-500 hover:text-white transition-colors"
                                title="Hapus Titik"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
