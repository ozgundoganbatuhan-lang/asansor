"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Card, Pill } from "@/components/ui";

type Entitlements = { canExport: boolean; isExpired: boolean; trialEndsAt: string; planTier: string };

type WorkOrder = { id: string; status: string; type: string; createdAt: string; completedAt?: string | null; laborCost: number; serviceFee: number; partsUsed: { quantity: number; part: { price?: number | null } }[] };
type Invoice = { id: string; status: string; total: number; issuedAt: string; paidAt?: string | null };

function downloadCSV(filename: string, rows: Record<string, any>[]) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const escape = (v: any) => `"${String(v ?? "").replaceAll('"', '""')}"`;
  const csv = [headers.join(","), ...rows.map(r => headers.map(h => escape(r[h])).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [ent, setEnt] = useState<Entitlements | null>(null);

  async function load() {
    setErr(null);
    const [woRes, invRes, entRes] = await Promise.all([fetch("/api/work-orders"), fetch("/api/invoices"), fetch("/api/entitlements")]);
    const woJson = await woRes.json();
    const invJson = await invRes.json();
    const entJson = await entRes.json();
    if (!woRes.ok) return setErr(woJson.error ?? "İş emirleri alınamadı");
    if (!invRes.ok) return setErr(invJson.error ?? "Faturalar alınamadı");
    if (entRes.ok) setEnt(entJson.ent);
    setWorkOrders(woJson.items ?? []);
    setInvoices(invJson.items ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  const kpis = useMemo(() => {
    const totalWO = workOrders.length;
    const doneWO = workOrders.filter(w => w.status === "DONE").length;
    const urgentWO = workOrders.filter(w => w.status === "URGENT").length;
    const partsTotal = workOrders.reduce((acc, w) => acc + w.partsUsed.reduce((a, p) => a + (p.part.price ?? 0) * p.quantity, 0), 0);
    const laborTotal = workOrders.reduce((acc, w) => acc + (w.laborCost ?? 0) + (w.serviceFee ?? 0), 0);

    const totalInvoiced = invoices.reduce((acc, i) => acc + (i.total ?? 0), 0);
    const paid = invoices.filter(i => i.status === "PAID");
    const paidTotal = paid.reduce((acc, i) => acc + (i.total ?? 0), 0);
    const openTotal = totalInvoiced - paidTotal;
    return { totalWO, doneWO, urgentWO, partsTotal, laborTotal, totalInvoiced, paidTotal, openTotal };
  }, [workOrders, invoices]);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight">Raporlar</h1>
          <p className="text-sm text-gray-500">Operasyon & finans özetleri (CSV export dahil).</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={load}>Yenile</Button>
          <Button
            variant="muted"
            onClick={() =>
              downloadCSV("work-orders.csv", workOrders.map((w) => ({
                id: w.id,
                status: w.status,
                type: w.type,
                createdAt: w.createdAt,
                completedAt: w.completedAt ?? "",
                laborCost: w.laborCost,
                serviceFee: w.serviceFee,
              })))
            }
          >
            İş Emirleri CSV
          </Button>
          <Button
            variant="muted"
            onClick={() => downloadCSV("invoices.csv", invoices.map((i) => ({
              id: i.id,
              status: i.status,
              total: i.total,
              issuedAt: i.issuedAt,
              paidAt: i.paidAt ?? "",
            })))}
          >
            Faturalar CSV
          </Button>
        </div>
      </div>

      {err && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{err}</div>}

      <div className="grid gap-3 md:grid-cols-4">
        <Card>
          <div className="text-xs font-mono uppercase text-gray-400">İş emri</div>
          <div className="mt-1 text-2xl font-extrabold">{kpis.totalWO}</div>
          <div className="mt-2 flex gap-2">
            <Pill tone="green">Done: {kpis.doneWO}</Pill>
            <Pill tone="red">Urgent: {kpis.urgentWO}</Pill>
          </div>
        </Card>
        <Card>
          <div className="text-xs font-mono uppercase text-gray-400">Parça maliyeti</div>
          <div className="mt-1 text-2xl font-extrabold">₺{kpis.partsTotal}</div>
          <div className="mt-2 text-sm text-gray-500">(fiyat alanı girilen parçalar üzerinden)</div>
        </Card>
        <Card>
          <div className="text-xs font-mono uppercase text-gray-400">İşçilik + servis</div>
          <div className="mt-1 text-2xl font-extrabold">₺{kpis.laborTotal}</div>
          <div className="mt-2 text-sm text-gray-500">(work order alanlarından)</div>
        </Card>
        <Card>
          <div className="text-xs font-mono uppercase text-gray-400">Faturalama</div>
          <div className="mt-1 text-2xl font-extrabold">₺{kpis.totalInvoiced}</div>
          <div className="mt-2 flex gap-2">
            <Pill tone="green">Paid: ₺{kpis.paidTotal}</Pill>
            <Pill tone="amber">Open: ₺{kpis.openTotal}</Pill>
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold">Not</div>
            <div className="text-sm text-gray-500">Bu sayfa “ticari ürün” için temel raporlama çekirdeği. İstersen sonraki aşamada: KPI filtreleri, tarih aralığı, şube bazlı kırılım, teknisyen performansı ve SLA raporlarını ekleyecek şekilde genişletilir.</div>
          </div>
        </div>
      </Card>
    </div>
  );
}
