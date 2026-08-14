import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import tw from "twrnc";
import { IKA_COLORS } from "../../constants/colors";
import { StatusBar } from "expo-status-bar";
import { db } from "../../config/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";

export default function KarirScreen({ navigation }: any) {
  const [loker, setLoker] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLoker = async () => {
      try {
        const q = query(collection(db, "loker"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setLoker(data);
      } catch (error) {
        console.log("Error fetching loker:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLoker();
  }, []);

  return (
    <SafeAreaView style={tw`flex-1 bg-gray-50`} edges={["top", "left", "right"]}>
      <StatusBar style="dark" />
      <View style={tw`bg-white px-6 py-4 flex-row items-center border-b border-gray-100 shadow-sm`}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={tw`p-2 mr-4 -ml-2`}>
          <Ionicons name="arrow-back" size={24} color={IKA_COLORS.primary.navy} />
        </TouchableOpacity>
        <Text style={tw`text-lg font-black text-[${IKA_COLORS.primary.navy}]`}>Karir & Loker</Text>
      </View>

      <ScrollView contentContainerStyle={tw`p-6 pb-24`} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <ActivityIndicator size="large" color={IKA_COLORS.primary.navy} style={tw`mt-10`} />
        ) : loker.length === 0 ? (
          <View style={tw`mt-10 items-center bg-white p-8 rounded-3xl border border-slate-100 shadow-sm`}>
             <Ionicons name="briefcase-outline" size={48} color="#CBD5E1" />
            <Text style={tw`text-slate-500 font-bold mt-4`}>Belum ada lowongan pekerjaan.</Text>
            <Text style={tw`text-slate-400 text-xs text-center mt-2`}>Informasi lowongan dari alumni untuk alumni akan tampil di sini.</Text>
          </View>
        ) : (
          loker.map(item => (
            <View key={item.id} style={tw`bg-white rounded-2xl p-5 mb-4 shadow-sm border border-slate-100`}>
              <View style={tw`w-12 h-12 bg-blue-50 rounded-xl items-center justify-center mb-3`}>
                <Ionicons name="business" size={24} color={IKA_COLORS.primary.navy} />
              </View>
              <Text style={tw`text-lg font-bold text-slate-800 mb-1`}>{item.posisi || item.judul}</Text>
              <Text style={tw`text-sm font-medium text-slate-500 mb-4`}>{item.perusahaan}</Text>
              
              <View style={tw`flex-row flex-wrap gap-2 mb-4`}>
                <View style={tw`bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 flex-row items-center`}>
                  <Ionicons name="location-outline" size={12} color="#64748b" />
                  <Text style={tw`text-[10px] text-slate-500 ml-1 font-bold`}>{item.lokasi || "Indonesia"}</Text>
                </View>
                <View style={tw`bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 flex-row items-center`}>
                  <Ionicons name="time-outline" size={12} color="#64748b" />
                  <Text style={tw`text-[10px] text-slate-500 ml-1 font-bold`}>{item.jenisPekerjaan || "Full-time"}</Text>
                </View>
              </View>

              <TouchableOpacity style={tw`w-full bg-[${IKA_COLORS.primary.navy}] py-3 rounded-xl items-center`}>
                <Text style={tw`text-white font-bold text-xs uppercase tracking-widest`}>Lihat Detail</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
