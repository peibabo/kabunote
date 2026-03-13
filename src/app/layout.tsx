import type { Metadata } from "next";
import { Geist, Geist_Mono, M_PLUS_1p } from "next/font/google";
import "./globals.css";
import ToastContainer from "@/components/ToastContainer";
import CookieConsentBanner from "@/components/CookieConsentBanner";
import GoogleAnalyticsWrapper from "@/components/GoogleAnalyticsWrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const mPlus1p = M_PLUS_1p({
  weight: "100",
  subsets: ["latin"],
  variable: "--font-mplus1p",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://kabunote.jp"),
  title: "カブノオト - 投資家の思考を整理するダッシュボード",
  description: "日本株の投資情報と投資メモを一元管理。思考の整理で賢い投資判断を。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${mPlus1p.variable} antialiased bg-gray-900 text-white`}
      >
        {children}
        <CookieConsentBanner />
        <ToastContainer />
      </body>
      {process.env.NEXT_PUBLIC_GA_ID && (
        <GoogleAnalyticsWrapper gaId={process.env.NEXT_PUBLIC_GA_ID} />
      )}
    </html>
  );
}
