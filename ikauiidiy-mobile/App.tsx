import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, Text, Platform, Linking, TouchableOpacity } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import tw from "twrnc";
import { doc, getDoc } from "firebase/firestore";
import { db } from "./src/config/firebase";

import TabNavigator from "./src/navigation/TabNavigator";
import OnboardingScreen from "./src/screens/Onboarding/OnboardingScreen";
import AuthScreen from "./src/screens/Auth/AuthScreen";
import ActiveQuizScreen from "./src/screens/Quiz/ActiveQuizScreen";
import AgendaScreen from "./src/screens/Dashboard/AgendaScreen";
import KarirScreen from "./src/screens/Dashboard/KarirScreen";
import { IKA_COLORS } from "./src/constants/colors";

const Stack = createNativeStackNavigator();

// CURRENT APP VERSION
const APP_VERSION = "1.0.0";

export default function App() {
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);
  const [mobileConfig, setMobileConfig] = useState<any>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);

  useEffect(() => {
    const checkAppLaunch = async () => {
      try {
        const hasLaunched = await AsyncStorage.getItem("@hasLaunched");
        if (hasLaunched === "true") setIsFirstLaunch(false);
        else setIsFirstLaunch(true);
      } catch (error) {
        setIsFirstLaunch(false);
      }
    };

    const fetchConfig = async () => {
      try {
        const docRef = doc(db, "pengaturan", "mobile_config");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setMobileConfig(docSnap.data());
        }
      } catch (error) {
        console.log("Failed to fetch mobile config", error);
      } finally {
        setIsLoadingConfig(false);
      }
    };

    checkAppLaunch();
    fetchConfig();
  }, []);

  // Helper to compare version (e.g. 1.0.0 vs 1.0.1)
  const isUpdateRequired = () => {
    if (!mobileConfig) return false;
    const minVersion = Platform.OS === "ios" ? mobileConfig.minVersionIOS : mobileConfig.minVersionAndroid;
    if (!minVersion) return false;
    // Simple string comparison for basic semantic versioning
    return APP_VERSION.localeCompare(minVersion, undefined, { numeric: true, sensitivity: 'base' }) < 0;
  };

  if (isFirstLaunch === null || isLoadingConfig) {
    return (
      <View style={tw`flex-1 items-center justify-center bg-[${IKA_COLORS.primary.navy}]`}>
        <ActivityIndicator size="large" color={IKA_COLORS.accent.gold} />
        <Text style={tw`text-white mt-4 font-bold`}>Menyiapkan IKA UII DIY...</Text>
      </View>
    );
  }

  if (mobileConfig?.maintenanceMode) {
    return (
      <View style={tw`flex-1 items-center justify-center bg-white px-6`}>
        <Text style={tw`text-6xl mb-4`}>🛠️</Text>
        <Text style={tw`text-2xl font-black text-center text-slate-800 mb-2`}>Sedang Pemeliharaan</Text>
        <Text style={tw`text-base text-center text-slate-500`}>
          {mobileConfig.maintenanceMessage || "Aplikasi sedang dalam pemeliharaan rutin. Silakan coba beberapa saat lagi."}
        </Text>
      </View>
    );
  }

  if (isUpdateRequired()) {
    return (
      <View style={tw`flex-1 items-center justify-center bg-white px-6`}>
        <Text style={tw`text-6xl mb-4`}>🚀</Text>
        <Text style={tw`text-2xl font-black text-center text-slate-800 mb-2`}>Update Tersedia</Text>
        <Text style={tw`text-base text-center text-slate-500 mb-8`}>
          Versi aplikasi Anda sudah usang. Silakan perbarui ke versi terbaru untuk pengalaman yang lebih baik.
        </Text>
        <TouchableOpacity
          style={tw`bg-[${IKA_COLORS.primary.navy}] px-8 py-3 rounded-xl`}
          onPress={() => {
            // Placeholder: Link ke Play Store atau App Store
            Linking.openURL(Platform.OS === 'ios' ? 'https://apps.apple.com/' : 'market://details?id=com.ikauiidiy.app');
          }}
        >
          <Text style={tw`text-white font-bold`}>Update Sekarang</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/* 1. Onboarding (Jika baru pertama kali buka) */}
        {isFirstLaunch && (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        )}

        {/* 2. Langsung Masuk ke Aplikasi Utama (Publik bisa lihat) */}
        <Stack.Screen name="MainApp" component={TabNavigator} />

        {/* 3. AuthScreen Disembunyikan, hanya dipanggil jika ditekan */}
        <Stack.Screen name="Auth" component={AuthScreen} />

        {/* 4. Active Quiz Screen */}
        <Stack.Screen name="ActiveQuiz" component={ActiveQuizScreen} />

        {/* 5. Agenda & Karir */}
        <Stack.Screen name="Agenda" component={AgendaScreen} />
        <Stack.Screen name="Karir" component={KarirScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
