"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, Pill } from "@/components/ui";

type WorkOrder = {
  id: string;
  code: string;
  status: string;
  type: string;
  scheduledAt?: string | null;
  customer: { name: string };
  technician?: { name: string; initials?: string | null } | null;
  asset?: { name: string } | null;
};

const statusTone = (s: string) => {
  if (s === "URGENT") return "red";
  if (s === "IN_PROGRESS") return "amber";
  if (s === "DONE") return "green";
  return "gray";
};

export default function CalendarPage() {
  const [items, setItems] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const r = await fetch("/api/work-orders");
    const j = await r.json();
    setItems((j.items ?? []).filter((x: WorkOrder) => x.scheduledAt));
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const upcoming = useMemo(() => {
    const now = Date.now();
    return [...items]
      .sort((a, b) => new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime())
      .filter((x) => new Date(x.scheduledAt!).getTime() >= now - 1000 * 60 * 60 * 24);
  }, [items]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight">Takvim</h1>
        <p className="text-sm text-gray-500">Planlanan iş emirleri (MVP takvim görünümü). Gerçek takvim (drag-drop, haftalık/aylık) sonraki iterasyonda.</p>
      </div>

      <Card>
        {loading ? (
          <div className="text-sm text-gray-500">Yükleniyor…</div>
        ) : upcoming.length === 0 ? (
          <div className="text-sm text-gray-500">Planlanan iş emri bulunamadı.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="py-2">Zaman</th>
                  <th className="py-2">İş Emri</th>
                  <th className="py-2">Müşteri</th>
                  <th className="py-2">Cihaz</th>
                  <th className="py-2">Teknisyen</th>
                  <th className="py-2">Durum</th>
                </tr>
              </thead>
              <tbody>
                {upcoming.map((x) => (
                  <tr key={x.id} className="border-t">
                    <td className="py-2 pr-4 font-mono text-xs">
                      {new Date(x.scheduledAt!).toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short" })}
                    </td>
                    <td className="py-2 pr-4 font-semibold">{x.code}</td>
                    <td className="py-2 pr-4">{x.customer?.name}</td>
                    <td className="py-2 pr-4">{x.asset?.name ?? "—"}</td>
                    <td className="py-2 pr-4">{x.technician?.name ?? "—"}</td>
                    <td className="py-2">
                      <Pill tone={statusTone(x.status) as any}>{x.status}</Pill>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
