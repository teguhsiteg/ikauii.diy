"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  getDoc,
} from "firebase/firestore";
import { sendEmailAction } from "@/app/actions/email";
import { toast } from "@/lib/toast";
import {
  Mail,
  Send,
  Plus,
  Copy,
  Trash2,
  CheckCircle2,
  Clock,
  RotateCcw,
  Ticket,
  Share2,
  Users,
  Search,
  X,
} from "lucide-react";

interface UndanganItem {
  id: string;
  namaPic: string;
  instansi: string;
  email: string;
  noWA: string;
  kodeVoucher: string;
  kuota: number;
  kuotaTerpakai: number;
  kategoriBerlaku: string;
  statusEmail: "Terkirim" | "Gagal" | "Belum Dikirim";
  waktuKirimEmail?: string;
  waktuDibuat: string;
  catatan?: string;
  isActive: boolean;
}

export default function AdminUndanganTab() {
  const [invitations, setInvitations] = useState<UndanganItem[]>([]);
  const [registeredParticipants, setRegisteredParticipants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    namaPic: "",
    instansi: "",
    email: "",
    noWA: "",
    kodeVoucher: "",
    kuota: 1,
    kategoriBerlaku: "Semua",
    kirimEmailLangsung: true,
    catatan: "",
  });

  // Modal List Peserta Klaim
  const [viewClaimsVoucher, setViewClaimsVoucher] = useState<string | null>(null);

  // 1. Fetch Realtime Data Undangan & Peserta Lunas
  useEffect(() => {
    const qUndangan = query(collection(db, "undangan_khusus"));
    const unsubUndangan = onSnapshot(qUndangan, (snapshot) => {
      const data = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as UndanganItem[];
      setInvitations(data);
      setIsLoading(false);
    });

    const qPeserta = query(
      collection(db, "offline_participants"),
      where("isUndanganKhusus", "==", true),
    );
    const unsubPeserta = onSnapshot(qPeserta, (snapshot) => {
      const data = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      setRegisteredParticipants(data);
    });

    return () => {
      unsubUndangan();
      unsubPeserta();
    };
  }, []);

  // Generate Kode Acak
  const generateRandomCode = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const code = `UND-IKAUII-${randomNum}`;
    setFormData((prev) => ({ ...prev, kodeVoucher: code }));
  };

  // 2. Submit & Sync Promo to Settings
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.namaPic || !formData.email || !formData.kodeVoucher) {
      toast.error("Mohon lengkapi Nama, Email, dan Kode Voucher.");
      return;
    }

    const cleanCode = formData.kodeVoucher.trim().toUpperCase().replace(/\s/g, "");
    setIsSubmitting(true);

    try {
      // A. Sync Voucher ke settings/virtual_run paket offline
      const settingsRef = doc(db, "settings", "virtual_run");
      const settingsSnap = await getDoc(settingsRef);
      if (settingsSnap.exists()) {
        const sData = settingsSnap.data();
        const packages = sData.offlinePackages || [];
        const updatedPackages = packages.map((pkg: any) => {
          const isCategoryMatch =
            formData.kategoriBerlaku === "Semua" ||
            pkg.jarak?.toUpperCase() === formData.kategoriBerlaku.toUpperCase();

          if (isCategoryMatch) {
            const currentPromos = pkg.promos || [];
            const existingIndex = currentPromos.findIndex(
              (p: any) => p.kode?.toUpperCase() === cleanCode,
            );

            const promoObject = {
              id: existingIndex >= 0 ? currentPromos[existingIndex].id : `promo_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              kode: cleanCode,
              jenisDiskon: "persen",
              nilaiDiskon: 100,
              kuotaMaksimal: Number(formData.kuota) || 1,
              kuotaTerpakai: existingIndex >= 0 ? currentPromos[existingIndex].kuotaTerpakai || 0 : 0,
              isActive: true,
              deskripsi: `Undangan Khusus: ${formData.namaPic} (${formData.instansi || "PIC"})`,
            };

            if (existingIndex >= 0) {
              currentPromos[existingIndex] = promoObject;
            } else {
              currentPromos.push(promoObject);
            }

            return { ...pkg, promos: currentPromos };
          }
          return pkg;
        });

        await setDoc(settingsRef, { offlinePackages: updatedPackages }, { merge: true });
      }

      // B. Simpan ke koleksi undangan_khusus
      let emailStatus: "Terkirim" | "Gagal" | "Belum Dikirim" = "Belum Dikirim";
      let waktuKirim = "";

      if (formData.kirimEmailLangsung) {
        try {
          const res = await sendEmailAction({
            type: "undangan_khusus",
            email: formData.email.trim(),
            nama: formData.namaPic.trim(),
            detail: {
              instansi: formData.instansi.trim(),
              kodeVoucher: cleanCode,
              kuota: formData.kuota,
            },
          });
          if (res.success) {
            emailStatus = "Terkirim";
            waktuKirim = new Date().toISOString();
          } else {
            emailStatus = "Gagal";
          }
        } catch {
          emailStatus = "Gagal";
        }
      }

      const docId = `und_${cleanCode.toLowerCase()}`;
      await setDoc(doc(db, "undangan_khusus", docId), {
        namaPic: formData.namaPic.trim(),
        instansi: formData.instansi.trim(),
        email: formData.email.trim(),
        noWA: formData.noWA.trim(),
        kodeVoucher: cleanCode,
        kuota: Number(formData.kuota) || 1,
        kuotaTerpakai: 0,
        kategoriBerlaku: formData.kategoriBerlaku,
        statusEmail: emailStatus,
        waktuKirimEmail: waktuKirim,
        waktuDibuat: new Date().toISOString(),
        catatan: formData.catatan.trim(),
        isActive: true,
      });

      toast.success(
        formData.kirimEmailLangsung && emailStatus === "Terkirim"
          ? "Voucher berhasil dibuat dan Email Undangan berhasil terkirim ke PIC!"
          : "Voucher Undangan Khusus berhasil disimpan!",
      );

      setIsModalOpen(false);
      setFormData({
        namaPic: "",
        instansi: "",
        email: "",
        noWA: "",
        kodeVoucher: "",
        kuota: 1,
        kategoriBerlaku: "Semua",
        kirimEmailLangsung: true,
        catatan: "",
      });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Gagal menyimpan data undangan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Kirim Ulang Email ke PIC
  const handleResendEmail = async (item: UndanganItem) => {
    setIsSendingEmail(item.id);
    try {
      const res = await sendEmailAction({
        type: "undangan_khusus",
        email: item.email.trim(),
        nama: item.namaPic.trim(),
        detail: {
          instansi: item.instansi?.trim() || "",
          kodeVoucher: item.kodeVoucher,
          kuota: item.kuota,
        },
      });

      if (res.success) {
        await setDoc(
          doc(db, "undangan_khusus", item.id),
          {
            statusEmail: "Terkirim",
            waktuKirimEmail: new Date().toISOString(),
          },
          { merge: true },
        );
        toast.success(`Email undangan berhasil dikirim ulang ke ${item.email}`);
      } else {
        toast.error("Gagal mengirim email. Periksa koneksi atau format email.");
      }
    } catch (err: any) {
      toast.error(err.message || "Gagal mengirim email.");
    } finally {
      setIsSendingEmail(null);
    }
  };

  // 4. Salin Template WhatsApp (Bersih dari Emoji)
  const handleCopyWhatsApp = (item: UndanganItem) => {
    const text = `Yth. Bapak/Ibu ${item.namaPic}${item.instansi ? ` (${item.instansi})` : ""}
di Tempat

Assalamu'alaikum Warahmatullahi Wabarakatuh,

Panitia IKA UII DIY RUN dengan hormat mengundang Bapak/Ibu untuk berpartisipasi sebagai Undangan Khusus dalam gelaran lari kami.

Berikut informasi akses pendaftaran khusus Anda:
- Kode Voucher: ${item.kodeVoucher}
- Kuota: ${item.kuota} Tiket (Gratis 100%)
- Link Registrasi: https://ikadiy.uii.ac.id/run/daftar

Petunjuk Pendaftaran:
1. Buka tautan pendaftaran di atas.
2. Masukkan Kode Voucher pada kolom "Akses Undangan Khusus".
3. Pilih kategori jarak lari yang diinginkan.
4. Lengkapi data diri dan nama pada nomor BIB.
5. Setelah disubmit, E-Ticket resmi & Nomor BIB (U-xxx) akan otomatis terbit.

Terima kasih atas partisipasi dan dukungannya.

Wassalamu'alaikum Wr. Wb.
Panitia IKA UII DIY RUN`;

    navigator.clipboard.writeText(text);
    toast.success("Format pesan WhatsApp berhasil disalin ke clipboard!");
  };

  // 5. Hapus Undangan & Sync Hapus Promo
  const handleDelete = async (item: UndanganItem) => {
    if (!confirm(`Hapus voucher undangan ${item.kodeVoucher} untuk ${item.namaPic}?`)) return;

    try {
      await deleteDoc(doc(db, "undangan_khusus", item.id));

      const settingsRef = doc(db, "settings", "virtual_run");
      const settingsSnap = await getDoc(settingsRef);
      if (settingsSnap.exists()) {
        const sData = settingsSnap.data();
        const packages = sData.offlinePackages || [];
        const updatedPackages = packages.map((pkg: any) => {
          if (pkg.promos && Array.isArray(pkg.promos)) {
            return {
              ...pkg,
              promos: pkg.promos.filter(
                (p: any) => p.kode?.toUpperCase() !== item.kodeVoucher.toUpperCase(),
              ),
            };
          }
          return pkg;
        });
        await setDoc(settingsRef, { offlinePackages: updatedPackages }, { merge: true });
      }

      toast.success("Voucher undangan berhasil dihapus.");
    } catch (err: any) {
      toast.error(err.message || "Gagal menghapus.");
    }
  };

  // Filter Data
  const filteredInvitations = invitations.filter((inv) => {
    const q = searchQuery.toLowerCase();
    return (
      inv.namaPic?.toLowerCase().includes(q) ||
      inv.instansi?.toLowerCase().includes(q) ||
      inv.email?.toLowerCase().includes(q) ||
      inv.kodeVoucher?.toLowerCase().includes(q)
    );
  });

  // Statistik Ringkas
  const totalVoucher = invitations.length;
  const totalKuota = invitations.reduce((acc, curr) => acc + (curr.kuota || 0), 0);
  const totalKlaim = registeredParticipants.length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* --- STATS CARD ROW --- */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#1A73E8] flex items-center justify-center font-bold">
            <Mail className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Undangan</p>
            <p className="text-2xl font-black text-slate-800 mt-0.5">{totalVoucher}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
            <Ticket className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Kuota Tiket</p>
            <p className="text-2xl font-black text-slate-800 mt-0.5">{totalKuota} Tiket</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sudah Registrasi (BIB U-)</p>
            <p className="text-2xl font-black text-slate-800 mt-0.5">{totalKlaim} Orang</p>
          </div>
        </div>
      </div>

      {/* --- ACTION & TOOLBAR --- */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 justify-between items-center">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari PIC, instansi, kode..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1A73E8] w-full"
          />
        </div>

        <button
          onClick={() => {
            generateRandomCode();
            setIsModalOpen(true);
          }}
          className="bg-[#1A73E8] hover:bg-[#1557B0] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 shadow-sm w-full sm:w-auto justify-center"
        >
          <Plus className="w-4 h-4" />
          Buat & Kirim Undangan Baru
        </button>
      </div>

      {/* --- TABEL DAFTAR UNDANGAN --- */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-xs font-bold border-b border-slate-200 uppercase tracking-wider">
                <th className="px-5 py-3.5">Penerima / PIC</th>
                <th className="px-5 py-3.5">Kode Voucher</th>
                <th className="px-5 py-3.5">Kuota & Kategori</th>
                <th className="px-5 py-3.5">Status Email</th>
                <th className="px-5 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-blue-200 border-t-[#1A73E8] rounded-full animate-spin mx-auto mb-2"></div>
                    Memuat data undangan...
                  </td>
                </tr>
              ) : filteredInvitations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-400 text-xs font-medium">
                    Belum ada data Undangan Khusus. Klik tombol "Buat & Kirim Undangan Baru" di atas.
                  </td>
                </tr>
              ) : (
                filteredInvitations.map((item) => {
                  const usedCount = registeredParticipants.filter(
                    (p) => p.kodePromoDipakai?.toUpperCase() === item.kodeVoucher.toUpperCase(),
                  ).length;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-4">
                        <p className="font-bold text-slate-900">{item.namaPic}</p>
                        <p className="text-xs text-slate-500">{item.instansi || "Tamu Undangan"}</p>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">{item.email} {item.noWA ? `• ${item.noWA}` : ""}</p>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-xs text-amber-900 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
                            {item.kodeVoucher}
                          </span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(item.kodeVoucher);
                              toast.success(`Kode ${item.kodeVoucher} disalin!`);
                            }}
                            className="text-slate-400 hover:text-slate-700 p-1"
                            title="Salin Kode"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-700">
                            {usedCount} / {item.kuota} Tiket
                          </span>
                          {usedCount > 0 && (
                            <button
                              onClick={() => setViewClaimsVoucher(item.kodeVoucher)}
                              className="text-[10px] font-bold text-[#1A73E8] hover:underline"
                            >
                              (Lihat BIB)
                            </button>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Kategori: <strong>{item.kategoriBerlaku}</strong>
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        {item.statusEmail === "Terkirim" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> Terkirim
                          </span>
                        ) : item.statusEmail === "Gagal" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            Gagal Kirim
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            <Clock className="w-3 h-3" /> Belum Dikirim
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleResendEmail(item)}
                            disabled={isSendingEmail === item.id}
                            className="p-1.5 bg-blue-50 text-[#1A73E8] hover:bg-blue-100 rounded-lg border border-blue-100 transition-colors disabled:opacity-50"
                            title="Kirim / Resend Email Undangan"
                          >
                            {isSendingEmail === item.id ? (
                              <div className="w-3.5 h-3.5 border-2 border-[#1A73E8] border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <Send className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            onClick={() => handleCopyWhatsApp(item)}
                            className="p-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg border border-emerald-100 transition-colors"
                            title="Salin Teks Undangan WhatsApp"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(item)}
                            className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg border border-rose-100 transition-colors"
                            title="Hapus Voucher"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- MODAL BUAT UNDANGAN BARU --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1A73E8] flex items-center justify-center">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Buat Undangan Khusus</h3>
                  <p className="text-[11px] text-slate-500">Generate voucher & kirim email resmi ke PIC</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Nama PIC / Tamu Undangan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Bpk. Prof. Dr. Fathul Wahid"
                  value={formData.namaPic}
                  onChange={(e) => setFormData({ ...formData, namaPic: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#1A73E8]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Instansi / Jabatan
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Rektorat UII"
                    value={formData.instansi}
                    onChange={(e) => setFormData({ ...formData, instansi: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#1A73E8]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    No. WhatsApp (Opsional)
                  </label>
                  <input
                    type="tel"
                    placeholder="08123456789"
                    value={formData.noWA}
                    onChange={(e) => setFormData({ ...formData, noWA: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#1A73E8]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Email Penerima (PIC) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="email.pic@instansi.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#1A73E8]"
                />
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-slate-700 uppercase">
                      Kode Voucher <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={generateRandomCode}
                      className="text-[10px] text-[#1A73E8] hover:underline font-bold flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" /> Acak Kode
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="KODE VOUCHER"
                    value={formData.kodeVoucher}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        kodeVoucher: e.target.value.toUpperCase().replace(/\s/g, ""),
                      })
                    }
                    className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-sm font-mono font-bold uppercase text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1A73E8]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                      Kuota Tiket (Orang)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={formData.kuota}
                      onChange={(e) =>
                        setFormData({ ...formData, kuota: Number(e.target.value) || 1 })
                      }
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                      Kategori Berlaku
                    </label>
                    <select
                      value={formData.kategoriBerlaku}
                      onChange={(e) =>
                        setFormData({ ...formData, kategoriBerlaku: e.target.value })
                      }
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800"
                    >
                      <option value="Semua">Semua (Bebas Pilih)</option>
                      <option value="5K">5K Saja</option>
                      <option value="10K">10K Saja</option>
                      <option value="21K">21K Saja</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <input
                    type="checkbox"
                    checked={formData.kirimEmailLangsung}
                    onChange={(e) =>
                      setFormData({ ...formData, kirimEmailLangsung: e.target.checked })
                    }
                    className="w-4 h-4 accent-[#1A73E8] rounded"
                  />
                  <span className="text-xs font-bold text-slate-700">
                    Kirim Email Undangan Otomatis Sekarang ke PIC
                  </span>
                </label>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2.5 bg-[#1A73E8] hover:bg-[#1557B0] text-white rounded-xl text-xs font-bold transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan & Proses"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL DAFTAR PESERTA YANG SUDAH KLAIM VOUCHER --- */}
      {viewClaimsVoucher && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">
                  Peserta Terdaftar (Voucher: {viewClaimsVoucher})
                </h3>
                <p className="text-[11px] text-slate-500">
                  Daftar pelari yang telah registrasi menggunakan voucher ini
                </p>
              </div>
              <button
                onClick={() => setViewClaimsVoucher(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 max-h-96 overflow-y-auto divide-y divide-slate-100">
              {registeredParticipants.filter(
                (p) => p.kodePromoDipakai?.toUpperCase() === viewClaimsVoucher.toUpperCase(),
              ).length === 0 ? (
                <p className="text-center py-6 text-slate-400 text-xs">
                  Belum ada peserta yang mendaftar dengan voucher ini.
                </p>
              ) : (
                registeredParticipants
                  .filter(
                    (p) => p.kodePromoDipakai?.toUpperCase() === viewClaimsVoucher.toUpperCase(),
                  )
                  .map((p, idx) => (
                    <div key={p.id || idx} className="py-3 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-800 text-xs">{p.namaLengkap}</p>
                        <p className="text-[11px] text-slate-500 font-mono">
                          {p.noWA} • {p.email}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Kategori: <strong>{p.jarak}</strong> | Jersey: <strong>{p.ukuranJersey}</strong>
                        </p>
                      </div>
                      <span className="font-mono font-black text-xs text-[#1A73E8] bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-md">
                        {p.nomorBIB || "-"}
                      </span>
                    </div>
                  ))
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 text-right">
              <button
                onClick={() => setViewClaimsVoucher(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
