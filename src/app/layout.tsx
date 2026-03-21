import type { Metadata } from "next";
import { Geist, Geist_Mono, M_PLUS_1p } from "next/font/google";
import "./globals.css";
import ToastContainer from "@/components/layout/ToastContainer";
import CookieConsentBanner from "@/components/layout/CookieConsentBanner";
import GoogleAnalyticsWrapper from "@/components/layout/GoogleAnalyticsWrapper";

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
  title: {
    template: "%s | カブノオト",
    default: "カブノオト - 投資家の思考を整理するダッシュボード",
  },
  description: "日本株の投資情報と投資メモを一元管理。思考の整理で賢い投資判断を。",
  alternates: {
    canonical: "https://kabunote.jp",
  },
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "カブノオト",
              url: "https://kabunote.jp",
              logo: "https://kabunote.jp/kabunote-logo.png",
              contactPoint: {
                "@type": "ContactPoint",
                email: "support@kabunote.jp",
                contactType: "customer support",
                availableLanguage: "Japanese",
              },
            }),
          }}
        />
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
