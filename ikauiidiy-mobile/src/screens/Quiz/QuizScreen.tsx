import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ImageBackground,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import tw from "twrnc";
import { IKA_COLORS } from "../../constants/colors";
import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Firebase Imports
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../config/firebase";

export default function QuizScreen({ navigation }: any) {
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCoins, setTotalCoins] = useState(0);
  const [activeQuiz, setActiveQuiz] = useState<any>(null); // Kuis yang sedang dikerjakan

  useEffect(() => {
    fetchQuizzes();
    loadUserData();
  }, []);

  const loadUserData = async () => {
    const coins = await AsyncStorage.getItem("@total_coins");
    const savedActiveQuiz = await AsyncStorage.getItem("@active_quiz_data");
    if (coins) setTotalCoins(parseInt(coins));
    if (savedActiveQuiz) setActiveQuiz(JSON.parse(savedActiveQuiz));
  };

  const fetchQuizzes = async () => {
    try {
      const snapshot = await getDocs(collection(db, "kuis"));
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setQuizzes(data.length > 0 ? data : dummyQuizzes);
    } catch (e) {
      setQuizzes(dummyQuizzes);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={tw`flex-1 bg-gray-50`}>
      <StatusBar style="dark" />

      {/* --- TOP BAR & COIN BALANCE --- */}
      <View
        style={tw`bg-white px-6 pt-14 pb-6 flex-row justify-between items-center border-b border-gray-100 shadow-sm`}
      >
        <View>
          <Text
            style={tw`text-xs text-gray-500 font-bold uppercase tracking-widest`}
          >
            Kuis Alumni
          </Text>
          <Text
            style={tw`text-xl font-black text-[${IKA_COLORS.primary.navy}]`}
          >
            Pusat Tantangan
          </Text>
        </View>
        <View
          style={tw`bg-amber-50 px-4 py-2 rounded-2xl flex-row items-center border border-amber-100`}
        >
          <Ionicons name="gift" size={18} color={IKA_COLORS.accent.gold} />
          <View style={tw`ml-2`}>
            <Text style={tw`text-[10px] font-bold text-amber-600 uppercase`}>
              Coin IKA
            </Text>
            <Text style={tw`text-sm font-black text-slate-800`}>
              {totalCoins.toLocaleString()}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={tw`pb-24 pt-6`}
        showsVerticalScrollIndicator={false}
      >
        {/* --- ACTIVE QUIZ PROGRESS (HIGHLIGHT) --- */}
        {activeQuiz ? (
          <View style={tw`px-6 mb-8`}>
            <Text
              style={tw`text-xs font-bold text-slate-400 mb-4 uppercase tracking-widest`}
            >
              Sedang Dikerjakan
            </Text>
            <TouchableOpacity
              activeOpacity={0.9}
              style={tw`bg-[${IKA_COLORS.primary.navy}] p-6 rounded-[30px] shadow-xl shadow-blue-900/20`}
            >
              <View style={tw`flex-row justify-between items-start mb-6`}>
                <View style={tw`flex-1 mr-4`}>
                  <Text style={tw`text-white text-xl font-black leading-tight`}>
                    {activeQuiz.judul}
                  </Text>
                  <Text style={tw`text-blue-200 text-xs mt-1`}>
                    {activeQuiz.currentStep} dari {activeQuiz.totalStep}{" "}
                    Pertanyaan
                  </Text>
                </View>
                <View style={tw`bg-white/10 p-3 rounded-2xl`}>
                  <Ionicons
                    name="timer-outline"
                    size={24}
                    color={IKA_COLORS.accent.gold}
                  />
                </View>
              </View>

              {/* Progress Bar */}
              <View
                style={tw`h-2.5 bg-white/10 rounded-full overflow-hidden mb-2`}
              >
                <View
                  style={[
                    tw`h-full bg-[${IKA_COLORS.accent.gold}]`,
                    {
                      width: `${(activeQuiz.currentStep / activeQuiz.totalStep) * 100}%`,
                    },
                  ]}
                />
              </View>
              <Text
                style={tw`text-right text-[10px] font-bold text-white/50 uppercase tracking-tighter`}
              >
                Lanjutkan untuk Poin
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Tampilan jika tidak ada kuis aktif */
          <View style={tw`px-6 mb-8`}>
            <ImageBackground
              source={{
                uri: "https://images.unsplash.com/photo-1606326666390-4d47770b4763?q=80&w=1000",
              }}
              style={tw`w-full h-44 rounded-[30px] overflow-hidden justify-end p-6`}
              imageStyle={tw`opacity-40`}
            >
              <View style={tw`bg-black/60 absolute inset-0`} />
              <Text style={tw`text-white text-2xl font-black mb-1`}>
                Uji Wawasanmu
              </Text>
              <Text style={tw`text-gray-300 text-xs font-medium`}>
                Selesaikan kuis dan kumpulkan Coin IKA UII DIY.
              </Text>
            </ImageBackground>
          </View>
        )}

        {/* --- DAFTAR KUIS TERSEDIA --- */}
        <View style={tw`px-6`}>
          <Text
            style={tw`text-sm font-bold text-slate-800 mb-5 uppercase tracking-wider`}
          >
            Kuis Tersedia
          </Text>

          {isLoading ? (
            <ActivityIndicator color={IKA_COLORS.primary.navy} />
          ) : (
            quizzes.map((item, index) => (
              <TouchableOpacity
                key={item.id || index}
                style={tw`bg-white rounded-3xl p-4 mb-4 flex-row items-center border border-gray-100 shadow-sm`}
                onPress={() =>
                  Alert.alert("Konfirmasi", `Mulai kuis ${item.judul}?`)
                }
              >
                <View
                  style={tw`w-16 h-16 rounded-2xl bg-blue-50 items-center justify-center mr-4`}
                >
                  <Ionicons
                    name="help-circle"
                    size={30}
                    color={IKA_COLORS.primary.navy}
                  />
                </View>
                <View style={tw`flex-1`}>
                  <Text
                    style={tw`text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-1`}
                  >
                    {item.kategori || "Alumni"}
                  </Text>
                  <Text style={tw`text-base font-black text-slate-800 mb-1`}>
                    {item.judul}
                  </Text>
                  <View style={tw`flex-row items-center`}>
                    <Ionicons name="layers-outline" size={12} color="#94a3b8" />
                    <Text
                      style={tw`text-xs text-slate-500 ml-1 font-medium mr-4`}
                    >
                      {item.jmlSoal || 10} Soal
                    </Text>
                    <Ionicons
                      name="diamond-outline"
                      size={12}
                      color="#F59E0B"
                    />
                    <Text style={tw`text-xs text-amber-600 ml-1 font-bold`}>
                      +{item.reward || 100} Coin
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

// --- DATA DUMMY ---
const dummyQuizzes = [
  {
    id: "q_001",
    judul: "Sejarah & Nilai UII",
    kategori: "Wawasan",
    jmlSoal: 10,
    reward: 150,
  },
  {
    id: "q_002",
    judul: "Kilas Balik FMIPA",
    kategori: "Fakultas",
    jmlSoal: 5,
    reward: 100,
  },
  {
    id: "q_003",
    judul: "Update Organisasi DIY",
    kategori: "Regional",
    jmlSoal: 8,
    reward: 120,
  },
];
