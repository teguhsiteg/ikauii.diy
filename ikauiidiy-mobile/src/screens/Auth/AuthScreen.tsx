import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  ImageBackground,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import tw from "twrnc";
import { IKA_COLORS } from "../../constants/colors";
import { StatusBar } from "expo-status-bar";

import { auth, db } from "../../config/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function AuthScreen({ navigation }: any) {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleAuth = async () => {
    if (!email || !password || (!isLogin && !name)) {
      Alert.alert("Data Tidak Lengkap", "Mohon lengkapi seluruh form.");
      return;
    }
    setIsLoading(true);

    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password,
        );
        const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));

        if (userDoc.exists()) {
          const userData = userDoc.data();
          await AsyncStorage.setItem("@user_role", userData.role || "public");
          await AsyncStorage.setItem("@user_name", userData.nama || "Alumni");
          Alert.alert(
            "Akses Diberikan",
            `Selamat datang kembali, ${userData.nama}!`,
          );
          // navigation.replace('MainApp');
        }
      } else {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password,
        );
        await setDoc(doc(db, "users", userCredential.user.uid), {
          nama: name,
          email: email,
          role: "public",
          createdAt: new Date().toISOString(),
        });
        Alert.alert(
          "Registrasi Berhasil",
          "Identitas digital Anda telah dibuat.",
        );
        setIsLogin(true);
      }
    } catch (error: any) {
      if (error.code === "auth/api-key-not-valid") {
        Alert.alert(
          "Sistem Terkunci",
          "Harap masukkan API Key Firebase yang valid di config.",
        );
      } else {
        Alert.alert("Otentikasi Gagal", "Periksa kembali kredensial Anda.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-[${IKA_COLORS.primary.navy}]`}>
      <StatusBar style="light" />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={tw`flex-1`}
      >
        {/* --- HEADER PREMIUM (DARK ELEGANCE) --- */}
        <ImageBackground
          source={{
            uri: "https://images.unsplash.com/photo-1574872120392-80517865dc6d?q=80&w=1000&auto=format&fit=crop",
          }}
          style={tw`flex-[0.45] justify-center items-center px-8`}
          imageStyle={tw`opacity-20`}
        >
          <View style={tw`items-center mt-10`}>
            <View
              style={tw`w-24 h-24 bg-white/5 rounded-[2rem] border border-white/10 items-center justify-center mb-6 shadow-2xl`}
            >
              <Ionicons
                name="finger-print-outline"
                size={50}
                color={IKA_COLORS.accent.gold}
              />
            </View>
            <Text
              style={tw`text-4xl font-black text-white tracking-widest uppercase mb-1`}
            >
              IKA UII DIY
            </Text>
            <View
              style={tw`h-0.5 w-12 bg-[${IKA_COLORS.accent.gold}] mb-4 rounded-full`}
            />
            <Text
              style={tw`text-blue-100/70 text-sm font-medium tracking-[0.2em] text-center uppercase`}
            >
              Sistem Akses Terpadu
            </Text>
          </View>
        </ImageBackground>

        {/* --- FORM CARD (CLEAN & MINIMALIST) --- */}
        <View
          style={tw`flex-[0.55] bg-white rounded-t-[40px] px-10 pt-12 pb-8 shadow-2xl justify-between`}
        >
          <View>
            <Text
              style={tw`text-3xl font-black text-slate-800 tracking-tight mb-2`}
            >
              {isLogin ? "Otorisasi" : "Identitas Baru"}
            </Text>
            <Text style={tw`text-slate-400 text-sm font-medium mb-10`}>
              {isLogin
                ? "Masukkan kredensial untuk mengakses sistem."
                : "Daftarkan diri Anda ke dalam ekosistem."}
            </Text>

            {/* Input Nama */}
            {!isLogin && (
              <View
                style={tw`flex-row items-center border-b ${focusedInput === "name" ? `border-[${IKA_COLORS.primary.navy}]` : "border-slate-200"} pb-3 mb-6 transition-all`}
              >
                <Ionicons
                  name="person-outline"
                  size={22}
                  color={
                    focusedInput === "name"
                      ? IKA_COLORS.primary.navy
                      : "#94a3b8"
                  }
                  style={tw`mr-4`}
                />
                <TextInput
                  placeholder="Nama Lengkap"
                  placeholderTextColor="#94a3b8"
                  value={name}
                  onChangeText={setName}
                  onFocus={() => setFocusedInput("name")}
                  onBlur={() => setFocusedInput(null)}
                  style={tw`flex-1 text-slate-800 text-base font-medium`}
                />
              </View>
            )}

            {/* Input Email */}
            <View
              style={tw`flex-row items-center border-b ${focusedInput === "email" ? `border-[${IKA_COLORS.primary.navy}]` : "border-slate-200"} pb-3 mb-6`}
            >
              <Ionicons
                name="mail-outline"
                size={22}
                color={
                  focusedInput === "email" ? IKA_COLORS.primary.navy : "#94a3b8"
                }
                style={tw`mr-4`}
              />
              <TextInput
                placeholder="Alamat Surel"
                placeholderTextColor="#94a3b8"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                onFocus={() => setFocusedInput("email")}
                onBlur={() => setFocusedInput(null)}
                style={tw`flex-1 text-slate-800 text-base font-medium`}
              />
            </View>

            {/* Input Password */}
            <View
              style={tw`flex-row items-center border-b ${focusedInput === "password" ? `border-[${IKA_COLORS.primary.navy}]` : "border-slate-200"} pb-3 mb-4`}
            >
              <Ionicons
                name="lock-closed-outline"
                size={22}
                color={
                  focusedInput === "password"
                    ? IKA_COLORS.primary.navy
                    : "#94a3b8"
                }
                style={tw`mr-4`}
              />
              <TextInput
                placeholder="Kata Sandi"
                placeholderTextColor="#94a3b8"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                onFocus={() => setFocusedInput("password")}
                onBlur={() => setFocusedInput(null)}
                style={tw`flex-1 text-slate-800 text-base font-medium`}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={tw`p-1`}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={22}
                  color="#94a3b8"
                />
              </TouchableOpacity>
            </View>

            {isLogin && (
              <TouchableOpacity style={tw`self-end mt-2`}>
                <Text
                  style={tw`text-[${IKA_COLORS.primary.navy}] text-xs font-bold uppercase tracking-wider`}
                >
                  Pulihkan Sandi?
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Bagian Bawah (Tombol & Toggle) */}
          <View style={tw`mt-8`}>
            <TouchableOpacity
              onPress={handleAuth}
              disabled={isLoading}
              style={tw`w-full bg-[${IKA_COLORS.primary.navy}] py-4 rounded-2xl items-center shadow-lg shadow-blue-900/20`}
            >
              {isLoading ? (
                <ActivityIndicator color={IKA_COLORS.accent.gold} />
              ) : (
                <Text
                  style={tw`text-white font-black text-sm tracking-[0.15em] uppercase`}
                >
                  {isLogin ? "Otorisasi Masuk" : "Buat Identitas"}
                </Text>
              )}
            </TouchableOpacity>

            <View style={tw`flex-row justify-center mt-6`}>
              <Text style={tw`text-slate-400 text-sm font-medium`}>
                {isLogin
                  ? "Belum terdaftar di sistem? "
                  : "Sudah memiliki identitas? "}
              </Text>
              <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
                <Text
                  style={tw`text-[${IKA_COLORS.accent.gold}] font-bold text-sm`}
                >
                  {isLogin ? "Registrasi" : "Akses Sistem"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
