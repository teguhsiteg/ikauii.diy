import React from "react";
import { Heart, CheckCircle2, XCircle } from "lucide-react";

export default function TabCharity({ vrSettings, handleSettingChange }: any) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 border-slate-200 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="lg:col-span-4">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <Heart className="w-5 h-5 text-rose-500" />
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
            <div className="flex items-center gap-1.5 mt-1">
              {vrSettings.isCharityActive ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <p className="text-xs text-emerald-600 font-medium">Sedang Aktif di Homepage</p>
                </>
              ) : (
                <>
                  <XCircle className="w-3.5 h-3.5 text-slate-400" />
                  <p className="text-xs text-slate-500 font-medium">Disembunyikan dari Publik</p>
                </>
              )}
            </div>
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
      </div>
    </div>
  );
}
