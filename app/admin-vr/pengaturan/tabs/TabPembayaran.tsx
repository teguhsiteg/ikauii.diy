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
          SECTION 2: MANAJEMEN PROMO KODE
      ========================================================= */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Kolom Kiri: Judul */}
        <div className="lg:w-1/3 shrink-0">
          <h3 className="text-base font-black text-slate-800 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
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
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                />
              </svg>
            </div>
            Manajemen Promo
          </h3>
          <p className="text-sm text-slate-500 mt-2 leading-relaxed">
            Buat kode diskon untuk event ini. Anda bisa mengatur limit kuota dan
            batas waktu kedaluwarsa.
          </p>
        </div>

        {/* Kolom Kanan: Form & Daftar Promo */}
        <div className="lg:w-2/3 space-y-8">
          {/* FORM TAMBAH PROMO - CLEAN LAYOUT */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
            <h4 className="text-sm font-black text-slate-800 mb-6 border-b border-slate-100 pb-3">
              Buat Promo Baru
            </h4>

            <div className="space-y-6">
              {/* Baris 1: Kode Unik Full Width */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">
                  Kode Unik Promo
                </label>
                <input
                  type="text"
                  value={newPromo.kode}
                  onChange={(e) =>
                    setNewPromo({ ...newPromo, kode: e.target.value })
                  }
                  placeholder="Contoh: IKAUIIDISKON"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm uppercase font-black focus:ring-2 focus:ring-[#1A73E8] focus:border-[#1A73E8] outline-none transition-all placeholder:font-normal"
                />
              </div>

              {/* Baris 2: Diskon */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">
                    Tipe Diskon
                  </label>
                  <select
                    value={newPromo.jenisDiskon}
                    onChange={(e) =>
                      setNewPromo({ ...newPromo, jenisDiskon: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#1A73E8] focus:border-[#1A73E8] outline-none transition-all"
                  >
                    <option value="persen">Persen (%)</option>
                    <option value="nominal">Nominal (Rp)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">
                    Nilai Diskon
                  </label>
                  <input
                    type="number"
                    value={newPromo.nilaiDiskon}
                    onChange={(e) =>
                      setNewPromo({
                        ...newPromo,
                        nilaiDiskon: Number(e.target.value),
                      })
                    }
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-[#1A73E8] focus:border-[#1A73E8] outline-none transition-all"
                    placeholder="Contoh: 10 atau 50000"
                  />
                </div>
              </div>

              {/* Baris 3: Limit */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">
                    Batas Kuota (0 = Tanpa Batas)
                  </label>
                  <input
                    type="number"
                    value={newPromo.kuotaMaksimal}
                    onChange={(e) =>
                      setNewPromo({
                        ...newPromo,
                        kuotaMaksimal: Number(e.target.value),
                      })
                    }
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-[#1A73E8] focus:border-[#1A73E8] outline-none transition-all"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">
                    Tanggal Kedaluwarsa
                  </label>
                  <input
                    type="date"
                    value={newPromo.tanggalKedaluwarsa}
                    onChange={(e) =>
                      setNewPromo({
                        ...newPromo,
                        tanggalKedaluwarsa: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#1A73E8] focus:border-[#1A73E8] outline-none transition-all"
                  />
                </div>
              </div>

              {/* Baris 4: Kategori */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">
                  Berlaku Khusus Kategori
                </label>
                <select
                  value={newPromo.kategoriKhusus}
                  onChange={(e) =>
                    setNewPromo({ ...newPromo, kategoriKhusus: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#1A73E8] focus:border-[#1A73E8] outline-none transition-all"
                >
                  <option value="All">Semua Kategori Jarak</option>
                  {vrSettings.allowedCategories?.map((cat: string) => (
                    <option key={cat} value={cat}>
                      Khusus {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                type="button"
                onClick={handleAddPromo}
                disabled={isSavingPromo}
                className="bg-[#0B2239] hover:bg-slate-800 text-white font-bold py-3.5 px-8 rounded-xl text-sm disabled:opacity-50 shadow-md transition-all w-full sm:w-auto"
              >
                {isSavingPromo ? "Menyimpan..." : "Simpan Promo Baru"}
              </button>
            </div>
          </div>

          {/* DAFTAR PROMO AKTIF */}
          <div className="space-y-4">
            {promoCodes.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
                <p className="text-sm text-slate-400 font-bold">
                  Belum ada kode promo yang ditambahkan.
                </p>
              </div>
            ) : (
              promoCodes.map((promo: any) => (
                <div
                  key={promo.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-6 rounded-2xl border transition-all ${promo.isActive ? "bg-white border-slate-200 shadow-sm" : "bg-slate-50 border-slate-200 opacity-60"}`}
                >
                  <div className="mb-4 sm:mb-0">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="font-black text-xl text-slate-800 tracking-tight">
                        {promo.kode}
                      </span>
                      <span
                        className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${promo.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}
                      >
                        {promo.isActive ? "Aktif" : "Nonaktif"}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-slate-600">
                      <span className="bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                        Diskon:{" "}
                        <b>
                          {promo.jenisDiskon === "persen"
                            ? `${promo.nilaiDiskon}%`
                            : `Rp ${promo.nilaiDiskon.toLocaleString("id-ID")}`}
                        </b>
                      </span>
                      <span className="bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                        Kuota:{" "}
                        <b>
                          {promo.kuotaTerpakai} /{" "}
                          {promo.kuotaMaksimal === 0
                            ? "∞"
                            : promo.kuotaMaksimal}
                        </b>
                      </span>
                      <span className="bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                        Target:{" "}
                        <b>
                          {promo.kategoriKhusus === "All"
                            ? "Semua"
                            : promo.kategoriKhusus}
                        </b>
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        handleTogglePromoStatus(promo.id, promo.isActive)
                      }
                      className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all w-full sm:w-auto shadow-sm ${promo.isActive ? "bg-amber-100 text-amber-700 hover:bg-amber-200" : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"}`}
                    >
                      {promo.isActive ? "Matikan" : "Aktifkan"}
                    </button>
                    <button
                      onClick={() => handleDeletePromo(promo.id, promo.kode)}
                      className="px-5 py-2.5 bg-rose-100 text-rose-600 rounded-xl text-xs font-bold hover:bg-rose-200 transition-all w-full sm:w-auto shadow-sm"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
