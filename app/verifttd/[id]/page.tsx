import VerifContent from "./VerifContent";

export const dynamic = "force-dynamic";

export default async function VerifPage({ params }: { params: Promise<{ id: string }> }) {
  // Buka gembok params dengan await (Wajib di Next.js 15+)
  const resolvedParams = await params;
  
  // Lempar ID yang sudah bersih ke VerifContent
  return <VerifContent id={resolvedParams.id} />;
}