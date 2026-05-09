"use client";
import { useEffect, useState } from "react";

export default function RoleBadge() {
  const [role, setRole] = useState<string | null>(null);
  useEffect(() => {
    fetch("/api/me").then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.role) setRole(d.role); }).catch(() => {});
  }, []);
  if (!role) return null;
  const labels: Record<string, string> = { OWNER: "Sahip", MANAGER: "Yönetici", TECHNICIAN: "Teknisyen", OFFICE: "Ofis" };
  const label = labels[role] ?? role;
  const isTech = role === "TECHNICIAN";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      fontSize: 10, fontWeight: 700,
      padding: "3px 8px", borderRadius: 999,
      background: isTech ? "#FFF3DC" : "#E4EFF9",
      color: isTech ? "#92400e" : "#0F121A",
      border: `1px solid ${isTech ? "#fde68a" : "#90BEE0"}`,
    }}>
      {label}
    </span>
  );
}
