"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Card, Input, Select, Pill } from "@/components/ui";

type Customer = { id: string; name: string };
type Asset = {
  id: string;
  name: string;
  category?: string | null;
  serialNumber?: string | null;
  locationNote?: string | null;
  buildingName?: string | null;
  doorNumber?: string | null;
  stops?: number | null;
  capacityKg?: number | null;
  controllerBrand?: string | null;
  riskScore?: number | null;
  lastMaintenanceAt?: string | null;
  lastInspectionAt?: string | null;
  customer: Customer;
};

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [q, setQ] = useState("");

  const [form, setForm] = useState({
    customerId: "",
    name: "",
    category: "",
    serialNumber: "",
    locationNote: "",
    buildingName: "",
    doorNumber: "",
    stops: "",
    capacityKg: "",
    controllerBrand: "",
    riskScore: "",
  });
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    const [a, c] = await Promise.all([
      fetch("/api/assets").then((r) => r.json()),
      fetch("/api/customers").then((r) => r.json()),
    ]);
    setAssets(a.items ?? []);
    setCustomers(c.items ?? []);
    if (!form.customerId && (c.items?.[0]?.id as string | undefined)) {
      setForm((f) => ({ ...f, customerId: c.items[0].id }));
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return assets;
    return assets.filter((a) =>
      [a.name, a.category ?? "", a.serialNumber ?? "", a.customer?.name ?? ""].join(" ").toLowerCase().includes(s)
    );
  }, [assets, q]);

  async function createAsset() {
    setErr(null);
    setSaving(true);
    const res = await fetch("/api/assets", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        customerId: form.customerId,
        name: form.name,
        category: form.category || undefined,
        serialNumber: form.serialNumber || undefined,
        locationNote: form.locationNote || undefined,
        buildingName: form.buildingName || undefined,
        doorNumber: form.doorNumber || undefined,
        stops: form.stops || undefined,
        capacityKg: form.capacityKg || undefined,
        controllerBrand: form.controllerBrand || undefined,
        riskScore: form.riskScore || undefined,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setErr(data.error ?? "Hata");
      return;
    }
    setForm((f) => ({ ...f, name: "", category: "", serialNumber: "", locationNote: "" }));
    await load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight">Asansör Envanteri</h1>
          <p className="text-sm text-gray-500">Bina bazlı cihaz kayıtları, risk ve bakım bilgileri</p>
        </div>
      </div>

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <div className="md:col-span-2">
            <Select label="Müşteri" value={form.customerId} onChange={(e) => setForm((f) => ({ ...f, customerId: e.target.value }))}>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="md:col-span-2">
            <Input label="Asansör adı" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="A Blok Ana Asansör" />
          </div>
          <Input label="Bina" value={form.buildingName} onChange={(e) => setForm((f) => ({ ...f, buildingName: e.target.value }))} placeholder="Site / Apartman adı" />
          <Input label="Kapı No" value={form.doorNumber} onChange={(e) => setForm((f) => ({ ...f, doorNumber: e.target.value }))} placeholder="12A" />
          <Input label="Durak" value={form.stops} onChange={(e) => setForm((f) => ({ ...f, stops: e.target.value }))} placeholder="8" />
          <Input label="Kapasite (kg)" value={form.capacityKg} onChange={(e) => setForm((f) => ({ ...f, capacityKg: e.target.value }))} placeholder="630" />
          <div className="md:col-span-3">
            <Input label="Kontrol Ünitesi" value={form.controllerBrand} onChange={(e) => setForm((f) => ({ ...f, controllerBrand: e.target.value }))} placeholder="Arkel / Fermator / ..." />
          </div>
          <Input label="Seri No" value={form.serialNumber} onChange={(e) => setForm((f) => ({ ...f, serialNumber: e.target.value }))} placeholder="SN-..." />
          <Input label="Risk (0-100)" value={form.riskScore} onChange={(e) => setForm((f) => ({ ...f, riskScore: e.target.value }))} placeholder="20" />
          <div className="md:col-span-6">
            <Input label="Konum notu" value={form.locationNote} onChange={(e) => setForm((f) => ({ ...f, locationNote: e.target.value }))} placeholder="Makine dairesi, anahtar, bina girişi, iletişim notları..." />
          </div>
          <div className="flex items-end">
            <Button onClick={createAsset} disabled={saving || !form.customerId || form.name.trim().length < 2}>
              Ekle
            </Button>
          </div>
        </div>
        {err && <div className="mt-3 text-sm text-red-600">{err}</div>}
      </Card>

      <Card>
        <div className="flex items-center justify-between gap-3">
          <Input label="Ara" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cihaz / müşteri / seri no" />
          <Pill tone="gray">{filtered.length} kayıt</Pill>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="py-2">Cihaz</th>
                <th className="py-2">Müşteri</th>
                <th className="py-2">Bina</th>
                <th className="py-2">Durak</th>
                <th className="py-2">Risk</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id} className="border-t">
                  <td className="py-2 font-semibold">{a.name}</td>
                  <td className="py-2">{a.customer?.name}</td>
                  <td className="py-2 text-gray-700">{a.buildingName ?? "—"}</td>
                  <td className="py-2 text-gray-700">{a.stops ?? "—"}</td>
                  <td className="py-2"><Pill tone={(a.riskScore ?? 0) >= 70 ? "red" : (a.riskScore ?? 0) >= 40 ? "amber" : "green"}>{a.riskScore ?? 0}</Pill></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
