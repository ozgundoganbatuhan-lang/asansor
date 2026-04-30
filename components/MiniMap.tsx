"use client";

import React from "react";
import { MapsDestination } from "@/lib/maps";

/**
 * Küçük harita bileşeni.
 * Google Maps yer/directions embed API ile bir iframe gösterir.
 * Bu bileşen, rota planlama özelliğini görselleştirmek için kullanılabilir.
 */
export default function MiniMap({ destination }: { destination: MapsDestination }) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  // Eğer API anahtarı yoksa harita gösterilmesin
  if (!apiKey) {
    return (
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
        Harita görüntülenemiyor. Lütfen <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code>
        konfigurasyonunu ekleyin.
      </div>
    );
  }
  const { address, latitude, longitude, label } = destination;
  // Hedefi belirle
  const query = latitude && longitude ? `${latitude},${longitude}` : encodeURIComponent(address || label || "");
  // Harita türü: yer arama veya rota
  const src = `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${query}`;
  return (
    <iframe
      title="Mini Map"
      width="100%"
      height="260"
      style={{ border: 0, borderRadius: "12px" }}
      loading="lazy"
      allowFullScreen
      src={src}
    />
  );
}