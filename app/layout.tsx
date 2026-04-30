import type { Metadata, Viewport } from "next";
import "./globals.css";
import PWARegister from "@/components/PWARegister";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "Servisim — Asansör Servis Yönetimi",
    template: "%s | Servisim",
  },
  description:
    "Asansör servis firmaları için bakım planı, iş emri, QR etiket, teknisyen mobil akışı ve sözleşme yönetimi. 14 gün ücretsiz deneyin.",
  keywords: [
    "asansör servis yazılımı",
    "asansör bakım takibi",
    "asansör iş emri",
    "servis operasyon platformu",
  ],
  applicationName: "Servisim",
  icons: { icon: "/icon", apple: "/icon" },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&family=DM+Mono:wght@400;500&family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <PWARegister />
        {children}
      </body>
    </html>
  );
}
