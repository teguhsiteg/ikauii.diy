export default function TabPembayaran({
  vrSettings,
  selectPaymentMethod,
  handleSettingChange,
  promoCodes,
  newPromo,
  setNewPromo,
  handleAddPromo,
  handleTogglePromoStatus,
  handleDeletePromo,
  isSavingPromo,
}: any) {
  return (
    <div className="space-y-12 animate-in fade-in duration-300">
      {/* =========================================================
          SECTION 1: METODE PEMBAYARAN
      ========================================================= */}
      <div className="flex flex-col lg:flex-row gap-8 border-b border-slate-200 pb-10">
        {/* Kolom Kiri: Judul */}
        <div className="lg:w-1/3 shrink-0">
          <h3 className="text-base font-black text-slate-800 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-50 text-[#1A73E8] flex items-center justify-center shrink-0">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" />
              </svg>
            </div>
            Metode Pembayaran
          </h3>
          <p className="text-sm text-slate-500 mt-2 leading-relaxed">
            Pilih gerbang pembayaran utama yang akan digunakan oleh peserta saat
            checkout.
          </p>
        </div>

        {/* Kolom Kanan: Konten */}
        <div className="lg:w-2/3 space-y-6">
          {/* Pilihan Metode */}
          <div className="grid grid-cols-3 gap-3 md:gap-4">
            {/* Midtrans */}
            <div
              onClick={() => selectPaymentMethod("midtrans")}
              className={`cursor-pointer border-2 rounded-2xl p-4 text-center transition-all ${
                vrSettings.metodePembayaran === "midtrans"
                  ? "border-[#1A73E8] bg-blue-50 text-[#1A73E8]"
                  : "border-slate-200 bg-white text-slate-500 hover:border-blue-300"
              }`}
            >
              <span className="text-xs md:text-sm font-bold uppercase tracking-wide">
                Midtrans
              </span>
            </div>
            {/* Manual */}
            <div
              onClick={() => selectPaymentMethod("manual")}
              className={`cursor-pointer border-2 rounded-2xl p-4 text-center transition-all ${
                vrSettings.metodePembayaran === "manual"
                  ? "border-[#1E8E3E] bg-green-50 text-[#1E8E3E]"
                  : "border-slate-200 bg-white text-slate-500 hover:border-green-300"
              }`}
            >
              <span className="text-xs md:text-sm font-bold uppercase tracking-wide">
                Manual
              </span>
            </div>
            {/* QRIS */}
            <div
              onClick={() => selectPaymentMethod("qris")}
              className={`cursor-pointer border-2 rounded-2xl p-4 text-center transition-all ${
                vrSettings.metodePembayaran === "qris"
                  ? "border-[#A142F4] bg-purple-50 text-[#A142F4]"
                  : "border-slate-200 bg-white text-slate-500 hover:border-purple-300"
              }`}
            >
              <span className="text-xs md:text-sm font-bold uppercase tracking-wide">
                QRIS
              </span>
            </div>
          </div>

          {/* Form Midtrans */}
          {vrSettings.metodePembayaran === "midtrans" && (
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center justify-between bg-slate-50 p-5 rounded-xl border border-slate-100">
                <div>
                  <p className="font-bold text-slate-800 text-sm">
                    Mode Sandbox (Testing)
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Matikan untuk masuk ke mode Live/Production
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    name="isProduction"
                    checked={vrSettings.isProduction || false}
                    onChange={handleSettingChange}
                    className="sr-only peer"
                  />
                  <div className="w-14 h-7 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#1E8E3E]"></div>
                </label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">
                    Client Key
                  </label>
                  <input
                    type="text"
                    name="midtransClientKey"
                    value={vrSettings.midtransClientKey || ""}
                    onChange={handleSettingChange}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#1A73E8] focus:ring-2 focus:ring-blue-100 outline-none text-sm font-mono transition-all"
                    placeholder="SB-Mid-client-..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">
                    Server Key
                  </label>
                  <input
                    type="password"
                    name="midtransServerKey"
                    value={vrSettings.midtransServerKey || ""}
                    onChange={handleSettingChange}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#1A73E8] focus:ring-2 focus:ring-blue-100 outline-none text-sm font-mono transition-all"
                    placeholder="••••••••••••••••"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Form Manual */}
          {vrSettings.metodePembayaran === "manual" && (
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">
                    Nama Bank
                  </label>
                  <input
                    type="text"
                    name="manualBank"
                    value={vrSettings.manualBank || ""}
                    onChange={handleSettingChange}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#1A73E8] focus:ring-2 focus:ring-blue-100 outline-none text-sm font-bold uppercase transition-all"
                    placeholder="BCA / BSI / MANDIRI"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">
                    Nomor Rekening
                  </label>
                  <input
                    type="text"
                    name="manualRekening"
                    value={vrSettings.manualRekening || ""}
                    onChange={handleSettingChange}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#1A73E8] focus:ring-2 focus:ring-blue-100 outline-none text-sm font-mono transition-all"
                    placeholder="1234567890"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">
                    Atas Nama (Pemilik Rekening)
                  </label>
                  <input
                    type="text"
                    name="manualNama"
                    value={vrSettings.manualNama || ""}
                    onChange={handleSettingChange}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#1A73E8] focus:ring-2 focus:ring-blue-100 outline-none text-sm uppercase font-bold transition-all"
                    placeholder="IKA UII DIY"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Form QRIS */}
          {vrSettings.metodePembayaran === "qris" && (
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">
                  URL Gambar Barcode QRIS
                </label>
                <input
                  type="text"
                  name="urlQris"
                  value={vrSettings.urlQris || ""}
                  onChange={handleSettingChange}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#1A73E8] focus:ring-2 focus:ring-blue-100 outline-none text-sm font-mono transition-all"
                  placeholder="https://ikadiy.uii.ac.id/qris.jpg"
                />
              </div>
            </div>
          )}
        </div>
      </div>


    </div>
  );
}
