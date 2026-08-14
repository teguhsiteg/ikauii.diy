import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import tw from "twrnc";
import { IKA_COLORS } from "../../constants/colors";
import { StatusBar } from "expo-status-bar";
import { db } from "../../config/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { Agenda } from "../../types";

export default function AgendaScreen({ navigation }: any) {
  const [agendas, setAgendas] = useState<Agenda[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAgendas = async () => {
      try {
        const q = query(collection(db, "agenda"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Agenda[];
        setAgendas(data);
      } catch (error) {
        console.log("Error fetching agenda:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAgendas();
  }, []);

  const formatDate = (isoString?: string) => {
    if (!isoString) return "TBA";
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    return date.toLocaleDateString("id-ID", {
      weekday: "long", day: "2-digit", month: "short", year: "numeric",
    });
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-gray-50`} edges={["top", "left", "right"]}>
      <StatusBar style="dark" />
      <View style={tw`bg-white px-6 py-4 flex-row items-center border-b border-gray-100 shadow-sm`}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={tw`p-2 mr-4 -ml-2`}>
          <Ionicons name="arrow-back" size={24} color={IKA_COLORS.primary.navy} />
        </TouchableOpacity>
        <Text style={tw`text-lg font-black text-[${IKA_COLORS.primary.navy}]`}>Agenda Kegiatan</Text>
      </View>

      <ScrollView contentContainerStyle={tw`p-6 pb-24`} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <ActivityIndicator size="large" color={IKA_COLORS.primary.navy} style={tw`mt-10`} />
        ) : agendas.length === 0 ? (
          <View style={tw`mt-10 items-center`}>
            <Text style={tw`text-slate-500`}>Belum ada agenda kegiatan.</Text>
          </View>
        ) : (
          agendas.map(item => (
            <View key={item.id} style={tw`bg-white rounded-2xl p-4 mb-4 shadow-sm border border-slate-100`}>
               {item.imgUrl || item.posterUrl ? (
                 <Image source={{ uri: item.imgUrl || item.posterUrl }} style={tw`w-full h-40 rounded-xl mb-4 bg-gray-100`} />
               ) : null}
              <View style={tw`flex-row justify-between items-start mb-2`}>
                <Text style={tw`text-[10px] text-[${IKA_COLORS.accent.gold}] font-bold uppercase tracking-widest bg-yellow-50 px-2 py-1 rounded-md`}>
                  {item.isComingSoon ? "COMING SOON" : "UPCOMING"}
                </Text>
              </View>
              <Text style={tw`text-lg font-bold text-slate-800 mb-2`}>{item.judul}</Text>
              <View style={tw`flex-row items-center mb-1`}>
                <Ionicons name="calendar-outline" size={14} color="#64748b" />
                <Text style={tw`text-xs text-slate-500 ml-2`}>{item.isComingSoon ? "Segera Diumumkan" : formatDate(item.tanggal)}</Text>
              </View>
              <View style={tw`flex-row items-center mb-1`}>
                <Ionicons name="time-outline" size={14} color="#64748b" />
                <Text style={tw`text-xs text-slate-500 ml-2`}>{item.waktu || "TBA"}</Text>
              </View>
              <View style={tw`flex-row items-center`}>
                <Ionicons name="location-outline" size={14} color="#64748b" />
                <Text style={tw`text-xs text-slate-500 ml-2`}>{item.lokasi || item.format}</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
