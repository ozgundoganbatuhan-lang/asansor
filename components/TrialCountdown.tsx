"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function TrialCountdown() {
  const [data, setData] = useState<{ trialEndsAt?: string; plan?: string } | null>(null);

  useEffect(() => {
    fetch("/api/me").then(r => r.ok ? r.json() : null).then(d => {
      if (d?.org) setData({ trialEndsAt: d.org.trialEndsAt, plan: d.org.plan });
    }).catch(() => {});
  }, []);

  if (!data?.trialEndsAt || data.plan !== "FREE") return null;
  const days = Math.max(0, Math.ceil((new Date(data.trialEndsAt).getTime() - Date.now()) / 86400000));
  if (days > 14) return null;

  return (
    <div className="trial-bar">
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 14 }}>{days <= 3 ? "⚡" : "📅"}</span>
        <span style={{ fontSize: 13, fontWeight: 600 }}>
          {days === 0 ? "Deneme süreniz bugün bitiyor." : `Deneme sürenizde ${days} gün kaldı.`}
        </span>
        <span style={{ fontSize: 12, opacity: 0.6 }}>Tüm özellikler aktif.</span>
      </div>
      <Link href="/app/upgrade" style={{
        background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)",
        color: "#fff", fontSize: 12, fontWeight: 700,
        padding: "5px 14px", borderRadius: 999, textDecoration: "none",
        flexShrink: 0, whiteSpace: "nowrap",
      }}>
        Planı yükselt →
      </Link>
    </div>
  );
}
