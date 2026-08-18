import { Suspense } from "react";
import PelantikanClient from "./PelantikanClient";

export default function PelantikanPage() {
  return (
    <Suspense fallback={<div className="w-full min-h-screen bg-slate-950" />}>
      <PelantikanClient />
    </Suspense>
  );
}
