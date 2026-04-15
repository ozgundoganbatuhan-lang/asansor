"use client";
import { useEffect, useState } from "react";

export default function RoleBadge() {
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/me").then(r => r.ok ? r.json() : null).then(d => {
      if (d?.role) setRole(d.role);
    }).catch(() => {});
  }, []);

  if (!role) return null;

  const labels: Record<string, string> = { OWNER: "Sahip", MANAGER: "Yönetici", TECHNICIAN: "Teknisyen", OFFICE: "Ofis" };
  const label = labels[role] ?? role;

  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      fontSize: 10, fontWeight: 700,
      padding: "3px 8px", borderRadius: 999,
      background: role === "TECHNICIAN" ? "#fffbeb" : "#eff6ff",
      color: role === "TECHNICIAN" ? "#92400e" : "#1d4ed8",
      border: `1px solid ${role === "TECHNICIAN" ? "#fde68a" : "#bfdbfe"}`,
    }}>
      {label}
    </span>
  );
}
