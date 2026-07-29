import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import tw from "twrnc";
import { IKA_COLORS } from "../../constants/colors";
import { useIsFocused } from "@react-navigation/native"; // 🔥 IMPORT HOOK SAKTI INI

export default function ScannerHomeScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  // 🔥 Saklar Pintar: Bernilai `true` HANYA JIKA user berada di layar Scanner ini
  const isFocused = useIsFocused();

  // Reset status scan setiap kali user kembali ke layar ini
  useEffect(() => {
    if (isFocused) {
      setScanned(false);
    }
  }, [isFocused]);

  // Menunggu status izin kamera
  if (!permission) {
    return <View style={tw`flex-1 bg-[${IKA_COLORS.primary.navy}]`} />;
  }

  // Jika izin belum diberikan
  if (!permission.granted) {
    return (
      <SafeAreaView style={tw`flex-1 bg-white items-center justify-center p-6`}>
        <Ionicons
          name="camera-outline"
          size={80}
          color={IKA_COLORS.primary.navy}
        />
        <Text
          style={tw`text-lg font-bold text-center mt-4 mb-6 text-slate-800`}
        >
          Aplikasi butuh akses Kamera untuk melakukan scan QR Code.
        </Text>
        <TouchableOpacity
          onPress={requestPermission}
          style={tw`bg-[${IKA_COLORS.primary.navy}] px-8 py-4 rounded-2xl shadow-lg shadow-blue-900/30`}
        >
          <Text
            style={tw`text-white font-black text-sm uppercase tracking-widest`}
          >
            Izinkan Kamera
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Fungsi Logika "Polisi Lalu Lintas" saat QR terbaca
  const handleBarcodeScanned = ({
    type,
    data,
  }: {
    type: string;
    data: string;
  }) => {
    setScanned(true);

    // 1. Logika Scan Validasi Dokumen
    if (data.includes("validasi") || data.includes("surat")) {
      Alert.alert(
        "📄 Validasi E-Office",
        `Mengecek keaslian dokumen...\nData: ${data}`,
        [{ text: "OK", onPress: () => setScanned(false) }],
      );
    }
    // 2. Logika Scan e-KTA
    else if (data.includes("KTA-") || data.includes("alumni")) {
      Alert.alert(
        "👤 Profil Alumni",
        `Membuka e-KTA Digital...\nData: ${data}`,
        [{ text: "OK", onPress: () => setScanned(false) }],
      );
    }
    // 3. Logika Scan Donasi / Iuran (QRIS/Payment Link)
    else if (
      data.includes("qris") ||
      data.includes("pay") ||
      data.includes("donasi")
    ) {
      Alert.alert(
        "💰 Pembayaran / Donasi",
        `Mengarahkan ke gateway pembayaran...\nData: ${data}`,
        [{ text: "Lanjutkan", onPress: () => setScanned(false) }],
      );
    }
    // 4. Jika format tidak dikenali
    else {
      Alert.alert(
        "🔍 QR Code Terbaca",
        `Teks: ${data}\n\nFormat QR Code tidak dikenali oleh sistem IKA UII DIY.`,
        [{ text: "Scan Ulang", onPress: () => setScanned(false) }],
      );
    }
  };

  return (
    <View style={tw`flex-1 bg-black`}>
      {/* 🔥 Render Kamera HANYA JIKA isFocused = true (Hemat Baterai & RAM) */}
      {isFocused && (
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
          onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
        >
          {/* --- UI OVERLAY SCANNER --- */}
          <SafeAreaView style={tw`flex-1 justify-between`}>
            {/* Header */}
            <View style={tw`bg-black/40 p-6 flex-row items-center pt-12`}>
              <View style={tw`flex-1`}>
                <Text style={tw`text-white font-black text-2xl tracking-tight`}>
                  IKA Scanner
                </Text>
                <Text
                  style={tw`text-[${IKA_COLORS.accent.gold}] text-xs mt-1 font-bold tracking-widest uppercase`}
                >
                  Validasi, e-KTA, & Donasi
                </Text>
              </View>
              <View
                style={tw`bg-white/20 p-2.5 rounded-2xl border border-white/30 backdrop-blur-sm`}
              >
                <Ionicons
                  name="qr-code"
                  size={28}
                  color={IKA_COLORS.accent.gold}
                />
              </View>
            </View>

            {/* Kotak Fokus Tengah */}
            <View style={tw`flex-1 items-center justify-center`}>
              <View
                style={tw`w-64 h-64 border-[0.5px] border-white/30 bg-transparent relative rounded-3xl overflow-hidden`}
              >
                {/* Efek Sudut Kotak yang lebih modern */}
                <View
                  style={tw`absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-[${IKA_COLORS.accent.gold}] rounded-tl-3xl`}
                />
                <View
                  style={tw`absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-[${IKA_COLORS.accent.gold}] rounded-tr-3xl`}
                />
                <View
                  style={tw`absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-[${IKA_COLORS.accent.gold}] rounded-bl-3xl`}
                />
                <View
                  style={tw`absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-[${IKA_COLORS.accent.gold}] rounded-br-3xl`}
                />

                {/* Garis Scan Animasi Statis (Visual Feedback) */}
                <View
                  style={tw`w-full h-0.5 bg-[${IKA_COLORS.accent.gold}] absolute top-1/2 opacity-50 shadow-lg`}
                />
              </View>
            </View>

            {/* Footer Instruksi */}
            <View
              style={tw`bg-black/40 p-8 pb-32 items-center backdrop-blur-md`}
            >
              <View
                style={tw`bg-black/50 px-6 py-3 rounded-full border border-white/10`}
              >
                <Text style={tw`text-white text-center font-medium text-sm`}>
                  Arahkan kamera ke QR Code. Sistem akan memproses otomatis.
                </Text>
              </View>
            </View>
          </SafeAreaView>
        </CameraView>
      )}
    </View>
  );
}
