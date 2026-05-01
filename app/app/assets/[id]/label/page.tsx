import PrintButton from "@/components/PrintButton";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { signAssetShareToken } from "@/lib/asset-share";

import { headers } from "next/headers";

export default async function AssetLabelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const asset = await prisma.asset.findUnique({
    where: { id },
    include: { customer: true, organization: { select: { name: true } } },
  });
  if (!asset) notFound();
  const token = signAssetShareToken(asset.id, asset.organizationId);
  const hdrs = await headers();
  const host = hdrs.get("host") ?? "localhost:3000";
  const proto = process.env.NEXT_PUBLIC_SITE_URL?.startsWith("http") ? "" : (host.includes("localhost") ? "http" : "https");
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? `${proto}://${host}`;
  const publicUrl = `${siteUrl}/public/assets/${asset.id}?token=${token}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(publicUrl)}&margin=12`;
  const companyName = asset.organization?.name ?? process.env.NEXT_PUBLIC_COMPANY_NAME ?? "Servis Firması";

  return (
    <main style={{ maxWidth: 640, margin: "0 auto" }}>
      {/* Back link */}
      <Link href={`/app/assets/${asset.id}`}
        style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13,
          color: "#6b7280", fontWeight: 600, textDecoration: "none", marginBottom: 20 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15,18 9,12 15,6"/>
        </svg>
        Asansör detayına dön
      </Link>

      {/* Label card */}
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 20,
        padding: "36px 32px", textAlign: "center", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>

        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 24 }}>
          <div style={{ width: 32, height: 32, background: "linear-gradient(135deg,#2563eb,#1d4ed8)",
            borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, fontWeight: 800, color: "#fff" }}>S</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#111827", letterSpacing: "-0.03em" }}>Servisim</div>
        </div>

        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1.5px",
          textTransform: "uppercase", color: "#9ca3af", marginBottom: 8 }}>
          QR Asansör Etiketi
        </div>

        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.04em",
          color: "#111827", margin: "0 0 6px" }}>
          {asset.name}
        </h1>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#2563eb", marginBottom: 4 }}>{companyName}</div>
        <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 32 }}>
          {asset.customer.name}{asset.buildingName ? ` · ${asset.buildingName}` : ""}
        </div>

        {/* QR Code */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
          <div style={{ border: "1.5px solid #e5e7eb", borderRadius: 20,
            padding: "20px", background: "#fff", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
            <img src={qrUrl} alt="QR etiketi"
              style={{ width: 260, height: 260, borderRadius: 12, display: "block" }} />
          </div>
        </div>

        {asset.elevatorIdNo && (
          <div style={{ fontFamily: "monospace", fontSize: 13, color: "#6b7280",
            background: "#f9fafb", border: "1px solid #f3f4f6", borderRadius: 8,
            padding: "6px 16px", display: "inline-block", marginBottom: 20, letterSpacing: "0.5px" }}>
            {asset.elevatorIdNo}
          </div>
        )}

        {/* Info box */}
        <div style={{ background: "#f9fafb", border: "1px solid #f3f4f6", borderRadius: 12,
          padding: "14px 18px", textAlign: "left", marginBottom: 28 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Kullanım Talimatı</div>
          <div style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.7 }}>
            Bu etiketi asansörün kapısına, makine dairesi girişine veya teknik dolap kapağına yerleştirin.
            QR kodu okutulduğunda public servis geçmişi sayfası açılır.
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 10 }}>
          <PrintButton className="print-btn-dark" />
          <a href={publicUrl} target="_blank" rel="noreferrer"
            style={{ display: "inline-flex", alignItems: "center", gap: 6,
              background: "#2563eb", color: "#fff", fontSize: 13, fontWeight: 700,
              padding: "10px 20px", borderRadius: 9, textDecoration: "none" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15,3 21,3 21,9"/><line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
            Public sayfayı aç
          </a>
          <Link href={`/app/assets/${asset.id}`}
            style={{ display: "inline-flex", alignItems: "center", gap: 6,
              background: "#fff", color: "#374151", border: "1px solid #e5e7eb",
              fontSize: 13, fontWeight: 600, padding: "10px 20px",
              borderRadius: 9, textDecoration: "none" }}>
            Detaya dön
          </Link>
        </div>
      </div>
    </main>
  );
}
