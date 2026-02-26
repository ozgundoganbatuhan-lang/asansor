"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, Pill } from "@/components/ui";
import Link from "next/link";

type Customer = {
  id: string;
  name: string;
  contactName?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  taxId?: string | null;
  notes?: string | null;
};

type Asset = {
  id: string;
  name: string;
  buildingName?: string | null;
  stops?: number | null;
  capacityKg?: number | null;
  controllerBrand?: string | null;
  riskScore?: number | null;
  lastMaintenanceAt?: string | null;
};

type WorkOrder = {
  id: string;
  code: string;
  type: string;
  status: string;
  priority?: string | null;
  createdAt: string;
  scheduledAt?: string | null;
  asset?: { name: string } | null;
  technician?: { name: string } | null;
};

const TYPE_LABELS: Record<string, string> = {
  FAULT: "Arıza",
  PERIODIC_MAINTENANCE: "Periyodik Bakım",
  ANNUAL_INSPECTION: "Yıllık Muayene",
  REVISION: "Revizyon",
  INSTALLATION: "Kurulum",
};

const STATUS_TONE: Record<string, "red" | "amber" | "green" | "gray"> = {
  URGENT: "red",
  IN_PROGRESS: "amber",
  DONE: "green",
  PENDING: "gray",
  CANCELED: "gray",
};

const STATUS_LABELS: Record<string, string> = {
  URGENT: "Acil",
  IN_PROGRESS: "Devam",
  DONE: "Bitti",
  PENDING: "Planlı",
  CANCELED: "İptal",
};

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [cRes, aRes, wRes] = await Promise.all([
        fetch(`/api/customers/${id}`),
        fetch(`/api/assets?customerId=${id}`),
        fetch(`/api/work-orders?customerId=${id}`),
      ]);
      const cData = await cRes.json();
      const aData = await aRes.json();
      const wData = await wRes.json();
      setCustomer(cData.item ?? null);
      setAssets(aData.items ?? []);
      setWorkOrders(wData.items ?? []);
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!customer) return <div className="p-4 text-red-600">Müşteri bulunamadı.</div>;

  const openOrders = workOrders.filter((w) => !["DONE", "CANCELED"].includes(w.status));
  const riskAssets = assets.filter((a) => (a.riskScore ?? 0) >= 60);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
            >
              ← Geri
            </button>
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">{customer.name}</h1>
          </div>
          {customer.address && (
            <p className="mt-1 text-sm text-gray-500">{customer.address}</p>
          )}
        </div>
        <Link
          href={`/app/work-orders?customerId=${id}`}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm"
        >
          + Yeni İş Emri
        </Link>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">Asansör</div>
          <div className="mt-1 text-3xl font-extrabold text-gray-900">{assets.length}</div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">İş Emri</div>
          <div className="mt-1 text-3xl font-extrabold text-gray-900">{workOrders.length}</div>
        </div>
        <div className={`rounded-2xl border bg-white p-4 shadow-sm ${openOrders.length > 0 ? "border-amber-200" : "border-gray-200"}`}>
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">Açık</div>
          <div className={`mt-1 text-3xl font-extrabold ${openOrders.length > 0 ? "text-amber-600" : "text-gray-900"}`}>{openOrders.length}</div>
        </div>
        <div className={`rounded-2xl border bg-white p-4 shadow-sm ${riskAssets.length > 0 ? "border-red-200" : "border-gray-200"}`}>
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">Riskli</div>
          <div className={`mt-1 text-3xl font-extrabold ${riskAssets.length > 0 ? "text-red-600" : "text-gray-900"}`}>{riskAssets.length}</div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: assets + work orders */}
        <div className="lg:col-span-2 space-y-6">
          {/* Assets */}
          <Card title="Asansörler" subtitle={`${assets.length} kayıt`}>
            {assets.length === 0 ? (
              <div className="py-6 text-center text-sm text-gray-400">
                Henüz asansör eklenmemiş.{" "}
                <a href="/app/assets" className="text-blue-600 hover:underline">Ekle →</a>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                      <th className="pb-3">Asansör</th>
                      <th className="pb-3">Bina</th>
                      <th className="pb-3">Durak</th>
                      <th className="pb-3">Kontrol</th>
                      <th className="pb-3">Risk</th>
                      <th className="pb-3">Son Bakım</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assets.map((a) => (
                      <tr key={a.id} className="border-t">
                        <td className="py-2.5 font-semibold text-gray-900">{a.name}</td>
                        <td className="py-2.5 text-gray-600">{a.buildingName ?? "—"}</td>
                        <td className="py-2.5 text-gray-600">{a.stops ?? "—"}</td>
                        <td className="py-2.5 text-gray-600">{a.controllerBrand ?? "—"}</td>
                        <td className="py-2.5">
                          <Pill tone={(a.riskScore ?? 0) >= 70 ? "red" : (a.riskScore ?? 0) >= 40 ? "amber" : "green"}>
                            {a.riskScore ?? 0}
                          </Pill>
                        </td>
                        <td className="py-2.5 text-gray-600">
                          {a.lastMaintenanceAt
                            ? new Date(a.lastMaintenanceAt).toLocaleDateString("tr-TR")
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Work orders */}
          <Card title="İş Emirleri" subtitle={`${workOrders.length} toplam`}>
            {workOrders.length === 0 ? (
              <div className="py-6 text-center text-sm text-gray-400">Henüz iş emri yok.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                      <th className="pb-3">Kod</th>
                      <th className="pb-3">Tür</th>
                      <th className="pb-3">Asansör</th>
                      <th className="pb-3">Teknisyen</th>
                      <th className="pb-3">Durum</th>
                      <th className="pb-3">Tarih</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workOrders.map((w) => (
                      <tr key={w.id} className="border-t">
                        <td className="py-2.5">
                          <Link
                            href={`/app/work-orders/${w.id}`}
                            className="font-mono font-semibold text-blue-600 hover:underline"
                          >
                            {w.code}
                          </Link>
                        </td>
                        <td className="py-2.5 text-gray-700">{TYPE_LABELS[w.type] ?? w.type}</td>
                        <td className="py-2.5 text-gray-600">{w.asset?.name ?? "—"}</td>
                        <td className="py-2.5 text-gray-600">{w.technician?.name ?? "—"}</td>
                        <td className="py-2.5">
                          <Pill tone={STATUS_TONE[w.status] ?? "gray"}>
                            {STATUS_LABELS[w.status] ?? w.status}
                          </Pill>
                        </td>
                        <td className="py-2.5 text-gray-600">
                          {new Date(w.createdAt).toLocaleDateString("tr-TR")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        {/* Right: contact info */}
        <div>
          <Card title="İletişim Bilgileri">
            <dl className="space-y-3">
              {customer.contactName && (
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">İrtibat</dt>
                  <dd className="mt-0.5 text-sm font-medium text-gray-900">{customer.contactName}</dd>
                </div>
              )}
              {customer.phone && (
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">Telefon</dt>
                  <dd className="mt-0.5">
                    <a href={`tel:${customer.phone}`} className="text-sm text-blue-600 hover:underline">
                      {customer.phone}
                    </a>
                  </dd>
                </div>
              )}
              {customer.email && (
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">E-posta</dt>
                  <dd className="mt-0.5">
                    <a href={`mailto:${customer.email}`} className="text-sm text-blue-600 hover:underline">
                      {customer.email}
                    </a>
                  </dd>
                </div>
              )}
              {customer.address && (
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">Adres</dt>
                  <dd className="mt-0.5 text-sm text-gray-700">{customer.address}</dd>
                </div>
              )}
              {customer.taxId && (
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">Vergi No</dt>
                  <dd className="mt-0.5 font-mono text-sm text-gray-700">{customer.taxId}</dd>
                </div>
              )}
              {customer.notes && (
                <div className="border-t pt-3">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">Notlar</dt>
                  <dd className="mt-1 text-sm text-gray-700 leading-relaxed">{customer.notes}</dd>
                </div>
              )}
            </dl>
          </Card>
        </div>
      </div>
    </div>
  );
}
