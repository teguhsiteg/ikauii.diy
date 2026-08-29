import React from "react";
import { toast } from "@/lib/toast";
import {
  Settings,
  Calendar,
  Ticket,
  Image as ImageIcon,
  MapPin,
  Map,
  Plus,
  Trash2,
} from "lucide-react";

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

export default function TabOffline({
  vrSettings,
  handleSettingChange,
  handleCategoryToggle,
  handlePackageChange,
  addPackage,
  removePackage,
}: any) {
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

        const trkpts = xmlDoc.getElementsByTagName("trkpt");
        const coords: [number, number][] = [];

        for (let i = 0; i < trkpts.length; i++) {
          const lat = parseFloat(trkpts[i].getAttribute("lat") || "0");
          const lon = parseFloat(trkpts[i].getAttribute("lon") || "0");
          coords.push([lat, lon]);
        }

        if (coords.length > 0) {
          const encodedStr = encodePolyline(coords);
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
          <Settings className="w-5 h-5 text-slate-400" />
          Setup Offline Run
        </h3>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
          Manajemen landing page khusus pendaftaran Offline Run, lokasi venue,
          harga tiket, konfigurasi kuota peserta, dan rute lari.
        </p>
      </div>

      <div className="lg:col-span-8 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
        <div
          className={`flex items-center justify-between p-4 border rounded-xl transition-all ${vrSettings.isOfflineRunEnabled ? "bg-white border-[#1A73E8] shadow-[0_0_0_1px_rgba(26,115,232,0.1)]" : "bg-[#F8F9FA] border-slate-200"}`}
        >
          <div>
            <p
              className={`font-bold text-sm ${vrSettings.isOfflineRunEnabled ? "text-[#1A73E8]" : "text-slate-700"}`}
            >
              Modul Offline Run (Hybrid)
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Jika aktif, form pendaftaran offline akan tersedia untuk publik.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              name="isOfflineRunEnabled"
              checked={vrSettings.isOfflineRunEnabled || false}
              onChange={handleSettingChange}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1A73E8]"></div>
          </label>
        </div>

        {vrSettings.isOfflineRunEnabled && (
          <div className="space-y-4 pt-4 border-t border-slate-100">
            
            {/* 1. Pengaturan Dasar & Kategori */}
            <details className="group border border-slate-200 bg-white rounded-xl shadow-sm [&_summary::-webkit-details-marker]:hidden" open>
              <summary className="flex items-center justify-between p-4 font-bold text-slate-700 cursor-pointer select-none hover:bg-slate-50 rounded-xl transition-colors">
                <span className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-slate-500" />
                  Pengaturan Dasar & Kategori
                </span>
                <span className="transition group-open:rotate-180">
                  <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                </span>
              </summary>
              <div className="p-4 border-t border-slate-100 space-y-6">
                <div>
                  <h4 className="text-[11px] font-bold text-[#1A73E8] uppercase tracking-widest mb-2">
                    Kategori Peserta Formulir
                  </h4>
                  <div className="flex flex-wrap gap-4">
                    {["Alumni", "SMA/Pelajar", "Umum"].map((cat) => (
                      <label
                        key={cat}
                        className={`flex items-center gap-2 cursor-pointer border px-4 py-2.5 rounded-lg transition-colors ${(vrSettings.allowedCategories || ["Umum"]).includes(cat) ? "bg-blue-50 border-blue-200" : "bg-white border-slate-200 hover:bg-slate-50"}`}
                      >
                        <input
                          type="checkbox"
                          checked={(
                            vrSettings.allowedCategories || ["Umum"]
                          ).includes(cat)}
                          onChange={() => handleCategoryToggle(cat)}
                          className="w-4 h-4 accent-[#1A73E8] rounded cursor-pointer"
                        />
                        <span className="text-sm font-bold text-slate-700">
                          {cat === "SMA/Pelajar" ? "Pelajar" : cat}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="bg-[#F8F9FA] p-4 rounded-lg border border-slate-200 space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase">
                      Platform Pendaftaran
                    </label>
                    <select
                      name="registrationPlatform"
                      value={vrSettings.registrationPlatform || "internal"}
                      onChange={handleSettingChange}
                      className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-md focus:border-[#1A73E8] outline-none text-sm font-bold text-[#0B2239]"
                    >
                      <option value="internal">Internal (Web sim-dpwikadiy)</option>
                      <option value="third_party">Pihak Ketiga (Platform Tiket Eksternal)</option>
                    </select>
                  </div>
                  
                  {vrSettings.registrationPlatform === "third_party" && (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase">
                        URL Pihak Ketiga
                      </label>
                      <p className="text-[10px] text-slate-500 mb-2">
                        Peserta akan diarahkan ke link ini saat menekan tombol daftar.
                      </p>
                      <input
                        type="url"
                        name="thirdPartyUrl"
                        value={vrSettings.thirdPartyUrl || ""}
                        onChange={handleSettingChange}
                        placeholder="https://..."
                        className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-md focus:border-[#1A73E8] outline-none text-sm"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                    Konten Landing Page
                  </h4>
                  <div className="grid grid-cols-1 gap-5 bg-[#F8F9FA] p-4 rounded-lg border border-slate-200">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase">
                        Judul Utama Landing Page
                      </label>
                      <input
                        type="text"
                        name="offlineJudul"
                        value={vrSettings.offlineJudul || ""}
                        onChange={handleSettingChange}
                        placeholder="Contoh: SIAP BERLARI? UII SEHAT MENUNGGUMU"
                        className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-md focus:border-[#1A73E8] outline-none text-sm font-bold"
                      />
                      <p className="text-[10px] text-slate-500 mt-1">Gunakan kata-kata singkat dan menarik (max 50 karakter).</p>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase">
                        Deskripsi Singkat / Sub-judul
                      </label>
                      <textarea
                        name="offlineDeskripsi"
                        value={vrSettings.offlineDeskripsi || ""}
                        onChange={handleSettingChange}
                        placeholder="Contoh: Bergabunglah bersama ribuan peserta..."
                        rows={3}
                        className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-md focus:border-[#1A73E8] outline-none text-sm resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase">
                        Background Image URL (Hero)
                      </label>
                      <input
                        type="text"
                        name="urlOfflineHeroBg"
                        value={vrSettings.urlOfflineHeroBg || ""}
                        onChange={handleSettingChange}
                        placeholder="https://..."
                        className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-md focus:border-[#1A73E8] outline-none text-sm font-mono"
                      />
                      <p className="text-[10px] text-slate-500 mt-1">Kosongkan jika ingin memakai background default.</p>
                    </div>
                  </div>
                </div>
              </div>
            </details>

            {/* 2. Waktu, Lokasi & Timeline */}
            <details className="group border border-slate-200 bg-white rounded-xl shadow-sm [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex items-center justify-between p-4 font-bold text-slate-700 cursor-pointer select-none hover:bg-slate-50 rounded-xl transition-colors">
                <span className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  Waktu, Lokasi & Timeline
                </span>
                <span className="transition group-open:rotate-180">
                  <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                </span>
              </summary>
              <div className="p-4 border-t border-slate-100 space-y-6">
                <div>
                  <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                    Info Waktu & Tempat (Race Day)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-[#F8F9FA] p-4 rounded-lg border border-slate-200">
                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase">
                        Lokasi / Venue Kumpul
                      </label>
                      <input
                        type="text"
                        name="offlineLocation"
                        value={vrSettings.offlineLocation || ""}
                        onChange={handleSettingChange}
                        className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-md focus:border-[#1A73E8] outline-none text-sm"
                        placeholder="Lapangan Rektorat UII"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase">
                        Tanggal Acara
                      </label>
                      <input
                        type="date"
                        name="offlineDate"
                        value={vrSettings.offlineDate || ""}
                        onChange={handleSettingChange}
                        className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-md focus:border-[#1A73E8] outline-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase">
                        Jam Kumpul / Flag Off
                      </label>
                      <input
                        type="time"
                        name="offlineTime"
                        value={vrSettings.offlineTime || ""}
                        onChange={handleSettingChange}
                        className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-md focus:border-[#1A73E8] outline-none text-sm"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase">
                        Total Kuota Keseluruhan (0=Tak Terbatas)
                      </label>
                      <input
                        type="number"
                        name="offlineQuota"
                        value={vrSettings.offlineQuota || 0}
                        onChange={handleSettingChange}
                        className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-md focus:border-[#1A73E8] outline-none text-sm font-mono"
                        placeholder="500"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                    Timeline Pendaftaran & Pengambilan
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[11px] font-bold text-emerald-600 mb-1.5 uppercase">
                        Waktu Buka Pendaftaran (Start)
                      </label>
                      <input
                        type="datetime-local"
                        name="offlineTanggalPembukaan"
                        value={vrSettings.offlineTanggalPembukaan || ""}
                        onChange={handleSettingChange}
                        className="w-full px-4 py-2.5 bg-emerald-50 border border-emerald-200 rounded-lg focus:bg-white focus:border-emerald-500 outline-none text-sm text-emerald-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-rose-500 mb-1.5 uppercase">
                        Batas Penutupan Pendaftaran (End)
                      </label>
                      <input
                        type="datetime-local"
                        name="offlineTanggalPenutupan"
                        value={vrSettings.offlineTanggalPenutupan || ""}
                        onChange={handleSettingChange}
                        className="w-full px-4 py-2.5 bg-rose-50 border border-rose-200 rounded-lg focus:bg-white focus:border-rose-500 outline-none text-sm text-rose-800"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-bold text-amber-600 mb-1.5 uppercase">
                        Periode Pengambilan Race Pack (Teks)
                      </label>
                      <input
                        type="text"
                        name="offlinePeriodePengiriman"
                        value={vrSettings.offlinePeriodePengiriman || ""}
                        onChange={handleSettingChange}
                        placeholder="Contoh: 10-12 Oktober 2026"
                        className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:border-amber-500 outline-none text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                    Status Pendaftaran (Manual Override)
                  </h4>
                  <div className="bg-[#F8F9FA] p-4 rounded-lg border border-slate-200 mb-3">
                    <select
                      name="offlineStatus"
                      value={vrSettings.offlineStatus || "auto"}
                      onChange={handleSettingChange}
                      className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-md focus:border-[#1A73E8] outline-none text-sm font-bold text-[#0B2239]"
                    >
                      <option value="auto">Otomatis — Ikuti tanggal buka/tutup</option>
                      <option value="preview">Preview — Halaman tampil, tombol daftar dikunci</option>
                      <option value="buka">Buka Paksa — Pendaftaran dibuka penuh (abaikan tanggal)</option>
                      <option value="coming_soon">Coming Soon — Tampil layar "Segera Dibuka"</option>
                      <option value="tutup">Tutup Total — Halaman ditutup sepenuhnya</option>
                    </select>
                  </div>
                </div>
              </div>
            </details>

            {/* 3. Kategori Tiket & Rute */}
            <details className="group border border-slate-200 bg-white rounded-xl shadow-sm [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex items-center justify-between p-4 font-bold text-slate-700 cursor-pointer select-none hover:bg-slate-50 rounded-xl transition-colors">
                <span className="flex items-center gap-2">
                  <Ticket className="w-4 h-4 text-slate-500" />
                  Kategori Tiket & Rute Lari
                </span>
                <span className="transition group-open:rotate-180">
                  <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                </span>
              </summary>
              <div className="p-4 border-t border-slate-100 space-y-6">
                {vrSettings.offlinePackages.map((pkg: any, index: number) => (
                  <div
                    key={pkg.id}
                    className={`p-5 rounded-lg border relative group transition-colors ${pkg.isHighlight ? "bg-[#E8F0FE]/50 border-[#1A73E8]" : "bg-[#F8F9FA] border-slate-200"}`}
                  >
                    <button
                      type="button"
                      onClick={() => removePackage("offline", pkg.id)}
                      className="absolute top-4 right-4 text-slate-400 hover:text-[#D93025] opacity-0 group-hover:opacity-100 transition-all text-xs font-bold"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="flex items-center gap-3 mb-4">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest">
                        Opsi Tiket #{index + 1}
                      </h4>
                      <label className="flex items-center gap-1.5 cursor-pointer ml-auto mr-12 bg-white px-2.5 py-1 rounded border border-slate-200 shadow-sm hover:bg-slate-50">
                        <input
                          type="checkbox"
                          checked={pkg.isHighlight || false}
                          onChange={(e) =>
                            handlePackageChange("offline", pkg.id, "isHighlight", e.target.checked)
                          }
                          className="w-3.5 h-3.5 accent-[#1A73E8]"
                        />
                        <span className="text-[9px] font-bold text-slate-600 uppercase">
                          Jadikan Highlight
                        </span>
                      </label>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                      <div className="col-span-2 sm:col-span-1">
                        <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Nama Kategori</label>
                        <input
                          type="text"
                          value={pkg.nama}
                          onChange={(e) => handlePackageChange("offline", pkg.id, "nama", e.target.value)}
                          placeholder="Early Bird"
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm outline-none focus:border-[#1A73E8]"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Jarak</label>
                        <input
                          type="text"
                          value={pkg.jarak}
                          onChange={(e) => handlePackageChange("offline", pkg.id, "jarak", e.target.value)}
                          placeholder="10K"
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm outline-none focus:border-[#1A73E8]"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Kuota</label>
                        <input
                          type="number"
                          value={pkg.kuota}
                          onChange={(e) => handlePackageChange("offline", pkg.id, "kuota", Number(e.target.value))}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm font-mono outline-none focus:border-[#1A73E8]"
                          required
                        />
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Harga (Rp)</label>
                        <input
                          type="number"
                          value={pkg.harga}
                          onChange={(e) => handlePackageChange("offline", pkg.id, "harga", Number(e.target.value))}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm font-mono outline-none focus:border-[#1A73E8]"
                          required
                        />
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Benefit Diterima</label>
                      <input
                        type="text"
                        value={pkg.benefit}
                        onChange={(e) => handlePackageChange("offline", pkg.id, "benefit", e.target.value)}
                        placeholder="Jersey, Medali Fisik, BIB"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm outline-none focus:border-[#1A73E8]"
                        required
                      />
                    </div>

                    <div className="mb-4 p-3 border border-amber-200 bg-amber-50 rounded-md">
                      <label className="flex items-center gap-2 cursor-pointer mb-3">
                        <input
                          type="checkbox"
                          checked={pkg.isEarlyBird || false}
                          onChange={(e) => handlePackageChange("offline", pkg.id, "isEarlyBird", e.target.checked)}
                          className="w-4 h-4 accent-amber-500"
                        />
                        <span className="text-xs font-bold text-amber-700 uppercase tracking-wide">
                          Aktifkan Early Bird
                        </span>
                      </label>
                      {pkg.isEarlyBird && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Harga EB (Rp)</label>
                            <input
                              type="number"
                              value={pkg.earlyBirdHarga || ""}
                              onChange={(e) => handlePackageChange("offline", pkg.id, "earlyBirdHarga", Number(e.target.value))}
                              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm font-mono outline-none focus:border-amber-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Target Kuota EB</label>
                            <input
                              type="number"
                              value={pkg.earlyBirdTarget || ""}
                              onChange={(e) => handlePackageChange("offline", pkg.id, "earlyBirdTarget", Number(e.target.value))}
                              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm font-mono outline-none focus:border-amber-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Batas Waktu EB</label>
                            <input
                              type="datetime-local"
                              value={pkg.earlyBirdEndDate || ""}
                              onChange={(e) => handlePackageChange("offline", pkg.id, "earlyBirdEndDate", e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm outline-none focus:border-amber-500"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 🔥 RUTE & WAYPOINTS 🔥 */}
                    <div className="mt-4 p-4 border border-[#1A73E8]/30 bg-[#1A73E8]/5 rounded-lg space-y-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Map className="w-4 h-4 text-[#1A73E8]" />
                        <h5 className="text-xs font-bold text-[#1A73E8] uppercase tracking-widest">
                          Peta Rute & Titik Penting
                        </h5>
                      </div>
                      
                      <div>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                          <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wide">
                            Sandi Rute (Polyline GPS)
                          </label>
                          <label className="text-[10px] font-bold bg-[#1A73E8] hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg cursor-pointer transition-colors shadow-sm flex items-center gap-1.5 w-fit">
                            <Plus className="w-3 h-3" />
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
                          rows={2}
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
                          className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-xs font-mono outline-none focus:border-[#1A73E8] transition-all resize-none text-slate-600"
                        ></textarea>
                      </div>

                      <div className="pt-3 border-t border-blue-200/50">
                        <div className="flex items-center justify-between mb-3">
                          <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wide">
                            Titik Fasilitas (Waypoints)
                          </label>
                          <button
                            type="button"
                            onClick={() => addWaypoint(pkg.id, pkg.waypoints)}
                            className="text-[10px] font-bold bg-white text-[#1A73E8] hover:bg-blue-50 px-3 py-1.5 rounded-lg border border-[#1A73E8]/30 transition-colors flex items-center gap-1.5"
                          >
                            <Plus className="w-3 h-3" /> Tambah Titik
                          </button>
                        </div>

                        {!pkg.waypoints || pkg.waypoints.length === 0 ? (
                          <div className="text-center py-4 border border-dashed border-[#1A73E8]/30 rounded-lg bg-white/50">
                            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">
                              Belum ada titik yang ditambahkan
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {pkg.waypoints.map((wp: any) => (
                              <div
                                key={wp.id}
                                className="flex flex-col sm:flex-row gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-sm relative group"
                              >
                                <div className="w-full sm:w-1/4">
                                  <label className="block text-[9px] font-bold text-slate-400 mb-1 uppercase">
                                    Jenis
                                  </label>
                                  <div className="relative">
                                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px]">
                                      {WaypointIcons[wp.type] || "📍"}
                                    </span>
                                    <select
                                      value={wp.type}
                                      onChange={(e) =>
                                        updateWaypoint(pkg.id, pkg.waypoints, wp.id, "type", e.target.value)
                                      }
                                      className="w-full pl-7 pr-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-[10px] font-bold text-slate-700 outline-none focus:border-[#1A73E8] cursor-pointer"
                                    >
                                      <option value="start">Start</option>
                                      <option value="finish">Finish</option>
                                      <option value="water_station">Water Station</option>
                                      <option value="medic">Tim Medis</option>
                                      <option value="cheering">Cheering Zone</option>
                                      <option value="camera">Fotografer</option>
                                      <option value="checkpoint">Check Point</option>
                                    </select>
                                  </div>
                                </div>

                                <div className="w-full sm:w-1/4">
                                  <label className="block text-[9px] font-bold text-slate-400 mb-1 uppercase">Label</label>
                                  <input
                                    type="text"
                                    value={wp.label}
                                    onChange={(e) =>
                                      updateWaypoint(pkg.id, pkg.waypoints, wp.id, "label", e.target.value)
                                    }
                                    placeholder="Misal: WS 1"
                                    className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-[10px] outline-none focus:border-[#1A73E8]"
                                  />
                                </div>

                                <div className="w-full sm:w-1/4">
                                  <label className="block text-[9px] font-bold text-slate-400 mb-1 uppercase">Lat</label>
                                  <input
                                    type="text"
                                    value={wp.lat}
                                    onChange={(e) =>
                                      updateWaypoint(pkg.id, pkg.waypoints, wp.id, "lat", e.target.value)
                                    }
                                    placeholder="-7.68779"
                                    className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-[10px] font-mono outline-none focus:border-[#1A73E8]"
                                  />
                                </div>

                                <div className="w-full sm:w-1/4">
                                  <label className="block text-[9px] font-bold text-slate-400 mb-1 uppercase">Lng</label>
                                  <div className="flex gap-2">
                                    <input
                                      type="text"
                                      value={wp.lng}
                                      onChange={(e) =>
                                        updateWaypoint(pkg.id, pkg.waypoints, wp.id, "lng", e.target.value)
                                      }
                                      placeholder="110.41327"
                                      className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-[10px] font-mono outline-none focus:border-[#1A73E8]"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => removeWaypoint(pkg.id, pkg.waypoints, wp.id)}
                                      className="w-7 shrink-0 flex items-center justify-center bg-rose-50 text-rose-500 rounded border border-rose-100 hover:bg-rose-500 hover:text-white transition-colors"
                                    >
                                      <Trash2 className="w-3 h-3" />
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
                ))}
                <button
                  type="button"
                  onClick={() => addPackage("offline")}
                  className="w-full py-2.5 border border-dashed border-[#1A73E8] text-[#1A73E8] rounded-lg text-sm font-bold hover:bg-[#E8F0FE] transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Tambah Kategori Tiket
                </button>
              </div>
            </details>

            {/* 4. Aset Digital & Race Pack */}
            <details className="group border border-slate-200 bg-white rounded-xl shadow-sm [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex items-center justify-between p-4 font-bold text-slate-700 cursor-pointer select-none hover:bg-slate-50 rounded-xl transition-colors">
                <span className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-slate-500" />
                  Aset Digital & Gambar Race Pack
                </span>
                <span className="transition group-open:rotate-180">
                  <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                </span>
              </summary>
              <div className="p-4 border-t border-slate-100 space-y-6">
                <div>
                  <h4 className="text-[11px] font-bold text-emerald-700 uppercase tracking-widest mb-1">
                    Gambar Race Pack Fisik
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
                    <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
                      <label className="block text-[11px] font-bold text-emerald-700 mb-1 uppercase tracking-wide">
                        URL Foto Jersey
                      </label>
                      <input
                        type="url"
                        name="urlJerseyOffline"
                        value={vrSettings.urlJerseyOffline || ""}
                        onChange={handleSettingChange}
                        placeholder="https://..."
                        className="w-full px-4 py-2.5 bg-white border border-emerald-200 rounded-lg focus:border-emerald-500 outline-none text-sm font-mono text-slate-700"
                      />
                      {vrSettings.urlJerseyOffline && (
                        <img src={vrSettings.urlJerseyOffline} alt="Preview Jersey Offline" className="mt-3 w-full h-32 object-cover rounded-lg border border-emerald-200" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      )}
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
                      <label className="block text-[11px] font-bold text-yellow-700 mb-1 uppercase tracking-wide">
                        URL Foto Medali
                      </label>
                      <input
                        type="url"
                        name="urlMedaliOffline"
                        value={vrSettings.urlMedaliOffline || ""}
                        onChange={handleSettingChange}
                        placeholder="https://..."
                        className="w-full px-4 py-2.5 bg-white border border-yellow-200 rounded-lg focus:border-yellow-500 outline-none text-sm font-mono text-slate-700"
                      />
                      {vrSettings.urlMedaliOffline && (
                        <img src={vrSettings.urlMedaliOffline} alt="Preview Medali Offline" className="mt-3 w-full h-32 object-cover rounded-lg border border-yellow-200" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100">
                  <h4 className="text-[11px] font-bold text-blue-600 uppercase tracking-widest mb-1 pb-2">
                    Aset Digital (BIB & Sertifikat)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase">
                        URL Gambar E-BIB
                      </label>
                      <input
                        type="url"
                        name="urlBibOffline"
                        value={vrSettings.urlBibOffline || ""}
                        onChange={handleSettingChange}
                        placeholder="https://..."
                        className="w-full px-4 py-2.5 bg-[#F8F9FA] border border-slate-200 rounded-lg focus:bg-white focus:border-blue-500 outline-none text-sm font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase">
                        URL E-Sertifikat (Template)
                      </label>
                      <input
                        type="url"
                        name="urlSertifikatOffline"
                        value={vrSettings.urlSertifikatOffline || ""}
                        onChange={handleSettingChange}
                        placeholder="https://..."
                        className="w-full px-4 py-2.5 bg-[#F8F9FA] border border-slate-200 rounded-lg focus:bg-white focus:border-blue-500 outline-none text-sm font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </details>

          </div>
        )}
      </div>
    </div>
  );
}
