import { Metadata } from "next";
import { dbAdmin } from "@/lib/firebase-admin";
import AgendaContent from "./AgendaContent";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  try {
    const resolvedParams = await params;
    const safeId = decodeURIComponent(resolvedParams.id || "");
    
    // Agenda ID handling (same as content logic)
    let firestoreId = safeId;
    if (safeId.includes("-")) {
      firestoreId = safeId.split("-").pop() || safeId;
    }

    const docRef = dbAdmin.collection("agenda").doc(firestoreId);
    const docSnap = await docRef.get();

    if (docSnap.exists) {
      const data = docSnap.data();
      const plainTextDesc = data?.deskripsi ? data.deskripsi.replace(/<[^>]+>/g, '').substring(0, 150) + '...' : "Agenda kegiatan DPW IKA UII DIY";
      
      return {
        title: `${data?.judul} | Agenda IKA UII DIY`,
        description: plainTextDesc,
        openGraph: {
          title: data?.judul,
          description: plainTextDesc,
          images: [
            {
              url: data?.posterUrl || "/api/og",
              width: 1200,
              height: 630,
            }
          ],
        },
        twitter: {
          card: "summary_large_image",
          title: data?.judul,
          description: plainTextDesc,
          images: [data?.posterUrl || "https://ikadiy.uii.ac.id/api/og"],
        }
      };
    }
  } catch (error) {
    console.error("Error generating metadata for agenda:", error);
  }

  return {
    title: "Agenda | DPW IKA UII DIY",
  };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return <AgendaContent id={resolvedParams.id} />;
}
