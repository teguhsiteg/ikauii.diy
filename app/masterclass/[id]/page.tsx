import { Metadata } from "next";
import { dbAdmin } from "@/lib/firebase-admin";
import MasterclassContent from "./MasterclassContent";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  try {
    const resolvedParams = await params;
    const docRef = dbAdmin.collection("masterclass_courses").doc(resolvedParams.id);
    const docSnap = await docRef.get();

    if (docSnap.exists) {
      const data = docSnap.data();
      const plainTextDesc = data?.deskripsi ? data.deskripsi.replace(/<[^>]+>/g, '').substring(0, 150) + '...' : "Masterclass IKA UII DIY";
      
      return {
        title: `${data?.judul} | Masterclass IKA UII`,
        description: plainTextDesc,
        openGraph: {
          title: data?.judul,
          description: plainTextDesc,
          images: [
            {
              url: data?.thumbnailUrl || "/api/og",
              width: 1200,
              height: 630,
            }
          ],
        },
        twitter: {
          card: "summary_large_image",
          title: data?.judul,
          description: plainTextDesc,
          images: [data?.thumbnailUrl || "https://ikadiy.uii.ac.id/api/og"],
        }
      };
    }
  } catch (error) {
    console.error("Error generating metadata for masterclass:", error);
  }

  return {
    title: "Masterclass | DPW IKA UII DIY",
  };
}

export default function Page() {
  return <MasterclassContent />;
}
