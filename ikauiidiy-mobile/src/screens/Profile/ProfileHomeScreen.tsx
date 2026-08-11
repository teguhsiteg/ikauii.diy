import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Image,
  Linking,
  ImageBackground,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import tw from "twrnc";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { IKA_COLORS } from "../../constants/colors";
import { StatusBar } from "expo-status-bar";

// Tambahan Import Firebase untuk ngecek Login
import { auth } from "../../config/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";

export default function ProfileHomeScreen({ navigation }: any) {
  const [currentUser, setCurrentUser] = useState<any>(null); // State penyimpan status login
  const [athleteName, setAthleteName] = useState("ALUMNI UII");
  const [athleteProfileUrl, setAthleteProfileUrl] = useState<string | null>(
    null,
  );
  const [isQrModalVisible, setQrModalVisible] = useState(false);

  const niaNumber = "FMIPA-202605-001";
  const isVerified = true;

  // 🚀 LOGIKA PENGECEKAN SESI REAL-TIME
  useEffect(() => {
    // Memantau apakah user sedang login atau logout di Firebase
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        fetchProfileData(); // Tarik data Strava/Lokal kalau login
      } else {
        setCurrentUser(null);
      }
    });

    return unsubscribe; // Bersihkan memori saat pindah layar
  }, []);

  const fetchProfileData = async () => {
    const savedName = await AsyncStorage.getItem("@user_name");
    if (savedName) setAthleteName(savedName.toUpperCase());

    // Logika tarik foto strava (seperti sebelumnya)
    const token = await AsyncStorage.getItem("@strava_token");
    if (token) {
      try {
        const res = await fetch("https://www.strava.com/api/v3/athlete", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data && data.profile) setAthleteProfileUrl(data.profile);
      } catch (error) {
        console.log(error);
      }
    }
  };

  const handleLogout = () => {
    Alert.alert("Keluar Sesi", "Yakin ingin keluar dari akun Anda?", [
      { text: "Batal", style: "cancel" },
      {
        text: "Keluar",
        style: "destructive",
        onPress: async () => {
          await signOut(auth); // Firebase Logout
          await AsyncStorage.clear(); // Bersihkan Brankas
        },
      },
    ]);
  };

  // --- 🔒 TAMPILAN JIKA BELUM LOGIN (GUEST MODE) ---
  if (!currentUser) {
    return (
      <SafeAreaView style={tw`flex-1 bg-white items-center justify-center`}>
        <StatusBar style="dark" />
        <View
          style={tw`w-32 h-32 bg-blue-50 rounded-full items-center justify-center mb-6`}
        >
          <Ionicons
            name="lock-closed"
            size={60}
            color={IKA_COLORS.primary.navy}
          />
        </View>
        <Text style={tw`text-2xl font-black text-slate-800 mb-2`}>
          Akses Terbatas
        </Text>
        <Text
          style={tw`text-slate-500 text-center px-10 mb-10 leading-relaxed`}
        >
          Silakan lakukan Otorisasi Masuk untuk mengakses E-KTA, menghubungkan
          Strava, dan fitur eksklusif alumni lainnya.
        </Text>

        <TouchableOpacity
          onPress={() => navigation.navigate("Auth")} // Lari ke Halaman Login
          style={tw`bg-[${IKA_COLORS.primary.navy}] px-10 py-4 rounded-2xl shadow-lg shadow-blue-900/30`}
        >
          <Text style={tw`text-white font-bold tracking-widest uppercase`}>
            Otorisasi Sekarang
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // --- 🔓 TAMPILAN JIKA SUDAH LOGIN (PROFIL PREMIUM SEBELUMNYA) ---
  return (
    <SafeAreaView style={tw`flex-1 bg-[${IKA_COLORS.primary.navy}]`}>
      <StatusBar style="light" />
      <View style={tw`flex-1 bg-gray-50`}>
        <ScrollView
          contentContainerStyle={tw`pb-32`}
          showsVerticalScrollIndicator={false}
        >
          {/* HEADER NAVY */}
          <ImageBackground
            source={{
              uri: "https://images.unsplash.com/photo-1574872120392-80517865dc6d?q=80&w=1000&auto=format&fit=crop",
            }}
            style={tw`w-full bg-[${IKA_COLORS.primary.navy}] pt-10 pb-32 px-6`}
            imageStyle={tw`opacity-10`}
          >
            <View style={tw`flex-row items-center`}>
              <View style={tw`relative mr-4`}>
                <Image
                  source={{
                    uri:
                      athleteProfileUrl ||
                      `https://ui-avatars.com/api/?name=${athleteName}&background=F8FAFC&color=152B5B`,
                  }}
                  style={tw`w-16 h-16 rounded-full border-2 border-white bg-white`}
                />
                <View
                  style={tw`absolute -bottom-1 -right-1 bg-[${IKA_COLORS.accent.gold}] px-2 py-0.5 rounded-full border border-white`}
                >
                  <Text style={tw`text-[8px] font-black text-white italic`}>
                    ALUMNI
                  </Text>
                </View>
              </View>

              <View style={tw`flex-1`}>
                <Text style={tw`text-white text-lg font-bold mr-1`}>
                  {athleteName}
                </Text>
                <Text style={tw`text-blue-200 text-xs mt-0.5`}>
                  {currentUser.email}
                </Text>{" "}
                {/* Nampilin Email Firebase Asli */}
                <View style={tw`flex-row mt-2`}>
                  <TouchableOpacity
                    onPress={() => setQrModalVisible(true)}
                    style={tw`flex-row items-center bg-white/20 px-3 py-1 rounded-full mr-2`}
                  >
                    <Ionicons name="qr-code" size={12} color="white" />
                    <Text style={tw`text-white text-[10px] font-bold ml-1`}>
                      QR E-KTA
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ImageBackground>

          {/* SISA MENU BAWAH SEPERTI SEBELUMNYA ... */}
          <View
            style={[
              tw`-mt-16 mx-5 bg-white rounded-2xl py-6 px-2 flex-row justify-between items-start border border-gray-100`,
              { elevation: 8, zIndex: 100 },
            ]}
          >
            {/* ... Tombol Menu Cepat ... */}
            <TouchableOpacity style={tw`items-center w-1/4`}>
              <View
                style={tw`w-11 h-11 rounded-full bg-blue-50 items-center justify-center mb-2`}
              >
                <Ionicons
                  name="card"
                  size={22}
                  color={IKA_COLORS.primary.navy}
                />
              </View>
              <Text style={tw`text-[10px] text-center font-bold text-gray-700`}>
                Unduh{"\n"}E-KTA
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={tw`items-center w-1/4`}>
              <View
                style={tw`w-11 h-11 rounded-full bg-green-50 items-center justify-center mb-2`}
              >
                <Ionicons name="print" size={22} color="#10B981" />
              </View>
              <Text style={tw`text-[10px] text-center font-bold text-gray-700`}>
                Cetak ID{"\n"}E-Money
              </Text>
            </TouchableOpacity>
          </View>

          <View style={tw`mt-6 bg-white border-t border-b border-gray-100`}>
            <TouchableOpacity
              onPress={handleLogout}
              style={tw`flex-row items-center py-4 px-6`}
            >
              <Ionicons
                name="log-out-outline"
                size={24}
                color="#EF4444"
                style={tw`mr-3`}
              />
              <Text style={tw`flex-1 text-sm font-bold text-red-500`}>
                Keluar Sesi
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* MODAL QR E-KTA */}
        <Modal
          visible={isQrModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setQrModalVisible(false)}
        >
          <View
            style={tw`flex-1 bg-black/60 items-center justify-center p-8`}
          >
            <View
              style={tw`bg-white rounded-[28px] p-8 w-full max-w-sm items-center`}
            >
              <View
                style={tw`w-14 h-14 bg-blue-50 rounded-2xl items-center justify-center mb-4`}
              >
                <Ionicons
                  name="card"
                  size={28}
                  color={IKA_COLORS.primary.navy}
                />
              </View>
              <Text style={tw`text-xl font-black text-slate-800 mb-1`}>
                E-KTA Digital
              </Text>
              <Text
                style={tw`text-xs text-slate-400 font-medium mb-6 text-center`}
              >
                Pindai untuk memverifikasi identitas alumni
              </Text>

              <View
                style={tw`bg-white p-3 rounded-2xl border border-slate-100 shadow-sm mb-4`}
              >
                <Image
                  source={{
                    uri: `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
                      `IKAUII-DIY|${currentUser.uid}|${athleteName}|${currentUser.email}`,
                    )}`,
                  }}
                  style={tw`w-56 h-56`}
                  resizeMode="contain"
                />
              </View>

              <Text style={tw`text-sm font-black text-slate-800`}>
                {athleteName}
              </Text>
              <Text style={tw`text-xs text-slate-500 mb-1`}>
                {currentUser.email}
              </Text>
              <View
                style={tw`bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 mb-6`}
              >
                <Text
                  style={tw`text-[10px] font-black text-emerald-600 uppercase tracking-widest`}
                >
                  ✓ Terverifikasi
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setQrModalVisible(false)}
                style={tw`w-full bg-[${IKA_COLORS.primary.navy}] py-3.5 rounded-2xl items-center`}
              >
                <Text
                  style={tw`text-white font-black text-sm uppercase tracking-widest`}
                >
                  Tutup
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}
