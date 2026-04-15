"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Card, Input, Pill } from "@/components/ui";

type Technician = {
  id: string;
  name: string;
  initials?: string | null;
  phone?: string | null;
  zone?: string | null;
  certification?: string | null;
  status?: string | null;
  createdAt: string;
};

export default function TechniciansPage() {
  const [items, setItems] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [form, setForm] = useState({ name: "", initials: "", phone: "", zone: "", certification: "", status: "Müsait" });
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/technicians", { cache: "no-store" });
    const json = await res.json();
    setItems(json.items ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((t) => [t.name, t.initials, t.phone, t.zone, t.certification, t.status].filter(Boolean).join(" ").toLowerCase().includes(s));
  }, [items, q]);

  async function create() {
    setError(null);
    const res = await fetch("/api/technicians", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        initials: form.initials || undefined,
        phone: form.phone || undefined,
        zone: form.zone || undefined,
        certification: form.certification || undefined,
        status: form.status || undefined,
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? "Hata");
      return;
    }
    setForm({ name: "", initials: "", phone: "", zone: "", certification: "", status: "Müsait" });
    await load();
  }

  const tone = (s?: string | null) => {
    const v = (s ?? "").toLowerCase();
    if (v.includes("saha")) return "amber" as const;
    if (v.includes("müsait") || v.includes("musait")) return "green" as const;
    if (v.includes("ofis")) return "gray" as const;
    return "blue" as const;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Teknisyenler</h1>
          <p className="text-sm text-gray-500">Atama, bölge ve sertifika bilgileri</p>
        </div>
        <Input placeholder="Ara (isim, bölge, tel...)" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <Input label="Ad Soyad" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Kısa" value={form.initials} onChange={(e) => setForm({ ...form, initials: e.target.value })} />
          <Input label="Telefon" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Input label="Bölge" value={form.zone} onChange={(e) => setForm({ ...form, zone: e.target.value })} />
          <Input label="Sertifika" value={form.certification} onChange={(e) => setForm({ ...form, certification: e.target.value })} />
          <Input label="Durum" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} />
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div className="text-sm text-red-600">{error ?? ""}</div>
          <Button onClick={create} disabled={!form.name.trim()}>Teknisyen Ekle</Button>
        </div>
      </Card>

      <div className="rounded-xl border bg-white overflow-hidden">
        <div className="px-4 py-3 border-b text-sm text-gray-500 flex items-center justify-between">
          <div>{loading ? "Yükleniyor..." : `${filtered.length} teknisyen`}</div>
          <Button variant="ghost" onClick={load}>Yenile</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-4 py-2">Teknisyen</th>
                <th className="text-left px-4 py-2">Telefon</th>
                <th className="text-left px-4 py-2">Bölge</th>
                <th className="text-left px-4 py-2">Sertifika</th>
                <th className="text-left px-4 py-2">Durum</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2 font-semibold">{t.name} <span className="text-xs text-gray-400 font-mono">{t.initials ? `(${t.initials})` : ""}</span></td>
                  <td className="px-4 py-2">{t.phone ?? "—"}</td>
                  <td className="px-4 py-2">{t.zone ?? "—"}</td>
                  <td className="px-4 py-2">{t.certification ?? "—"}</td>
                  <td className="px-4 py-2"><Pill tone={tone(t.status)}>{t.status ?? "—"}</Pill></td>
                </tr>
              ))}
              {!filtered.length && (
                <tr><td className="px-4 py-6 text-gray-500" colSpan={5}>Kayıt yok.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
