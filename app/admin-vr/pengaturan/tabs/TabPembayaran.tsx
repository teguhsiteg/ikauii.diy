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

      {/* =========================================================
          SECTION 2: BOT TELEGRAM (VERIFIKASI & APPROVAL PEMBAYARAN)
      ========================================================= */}
      <div className="flex flex-col lg:flex-row gap-8 border-b border-slate-200 pb-10">
        {/* Kolom Kiri: Judul */}
        <div className="lg:w-1/3 shrink-0">
          <h3 className="text-base font-black text-slate-800 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-sky-50 text-[#0088cc] flex items-center justify-center shrink-0">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .37z" />
              </svg>
            </div>
            Bot Telegram Verifikasi
          </h3>
          <p className="text-sm text-slate-500 mt-2 leading-relaxed">
            Terima foto bukti transfer langsung di Telegram dan setujui pembayaran / terbitkan nomor BIB hanya dengan 1 kali klik.
          </p>
        </div>

        {/* Kolom Kanan: Input Token & Chat ID */}
        <div className="lg:w-2/3 space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">
                Telegram Bot Token
              </label>
              <input
                type="text"
                name="telegramBotToken"
                value={vrSettings.telegramBotToken || "8584533255:AAEi929fOZzYbmDmGUrQ4SjxFFZdz_bbV3s"}
                onChange={handleSettingChange}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#1A73E8] focus:ring-2 focus:ring-blue-100 outline-none text-sm font-mono transition-all"
                placeholder="8584533255:AAEi929fOZzYbmDmGUrQ4SjxFFZdz_bbV3s"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">
                Admin Chat ID / Group Chat ID
              </label>
              <input
                type="text"
                name="telegramChatId"
                value={vrSettings.telegramChatId || ""}
                onChange={handleSettingChange}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#1A73E8] focus:ring-2 focus:ring-blue-100 outline-none text-sm font-mono transition-all"
                placeholder="Contoh: 123456789 atau -100123456789"
              />
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                <span className="font-semibold text-slate-700">Tips:</span> Buka bot Telegram Anda lalu ketik command <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-700">/start</code> atau <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-700">/chatid</code> untuk mendapatkan Chat ID Anda secara otomatis.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
