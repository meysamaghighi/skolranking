import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://skolranking.com"),
  title: "Skolranking Sverige 2025 | Grundskolor & meritvärde",
  description:
    "Ranking av alla grundskolor i Sverige baserat på meritvärde. Interaktiv karta, sök och jämför. Data från Skolverket.",
  openGraph: {
    title: "Skolranking Sverige 2025",
    description: "Ranking av alla grundskolor i Sverige baserat på meritvärde. Data från Skolverket.",
    type: "website",
    siteName: "Skolranking",
  },
  other: {
    "google-adsense-account": "ca-pub-2621005924235240",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sv">
      <head>
        <Script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-DBZ8YKTG2M"
          strategy="beforeInteractive"
        />
        <Script id="gtag-init" strategy="beforeInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-DBZ8YKTG2M');
          `}
        </Script>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2621005924235240"
          crossOrigin="anonymous"
        />
      </body>
    </html>
  );
}
