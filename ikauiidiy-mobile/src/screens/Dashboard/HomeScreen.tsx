import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  RefreshControl,
  ImageBackground,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import tw from "twrnc";
import { IKA_COLORS } from "../../constants/colors";
import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Firebase Imports
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db, auth } from "../../config/firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function HomeScreen({ navigation }: any) {
  const [userName, setUserName] = useState("Alumni");
  const [refreshing, setRefreshing] = useState(false);

  const [agendas, setAgendas] = useState<any[]>([]);
  const [beritas, setBeritas] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const savedName = await AsyncStorage.getItem("@user_name");
        if (savedName) setUserName(savedName.split(" ")[0]);
      } else {
        setUserName("Alumni");
      }
    });
    return unsubscribe;
  }, []);

  const fetchData = async () => {
    try {
      const agendaQuery = query(
        collection(db, "agenda"),
        orderBy("createdAt", "desc"),
        limit(4),
      );
      const agendaSnapshot = await getDocs(agendaQuery);
      const agendaData = agendaSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const beritaQuery = query(
        collection(db, "berita"),
        orderBy("createdAt", "desc"),
        limit(3),
      );
      const beritaSnapshot = await getDocs(beritaQuery);
      const beritaData = beritaSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setAgendas(agendaData.length > 0 ? agendaData : fallbackAgendas);
      setBeritas(beritaData.length > 0 ? beritaData : fallbackBeritas);
    } catch (error) {
      console.log("Error Fetching Firebase:", error);
      setAgendas(fallbackAgendas);
      setBeritas(fallbackBeritas);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData().then(() => setRefreshing(false));
  }, []);

  // Notifikasi untuk fitur yang belum tersedia
  const comingSoon = (fitur: string) =>
    Alert.alert(
      "Segera Hadir",
      `Fitur ${fitur} sedang dikembangkan oleh tim IKA UII DIY.`,
    );

  // --- LOGIKA HELPER DARI WEB NEXT.JS ---

  // 1. Pembersih HTML (Regex)
  const cleanHTML = (str?: string) =>
    str ? str.replace(/<[^>]*>?/gm, "") : "";

  // 2. Format Tanggal Standar
  const formatDate = (isoString: string) => {
    if (!isoString) return "Terbaru";
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // 3. Kalkulator Status Agenda
  const getAgendaStatus = (tanggal?: string, isComingSoon?: boolean) => {
    if (isComingSoon)
      return {
        text: "COMING SOON",
        bg: "bg-slate-200",
        textCol: "text-slate-600",
        isPast: false,
        isComingSoon: true,
      };
    if (!tanggal)
      return {
        text: "TBA",
        bg: "bg-slate-200",
        textCol: "text-slate-500",
        isPast: false,
        isComingSoon: false,
      };

    const eventDate = new Date(tanggal);
    const today = new Date();
    eventDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    const diffTime = eventDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 0)
      return {
        text: `${diffDays} HARI LAGI`,
        bg: "bg-[#FFF0E6]",
        textCol: "text-[#FF5A36]",
        isPast: false,
        isComingSoon: false,
      };
    if (diffDays === 0)
      return {
        text: "HARI INI",
        bg: "bg-green-100",
        textCol: "text-green-700",
        isPast: false,
        isComingSoon: false,
      };
    return {
      text: "SELESAI",
      bg: "bg-slate-200",
      textCol: "text-slate-500",
      isPast: true,
      isComingSoon: false,
    };
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-gray-50`}>
      <StatusBar style="dark" />

      {/* --- HEADER --- */}
      <View
        style={tw`bg-white px-6 pt-12 pb-4 flex-row justify-between items-center border-b border-gray-100 z-50 shadow-sm`}
      >
        <View style={tw`flex-row items-center`}>
          <Image
            source={require("../../../assets/icon.png")}
            style={tw`w-10 h-10 mr-3`}
            resizeMode="contain"
          />
          <View>
            <Text
              style={tw`text-[10px] text-gray-500 font-bold tracking-widest uppercase`}
            >
              Selamat Datang,
            </Text>
            <Text
              style={tw`text-lg font-black text-[${IKA_COLORS.primary.navy}] tracking-tight`}
            >
              Halo, {userName}!
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={tw`w-10 h-10 bg-gray-50 rounded-full items-center justify-center border border-gray-100`}
        >
          <Ionicons
            name="notifications-outline"
            size={20}
            color={IKA_COLORS.primary.navy}
          />
          <View
            style={tw`absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full`}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={tw`pb-24 pt-4`}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[IKA_COLORS.primary.navy]}
          />
        }
      >
        {/* --- MENU AKSES CEPAT --- */}
        <View style={tw`px-6 mb-8 mt-2`}>
          <Text
            style={tw`text-sm font-bold text-gray-800 mb-4 uppercase tracking-wider`}
          >
            Akses Cepat
          </Text>
          <View style={tw`flex-row flex-wrap justify-between`}>
            <MenuIcon
              icon="qr-code"
              title="E-Office"
              color="blue"
              onPress={() => navigation.navigate("Scan")}
            />
            <MenuIcon
              icon="card"
              title="E-KTA"
              color="green"
              onPress={() => navigation.navigate("Profil")}
            />
            <MenuIcon
              icon="business"
              title="Direktori"
              color="yellow"
              onPress={() => comingSoon("Direktori")}
            />
            <MenuIcon
              icon="stopwatch"
              title="Virtual Run"
              color="red"
              onPress={() => navigation.navigate("Event")}
            />
            <View style={tw`w-full h-4`} />
            <MenuIcon
              icon="calendar"
              title="Agenda"
              color="purple"
              onPress={() => comingSoon("Agenda")}
            />
            <MenuIcon
              icon="briefcase"
              title="Karir"
              color="indigo"
              onPress={() => comingSoon("Karir")}
            />
            <MenuIcon
              icon="heart"
              title="Donasi"
              color="orange"
              onPress={() => comingSoon("Donasi")}
            />
            <MenuIcon
              icon="ellipsis-horizontal"
              title="Lainnya"
              color="gray"
              onPress={() => comingSoon("Lainnya")}
            />
          </View>
        </View>

        {/* --- AGENDA KEGIATAN --- */}
        <View style={tw`mb-8`}>
          <View style={tw`px-6 flex-row justify-between items-end mb-4`}>
            <View>
              <Text
                style={tw`text-[10px] text-[${IKA_COLORS.accent.gold}] font-black tracking-[0.15em] uppercase mb-0.5`}
              >
                Jadwal Silaturahmi
              </Text>
              <Text style={tw`text-lg font-black text-slate-800`}>
                Agenda Kegiatan
              </Text>
            </View>
            <TouchableOpacity>
              <Text
                style={tw`text-xs font-bold text-[${IKA_COLORS.primary.navy}]`}
              >
                Lihat Semua
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={tw`px-6 gap-5`}
          >
            {agendas.map((item, index) => {
              const status = getAgendaStatus(item.tanggal, item.isComingSoon);

              return (
                <TouchableOpacity
                  key={item.id || index}
                  activeOpacity={0.8}
                  style={tw`w-64 bg-[#E9F8F5] rounded-[24px] p-3 border border-[#D5EAE6] shadow-sm ${status.isPast ? "bg-slate-50 border-slate-200 opacity-80" : ""}`}
                >
                  <View
                    style={tw`w-full h-36 rounded-[16px] overflow-hidden bg-white mb-3 relative`}
                  >
                    <Image
                      source={{ uri: item.imgUrl || item.posterUrl }}
                      style={tw`w-full h-full bg-gray-200 ${status.isPast ? "opacity-70" : ""}`}
                      resizeMode="cover"
                    />

                    {/* Overlay Selesai */}
                    {status.isPast && (
                      <View
                        style={tw`absolute inset-0 bg-black/40 flex items-center justify-center`}
                      >
                        <View
                          style={tw`bg-black/60 px-4 py-2 rounded-full border border-white/20`}
                        >
                          <Text
                            style={tw`text-white font-black text-[10px] uppercase tracking-widest`}
                          >
                            Acara Selesai
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>

                  {/* Badge Status */}
                  <View style={tw`flex-row items-center gap-2 mb-2`}>
                    <View
                      style={tw`px-2.5 py-1 rounded-md ${status.isComingSoon ? "bg-slate-200" : status.isPast ? "bg-slate-200" : "bg-[#FFF0E6]"}`}
                    >
                      <Text
                        style={tw`text-[9px] font-black uppercase tracking-widest ${status.isComingSoon ? "text-slate-600" : status.isPast ? "text-slate-500" : "text-[#FF5A36]"}`}
                      >
                        {status.isComingSoon
                          ? "COMING SOON"
                          : status.isPast
                            ? "ARCHIVE"
                            : "UPCOMING"}
                      </Text>
                    </View>
                    {!item.isComingSoon && (
                      <View style={tw`px-2.5 py-1 rounded-md ${status.bg}`}>
                        <Text
                          style={tw`text-[9px] font-black uppercase tracking-widest ${status.textCol}`}
                        >
                          {status.text}
                        </Text>
                      </View>
                    )}
                  </View>

                  <Text
                    style={tw`text-lg font-bold leading-snug mb-3 ${status.isPast ? "text-slate-600" : "text-slate-900"}`}
                    numberOfLines={2}
                  >
                    {item.judul}
                  </Text>

                  {/* Info Format & Waktu */}
                  <View style={tw`flex-row items-center mb-1`}>
                    <Ionicons name="time-outline" size={14} color="#94a3b8" />
                    <Text
                      style={tw`text-[11px] font-medium text-slate-600 ml-1.5`}
                      numberOfLines={1}
                    >
                      {item.isComingSoon
                        ? "Tanggal akan diumumkan"
                        : `${formatDate(item.tanggal)} • ${item.waktu || "TBA"} WIB`}
                    </Text>
                  </View>
                  <View style={tw`flex-row items-center mb-3`}>
                    <Ionicons
                      name="location-outline"
                      size={14}
                      color="#94a3b8"
                    />
                    <Text
                      style={tw`text-[11px] font-medium text-slate-600 ml-1.5`}
                      numberOfLines={1}
                    >
                      {item.format || item.lokasi}{" "}
                      {item.tiket === "Gratis (Free)" &&
                        !status.isPast &&
                        " • Gratis"}
                    </Text>
                  </View>

                  {/* PIC / Koordinator */}
                  <View
                    style={tw`pt-3 border-t border-slate-200/60 flex-row items-center`}
                  >
                    <View
                      style={tw`w-8 h-8 rounded-full flex items-center justify-center bg-white border border-slate-100 shadow-sm mr-2`}
                    >
                      <Text style={tw`font-bold text-xs text-slate-500`}>
                        {item.koordinator
                          ? item.koordinator.charAt(0).toUpperCase()
                          : "A"}
                      </Text>
                    </View>
                    <View>
                      <Text style={tw`text-[9px] text-slate-500 font-medium`}>
                        PIC / Penyelenggara
                      </Text>
                      <Text
                        style={tw`text-xs font-bold text-slate-800`}
                        numberOfLines={1}
                      >
                        {item.koordinator || "Admin IKA UII"}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* --- BERITA & PUBLIKASI --- */}
        <View style={tw`px-6 mb-8`}>
          <View style={tw`flex-row justify-between items-end mb-4`}>
            <View>
              <Text
                style={tw`text-[10px] text-[${IKA_COLORS.accent.gold}] font-black tracking-[0.15em] uppercase mb-0.5`}
              >
                Pusat Informasi
              </Text>
              <Text style={tw`text-lg font-black text-slate-800`}>
                Berita & Publikasi
              </Text>
            </View>
            <TouchableOpacity>
              <Text
                style={tw`text-xs font-bold text-[${IKA_COLORS.primary.navy}]`}
              >
                Lihat Semua
              </Text>
            </TouchableOpacity>
          </View>

          {beritas.length === 0 ? (
            <View
              style={tw`bg-slate-50 border border-dashed border-slate-300 rounded-2xl py-8 items-center`}
            >
              <Text style={tw`text-slate-400 font-medium text-sm`}>
                Belum ada rilis berita resmi.
              </Text>
            </View>
          ) : (
            <>
              {/* Highlight Berita (Item Pertama) */}
              {beritas.length > 0 && (
                <TouchableOpacity
                  style={tw`bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 mb-4 pb-4`}
                >
                  <Image
                    source={{ uri: beritas[0].imgUrl || beritas[0].imageUrl }}
                    style={tw`w-full h-48 bg-slate-100`}
                    resizeMode="cover"
                  />
                  <View
                    style={tw`absolute top-4 left-4 bg-[${IKA_COLORS.primary.navy}] border border-blue-900 px-3 py-1.5 rounded-lg shadow-md`}
                  >
                    <Text
                      style={tw`text-[10px] font-black text-[${IKA_COLORS.accent.gold}] uppercase tracking-wider`}
                    >
                      {beritas[0].kategori || "Berita Utama"}
                    </Text>
                  </View>
                  <View style={tw`px-5 pt-4`}>
                    <Text
                      style={tw`text-xs text-slate-400 font-bold uppercase tracking-wider mb-2`}
                    >
                      {formatDate(beritas[0].createdAt)}
                    </Text>
                    <Text
                      style={tw`text-xl font-black text-[${IKA_COLORS.primary.navy}] mb-2 leading-tight`}
                      numberOfLines={2}
                    >
                      {beritas[0].judul || beritas[0].title}
                    </Text>
                    <Text
                      style={tw`text-sm text-slate-500 leading-relaxed`}
                      numberOfLines={2}
                    >
                      {cleanHTML(beritas[0].isi)}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}

              {/* List Berita Lainnya */}
              {beritas.slice(1).map((item, index) => (
                <TouchableOpacity
                  key={item.id || index}
                  style={tw`flex-row bg-white rounded-2xl p-3 mb-3 shadow-sm border border-slate-100 items-center h-28`}
                >
                  <Image
                    source={{ uri: item.imgUrl || item.imageUrl }}
                    style={tw`w-24 h-full rounded-xl bg-slate-50`}
                  />
                  <View style={tw`flex-1 ml-4 justify-between h-full py-1`}>
                    <View>
                      <Text
                        style={tw`text-[10px] text-blue-600 font-bold uppercase tracking-wider mb-1`}
                      >
                        {item.kategori || "Siaran Pers"}
                      </Text>
                      <Text
                        style={tw`text-sm font-bold text-[${IKA_COLORS.primary.navy}] leading-snug`}
                        numberOfLines={2}
                      >
                        {item.judul || item.title}
                      </Text>
                    </View>
                    <Text style={tw`text-[10px] text-slate-400 font-medium`}>
                      {formatDate(item.createdAt)}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Komponen Pembantu Menu Cepat (Sama seperti sebelumnya)
const MenuIcon = ({ icon, title, color, onPress }: any) => {
  const colorMap: any = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-emerald-600",
    yellow: "bg-yellow-50 text-amber-500",
    red: "bg-red-50 text-rose-500",
    purple: "bg-purple-50 text-purple-600",
    indigo: "bg-indigo-50 text-indigo-600",
    orange: "bg-orange-50 text-orange-500",
    gray: "bg-gray-100 text-gray-600",
  };

  const bgClass = colorMap[color].split(" ")[0];
  const iconColorCode =
    color === "blue"
      ? IKA_COLORS.primary.navy
      : color === "yellow"
        ? IKA_COLORS.accent.gold
        : color === "green"
          ? "#10B981"
          : color === "red"
            ? "#EF4444"
            : color === "purple"
              ? "#8B5CF6"
              : color === "orange"
                ? "#F97316"
                : "gray";

  return (
    <TouchableOpacity onPress={onPress} style={tw`items-center w-[23%]`}>
      <View
        style={tw`w-14 h-14 ${bgClass} rounded-2xl items-center justify-center mb-2`}
      >
        <Ionicons name={icon} size={26} color={iconColorCode} />
      </View>
      <Text style={tw`text-[10px] font-bold text-gray-700 text-center`}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

// --- DATA FALLBACK DENGAN STRUKTUR BARU ---
const fallbackAgendas = [
  {
    id: "a1",
    judul: "Silaturahmi Akbar Nasional & Munas IKA UII Ke-VII",
    tanggal: "2026-08-22T00:00:00.000Z",
    waktu: "08:00 - 15:00",
    format: "Hybrid (Offline & Zoom)",
    tiket: "Berbayar",
    koordinator: "DPP IKA UII",
    imgUrl:
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=500&auto=format&fit=crop",
    isComingSoon: false,
  },
  {
    id: "a2",
    judul: "Kajian Intelektual Rutin: Ekonomi Syariah Era Digital",
    tanggal: "2026-05-15T00:00:00.000Z",
    waktu: "19:30 - Selesai",
    format: "Online (Zoom)",
    tiket: "Gratis (Free)",
    koordinator: "Departemen Kajian",
    imgUrl:
      "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?q=80&w=500&auto=format&fit=crop",
    isComingSoon: false,
  },
  {
    id: "a3",
    judul: "Festival Budaya & UMKM Alumni UII DIY",
    isComingSoon: true,
    koordinator: "Teguh Dwi Prayogo",
    imgUrl:
      "https://images.unsplash.com/photo-1511556532299-8f662fc26c06?q=80&w=500&auto=format&fit=crop",
  },
];

const fallbackBeritas = [
  {
    id: "b1",
    judul: "Ketua IKA UII DIY Resmi Buka Program Beasiswa Alumni",
    kategori: "Pendidikan",
    createdAt: "2026-05-09T08:00:00.000Z",
    isi: "<p>Dalam rangka mendukung generasi penerus, DPW IKA UII DIY secara resmi meluncurkan program beasiswa. <strong>Ayo daftar sekarang!</strong></p>",
    imgUrl:
      "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=500&auto=format&fit=crop",
  },
  {
    id: "b2",
    judul: "Rapat Kordinasi Wilayah Bahas Strategi Digitalisasi",
    kategori: "Organisasi",
    createdAt: "2026-05-01T10:00:00.000Z",
    isi: "Menghadapi tantangan zaman, seluruh pengurus sepakat untuk mengembangkan aplikasi mobile terpadu.",
    imgUrl:
      "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=500&auto=format&fit=crop",
  },
];
