"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "@/lib/toast";
import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  onSnapshot,
  deleteDoc,
  query,
  orderBy,
  setDoc,
} from "firebase/firestore";
import { writeBatch } from "firebase/firestore";
import * as XLSX from "xlsx";

// --- KUMPULAN IKON MATERIAL ---
const IconSettings = () => (
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
      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
  </svg>
);
const IconPending = () => (
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
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);
const IconCheckBadge = () => (
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
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);
const IconMail = () => (
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
      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
    />
  </svg>
);
const IconCertificate = () => (
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
      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
    />
  </svg>
);
const IconCheckCircle = () => (
  <svg
    className="w-5 h-5 text-emerald-500"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);
const IconErrorCircle = () => (
  <svg
    className="w-5 h-5 text-red-500"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);
const IconDetail = () => (
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
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
    />
  </svg>
);
const IconArrowUp = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2.5}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
  </svg>
);
const IconArrowDown = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2.5}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);

// --- TYPE DEFINITIONS ---
interface RolePosition {
  id: string;
  nama: string;
  kuota: number;
  linkWa: string;
  deskripsi?: string;
}

interface DivisionGroup {
  id: string;
  title: string;
  roles: RolePosition[];
}

interface EventRecruitment {
  id: string;
  title: string;
  requirements: string;
  isActive: boolean;
  linkGrupBesar: string;
  linkSertifikat?: string;
  order?: number;
  groups: DivisionGroup[];
}

interface CrewMember {
  id: string;
  eventId: string;
  roleId: string;
  divisiId?: string;
  nama: string;
  jenisKelamin?: string;
  tempatLahir?: string;
  tanggalLahir?: string;
  email: string;
  whatsapp: string;
  instagram?: string;
  riwayatPenyakit?: string;
  ukuranJersey?: string;
  fotoIdCard?: string;
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
  alasanDivisi?: string;
  bersediaPindahDivisi?: string;
  kendaraan?: string;
  bersediaPelatihan?: string;
  emailStatus?: "sent" | "failed" | null;
  certEmailStatus?: "sent" | "failed" | null;
  emailError?: string;
  sourceDb: "crew_volunteers" | "oprec_pelamar";
}

export default function CrewManagementPage() {
  const [activeTab, setActiveTab] = useState<
    "pengaturan" | "pendaftar" | "timInti" | "ditolak"
  >("pengaturan");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [popup, setPopup] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Data State
  const [events, setEvents] = useState<EventRecruitment[]>([]);
  const [pendaftarNew, setPendaftarNew] = useState<CrewMember[]>([]);
  const [pendaftarOld, setPendaftarOld] = useState<CrewMember[]>([]);
  const initialLoadDone = useRef(false);

  // Menggabungkan data lama dan baru
  const pendaftar = [...pendaftarNew, ...pendaftarOld].sort(
    (a, b) =>
      new Date(b.waktuDaftar).getTime() - new Date(a.waktuDaftar).getTime(),
  );

  // UI State
  const [selectedCrew, setSelectedCrew] = useState<CrewMember | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [newAssignedRoleId, setNewAssignedRoleId] = useState("");
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
  const [selectedRejected, setSelectedRejected] = useState<string[]>([]);

  // STATE UNTUK MODE EDIT DATA
  const [isEditingData, setIsEditingData] = useState(false);
  const [editFormData, setEditFormData] = useState<any>({});

  // Email State
  const [isSendingMail, setIsSendingMail] = useState(false);
  const [emailProgress, setEmailProgress] = useState<{
    total: number;
    sent: number;
    failed: number;
    isSending: boolean;
    type: "welcome" | "cert";
  } | null>(null);

  useEffect(() => {
    // 1. AMBIL SETTING OPREC
    const unsubSettings = onSnapshot(collection(db, "oprec_master"), (snap) => {
      const loadedEvents = snap.docs
        .map(
          (doc) =>
            ({ id: doc.id, order: 0, ...doc.data() }) as EventRecruitment,
        )
        .sort((a, b) => (a.order || 0) - (b.order || 0));

      setEvents(loadedEvents);

      if (!initialLoadDone.current) {
        initialLoadDone.current = true;
      }
    });

    // 2. AMBIL DATA PELAMAR BARU (oprec_pelamar)
    const qNew = query(
      collection(db, "oprec_pelamar"),
      orderBy("waktuDaftar", "desc"),
    );
    const unsubNew = onSnapshot(qNew, (snap) => {
      const data = snap.docs.map(
        (d) =>
          ({ id: d.id, sourceDb: "oprec_pelamar", ...d.data() }) as CrewMember,
      );
      setPendaftarNew(data);
    });

    // 3. AMBIL DATA PELAMAR LAMA (crew_volunteers)
    const qOld = query(
      collection(db, "crew_volunteers"),
      orderBy("waktuDaftar", "desc"),
    );
    const unsubOld = onSnapshot(qOld, (snap) => {
      const data = snap.docs.map(
        (d) =>
          ({
            id: d.id,
            sourceDb: "crew_volunteers",
            ...d.data(),
          }) as CrewMember,
      );
      setPendaftarOld(data);
      setIsLoading(false);
    });

    return () => {
      unsubSettings();
      unsubNew();
      unsubOld();
    };
  }, []);

  // Sync selectedCrew ketika data berubah agar modal update realtime
  useEffect(() => {
    if (selectedCrew && !isEditingData) {
      const updatedSelected = pendaftar.find((c) => c.id === selectedCrew.id);
      if (updatedSelected) setSelectedCrew(updatedSelected);
    }
  }, [pendaftar, selectedCrew, isEditingData]);

  const showNotif = (type: "success" | "error", text: string) => {
    setPopup({ type, text });
    setTimeout(() => setPopup(null), 4000);
  };

  const getRoleFilledCount = (roleId: string) => {
    return pendaftar.filter(
      (c) =>
        c.status === "accepted" &&
        (c.roleId === roleId || c.divisiId === roleId),
    ).length;
  };

  // ========================================================
  // LOGIKA PENGATURAN EVENT & REORDER
  // ========================================================
  const toggleEventCard = (id: string) =>
    setExpandedEvents((prev) => ({ ...prev, [id]: !prev[id] }));
  const toggleGroupCard = (id: string) =>
    setExpandedGroups((prev) => ({ ...prev, [id]: !prev[id] }));

  const moveEvent = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === events.length - 1) return;
    const newEvents = [...events];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    [newEvents[index], newEvents[targetIndex]] = [
      newEvents[targetIndex],
      newEvents[index],
    ];
    setEvents(newEvents);
  };

  const moveGroup = (
    eventId: string,
    groupIndex: number,
    direction: "up" | "down",
  ) => {
    setEvents(
      events.map((ev) => {
        if (ev.id !== eventId) return ev;
        const newGroups = [...(ev.groups || [])];
        if (direction === "up" && groupIndex === 0) return ev;
        if (direction === "down" && groupIndex === newGroups.length - 1)
          return ev;
        const targetIndex =
          direction === "up" ? groupIndex - 1 : groupIndex + 1;
        [newGroups[groupIndex], newGroups[targetIndex]] = [
          newGroups[targetIndex],
          newGroups[groupIndex],
        ];
        return { ...ev, groups: newGroups };
      }),
    );
  };

  const moveRole = (
    eventId: string,
    groupId: string,
    roleIndex: number,
    direction: "up" | "down",
  ) => {
    setEvents(
      events.map((ev) => {
        if (ev.id !== eventId) return ev;
        const newGroups = (ev.groups || []).map((g) => {
          if (g.id !== groupId) return g;
          const newRoles = [...(g.roles || [])];
          if (direction === "up" && roleIndex === 0) return g;
          if (direction === "down" && roleIndex === newRoles.length - 1)
            return g;
          const targetIndex =
            direction === "up" ? roleIndex - 1 : roleIndex + 1;
          [newRoles[roleIndex], newRoles[targetIndex]] = [
            newRoles[targetIndex],
            newRoles[roleIndex],
          ];
          return { ...g, roles: newRoles };
        });
        return { ...ev, groups: newGroups };
      }),
    );
  };

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
        linkSertifikat: "",
        groups: [],
        order: events.length,
      },
    ]);
    setExpandedEvents((prev) => ({ ...prev, [newId]: true }));
  };

  const handleRemoveEvent = async (id: string) => {
    if (!confirm("Hapus event kepanitiaan ini secara permanen?")) return;
    try {
      await deleteDoc(doc(db, "oprec_master", id));
      setEvents(events.filter((e) => e.id !== id));
      showNotif("success", "Event berhasil dihapus.");
    } catch (e) {
      showNotif("error", "Gagal menghapus event.");
    }
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
      events.map((e) =>
        e.id === eventId
          ? {
              ...e,
              groups: (e.groups || []).map((g) =>
                g.id === groupId ? { ...g, title: newTitle } : g,
              ),
            }
          : e,
      ),
    );
  };

  const handleRemoveGroup = async (eventId: string, groupId: string) => {
    if (!confirm("Hapus kelompok divisi ini?")) return;
    setEvents(
      events.map((e) =>
        e.id === eventId
          ? { ...e, groups: (e.groups || []).filter((g) => g.id !== groupId) }
          : e,
      ),
    );
  };

  const handleAddRole = (eventId: string, groupId: string) => {
    setEvents(
      events.map((e) =>
        e.id === eventId
          ? {
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
                          deskripsi: "",
                        },
                      ],
                    }
                  : g,
              ),
            }
          : e,
      ),
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
      events.map((e) =>
        e.id === eventId
          ? {
              ...e,
              groups: (e.groups || []).map((g) =>
                g.id === groupId
                  ? {
                      ...g,
                      roles: (g.roles || []).map((r) =>
                        r.id === roleId ? { ...r, [field]: value } : r,
                      ),
                    }
                  : g,
              ),
            }
          : e,
      ),
    );
  };

  const handleRemoveRole = async (
    eventId: string,
    groupId: string,
    roleId: string,
  ) => {
    setEvents(
      events.map((e) =>
        e.id === eventId
          ? {
              ...e,
              groups: (e.groups || []).map((g) =>
                g.id === groupId
                  ? {
                      ...g,
                      roles: (g.roles || []).filter((r) => r.id !== roleId),
                    }
                  : g,
              ),
            }
          : e,
      ),
    );
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      const batch = writeBatch(db);
      events.forEach((ev, index) => {
        const docRef = doc(db, "oprec_master", ev.id);
        batch.set(docRef, { ...ev, order: index });
      });
      await batch.commit();
      showNotif("success", "Pengaturan kepanitiaan berhasil disimpan.");
    } catch (error) {
      showNotif("error", "Gagal menyimpan pengaturan.");
    } finally {
      setIsSaving(false);
    }
  };

  // ========================================================
  // LOGIKA REVIEW & EDIT DATA PELAMAR
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
    setIsEditingData(false);
    setEditFormData(crew);
    setIsDetailOpen(true);
  };

  const findEventIdByRoleId = (roleId: string, fallbackEventId: string) => {
    if (!roleId) return fallbackEventId;
    for (const e of events) {
      for (const g of e.groups || []) {
        if ((g.roles || []).some((r) => r.id === roleId)) return e.id;
      }
    }
    return fallbackEventId;
  };

  const handleDecision = async (
    status: "accepted" | "rejected" | "pending",
  ) => {
    if (!selectedCrew) return;
    const actionText =
      status === "accepted"
        ? "TERIMA"
        : status === "rejected"
          ? "TOLAK"
          : "PULIHKAN";
    if (!confirm(`Konfirmasi: ${actionText} pelamar ini?`)) return;

    let alasanTolak = "";
    if (status === "rejected") {
      alasanTolak = prompt(
        "Masukkan alasan penolakan (akan dikirim ke email pendaftar):",
      ) || "Maaf, kuota telah terpenuhi atau kualifikasi belum sesuai.";
    }

    const updatedEventId = findEventIdByRoleId(
      newAssignedRoleId,
      selectedCrew.eventId,
    );

    try {
      const updateData: any = { status, roleId: newAssignedRoleId, eventId: updatedEventId };
      if (status === "rejected") {
        updateData.alasanTolak = alasanTolak;
        updateData.emailStatus = ""; // reset email status so it can be resent
      } else if (status === "accepted") {
        updateData.emailStatus = "";
      }
      await setDoc(
        doc(db, selectedCrew.sourceDb, selectedCrew.id),
        updateData,
        { merge: true },
      );
      showNotif("success", "Status dan Posisi berhasil diperbarui.");
      setIsDetailOpen(false);

      setSelectedPending(
        selectedPending.filter((id) => id !== selectedCrew.id),
      );
      setSelectedRejected(
        selectedRejected.filter((id) => id !== selectedCrew.id),
      );
    } catch (e) {
      showNotif("error", "Gagal memperbarui status.");
    }
  };

  const handleUpdateRoleOnly = async () => {
    if (!selectedCrew) return;
    const updatedEventId = findEventIdByRoleId(
      newAssignedRoleId,
      selectedCrew.eventId,
    );
    try {
      await setDoc(
        doc(db, selectedCrew.sourceDb, selectedCrew.id),
        { roleId: newAssignedRoleId, eventId: updatedEventId },
        { merge: true },
      );
      showNotif("success", "Posisi divisi berhasil diperbarui.");
      setIsDetailOpen(false);
    } catch (e) {
      showNotif("error", "Gagal memperbarui posisi.");
    }
  };

  const saveEditedData = async () => {
    if (!selectedCrew) return;
    try {
      await setDoc(
        doc(db, selectedCrew.sourceDb, selectedCrew.id),
        editFormData,
        { merge: true },
      );
      showNotif("success", "Data pelamar berhasil diperbarui!");
      setSelectedCrew({ ...selectedCrew, ...editFormData });
      setIsEditingData(false);
    } catch (e) {
      showNotif("error", "Gagal menyimpan perubahan data.");
    }
  };

  const handleEditChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
  };

  // ========================================================
  // MASS ACTIONS & EXPORT
  // ========================================================
  const handleMassUpdateStatus = async (
    ids: string[],
    newStatus: "accepted" | "rejected" | "pending",
  ) => {
    const actionText =
      newStatus === "accepted"
        ? "Diterima"
        : newStatus === "rejected"
          ? "Ditolak"
          : "Dipulihkan (Pending)";
    if (!confirm(`Ubah status ${ids.length} pelamar menjadi ${actionText}?`))
      return;

    let alasanTolak = "";
    if (newStatus === "rejected") {
      alasanTolak = prompt(
        "Masukkan alasan penolakan (akan dikirim ke email pendaftar):",
      ) || "Maaf, kuota telah terpenuhi atau kualifikasi belum sesuai.";
    }

    try {
      const batch = writeBatch(db);
      ids.forEach((id) => {
        const crew = pendaftar.find((c) => c.id === id);
        if (crew) {
          const updateData: any = { status: newStatus };
          if (newStatus === "rejected") {
            updateData.alasanTolak = alasanTolak;
            updateData.emailStatus = ""; // reset email status so it can be resent
          } else if (newStatus === "accepted") {
            updateData.emailStatus = "";
          }
          batch.update(doc(db, crew.sourceDb, id), updateData);
        }
      });
      await batch.commit();
      setSelectedPending([]);
      setSelectedRejected([]);
      showNotif("success", "Status massal diperbarui.");
    } catch (err) {
      showNotif("error", "Gagal memproses pembaruan massal.");
    }
  };

  const handleMassDelete = async (
    ids: string[],
    tabSource: "pending" | "accepted" | "rejected",
  ) => {
    if (!confirm(`Hapus permanen ${ids.length} data terpilih dari sistem?`))
      return;
    try {
      const batch = writeBatch(db);
      ids.forEach((id) => {
        const crew = pendaftar.find((c) => c.id === id);
        if (crew) {
          batch.delete(doc(db, crew.sourceDb, id));
        }
      });
      await batch.commit();

      if (tabSource === "pending") setSelectedPending([]);
      else if (tabSource === "accepted") setSelectedAccepted([]);
      else setSelectedRejected([]);

      showNotif("success", "Data dihapus secara permanen.");
    } catch (err) {
      showNotif("error", "Gagal menghapus data.");
    }
  };

  // --- EMAIL FUNCTIONS ---
  const handleSendWelcomeEmail = async (crew: CrewMember) => {
    const { parentEvent, roleName, roleLink } = getRoleInfo(
      crew.eventId,
      crew.roleId || crew.divisiId || "",
    );
    const targetLinkBesar = parentEvent?.linkGrupBesar || "";
    if (!targetLinkBesar && !roleLink)
      if (
        !confirm(
          "Belum ada Link WA yang diatur di event ini. Tetap kirim email?",
        )
      )
        return;

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
        await setDoc(
          doc(db, crew.sourceDb, crew.id),
          { emailStatus: "sent", emailError: "" },
          { merge: true },
        );
        showNotif("success", `Undangan terkirim ke ${crew.nama}`);
      } else {
        showNotif("error", "Gagal mengirim undangan.");
      }
    } catch (e: any) {
      showNotif("error", "Error sistem.");
    } finally {
      setIsSendingMail(false);
    }
  };

  const handleSendRejectEmail = async (crew: CrewMember) => {
    const { parentEvent } = getRoleInfo(crew.eventId, crew.roleId || crew.divisiId || "");
    setIsSendingMail(true);
    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "crew_rejected",
          email: crew.email,
          nama: crew.nama,
          detail: {
            event: parentEvent?.title || "Kepanitiaan",
            alasanTolak: crew.alasanTolak || "Kualifikasi belum memenuhi kebutuhan panitia.",
          },
        }),
      });
      if (response.ok) {
        await setDoc(
          doc(db, crew.sourceDb, crew.id),
          { emailStatus: "sent", emailError: "" },
          { merge: true },
        );
        showNotif("success", `Notifikasi penolakan terkirim ke ${crew.nama}`);
      } else {
        showNotif("error", "Gagal mengirim notifikasi.");
      }
    } catch (e: any) {
      showNotif("error", "Error sistem.");
    } finally {
      setIsSendingMail(false);
    }
  };

  const handleResendEmail = async () => {
    if (!selectedCrew) return;
    if (selectedCrew.status === "accepted") {
      await handleSendWelcomeEmail(selectedCrew);
    } else if (selectedCrew.status === "rejected") {
      await handleSendRejectEmail(selectedCrew);
    } else {
      showNotif("warning", "Hanya untuk pelamar Diterima / Ditolak.");
    }
  };

  const handleSendCertEmail = async (crew: CrewMember) => {
    const { parentEvent } = getRoleInfo(
      crew.eventId,
      crew.roleId || crew.divisiId || "",
    );
    const certLink = parentEvent?.linkSertifikat || "";
    if (!certLink) {
      toast.warning("Link E-Sertifikat belum diatur!");
      return;
    }

    setIsSendingMail(true);
    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "certificate_crew",
          email: crew.email,
          nama: crew.nama,
          detail: {
            event: parentEvent?.title || "Kepanitiaan",
            linkSertifikat: certLink,
          },
        }),
      });
      if (response.ok) {
        await setDoc(
          doc(db, crew.sourceDb, crew.id),
          { certEmailStatus: "sent", emailError: "" },
          { merge: true },
        );
        showNotif("success", `Sertifikat terkirim ke ${crew.nama}`);
      } else {
        showNotif("error", "Gagal mengirim sertifikat.");
      }
    } catch (e: any) {
      showNotif("error", "Error sistem.");
    } finally {
      setIsSendingMail(false);
    }
  };

  const handleMassEmail = async (type: "welcome" | "cert") => {
    if (selectedAccepted.length === 0) return;
    const isCert = type === "cert";
    if (
      !confirm(
        `Kirim ${isCert ? "Sertifikat" : "Undangan WA"} ke ${selectedAccepted.length} kandidat yang diterima?`,
      )
    )
      return;

    setEmailProgress({
      total: selectedAccepted.length,
      sent: 0,
      failed: 0,
      isSending: true,
      type,
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
      if (isCert && (!parentEvent || !parentEvent.linkSertifikat)) {
        failCount++;
        continue;
      }

      try {
        const response = await fetch("/api/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: isCert ? "certificate_crew" : "crew_accepted",
            email: crew.email,
            nama: crew.nama,
            detail: isCert
              ? {
                  event: parentEvent?.title || "Kepanitiaan",
                  linkSertifikat: parentEvent?.linkSertifikat,
                }
              : {
                  event: parentEvent?.title || "Kepanitiaan",
                  divisi: roleName,
                  linkGrupBesar: parentEvent?.linkGrupBesar || "",
                  linkGrupDivisi: roleLink,
                },
          }),
        });
        if (response.ok) {
          await setDoc(
            doc(db, crew.sourceDb, crew.id),
            isCert
              ? { certEmailStatus: "sent" }
              : { emailStatus: "sent", emailError: "" },
            { merge: true },
          );
          sentCount++;
        } else {
          failCount++;
        }
      } catch (e: any) {
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
        "Jenis Kelamin": c.jenisKelamin || "-",
        "Tempat & Tgl Lahir": c.tempatLahir
          ? `${c.tempatLahir}, ${c.tanggalLahir}`
          : "-",
        Kategori: c.tipe.toUpperCase(),
        Email: c.email,
        WhatsApp: c.whatsapp,
        Instagram: c.instagram || "-",
        "Riwayat Penyakit": c.riwayatPenyakit || "-",
        "Ukuran Jersey": c.ukuranJersey || "-",
        Kendaraan: c.kendaraan || "-",
        "Bersedia Pindah Divisi": c.bersediaPindahDivisi || "-",
        "Bersedia Pelatihan": c.bersediaPelatihan || "-",
        "Instansi/UKM": c.instansi || "-",
        Jabatan: c.jabatan || "-",
        "Fakultas / Jurusan": c.fakultas || "-",
        Angkatan: c.angkatan || "-",
        Domisili: c.domisili || "-",
        "Alasan Pilih Divisi": c.alasanDivisi || "-",
        Motivasi: c.motivasi || "-",
        Pengalaman: c.pengalaman || "-",
        "Link Foto ID": c.fotoIdCard || "-",
        "Status Terkini":
          c.status === "accepted"
            ? "Diterima"
            : c.status === "pending"
              ? "Menunggu"
              : "Ditolak",
      };
    });
    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `Data_${activeTab}`);
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  };

  const currentTabList = pendaftar.filter(
    (c) =>
      (activeTab === "pendaftar"
        ? c.status === "pending"
        : activeTab === "timInti"
          ? c.status === "accepted"
          : activeTab === "ditolak"
            ? c.status === "rejected"
            : false) &&
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
      <div className="h-screen flex items-center justify-center text-[#1A73E8]">
        <div className="w-8 h-8 border-4 border-blue-100 border-t-[#1A73E8] rounded-full animate-spin"></div>
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto pb-32 font-sans p-4 sm:p-8 bg-[#F8F9FA] min-h-screen">
      {popup && (
        <div className="fixed top-6 right-6 z-[9999] min-w-[280px] bg-white border border-[#DADCE0] px-4 py-3 rounded-lg shadow-xl flex items-center gap-3 animate-in slide-in-from-right-8 fade-in duration-300">
          {popup.type === "success" ? <IconCheckCircle /> : <IconErrorCircle />}
          <span className="text-sm font-medium text-slate-700">
            {popup.text}
          </span>
        </div>
      )}

      {/* HEADER */}
      <div className="mb-6 border-b border-[#DADCE0] pb-4">
        <h1 className="text-2xl font-medium text-slate-800 tracking-tight">
          Manajemen Kru & Relawan
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Konfigurasi struktur rekrutmen, peninjauan pelamar, dan pengiriman
          notifikasi.
        </p>
      </div>

      {/* MATERIAL TABS */}
      <div className="flex gap-3 mb-8 overflow-x-auto hide-scrollbar pb-2">
        {[
          { id: "pengaturan", label: "Setup Lowongan", icon: <IconSettings /> },
          { id: "pendaftar", label: "Menunggu Review", icon: <IconPending /> },
          { id: "timInti", label: "Diterima", icon: <IconCheckBadge /> },
          { id: "ditolak", label: "Ditolak", icon: <IconErrorCircle /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as any);
              setCurrentPage(1);
            }}
            className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all flex items-center gap-2 border whitespace-nowrap ${activeTab === tab.id ? "bg-[#E8F0FE] text-[#1A73E8] border-[#1A73E8]/30 shadow-sm" : "bg-white text-slate-600 hover:bg-slate-50 border-[#DADCE0]"}`}
          >
            {tab.icon} {tab.label}
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
            {tab.id === "ditolak" &&
              pendaftar.filter((c) => c.status === "rejected").length > 0 && (
                <span className="bg-slate-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold ml-1">
                  {pendaftar.filter((c) => c.status === "rejected").length}
                </span>
              )}
          </button>
        ))}
      </div>

      {/* TAB 1: PENGATURAN */}
      {activeTab === "pengaturan" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
            <h2 className="text-base font-medium text-slate-800">
              Daftar Event Kepanitiaan (OPREC)
            </h2>
            <button
              onClick={handleAddEvent}
              className="bg-white border border-[#DADCE0] text-[#1A73E8] hover:bg-[#F8F9FA] px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              + Tambah Event Baru
            </button>
          </div>

          {events.length === 0 ? (
            <div className="bg-white border border-dashed border-[#DADCE0] rounded-2xl p-16 text-center shadow-sm">
              <p className="text-slate-500 font-medium text-sm">
                Belum ada event kepanitiaan. Klik tombol di atas untuk memulai.
              </p>
            </div>
          ) : (
            events.map((event, eventIdx) => {
              const isEventExpanded = expandedEvents[event.id] === true;
              return (
                <div
                  key={event.id}
                  className={`bg-white rounded-2xl border transition-all overflow-hidden ${event.isActive ? "border-[#DADCE0] shadow-sm" : "border-[#DADCE0] opacity-70"}`}
                >
                  <div
                    className={`p-4 sm:p-5 flex flex-col xl:flex-row gap-4 xl:gap-5 items-start xl:items-center hover:bg-[#F8F9FA] transition-colors cursor-pointer ${isEventExpanded ? "border-b border-[#DADCE0] bg-[#F8F9FA]" : ""}`}
                    onClick={() => toggleEventCard(event.id)}
                  >
                    <div
                      className="flex xl:flex-col gap-1 items-center bg-white border border-[#DADCE0] rounded-lg p-1 mr-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => moveEvent(eventIdx, "up")}
                        disabled={eventIdx === 0}
                        className="p-1 text-slate-400 hover:text-[#1A73E8] hover:bg-blue-50 rounded disabled:opacity-30"
                      >
                        <IconArrowUp />
                      </button>
                      <button
                        onClick={() => moveEvent(eventIdx, "down")}
                        disabled={eventIdx === events.length - 1}
                        className="p-1 text-slate-400 hover:text-[#1A73E8] hover:bg-blue-50 rounded disabled:opacity-30"
                      >
                        <IconArrowDown />
                      </button>
                    </div>

                    <div
                      className="flex items-center gap-3 flex-1 w-full"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span
                        className={`text-slate-400 transition-transform ${isEventExpanded ? "rotate-180" : ""}`}
                        onClick={() => toggleEventCard(event.id)}
                      >
                        ▼
                      </span>
                      <input
                        type="text"
                        value={event.title}
                        onChange={(e) =>
                          handleChangeEvent(event.id, "title", e.target.value)
                        }
                        placeholder="Nama Event (Cth: IKA UII RUN 2026)"
                        className="flex-1 bg-transparent border-b border-transparent hover:border-[#DADCE0] focus:border-[#1A73E8] outline-none text-base font-bold text-[#0F2147] py-0.5 transition-colors"
                      />
                    </div>
                    <div
                      className="flex items-center gap-4 ml-8 xl:ml-0"
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
                        <span className="ml-2 text-xs font-bold text-slate-600 hidden sm:block">
                          {event.isActive ? "Dibuka" : "Ditutup"}
                        </span>
                      </label>
                      <button
                        onClick={() => handleRemoveEvent(event.id)}
                        className="p-2 text-slate-400 hover:text-[#D93025] hover:bg-red-50 rounded-lg transition-colors"
                        title="Hapus Event"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {isEventExpanded && (
                    <div className="p-5 sm:p-6 bg-white animate-in slide-in-from-top-2 duration-200">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <div className="md:col-span-1">
                          <label className="block text-xs font-medium text-slate-600 mb-1.5">
                            Deskripsi / Persyaratan Umum
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
                            rows={4}
                            className="w-full p-3 border border-[#DADCE0] rounded-lg focus:border-[#1A73E8] outline-none text-sm text-slate-800 resize-none shadow-sm"
                            placeholder="Persyaratan..."
                          ></textarea>
                        </div>
                        <div className="md:col-span-2 flex flex-col gap-4">
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
                              className="w-full p-3 border border-[#DADCE0] rounded-lg focus:border-[#1A73E8] outline-none text-sm text-slate-800 shadow-sm"
                              placeholder="https://chat.whatsapp..."
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1.5">
                              Link E-Sertifikat Kepanitiaan (G-Drive)
                            </label>
                            <input
                              type="url"
                              value={event.linkSertifikat || ""}
                              onChange={(e) =>
                                handleChangeEvent(
                                  event.id,
                                  "linkSertifikat",
                                  e.target.value,
                                )
                              }
                              className="w-full p-3 border border-[#DADCE0] rounded-lg focus:border-[#1A73E8] outline-none text-sm text-slate-800 shadow-sm"
                              placeholder="https://drive.google.com/..."
                            />
                          </div>
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
                            + Tambah Kelompok
                          </button>
                        </div>
                        {(event.groups || []).map((group, groupIdx) => {
                          const isGroupExpanded =
                            expandedGroups[group.id] === true;
                          return (
                            <div
                              key={group.id}
                              className="border border-[#DADCE0] rounded-xl p-3 bg-[#F8F9FA]"
                            >
                              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-2">
                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                  <div className="flex gap-1 items-center bg-white border border-[#DADCE0] rounded-md px-1 mr-1">
                                    <button
                                      onClick={() =>
                                        moveGroup(event.id, groupIdx, "up")
                                      }
                                      disabled={groupIdx === 0}
                                      className="p-1 text-slate-400 hover:text-[#1A73E8] hover:bg-blue-50 rounded disabled:opacity-30"
                                    >
                                      <IconArrowUp />
                                    </button>
                                    <button
                                      onClick={() =>
                                        moveGroup(event.id, groupIdx, "down")
                                      }
                                      disabled={
                                        groupIdx ===
                                        (event.groups || []).length - 1
                                      }
                                      className="p-1 text-slate-400 hover:text-[#1A73E8] hover:bg-blue-50 rounded disabled:opacity-30"
                                    >
                                      <IconArrowDown />
                                    </button>
                                  </div>
                                  <button
                                    onClick={() => toggleGroupCard(group.id)}
                                    className="text-slate-400 p-1 hover:bg-[#E8EAED] rounded transition-colors"
                                  >
                                    <span
                                      className={`inline-block transition-transform ${isGroupExpanded ? "rotate-180" : ""}`}
                                    >
                                      ▼
                                    </span>
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
                                    placeholder="Nama Kelompok Divisi"
                                    className="bg-transparent border-b border-[#DADCE0] focus:border-[#1A73E8] outline-none text-sm font-bold text-[#0F2147] w-full sm:w-64 pb-0.5"
                                  />
                                </div>
                                <div className="flex items-center gap-2 w-full sm:w-auto justify-end ml-7 sm:ml-0">
                                  <button
                                    onClick={() =>
                                      handleRemoveGroup(event.id, group.id)
                                    }
                                    className="text-xs font-bold text-[#D93025] hover:bg-red-50 px-3 py-1.5 rounded transition-colors"
                                  >
                                    Hapus Grup
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleAddRole(event.id, group.id)
                                    }
                                    className="text-xs font-bold bg-white border border-[#DADCE0] text-slate-600 px-3 py-1.5 rounded hover:bg-[#E8EAED] shadow-sm transition-colors"
                                  >
                                    + Tambah Posisi
                                  </button>
                                </div>
                              </div>

                              {isGroupExpanded && (
                                <div className="space-y-3 mt-3 sm:ml-12 border-l-2 border-[#1A73E8]/20 pl-4 py-1">
                                  {(!group.roles ||
                                    group.roles.length === 0) && (
                                    <p className="text-xs text-slate-400 italic">
                                      Belum ada posisi.
                                    </p>
                                  )}
                                  {(group.roles || []).map((role, roleIdx) => {
                                    const filledCount = getRoleFilledCount(
                                      role.id,
                                    );
                                    return (
                                      <div
                                        key={role.id}
                                        className="flex flex-col gap-2 bg-white p-3 border border-[#DADCE0] rounded-lg shadow-sm"
                                      >
                                        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-2 w-full">
                                          <div className="flex lg:flex-col gap-1 items-center bg-[#F8F9FA] border border-[#DADCE0] rounded-md px-1 mr-1">
                                            <button
                                              onClick={() =>
                                                moveRole(
                                                  event.id,
                                                  group.id,
                                                  roleIdx,
                                                  "up",
                                                )
                                              }
                                              disabled={roleIdx === 0}
                                              className="p-0.5 text-slate-400 hover:text-[#1A73E8] hover:bg-blue-50 rounded disabled:opacity-30"
                                            >
                                              <IconArrowUp />
                                            </button>
                                            <button
                                              onClick={() =>
                                                moveRole(
                                                  event.id,
                                                  group.id,
                                                  roleIdx,
                                                  "down",
                                                )
                                              }
                                              disabled={
                                                roleIdx ===
                                                (group.roles || []).length - 1
                                              }
                                              className="p-0.5 text-slate-400 hover:text-[#1A73E8] hover:bg-blue-50 rounded disabled:opacity-30"
                                            >
                                              <IconArrowDown />
                                            </button>
                                          </div>
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
                                            placeholder="Nama Posisi"
                                            className="w-full lg:w-1/3 p-2 border border-[#DADCE0] rounded text-xs font-bold text-slate-700 outline-none focus:border-[#1A73E8]"
                                          />
                                          <div className="w-full lg:w-24 flex flex-col">
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
                                              className="p-2 border border-[#DADCE0] rounded text-xs text-center outline-none focus:border-[#1A73E8]"
                                            />
                                            <span className="text-[9px] font-bold text-slate-400 text-center mt-1">
                                              TERISI: {filledCount}/{role.kuota}
                                            </span>
                                          </div>
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
                                            className="w-full lg:flex-1 p-2 border border-[#DADCE0] rounded text-xs outline-none focus:border-[#1A73E8]"
                                          />
                                          <button
                                            onClick={() =>
                                              handleRemoveRole(
                                                event.id,
                                                group.id,
                                                role.id,
                                              )
                                            }
                                            className="p-2 text-slate-400 hover:text-[#D93025] hover:bg-red-50 rounded transition-colors text-xs font-bold w-full lg:w-auto text-right lg:text-center"
                                          >
                                            ✕ Hapus
                                          </button>
                                        </div>
                                        <div className="w-full border-t border-slate-100 pt-2 ml-7 lg:ml-0 pr-7 lg:pr-0">
                                          <textarea
                                            value={role.deskripsi || ""}
                                            onChange={(e) =>
                                              handleChangeRole(
                                                event.id,
                                                group.id,
                                                role.id,
                                                "deskripsi",
                                                e.target.value,
                                              )
                                            }
                                            placeholder="Tuliskan SOP atau Job Description singkat untuk posisi ini..."
                                            className="w-full p-2.5 bg-slate-50 border border-[#DADCE0] rounded-md text-xs outline-none focus:border-[#1A73E8] resize-none"
                                            rows={2}
                                          ></textarea>
                                        </div>
                                      </div>
                                    );
                                  })}
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
          <div className="pt-2 sticky bottom-4 z-50 bg-[#F8F9FA] py-4 border-t border-[#DADCE0] sm:border-none sm:py-0">
            <button
              onClick={saveSettings}
              disabled={isSaving}
              className="w-full sm:w-auto bg-[#1A73E8] hover:bg-[#1557B0] text-white text-sm font-bold px-8 py-3 rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 mx-auto"
            >
              {isSaving ? "Menyimpan..." : "Simpan Semua Pengaturan"}
            </button>
          </div>
        </div>
      )}

      {/* TAB 2, 3, & 4: TABEL PELAMAR */}
      {activeTab !== "pengaturan" && (
        <div className="bg-white border border-[#DADCE0] rounded-2xl overflow-hidden shadow-sm animate-in fade-in duration-300">
          <div className="p-4 border-b border-[#DADCE0] flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-[#F8F9FA]">
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              <select
                value={filterEvent}
                onChange={(e) => {
                  setFilterEvent(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-white border border-[#DADCE0] text-slate-800 text-sm rounded-lg px-4 py-2 outline-none focus:border-[#1A73E8] shadow-sm flex-1 lg:flex-auto cursor-pointer font-medium"
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
                  exportToExcel(currentTabList, `Data_Pelamar_${activeTab}`)
                }
                className="bg-emerald-600 border border-emerald-700 text-white hover:bg-emerald-700 px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors flex items-center gap-2"
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
                </svg>
                Ekspor Excel ({activeTab})
              </button>
            </div>

            {/* AKSI MASSAL */}
            {((activeTab === "pendaftar" && selectedPending.length > 0) ||
              (activeTab === "timInti" && selectedAccepted.length > 0) ||
              (activeTab === "ditolak" && selectedRejected.length > 0)) && (
              <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto bg-[#E8F0FE] p-1.5 rounded-xl border border-[#1A73E8]/30">
                <span className="text-sm text-[#1A73E8] font-bold ml-3 mr-3">
                  {activeTab === "pendaftar"
                    ? selectedPending.length
                    : activeTab === "timInti"
                      ? selectedAccepted.length
                      : selectedRejected.length}{" "}
                  dipilih
                </span>

                {activeTab === "pendaftar" && (
                  <>
                    <button
                      onClick={() =>
                        handleMassDelete(selectedPending, "pending")
                      }
                      className="text-[#D93025] bg-white border border-[#DADCE0] hover:bg-red-50 px-4 py-1.5 rounded-lg text-sm font-bold shadow-sm transition-colors"
                    >
                      Hapus
                    </button>
                    <button
                      onClick={() =>
                        handleMassUpdateStatus(selectedPending, "rejected")
                      }
                      className="text-slate-700 bg-white border border-[#DADCE0] hover:bg-slate-50 px-4 py-1.5 rounded-lg text-sm font-bold shadow-sm transition-colors"
                    >
                      Tolak
                    </button>
                    <button
                      onClick={() =>
                        handleMassUpdateStatus(selectedPending, "accepted")
                      }
                      className="bg-[#1A73E8] hover:bg-[#1557B0] text-white px-4 py-1.5 rounded-lg text-sm font-bold shadow-sm transition-colors"
                    >
                      Terima Semua
                    </button>
                  </>
                )}

                {activeTab === "timInti" && (
                  <>
                    <button
                      onClick={() =>
                        handleMassDelete(selectedAccepted, "accepted")
                      }
                      className="text-[#D93025] bg-white border border-[#DADCE0] hover:bg-red-50 px-4 py-1.5 rounded-lg text-sm font-bold shadow-sm transition-colors"
                    >
                      Hapus Permanen
                    </button>
                    <button
                      onClick={() => handleMassEmail("welcome")}
                      className="bg-white text-slate-700 border border-[#DADCE0] hover:bg-slate-50 px-4 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm transition-colors"
                    >
                      <IconMail /> Email
                    </button>
                    <button
                      onClick={() => handleMassEmail("cert")}
                      className="bg-[#1A73E8] hover:bg-[#1557B0] text-white px-4 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm transition-colors"
                    >
                      <IconCertificate /> Kirim E-Sertifikat
                    </button>
                  </>
                )}

                {activeTab === "ditolak" && (
                  <>
                    <button
                      onClick={() =>
                        handleMassDelete(selectedRejected, "rejected")
                      }
                      className="text-[#D93025] bg-white border border-[#DADCE0] hover:bg-red-50 px-4 py-1.5 rounded-lg text-sm font-bold shadow-sm transition-colors"
                    >
                      Hapus Permanen
                    </button>
                    <button
                      onClick={() =>
                        handleMassUpdateStatus(selectedRejected, "pending")
                      }
                      className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-1.5 rounded-lg text-sm font-bold shadow-sm transition-colors"
                    >
                      Pulihkan (Pending)
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

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
                          : activeTab === "timInti"
                            ? selectedAccepted.length === pagedData.length
                            : selectedRejected.length === pagedData.length)
                      }
                      onChange={(e) => {
                        const ids = pagedData.map((c) => c.id);
                        if (activeTab === "pendaftar")
                          setSelectedPending(e.target.checked ? ids : []);
                        else if (activeTab === "timInti")
                          setSelectedAccepted(e.target.checked ? ids : []);
                        else setSelectedRejected(e.target.checked ? ids : []);
                      }}
                      className="w-4 h-4 border-[#DADCE0] rounded cursor-pointer accent-[#1A73E8]"
                    />
                  </th>
                  <th className="px-4 py-4 font-bold text-slate-500 text-xs uppercase tracking-wider">
                    NAMA KANDIDAT
                  </th>
                  <th className="px-4 py-4 font-bold text-slate-500 text-xs uppercase tracking-wider">
                    EVENT & POSISI
                  </th>
                  {activeTab === "timInti" && (
                    <th className="px-4 py-4 font-bold text-slate-500 text-xs uppercase tracking-wider text-center">
                      STATUS EMAIL
                    </th>
                  )}
                  <th className="px-5 py-4 font-bold text-slate-500 text-xs uppercase tracking-wider text-right">
                    AKSI
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DADCE0]">
                {pagedData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-16 text-center text-slate-500 text-sm font-medium"
                    >
                      Tidak ada data untuk ditampilkan di tab ini.
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
                        : activeTab === "timInti"
                          ? selectedAccepted.includes(crew.id)
                          : selectedRejected.includes(crew.id);
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
                              else if (activeTab === "timInti")
                                setSelectedAccepted(
                                  e.target.checked
                                    ? [...selectedAccepted, crew.id]
                                    : selectedAccepted.filter(
                                        (id) => id !== crew.id,
                                      ),
                                );
                              else
                                setSelectedRejected(
                                  e.target.checked
                                    ? [...selectedRejected, crew.id]
                                    : selectedRejected.filter(
                                        (id) => id !== crew.id,
                                      ),
                                );
                            }}
                            className="w-4 h-4 border-[#DADCE0] rounded cursor-pointer accent-[#1A73E8]"
                          />
                        </td>
                        <td className="px-4 py-3 flex items-center gap-3">
                          {crew.fotoIdCard ? (
                            <img
                              src={crew.fotoIdCard}
                              alt="Foto"
                              className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-sm shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center shrink-0">
                              <IconSettings />
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-bold text-slate-800">
                              {crew.nama}
                            </p>
                            <div className="flex gap-1.5 mt-1">
                              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider bg-[#F1F3F4] px-1.5 py-0.5 rounded inline-block">
                                {crew.tipe}
                              </p>
                              {crew.sourceDb === "crew_volunteers" && (
                                <p className="text-[9px] font-bold text-amber-600 uppercase tracking-wider bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded inline-block">
                                  Data Lama
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-[#1A73E8] font-bold">
                            {parentEvent?.title || "Data Lama"}
                          </p>
                          <p className="text-xs font-medium text-slate-500">
                            {roleName}
                          </p>
                        </td>

                        {activeTab === "timInti" && (
                          <td className="px-4 py-3 text-center">
                            <div className="flex flex-col items-center gap-1.5">
                              {crew.emailStatus === "sent" ? (
                                <span className="bg-emerald-50 text-emerald-700 text-[10px] px-2 py-1 rounded font-bold border border-emerald-200">
                                  Undangan: Sukses
                                </span>
                              ) : (
                                <span className="bg-slate-100 text-slate-500 text-[10px] px-2 py-1 rounded font-medium border border-slate-200">
                                  Undangan: -
                                </span>
                              )}
                              {crew.certEmailStatus === "sent" ? (
                                <span className="bg-blue-50 text-blue-700 text-[10px] px-2 py-1 rounded font-bold border border-blue-200">
                                  Sertifikat: Sukses
                                </span>
                              ) : (
                                <span className="bg-slate-100 text-slate-500 text-[10px] px-2 py-1 rounded font-medium border border-slate-200">
                                  Sertifikat: -
                                </span>
                              )}
                            </div>
                          </td>
                        )}

                        <td className="px-5 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openDetail(crew)}
                              className="text-slate-600 bg-white border border-[#DADCE0] hover:bg-[#F8F9FA] hover:text-[#1A73E8] px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-sm flex items-center gap-1"
                            >
                              <IconDetail /> Detail
                            </button>

                            {activeTab === "timInti" && (
                              <div className="flex gap-2 border-l border-slate-200 pl-3 ml-1">
                                <button
                                  onClick={() => handleSendWelcomeEmail(crew)}
                                  disabled={isSendingMail}
                                  className="text-slate-700 border border-[#DADCE0] bg-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors disabled:opacity-50 flex items-center gap-1"
                                  title="Kirim Email Undangan"
                                >
                                  <IconMail /> Email
                                </button>
                                <button
                                  onClick={() => handleSendCertEmail(crew)}
                                  disabled={isSendingMail}
                                  className="text-[#1A73E8] border border-[#1A73E8] bg-blue-50 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-[#1A73E8] hover:text-white transition-colors disabled:opacity-50 flex items-center gap-1"
                                  title="Kirim E-Sertifikat"
                                >
                                  <IconCertificate /> E-Sertifikat
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-[#DADCE0] flex flex-col md:flex-row justify-between items-center bg-white gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500 hidden sm:block">
                Baris per halaman:
              </span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="text-xs font-bold text-slate-800 outline-none bg-transparent border border-[#DADCE0] rounded-lg p-1.5 focus:border-[#1A73E8]"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={0}>Semua</option>
              </select>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
              <span>
                {currentPage} dari {totalPages}
              </span>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 font-bold bg-white border border-[#DADCE0] hover:bg-[#F8F9FA] rounded-lg disabled:opacity-30 shadow-sm"
                >
                  Sebelumnya
                </button>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="p-1.5 font-bold bg-white border border-[#DADCE0] hover:bg-[#F8F9FA] rounded-lg disabled:opacity-30 shadow-sm"
                >
                  Selanjutnya
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DETAIL DENGAN FITUR EDIT */}
      {isDetailOpen && selectedCrew && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#DADCE0] flex justify-between items-center bg-white">
              <h2 className="text-lg font-bold text-slate-800">
                {isEditingData ? "Edit Data Pelamar" : "Profil Lengkap Pelamar"}
              </h2>
              <div className="flex gap-3 items-center">
                {!isEditingData && (
                  <button
                    onClick={() => setIsEditingData(true)}
                    className="text-xs font-bold text-[#1A73E8] bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors border border-blue-200"
                  >
                    ✏️ Edit Data
                  </button>
                )}
                <button
                  onClick={() => setIsDetailOpen(false)}
                  className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 p-1.5 rounded-full transition-colors font-bold"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 custom-scrollbar text-sm text-slate-800 space-y-6">
              {/* HEADER PROFIL */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                {selectedCrew.fotoIdCard ? (
                  <img
                    src={selectedCrew.fotoIdCard}
                    alt="Pas Foto"
                    className="w-24 h-32 object-cover rounded-xl border border-[#DADCE0] shadow-sm shrink-0"
                  />
                ) : (
                  <div className="w-24 h-32 bg-slate-100 border border-[#DADCE0] rounded-xl flex items-center justify-center text-slate-400 shrink-0 text-xs text-center p-2 font-medium">
                    Tanpa Foto
                  </div>
                )}

                <div className="flex-1 text-center sm:text-left w-full">
                  {isEditingData ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        name="nama"
                        value={editFormData.nama || ""}
                        onChange={handleEditChange}
                        className="w-full text-lg font-bold p-2 border border-[#1A73E8] rounded-lg outline-none"
                        placeholder="Nama Lengkap"
                      />
                      <div className="flex gap-2">
                        <select
                          name="jenisKelamin"
                          value={editFormData.jenisKelamin || ""}
                          onChange={handleEditChange}
                          className="flex-1 p-2 border border-[#1A73E8] rounded-lg text-xs outline-none font-medium"
                        >
                          <option value="Laki-laki">Laki-laki</option>
                          <option value="Perempuan">Perempuan</option>
                        </select>
                        <select
                          name="tipe"
                          value={editFormData.tipe || ""}
                          onChange={handleEditChange}
                          className="flex-1 p-2 border border-[#1A73E8] rounded-lg text-xs outline-none uppercase font-medium"
                        >
                          <option value="mahasiswa">Mahasiswa</option>
                          <option value="alumni">Alumni</option>
                          <option value="ukm">UKM</option>
                          <option value="himpunan">Himpunan</option>
                          <option value="umum">Umum</option>
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          name="tempatLahir"
                          value={editFormData.tempatLahir || ""}
                          onChange={handleEditChange}
                          className="flex-1 p-2 border border-[#1A73E8] rounded-lg text-xs outline-none font-medium"
                          placeholder="Tempat Lahir"
                        />
                        <input
                          type="date"
                          name="tanggalLahir"
                          value={editFormData.tanggalLahir || ""}
                          onChange={handleEditChange}
                          className="flex-1 p-2 border border-[#1A73E8] rounded-lg text-xs outline-none font-medium"
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <h3 className="text-2xl font-black mb-1 text-[#1A73E8]">
                        {selectedCrew.nama}
                      </h3>
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-1">
                        <span className="text-slate-600 uppercase text-[10px] font-bold tracking-widest bg-slate-100 border border-[#DADCE0] px-2 py-0.5 rounded">
                          {selectedCrew.tipe}
                        </span>
                        <span className="text-slate-500 text-xs font-bold">
                          Terdaftar:{" "}
                          {new Date(
                            selectedCrew.waktuDaftar,
                          ).toLocaleDateString("id-ID")}
                        </span>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-3 text-left bg-[#F8F9FA] p-3 rounded-lg border border-[#DADCE0]">
                        <div>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                            Jenis Kelamin
                          </p>
                          <p className="text-xs font-bold">
                            {selectedCrew.jenisKelamin || "-"}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                            Tempat, Tgl Lahir
                          </p>
                          <p className="text-xs font-bold">
                            {selectedCrew.tempatLahir
                              ? `${selectedCrew.tempatLahir}, ${selectedCrew.tanggalLahir}`
                              : "-"}
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 py-4 border-y border-[#DADCE0] text-sm">
                <div className="flex flex-col">
                  <span className="text-slate-500 font-bold text-xs">
                    WhatsApp
                  </span>
                  {isEditingData ? (
                    <input
                      type="text"
                      name="whatsapp"
                      value={editFormData.whatsapp || ""}
                      onChange={handleEditChange}
                      className="p-1.5 border border-[#1A73E8] rounded mt-1 text-sm outline-none font-medium"
                    />
                  ) : (
                    <span className="font-bold">{selectedCrew.whatsapp}</span>
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-slate-500 font-bold text-xs">
                    Email
                  </span>
                  {isEditingData ? (
                    <input
                      type="email"
                      name="email"
                      value={editFormData.email || ""}
                      onChange={handleEditChange}
                      className="p-1.5 border border-[#1A73E8] rounded mt-1 text-sm outline-none font-medium"
                    />
                  ) : (
                    <span className="font-bold truncate">
                      {selectedCrew.email}
                    </span>
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-slate-500 font-bold text-xs">
                    Instagram
                  </span>
                  {isEditingData ? (
                    <input
                      type="text"
                      name="instagram"
                      value={editFormData.instagram || ""}
                      onChange={handleEditChange}
                      className="p-1.5 border border-[#1A73E8] rounded mt-1 text-sm outline-none font-medium"
                    />
                  ) : (
                    <a
                      href={`https://instagram.com/${(selectedCrew.instagram || "").replace("@", "")}`}
                      target="_blank"
                      className="font-bold text-[#1A73E8] hover:underline"
                    >
                      {selectedCrew.instagram || "-"}
                    </a>
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-slate-500 font-bold text-xs">
                    Ukuran Jersey
                  </span>
                  {isEditingData ? (
                    <select
                      name="ukuranJersey"
                      value={editFormData.ukuranJersey || ""}
                      onChange={handleEditChange}
                      className="p-1.5 border border-[#1A73E8] rounded mt-1 text-sm outline-none font-medium"
                    >
                      <option value="S">S</option>
                      <option value="M">M</option>
                      <option value="L">L</option>
                      <option value="XL">XL</option>
                      <option value="XXL">XXL</option>
                    </select>
                  ) : (
                    <span className="font-bold">
                      {selectedCrew.ukuranJersey || "-"}
                    </span>
                  )}
                </div>
                <div className="flex flex-col md:col-span-2 bg-rose-50 border border-rose-100 p-2.5 rounded-lg mt-1">
                  <span className="text-rose-600 font-black text-[10px] uppercase tracking-wider mb-0.5">
                    Riwayat Penyakit Khusus
                  </span>
                  {isEditingData ? (
                    <input
                      type="text"
                      name="riwayatPenyakit"
                      value={editFormData.riwayatPenyakit || ""}
                      onChange={handleEditChange}
                      className="p-1.5 border border-[#1A73E8] rounded mt-1 text-sm outline-none text-rose-800 font-bold"
                    />
                  ) : (
                    <span className="font-bold text-rose-800 text-xs">
                      {selectedCrew.riwayatPenyakit || "-"}
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-3 py-2 text-sm">
                <div className="flex flex-col border-b border-slate-100 pb-2">
                  <span className="text-slate-500 font-bold text-xs mb-1">
                    Akademik / Jurusan / Angkatan
                  </span>
                  {isEditingData ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        name="fakultas"
                        value={editFormData.fakultas || ""}
                        onChange={handleEditChange}
                        placeholder="Fakultas/Jurusan"
                        className="flex-1 p-1.5 border border-[#1A73E8] rounded text-sm outline-none font-medium"
                      />
                      <input
                        type="number"
                        name="angkatan"
                        value={editFormData.angkatan || ""}
                        onChange={handleEditChange}
                        placeholder="Tahun"
                        className="w-24 p-1.5 border border-[#1A73E8] rounded text-sm outline-none font-medium"
                      />
                    </div>
                  ) : (
                    <span className="font-bold text-left">
                      {selectedCrew.fakultas || "-"} (Angkatan '
                      {selectedCrew.angkatan || "-"})
                    </span>
                  )}
                </div>

                <div className="flex flex-col border-b border-slate-100 pb-2">
                  <span className="text-slate-500 font-bold text-xs mb-1 whitespace-nowrap">
                    {isEditingData
                      ? "Instansi & Jabatan"
                      : selectedCrew.tipe === "alumni" ||
                          selectedCrew.tipe === "umum"
                        ? "Pekerjaan / Instansi"
                        : "Organisasi"}
                  </span>
                  {isEditingData ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        name="instansi"
                        value={editFormData.instansi || ""}
                        onChange={handleEditChange}
                        placeholder="Instansi/Organisasi"
                        className="flex-1 p-1.5 border border-[#1A73E8] rounded text-sm outline-none font-medium"
                      />
                      <input
                        type="text"
                        name="jabatan"
                        value={editFormData.jabatan || ""}
                        onChange={handleEditChange}
                        placeholder="Jabatan"
                        className="flex-1 p-1.5 border border-[#1A73E8] rounded text-sm outline-none font-medium"
                      />
                    </div>
                  ) : (
                    <span className="font-bold text-left break-words">
                      {selectedCrew.instansi || "-"}{" "}
                      {selectedCrew.jabatan ? `— ${selectedCrew.jabatan}` : ""}
                    </span>
                  )}
                </div>

                <div className="flex flex-col border-b border-slate-100 pb-2">
                  <span className="text-slate-500 font-bold text-xs mb-1">
                    Alamat Domisili
                  </span>
                  {isEditingData ? (
                    <textarea
                      name="domisili"
                      value={editFormData.domisili || ""}
                      onChange={handleEditChange}
                      rows={2}
                      className="w-full p-2 border border-[#1A73E8] rounded text-sm outline-none resize-none font-medium"
                    />
                  ) : (
                    <span className="font-bold text-left break-words">
                      {selectedCrew.domisili || "-"}
                    </span>
                  )}
                </div>
              </div>

              {!isEditingData && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#E8F0FE]/50 p-4 rounded-xl border border-[#1A73E8]/20 mt-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider">
                        Kendaraan Pribadi
                      </span>
                      <span className="text-xs font-bold text-slate-700">
                        {selectedCrew.kendaraan || "-"}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider">
                        Bersedia Pindah Divisi?
                      </span>
                      <span className="text-xs font-bold text-slate-700">
                        {selectedCrew.bersediaPindahDivisi || "-"}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1 sm:col-span-2">
                      <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider">
                        Komitmen Pelatihan & Briefing
                      </span>
                      <span className="text-xs font-bold text-slate-700">
                        {selectedCrew.bersediaPelatihan || "-"}
                      </span>
                    </div>
                  </div>

                  {selectedCrew.status === "rejected" && selectedCrew.alasanTolak && (
                    <div className="bg-red-50 border-l-4 border-[#D93025] p-4 rounded-r-xl mt-4">
                      <span className="text-xs font-black text-[#D93025] uppercase tracking-widest block mb-1">
                        Alasan Penolakan
                      </span>
                      <p className="text-sm font-medium text-red-900 leading-relaxed">
                        {selectedCrew.alasanTolak}
                      </p>
                    </div>
                  )}

                  <div>
                    <span className="text-xs font-bold text-slate-600 block mb-1.5 uppercase tracking-widest">
                      Riwayat Penyakit Khusus
                    </span>
                    <div className="bg-[#F8F9FA] p-4 rounded-xl border border-[#DADCE0] whitespace-pre-wrap leading-relaxed text-[13px] shadow-inner text-slate-700 font-medium">
                      {selectedCrew.riwayatPenyakit || "-"}
                    </div>
                  </div>

                  <div>
                    <span className="text-xs font-bold text-slate-600 block mb-1.5 uppercase tracking-widest">
                      Alasan Memilih Divisi
                    </span>
                    <div className="bg-[#F8F9FA] p-4 rounded-xl border border-[#DADCE0] whitespace-pre-wrap leading-relaxed text-[13px] shadow-inner text-slate-700 font-medium">
                      {selectedCrew.alasanDivisi || "-"}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-600 block mb-1.5 uppercase tracking-widest">
                      Motivasi Bergabung
                    </span>
                    <div className="bg-[#F8F9FA] p-4 rounded-xl border border-[#DADCE0] whitespace-pre-wrap leading-relaxed text-[13px] shadow-inner text-slate-700 font-medium">
                      {selectedCrew.motivasi || "-"}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-600 block mb-1.5 uppercase tracking-widest">
                      Pengalaman Terkait
                    </span>
                    <div className="bg-[#F8F9FA] p-4 rounded-xl border border-[#DADCE0] whitespace-pre-wrap leading-relaxed text-[13px] shadow-inner text-slate-700 font-medium">
                      {selectedCrew.pengalaman || "-"}
                    </div>
                  </div>
                </div>
              )}

              {!isEditingData && selectedCrew.status !== "rejected" && (
                <div className="pt-3">
                  <label className="text-xs font-black text-[#1A73E8] block mb-2">
                    Ubah Penempatan (Admin):
                  </label>
                  <select
                    value={newAssignedRoleId}
                    onChange={(e) => setNewAssignedRoleId(e.target.value)}
                    className="w-full p-3 bg-white border border-[#1A73E8] rounded-xl text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-[#1A73E8]/20 shadow-sm cursor-pointer"
                  >
                    <option value="">-- Pindah Posisi / Data Lama --</option>
                    {events.map((e) =>
                      (e.groups || []).map((g) => (
                        <optgroup key={g.id} label={`${e.title} - ${g.title}`}>
                          {(g.roles || []).map((r) => {
                            const filledCount = getRoleFilledCount(r.id);
                            return (
                              <option key={r.id} value={r.id}>
                                {r.nama} (Terisi: {filledCount}/{r.kuota})
                              </option>
                            );
                          })}
                        </optgroup>
                      )),
                    )}
                  </select>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-[#DADCE0] flex justify-end gap-3 bg-[#F8F9FA]">
              {isEditingData ? (
                <>
                  <button
                    onClick={() => setIsEditingData(false)}
                    className="text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 px-5 py-2.5 rounded-xl text-sm font-bold transition-colors shadow-sm"
                  >
                    Batal
                  </button>
                  <button
                    onClick={saveEditedData}
                    className="bg-[#1A73E8] hover:bg-[#1557B0] text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-colors shadow-md"
                  >
                    💾 Simpan Data
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setIsDetailOpen(false)}
                    className="text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 px-5 py-2.5 rounded-xl text-sm font-bold transition-colors shadow-sm"
                  >
                    Tutup
                  </button>

                  {selectedCrew.status === "rejected" && (
                    <>
                      <button
                        onClick={handleResendEmail}
                        disabled={isSendingMail}
                        className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors shadow-sm flex items-center gap-2"
                      >
                        {isSendingMail ? "Memproses..." : "✉️ Kirim Ulang Penolakan"}
                      </button>
                      <button
                        onClick={() => handleDecision("pending")}
                        className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-colors shadow-md"
                      >
                        Pulihkan ke Menunggu
                      </button>
                    </>
                  )}

                  {selectedCrew.status !== "accepted" &&
                    selectedCrew.status !== "rejected" && (
                      <>
                        <button
                          onClick={() => handleDecision("rejected")}
                          className="text-[#D93025] bg-white border border-rose-200 hover:bg-red-50 px-5 py-2.5 rounded-xl text-sm font-bold transition-colors shadow-sm"
                        >
                          Tolak
                        </button>
                        <button
                          onClick={() => handleDecision("accepted")}
                          className="bg-[#1A73E8] hover:bg-[#1557B0] text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-colors shadow-md"
                        >
                          Terima Relawan
                        </button>
                      </>
                    )}
                  {selectedCrew.status === "accepted" && (
                    <>
                      <button
                        onClick={handleResendEmail}
                        disabled={isSendingMail}
                        className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors shadow-sm flex items-center gap-2"
                      >
                        {isSendingMail ? "Memproses..." : "✉️ Kirim Ulang Undangan"}
                      </button>
                      <button
                        onClick={() => handleDecision("rejected")}
                        className="text-[#D93025] bg-white border border-rose-200 hover:bg-red-50 px-5 py-2.5 rounded-xl text-sm font-bold transition-colors shadow-sm"
                      >
                        Keluarkan
                      </button>
                      <button
                        onClick={handleUpdateRoleOnly}
                        className="bg-[#1A73E8] hover:bg-[#1557B0] text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-colors shadow-md"
                      >
                        Simpan Perubahan
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
