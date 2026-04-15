"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Card, Input, Pill } from "@/components/ui";

type Part = {
  id: string;
  name: string;
  category?: string | null;
  unit?: string | null;
  supplier?: string | null;
  price?: number | null;
  stock: number;
  minStock: number;
};

export default function StockPage() {
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [unit, setUnit] = useState("");
  const [supplier, setSupplier] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("0");
  const [minStock, setMinStock] = useState("0");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/parts");
    const data = await res.json();
    setParts(data.items ?? []);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return parts;
    return parts.filter((p) => (p.name + " " + (p.category ?? "") + " " + (p.supplier ?? "")).toLowerCase().includes(s));
  }, [parts, q]);

  async function addPart() {
    setErr(null);
    setSaving(true);
    const res = await fetch("/api/parts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        category: category || undefined,
        unit: unit || undefined,
        supplier: supplier || undefined,
        price: price ? parseInt(price, 10) : undefined,
        stock: parseInt(stock || "0", 10),
        minStock: parseInt(minStock || "0", 10),
      }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setErr(d.error || "Kayıt başarısız");
      setSaving(false);
      return;
    }
    setName("");
    setCategory("");
    setUnit("");
    setSupplier("");
    setPrice("");
    setStock("0");
    setMinStock("0");
    await load();
    setSaving(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Stok</h1>
          <p className="text-sm text-gray-600">Parçalar, minimum stok uyarıları ve fiyatlar.</p>
        </div>
        <div className="w-full max-w-sm">
          <Input placeholder="Ara (parça / kategori / tedarikçi)" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      <Card>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Input label="Parça Adı" value={name} onChange={(e) => setName(e.target.value)} placeholder="Kapı sensörü" />
          <Input label="Kategori" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Elektronik" />
          <Input label="Birim" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="Adet" />
          <Input label="Tedarikçi" value={supplier} onChange={(e) => setSupplier(e.target.value)} placeholder="Lift Parts" />
          <Input label="Fiyat (tam sayı)" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="850" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Stok" value={stock} onChange={(e) => setStock(e.target.value)} />
            <Input label="Min Stok" value={minStock} onChange={(e) => setMinStock(e.target.value)} />
          </div>
        </div>
        {err && <div className="mt-3 text-sm text-red-600">{err}</div>}
        <div className="mt-4">
          <Button onClick={addPart} disabled={saving || name.trim().length < 2}>
            {saving ? "Kaydediliyor…" : "Parça Ekle"}
          </Button>
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-mono uppercase text-gray-400">
                <th className="py-2">Parça</th>
                <th className="py-2">Kategori</th>
                <th className="py-2">Stok</th>
                <th className="py-2">Min</th>
                <th className="py-2">Fiyat</th>
                <th className="py-2">Tedarikçi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td className="py-6 text-gray-500" colSpan={6}>Yükleniyor…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td className="py-6 text-gray-500" colSpan={6}>Kayıt yok.</td></tr>
              ) : (
                filtered.map((p) => {
                  const low = p.stock < p.minStock;
                  return (
                    <tr key={p.id} className="border-t">
                      <td className="py-3 font-semibold text-gray-900">{p.name}</td>
                      <td className="py-3 text-gray-700">{p.category ?? "—"}</td>
                      <td className="py-3">{low ? <Pill tone="red">{p.stock}</Pill> : <Pill tone="green">{p.stock}</Pill>}</td>
                      <td className="py-3 text-gray-700">{p.minStock}</td>
                      <td className="py-3 text-gray-700">{p.price ?? "—"}</td>
                      <td className="py-3 text-gray-700">{p.supplier ?? "—"}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
