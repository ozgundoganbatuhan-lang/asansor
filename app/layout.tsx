import "./globals.css";
import type { Metadata } from "next";
import { DM_Sans, DM_Mono } from "next/font/google";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-dm-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Asansör Servisim — Teknik Servis Yönetimi",
  description:
    "Aylık bakım, arıza, teknisyen ve parça süreçlerini kurumsal bir panelde yönetin. 30 gün ücretsiz deneme — kredi kartı gerekmez.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={`${dmSans.variable} ${dmMono.variable}`}>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}

