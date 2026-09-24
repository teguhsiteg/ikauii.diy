"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import * as XLSX from "xlsx";
import { Download } from "lucide-react";

export default function AdminKomunitasPartnerPage() {
  const [partners, setPartners] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "pendaftaran_komunitas_eksternal"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPartners(data);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const exportToExcel = () => {
    if (partners.length === 0) return;
    const exportData = partners.map((p, index) => ({
      No: index + 1,
      "Nama Organisasi/Komunitas": p.namaKomunitas,
      "Kategori": p.kategori || "-",
      "Estimasi Peserta": p.estimasiPeserta || "-",
      "Asal Kota": p.asalKota,
      "Nama PIC": p.namaKapten,
      "No WhatsApp PIC": p.noWa,
      "Email PIC": p.email,
      "Instagram": p.instagram || "-",
      "Catatan": p.catatan || "-",
      "Status": p.status || "Pending",
      "Tanggal Daftar": p.createdAt?.toDate
        ? p.createdAt.toDate().toLocaleString("id-ID")
        : "-",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Partner Eksternal");
    XLSX.writeFile(workbook, "Data_Partner_Eksternal_Sembada_Run.xlsx");
  };

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center min-h-[50vh] items-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Pendaftar Partner Eksternal
          </h1>
          <p className="text-slate-500 mt-2 font-medium">
            Daftar pengajuan kolektif/partner eksternal ({partners.length} Pengajuan)
          </p>
        </div>
        
        <button
          onClick={exportToExcel}
          disabled={partners.length === 0}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-300 text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-sm"
        >
          <Download className="w-4 h-4" />
          Export Excel
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-sm">
                <th className="px-6 py-4 font-bold text-slate-600">Profil Organisasi</th>
                <th className="px-6 py-4 font-bold text-slate-600">PIC / Kontak</th>
                <th className="px-6 py-4 font-bold text-slate-600">Detail & Catatan</th>
                <th className="px-6 py-4 font-bold text-slate-600 text-center">Status</th>
                <th className="px-6 py-4 font-bold text-slate-600 text-right">Tanggal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {partners.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-16 text-center text-slate-500 font-medium"
                  >
                    Belum ada pendaftar partner eksternal.
                  </td>
                </tr>
              ) : (
                partners.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 align-top">
                      <div className="font-bold text-slate-900 text-base mb-1">
                        {p.namaKomunitas}
                      </div>
                      <div className="flex flex-col gap-1 text-xs">
                        <span className="inline-flex items-center gap-1.5 text-slate-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                          {p.kategori || "Tanpa Kategori"}
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-slate-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                          {p.asalKota}
                        </span>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 align-top">
                      <div className="font-bold text-slate-800 mb-1">{p.namaKapten}</div>
                      <div className="text-slate-500 text-xs flex flex-col gap-0.5">
                        <a href={`https://wa.me/${p.noWa?.replace(/^0/, '62')}`} target="_blank" rel="noreferrer" className="hover:text-green-600 hover:underline">
                          {p.noWa}
                        </a>
                        <a href={`mailto:${p.email}`} className="hover:text-blue-600 hover:underline">
                          {p.email}
                        </a>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 align-top max-w-xs">
                      <div className="mb-2">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Estimasi</span>
                        <span className="text-slate-800 font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md text-xs">
                          {p.estimasiPeserta || "-"}
                        </span>
                      </div>
                      {p.catatan && (
                        <div>
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Catatan</span>
                          <p className="text-xs text-slate-600 line-clamp-2 group-hover:line-clamp-none transition-all">{p.catatan}</p>
                        </div>
                      )}
                    </td>
                    
                    <td className="px-6 py-4 align-top text-center">
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${
                          p.status === "Pending"
                            ? "bg-amber-100 text-amber-700 border border-amber-200"
                            : "bg-green-100 text-green-700 border border-green-200"
                        }`}
                      >
                        {p.status || "Pending"}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 align-top text-slate-500 text-xs text-right whitespace-nowrap">
                      {p.createdAt?.toDate ? (
                        <>
                          <span className="block font-semibold text-slate-700">
                            {p.createdAt.toDate().toLocaleDateString("id-ID", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                          <span className="block text-slate-400">
                            {p.createdAt.toDate().toLocaleTimeString("id-ID", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
