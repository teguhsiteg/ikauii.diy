import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import tw from "twrnc";
import { IKA_COLORS } from "../../constants/colors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";
import { QuizQuestion } from "../../types";

// Firebase Imports
import { collection, getDocs, doc, updateDoc, getDoc } from "firebase/firestore";
import { db, auth } from "../../config/firebase";

export default function ActiveQuizScreen({ route, navigation }: any) {
  const { quizId, quizTitle, totalStep } = route.params;

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      // Asumsi ada subcollection 'soal' di dalam kuis
      const snapshot = await getDocs(collection(db, "kuis", quizId, "soal"));
      let data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as QuizQuestion[];

      if (data.length === 0) {
        // Fallback Dummy Data
        data = Array.from({ length: totalStep }).map((_, i) => ({
          id: `q_${i}`,
          question: `Pertanyaan contoh nomor ${i + 1} untuk kuis ini. Manakah jawaban yang benar?`,
          options: ["Jawaban A", "Jawaban B", "Jawaban C", "Jawaban D"],
          correctAnswerIndex: 0,
        }));
      }

      setQuestions(data);
    } catch (error) {
      console.log("Error fetching questions:", error);
      // Fallback Dummy Data
      const dummyData = Array.from({ length: totalStep }).map((_, i) => ({
        id: `q_${i}`,
        question: `Pertanyaan contoh nomor ${i + 1} untuk kuis ini. Manakah jawaban yang benar?`,
        options: ["Jawaban A", "Jawaban B", "Jawaban C", "Jawaban D"],
        correctAnswerIndex: 0,
      }));
      setQuestions(dummyData);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = async () => {
    if (selectedOption === null) return;

    const currentQuestion = questions[currentStep - 1];
    if (selectedOption === currentQuestion.correctAnswerIndex) {
      setScore((prev) => prev + 10); // Tiap benar +10 Poin (Bisa disesuaikan)
    }

    if (currentStep < questions.length) {
      setCurrentStep((prev) => prev + 1);
      setSelectedOption(null);
    } else {
      await finishQuiz();
    }
  };

  const finishQuiz = async () => {
    setIsSubmitting(true);
    try {
      const finalScore = score + (selectedOption === questions[currentStep - 1].correctAnswerIndex ? 10 : 0);
      
      const user = auth.currentUser;
      if (user) {
        const userRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const currentCoins = userDoc.data().totalCoins || 0;
          await updateDoc(userRef, {
            totalCoins: currentCoins + finalScore,
          });
          await AsyncStorage.setItem("@total_coins", (currentCoins + finalScore).toString());
        }
      } else {
        // Guest mode fallback
        const savedCoins = await AsyncStorage.getItem("@total_coins");
        const currentCoins = savedCoins ? parseInt(savedCoins) : 0;
        await AsyncStorage.setItem("@total_coins", (currentCoins + finalScore).toString());
      }

      await AsyncStorage.removeItem("@active_quiz_data");

      Alert.alert(
        "Kuis Selesai!",
        `Selamat! Anda mendapatkan ${finalScore} Coin IKA.`,
        [{ text: "Tutup", onPress: () => navigation.replace("MainApp", { screen: "Kuis" }) }]
      );
    } catch (e) {
      Alert.alert("Error", "Gagal menyimpan skor kuis.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <View style={tw`flex-1 justify-center items-center bg-[${IKA_COLORS.primary.navy}]`}>
        <ActivityIndicator size="large" color={IKA_COLORS.accent.gold} />
      </View>
    );
  }

  const currentQuestion = questions[currentStep - 1];
  const progressPercent = (currentStep / questions.length) * 100;

  return (
    <SafeAreaView style={tw`flex-1 bg-[${IKA_COLORS.primary.navy}]`}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={tw`flex-row items-center justify-between px-6 pt-10 pb-4`}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={tw`p-2 bg-white/10 rounded-full`}>
          <Ionicons name="close" size={24} color="white" />
        </TouchableOpacity>
        <View style={tw`items-center`}>
          <Text style={tw`text-white font-bold text-sm`}>Kuis Berlangsung</Text>
          <Text style={tw`text-[${IKA_COLORS.accent.gold}] text-xs mt-1 font-black`}>{quizTitle}</Text>
        </View>
        <View style={tw`w-10`} />
      </View>

      {/* Progress */}
      <View style={tw`px-6 mb-6`}>
        <View style={tw`flex-row justify-between mb-2`}>
          <Text style={tw`text-white text-xs font-medium`}>Soal {currentStep} dari {questions.length}</Text>
          <Text style={tw`text-white text-xs font-bold`}>{progressPercent.toFixed(0)}%</Text>
        </View>
        <View style={tw`h-2 bg-white/20 rounded-full overflow-hidden`}>
          <View style={[tw`h-full bg-[${IKA_COLORS.accent.gold}]`, { width: `${progressPercent}%` }]} />
        </View>
      </View>

      {/* Card Soal */}
      <View style={tw`flex-1 bg-white rounded-t-[40px] px-6 pt-10 pb-8 justify-between`}>
        <View>
          <Text style={tw`text-2xl font-black text-slate-800 mb-8 leading-tight`}>
            {currentQuestion?.question}
          </Text>

          {/* Opsi Jawaban */}
          {currentQuestion?.options.map((option, index) => {
            const isSelected = selectedOption === index;
            return (
              <TouchableOpacity
                key={index}
                onPress={() => setSelectedOption(index)}
                style={tw`flex-row items-center p-5 mb-4 rounded-2xl border-2 ${
                  isSelected ? `border-[${IKA_COLORS.primary.navy}] bg-blue-50` : "border-slate-100 bg-white"
                }`}
              >
                <View
                  style={tw`w-6 h-6 rounded-full border-2 items-center justify-center mr-4 ${
                    isSelected ? `border-[${IKA_COLORS.primary.navy}]` : "border-slate-300"
                  }`}
                >
                  {isSelected && <View style={tw`w-3 h-3 rounded-full bg-[${IKA_COLORS.primary.navy}]`} />}
                </View>
                <Text style={tw`flex-1 text-base font-medium ${isSelected ? "text-slate-900 font-bold" : "text-slate-600"}`}>
                  {option}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Action Button */}
        <TouchableOpacity
          onPress={handleNext}
          disabled={selectedOption === null || isSubmitting}
          style={tw`w-full py-4 rounded-2xl items-center shadow-lg ${
            selectedOption === null ? "bg-slate-300" : `bg-[${IKA_COLORS.primary.navy}]`
          }`}
        >
          {isSubmitting ? (
            <ActivityIndicator color={IKA_COLORS.accent.gold} />
          ) : (
            <Text style={tw`text-white font-black text-lg tracking-wider`}>
              {currentStep === questions.length ? "SELESAI" : "SELANJUTNYA"}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
