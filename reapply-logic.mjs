import fs from "fs";

const path = "app/virtual-run/register/page.tsx";
let content = fs.readFileSync(path, "utf-8");

// 1. Add isAlamatChecked state
content = content.replace(
  `const [isSyaratChecked, setIsSyaratChecked] = useState<boolean>(false);`,
  `const [isSyaratChecked, setIsSyaratChecked] = useState<boolean>(false);\n  const [isAlamatChecked, setIsAlamatChecked] = useState<boolean>(false);`
);

// 2. Update isFormLengkap
content = content.replace(
  `isGrupChecked &&\n    isSyaratChecked;`,
  `isGrupChecked &&\n    isSyaratChecked &&\n    (!perluOngkir || isAlamatChecked);`
);

// 3. Update setOngkirReal(data.cost || 0)
content = content.replace(
  `setOngkirReal(data.cost);`,
  `setOngkirReal(data.cost || 0);`
);

// 4. Update Kode Pos input
content = content.replace(
  `onChange={(e) => setFormData({ ...formData, kodePos: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none text-sm transition-all text-slate-800"
                        placeholder="Misal: 55581"`,
  `onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, "");
                          setFormData({ ...formData, kodePos: val });
                        }}
                        pattern="[0-9]{5}"
                        maxLength={5}
                        minLength={5}
                        inputMode="numeric"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none text-sm transition-all text-slate-800"
                        placeholder="Misal: 55581"
                      />
                      <p className="text-[10px] text-slate-500 mt-1.5 ml-1">Harus tepat 5 digit angka</p>`
);
// Fix the closing tag we accidentally removed
content = content.replace(
  `placeholder="Misal: 55581"\n                      />\n                      <p className="text-[10px] text-slate-500 mt-1.5 ml-1">Harus tepat 5 digit angka</p>\n                      />`,
  `placeholder="Misal: 55581"\n                      />\n                      <p className="text-[10px] text-slate-500 mt-1.5 ml-1">Harus tepat 5 digit angka</p>`
);

// 5. Update Alamat Detail textarea
content = content.replace(
  `<textarea
                        required
                        rows={2}
                        value={formData.alamat}
                        onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none text-sm transition-all text-slate-800 resize-none"
                        placeholder="Tulis alamat pengiriman dengan jelas..."
                      />`,
  `<textarea
                        required
                        rows={3}
                        minLength={15}
                        value={formData.alamat}
                        onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none text-sm transition-all text-slate-800 resize-none"
                        placeholder="Misal: Jl. Kaliurang KM 14.5, Perumahan Merapi Indah Blok C No. 12, RT 04/RW 05, Patokan: Samping Masjid Al-Huda"
                      />
                      <p className="text-[10px] text-red-500/80 font-medium mt-1.5 ml-1">
                        * Pastikan alamat ditulis selengkap mungkin beserta nomor rumah dan patokan. Alamat yang salah/tidak lengkap dapat menyebabkan paket gagal dikirim oleh kurir.
                      </p>`
);

// 6. Add isAlamatChecked Checkbox at the end before "KOLOM KANAN"
content = content.replace(
  `              </div>\n            </div>\n          </div>\n        </div>\n\n        {/* KOLOM KANAN (RINGKASAN & SUBMIT - STICKY) */}`,
  `              </div>
              {perluOngkir && (
                <div className="flex items-start gap-3 bg-rose-50 p-4 rounded-xl border border-rose-200 hover:bg-rose-100 transition-colors animate-in fade-in slide-in-from-top-2">
                  <input
                    type="checkbox"
                    checked={isAlamatChecked}
                    onChange={(e) => setIsAlamatChecked(e.target.checked)}
                    className="mt-0.5 w-5 h-5 text-rose-600 rounded border-rose-300 focus:ring-rose-500 cursor-pointer"
                  />
                  <label
                    className="text-sm font-semibold text-rose-900 cursor-pointer flex-1"
                    onClick={() => setIsAlamatChecked(!isAlamatChecked)}
                  >
                    Saya memastikan <span className="font-black">alamat pengiriman & kodepos sudah lengkap dan benar.</span> Kesalahan pengiriman akibat alamat tidak akurat sepenuhnya menjadi tanggung jawab saya.
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* KOLOM KANAN (RINGKASAN & SUBMIT - STICKY) */}`
);

fs.writeFileSync(path, content);
console.log("Logic reapplied.");
