// src/screens/Onboarding/OnboardingScreen.tsx
import React, { useState } from "react";
import { View, Text, TouchableOpacity, Dimensions } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import tw from "twrnc";
import { IKA_COLORS } from "../../constants/colors";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

const SLIDES = [
  {
    title: "Selamat Datang di IKA UII DIY",
    desc: "Satu aplikasi untuk seluruh kebutuhan administrasi dan kegiatan keluarga besar alumni UII di Yogyakarta.",
    icon: "business",
  },
  {
    title: "E-Office di Genggaman",
    desc: "Akses persuratan, validasi QR Code, dan database alumni kini lebih mudah dan cepat langsung dari smartphone Anda.",
    icon: "document-text",
  },
  {
    title: "Virtual Run & Event",
    desc: "Ikuti event lari Sambung Roso, sinkronkan dengan Strava, dan pantau leaderboard secara real-time!",
    icon: "walk",
  },
];

export default function OnboardingScreen({ navigation }: any) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNext = async () => {
    if (currentIndex < SLIDES.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Simpan status bahwa user sudah melihat onboarding
      await AsyncStorage.setItem("@hasLaunched", "true");
      // Arahkan ke Tab Navigator utama
      navigation.replace("MainApp");
    }
  };

  return (
    <View
      style={tw`flex-1 bg-[${IKA_COLORS.primary.navy}] items-center justify-center px-6`}
    >
      <Ionicons
        name={SLIDES[currentIndex].icon as any}
        size={100}
        color={IKA_COLORS.accent.gold}
        style={tw`mb-8`}
      />

      <Text style={tw`text-3xl font-bold text-white text-center mb-4`}>
        {SLIDES[currentIndex].title}
      </Text>

      <Text style={tw`text-base text-gray-300 text-center mb-12 px-4`}>
        {SLIDES[currentIndex].desc}
      </Text>

      {/* Indikator Titik */}
      <View style={tw`flex-row mb-10`}>
        {SLIDES.map((_, index) => (
          <View
            key={index}
            style={tw`h-2 w-2 rounded-full mx-1 ${currentIndex === index ? `bg-[${IKA_COLORS.accent.gold}] w-6` : "bg-gray-500"}`}
          />
        ))}
      </View>

      <TouchableOpacity
        onPress={handleNext}
        style={tw`bg-[${IKA_COLORS.accent.gold}] py-4 px-12 rounded-full shadow-lg`}
      >
        <Text style={tw`text-[${IKA_COLORS.primary.navy}] font-bold text-lg`}>
          {currentIndex === SLIDES.length - 1
            ? "Mulai Sekarang"
            : "Selanjutnya"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
