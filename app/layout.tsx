import type { Metadata } from "next";
import NextTopLoader from "nextjs-toploader";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ClientReCaptchaProvider from "./ClientReCaptchaProvider";
import ConsoleGuard from "@/components/layout/ConsoleGuard";
import FeedbackWidget from "@/components/FeedbackWidget";
import CookieBanner from "@/components/CookieBanner";
import SessionGuard from "@/components/SessionGuard";
import ToastContainer from "@/components/ui/Toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title:
    "Portal Layanan Terpadu DPW IKA UII DIY | Informasi Alumni UII Yogyakarta",
  description:
    "Sistem informasi manajemen terpadu DPW IKA UII DIY. Akses pendaftaran event, direktori bisnis, informasi keanggotaan, dan agenda kegiatan keluarga besar alumni UII Yogyakarta.",

  // Pastikan domainnya sesuai URL asli website Anda
  metadataBase: new URL("https://ikadiy.uii.ac.id"),

  // Google Search Console Verification
  verification: {
    google: "0vgyuL9moJOe6blAdN_VIZqeC2nTywQDnON9kauFAyA",
  },

  openGraph: {
    title:
      "Portal Layanan Terpadu DPW IKA UII DIY | Informasi Alumni UII Yogyakarta",
    description:
      "Sistem informasi manajemen terpadu DPW IKA UII DIY. Akses pendaftaran event, direktori bisnis, informasi keanggotaan, dan agenda kegiatan keluarga besar alumni UII Yogyakarta.",
    url: "https://ikadiy.uii.ac.id",
    siteName: "DPW IKA UII DIY",
    images: [
      {
        // Pastikan API OG sudah di-deploy/live
        url: "/api/og",
        width: 1200,
        height: 630,
        alt: "Portal Layanan DPW IKA UII DIY",
      },
    ],
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Portal Layanan Terpadu DPW IKA UII DIY",
    description:
      "Sistem informasi manajemen terpadu DPW IKA UII DIY. Pusat layanan alumni, event, dan direktori.",
    images: ["https://ikadiy.uii.ac.id/api/og"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="scroll-smooth" data-scroll-behavior="smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NextTopLoader
          color="#FCD116"
          initialPosition={0.08}
          crawlSpeed={200}
          height={3}
          crawl={true}
          showSpinner={false}
          easing="ease"
          speed={200}
          shadow="0 0 10px #FCD116, 0 0 5px #FCD116"
        />

        <ConsoleGuard />

        <ClientReCaptchaProvider>
          <SessionGuard>{children}</SessionGuard>

          <FeedbackWidget />
          <CookieBanner />
          <ToastContainer />
        </ClientReCaptchaProvider>
      </body>
    </html>
  );
}
