"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Card, Input, Pill, Select } from "@/components/ui";

type WorkOrder = { id: string; code: string; customer: { name: string }; invoice?: { id: string } | null };
type Invoice = {
  id: string;
  number: string;
  status: string;
  issuedAt: string;
  dueAt?: string | null;
  paidAt?: string | null;
  currency: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  workOrder: { code: string; customer: { name: string } };
};

function money(n: number, currency: string) {
  try {
    return new Intl.NumberFormat("tr-TR", { style: "currency", currency, maximumFractionDigits: 0 }).format(n / 100);
  } catch {
    return `${currency} ${(n / 100).toFixed(2)}`;
  }
}

export default function InvoicesPage() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [items, setItems] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  const [workOrderId, setWorkOrderId] = useState("");
  const [taxRate, setTaxRate] = useState("2000"); // 20.00%
  const [dueAt, setDueAt] = useState("");

  async function load() {
    setLoading(true);
    const [inv, wo] = await Promise.all([
      fetch("/api/invoices").then((r) => r.json()),
      fetch("/api/work-orders").then((r) => r.json()),
    ]);
    setItems(inv.items ?? []);
    setWorkOrders((wo.items ?? []).filter((x: any) => !x.invoice));
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const kpis = useMemo(() => {
    const total = items.reduce((a, i) => a + (i.total || 0), 0);
    const paid = items.filter((i) => i.status === "PAID").reduce((a, i) => a + (i.total || 0), 0);
    return { total, paid };
  }, [items]);

  async function createInvoice(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/invoices", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ workOrderId, taxRate: parseInt(taxRate || "0", 10), dueAt: dueAt || undefined }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert(j.error || "Fatura oluşturulamadı");
      return;
    }
    setWorkOrderId("");
    await load();
  }

  async function setStatus(id: string, status: string) {
    const res = await fetch(`/api/invoices/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert(j.error || "Güncellenemedi");
      return;
    }
    await load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Faturalar</h1>
        <p className="text-sm text-gray-600">İş emrinden fatura üret, gönder, tahsil edildi olarak işaretle.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <div className="text-xs font-mono uppercase text-gray-400">Toplam fatura</div>
          <div className="mt-1 text-xl font-extrabold">{money(kpis.total, "TRY")}</div>
        </Card>
        <Card>
          <div className="text-xs font-mono uppercase text-gray-400">Tahsil edilen</div>
          <div className="mt-1 text-xl font-extrabold">{money(kpis.paid, "TRY")}</div>
        </Card>
      </div>

      <Card>
        <div className="mb-3 text-sm font-semibold">Yeni Fatura</div>
        <form onSubmit={createInvoice} className="grid gap-3 md:grid-cols-3">
          <label className="block">
            <div className="mb-1 text-xs font-mono uppercase text-gray-400">İş emri</div>
            <select value={workOrderId} onChange={(e) => setWorkOrderId(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm">
              <option value="">Seç…</option>
              {workOrders.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.code} — {w.customer?.name}
                </option>
              ))}
            </select>
          </label>
          <Input label="KDV oranı (x100)" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} placeholder="2000 = %20" />
          <Input label="Vade" type="date" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
          <div className="md:col-span-3">
            <Button disabled={!workOrderId}>Fatura oluştur</Button>
          </div>
        </form>
        <div className="mt-3 text-xs text-gray-500">
          Not: Bu sürümde PDF üretimi için altyapı hazır (invoice modeli + numara). Prod için PDF template + e-posta/SMS entegrasyonu eklenir.
        </div>
      </Card>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm font-semibold">Fatura listesi</div>
          {loading && <div className="text-xs text-gray-500">Yükleniyor…</div>}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase font-mono text-gray-400">
                <th className="py-2">No</th>
                <th>İş emri</th>
                <th>Müşteri</th>
                <th>Durum</th>
                <th className="text-right">Toplam</th>
                <th className="text-right">Aksiyon</th>
              </tr>
            </thead>
            <tbody>
              {items.map((i) => (
                <tr key={i.id} className="border-t">
                  <td className="py-2 font-mono">{i.number}</td>
                  <td className="font-mono">{i.workOrder.code}</td>
                  <td>{i.workOrder.customer.name}</td>
                  <td>
                    <Pill
                      tone={i.status === "PAID" ? "green" : i.status === "SENT" ? "blue" : i.status === "VOID" ? "red" : "gray"}
                    >
                      {i.status}
                    </Pill>
                  </td>
                  <td className="text-right font-semibold">{money(i.total, i.currency)}</td>
                  <td className="text-right">
                    <div className="inline-flex gap-2">
                      <Button variant="ghost" onClick={() => setStatus(i.id, "SENT")}>Gönderildi</Button>
                      <Button variant="muted" onClick={() => setStatus(i.id, "PAID")}>Ödendi</Button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && items.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-gray-500">Henüz fatura yok.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
