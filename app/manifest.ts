import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Servisim — Asansör Servis Yönetimi",
    short_name: "Servisim",
    description: "Asansör servis firmaları için mobil ekip yönetimi, iş emri ve saha operasyon platformu.",
    start_url: "/app/dashboard",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#2563eb",
    orientation: "portrait",
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png" },
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/icon", sizes: "192x192", type: "image/png" },
    ],
  };
}
