// src/navigation/TabNavigator.tsx
import * as React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { IKA_COLORS } from "../constants/colors";

import HomeScreen from "../screens/Dashboard/HomeScreen";
import EventHomeScreen from "../screens/Event/EventHomeScreen";
import ScannerHomeScreen from "../screens/Scan/ScannerHomeScreen";
import ProfileHomeScreen from "../screens/Profile/ProfileHomeScreen";
import QuizScreen from "../screens/Quiz/QuizScreen"; // 🔥 IMPORT HALAMAN KUIS DI SINI

const Tab = createBottomTabNavigator();

// Komponen Tombol Scan Tengah (Tetap Menonjol dengan Aksen Berbeda)
const CustomTabBarButton = ({ children, onPress }: any) => (
  <TouchableOpacity
    style={{ top: -20, justifyContent: "center", alignItems: "center" }}
    onPress={onPress}
    activeOpacity={0.9}
  >
    <View
      style={{
        width: 65,
        height: 65,
        borderRadius: 35,
        backgroundColor: IKA_COLORS.accent.gold, // 🔥 Sekarang pakai Gold biar mewah di atas Navy
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 8,
        borderWidth: 4,
        borderColor: IKA_COLORS.primary.navy, // Border biru biar menyatu dengan bar
      }}
    >
      {children}
    </View>
  </TouchableOpacity>
);

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any = "home";

          if (route.name === "Beranda")
            iconName = focused ? "home" : "home-outline";
          else if (route.name === "Event")
            iconName = focused ? "calendar" : "calendar-outline";
          else if (route.name === "Kuis")
            iconName = focused ? "help-circle" : "help-circle-outline";
          else if (route.name === "Profil")
            iconName = focused ? "person" : "person-outline";

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: IKA_COLORS.accent.gold, // 🔥 Warna Icon Aktif jadi Gold
        tabBarInactiveTintColor: "rgba(255, 255, 255, 0.5)", // Putih transparan untuk yang tidak aktif
        headerShown: false,
        tabBarStyle: {
          backgroundColor: IKA_COLORS.primary.navy, // 🔥 NAVBAR JADI BLUE NAVY
          borderTopWidth: 0,
          height: 75,
          paddingBottom: 12,
          paddingTop: 8,
          borderTopLeftRadius: 20, // Opsional: Bikin melengkung dikit biar modern
          borderTopRightRadius: 20,
          position: "absolute", // Bikin efek melayang jika diinginkan
          bottom: 0,
          left: 0,
          right: 0,
          elevation: 25,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -10 },
          shadowOpacity: 0.2,
          shadowRadius: 10,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "bold",
        },
      })}
    >
      <Tab.Screen name="Beranda" component={HomeScreen} />
      <Tab.Screen name="Event" component={EventHomeScreen} />
      <Tab.Screen
        name="Scan"
        component={ScannerHomeScreen}
        options={{
          tabBarIcon: () => (
            <Ionicons
              name="qr-code-outline"
              size={32}
              color={IKA_COLORS.primary.navy}
            />
          ),
          tabBarButton: (props) => <CustomTabBarButton {...props} />,
        }}
      />
      {/* 🔥 MENGARAHKAN MENU KUIS KE KOMPONEN QUIZSCREEN YANG TEPAT */}
      <Tab.Screen name="Kuis" component={QuizScreen} />
      <Tab.Screen name="Profil" component={ProfileHomeScreen} />
    </Tab.Navigator>
  );
}
