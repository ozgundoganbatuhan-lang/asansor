import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg,#1e3a8a 0%,#3b82f6 100%)",
          borderRadius: 110,
        }}
      >
        {/* Asansör şaft logosu — Landing ile birebir aynı */}
        <svg width="400" height="400" viewBox="0 0 36 36" fill="none">
          {/* Sol ray */}
          <rect x="9" y="5" width="2.2" height="26" rx="1.1" fill="white" fillOpacity="0.3" />
          {/* Sağ ray */}
          <rect x="24.8" y="5" width="2.2" height="26" rx="1.1" fill="white" fillOpacity="0.3" />
          {/* Kabin */}
          <rect x="11.2" y="13.5" width="13.6" height="9" rx="2.5" fill="white" />
          {/* Üst ok */}
          <path d="M18 7L15.2 11H20.8L18 7Z" fill="white" fillOpacity="0.55" />
          {/* Alt ok */}
          <path d="M18 29L15.2 25H20.8L18 29Z" fill="white" fillOpacity="0.55" />
          {/* "S" harfi */}
          <path
            d="M15 16.2C15.3 15.3 16.2 15 18 15C19.8 15 21 15.8 21 16.7C21 17.5 20.1 18 18 18C15.9 18 15 18.5 15 19.5C15 20.5 16.2 21 18 21C19.8 21 21 20.2 21 20.2"
            stroke="#2563eb"
            strokeWidth="1.3"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </div>
    ),
    size,
  );
}
