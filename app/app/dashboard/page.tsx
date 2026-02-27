"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const TYPE_LABELS: Record<string, string> = {
  FAULT: "Arıza", PERIODIC_MAINTENANCE: "Periyodik",
  ANNUAL_INSPECTION: "Muayene", REVISION: "Revizyon", INSTALLATION: "Kurulum",
};
const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  URGENT:      { label: "Acil",   cls: "bg-red-50 border border-red-200 text-red-700" },
  IN_PROGRESS: { label: "Devam",  cls: "bg-amber-50 border border-amber-200 text-amber-800" },
  DONE:        { label: "Bitti",  cls: "bg-emerald-50 border border-emerald-200 text-emerald-700" },
  PENDING:     { label: "Planlı", cls: "bg-gray-50 border border-gray-200 text-gray-600" },
  CANCELED:    { label: "İptal",  cls: "bg-gray-50 border border-gray-200 text-gray-400" },
};

type Stats = { customers: number; assets: number; workOrders: number; urgent: number; dueSoon: number; overdue: number; risky: number };
type WO = { id: string; code: string; type: string; status: string; customer: { name: string }; technician?: { name: string } | null; asset?: { name: string } | null };
type OverduePlan = { id: string; nextDueAt: string; asset: { name: string; customer: { name: string } } };

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentWOs, setRecentWOs] = useState<WO[]>([]);
  const [overdueList, setOverdueList] = useState<OverduePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/dashboard")
      .then(r => r.json())
      .then(d => {
        if (d.error) { setError(d.error); return; }
        setStats(d.stats);
        setRecentWOs(d.recentWOs ?? []);
        setOverdueList(d.overdueList ?? []);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex h-64 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
    </div>
  );

  if (error) return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
      <div className="font-bold mb-1">Hata</div>
      <div className="text-sm">{error}</div>
    </div>
  );

  if (!stats) return null;

  return (
    <div className="space-y-6">
      <div>
        <div className="text-2xl font-extrabold tracking-tight text-gray-900">Genel Bakış</div>
        <div className="text-sm text-gray-500">Acil işler, geciken bakımlar ve riskli cihazlar tek ekranda.</div>
      </div>

      {/* Alerts */}
      {(stats.overdue > 0 || stats.urgent > 0 || stats.dueSoon > 0) && (
        <div className="space-y-2">
          {stats.overdue > 0 && (
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <span className="mt-0.5">⚠️</span>
              <div className="flex-1">
                <div className="text-sm font-bold text-red-800">{stats.overdue} bakım planı gecikti!</div>
                <div className="mt-1 text-xs text-red-700">
                  {overdueList.map((p, i) => (
                    <span key={p.id}>{i > 0 && " · "}{p.asset.name} ({p.asset.customer.name}) — {new Date(p.nextDueAt).toLocaleDateString("tr-TR")}</span>
                  ))}
                </div>
              </div>
              <Link href="/app/maintenance-plans" className="flex-shrink-0 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50">Görüntüle →</Link>
            </div>
          )}
          {stats.urgent > 0 && (
            <div className="flex items-start gap-3 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3">
              <span className="mt-0.5">🚨</span>
              <div className="flex-1"><div className="text-sm font-bold text-orange-800">{stats.urgent} acil iş emri bekliyor</div></div>
              <Link href="/app/work-orders" className="flex-shrink-0 rounded-lg border border-orange-300 bg-white px-3 py-1.5 text-xs font-semibold text-orange-700">Görüntüle →</Link>
            </div>
          )}
          {stats.dueSoon > 0 && (
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <span className="mt-0.5">🔔</span>
              <div className="flex-1"><div className="text-sm font-bold text-amber-800">{stats.dueSoon} bakım bu hafta yapılmalı</div></div>
              <Link href="/app/maintenance-plans" className="flex-shrink-0 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-700">Görüntüle →</Link>
            </div>
          )}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {[
          { title: "Müşteri",        val: stats.customers,  href: "/app/customers",          tone: "" },
          { title: "Asansör",        val: stats.assets,     href: "/app/assets",             tone: "" },
          { title: "İş Emri",        val: stats.workOrders, href: "/app/work-orders",         tone: "" },
          { title: "Acil",           val: stats.urgent,     href: "/app/work-orders",         tone: stats.urgent > 0 ? "danger" : "" },
          { title: "Bu Hafta Bakım", val: stats.dueSoon,    href: "/app/maintenance-plans",  tone: stats.dueSoon > 0 ? "warn" : "" },
          { title: "Gecikmiş Bakım", val: stats.overdue,    href: "/app/maintenance-plans",  tone: stats.overdue > 0 ? "danger" : "" },
        ].map(k => (
          <Link key={k.title} href={k.href}
            className={`rounded-2xl border bg-white p-5 shadow-sm hover:shadow-md transition-shadow ${k.tone === "danger" ? "border-red-200" : k.tone === "warn" ? "border-amber-200" : "border-gray-200"}`}>
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">{k.title}</div>
            <div className={`mt-1 text-3xl font-extrabold tracking-tight ${k.tone === "danger" ? "text-red-600" : k.tone === "warn" ? "text-amber-700" : "text-gray-900"}`}>{k.val}</div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className={`rounded-2xl border bg-white p-5 shadow-sm ${stats.risky > 0 ? "border-amber-200" : "border-gray-200"}`}>
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">Riskli Cihaz</div>
          <div className={`mt-1 text-3xl font-extrabold ${stats.risky > 0 ? "text-amber-700" : "text-gray-900"}`}>{stats.risky}</div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:col-span-2">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">Hızlı Erişim</div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50" href="/app/maintenance-plans">📋 Bakım planları</Link>
            <Link className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50" href="/app/work-orders">➕ Yeni iş emri</Link>
            <Link className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50" href="/app/customers/new">👤 Müşteri ekle</Link>
            <Link className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50" href="/app/reports">📊 Raporlar</Link>
          </div>
        </div>
      </div>

      {/* Recent work orders */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="text-sm font-semibold text-gray-900">Son İş Emirleri</div>
          <Link href="/app/work-orders" className="text-xs font-semibold text-blue-600 hover:underline">Tümünü gör →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-400 bg-gray-50">
                <th className="px-5 py-3">Kod</th><th className="px-5 py-3">Müşteri</th><th className="px-5 py-3">Asansör</th><th className="px-5 py-3">Teknisyen</th><th className="px-5 py-3">Durum</th><th className="px-5 py-3">Tür</th>
              </tr>
            </thead>
            <tbody>
              {recentWOs.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-gray-400">Henüz iş emri yok. <Link href="/app/work-orders" className="text-blue-600 hover:underline">Oluştur →</Link></td></tr>
              ) : recentWOs.map(wo => {
                const st = STATUS_MAP[wo.status] ?? STATUS_MAP.PENDING;
                return (
                  <tr key={wo.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-5 py-3"><Link href={`/app/work-orders/${wo.id}`} className="font-mono text-xs font-semibold text-blue-600 hover:underline">{wo.code}</Link></td>
                    <td className="px-5 py-3 font-medium text-gray-800">{wo.customer.name}</td>
                    <td className="px-5 py-3 text-gray-600">{wo.asset?.name ?? "—"}</td>
                    <td className="px-5 py-3 text-gray-600">{wo.technician?.name ?? "—"}</td>
                    <td className="px-5 py-3"><span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${st.cls}`}>{st.label}</span></td>
                    <td className="px-5 py-3 text-gray-600">{TYPE_LABELS[wo.type] ?? wo.type}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
