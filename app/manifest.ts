import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Servisim",
    short_name: "Servisim",
    description: "Asansör servis firmaları için mobil ekip yönetimi, iş emri ve saha operasyon platformu.",
    start_url: "/app/dashboard",
    display: "standalone",
    background_color: "#f6f8fc",
    theme_color: "#1456f0",
    orientation: "portrait",
    icons: [
      { src: "/icon?size=192", sizes: "192x192", type: "image/png" },
      { src: "/icon?size=512", sizes: "512x512", type: "image/png" },
      { src: "/icon?size=512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
