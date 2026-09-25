import React, { useState } from "react";
import TabCharity from "./TabCharity";
import TabPembayaran from "./TabPembayaran";
import { Plus, Trash2, HelpCircle, ChevronDown, ChevronUp } from "lucide-react";

export default function TabGlobal({
  vrSettings,
  handleSettingChange,
  // Pembayaran
  selectPaymentMethod,

  // FAQ
  addFaq,
  removeFaq,
  handleFaqChange,
  addSosmed,
  removeSosmed,
  handleSosmedChange,
}: any) {
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  const toggleFaq = (id: string) => {
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* 1. Mode Ruang Tunggu (Waiting Room) */}
      <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
            Mode Ruang Tunggu
          </h3>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            Aktifkan fitur antrean virtual ini untuk mencegah server down saat terjadi lonjakan pengunjung (Ticket War) di awal pendaftaran dibuka.
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
          <div className="w-14 h-7 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#1A73E8]"></div>
        </label>
      </div>

      {/* 2. Sosial Media & Komunitas */}
      <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </span>
            Sosial Media
          </h3>
          <button
            type="button"
            onClick={addSosmed}
            className="bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" /> Tambah
          </button>
        </div>
        
        <div className="space-y-4">
          {!vrSettings.sosmeds || vrSettings.sosmeds.length === 0 ? (
            <div className="text-center py-6 text-slate-500 text-sm bg-slate-50 rounded-xl border border-dashed border-slate-200">
              Belum ada Sosial Media yang ditambahkan.
            </div>
          ) : (
            vrSettings.sosmeds.map((sosmed: any) => (
              <div key={sosmed.id} className="flex flex-col sm:flex-row items-center gap-3 p-3 border border-slate-200 rounded-xl bg-slate-50 relative group">
                <div className="w-full sm:w-1/3">
                  <select
                    value={sosmed.platform}
                    onChange={(e) => handleSosmedChange(sosmed.id, "platform", e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-[#1A73E8] text-sm text-slate-700"
                  >
                    <option value="" disabled>Pilih Platform</option>
                    <option value="Instagram">Instagram</option>
                    <option value="Facebook">Facebook</option>
                    <option value="YouTube">YouTube</option>
                    <option value="TikTok">TikTok</option>
                    <option value="Threads">Threads</option>
                    <option value="X">X / Twitter</option>
                    <option value="Website">Website / Lainnya</option>
                  </select>
                </div>
                <div className="w-full sm:w-flex-1 flex-1">
                  <input
                    type="url"
                    value={sosmed.url}
                    onChange={(e) => handleSosmedChange(sosmed.id, "url", e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-[#1A73E8] text-sm"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeSosmed(sosmed.id)}
                  className="p-2 text-slate-400 hover:text-red-500 bg-white border border-slate-200 rounded-lg hover:border-red-200 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 3. Charity */}
      <div className="pt-4">
        <TabCharity vrSettings={vrSettings} handleSettingChange={handleSettingChange} />
      </div>

      {/* 4. Pembayaran */}
      <div className="pt-4 border-t border-slate-100">
        <TabPembayaran 
          vrSettings={vrSettings}
          selectPaymentMethod={selectPaymentMethod}
          handleSettingChange={handleSettingChange}

        />
      </div>

      {/* 5. FAQ Global */}
      <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm mt-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <HelpCircle className="w-4 h-4" />
              </span>
              FAQ Global
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Pertanyaan yang sering diajukan. Akan tampil di halaman utama Run & Virtual Run.
            </p>
          </div>
          <button
            type="button"
            onClick={addFaq}
            className="bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" /> Tambah FAQ
          </button>
        </div>

        <div className="space-y-4">
          {!vrSettings.faqs || vrSettings.faqs.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm bg-slate-50 rounded-xl border border-dashed border-slate-200">
              Belum ada FAQ yang ditambahkan.
            </div>
          ) : (
            vrSettings.faqs.map((faq: any, index: number) => (
              <div key={faq.id} className="border border-slate-200 rounded-xl bg-white overflow-hidden shadow-sm">
                <div 
                  className="p-4 bg-slate-50 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => toggleFaq(faq.id)}
                >
                  <div className="flex items-center gap-3 flex-1 overflow-hidden">
                    <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 text-xs font-bold flex items-center justify-center shrink-0">
                      {index + 1}
                    </span>
                    <span className="font-semibold text-slate-700 text-sm truncate">
                      {faq.question || "Pertanyaan Baru..."}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFaq(faq.id);
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Hapus FAQ"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="p-1.5 text-slate-400">
                      {expandedFaq === faq.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {expandedFaq === faq.id && (
                  <div className="p-4 border-t border-slate-100 space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Pertanyaan</label>
                      <input
                        type="text"
                        value={faq.question}
                        onChange={(e) => handleFaqChange(faq.id, "question", e.target.value)}
                        placeholder="Contoh: Kapan pendaftaran ditutup?"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-indigo-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Jawaban</label>
                      <textarea
                        value={faq.answer}
                        onChange={(e) => handleFaqChange(faq.id, "answer", e.target.value)}
                        placeholder="Jawaban dari pertanyaan di atas..."
                        rows={3}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-indigo-500 text-sm resize-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
