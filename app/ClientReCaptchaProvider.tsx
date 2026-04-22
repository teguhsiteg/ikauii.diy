"use client";

import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3";

export default function ClientReCaptchaProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Ambil Site Key dari Environment
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

  if (!siteKey) {
    console.error("Missing NEXT_PUBLIC_RECAPTCHA_SITE_KEY");
    return <>{children}</>; // Fallback kalau key belum dipasang
  }

  return (
    <GoogleReCaptchaProvider
      reCaptchaKey={siteKey}
      scriptProps={{
        async: true,
        defer: true,
        appendTo: "head",
        nonce: undefined,
      }}
    >
      {children}
    </GoogleReCaptchaProvider>
  );
}
