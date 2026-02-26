"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Card, Input, Select, Pill, Textarea } from "@/components/ui";

type WorkOrder = {
  id: string;
  code: string;
  type: string;
  status: string;
  priority: string | null;
  note: string | null;
  laborCost: number;
  serviceFee: number;
  scheduledAt: string | null;
  completedAt: string | null;
  createdAt: string;
  customer: { id: string; name: string; phone?: string | null };
  asset?: { id: string; name: string; buildingName?: string | null } | null;
  technician?: { id: string; name: string; phone?: string | null } | null;
  partsUsed: { id: string; quantity: number; part: { id: string; name: string; price?: number | null } }[];
  invoice?: { id: string; number: string; status: string } | null;
};

type Technician = { id: string; name: string };
type Asset = { id: string; name: string; buildingName?: string | null };
type Part = { id: string; name: string; price?: number | null };

const STATUS_OPTIONS = [
  { value: "PENDING", label: "Planlı", cls: "border-gray-200 bg-gray-50 text-gray-700" },
  { value: "IN_PROGRESS", label: "Devam Ediyor", cls: "border-amber-200 bg-amber-50 text-amber-700" },
  { value: "URGENT", label: "Acil", cls: "border-red-200 bg-red-50 text-red-700" },
  { value: "DONE", label: "Tamamlandı", cls: "border-green-200 bg-green-50 text-green-700" },
  { value: "CANCELED", label: "İptal", cls: "border-gray-200 bg-gray-50 text-gray-500" },
];

const TYPE_LABELS: Record<string, string> = {
  FAULT: "Arıza",
  PERIODIC_MAINTENANCE: "Periyodik Bakım",
  ANNUAL_INSPECTION: "Yıllık Muayene",
  REVISION: "Revizyon",
  INSTALLATION: "Kurulum",
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_OPTIONS.find((x) => x.value === status) ?? STATUS_OPTIONS[0];
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${s.cls}`}>
      {s.label}
    </span>
  );
}

function money(n: number) {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(n / 100);
}

export default function WorkOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [wo, setWo] = useState<WorkOrder | null>(null);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Edit fields
  const [status, setStatus] = useState("PENDING");
  const [technicianId, setTechnicianId] = useState("");
  const [assetId, setAssetId] = useState("");
  const [note, setNote] = useState("");
  const [laborCost, setLaborCost] = useState("");
  const [serviceFee, setServiceFee] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");

  // Part addition
  const [addPartId, setAddPartId] = useState("");
  const [addPartQty, setAddPartQty] = useState("1");
  const [addingPart, setAddingPart] = useState(false);

  // SMS
  const [smsLoading, setSmsLoading] = useState(false);

  async function load() {
    setLoading(true);
    const [woRes, techRes, partsRes] = await Promise.all([
      fetch(`/api/work-orders/${id}`),
      fetch("/api/technicians"),
      fetch("/api/parts"),
    ]);
    const woData = await woRes.json();
    const techData = await techRes.json();
    const partsData = await partsRes.json();

    if (!woRes.ok) { setErr(woData.error ?? "Yüklenemedi"); setLoading(false); return; }

    const w: WorkOrder = woData.item;
    setWo(w);
    setStatus(w.status);
    setTechnicianId(w.technician?.id ?? "");
    setAssetId(w.asset?.id ?? "");
    setNote(w.note ?? "");
    setLaborCost(w.laborCost ? String(w.laborCost / 100) : "");
    setServiceFee(w.serviceFee ? String(w.serviceFee / 100) : "");
    setScheduledAt(w.scheduledAt ? w.scheduledAt.slice(0, 16) : "");

    setTechnicians(techData.items ?? []);
    setParts(partsData.items ?? []);

    // Load assets for the customer
    const assetsRes = await fetch(`/api/assets?customerId=${w.customer.id}`);
    const assetsData = await assetsRes.json();
    setAssets(assetsData.items ?? []);

    setLoading(false);
  }

  useEffect(() => { load(); }, [id]);

  async function save() {
    setSaving(true);
    setErr(null);
    setSuccess(null);
    const res = await fetch(`/api/work-orders/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        status,
        technicianId: technicianId || null,
        assetId: assetId || null,
        note: note || null,
        laborCost: laborCost ? Math.round(parseFloat(laborCost) * 100) : 0,
        serviceFee: serviceFee ? Math.round(parseFloat(serviceFee) * 100) : 0,
        scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
        completedAt: status === "DONE" && !wo?.completedAt ? new Date().toISOString() : undefined,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setErr(data.error ?? "Kaydedilemedi"); return; }
    setSuccess("Kaydedildi ✓");
    await load();
    setTimeout(() => setSuccess(null), 3000);
  }

  async function addPart() {
    if (!addPartId) return;
    setAddingPart(true);
    const res = await fetch(`/api/work-orders/${id}/parts`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ partId: addPartId, quantity: parseInt(addPartQty) || 1 }),
    });
    const data = await res.json();
    setAddingPart(false);
    if (!res.ok) { setErr(data.error ?? "Eklenemedi"); return; }
    setAddPartId("");
    setAddPartQty("1");
    await load();
  }

  async function removePart(usageId: string) {
    const res = await fetch(`/api/work-orders/${id}/parts/${usageId}`, { method: "DELETE" });
    if (!res.ok) { const d = await res.json(); setErr(d.error ?? "Silinemedi"); return; }
    await load();
  }

  async function sendSms(type: "assignment" | "reminder") {
    if (!wo?.technician?.phone && type === "assignment") { setErr("Teknisyenin telefonu yok"); return; }
    setSmsLoading(true);
    const res = await fetch("/api/sms", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ workOrderId: id, type }),
    });
    const data = await res.json();
    setSmsLoading(false);
    if (!res.ok) { setErr(data.error ?? "SMS gönderilemedi"); return; }
    setSuccess("SMS gönderildi ✓");
    setTimeout(() => setSuccess(null), 3000);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          <span className="text-sm text-gray-500">Yükleniyor…</span>
        </div>
      </div>
    );
  }

  if (!wo) return <div className="text-red-600 p-4">{err ?? "İş emri bulunamadı."}</div>;

  const partsTotal = wo.partsUsed.reduce((a, p) => a + (p.part.price ?? 0) * p.quantity, 0);
  const subtotal = partsTotal + wo.laborCost + wo.serviceFee;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              ← Geri
            </button>
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">{wo.code}</h1>
            <StatusBadge status={wo.status} />
          </div>
          <p className="mt-1 text-sm text-gray-500">
            {TYPE_LABELS[wo.type] ?? wo.type} · {wo.customer.name}
            {wo.asset && ` · ${wo.asset.name}`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {wo.technician && (
            <Button
              variant="muted"
              onClick={() => sendSms("assignment")}
              disabled={smsLoading}
            >
              📱 SMS Gönder
            </Button>
          )}
          {!wo.invoice && (
            <a
              href={`/app/invoices?workOrderId=${wo.id}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
            >
              🧾 Fatura Oluştur
            </a>
          )}
          {wo.invoice && (
            <a
              href={`/api/invoices/${wo.invoice.id}/pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
            >
              🖨️ Proforma PDF
            </a>
          )}
          <Button onClick={save} disabled={saving}>
            {saving ? "Kaydediliyor…" : "Kaydet"}
          </Button>
        </div>
      </div>

      {err && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{err}</div>}
      {success && <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{success}</div>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column — editable fields */}
        <div className="lg:col-span-2 space-y-6">
          <Card title="İş Emri Bilgileri">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Select
                label="Durum"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </Select>

              <Select
                label="Teknisyen"
                value={technicianId}
                onChange={(e) => setTechnicianId(e.target.value)}
              >
                <option value="">— Atanmadı —</option>
                {technicians.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </Select>

              <Select
                label="Asansör"
                value={assetId}
                onChange={(e) => setAssetId(e.target.value)}
              >
                <option value="">— Seçilmedi —</option>
                {assets.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}{a.buildingName ? ` (${a.buildingName})` : ""}
                  </option>
                ))}
              </Select>

              <Input
                label="Planlanma Tarihi"
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
              />

              <Input
                label="İşçilik (₺)"
                type="number"
                value={laborCost}
                onChange={(e) => setLaborCost(e.target.value)}
                placeholder="350"
              />

              <Input
                label="Servis Ücreti (₺)"
                type="number"
                value={serviceFee}
                onChange={(e) => setServiceFee(e.target.value)}
                placeholder="150"
              />

              <div className="sm:col-span-2">
                <Textarea
                  label="Not / Açıklama"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={4}
                  placeholder="Arıza detayı, yapılan işlem, kullanılan malzeme…"
                />
              </div>
            </div>
          </Card>

          {/* Parts used */}
          <Card title="Kullanılan Parçalar">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                    <th className="pb-3">Parça</th>
                    <th className="pb-3">Adet</th>
                    <th className="pb-3 text-right">Fiyat</th>
                    <th className="pb-3 text-right">Toplam</th>
                    <th className="pb-3" />
                  </tr>
                </thead>
                <tbody>
                  {wo.partsUsed.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-sm text-gray-400">
                        Henüz parça eklenmedi
                      </td>
                    </tr>
                  ) : (
                    wo.partsUsed.map((p) => (
                      <tr key={p.id} className="border-t">
                        <td className="py-2.5 font-medium text-gray-900">{p.part.name}</td>
                        <td className="py-2.5 text-gray-600">{p.quantity}</td>
                        <td className="py-2.5 text-right text-gray-600">
                          {p.part.price ? money(p.part.price) : "—"}
                        </td>
                        <td className="py-2.5 text-right font-semibold text-gray-900">
                          {p.part.price ? money(p.part.price * p.quantity) : "—"}
                        </td>
                        <td className="py-2.5 text-right">
                          <button
                            onClick={() => removePart(p.id)}
                            className="rounded p-1 text-gray-400 hover:text-red-600 transition-colors"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Add part row */}
            <div className="mt-4 flex items-end gap-3 border-t pt-4">
              <div className="flex-1">
                <Select
                  label="Parça ekle"
                  value={addPartId}
                  onChange={(e) => setAddPartId(e.target.value)}
                >
                  <option value="">— Stoktan seç —</option>
                  {parts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}{p.price ? ` (${money(p.price)})` : ""}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="w-20">
                <Input
                  label="Adet"
                  type="number"
                  min="1"
                  value={addPartQty}
                  onChange={(e) => setAddPartQty(e.target.value)}
                />
              </div>
              <Button
                variant="muted"
                onClick={addPart}
                disabled={!addPartId || addingPart}
              >
                Ekle
              </Button>
            </div>
          </Card>
        </div>

        {/* Right column — summary */}
        <div className="space-y-4">
          <Card title="Özet">
            <dl className="space-y-3">
              <div className="flex justify-between text-sm">
                <dt className="text-gray-500">Müşteri</dt>
                <dd className="font-semibold text-gray-900">{wo.customer.name}</dd>
              </div>
              {wo.customer.phone && (
                <div className="flex justify-between text-sm">
                  <dt className="text-gray-500">Telefon</dt>
                  <dd>
                    <a href={`tel:${wo.customer.phone}`} className="text-blue-600 hover:underline">
                      {wo.customer.phone}
                    </a>
                  </dd>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <dt className="text-gray-500">Öncelik</dt>
                <dd className="font-semibold text-gray-900">{wo.priority ?? "Normal"}</dd>
              </div>
              <div className="flex justify-between text-sm">
                <dt className="text-gray-500">Oluşturulma</dt>
                <dd className="text-gray-700">
                  {new Date(wo.createdAt).toLocaleDateString("tr-TR")}
                </dd>
              </div>
              {wo.completedAt && (
                <div className="flex justify-between text-sm">
                  <dt className="text-gray-500">Tamamlanma</dt>
                  <dd className="text-gray-700">
                    {new Date(wo.completedAt).toLocaleDateString("tr-TR")}
                  </dd>
                </div>
              )}
            </dl>
          </Card>

          <Card title="Maliyet Özeti">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Parçalar</dt>
                <dd className="font-medium">{money(partsTotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">İşçilik</dt>
                <dd className="font-medium">{money(wo.laborCost)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Servis Ücreti</dt>
                <dd className="font-medium">{money(wo.serviceFee)}</dd>
              </div>
              <div className="flex justify-between border-t pt-2 text-base font-bold text-gray-900">
                <dt>Toplam (KDV hariç)</dt>
                <dd>{money(subtotal)}</dd>
              </div>
            </dl>
          </Card>

          {wo.invoice && (
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">Fatura</div>
                  <div className="mt-1 font-mono text-sm font-bold text-gray-900">{wo.invoice.number}</div>
                </div>
                <Pill tone={wo.invoice.status === "PAID" ? "green" : wo.invoice.status === "SENT" ? "blue" : "gray"}>
                  {wo.invoice.status}
                </Pill>
              </div>
            </Card>
          )}

          {/* Quick status buttons */}
          <Card title="Hızlı Güncelle">
            <div className="flex flex-col gap-2">
              {STATUS_OPTIONS.filter(s => s.value !== status).map((s) => (
                <button
                  key={s.value}
                  onClick={() => { setStatus(s.value); }}
                  className={`rounded-lg border px-3 py-2 text-left text-xs font-semibold transition-colors hover:opacity-80 ${s.cls}`}
                >
                  → {s.label} olarak işaretle
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
