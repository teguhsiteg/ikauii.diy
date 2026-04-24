"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  onSnapshot,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
} from "firebase/firestore";
import * as XLSX from "xlsx";

// --- TYPE DEFINITIONS ---
interface RolePosition {
  id: string;
  nama: string;
  kuota: number;
  linkWa: string;
}

interface DivisionGroup {
  id: string;
  title: string;
  roles: RolePosition[];
}

interface EventRecruitment {
  id: string;
  title: string;
  requirements: string; // Deskripsi / Persyaratan Umum
  isActive: boolean;
  linkGrupBesar: string;
  groups: DivisionGroup[];
}

interface CrewMember {
  id: string;
  eventId: string;
  roleId: string;
  divisiId?: string;
  nama: string;
  email: string;
  whatsapp: string;
  tipe: string;
  status: "pending" | "accepted" | "rejected";
  waktuDaftar: string;
  fakultas?: string;
  angkatan?: string | number;
  instansi?: string;
  jabatan?: string;
  domisili?: string;
  motivasi?: string;
  pengalaman?: string;
  // State untuk status email
  emailStatus?: "sent" | "failed" | null;
  emailError?: string;
}

export default function CrewManagementPage() {
  const [activeTab, setActiveTab] = useState<
    "pengaturan" | "pendaftar" | "timInti"
  >("pengaturan");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [popup, setPopup] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Data State
  const [events, setEvents] = useState<EventRecruitment[]>([]);
  const [pendaftar, setPendaftar] = useState<CrewMember[]>([]);

  // UI State: Modal Detail & Re-Assign
  const [selectedCrew, setSelectedCrew] = useState<CrewMember | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [newAssignedRoleId, setNewAssignedRoleId] = useState("");

  // UI State: Accordion & Filter
  const [expandedEvents, setExpandedEvents] = useState<Record<string, boolean>>(
    {},
  );
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {},
  );
  const [filterEvent, setFilterEvent] = useState<string>("all");
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedPending, setSelectedPending] = useState<string[]>([]);
  const [selectedAccepted, setSelectedAccepted] = useState<string[]>([]);

  // Email State
  const [isSendingMail, setIsSendingMail] = useState(false);
  const [emailProgress, setEmailProgress] = useState<{
    total: number;
    sent: number;
    failed: number;
    isSending: boolean;
  } | null>(null);

  useEffect(() => {
    const unsubSettings = onSnapshot(
      doc(db, "settings", "virtual_run"),
      (docSnap) => {
        if (docSnap.exists()) {
          const loadedEvents = docSnap.data().crewRecruitments || [];
          setEvents(loadedEvents);

          if (
            loadedEvents.length > 0 &&
            Object.keys(expandedEvents).length === 0
          ) {
            const initialEvents: Record<string, boolean> = {};
            const initialGroups: Record<string, boolean> = {};
            loadedEvents.forEach((e: EventRecruitment) => {
              initialEvents[e.id] = true;
              (e.groups || []).forEach((g) => {
                initialGroups[g.id] = true;
              });
            });
            setExpandedEvents(initialEvents);
            setExpandedGroups(initialGroups);
          }
        }
      },
    );

    const qCrew = query(
      collection(db, "crew_volunteers"),
      orderBy("waktuDaftar", "desc"),
    );
    const unsubCrew = onSnapshot(qCrew, (snap) => {
      const data = snap.docs.map(
        (d) => ({ id: d.id, ...d.data() }) as CrewMember,
      );
      setPendaftar(data);
      setIsLoading(false);
    });

    return () => {
      unsubSettings();
      unsubCrew();
    };
  }, []);

  const showNotif = (type: "success" | "error", text: string) => {
    setPopup({ type, text });
    setTimeout(() => setPopup(null), 3000);
  };

  // ========================================================
  // LOGIKA PENGATURAN EVENT & DIVISI (Aman dari Map Error)
  // ========================================================
  const toggleEventCard = (id: string) =>
    setExpandedEvents((prev) => ({ ...prev, [id]: !prev[id] }));
  const toggleGroupCard = (id: string) =>
    setExpandedGroups((prev) => ({ ...prev, [id]: !prev[id] }));

  const handleAddEvent = () => {
    const newId = Date.now().toString();
    setEvents([
      ...events,
      {
        id: newId,
        title: "",
        requirements: "",
        isActive: true,
        linkGrupBesar: "",
        groups: [],
      },
    ]);
    setExpandedEvents((prev) => ({ ...prev, [newId]: true }));
  };

  const handleRemoveEvent = async (id: string) => {
    if (!confirm("Hapus event kepanitiaan ini?")) return;
    const newEvents = events.filter((e) => e.id !== id);
    setEvents(newEvents);
    await updateDoc(doc(db, "settings", "virtual_run"), {
      crewRecruitments: newEvents,
    });
  };

  const handleChangeEvent = (id: string, field: string, value: any) => {
    setEvents(events.map((e) => (e.id === id ? { ...e, [field]: value } : e)));
  };

  const handleAddGroup = (eventId: string) => {
    const newId = Date.now().toString();
    setEvents(
      events.map((e) =>
        e.id === eventId
          ? {
              ...e,
              groups: [
                ...(e.groups || []),
                { id: newId, title: "", roles: [] },
              ],
            }
          : e,
      ),
    );
    setExpandedGroups((prev) => ({ ...prev, [newId]: true }));
  };

  const handleChangeGroup = (
    eventId: string,
    groupId: string,
    newTitle: string,
  ) => {
    setEvents(
      events.map((e) => {
        if (e.id === eventId) {
          return {
            ...e,
            groups: (e.groups || []).map((g) =>
              g.id === groupId ? { ...g, title: newTitle } : g,
            ),
          };
        }
        return e;
      }),
    );
  };

  const handleRemoveGroup = async (eventId: string, groupId: string) => {
    if (!confirm("Hapus kelompok divisi ini?")) return;
    const newEvents = events.map((e) =>
      e.id === eventId
        ? { ...e, groups: (e.groups || []).filter((g) => g.id !== groupId) }
        : e,
    );
    setEvents(newEvents);
    await updateDoc(doc(db, "settings", "virtual_run"), {
      crewRecruitments: newEvents,
    });
  };

  const handleAddRole = (eventId: string, groupId: string) => {
    setEvents(
      events.map((e) => {
        if (e.id === eventId) {
          return {
            ...e,
            groups: (e.groups || []).map((g) =>
              g.id === groupId
                ? {
                    ...g,
                    roles: [
                      ...(g.roles || []),
                      {
                        id: Date.now().toString(),
                        nama: "",
                        kuota: 5,
                        linkWa: "",
                      },
                    ],
                  }
                : g,
            ),
          };
        }
        return e;
      }),
    );
  };

  const handleChangeRole = (
    eventId: string,
    groupId: string,
    roleId: string,
    field: string,
    value: any,
  ) => {
    setEvents(
      events.map((e) => {
        if (e.id === eventId) {
          return {
            ...e,
            groups: (e.groups || []).map((g) => {
              if (g.id === groupId) {
                return {
                  ...g,
                  roles: (g.roles || []).map((r) =>
                    r.id === roleId ? { ...r, [field]: value } : r,
                  ),
                };
              }
              return g;
            }),
          };
        }
        return e;
      }),
    );
  };

  const handleRemoveRole = async (
    eventId: string,
    groupId: string,
    roleId: string,
  ) => {
    const newEvents = events.map((e) => {
      if (e.id === eventId) {
        return {
          ...e,
          groups: (e.groups || []).map((g) => {
            if (g.id === groupId) {
              return {
                ...g,
                roles: (g.roles || []).filter((r) => r.id !== roleId),
              };
            }
            return g;
          }),
        };
      }
      return e;
    });
    setEvents(newEvents);
    await updateDoc(doc(db, "settings", "virtual_run"), {
      crewRecruitments: newEvents,
    });
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      await updateDoc(doc(db, "settings", "virtual_run"), {
        crewRecruitments: events,
      });
      showNotif("success", "Pengaturan kepanitiaan disimpan.");
    } catch (error) {
      showNotif("error", "Gagal menyimpan.");
    } finally {
      setIsSaving(false);
    }
  };

  // ========================================================
  // LOGIKA REVIEW & EMAIL
  // ========================================================
  const getRoleInfo = (eventId: string, targetRoleId: string) => {
    const parentEvent = events.find((e) => e.id === eventId);
    let roleName = "Data Lama / Tidak Spesifik";
    let roleLink = "";
    (parentEvent?.groups || []).forEach((g) => {
      const r = (g.roles || []).find((ro) => ro.id === targetRoleId);
      if (r) {
        roleName = r.nama;
        roleLink = r.linkWa;
      }
    });
    return { parentEvent, roleName, roleLink };
  };

  const openDetail = (crew: CrewMember) => {
    setSelectedCrew(crew);
    setNewAssignedRoleId(crew.roleId || crew.divisiId || "");
    setIsDetailOpen(true);
  };

  const handleDecision = async (status: "accepted" | "rejected") => {
    if (!selectedCrew) return;
    if (
      !confirm(
        `Konfirmasi: ${status === "accepted" ? "TERIMA" : "TOLAK"} pelamar ini?`,
      )
    )
      return;

    try {
      await updateDoc(doc(db, "crew_volunteers", selectedCrew.id), {
        status,
        roleId: newAssignedRoleId,
      });
      showNotif("success", "Status berhasil diperbarui.");
      setIsDetailOpen(false);
      setSelectedPending(
        selectedPending.filter((id) => id !== selectedCrew.id),
      );
    } catch (e) {
      showNotif("error", "Gagal memperbarui status.");
    }
  };

  const handleDeletePelamar = async (id: string) => {
    if (!confirm("Hapus permanen data pelamar ini dari database?")) return;
    try {
      await deleteDoc(doc(db, "crew_volunteers", id));
      showNotif("success", "Data dihapus.");
    } catch (err) {
      showNotif("error", "Gagal menghapus data.");
    }
  };

  const handleMassUpdateStatus = async (
    ids: string[],
    newStatus: "accepted" | "rejected",
  ) => {
    if (
      !confirm(
        `Ubah status ${ids.length} pelamar menjadi ${newStatus === "accepted" ? "Diterima" : "Ditolak"}?`,
      )
    )
      return;
    try {
      await Promise.all(
        ids.map((id) =>
          updateDoc(doc(db, "crew_volunteers", id), { status: newStatus }),
        ),
      );
      setSelectedPending([]);
      showNotif("success", "Status massal diperbarui.");
    } catch (err) {
      showNotif("error", "Gagal memproses pembaruan massal.");
    }
  };

  const handleMassDelete = async (ids: string[], isPendingTab: boolean) => {
    if (!confirm(`Hapus permanen ${ids.length} data terpilih?`)) return;
    try {
      await Promise.all(
        ids.map((id) => deleteDoc(doc(db, "crew_volunteers", id))),
      );
      if (isPendingTab) setSelectedPending([]);
      else setSelectedAccepted([]);
      showNotif("success", "Data dihapus.");
    } catch (err) {
      showNotif("error", "Gagal menghapus data.");
    }
  };

  // 🔥 FUNGSI KIRIM EMAIL DENGAN STATUS TERUPDATE 🔥
  const handleSendEmailIndividual = async (crew: CrewMember) => {
    const { parentEvent, roleName, roleLink } = getRoleInfo(
      crew.eventId,
      crew.roleId || crew.divisiId || "",
    );
    const targetLinkBesar = parentEvent?.linkGrupBesar || "";

    if (!targetLinkBesar && !roleLink) {
      if (
        !confirm(
          "Belum ada Link WA yang diatur di event ini. Tetap kirim email?",
        )
      )
        return;
    }

    setIsSendingMail(true);
    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "crew_accepted",
          email: crew.email,
          nama: crew.nama,
          detail: {
            event: parentEvent?.title || "Kepanitiaan",
            divisi: roleName,
            linkGrupBesar: targetLinkBesar,
            linkGrupDivisi: roleLink,
          },
        }),
      });

      if (response.ok) {
        // Update database bahwa email sukses terkirim
        await updateDoc(doc(db, "crew_volunteers", crew.id), {
          emailStatus: "sent",
          emailError: "",
        });
        showNotif("success", `Email berhasil dikirim ke ${crew.nama}`);
      } else {
        const errorData = await response.json();
        await updateDoc(doc(db, "crew_volunteers", crew.id), {
          emailStatus: "failed",
          emailError: errorData.message || "Gagal dari server email.",
        });
        showNotif("error", "Gagal mengirim email.");
      }
    } catch (error: any) {
      await updateDoc(doc(db, "crew_volunteers", crew.id), {
        emailStatus: "failed",
        emailError: error.message,
      });
      showNotif("error", "Terjadi kesalahan sistem saat kirim email.");
    } finally {
      setIsSendingMail(false);
    }
  };

  const handleMassEmail = async () => {
    if (selectedAccepted.length === 0) return;
    if (
      !confirm(
        `Kirim email ke ${selectedAccepted.length} kandidat? Proses ini berjalan satu per satu.`,
      )
    )
      return;

    setEmailProgress({
      total: selectedAccepted.length,
      sent: 0,
      failed: 0,
      isSending: true,
    });
    let sentCount = 0;
    let failCount = 0;

    for (const crewId of selectedAccepted) {
      const crew = pendaftar.find((c) => c.id === crewId);
      if (!crew) {
        failCount++;
        continue;
      }

      const { parentEvent, roleName, roleLink } = getRoleInfo(
        crew.eventId,
        crew.roleId || crew.divisiId || "",
      );
      try {
        const response = await fetch("/api/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "crew_accepted",
            email: crew.email,
            nama: crew.nama,
            detail: {
              event: parentEvent?.title || "Kepanitiaan",
              divisi: roleName,
              linkGrupBesar: parentEvent?.linkGrupBesar || "",
              linkGrupDivisi: roleLink,
            },
          }),
        });
        if (response.ok) {
          await updateDoc(doc(db, "crew_volunteers", crew.id), {
            emailStatus: "sent",
            emailError: "",
          });
          sentCount++;
        } else {
          await updateDoc(doc(db, "crew_volunteers", crew.id), {
            emailStatus: "failed",
            emailError: "Gagal dari server (Massal)",
          });
          failCount++;
        }
      } catch (e: any) {
        await updateDoc(doc(db, "crew_volunteers", crew.id), {
          emailStatus: "failed",
          emailError: e.message,
        });
        failCount++;
      }
      setEmailProgress((prev) =>
        prev ? { ...prev, sent: sentCount, failed: failCount } : null,
      );
    }
    setEmailProgress((prev) => (prev ? { ...prev, isSending: false } : null));
    showNotif(
      "success",
      `Selesai. Berhasil: ${sentCount}, Gagal: ${failCount}`,
    );
    setSelectedAccepted([]);
  };

  // ========================================================
  // EXPORT EXCEL
  // ========================================================
  const exportToExcel = (data: CrewMember[], filename: string) => {
    const formattedData = data.map((c, index) => {
      const { parentEvent, roleName } = getRoleInfo(
        c.eventId,
        c.roleId || c.divisiId || "",
      );
      return {
        No: index + 1,
        "Tanggal Daftar": new Date(c.waktuDaftar).toLocaleString("id-ID"),
        "Event Target": parentEvent?.title || "Data Lama",
        "Penempatan Posisi": roleName,
        "Nama Lengkap": c.nama,
        Kategori: c.tipe.toUpperCase(),
        Email: c.email,
        WhatsApp: c.whatsapp,
        "Instansi/UKM": c.instansi || "-",
        Jabatan: c.jabatan || "-",
        "Fakultas / Jurusan": c.fakultas || "-",
        Angkatan: c.angkatan || "-",
        Domisili: c.domisili || "-",
        Motivasi: c.motivasi || "-",
        Pengalaman: c.pengalaman || "-",
        Status:
          c.status === "accepted"
            ? "Diterima"
            : c.status === "pending"
              ? "Menunggu"
              : "Ditolak",
      };
    });
    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data Relawan");
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  };

  // Data Filtering
  const currentTabList = pendaftar.filter(
    (c) =>
      (activeTab === "pendaftar"
        ? c.status === "pending"
        : c.status === "accepted") &&
      (filterEvent === "all" || c.eventId === filterEvent),
  );
  const totalPages =
    itemsPerPage === 0 ? 1 : Math.ceil(currentTabList.length / itemsPerPage);
  const pagedData =
    itemsPerPage === 0
      ? currentTabList
      : currentTabList.slice(
          (currentPage - 1) * itemsPerPage,
          currentPage * itemsPerPage,
        );

  if (isLoading)
    return (
      <div className="h-screen flex flex-col items-center justify-center text-[#1A73E8]">
        <div className="w-8 h-8 border-4 border-blue-100 border-t-[#1A73E8] rounded-full animate-spin mb-4"></div>
        Memuat Sistem...
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto pb-32 font-sans p-4 sm:p-8 bg-[#F8F9FA] min-h-screen">
      {/* POPUP NOTIFIKASI */}
      {popup && (
        <div className="fixed top-6 right-6 z-[200] bg-white border border-[#DADCE0] px-5 py-4 rounded-xl shadow-lg flex items-center gap-4 animate-in slide-in-from-top-4 fade-in">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${popup.type === "success" ? "bg-[#E6F4EA] text-[#1E8E3E]" : "bg-[#FCE8E6] text-[#D93025]"}`}
          >
            {popup.type === "success" ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>
          <div className="flex-grow">
            <p className="text-sm font-bold text-slate-800">
              {popup.type === "success" ? "Berhasil" : "Gagal"}
            </p>
            <p className="text-xs text-slate-500">{popup.text}</p>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="mb-6 border-b border-[#DADCE0] pb-4">
        <h1 className="text-2xl font-medium text-slate-800 tracking-tight">
          Manajemen Kru & Relawan
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Konfigurasi struktur kepanitiaan dan persetujuan pendaftar.
        </p>
      </div>

      {/* MATERIAL TABS (PILLS) */}
      <div className="flex gap-3 mb-8 overflow-x-auto hide-scrollbar">
        {[
          {
            id: "pengaturan",
            label: "Setup Lowongan",
            icon: (
              <path d="M19.14,12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.56-1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.49-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
            ),
          },
          {
            id: "pendaftar",
            label: "Menunggu Review",
            icon: (
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5v-2h14v2zm0-4H5V5h14v10zm-7-2l5-5h-3V5h-4v4H7l5 5z" />
            ),
          },
          {
            id: "timInti",
            label: "Tim Inti (Diterima)",
            icon: (
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            ),
          },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as any);
              setCurrentPage(1);
            }}
            className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all flex items-center gap-2 border ${activeTab === tab.id ? "bg-[#E8F0FE] text-[#1A73E8] border-[#1A73E8]/30 shadow-sm" : "bg-white text-slate-600 hover:bg-slate-50 border-[#DADCE0]"}`}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              {tab.icon}
            </svg>
            {tab.label}
            {tab.id === "pendaftar" &&
              pendaftar.filter((c) => c.status === "pending").length > 0 && (
                <span className="bg-[#D93025] text-white text-[10px] px-2 py-0.5 rounded-full font-bold ml-1">
                  {pendaftar.filter((c) => c.status === "pending").length}
                </span>
              )}
            {tab.id === "timInti" &&
              pendaftar.filter((c) => c.status === "accepted").length > 0 && (
                <span className="bg-[#1E8E3E] text-white text-[10px] px-2 py-0.5 rounded-full font-bold ml-1">
                  {pendaftar.filter((c) => c.status === "accepted").length}
                </span>
              )}
          </button>
        ))}
      </div>

      {/* ======================================================== */}
      {/* TAB 1: PENGATURAN KEPANITIAAN */}
      {/* ======================================================== */}
      {activeTab === "pengaturan" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
            <h2 className="text-base font-medium text-slate-800">
              Daftar Event Kepanitiaan
            </h2>
            <button
              onClick={handleAddEvent}
              className="bg-white border border-[#DADCE0] text-[#1A73E8] hover:bg-[#F8F9FA] px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4v16m8-8H4"
                />
              </svg>{" "}
              Tambah Event Baru
            </button>
          </div>

          {events.length === 0 ? (
            <div className="bg-white border border-dashed border-[#DADCE0] rounded-2xl p-16 text-center shadow-sm">
              <p className="text-slate-500 font-medium text-sm">
                Belum ada event kepanitiaan. Klik tombol di atas untuk memulai.
              </p>
            </div>
          ) : (
            events.map((event) => {
              const isEventExpanded = expandedEvents[event.id] !== false;
              return (
                <div
                  key={event.id}
                  className={`bg-white rounded-2xl border transition-all overflow-hidden ${event.isActive ? "border-[#DADCE0] shadow-sm" : "border-[#DADCE0] opacity-70"}`}
                >
                  {/* Event Header */}
                  <div
                    className={`p-5 flex flex-col xl:flex-row gap-5 items-start hover:bg-[#F8F9FA] transition-colors cursor-pointer ${isEventExpanded ? "border-b border-[#DADCE0]" : ""}`}
                    onClick={() => toggleEventCard(event.id)}
                  >
                    <div
                      className="flex items-center gap-3 flex-1 w-full"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <svg
                        className={`w-5 h-5 text-slate-400 transition-transform ${isEventExpanded ? "rotate-180" : ""}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                      <input
                        type="text"
                        value={event.title}
                        onChange={(e) =>
                          handleChangeEvent(event.id, "title", e.target.value)
                        }
                        placeholder="Nama Event (Cth: IKA UII RUN 2026)"
                        className="flex-1 bg-transparent border-b border-transparent hover:border-[#DADCE0] focus:border-[#1A73E8] outline-none text-base font-medium text-slate-800 py-0.5 transition-colors"
                      />
                    </div>

                    <div
                      className="flex items-center gap-4 ml-8 md:ml-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <label className="flex items-center cursor-pointer mr-2">
                        <div className="relative">
                          <input
                            type="checkbox"
                            className="sr-only"
                            checked={event.isActive}
                            onChange={(e) =>
                              handleChangeEvent(
                                event.id,
                                "isActive",
                                e.target.checked,
                              )
                            }
                          />
                          <div
                            className={`block w-10 h-6 rounded-full transition-colors ${event.isActive ? "bg-[#1A73E8]" : "bg-[#DADCE0]"}`}
                          ></div>
                          <div
                            className={`dot absolute left-[2px] top-[2px] bg-white w-4 h-4 rounded-full transition-transform ${event.isActive ? "transform translate-x-4" : ""}`}
                          ></div>
                        </div>
                        <span className="ml-2 text-xs font-medium text-slate-600 hidden sm:block">
                          {event.isActive ? "Dibuka" : "Ditutup"}
                        </span>
                      </label>
                      <button
                        onClick={() => handleRemoveEvent(event.id)}
                        className="p-2 text-slate-400 hover:text-[#D93025] hover:bg-red-50 rounded-lg transition-colors"
                        title="Hapus Event"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Body Event */}
                  {isEventExpanded && (
                    <div className="p-5 sm:p-6 bg-white">
                      {/* 🔥 DESKRIPSI UMUM & LINK GRUP 🔥 */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1.5">
                            Deskripsi / Persyaratan Umum (Tiap baris = 1 poin)
                          </label>
                          <textarea
                            value={event.requirements || ""}
                            onChange={(e) =>
                              handleChangeEvent(
                                event.id,
                                "requirements",
                                e.target.value,
                              )
                            }
                            rows={3}
                            className="w-full p-3 border border-[#DADCE0] rounded-lg focus:border-[#1A73E8] outline-none text-sm text-slate-800 resize-none bg-white transition-colors shadow-sm"
                            placeholder="Mahasiswa aktif UII&#10;Sehat jasmani"
                          ></textarea>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1.5">
                            Link WhatsApp Grup Utama (Opsional)
                          </label>
                          <input
                            type="url"
                            value={event.linkGrupBesar || ""}
                            onChange={(e) =>
                              handleChangeEvent(
                                event.id,
                                "linkGrupBesar",
                                e.target.value,
                              )
                            }
                            className="w-full p-3 border border-[#DADCE0] rounded-lg focus:border-[#1A73E8] outline-none text-sm text-slate-800 bg-white shadow-sm"
                            placeholder="https://chat.whatsapp..."
                          />
                        </div>
                      </div>

                      <div className="space-y-4 border-t border-[#DADCE0] pt-5">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-medium text-slate-800">
                            Struktur Divisi & Posisi
                          </h4>
                          <button
                            onClick={() => handleAddGroup(event.id)}
                            className="text-[#1A73E8] text-sm font-medium hover:bg-[#F8F9FA] px-3 py-1.5 rounded-lg transition-colors border border-[#DADCE0] shadow-sm"
                          >
                            + Tambah Kelompok Divisi
                          </button>
                        </div>

                        {(event.groups || []).map((group) => {
                          const isGroupExpanded =
                            expandedGroups[group.id] !== false;
                          return (
                            <div
                              key={group.id}
                              className="border border-[#DADCE0] rounded-xl p-4 bg-[#F8F9FA]"
                            >
                              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                  <button
                                    onClick={() => toggleGroupCard(group.id)}
                                    className="text-slate-400 p-1 hover:bg-[#E8EAED] rounded transition-colors"
                                  >
                                    <svg
                                      className={`w-4 h-4 transition-transform ${isGroupExpanded ? "rotate-180" : ""}`}
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 9l-7 7-7-7"
                                      />
                                    </svg>
                                  </button>
                                  <input
                                    type="text"
                                    value={group.title}
                                    onChange={(e) =>
                                      handleChangeGroup(
                                        event.id,
                                        group.id,
                                        e.target.value,
                                      )
                                    }
                                    placeholder="Nama Kelompok Divisi (Cth: Manajemen)"
                                    className="bg-transparent border-b border-[#DADCE0] focus:border-[#1A73E8] outline-none text-sm font-medium text-slate-800 w-full sm:w-64 pb-0.5"
                                  />
                                </div>
                                <div className="flex items-center gap-2 w-full sm:w-auto justify-end ml-7 sm:ml-0">
                                  <button
                                    onClick={() =>
                                      handleRemoveGroup(event.id, group.id)
                                    }
                                    className="text-xs font-medium text-[#D93025] hover:bg-red-50 px-3 py-1.5 rounded transition-colors border border-transparent hover:border-red-200"
                                  >
                                    Hapus Grup
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleAddRole(event.id, group.id)
                                    }
                                    className="text-xs font-medium bg-white border border-[#DADCE0] text-slate-600 px-3 py-1.5 rounded hover:bg-[#E8EAED] shadow-sm transition-colors"
                                  >
                                    + Tambah Posisi
                                  </button>
                                </div>
                              </div>

                              {isGroupExpanded && (
                                <div className="space-y-2 mt-3 ml-1 sm:ml-8">
                                  {(!group.roles ||
                                    group.roles.length === 0) && (
                                    <p className="text-xs text-slate-400 italic">
                                      Belum ada posisi di kelompok ini.
                                    </p>
                                  )}
                                  {(group.roles || []).map((role) => (
                                    <div
                                      key={role.id}
                                      className="flex flex-col lg:flex-row items-center gap-2 bg-white p-2 border border-[#DADCE0] rounded-lg shadow-sm"
                                    >
                                      <input
                                        type="text"
                                        value={role.nama}
                                        onChange={(e) =>
                                          handleChangeRole(
                                            event.id,
                                            group.id,
                                            role.id,
                                            "nama",
                                            e.target.value,
                                          )
                                        }
                                        placeholder="Nama Posisi (Cth: Korlap)"
                                        className="w-full lg:w-1/3 p-2 border border-[#DADCE0] rounded text-xs outline-none focus:border-[#1A73E8] text-slate-800"
                                      />
                                      <input
                                        type="number"
                                        value={role.kuota}
                                        onChange={(e) =>
                                          handleChangeRole(
                                            event.id,
                                            group.id,
                                            role.id,
                                            "kuota",
                                            Number(e.target.value),
                                          )
                                        }
                                        placeholder="Kuota"
                                        className="w-full lg:w-20 p-2 border border-[#DADCE0] rounded text-xs text-center outline-none focus:border-[#1A73E8] text-slate-800"
                                      />
                                      <input
                                        type="url"
                                        value={role.linkWa}
                                        onChange={(e) =>
                                          handleChangeRole(
                                            event.id,
                                            group.id,
                                            role.id,
                                            "linkWa",
                                            e.target.value,
                                          )
                                        }
                                        placeholder="Link WA Posisi Khusus"
                                        className="w-full lg:flex-1 p-2 border border-[#DADCE0] rounded text-xs outline-none focus:border-[#1A73E8] text-slate-800"
                                      />
                                      <div className="flex gap-1 justify-end w-full lg:w-auto mt-2 lg:mt-0">
                                        <button
                                          onClick={() =>
                                            handleRemoveRole(
                                              event.id,
                                              group.id,
                                              role.id,
                                            )
                                          }
                                          className="p-2 text-slate-400 hover:text-[#D93025] hover:bg-red-50 rounded transition-colors"
                                        >
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
                                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                            />
                                          </svg>
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}

          <div className="pt-2">
            <button
              onClick={saveSettings}
              disabled={isSaving}
              className="w-full sm:w-auto bg-[#1A73E8] hover:bg-[#1557B0] text-white text-sm font-medium px-8 py-2.5 rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
              {isSaving ? "Menyimpan..." : "Simpan Pengaturan"}
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2 & 3: TABEL PELAMAR (Google Workspace Style) */}
      {/* ======================================================== */}
      {(activeTab === "pendaftar" || activeTab === "timInti") && (
        <div className="bg-white border border-[#DADCE0] rounded-2xl overflow-hidden shadow-sm animate-in fade-in duration-300">
          {/* Toolbars */}
          <div className="p-4 border-b border-[#DADCE0] flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-[#F8F9FA]">
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              <select
                value={filterEvent}
                onChange={(e) => {
                  setFilterEvent(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-white border border-[#DADCE0] text-slate-800 text-sm rounded-lg px-4 py-2 outline-none focus:border-[#1A73E8] shadow-sm flex-1 lg:flex-auto cursor-pointer"
              >
                <option value="all">Semua Event</option>
                {events.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.title}
                  </option>
                ))}
              </select>
              <button
                onClick={() =>
                  exportToExcel(currentTabList, `Data_Relawan_${activeTab}`)
                }
                className="bg-white border border-[#DADCE0] text-[#1A73E8] hover:bg-blue-50 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-colors"
              >
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
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>{" "}
                Ekspor Excel
              </button>
            </div>

            {/* Aksi Massal */}
            {((activeTab === "pendaftar" && selectedPending.length > 0) ||
              (activeTab === "timInti" && selectedAccepted.length > 0)) && (
              <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto bg-[#E8F0FE] p-1.5 rounded-xl border border-blue-200">
                <span className="text-sm text-[#1A73E8] font-bold ml-3 mr-3">
                  {activeTab === "pendaftar"
                    ? selectedPending.length
                    : selectedAccepted.length}{" "}
                  dipilih
                </span>
                {activeTab === "pendaftar" ? (
                  <>
                    <button
                      onClick={() => handleMassDelete(selectedPending, true)}
                      className="text-[#D93025] bg-white hover:bg-red-50 px-4 py-1.5 rounded-lg text-sm font-medium shadow-sm transition-colors"
                    >
                      Hapus
                    </button>
                    <button
                      onClick={() =>
                        handleMassUpdateStatus(selectedPending, "rejected")
                      }
                      className="text-slate-700 bg-white hover:bg-slate-50 px-4 py-1.5 rounded-lg text-sm font-medium shadow-sm transition-colors"
                    >
                      Tolak
                    </button>
                    <button
                      onClick={() =>
                        handleMassUpdateStatus(selectedPending, "accepted")
                      }
                      className="bg-[#1A73E8] hover:bg-[#1557B0] text-white px-4 py-1.5 rounded-lg text-sm font-medium shadow-sm transition-colors"
                    >
                      Terima Semua
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleMassDelete(selectedAccepted, false)}
                      className="text-[#D93025] bg-white hover:bg-red-50 px-4 py-1.5 rounded-lg text-sm font-medium shadow-sm transition-colors"
                    >
                      Hapus Permanen
                    </button>
                    <button
                      onClick={handleMassEmail}
                      className="bg-[#1A73E8] hover:bg-[#1557B0] text-white px-4 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-colors"
                    >
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
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>{" "}
                      Kirim Email Massal
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Progress Email Massal */}
          {emailProgress && (
            <div className="px-5 py-3 bg-[#E8F0FE] border-b border-[#DADCE0] flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-sm font-medium text-[#1A73E8] flex items-center gap-2">
                {emailProgress.isSending && (
                  <svg
                    className="w-4 h-4 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    ></path>
                  </svg>
                )}
                {emailProgress.isSending
                  ? "Mengirim email undangan..."
                  : "Pengiriman email selesai."}
              </span>
              <span className="text-sm font-medium text-slate-800 bg-white px-4 py-1 rounded-lg shadow-sm border border-[#DADCE0]">
                Sukses:{" "}
                <span className="text-[#1E8E3E] font-bold">
                  {emailProgress.sent}
                </span>{" "}
                | Gagal:{" "}
                <span className="text-[#D93025] font-bold">
                  {emailProgress.failed}
                </span>{" "}
                / {emailProgress.total}
              </span>
            </div>
          )}

          {/* Progress Email Individual */}
          {isSendingMail && (
            <div className="bg-[#E8F0FE] text-[#1A73E8] border-b border-[#DADCE0] text-xs font-bold text-center py-3 animate-pulse flex items-center justify-center gap-2">
              <svg
                className="w-4 h-4 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                ></path>
              </svg>
              Mengirim Email WA Individual...
            </div>
          )}

          {/* Table */}
          <div className="overflow-y-auto custom-scrollbar max-h-[500px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#DADCE0] bg-[#F8F9FA] sticky top-0 z-10 shadow-sm">
                  <th className="px-5 py-4 w-10">
                    <input
                      type="checkbox"
                      checked={
                        pagedData.length > 0 &&
                        (activeTab === "pendaftar"
                          ? selectedPending.length === pagedData.length
                          : selectedAccepted.length === pagedData.length)
                      }
                      onChange={(e) => {
                        const ids = pagedData.map((c) => c.id);
                        if (activeTab === "pendaftar")
                          setSelectedPending(e.target.checked ? ids : []);
                        else setSelectedAccepted(e.target.checked ? ids : []);
                      }}
                      className="w-4 h-4 border-[#DADCE0] rounded cursor-pointer accent-[#1A73E8]"
                    />
                  </th>
                  <th className="px-4 py-4 font-medium text-slate-500 text-xs uppercase tracking-wider">
                    NAMA KANDIDAT
                  </th>
                  <th className="px-4 py-4 font-medium text-slate-500 text-xs uppercase tracking-wider">
                    EVENT & POSISI
                  </th>
                  <th className="px-4 py-4 font-medium text-slate-500 text-xs uppercase tracking-wider hidden md:table-cell">
                    PREVIEW PENGALAMAN
                  </th>
                  <th className="px-5 py-4 font-medium text-slate-500 text-xs uppercase tracking-wider text-right">
                    AKSI
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DADCE0]">
                {pagedData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-16 text-center text-slate-500 text-sm"
                    >
                      Tidak ada data untuk ditampilkan.
                    </td>
                  </tr>
                ) : (
                  pagedData.map((crew) => {
                    const { parentEvent, roleName } = getRoleInfo(
                      crew.eventId,
                      crew.roleId || crew.divisiId || "",
                    );
                    const isChecked =
                      activeTab === "pendaftar"
                        ? selectedPending.includes(crew.id)
                        : selectedAccepted.includes(crew.id);

                    return (
                      <tr
                        key={crew.id}
                        className={`hover:bg-[#F8F9FA] transition-colors ${isChecked ? "bg-[#E8F0FE]" : ""}`}
                      >
                        <td className="px-5 py-3">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (activeTab === "pendaftar")
                                setSelectedPending(
                                  e.target.checked
                                    ? [...selectedPending, crew.id]
                                    : selectedPending.filter(
                                        (id) => id !== crew.id,
                                      ),
                                );
                              else
                                setSelectedAccepted(
                                  e.target.checked
                                    ? [...selectedAccepted, crew.id]
                                    : selectedAccepted.filter(
                                        (id) => id !== crew.id,
                                      ),
                                );
                            }}
                            className="w-4 h-4 border-[#DADCE0] rounded cursor-pointer accent-[#1A73E8]"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-slate-800">
                            {crew.nama}
                          </p>
                          <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider bg-[#F1F3F4] px-1.5 py-0.5 rounded inline-block mt-1">
                            {crew.tipe}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-[#1A73E8] font-medium">
                            {parentEvent?.title || "Data Lama"}
                          </p>
                          <p className="text-xs text-slate-500">{roleName}</p>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <div className="max-w-[250px] truncate text-xs text-slate-500 italic bg-[#F8F9FA] p-1.5 rounded border border-[#DADCE0]">
                            "
                            {crew.pengalaman ||
                              crew.motivasi ||
                              "Tidak ada keterangan..."}
                            "
                          </div>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openDetail(crew)}
                              className="text-slate-600 bg-white border border-[#DADCE0] hover:bg-[#F8F9FA] hover:text-[#1A73E8] px-4 py-2 rounded-lg text-xs font-medium transition-colors shadow-sm"
                            >
                              Detail
                            </button>

                            {/* 🔥 TOMBOL KIRIM EMAIL (DENGAN STATUS) 🔥 */}
                            {activeTab === "timInti" &&
                              (crew.emailStatus === "sent" ? (
                                <span className="text-[#1E8E3E] bg-[#E6F4EA] border border-[#1E8E3E]/30 px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm">
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={3}
                                      d="M5 13l4 4L19 7"
                                    />
                                  </svg>{" "}
                                  Terkirim
                                </span>
                              ) : crew.emailStatus === "failed" ? (
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() =>
                                      alert(
                                        `Gagal Mengirim:\n${crew.emailError || "Kesalahan Server"}`,
                                      )
                                    }
                                    className="text-[#D93025] hover:bg-red-50 p-2 rounded-full transition-colors"
                                    title="Lihat Alasan"
                                  >
                                    <svg
                                      className="w-5 h-5"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                      />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleSendEmailIndividual(crew)
                                    }
                                    disabled={isSendingMail}
                                    className="text-[#1A73E8] border border-[#1A73E8] bg-blue-50 px-3 py-2 rounded-lg text-xs font-bold hover:bg-[#1A73E8] hover:text-white transition-colors disabled:opacity-50"
                                  >
                                    Coba Lagi
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() =>
                                    handleSendEmailIndividual(crew)
                                  }
                                  disabled={isSendingMail}
                                  className="text-[#1E8E3E] bg-white border border-[#DADCE0] hover:bg-[#E6F4EA] px-3 py-2 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                                >
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
                                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                    />
                                  </svg>{" "}
                                  Email
                                </button>
                              ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-[#DADCE0] flex flex-col md:flex-row justify-between items-center bg-white gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 hidden sm:block">
                Baris per halaman:
              </span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="text-xs text-slate-800 outline-none bg-transparent border border-[#DADCE0] rounded-lg p-1.5 focus:border-[#1A73E8]"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={0}>Semua</option>
              </select>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span>
                {currentPage} dari {totalPages}
              </span>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 bg-white border border-[#DADCE0] hover:bg-[#F8F9FA] rounded-lg disabled:opacity-30 transition-colors shadow-sm"
                >
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
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="p-1.5 bg-white border border-[#DADCE0] hover:bg-[#F8F9FA] rounded-lg disabled:opacity-30 transition-colors shadow-sm"
                >
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
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL DETAIL (RUANG SIDANG) */}
      {/* ======================================================== */}
      {isDetailOpen && selectedCrew && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#DADCE0] flex justify-between items-center bg-white">
              <h2 className="text-lg font-medium text-slate-800">
                Detail Pelamar
              </h2>
              <button
                onClick={() => setIsDetailOpen(false)}
                className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 p-1.5 rounded-full transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 custom-scrollbar text-sm text-slate-800 space-y-6">
              <div>
                <h3 className="text-xl font-bold mb-1">{selectedCrew.nama}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-slate-600 uppercase text-[10px] font-bold tracking-widest bg-slate-100 border border-[#DADCE0] px-2 py-0.5 rounded">
                    {selectedCrew.tipe}
                  </span>
                  <span className="text-slate-500 text-xs font-medium">
                    Terdaftar:{" "}
                    {new Date(selectedCrew.waktuDaftar).toLocaleDateString(
                      "id-ID",
                    )}
                  </span>
                </div>
              </div>

              <div className="space-y-3 py-4 border-y border-[#DADCE0] text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">WhatsApp</span>
                  <span className="font-bold">{selectedCrew.whatsapp}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Email</span>
                  <span className="font-bold truncate max-w-[200px]">
                    {selectedCrew.email}
                  </span>
                </div>
                {selectedCrew.fakultas && (
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Akademik</span>
                    <span className="font-bold">
                      {selectedCrew.fakultas} '{selectedCrew.angkatan}
                    </span>
                  </div>
                )}
                {selectedCrew.instansi && (
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-500 font-medium whitespace-nowrap">
                      {selectedCrew.tipe === "alumni"
                        ? "Pekerjaan"
                        : "Organisasi"}
                    </span>
                    <span className="font-bold text-right break-words">
                      {selectedCrew.instansi}{" "}
                      {selectedCrew.jabatan
                        ? `— Jabatan: ${selectedCrew.jabatan}`
                        : ""}
                    </span>
                  </div>
                )}
                {selectedCrew.domisili && (
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-500 font-medium">Domisili</span>
                    <span className="font-bold text-right break-words">
                      {selectedCrew.domisili}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <span className="text-xs font-bold text-slate-600 block mb-1.5 uppercase tracking-widest">
                    Motivasi
                  </span>
                  <div className="bg-[#F8F9FA] p-4 rounded-xl border border-[#DADCE0] whitespace-pre-wrap leading-relaxed text-[13px] shadow-inner text-slate-700">
                    {selectedCrew.motivasi || "-"}
                  </div>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-600 block mb-1.5 uppercase tracking-widest">
                    Pengalaman Terkait
                  </span>
                  <div className="bg-[#F8F9FA] p-4 rounded-xl border border-[#DADCE0] whitespace-pre-wrap leading-relaxed text-[13px] shadow-inner text-slate-700">
                    {selectedCrew.pengalaman || "-"}
                  </div>
                </div>
              </div>

              {/* Re-Assign Role */}
              {selectedCrew.status !== "rejected" && (
                <div className="pt-3">
                  <label className="text-xs font-bold text-[#1A73E8] block mb-2">
                    Ubah Penempatan (Admin):
                  </label>
                  <select
                    value={newAssignedRoleId}
                    onChange={(e) => setNewAssignedRoleId(e.target.value)}
                    className="w-full p-3 bg-white border border-[#1A73E8] rounded-xl text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-[#1A73E8]/20 shadow-sm cursor-pointer"
                  >
                    <option value="">-- Pindah Posisi / Data Lama --</option>
                    {events.map((e) =>
                      (e.groups || []).map((g) => (
                        <optgroup key={g.id} label={`${e.title} - ${g.title}`}>
                          {(g.roles || []).map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.nama} (Kuota: {r.kuota})
                            </option>
                          ))}
                        </optgroup>
                      )),
                    )}
                  </select>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-[#DADCE0] flex justify-end gap-3 bg-[#F8F9FA]">
              <button
                onClick={() => setIsDetailOpen(false)}
                className="text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 px-5 py-2.5 rounded-xl text-sm font-bold transition-colors shadow-sm"
              >
                Tutup
              </button>
              {selectedCrew.status !== "rejected" && (
                <button
                  onClick={() => handleDecision("rejected")}
                  className="text-[#D93025] bg-white border border-rose-200 hover:bg-red-50 px-5 py-2.5 rounded-xl text-sm font-bold transition-colors shadow-sm"
                >
                  Tolak
                </button>
              )}
              {selectedCrew.status !== "accepted" && (
                <button
                  onClick={() => handleDecision("accepted")}
                  className="bg-[#1A73E8] hover:bg-[#1557B0] text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-colors shadow-md"
                >
                  Terima Relawan
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
