import React from "react";
import Swal from "sweetalert2";
import {
  Settings,
  Calendar,
  Ticket,
  Image as ImageIcon,
  Truck,
  Plus,
  Trash2,
} from "lucide-react";

export default function TabVirtual({
  vrSettings,
  handleSettingChange,
  handlePackageChange,
  addPackage,
  removePackage,
  handleFaqChange,
  addFaq,
  removeFaq,
}: any) {
  const addPromo = (pkgId: string, currentPromos: any[]) => {
    const updated = [
      ...(currentPromos || []),
      {
        id: Date.now().toString(),
        kode: "",
        jenisDiskon: "persen",
        nilaiDiskon: 0,
        kuotaMaksimal: 100,
        kuotaTerpakai: 0,
        tanggalKedaluwarsa: "",
        isActive: true,
      },
    ];
    handlePackageChange("virtual", pkgId, "promos", updated);
  };

  const updatePromo = (
    pkgId: string,
    currentPromos: any[],
    promoId: string,
    field: string,
    value: any,
  ) => {
    const updated = (currentPromos || []).map((p) =>
      p.id === promoId ? { ...p, [field]: value } : p,
    );
    handlePackageChange("virtual", pkgId, "promos", updated);
  };

  const removePromo = (pkgId: string, currentPromos: any[], promoId: string) => {
    Swal.fire({
      title: "Hapus Promo?",
      text: "Promo ini akan dihapus dari paket.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Ya, Hapus!",
      cancelButtonText: "Batal"
    }).then((result) => {
      if (result.isConfirmed) {
        const updated = (currentPromos || []).filter((p) => p.id !== promoId);
        handlePackageChange("virtual", pkgId, "promos", updated);
      }
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 border-slate-200 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="lg:col-span-4">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <Settings className="w-5 h-5 text-slate-400" />
          Setup Virtual Run
        </h3>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
          Aktifkan atau matikan modul Virtual Run, atur paket tiket, dan info landing page.
        </p>
      </div>

      <div className="lg:col-span-8 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
        <div
          className={`flex items-center justify-between p-4 border rounded-xl transition-all ${vrSettings.isVirtualRunEnabled ? "bg-white border-[#1A73E8] shadow-[0_0_0_1px_rgba(26,115,232,0.1)]" : "bg-[#F8F9FA] border-slate-200"}`}
        >
          <div>
            <p
              className={`font-bold text-sm ${vrSettings.isVirtualRunEnabled ? "text-[#1A73E8]" : "text-slate-700"}`}
            >
              Modul Virtual Run
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Jika dimatikan, halaman Virtual Run akan ditutup.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              name="isVirtualRunEnabled"
              checked={vrSettings.isVirtualRunEnabled || false}
              onChange={handleSettingChange}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1A73E8]"></div>
          </label>
        </div>




        {vrSettings.isVirtualRunEnabled && (
          <div className="space-y-4 pt-4 border-t border-slate-100">
            
            {/* 1. Pengaturan Dasar & Landing Page */}
            <details className="group border border-slate-200 bg-white rounded-xl shadow-sm [&_summary::-webkit-details-marker]:hidden" open>
              <summary className="flex items-center justify-between p-4 font-bold text-slate-700 cursor-pointer select-none hover:bg-slate-50 rounded-xl transition-colors">
                <span className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-slate-500" />
                  Pengaturan Dasar & Landing Page
                </span>
                <span className="transition group-open:rotate-180">
                  <svg fill="none" height="24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                </span>
              </summary>
              <div className="p-4 border-t border-slate-100 space-y-5">
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                      Nama Event
                    </label>
                    <input
                      type="text"
                      name="eventName"
                      value={vrSettings.eventName || ""}
                      onChange={handleSettingChange}
                      required
                      className="w-full px-4 py-2.5 bg-[#F8F9FA] border border-slate-200 rounded-lg focus:bg-white focus:border-[#1A73E8] outline-none text-sm transition-all text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                      Status Pendaftaran
                    </label>
                    <select
                      name="statusPendaftaran"
                      value={vrSettings.statusPendaftaran || "Buka"}
                      onChange={handleSettingChange}
                      className="w-full px-4 py-2.5 bg-[#F8F9FA] border border-slate-200 rounded-lg focus:bg-white focus:border-[#1A73E8] outline-none text-sm transition-all text-slate-800"
                    >
                      <option value="Buka">Buka (Menerima)</option>
                      <option value="Tutup">Tutup (Sold Out)</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                    Judul Landing Page
                  </label>
                  <input
                    type="text"
                    name="landingTitle"
                    value={vrSettings.landingTitle || ""}
                    onChange={handleSettingChange}
                    required
                    className="w-full px-4 py-2.5 bg-[#F8F9FA] border border-slate-200 rounded-lg focus:bg-white focus:border-[#1A73E8] outline-none text-sm transition-all text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                    Deskripsi Singkat
                  </label>
                  <textarea
                    name="landingDesc"
                    value={vrSettings.landingDesc || ""}
                    onChange={handleSettingChange}
                    rows={3}
                    className="w-full px-4 py-2.5 bg-[#F8F9FA] border border-slate-200 rounded-lg focus:bg-white focus:border-[#1A73E8] outline-none text-sm transition-all text-slate-800 custom-scrollbar"
                  ></textarea>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                    Background Image URL (Hero)
                  </label>
                  <input
                    type="text"
                    name="urlHeroBg"
                    value={vrSettings.urlHeroBg || ""}
                    onChange={handleSettingChange}
                    placeholder="https://..."
                    className="w-full px-4 py-2.5 bg-[#F8F9FA] border border-slate-200 rounded-lg focus:bg-white focus:border-[#1A73E8] outline-none text-sm transition-all text-slate-800 font-mono"
                  />
                </div>
              </div>
            </details>

            {/* 2. Jadwal & Timeline VR */}
            <details className="group border border-slate-200 bg-white rounded-xl shadow-sm [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex items-center justify-between p-4 font-bold text-slate-700 cursor-pointer select-none hover:bg-slate-50 rounded-xl transition-colors">
                <span className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  Jadwal & Timeline Virtual Run
                </span>
                <span className="transition group-open:rotate-180">
                  <svg fill="none" height="24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                </span>
              </summary>
              <div className="p-4 border-t border-slate-100 space-y-5">
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                      Mulai Pendaftaran
                    </label>
                    <input
                      type="datetime-local"
                      name="tanggalPembukaan"
                      value={vrSettings.tanggalPembukaan || ""}
                      onChange={handleSettingChange}
                      className="w-full px-4 py-2.5 bg-[#F8F9FA] border border-slate-200 rounded-lg focus:bg-white focus:border-[#1A73E8] outline-none text-sm transition-all text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                      Batas Pendaftaran
                    </label>
                    <input
                      type="datetime-local"
                      name="tanggalPenutupan"
                      value={vrSettings.tanggalPenutupan || ""}
                      onChange={handleSettingChange}
                      className="w-full px-4 py-2.5 bg-[#F8F9FA] border border-slate-200 rounded-lg focus:bg-white focus:border-[#1A73E8] outline-none text-sm transition-all text-slate-800"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                      Mulai Periode Submit Lari
                    </label>
                    <input
                      type="datetime-local"
                      name="periodeLariStart"
                      value={vrSettings.periodeLariStart || ""}
                      onChange={handleSettingChange}
                      className="w-full px-4 py-2.5 bg-[#F8F9FA] border border-slate-200 rounded-lg focus:bg-white focus:border-[#1A73E8] outline-none text-sm transition-all text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                      Batas Akhir Submit Lari
                    </label>
                    <input
                      type="datetime-local"
                      name="periodeLariEnd"
                      value={vrSettings.periodeLariEnd || ""}
                      onChange={handleSettingChange}
                      className="w-full px-4 py-2.5 bg-[#F8F9FA] border border-slate-200 rounded-lg focus:bg-white focus:border-[#1A73E8] outline-none text-sm transition-all text-slate-800"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                      Jadwal Kirim Racepack (Teks)
                    </label>
                    <input
                      type="text"
                      name="periodePengiriman"
                      value={vrSettings.periodePengiriman || ""}
                      onChange={handleSettingChange}
                      placeholder="Contoh: Pertengahan Mei 2026"
                      className="w-full px-4 py-2.5 bg-[#F8F9FA] border border-slate-200 rounded-lg focus:bg-white focus:border-[#1A73E8] outline-none text-sm transition-all text-slate-800"
                    />
                  </div>
                </div>
              </div>
            </details>

            {/* 3. Kategori Tiket Virtual */}
            <details className="group border border-slate-200 bg-white rounded-xl shadow-sm [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex items-center justify-between p-4 font-bold text-slate-700 cursor-pointer select-none hover:bg-slate-50 rounded-xl transition-colors">
                <span className="flex items-center gap-2">
                  <Ticket className="w-4 h-4 text-slate-500" />
                  Paket Tiket Virtual Run
                </span>
                <span className="transition group-open:rotate-180">
                  <svg fill="none" height="24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                </span>
              </summary>
              <div className="p-4 border-t border-slate-100 space-y-6">
                {vrSettings.virtualPackages.map((pkg: any, index: number) => (
                  <div
                    key={pkg.id}
                    className="p-5 border border-slate-200 rounded-lg bg-[#F8F9FA] relative group"
                  >
                    <button
                      type="button"
                      onClick={() => removePackage("virtual", pkg.id)}
                      className="absolute top-4 right-4 text-slate-400 hover:text-[#D93025] opacity-0 group-hover:opacity-100 transition-all text-xs font-bold"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <h4 className="text-xs font-bold text-slate-700 mb-4 uppercase tracking-widest">
                      Opsi Virtual #{index + 1}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">
                          Nama Paket
                        </label>
                        <input
                          type="text"
                          value={pkg.nama}
                          onChange={(e) =>
                            handlePackageChange(
                              "virtual",
                              pkg.id,
                              "nama",
                              e.target.value,
                            )
                          }
                          placeholder="Basic"
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm outline-none focus:border-[#1A73E8]"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">
                          Jarak / Kategori
                        </label>
                        <input
                          type="text"
                          value={pkg.jarak}
                          onChange={(e) =>
                            handlePackageChange(
                              "virtual",
                              pkg.id,
                              "jarak",
                              e.target.value,
                            )
                          }
                          placeholder="5K"
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm outline-none focus:border-[#1A73E8]"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">
                          Harga (Rp)
                        </label>
                        <input
                          type="number"
                          value={pkg.harga}
                          onChange={(e) =>
                            handlePackageChange(
                              "virtual",
                              pkg.id,
                              "harga",
                              Number(e.target.value),
                            )
                          }
                          placeholder="150000"
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm outline-none focus:border-[#1A73E8] font-mono"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">
                        Benefit Diterima
                      </label>
                      <input
                        type="text"
                        value={pkg.benefit}
                        onChange={(e) =>
                          handlePackageChange(
                            "virtual",
                            pkg.id,
                            "benefit",
                            e.target.value,
                          )
                        }
                        placeholder="E-BIB, E-Certificate, Jersey"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm outline-none focus:border-[#1A73E8]"
                        required
                      />
                    </div>

                    {/* EARLY BIRD SECTION */}
                    <div className="mt-4 p-3 border border-amber-200 bg-amber-50 rounded-md">
                      <label className="flex items-center gap-2 cursor-pointer mb-3">
                        <input
                          type="checkbox"
                          checked={pkg.isEarlyBird || false}
                          onChange={(e) =>
                            handlePackageChange("virtual", pkg.id, "isEarlyBird", e.target.checked)
                          }
                          className="w-4 h-4 accent-amber-500"
                        />
                        <span className="text-xs font-bold text-amber-700 uppercase tracking-wide">
                          Aktifkan Early Bird
                        </span>
                      </label>
                      {pkg.isEarlyBird && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">
                              Harga Early Bird (Rp)
                            </label>
                            <input
                              type="number"
                              value={pkg.earlyBirdHarga || ""}
                              onChange={(e) => handlePackageChange("virtual", pkg.id, "earlyBirdHarga", Number(e.target.value))}
                              placeholder="100000"
                              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm outline-none focus:border-amber-500 font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">
                              Target Kuota Lunas
                            </label>
                            <input
                              type="number"
                              value={pkg.earlyBirdTarget || ""}
                              onChange={(e) => handlePackageChange("virtual", pkg.id, "earlyBirdTarget", Number(e.target.value))}
                              placeholder="100"
                              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm outline-none focus:border-amber-500 font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">
                              Batas Penutupan
                            </label>
                            <input
                              type="datetime-local"
                              value={pkg.earlyBirdEndDate || ""}
                              onChange={(e) => handlePackageChange("virtual", pkg.id, "earlyBirdEndDate", e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm outline-none focus:border-amber-500"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* MANAJEMEN PROMO TIKET */}
                    <div className="mt-6 pt-6 border-t border-slate-200">
                      <div className="flex items-center justify-between mb-4">
                        <label className="block text-xs font-bold text-emerald-600 uppercase tracking-wide">
                          Manajemen Promo Tiket
                        </label>
                        <button
                          type="button"
                          onClick={() => addPromo(pkg.id, pkg.promos)}
                          className="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-md text-[10px] font-bold hover:bg-emerald-100 transition-colors flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" /> Tambah Promo
                        </button>
                      </div>

                      {(!pkg.promos || pkg.promos.length === 0) ? (
                        <div className="text-center py-4 bg-slate-50 rounded-lg border border-slate-200 border-dashed">
                          <p className="text-[10px] text-slate-400 font-bold">
                            Belum ada promo untuk paket ini.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {pkg.promos.map((promo: any) => (
                            <div
                              key={promo.id}
                              className={`flex flex-col gap-3 p-4 rounded-lg border transition-all ${promo.isActive ? "bg-white border-slate-200 shadow-sm" : "bg-slate-50 border-slate-200 opacity-70"}`}
                            >
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                <div>
                                  <label className="block text-[9px] font-bold text-slate-400 mb-1 uppercase">Kode Unik</label>
                                  <input
                                    type="text"
                                    value={promo.kode}
                                    onChange={(e) => updatePromo(pkg.id, pkg.promos, promo.id, "kode", e.target.value.toUpperCase().replace(/\s/g, ""))}
                                    placeholder="KODEPROMO"
                                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-[10px] uppercase font-bold outline-none focus:border-[#1A73E8]"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[9px] font-bold text-slate-400 mb-1 uppercase">Tipe Diskon</label>
                                  <select
                                    value={promo.jenisDiskon}
                                    onChange={(e) => updatePromo(pkg.id, pkg.promos, promo.id, "jenisDiskon", e.target.value)}
                                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-[10px] outline-none focus:border-[#1A73E8]"
                                  >
                                    <option value="persen">Persen (%)</option>
                                    <option value="nominal">Nominal (Rp)</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-[9px] font-bold text-slate-400 mb-1 uppercase">Nilai Diskon</label>
                                  <input
                                    type="number"
                                    value={promo.nilaiDiskon}
                                    onChange={(e) => updatePromo(pkg.id, pkg.promos, promo.id, "nilaiDiskon", Number(e.target.value))}
                                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-[10px] font-mono outline-none focus:border-[#1A73E8]"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[9px] font-bold text-slate-400 mb-1 uppercase">Batas Kuota (0 = Tanpa Batas)</label>
                                  <input
                                    type="number"
                                    value={promo.kuotaMaksimal}
                                    onChange={(e) => updatePromo(pkg.id, pkg.promos, promo.id, "kuotaMaksimal", Number(e.target.value))}
                                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-[10px] font-mono outline-none focus:border-[#1A73E8]"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[9px] font-bold text-slate-400 mb-1 uppercase">Tgl Kedaluwarsa</label>
                                  <input
                                    type="date"
                                    value={promo.tanggalKedaluwarsa}
                                    onChange={(e) => updatePromo(pkg.id, pkg.promos, promo.id, "tanggalKedaluwarsa", e.target.value)}
                                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-[10px] outline-none focus:border-[#1A73E8]"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[9px] font-bold text-slate-400 mb-1 uppercase">Kuota Terpakai</label>
                                  <div className="w-full px-2 py-1.5 bg-slate-100 border border-slate-200 rounded text-[10px] font-mono text-slate-500 cursor-not-allowed">
                                    {promo.kuotaTerpakai} tiket
                                  </div>
                                </div>
                              </div>
                              <div className="flex justify-end gap-2 mt-2 pt-3 border-t border-slate-100">
                                <button
                                  type="button"
                                  onClick={() => updatePromo(pkg.id, pkg.promos, promo.id, "isActive", !promo.isActive)}
                                  className={`px-3 py-1.5 rounded text-[9px] font-bold transition-colors ${promo.isActive ? "bg-amber-50 text-amber-600 hover:bg-amber-100" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"}`}
                                >
                                  {promo.isActive ? "Matikan" : "Aktifkan"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removePromo(pkg.id, pkg.promos, promo.id)}
                                  className="px-3 py-1.5 bg-rose-50 text-rose-500 rounded text-[9px] font-bold hover:bg-rose-100 transition-colors"
                                >
                                  Hapus
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addPackage("virtual")}
                  className="w-full py-2.5 border border-dashed border-[#1A73E8] text-[#1A73E8] rounded-lg text-sm font-bold hover:bg-[#E8F0FE] transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Tambah Opsi Paket Virtual
                </button>
              </div>
            </details>

            {/* 4. Pengiriman Race Pack */}
            <details className="group border border-slate-200 bg-white rounded-xl shadow-sm [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex items-center justify-between p-4 font-bold text-slate-700 cursor-pointer select-none hover:bg-slate-50 rounded-xl transition-colors">
                <span className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-slate-500" />
                  Pengaturan Ongkos Kirim (Race Pack)
                </span>
                <span className="transition group-open:rotate-180">
                  <svg fill="none" height="24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                </span>
              </summary>
              <div className="p-4 border-t border-slate-100 space-y-5">
                <div className="flex items-center gap-4 bg-slate-50 p-4 border border-slate-200 rounded-xl">
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      name="isRpxActive"
                      checked={vrSettings.isRpxActive || false}
                      onChange={handleSettingChange}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1A73E8]"></div>
                  </label>
                  <div>
                    <p className={`font-bold text-sm ${vrSettings.isRpxActive ? "text-[#1A73E8]" : "text-slate-700"}`}>
                      Gunakan RPX API (Real Tarif)
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Jika dimatikan, akan menggunakan Ongkir Flat.
                    </p>
                  </div>
                </div>

                {!vrSettings.isRpxActive ? (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                      Ongkir Flat Pengiriman (Rp)
                    </label>
                    <input
                      type="number"
                      name="ongkirFlat"
                      value={vrSettings.ongkirFlat || 0}
                      onChange={handleSettingChange}
                      className="w-full md:w-1/2 px-4 py-2.5 bg-[#F8F9FA] border border-slate-200 rounded-lg focus:bg-white focus:border-[#1A73E8] outline-none text-sm font-mono text-slate-800"
                      required
                    />
                  </div>
                ) : (
                  <div className="p-5 border border-blue-200 bg-blue-50/50 rounded-xl space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                          RPX Username (API V3)
                        </label>
                        <input
                          type="text"
                          name="rpxUsername"
                          value={vrSettings.rpxUsername || ""}
                          onChange={handleSettingChange}
                          placeholder="Contoh: demo"
                          className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:border-[#1A73E8] outline-none text-sm font-mono text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                          RPX Password (API V3)
                        </label>
                        <input
                          type="password"
                          name="rpxPassword"
                          value={vrSettings.rpxPassword || ""}
                          onChange={handleSettingChange}
                          placeholder="••••••••"
                          className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:border-[#1A73E8] outline-none text-sm font-mono text-slate-800"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                          RPX Account Number
                        </label>
                        <input
                          type="text"
                          name="rpxAccountNumber"
                          value={vrSettings.rpxAccountNumber || ""}
                          onChange={handleSettingChange}
                          placeholder="Contoh: 12345678"
                          className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:border-[#1A73E8] outline-none text-sm font-mono text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                          Kode Pos Asal (Origin)
                        </label>
                        <input
                          type="text"
                          name="rpxOriginZip"
                          value={vrSettings.rpxOriginZip || ""}
                          onChange={handleSettingChange}
                          placeholder="Contoh: 12310"
                          className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:border-[#1A73E8] outline-none text-sm font-mono text-slate-800"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                          Berat Default Paket (Kg)
                        </label>
                        <input
                          type="number"
                          name="rpxDefaultWeight"
                          value={vrSettings.rpxDefaultWeight || 1}
                          onChange={handleSettingChange}
                          className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:border-[#1A73E8] outline-none text-sm font-mono text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                          Layanan Default (Service Type)
                        </label>
                        <input
                          type="text"
                          name="rpxDefaultService"
                          value={vrSettings.rpxDefaultService || "PSN"}
                          onChange={handleSettingChange}
                          placeholder="PSN, SDP, dll"
                          className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:border-[#1A73E8] outline-none text-sm font-mono text-slate-800 uppercase"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                          URL Tracking RPX (Dasar)
                        </label>
                        <input
                          type="text"
                          name="rpxTrackingUrl"
                          value={vrSettings.rpxTrackingUrl || ""}
                          onChange={handleSettingChange}
                          placeholder="https://www.rpx.co.id/tracking/"
                          className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:border-[#1A73E8] outline-none text-sm font-mono text-slate-800"
                        />
                        <p className="text-[10px] text-slate-500 mt-1">
                          Peserta harus menyalin nomor resi dan mengeceknya manual di halaman ini (karena sistem captcha RPX).
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </details>

            {/* 5. Aset Digital & Race Pack Virtual */}
            <details className="group border border-slate-200 bg-white rounded-xl shadow-sm [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex items-center justify-between p-4 font-bold text-slate-700 cursor-pointer select-none hover:bg-slate-50 rounded-xl transition-colors">
                <span className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-slate-500" />
                  Gambar Race Pack Virtual
                </span>
                <span className="transition group-open:rotate-180">
                  <svg fill="none" height="24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                </span>
              </summary>
              <div className="p-4 border-t border-slate-100 space-y-5">
                <div>
                  <h4 className="text-[11px] font-bold text-blue-700 uppercase tracking-widest mb-1 flex items-center gap-2">
                    Gambar Race Pack Virtual
                  </h4>
                  <p className="text-[11px] text-slate-500 mb-4 leading-relaxed">
                    URL gambar jersey dan medali yang ditampilkan di halaman{" "}
                    <code className="bg-slate-100 px-1 py-0.5 rounded text-[10px] font-mono">/virtual-run</code>{" "}
                    bagian <strong>Race Pack Collection</strong>.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Jersey Virtual */}
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                    <label className="block text-[11px] font-bold text-blue-700 mb-1 uppercase tracking-wide">
                      URL Foto Jersey Virtual
                    </label>
                    <p className="text-[10px] text-blue-500 mb-2">
                      Ditampilkan di card "Premium Dry-Fit Jersey"
                    </p>
                    <input
                      type="url"
                      name="urlJerseyVirtual"
                      value={vrSettings.urlJerseyVirtual || ""}
                      onChange={handleSettingChange}
                      placeholder="https://..."
                      className="w-full px-4 py-2.5 bg-white border border-blue-200 rounded-lg focus:border-blue-500 outline-none text-sm font-mono text-slate-700"
                    />
                    {vrSettings.urlJerseyVirtual && (
                      <img
                        src={vrSettings.urlJerseyVirtual}
                        alt="Preview Jersey Virtual"
                        className="mt-3 w-full h-32 object-cover rounded-lg border border-blue-200"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    )}
                  </div>

                  {/* Medali Virtual */}
                  <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
                    <label className="block text-[11px] font-bold text-yellow-700 mb-1 uppercase tracking-wide">
                      URL Foto Medali Virtual
                    </label>
                    <p className="text-[10px] text-yellow-600 mb-2">
                      Ditampilkan di card "Finisher Medal"
                    </p>
                    <input
                      type="url"
                      name="urlMedaliVirtual"
                      value={vrSettings.urlMedaliVirtual || ""}
                      onChange={handleSettingChange}
                      placeholder="https://..."
                      className="w-full px-4 py-2.5 bg-white border border-yellow-200 rounded-lg focus:border-yellow-500 outline-none text-sm font-mono text-slate-700"
                    />
                    {vrSettings.urlMedaliVirtual && (
                      <img
                        src={vrSettings.urlMedaliVirtual}
                        alt="Preview Medali Virtual"
                        className="mt-3 w-full h-32 object-cover rounded-lg border border-yellow-200"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    )}
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
                        name="urlBibVirtual"
                        value={vrSettings.urlBibVirtual || ""}
                        onChange={handleSettingChange}
                        placeholder="https://..."
                        className="w-full px-4 py-2.5 bg-[#F8F9FA] border border-slate-200 rounded-lg focus:bg-white focus:border-blue-500 outline-none text-sm font-mono"
                      />
                      {vrSettings.urlBibVirtual && (
                        <img src={vrSettings.urlBibVirtual} alt="Preview E-BIB Virtual" className="mt-3 w-full h-32 object-cover rounded-lg border border-slate-200" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      )}
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase">
                        URL E-Sertifikat (Template)
                      </label>
                      <input
                        type="url"
                        name="urlSertifikatVirtual"
                        value={vrSettings.urlSertifikatVirtual || ""}
                        onChange={handleSettingChange}
                        placeholder="https://..."
                        className="w-full px-4 py-2.5 bg-[#F8F9FA] border border-slate-200 rounded-lg focus:bg-white focus:border-blue-500 outline-none text-sm font-mono"
                      />
                      {vrSettings.urlSertifikatVirtual && (
                        <img src={vrSettings.urlSertifikatVirtual} alt="Preview Sertifikat Virtual" className="mt-3 w-full h-32 object-cover rounded-lg border border-slate-200" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      )}
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
