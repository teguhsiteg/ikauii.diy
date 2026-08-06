export default function TabCharity({ vrSettings, handleSettingChange }: any) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 border-slate-200 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="lg:col-span-4">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <svg
            className="w-5 h-5 text-slate-400"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
          Sesi Charity & Aset
        </h3>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
          Kelola fitur penggalangan dana dan sertifikat/aset digital.
        </p>
      </div>

      <div className="lg:col-span-8 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
        <div className="flex items-center justify-between bg-slate-50 p-4 rounded-lg border border-slate-200 mb-2">
          <div>
            <h4 className="text-sm font-bold text-slate-800">
              Status Fitur Charity
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              {vrSettings.isCharityActive
                ? "🟢 Sedang Aktif di Homepage"
                : "⚫ Disembunyikan dari Publik"}
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              name="isCharityActive"
              checked={vrSettings.isCharityActive || false}
              onChange={(e) =>
                handleSettingChange({
                  target: { name: "isCharityActive", value: e.target.checked },
                })
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1E8E3E]"></div>
          </label>
        </div>

        <div
          className={`space-y-5 transition-opacity duration-300 ${!vrSettings.isCharityActive ? "opacity-40 pointer-events-none" : "opacity-100"}`}
        >
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase">
              Judul Sesi Charity
            </label>
            <input
              type="text"
              name="charityTitle"
              value={vrSettings.charityTitle || ""}
              onChange={handleSettingChange}
              className="w-full px-4 py-2.5 bg-[#F8F9FA] border border-slate-200 rounded-lg focus:bg-white focus:border-[#1A73E8] outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase">
              Deskripsi Charity
            </label>
            <textarea
              name="charityDesc"
              value={vrSettings.charityDesc || ""}
              onChange={handleSettingChange}
              rows={2}
              className="w-full px-4 py-2.5 bg-[#F8F9FA] border border-slate-200 rounded-lg focus:bg-white focus:border-[#1A73E8] outline-none text-sm custom-scrollbar"
            ></textarea>
          </div>
          <div className="pt-4 border-t border-slate-100">
            <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase">
              Minimal Donasi (Rp)
            </label>
            <input
              type="number"
              name="minCharity"
              value={vrSettings.minCharity || 0}
              onChange={handleSettingChange}
              className="w-full md:w-1/2 px-4 py-2.5 bg-[#F8F9FA] border border-slate-200 rounded-lg focus:bg-white focus:border-[#1A73E8] outline-none text-sm font-mono"
            />
          </div>
        </div>

        {vrSettings.isOfflineRunEnabled && (
          <div className="pt-6 border-t border-slate-200 mt-4 space-y-5 relative">
            <div>
              <h4 className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1 border-b border-slate-100 pb-2">
                Aset Digital Offline Run
              </h4>
              <p className="text-[11px] text-slate-500 mt-2 mb-4 leading-relaxed">
                URL untuk <strong>gambar BIB</strong> dan <strong>template E-Sertifikat</strong> offline.
                Untuk gambar jersey & medali, atur di Tab <strong>Offline → Gambar Race Pack</strong>.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* BIB Offline */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase">
                  URL Gambar BIB Offline
                </label>
                <input
                  type="url"
                  name="urlBibOffline"
                  value={vrSettings.urlBibOffline || ""}
                  onChange={handleSettingChange}
                  placeholder="https://..."
                  className="w-full px-4 py-2.5 bg-[#F8F9FA] border border-slate-200 rounded-lg focus:bg-white focus:border-emerald-500 outline-none text-sm font-mono"
                />
              </div>

              {/* Sertifikat Offline */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase">
                  URL E-Sertifikat Offline
                </label>
                <input
                  type="url"
                  name="urlSertifikatOffline"
                  value={vrSettings.urlSertifikatOffline || ""}
                  onChange={handleSettingChange}
                  className="w-full px-4 py-2.5 bg-[#F8F9FA] border border-slate-200 rounded-lg focus:bg-white focus:border-emerald-500 outline-none text-sm font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5 pt-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase">
                  Judul Utama Sertifikat
                </label>
                <input
                  type="text"
                  name="offlineCertTitle"
                  value={vrSettings.offlineCertTitle || ""}
                  onChange={handleSettingChange}
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:border-emerald-500 outline-none text-sm font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase">
                  Sub Judul
                </label>
                <input
                  type="text"
                  name="offlineCertSubtitle"
                  value={vrSettings.offlineCertSubtitle || ""}
                  onChange={handleSettingChange}
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:border-emerald-500 outline-none text-sm"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
