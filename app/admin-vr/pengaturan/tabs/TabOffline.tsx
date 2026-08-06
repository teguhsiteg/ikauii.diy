export default function TabOffline({
  vrSettings,
  handleSettingChange,
  handleCategoryToggle,
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
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5-2.5-1.12 2.5-2.5 2.5z" />
          </svg>
          Setup Offline Run
        </h3>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
          Manajemen landing page khusus pendaftaran Offline Run, lokasi venue,
          harga tiket, dan konfigurasi kuota peserta.
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
          <>
            <div className="space-y-5 pt-4 border-t border-slate-100">
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

            <div className="space-y-5 pt-4 border-t border-slate-100">
              <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                Info Waktu & Tempat
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
                    Jam Kumpul
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
                    Total Kuota (0=Tak Terbatas)
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

            <div className="pt-6 border-t border-slate-100 mt-6 space-y-5">
              <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                Status Pendaftaran (Manual Override)
              </h4>

              {/* Selector */}
              <div className="bg-[#F8F9FA] p-4 rounded-lg border border-slate-200">
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase">
                  Kontrol Status Halaman Pendaftaran Offline
                </label>
                <select
                  name="offlineStatus"
                  value={vrSettings.offlineStatus || "auto"}
                  onChange={handleSettingChange}
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-md focus:border-[#1A73E8] outline-none text-sm font-bold text-[#0B2239]"
                >
                  <option value="auto">🤖  Otomatis — Ikuti tanggal buka/tutup</option>
                  <option value="preview">👁️  Preview — Halaman tampil, tombol daftar dikunci</option>
                  <option value="buka">✅  Buka Paksa — Pendaftaran dibuka penuh (abaikan tanggal)</option>
                  <option value="coming_soon">⏳  Coming Soon — Tampil layar "Segera Dibuka"</option>
                  <option value="tutup">🔒  Tutup Total — Halaman ditutup sepenuhnya</option>
                </select>
              </div>

              {/* Info Card sesuai status aktif */}
              {(vrSettings.offlineStatus === "auto" || !vrSettings.offlineStatus) && (
                <div className="flex gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <span className="text-lg shrink-0">🤖</span>
                  <div>
                    <p className="text-xs font-bold text-blue-700">Mode Otomatis</p>
                    <p className="text-[11px] text-blue-600 mt-0.5 leading-relaxed">
                      Halaman /run akan membuka atau menutup sendiri sesuai <strong>Waktu Buka</strong> dan <strong>Batas Penutupan</strong> yang Anda set di bawah. Tidak perlu ubah status manual.
                    </p>
                  </div>
                </div>
              )}
              {vrSettings.offlineStatus === "preview" && (
                <div className="flex gap-3 p-3 bg-amber-50 border border-amber-300 rounded-lg">
                  <span className="text-lg shrink-0">👁️</span>
                  <div>
                    <p className="text-xs font-bold text-amber-700">Mode Preview (Tampil Tanpa Daftar)</p>
                    <p className="text-[11px] text-amber-600 mt-0.5 leading-relaxed">
                      Halaman /run <strong>bisa dilihat publik</strong> lengkap dengan info event, paket, dan race pack — tapi <strong>tombol "Daftar" dikunci</strong> dan tidak bisa diklik. Ideal untuk promosi sebelum pendaftaran resmi dibuka.
                    </p>
                  </div>
                </div>
              )}
              {vrSettings.offlineStatus === "buka" && (
                <div className="flex gap-3 p-3 bg-emerald-50 border border-emerald-300 rounded-lg">
                  <span className="text-lg shrink-0">✅</span>
                  <div>
                    <p className="text-xs font-bold text-emerald-700">Mode Buka Paksa</p>
                    <p className="text-[11px] text-emerald-600 mt-0.5 leading-relaxed">
                      Pendaftaran <strong>dibuka penuh</strong> dan peserta bisa langsung mendaftar. Tanggal buka/tutup di bawah diabaikan selama mode ini aktif.
                    </p>
                  </div>
                </div>
              )}
              {vrSettings.offlineStatus === "coming_soon" && (
                <div className="flex gap-3 p-3 bg-purple-50 border border-purple-300 rounded-lg">
                  <span className="text-lg shrink-0">⏳</span>
                  <div>
                    <p className="text-xs font-bold text-purple-700">Mode Coming Soon</p>
                    <p className="text-[11px] text-purple-600 mt-0.5 leading-relaxed">
                      Pengunjung akan melihat <strong>layar "Segera Dibuka"</strong> dengan countdown timer. Halaman utama event tidak bisa diakses.
                    </p>
                  </div>
                </div>
              )}
              {vrSettings.offlineStatus === "tutup" && (
                <div className="flex gap-3 p-3 bg-rose-50 border border-rose-300 rounded-lg">
                  <span className="text-lg shrink-0">🔒</span>
                  <div>
                    <p className="text-xs font-bold text-rose-700">Mode Tutup Total</p>
                    <p className="text-[11px] text-rose-600 mt-0.5 leading-relaxed">
                      Halaman /run menampilkan layar <strong>"Pendaftaran Ditutup"</strong>. Tidak ada yang bisa dilihat atau didaftarkan.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-slate-100 mt-6 space-y-5">
              <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                Timeline Offline
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
                    Batas Penutupan (End)
                  </label>
                  <input
                    type="datetime-local"
                    name="offlineTanggalPenutupan"
                    value={vrSettings.offlineTanggalPenutupan || ""}
                    onChange={handleSettingChange}
                    className="w-full px-4 py-2.5 bg-rose-50 border border-rose-200 rounded-lg focus:bg-white focus:border-rose-500 outline-none text-sm text-rose-800"
                  />
                </div>
              </div>
            </div>

            {/* 🔥 RACE PACK OFFLINE — GAMBAR JERSEY & MEDALI 🔥 */}
            <div className="pt-6 border-t border-slate-100 mt-6 space-y-5">
              <div>
                <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-widest mb-1 flex items-center gap-2">
                  <span>👕</span> Gambar Race Pack Offline
                </h4>
                <p className="text-[11px] text-slate-500 mb-4 leading-relaxed">
                  URL gambar jersey dan medali yang ditampilkan di halaman{" "}
                  <code className="bg-slate-100 px-1 py-0.5 rounded text-[10px] font-mono">/run</code>{" "}
                  bagian <strong>Race Pack & Fasilitas</strong>. Gunakan link gambar publik (Google Drive, Imgur, dll).
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Jersey Offline */}
                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
                  <label className="block text-[11px] font-bold text-emerald-700 mb-1 uppercase tracking-wide">
                    👕 URL Foto Jersey Offline
                  </label>
                  <p className="text-[10px] text-emerald-600 mb-2">
                    Ditampilkan di card "Runner Dry-Fit Jersey" halaman /run
                  </p>
                  <input
                    type="url"
                    name="urlJerseyOffline"
                    value={vrSettings.urlJerseyOffline || ""}
                    onChange={handleSettingChange}
                    placeholder="https://..."
                    className="w-full px-4 py-2.5 bg-white border border-emerald-200 rounded-lg focus:border-emerald-500 outline-none text-sm font-mono text-slate-700"
                  />
                  {vrSettings.urlJerseyOffline && (
                    <img
                      src={vrSettings.urlJerseyOffline}
                      alt="Preview Jersey Offline"
                      className="mt-3 w-full h-32 object-cover rounded-lg border border-emerald-200"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  )}
                </div>

                {/* Medali Offline */}
                <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
                  <label className="block text-[11px] font-bold text-yellow-700 mb-1 uppercase tracking-wide">
                    🏅 URL Foto Medali Offline
                  </label>
                  <p className="text-[10px] text-yellow-600 mb-2">
                    Ditampilkan di card "Finisher Medal" halaman /run
                  </p>
                  <input
                    type="url"
                    name="urlMedaliOffline"
                    value={vrSettings.urlMedaliOffline || ""}
                    onChange={handleSettingChange}
                    placeholder="https://..."
                    className="w-full px-4 py-2.5 bg-white border border-yellow-200 rounded-lg focus:border-yellow-500 outline-none text-sm font-mono text-slate-700"
                  />
                  {vrSettings.urlMedaliOffline && (
                    <img
                      src={vrSettings.urlMedaliOffline}
                      alt="Preview Medali Offline"
                      className="mt-3 w-full h-32 object-cover rounded-lg border border-yellow-200"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* 🔥 PAKET KOMERSIAL OFFLINE (TANPA MAPS) 🔥 */}
            <div className="pt-6 border-t border-slate-100 mt-6 space-y-6">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest mb-4">
                Kategori Tiket & Harga
              </h4>
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
                    ✕ Hapus
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
                          handlePackageChange(
                            "offline",
                            pkg.id,
                            "isHighlight",
                            e.target.checked,
                          )
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
                      <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">
                        Nama Kategori
                      </label>
                      <input
                        type="text"
                        value={pkg.nama}
                        onChange={(e) =>
                          handlePackageChange(
                            "offline",
                            pkg.id,
                            "nama",
                            e.target.value,
                          )
                        }
                        placeholder="Early Bird"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm outline-none focus:border-[#1A73E8]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">
                        Jarak
                      </label>
                      <input
                        type="text"
                        value={pkg.jarak}
                        onChange={(e) =>
                          handlePackageChange(
                            "offline",
                            pkg.id,
                            "jarak",
                            e.target.value,
                          )
                        }
                        placeholder="10K"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm outline-none focus:border-[#1A73E8]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">
                        Kuota (0=Unlimited)
                      </label>
                      <input
                        type="number"
                        value={pkg.kuota}
                        onChange={(e) =>
                          handlePackageChange(
                            "offline",
                            pkg.id,
                            "kuota",
                            Number(e.target.value),
                          )
                        }
                        placeholder="100"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm outline-none focus:border-[#1A73E8] font-mono"
                        required
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">
                        Harga (Rp)
                      </label>
                      <input
                        type="number"
                        value={pkg.harga}
                        onChange={(e) =>
                          handlePackageChange(
                            "offline",
                            pkg.id,
                            "harga",
                            Number(e.target.value),
                          )
                        }
                        placeholder="200000"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm outline-none focus:border-[#1A73E8] font-mono"
                        required
                      />
                    </div>
                  </div>

                  {/* Benefit Diterima dibikin full width biar rapi */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">
                      Benefit Diterima
                    </label>
                    <input
                      type="text"
                      value={pkg.benefit}
                      onChange={(e) =>
                        handlePackageChange(
                          "offline",
                          pkg.id,
                          "benefit",
                          e.target.value,
                        )
                      }
                      placeholder="Jersey, Medali Fisik, BIB"
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
                          handlePackageChange("offline", pkg.id, "isEarlyBird", e.target.checked)
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
                            onChange={(e) => handlePackageChange("offline", pkg.id, "earlyBirdHarga", Number(e.target.value))}
                            placeholder="150000"
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
                            onChange={(e) => handlePackageChange("offline", pkg.id, "earlyBirdTarget", Number(e.target.value))}
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
                            onChange={(e) => handlePackageChange("offline", pkg.id, "earlyBirdEndDate", e.target.value)}
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
                onClick={() => addPackage("offline")}
                className="w-full py-2.5 border border-dashed border-[#1A73E8] text-[#1A73E8] rounded-lg text-sm font-bold hover:bg-[#E8F0FE] transition-colors flex items-center justify-center gap-2"
              >
                <span>+</span> Tambah Kategori Tiket
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
