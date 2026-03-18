import BeritaContent from "./BeritaContent";

// 1. Wajib untuk mode SSR (Cloud Functions Firebase)
export const dynamic = "force-dynamic";

export default function Page() {
  return <BeritaContent />;
}
