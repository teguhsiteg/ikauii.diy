"use client";

import { AppProgressBar as ProgressBar } from "next-nprogress-bar";

export default function ProgressBarProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ProgressBar
        height="4px"
        color="#EAB308" // Warna Kuning Emas UII
        options={{ showSpinner: false }}
        shallowRouting
      />
      {children}
    </>
  );
}
