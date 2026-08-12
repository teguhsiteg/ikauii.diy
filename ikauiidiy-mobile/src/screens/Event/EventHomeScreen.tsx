import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ImageBackground,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import tw from "twrnc";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { IKA_COLORS } from "../../constants/colors";
import { StatusBar } from "expo-status-bar";

// --- DATA DUMMY MULTI-EVENT ---
const EVENT_LIST = [
  {
    id: "evt_001",
    title: "GEMA UII Hybrid Run 2026",
    date: "22 Agustus 2026",
    location: "Virtual & Kampus Terpadu",
    category: "5K Fun Run",
    targetKm: 5.0,
    posterUri:
      "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?q=80&w=1000&auto=format&fit=crop",
  },
  {
    id: "evt_002",
    title: "Bantul Heritage Run",
    date: "05 Juli 2026",
    location: "Alun-Alun Paseban",
    category: "10K Challenge",
    targetKm: 10.0,
    posterUri:
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1000&auto=format&fit=crop",
  },
  {
    id: "evt_003",
    title: "Environesia 10th Anniversary Run",
    date: "10 Mei 2026",
    location: "Crystal Lotus Hotel",
    category: "Virtual (2.5K)",
    targetKm: 2.5,
    posterUri:
      "https://images.unsplash.com/photo-1530549387789-4c1017266635?q=80&w=1000&auto=format&fit=crop",
  },
];

export default function EventHomeScreen() {
  const [registeredEventId, setRegisteredEventId] = useState<string | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState<string | null>(null); // Menyimpan ID event yang sedang loading
  const [totalRunKm, setTotalRunKm] = useState(0);

  useEffect(() => {
    const checkRegistration = async () => {
      try {
        const savedEventId = await AsyncStorage.getItem("@registered_event_id");
        if (savedEventId) {
          setRegisteredEventId(savedEventId);
          setTotalRunKm(3.2); // Dummy progres lari
        }
      } catch (e) {
        console.log(e);
      }
    };
    checkRegistration();
  }, []);

  const handleRegister = async (eventId: string) => {
    setIsLoading(eventId);
    setTimeout(async () => {
      try {
        await AsyncStorage.setItem("@registered_event_id", eventId);
        setRegisteredEventId(eventId);
        setIsLoading(null);
        Alert.alert(
          "Sukses!",
          "Anda berhasil mendaftar. Selamat mengumpulkan KM di Strava!",
        );
      } catch (e) {
        setIsLoading(null);
        Alert.alert("Error", "Gagal mendaftar.");
      }
    }, 1500);
  };

  // Logika Pemisahan: Highlight vs Event Lainnya
  // Jika sudah daftar, highlight = event yg didaftar. Jika belum, highlight = event pertama di list.
  const highlightEvent = registeredEventId
    ? EVENT_LIST.find((e) => e.id === registeredEventId) || EVENT_LIST[0]
    : EVENT_LIST[0];

  // Event lainnya adalah semua event KECUALI yang sedang jadi highlight
  const otherEvents = EVENT_LIST.filter((e) => e.id !== highlightEvent.id);

  const progressPercent = Math.min(
    (totalRunKm / highlightEvent.targetKm) * 100,
    100,
  );

  return (
    <View style={tw`flex-1 bg-gray-50`}>
      <StatusBar style="light" translucent backgroundColor="transparent" />

      <ScrollView
        style={tw`flex-1`}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* ==========================================
            BAGIAN ATAS (HIGHLIGHT FULL BLEED)
        ========================================== */}
        <ImageBackground
          source={{ uri: highlightEvent.posterUri }}
          style={tw`w-full ${registeredEventId ? "h-[450px]" : "h-96"} justify-end`}
          resizeMode="cover"
        >
          {/* Overlay Gelap */}
          <View style={tw`absolute inset-0 bg-black/60`} />

          <View style={tw`px-8 pb-16`}>
            {registeredEventId ? (
              // --- TAMPILAN JIKA HIGHLIGHT ADALAH EVENT YANG SUDAH DIDAFTAR (DASHBOARD) ---
              <View>
                <View style={tw`flex-row justify-between items-end mb-6`}>
                  <View style={tw`flex-1 mr-4`}>
                    <View
                      style={tw`bg-green-500 self-start px-3 py-1 rounded-full mb-3 flex-row items-center`}
                    >
                      <Ionicons
                        name="checkmark-circle"
                        size={14}
                        color="white"
                      />
                      <Text
                        style={tw`text-[10px] font-black text-white uppercase ml-1 tracking-widest`}
                      >
                        Terdaftar
                      </Text>
                    </View>
                    <Text
                      style={tw`text-white text-3xl font-black leading-tight`}
                      numberOfLines={2}
                    >
                      {highlightEvent.title}
                    </Text>
                  </View>
                  <Ionicons
                    name="medal"
                    size={48}
                    color={IKA_COLORS.accent.gold}
                  />
                </View>

                {/* Card Progres Tembus Pandang */}
                <View
                  style={tw`bg-white/10 p-5 rounded-3xl border border-white/20`}
                >
                  <Text
                    style={tw`text-xs font-bold text-gray-300 mb-2 uppercase tracking-widest`}
                  >
                    Progres Anda
                  </Text>
                  <View style={tw`flex-row justify-between items-end mb-4`}>
                    <Text style={tw`text-white text-4xl font-black`}>
                      {totalRunKm.toFixed(1)}{" "}
                      <Text style={tw`text-lg text-gray-300 font-bold`}>
                        KM
                      </Text>
                    </Text>
                    <Text
                      style={tw`text-[${IKA_COLORS.accent.gold}] text-sm font-black`}
                    >
                      Target: {highlightEvent.targetKm} KM
                    </Text>
                  </View>
                  <View
                    style={tw`h-3 bg-white/20 rounded-full overflow-hidden`}
                  >
                    <View
                      style={[
                        { width: `${progressPercent}%` },
                        tw`h-full bg-[${IKA_COLORS.accent.gold}] rounded-full`,
                      ]}
                    />
                  </View>
                </View>
              </View>
            ) : (
              // --- TAMPILAN JIKA HIGHLIGHT ADALAH PROMO (BELUM DAFTAR) ---
              <View>
                <View
                  style={tw`bg-[${IKA_COLORS.accent.gold}] self-start px-3 py-1.5 rounded-full mb-4`}
                >
                  <Text
                    style={tw`text-[10px] font-black text-white uppercase tracking-widest`}
                  >
                    Event Utama
                  </Text>
                </View>
                <Text
                  style={tw`text-white text-4xl font-black leading-tight tracking-tight shadow-lg`}
                  numberOfLines={2}
                >
                  {highlightEvent.title}
                </Text>
                <View style={tw`flex-row items-center mt-4 opacity-90`}>
                  <Ionicons
                    name="calendar"
                    size={16}
                    color={IKA_COLORS.accent.gold}
                  />
                  <Text
                    style={tw`text-white text-sm ml-2 font-medium tracking-wide`}
                  >
                    {highlightEvent.date}
                  </Text>
                </View>

                {/* Tombol Daftar Promo */}
                <TouchableOpacity
                  onPress={() => handleRegister(highlightEvent.id)}
                  disabled={isLoading === highlightEvent.id}
                  style={tw`bg-[${IKA_COLORS.primary.navy}] w-full py-4 rounded-2xl items-center mt-6 shadow-lg border border-blue-800`}
                >
                  {isLoading === highlightEvent.id ? (
                    <ActivityIndicator color={IKA_COLORS.accent.gold} />
                  ) : (
                    <Text
                      style={tw`text-white font-black text-sm tracking-[0.2em] uppercase`}
                    >
                      Daftar Event Ini
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ImageBackground>

        {/* ==========================================
            BAGIAN BAWAH (DAFTAR EVENT LAINNYA)
        ========================================== */}
        <View
          style={tw`bg-gray-50 flex-1 -mt-8 rounded-t-[40px] px-6 pt-10 pb-12 shadow-2xl`}
        >
          <View style={tw`flex-row items-center justify-between mb-6`}>
            <Text style={tw`text-lg font-black text-slate-800`}>
              Event Tersedia
            </Text>
            <TouchableOpacity>
              <Text
                style={tw`text-xs font-bold text-[${IKA_COLORS.primary.navy}] uppercase`}
              >
                Lihat Semua
              </Text>
            </TouchableOpacity>
          </View>

          {/* List Event Lainnya */}
          {otherEvents.map((event) => (
            <View
              key={event.id}
              style={tw`bg-white rounded-3xl p-4 mb-4 flex-row items-center border border-gray-100 shadow-sm`}
            >
              {/* Thumbnail */}
              <Image
                source={{ uri: event.posterUri }}
                style={tw`w-24 h-24 rounded-2xl bg-gray-200 mr-4`}
              />

              {/* Info Text */}
              <View style={tw`flex-1`}>
                <Text
                  style={tw`text-[10px] font-bold text-[${IKA_COLORS.accent.gold}] uppercase tracking-widest mb-1`}
                >
                  {event.category}
                </Text>
                <Text
                  style={tw`text-sm font-black text-slate-800 mb-1 leading-tight`}
                  numberOfLines={2}
                >
                  {event.title}
                </Text>
                <View style={tw`flex-row items-center mb-3`}>
                  <Ionicons name="calendar-outline" size={12} color="#94a3b8" />
                  <Text style={tw`text-xs text-slate-500 ml-1 font-medium`}>
                    {event.date}
                  </Text>
                </View>

                {/* Tombol Daftar Mini */}
                <TouchableOpacity
                  onPress={() => handleRegister(event.id)}
                  disabled={isLoading === event.id || !!registeredEventId} // Jika sudah daftar 1 event, kunci sementara yg lain (opsional)
                  style={tw`${registeredEventId ? "bg-gray-100" : `bg-[${IKA_COLORS.primary.navy}]`} py-2 rounded-xl items-center`}
                >
                  {isLoading === event.id ? (
                    <ActivityIndicator
                      size="small"
                      color={IKA_COLORS.accent.gold}
                    />
                  ) : (
                    <Text
                      style={tw`${registeredEventId ? "text-gray-400" : "text-white"} font-bold text-[10px] uppercase tracking-widest`}
                    >
                      {registeredEventId ? "Terkunci" : "Daftar"}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {otherEvents.length === 0 && (
            <Text style={tw`text-center text-slate-400 text-sm mt-4`}>
              Tidak ada event lain saat ini.
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
