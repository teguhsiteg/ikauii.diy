import { Metadata } from "next";
import { dbAdmin } from "@/lib/firebase-admin";
import BeritaContent from "./BeritaContent";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  try {
    const resolvedParams = await params;
    const docRef = dbAdmin.collection("berita").doc(resolvedParams.id);
    const docSnap = await docRef.get();

    if (docSnap.exists) {
      const data = docSnap.data();
      const plainTextDesc = data?.isi ? data.isi.replace(/<[^>]+>/g, '').substring(0, 150) + '...' : "Berita terbaru dari DPW IKA UII DIY";
      
      return {
        title: `${data?.judul} | DPW IKA UII DIY`,
        description: plainTextDesc,
        openGraph: {
          title: data?.judul,
          description: plainTextDesc,
          images: [
            {
              url: data?.imgUrl || "/api/og",
              width: 1200,
              height: 630,
            }
          ],
        },
        twitter: {
          card: "summary_large_image",
          title: data?.judul,
          description: plainTextDesc,
          images: [data?.imgUrl || "https://ikadiy.uii.ac.id/api/og"],
        }
      };
    }
  } catch (error) {
    console.error("Error generating metadata for berita:", error);
  }

  return {
    title: "Berita | DPW IKA UII DIY",
  };
}

export default function Page() {
  return <BeritaContent />;
}
