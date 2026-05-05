"use client";

/**
 * PlaceAutocomplete
 * Google Places Autocomplete input — türkiye odaklı
 *
 * Kullanım:
 *   <PlaceAutocomplete
 *     value={address}
 *     onChange={(addr, lat, lng) => { setAddress(addr); setLat(lat); setLng(lng); }}
 *     placeholder="Adres girin..."
 *   />
 *
 * Ortam değişkeni: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
 */

import { useEffect, useRef, useState } from "react";
import Script from "next/script";

type Props = {
  value: string;
  onChange: (address: string, lat?: number, lng?: number) => void;
  placeholder?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
};

declare global {
  interface Window {
    google: any;
    initGooglePlaces?: () => void;
  }
}

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

export function PlaceAutocomplete({ value, onChange, placeholder = "Adres girin...", style, disabled }: Props) {
  const inputRef   = useRef<HTMLInputElement>(null);
  const acRef      = useRef<any>(null);
  const [ready, setReady] = useState(false);

  // When Google script loads, init autocomplete
  function initAutocomplete() {
    if (!inputRef.current || !window.google?.maps?.places) return;
    if (acRef.current) return; // already initialized

    const ac = new window.google.maps.places.Autocomplete(inputRef.current, {
      types: ["address"],
      componentRestrictions: { country: "tr" }, // Turkey only
      fields: ["formatted_address", "geometry", "name", "address_components"],
    });

    ac.addListener("place_changed", () => {
      const place = ac.getPlace();
      if (!place) return;

      const formattedAddr = place.formatted_address ?? place.name ?? "";
      const lat = place.geometry?.location?.lat?.() ?? undefined;
      const lng = place.geometry?.location?.lng?.() ?? undefined;
      onChange(formattedAddr, lat, lng);
    });

    acRef.current = ac;
    setReady(true);
  }

  useEffect(() => {
    // If Google was already loaded before this component mounted
    if (window.google?.maps?.places) {
      initAutocomplete();
    }
  }, []);

  const baseStyle: React.CSSProperties = {
    width: "100%",
    padding: "9px 36px 9px 12px",
    border: "1.5px solid #e5e7eb",
    borderRadius: 9,
    fontSize: 13,
    fontFamily: "inherit",
    outline: "none",
    background: "#fff",
    color: "#111827",
    boxSizing: "border-box",
    ...style,
  };

  return (
    <>
      {API_KEY && (
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=places&language=tr&region=TR`}
          strategy="lazyOnload"
          onLoad={initAutocomplete}
        />
      )}
      <div style={{ position: "relative" }}>
        <input
          ref={inputRef}
          type="text"
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          style={baseStyle}
          onChange={e => onChange(e.target.value)} // allow manual typing too
          autoComplete="off"
        />
        {/* Map pin icon inside input */}
        <div style={{
          position: "absolute", right: 10, top: "50%",
          transform: "translateY(-50%)",
          fontSize: 16, pointerEvents: "none",
          color: ready ? "#2563eb" : "#9ca3af",
        }}>
          📍
        </div>
      </div>
      {!API_KEY && (
        <div style={{ fontSize: 11, color: "#f59e0b", marginTop: 4 }}>
          ⚠️ NEXT_PUBLIC_GOOGLE_MAPS_API_KEY tanımlı değil — manuel adres girişi aktif
        </div>
      )}
    </>
  );
}
