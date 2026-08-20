export default function TabVirtual({
  vrSettings,
  handleSettingChange,
  handlePackageChange,
  addPackage,
  removePackage,
}: any) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 border-slate-200 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="lg:col-span-4">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <svg
            className="w-5 h-5 text-slate-400"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zM7 9v2H3v2h4v2h2V9H7zm14 4v-2H11v2h10zm-6-4h2V7h4V5h-4V3h-2v6z" />
          </svg>
          Setup Virtual Run
        </h3>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
          Aktifkan atau matikan modul Virtual Run dan atur info landing page
          utamanya.
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

        <div
          className={`flex items-center justify-between p-4 border rounded-xl transition-all ${vrSettings.isWaitingRoomActive ? "bg-white border-[#1A73E8] shadow-[0_0_0_1px_rgba(26,115,232,0.1)]" : "bg-[#F8F9FA] border-slate-200"}`}
        >
          <div>
            <p
              className={`font-bold text-sm ${vrSettings.isWaitingRoomActive ? "text-[#1A73E8]" : "text-slate-700"}`}
            >
              Mode Ruang Tunggu (Waiting Room)
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Aktifkan untuk menahan antrean peserta pendaftaran Virtual Run.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              name="isWaitingRoomActive"
              checked={vrSettings.isWaitingRoomActive || false}
              onChange={handleSettingChange}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1A73E8]"></div>
          </label>
        </div>

        <div className="p-4 border border-slate-200 rounded-xl bg-white space-y-3">
          <div>
            <label className="block font-bold text-sm text-slate-700 mb-1">
              Link Grup WhatsApp (WA Channel)
            </label>
            <p className="text-xs text-slate-500 mb-3">
              Tautan WhatsApp Group/Channel untuk peserta Virtual Run.
            </p>
            <input
              type="url"
              name="waChannelUrl"
              value={vrSettings.waChannelUrl || ""}
              onChange={handleSettingChange}
              placeholder="https://chat.whatsapp.com/..."
              className="w-full px-4 py-2.5 bg-[#F8F9FA] border border-slate-200 rounded-lg focus:bg-white focus:border-[#1A73E8] outline-none text-sm transition-all text-slate-800"
            />
          </div>
        </div>

        {vrSettings.isVirtualRunEnabled && (
          <div className="space-y-5">
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
        )}

        {vrSettings.isVirtualRunEnabled && (
          <div className="pt-6 border-t border-slate-200 mt-6 space-y-5">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest mb-4">
              Timeline & Jadwal VR
            </h4>
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
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                  Periode Lari (Teks)
                </label>
                <input
                  type="text"
                  name="periodeLari"
                  value={vrSettings.periodeLari || ""}
                  onChange={handleSettingChange}
                  placeholder="1 - 30 April 2026"
                  className="w-full px-4 py-2.5 bg-[#F8F9FA] border border-slate-200 rounded-lg focus:bg-white focus:border-[#1A73E8] outline-none text-sm transition-all text-slate-800"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                  Jadwal Kirim Racepack
                </label>
                <input
                  type="text"
                  name="periodePengiriman"
                  value={vrSettings.periodePengiriman || ""}
                  onChange={handleSettingChange}
                  placeholder="Pertengahan Mei 2026"
                  className="w-full px-4 py-2.5 bg-[#F8F9FA] border border-slate-200 rounded-lg focus:bg-white focus:border-[#1A73E8] outline-none text-sm transition-all text-slate-800"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                  Jadwal Puncak Acara
                </label>
                <input
                  type="text"
                  name="jadwalPuncakAcara"
                  value={vrSettings.jadwalPuncakAcara || ""}
                  onChange={handleSettingChange}
                  placeholder="31 Mei 2026"
                  className="w-full px-4 py-2.5 bg-[#F8F9FA] border border-slate-200 rounded-lg focus:bg-white focus:border-[#1A73E8] outline-none text-sm transition-all text-slate-800"
                />
              </div>
            </div>
          </div>
        )}

        {vrSettings.isVirtualRunEnabled && (
          <div className="pt-6 border-t border-slate-200 mt-6 space-y-6">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest mb-4">
              Paket Virtual Run
            </h4>
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
                  ✕ Hapus
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
              </div>
            ))}
            <button
              type="button"
              onClick={() => addPackage("virtual")}
              className="w-full py-2.5 border border-dashed border-[#1A73E8] text-[#1A73E8] rounded-lg text-sm font-bold hover:bg-[#E8F0FE] transition-colors flex items-center justify-center gap-2"
            >
              <span>+</span> Tambah Opsi Paket Virtual
            </button>
            <div className="pt-6 border-t border-slate-100">
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                Ongkir Flat Pengiriman Medali/Jersey
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
          </div>
        )}

        {/* 🔥 RACE PACK VIRTUAL — GAMBAR JERSEY & MEDALI 🔥 */}
        {vrSettings.isVirtualRunEnabled && (
          <div className="pt-6 border-t border-slate-200 mt-6 space-y-5">
            <div>
              <h4 className="text-xs font-bold text-blue-700 uppercase tracking-widest mb-1 flex items-center gap-2">
                <span>👕</span> Gambar Race Pack Virtual
              </h4>
              <p className="text-[11px] text-slate-500 mb-4 leading-relaxed">
                URL gambar jersey dan medali yang ditampilkan di halaman{" "}
                <code className="bg-slate-100 px-1 py-0.5 rounded text-[10px] font-mono">/virtual-run</code>{" "}
                bagian <strong>Race Pack Collection</strong>. Gunakan link gambar publik (Google Drive, Imgur, dll).
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Jersey Virtual */}
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                <label className="block text-[11px] font-bold text-blue-700 mb-1 uppercase tracking-wide">
                  👕 URL Foto Jersey Virtual
                </label>
                <p className="text-[10px] text-blue-500 mb-2">
                  Ditampilkan di card &quot;Premium Dry-Fit Jersey&quot; halaman /virtual-run
                </p>
                <input
                  type="url"
                  name="urlJersey"
                  value={vrSettings.urlJersey || ""}
                  onChange={handleSettingChange}
                  placeholder="https://..."
                  className="w-full px-4 py-2.5 bg-white border border-blue-200 rounded-lg focus:border-blue-500 outline-none text-sm font-mono text-slate-700"
                />
                {vrSettings.urlJersey && (
                  <img
                    src={vrSettings.urlJersey}
                    alt="Preview Jersey"
                    className="mt-3 w-full h-32 object-cover rounded-lg border border-blue-200"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                )}
              </div>

              {/* Medali Virtual */}
              <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
                <label className="block text-[11px] font-bold text-yellow-700 mb-1 uppercase tracking-wide">
                  🏅 URL Foto Medali Virtual
                </label>
                <p className="text-[10px] text-yellow-600 mb-2">
                  Ditampilkan di card &quot;Finisher Medal&quot; halaman /virtual-run
                </p>
                <input
                  type="url"
                  name="urlMedali"
                  value={vrSettings.urlMedali || ""}
                  onChange={handleSettingChange}
                  placeholder="https://..."
                  className="w-full px-4 py-2.5 bg-white border border-yellow-200 rounded-lg focus:border-yellow-500 outline-none text-sm font-mono text-slate-700"
                />
                {vrSettings.urlMedali && (
                  <img
                    src={vrSettings.urlMedali}
                    alt="Preview Medali"
                    className="mt-3 w-full h-32 object-cover rounded-lg border border-yellow-200"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
