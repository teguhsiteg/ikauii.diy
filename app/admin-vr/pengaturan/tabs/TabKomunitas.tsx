import React from "react";
import { Users, Gift, DollarSign, MessageCircle, Plus, Trash2 } from "lucide-react";

export default function TabKomunitas({
  vrSettings,
  handleSettingChange,
  addKomunitasRule,
  removeKomunitasRule,
  handleKomunitasRuleChange,
}: any) {
  const rules = vrSettings.komunitasRules || [];
  
  const uniqueJarak = Array.from(
    new Set(
      (vrSettings.offlinePackages || [])
        .map((pkg: any) => pkg.jarak?.toUpperCase())
        .filter(Boolean)
    )
  ) as string[];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* 1. Saklar On/Off Modul Komunitas */}
      <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </span>
            Pendaftaran Komunitas
          </h3>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            Aktifkan rute pendaftaran massal <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">/run/komunitas</span> dan tampilkan tombol banner komunitas di landing page utama.
          </p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer shrink-0">
          <input
            type="checkbox"
            name="isKomunitasEnabled"
            checked={vrSettings.isKomunitasEnabled !== false}
            onChange={handleSettingChange}
            className="sr-only peer"
          />
          <div className="w-14 h-7 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#1A73E8]"></div>
        </label>
      </div>

      {/* 2. Aturan Fleksibel Tiket Gratis & Minimal Anggota */}
      <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Gift className="w-4 h-4" />
              </span>
              Ketentuan Tiket Gratis & Minimal Anggota
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Tambahkan aturan promo sesuka Anda: minimal tiket berapa, jumlah free berapa, dan untuk kategori apa.
            </p>
          </div>
          <button
            type="button"
            onClick={addKomunitasRule}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors shadow-sm shrink-0 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Tambah Aturan Promo
          </button>
        </div>

        {/* Syarat Minimal Global Peserta File Excel */}
        <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
              Batas Minimal Peserta
            </label>
            <p className="text-[11px] text-slate-500">
              Jumlah minimal peserta yang wajib diunggah dalam satu file pendaftaran.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              name="komunitasMinPeserta"
              value={vrSettings.komunitasMinPeserta ?? 10}
              onChange={handleSettingChange}
              min={2}
              className="w-24 px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-800 focus:border-[#1A73E8] outline-none text-center"
            />
            <span className="text-xs font-bold text-slate-600">Orang</span>
          </div>
        </div>

        {/* Daftar Baris Aturan Custom */}
        <div className="space-y-4">
          {rules.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
              <Gift className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-600">Belum ada aturan promo tiket gratis</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Klik tombol "Tambah Aturan Promo" untuk menentukan bonus tiket gratis.
              </p>
            </div>
          ) : (
            rules.map((rule: any, idx: number) => (
              <div
                key={rule.id || idx}
                className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-emerald-300 transition-all shadow-sm relative group"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                    Aturan Promo #{idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeKomunitasRule(rule.id)}
                    className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                    title="Hapus Aturan"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Minimal Tiket */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Min. Peserta (Beli)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min={1}
                        value={rule.minPeserta ?? 10}
                        onChange={(e) =>
                          handleKomunitasRuleChange(
                            rule.id,
                            "minPeserta",
                            Number(e.target.value),
                          )
                        }
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-800 focus:bg-white focus:border-[#1A73E8] outline-none"
                        placeholder="10"
                      />
                      <span className="absolute right-3 top-2 text-xs text-slate-400 font-medium">
                        org
                      </span>
                    </div>
                  </div>

                  {/* Jumlah Free */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Dapat Gratis (Free)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min={1}
                        value={rule.freeCount ?? 1}
                        onChange={(e) =>
                          handleKomunitasRuleChange(
                            rule.id,
                            "freeCount",
                            Number(e.target.value),
                          )
                        }
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-emerald-600 focus:bg-white focus:border-emerald-500 outline-none"
                        placeholder="1"
                      />
                      <span className="absolute right-3 top-2 text-xs text-slate-400 font-medium">
                        tiket
                      </span>
                    </div>
                  </div>

                  {/* Kategori Target */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Kategori Tiket Free
                    </label>
                    <select
                      value={rule.targetKategori || "cheapest"}
                      onChange={(e) =>
                        handleKomunitasRuleChange(
                          rule.id,
                          "targetKategori",
                          e.target.value,
                        )
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:bg-white focus:border-[#1A73E8] outline-none"
                    >
                      <option value="cheapest">Termurah di Grup</option>
                      {uniqueJarak.map((jarak) => (
                        <option key={jarak} value={jarak}>Hanya Kategori {jarak}</option>
                      ))}
                      <option value="all">Bebas Semua Kategori</option>
                    </select>
                  </div>

                  {/* Model Perhitungan */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Model Perhitungan
                    </label>
                    <select
                      value={rule.isKelipatan ? "kelipatan" : "flat"}
                      onChange={(e) =>
                        handleKomunitasRuleChange(
                          rule.id,
                          "isKelipatan",
                          e.target.value === "kelipatan",
                        )
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:bg-white focus:border-[#1A73E8] outline-none"
                    >
                      <option value="kelipatan">Berlaku Kelipatan (Tiap N)</option>
                      <option value="flat">Flat (Sekali Klaim)</option>
                    </select>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                  <span>
                    Simulasi: Daftar{" "}
                    <strong className="text-slate-700">{rule.minPeserta} orang</strong>{" "}
                    {rule.isKelipatan ? "atau kelipatannya" : ""} otomatis dapat{" "}
                    <strong className="text-emerald-600">{rule.freeCount} tiket gratis</strong>{" "}
                    kategori{" "}
                    <span className="underline font-semibold">
                      {rule.targetKategori === "cheapest"
                        ? "Termurah di grup"
                        : rule.targetKategori === "all"
                          ? "Bebas pilih apa saja"
                          : rule.targetKategori}
                    </span>
                    .
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 3. Pengaturan Harga Tiket Komunitas */}
      <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
        <h3 className="text-base font-black text-slate-800 flex items-center gap-2 mb-2">
          <span className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
            <DollarSign className="w-4 h-4" />
          </span>
          Tarif Tiket Komunitas
        </h3>
        <p className="text-xs text-slate-500 mb-6">
          Tentukan harga dasar per peserta untuk masing-masing kategori jarak yang telah didaftarkan.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#F8F9FA] p-5 rounded-xl border border-slate-200">
          {uniqueJarak.length > 0 ? (
            uniqueJarak.map((jarak) => {
              const settingKey = `offlinePrice${jarak}`;
              return (
                <div key={jarak}>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1.5">
                    Harga Kategori {jarak} (Rp)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-400">
                      Rp
                    </span>
                    <input
                      type="number"
                      name={settingKey}
                      value={vrSettings[settingKey] || ""}
                      onChange={handleSettingChange}
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm font-mono font-bold text-slate-800 focus:border-[#1A73E8] outline-none"
                      placeholder="0"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Harga dasar per peserta untuk jarak {jarak}.
                  </p>
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-4 text-center">
              <p className="text-sm text-slate-500 font-medium">Belum ada kategori tiket (Jarak) yang terdaftar.</p>
              <p className="text-xs text-slate-400 mt-1">Silakan tambahkan Kategori Tiket di tab <b>Pengaturan Dasar</b> terlebih dahulu.</p>
            </div>
          )}
        </div>
      </div>

      {/* 4. Kontak & Pesan WhatsApp Konfirmasi */}
      <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
        <h3 className="text-base font-black text-slate-800 flex items-center gap-2 mb-2">
          <span className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <MessageCircle className="w-4 h-4" />
          </span>
          Kontak Konfirmasi WhatsApp Admin
        </h3>
        <p className="text-xs text-slate-500 mb-6">
          Nomor WhatsApp yang akan dihubungi oleh kapten setelah menyelesaikan proses submit pendaftaran komunitas.
        </p>

        <div className="bg-[#F8F9FA] p-5 rounded-xl border border-slate-200 space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1.5">
              Nomor WhatsApp Admin (Format 62xxx)
            </label>
            <input
              type="text"
              name="komunitasWaAdmin"
              value={vrSettings.komunitasWaAdmin || ""}
              onChange={handleSettingChange}
              placeholder="Contoh: 6285179594146"
              className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-800 focus:border-[#1A73E8] outline-none"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Jika dikosongkan, sistem akan menggunakan nomor default helpdesk admin.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
