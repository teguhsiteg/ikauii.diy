import CetakClient from "./CetakClient";

export const dynamic = "force-dynamic";

// 1. Tambahkan "async" dan ubah tipe params menjadi Promise
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  
  // 2. Buka/tunggu params-nya menggunakan "await"
  const resolvedParams = await params;
  
  // 3. Baru lempar ID-nya ke CetakClient
  return <CetakClient id={resolvedParams.id} />;
}