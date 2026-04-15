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
          background: "linear-gradient(135deg, #1456f0 0%, #57a6ff 100%)",
          borderRadius: 110,
          color: "white",
          fontSize: 230,
          fontWeight: 900,
        }}
      >
        S
      </div>
    ),
    size,
  );
}
