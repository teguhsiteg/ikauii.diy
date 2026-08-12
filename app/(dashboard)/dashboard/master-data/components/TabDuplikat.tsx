"use client";
import Swal from "sweetalert2";
import { useState, useEffect, useRef } from "react";
import { collection, query, getDocs, doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function TabDuplikat() {
  const [pengurusList, setPengurusList] = useState<any[]>([]);
  const [dataUtamaId, setDataUtamaId] = useState("");
  const [dataGandaId, setDataGandaId] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [toast, setToast] = useState({ isOpen: false, message: "", type: "success" });
  
  const [searchUtama, setSearchUtama] = useState("");
  const [isDropdownUtamaOpen, setIsDropdownUtamaOpen] = useState(false);
  const dropdownUtamaRef = useRef<HTMLDivElement>(null);

  const [searchGanda, setSearchGanda] = useState("");
  const [isDropdownGandaOpen, setIsDropdownGandaOpen] = useState(false);
  const dropdownGandaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownUtamaRef.current && !dropdownUtamaRef.current.contains(event.target as Node)) {
        setIsDropdownUtamaOpen(false);
      }
      if (dropdownGandaRef.current && !dropdownGandaRef.current.contains(event.target as Node)) {
        setIsDropdownGandaOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  
  const [suggestedPairs, setSuggestedPairs] = useState<any[]>([]);
  const [hasDetected, setHasDetected] = useState(false);

  const autoDetectDuplicates = () => {
    const pairs: any[] = [];
    const usedPairs = new Set(); // To avoid duplicates in suggestions

    const cleanName = (n: string) => {
      if (!n) return [];
      let normalized = n.toLowerCase().replace(/[^a-z\s]/g, " ").replace(/\s+/g, " ").trim();
      const titles = ["dr", "ir", "prof", "h", "hj", "drs", "dra", "st", "mt", "sh", "mh", "se", "msi", "spd", "mpd", "skom", "mkom", "ssos", "msos", "sag", "mag", "stp", "mtp", "s.t.", "m.t.", "s.e.", "m.si."];
      return normalized.split(" ").filter(w => w.length > 0 && !titles.includes(w));
    };

    for (let i = 0; i < pengurusList.length; i++) {
      for (let j = i + 1; j < pengurusList.length; j++) {
        const p1 = pengurusList[i];
        const p2 = pengurusList[j];

        const words1 = cleanName(p1.nama);
        const words2 = cleanName(p2.nama);

        if (words1.length === 0 || words2.length === 0) continue;

        const shorter = words1.length < words2.length ? words1 : words2;
        const longer = words1.length < words2.length ? words2 : words1;

        if (shorter.length > 0 && shorter.every(w => longer.includes(w) || longer.some(lw => lw.includes(w) && w.length > 3))) {
          if (shorter.some(w => w.length > 2)) {
            let utama = p1;
            let ganda = p2;
            
            // Prefer the one with email as 'utama'. If both have or neither have, arbitrary is fine.
            if (p2.email && !p1.email) {
              utama = p2;
              ganda = p1;
            }

            pairs.push({ utama, ganda });
          }
        }
      }
    }
    
    setSuggestedPairs(pairs);
    setHasDetected(true);
  };

  const fetchPengurus = async () => {
    try {
      const q1 = query(collection(db, "pengurus"));
      const snap1 = await getDocs(q1);
      const data1 = snap1.docs.map(doc => ({ ...doc.data(), id: `pengurus_${doc.id}`, realId: doc.id, source: "pengurus" }));

      const q2 = query(collection(db, "pendaftar"));
      const snap2 = await getDocs(q2);
      const data2 = snap2.docs.map(doc => ({ ...doc.data(), id: `pendaftar_${doc.id}`, realId: doc.id, source: "pendaftar" }));

      const combined = [...data1, ...data2];
      combined.sort((a, b) => (a.nama || "").localeCompare(b.nama || ""));
      setPengurusList(combined);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchPengurus();
  }, []);

  const handleMerge = async () => {
    if (!dataUtamaId || !dataGandaId) {
      setToast({ isOpen: true, message: "Pilih kedua data terlebih dahulu.", type: "error" });
      setTimeout(() => setToast(prev => ({ ...prev, isOpen: false })), 4000);
      return;
    }
    if (dataUtamaId === dataGandaId) {
      setToast({ isOpen: true, message: "Tidak bisa menggabungkan data yang sama.", type: "error" });
      setTimeout(() => setToast(prev => ({ ...prev, isOpen: false })), 4000);
      return;
    }
    const _swalRes = await Swal.fire({
      title: 'Konfirmasi',
      text: "Anda yakin ingin menggabungkan dua data ini? Data Ganda akan dilebur dan dihapus permanen!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Lanjutkan',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#059669',
      cancelButtonColor: '#ef4444'
    });
    if (!_swalRes.isConfirmed) return;
    
    setIsProcessing(true);
    try {
      const utama = pengurusList.find(p => p.id === dataUtamaId);
      const ganda = pengurusList.find(p => p.id === dataGandaId);
      
      if (!utama || !ganda) throw new Error("Data tidak valid");
      
      const gandaRef = doc(db, ganda.source, ganda.realId);
      const utamaRef = doc(db, utama.source, utama.realId);
      
      const [gandaSnap, utamaSnap] = await Promise.all([getDoc(gandaRef), getDoc(utamaRef)]);
      
      if (gandaSnap.exists() && utamaSnap.exists()) {
        const gandaData = gandaSnap.data();
        const utamaData = utamaSnap.data();
        
        let mergedUpdate: any = {};
        
        // Selalu gunakan nama dari data ganda karena admin sudah melengkapinya dengan gelar
        if (gandaData.nama) {
          mergedUpdate.nama = gandaData.nama;
        }
        if (gandaData.jabatan && (!utamaData.jabatan || utamaData.jabatan === "Anggota")) {
          mergedUpdate.jabatan = gandaData.jabatan;
        }
        if (gandaData.bidang && (!utamaData.bidang || utamaData.bidang === "Belum Ditentukan")) {
          mergedUpdate.bidang = gandaData.bidang;
        }
        if (gandaData.periode) {
          mergedUpdate.periode = gandaData.periode;
        }
        if (gandaData.isPengurus !== undefined) {
           mergedUpdate.isPengurus = gandaData.isPengurus;
        }
        if (gandaData.status_pengurus) {
           mergedUpdate.status_pengurus = gandaData.status_pengurus;
        }
        if (gandaData.role) {
           mergedUpdate.role = gandaData.role;
        }
        if (gandaData.nia && (!utamaData.nia || utamaData.nia === "Dalam Proses")) {
           mergedUpdate.nia = gandaData.nia;
        }
        
        if (Object.keys(mergedUpdate).length > 0) {
           await updateDoc(utamaRef, mergedUpdate);
        }
        
        await deleteDoc(gandaRef);
        setToast({ isOpen: true, message: "Data berhasil digabungkan!", type: "success" });
        setDataUtamaId("");
        setDataGandaId("");
        fetchPengurus();
      }
    } catch (error) {
      console.error(error);
      setToast({ isOpen: true, message: "Gagal menggabungkan data.", type: "error" });
    } finally {
      setIsProcessing(false);
      setTimeout(() => setToast(prev => ({ ...prev, isOpen: false })), 4000);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-[#DADCE0] shadow-sm p-6 max-w-4xl">
      <h3 className="text-lg font-bold text-slate-800 mb-2">Alat Resolusi Duplikat (Merge Tool)</h3>
      <p className="text-sm text-slate-500 mb-8 leading-relaxed">
        Gunakan alat ini untuk meleburkan data ganda (dari pendaftar web yang mungkin mendaftar berkali-kali) ke akun utama mereka. 
        <strong> Data Ganda akan dihapus</strong> dan atribut pentingnya akan dipindah ke Data Utama dengan aman.
      </p>

      {/* AUTODETECT SECTION */}
      <div className="mb-8 border border-slate-200 bg-slate-50 p-5 rounded-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
          <div>
            <h4 className="font-bold text-slate-800">Deteksi Kemungkinan Duplikat (Menyeluruh)</h4>
            <p className="text-xs text-slate-500">Otomatis mencari seluruh data pengurus dan pendaftar yang namanya mirip (All vs All).</p>
          </div>
          <button 
            onClick={autoDetectDuplicates}
            className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-medium rounded-lg text-xs shadow-sm transition-colors whitespace-nowrap flex items-center"
          >
            <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Jalankan Deteksi
          </button>
        </div>
        
        {hasDetected && (
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm max-h-60 overflow-y-auto">
            {suggestedPairs.length === 0 ? (
              <div className="p-4 flex items-center justify-center text-sm text-slate-500 font-medium">
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Tidak ada kemungkinan duplikat ditemukan.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {suggestedPairs.map((pair, i) => (
                  <div key={i} className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6 flex-1">
                      <div className="flex-1">
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 mb-1 inline-block">Akun Baru (Utama)</span>
                        <p className="text-sm font-bold text-slate-800">
                  {pair.utama.nama} {pair.utama.source === "pendaftar" && <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded ml-1">Pendaftar</span>} {pair.utama.source === "pengurus" && <span className="text-[10px] bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded ml-1">Master Data</span>}
                </p>        <div className="text-xs text-slate-500">{pair.utama.email || pair.utama.wa}</div>
                      </div>
                      <div className="hidden md:flex text-slate-300">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      </div>
                      <div className="flex-1">
                        <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100 mb-1 inline-block">Data Lama (Ganda)</span>
                        <p className="text-sm font-bold text-slate-800">
                  {pair.ganda.nama} {pair.ganda.source === "pendaftar" && <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded ml-1">Pendaftar</span>} {pair.ganda.source === "pengurus" && <span className="text-[10px] bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded ml-1">Master Data</span>}
                </p>
                        <div className="text-xs text-slate-500">{pair.ganda.jabatan || "Tanpa Jabatan"}</div>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        setDataUtamaId(pair.utama.id);
                        setDataGandaId(pair.ganda.id);
                      }}
                      className="ml-4 px-3 py-1.5 border border-[#1A73E8] text-[#1A73E8] hover:bg-[#E8F0FE] font-bold rounded text-xs transition-colors whitespace-nowrap"
                    >
                      Pilih Ini
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Grid for two dropdowns */}
      <div className="grid md:grid-cols-2 gap-8 mb-8">
        {/* Box Data Utama */}
        <div className="p-5 border border-emerald-200 bg-emerald-50 rounded-xl relative">
           <div className="absolute -top-3 left-4 bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-1 rounded border border-emerald-200">
             Langkah 1
           </div>
           <h4 className="font-bold text-emerald-800 mt-2 mb-1">Data Utama (Dipertahankan)</h4>
           <p className="text-[11px] text-emerald-600 mb-4 leading-relaxed">
             Pilih data akun yang lengkap (memiliki Email/Auth Firebase). Data ini akan menjadi rumah baru bagi atribut jabatan.
           </p>
           
           <div className="relative" ref={dropdownUtamaRef}>
             <input
               type="text"
               placeholder="-- Ketik nama untuk mencari Data Utama --"
               value={isDropdownUtamaOpen ? searchUtama : (pengurusList.find(p => p.id === dataUtamaId)?.nama || "")}
               onChange={(e) => {
                 setSearchUtama(e.target.value);
                 if (!isDropdownUtamaOpen) setIsDropdownUtamaOpen(true);
               }}
               onClick={() => {
                 setIsDropdownUtamaOpen(true);
                 setSearchUtama("");
               }}
               className="w-full border border-emerald-300 rounded p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white shadow-sm mb-4 cursor-text"
             />
             {isDropdownUtamaOpen && (
               <ul className="absolute z-20 w-full bg-white border border-emerald-200 rounded-lg shadow-xl max-h-60 overflow-auto mt-1 -translate-y-3 mb-4">
                 {pengurusList
                   .filter(p => p.email)
                   .filter(p => p.nama?.toLowerCase().includes(searchUtama.toLowerCase()) || p.email?.toLowerCase().includes(searchUtama.toLowerCase()))
                   .map(p => (
                     <li
                       key={p.id}
                       onClick={() => {
                         setDataUtamaId(p.id);
                         setIsDropdownUtamaOpen(false);
                         setSearchUtama("");
                       }}
                       className="p-3 hover:bg-emerald-50 cursor-pointer border-b border-slate-100 last:border-0 transition-colors"
                     >
                       <div className="font-bold text-slate-800 text-sm">{p.nama}</div>
                       <div className="text-xs text-slate-500 mt-0.5">{p.email || p.wa} • <span className="text-emerald-600 font-medium">{p.jabatan || "Anggota"}</span></div>
                     </li>
                 ))}
                 {pengurusList.filter(p => p.email).filter(p => p.nama?.toLowerCase().includes(searchUtama.toLowerCase()) || p.email?.toLowerCase().includes(searchUtama.toLowerCase())).length === 0 && (
                   <li className="p-4 text-sm text-slate-500 text-center bg-slate-50">Data tidak ditemukan</li>
                 )}
               </ul>
             )}
           </div>

           {/* PREVIEW DATA UTAMA */}
           {dataUtamaId && (
             <div className="bg-white p-3.5 rounded-lg border border-emerald-200 text-xs text-slate-700 shadow-sm">
               <h5 className="font-bold text-emerald-800 mb-2 border-b border-emerald-100 pb-1">Detail Data Saat Ini:</h5>
               <div className="grid grid-cols-[80px_1fr] gap-y-1.5">
                 <span className="text-slate-500">Nama:</span>
                 <span className="font-medium">{pengurusList.find(p => p.id === dataUtamaId)?.nama}</span>
                 <span className="text-slate-500">Email:</span>
                 <span className="font-medium">{pengurusList.find(p => p.id === dataUtamaId)?.email || "-"}</span>
                 <span className="text-slate-500">Jabatan:</span>
                 <span className="font-medium text-emerald-600">{pengurusList.find(p => p.id === dataUtamaId)?.jabatan || "Anggota"}</span>
                 <span className="text-slate-500">Bidang:</span>
                 <span className="font-medium">{pengurusList.find(p => p.id === dataUtamaId)?.bidang || "-"}</span>
                 <span className="text-slate-500">NIA:</span>
                 <span className="font-medium">{pengurusList.find(p => p.id === dataUtamaId)?.nia || "Belum Terbit"}</span>
               </div>
             </div>
           )}
        </div>

        {/* Box Data Ganda */}
        <div className="p-5 border border-rose-200 bg-rose-50 rounded-xl relative">
           <div className="absolute -top-3 left-4 bg-rose-100 text-rose-800 text-xs font-bold px-2 py-1 rounded border border-rose-200">
             Langkah 2
           </div>
           <h4 className="font-bold text-rose-800 mt-2 mb-1">Data Ganda (Akan Dihapus)</h4>
           <p className="text-[11px] text-rose-600 mb-4 leading-relaxed">
             Pilih data lama yang ingin dilebur (biasanya tidak memiliki email). Atribut jabatannya akan dipindah ke Data Utama.
           </p>
           
           <div className="relative" ref={dropdownGandaRef}>
             <input
               type="text"
               placeholder="-- Ketik nama/jabatan untuk mencari Data Ganda --"
               value={isDropdownGandaOpen ? searchGanda : (pengurusList.find(p => p.id === dataGandaId)?.nama || "")}
               onChange={(e) => {
                 setSearchGanda(e.target.value);
                 if (!isDropdownGandaOpen) setIsDropdownGandaOpen(true);
               }}
               onClick={() => {
                 setIsDropdownGandaOpen(true);
                 setSearchGanda("");
               }}
               className="w-full border border-rose-300 rounded p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white shadow-sm mb-4 cursor-text"
             />
             {isDropdownGandaOpen && (
               <ul className="absolute z-20 w-full bg-white border border-rose-200 rounded-lg shadow-xl max-h-60 overflow-auto mt-1 -translate-y-3 mb-4">
                 {pengurusList
                   .filter(p => !p.email)
                   .filter(p => p.nama?.toLowerCase().includes(searchGanda.toLowerCase()) || (p.jabatan || "").toLowerCase().includes(searchGanda.toLowerCase()))
                   .map(p => (
                     <li
                       key={p.id}
                       onClick={() => {
                         setDataGandaId(p.id);
                         setIsDropdownGandaOpen(false);
                         setSearchGanda("");
                       }}
                       className="p-3 hover:bg-rose-50 cursor-pointer border-b border-slate-100 last:border-0 transition-colors"
                     >
                       <div className="font-bold text-slate-800 text-sm">{p.nama}</div>
                       <div className="text-xs text-rose-600 font-medium mt-0.5">{p.jabatan || "Tanpa Jabatan"} <span className="text-slate-400 font-normal ml-1">(Belum ada email)</span></div>
                     </li>
                 ))}
                 {pengurusList.filter(p => !p.email).filter(p => p.nama?.toLowerCase().includes(searchGanda.toLowerCase()) || (p.jabatan || "").toLowerCase().includes(searchGanda.toLowerCase())).length === 0 && (
                   <li className="p-4 text-sm text-slate-500 text-center bg-slate-50">Data tidak ditemukan</li>
                 )}
               </ul>
             )}
           </div>

           {/* PREVIEW DATA GANDA */}
           {dataGandaId && (
             <div className="bg-white p-3.5 rounded-lg border border-rose-200 text-xs text-slate-700 shadow-sm relative overflow-hidden">
               <div className="absolute top-0 right-0 bg-rose-500 text-white text-[9px] px-2 py-0.5 rounded-bl font-bold tracking-wider">AKAN DIHAPUS</div>
               <h5 className="font-bold text-rose-800 mb-2 border-b border-rose-100 pb-1">Detail Atribut Lama:</h5>
               <div className="grid grid-cols-[80px_1fr] gap-y-1.5">
                 <span className="text-slate-500">Nama:</span>
                 <span className="font-medium text-rose-700 font-bold">{pengurusList.find(p => p.id === dataGandaId)?.nama}</span>
                 <span className="text-slate-500">Jabatan:</span>
                 <span className="font-bold text-rose-600">{pengurusList.find(p => p.id === dataGandaId)?.jabatan || "Tanpa Jabatan"}</span>
                 <span className="text-slate-500">Bidang:</span>
                 <span className="font-medium">{pengurusList.find(p => p.id === dataGandaId)?.bidang || "-"}</span>
                 <span className="text-slate-500">Periode:</span>
                 <span className="font-medium">{pengurusList.find(p => p.id === dataGandaId)?.periode || "-"}</span>
               </div>
               <p className="mt-2 text-[10px] text-rose-500 italic bg-rose-50 p-1.5 rounded border border-rose-100">
                 *Nama Lengkap, Jabatan, Bidang, & Periode di atas akan menimpa Data Utama.
               </p>
             </div>
           )}
        </div>
      </div>

      <div className="flex justify-center border-t border-slate-100 pt-8">
        <button 
          onClick={handleMerge}
          disabled={isProcessing || !dataUtamaId || !dataGandaId}
          className="px-8 py-3 bg-[#1A73E8] hover:bg-[#1557B0] disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold rounded-lg shadow-sm transition-colors flex items-center gap-2"
        >
          {isProcessing ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Memproses...
            </span>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              Gabungkan Kedua Data Ini
            </>
          )}
        </button>
      </div>

      {toast.isOpen && (
        <div className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-xl text-white text-sm font-medium animate-in slide-in-from-bottom-5 z-50 ${toast.type === "success" ? "bg-emerald-600" : "bg-red-500"}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
