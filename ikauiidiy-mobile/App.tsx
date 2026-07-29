import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, Text } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import tw from "twrnc";

import TabNavigator from "./src/navigation/TabNavigator";
import OnboardingScreen from "./src/screens/Onboarding/OnboardingScreen";
import AuthScreen from "./src/screens/Auth/AuthScreen";
import { IKA_COLORS } from "./src/constants/colors";

const Stack = createNativeStackNavigator();

export default function App() {
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);

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
    checkAppLaunch();
  }, []);

  if (isFirstLaunch === null) {
    return (
      <View
        style={tw`flex-1 items-center justify-center bg-[${IKA_COLORS.primary.navy}]`}
      >
        <ActivityIndicator size="large" color={IKA_COLORS.accent.gold} />
        <Text style={tw`text-white mt-4 font-bold`}>
          Menyiapkan IKA UII DIY...
        </Text>
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}
