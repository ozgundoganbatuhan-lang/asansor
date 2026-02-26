import { prisma } from "@/lib/prisma";
import { readSession } from "@/lib/auth";
import Link from "next/link";

const TYPE_LABELS: Record<string, string> = {
  FAULT: "Arıza",
  PERIODIC_MAINTENANCE: "Periyodik",
  ANNUAL_INSPECTION: "Muayene",
  REVISION: "Revizyon",
  INSTALLATION: "Kurulum",
};

function StatCard({ title, value, tone, href }: { title: string; value: number; tone?: "danger" | "warn"; href?: string }) {
  const cls = `rounded-2xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md ${tone === "danger" ? "border-red-200" : tone === "warn" ? "border-amber-200" : "border-gray-200"}`;
  const valCls = `mt-1 text-3xl font-extrabold tracking-tight ${tone === "danger" ? "text-red-600" : tone === "warn" ? "text-amber-700" : "text-gray-900"}`;
  const inner = (<><div className="text-xs font-semibold uppercase tracking-wide text-gray-400">{title}</div><div className={valCls}>{value}</div></>);
  if (href) return <Link href={href} className={cls}>{inner}</Link>;
  return <div className={cls}>{inner}</div>;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    URGENT: "bg-red-50 border border-red-200 text-red-700",
    IN_PROGRESS: "bg-amber-50 border border-amber-200 text-amber-800",
    DONE: "bg-emerald-50 border border-emerald-200 text-emerald-700",
    PENDING: "bg-gray-50 border border-gray-200 text-gray-600",
    CANCELED: "bg-gray-50 border border-gray-200 text-gray-400",
  };
  const labels: Record<string, string> = { URGENT: "Acil", IN_PROGRESS: "Devam", DONE: "Bitti", PENDING: "Planlı", CANCELED: "İptal" };
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${map[status] ?? map.PENDING}`}>{labels[status] ?? status}</span>;
}

export default async function DashboardPage() {
  const session = readSession();
  const orgId = session!.orgId;
  const now = new Date();
  const in7 = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const [customers, assets, workOrders, urgent, dueSoon, overdue, risky, recentWOs] = await Promise.all([
    prisma.customer.count({ where: { organizationId: orgId } }),
    prisma.asset.count({ where: { organizationId: orgId } }),
    prisma.workOrder.count({ where: { organizationId: orgId } }),
    prisma.workOrder.count({ where: { organizationId: orgId, status: "URGENT" } }),
    prisma.maintenancePlan.count({ where: { organizationId: orgId, nextDueAt: { gt: now, lte: in7 } } }),
    prisma.maintenancePlan.count({ where: { organizationId: orgId, nextDueAt: { lte: now } } }),
    prisma.asset.count({ where: { organizationId: orgId, riskScore: { gte: 60 } } }),
    prisma.workOrder.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { customer: { select: { name: true } }, technician: { select: { name: true } }, asset: { select: { name: true } } },
    }),
  ]);

  const overdueList = overdue > 0
    ? await prisma.maintenancePlan.findMany({
        where: { organizationId: orgId, nextDueAt: { lte: now } },
        take: 5,
        include: { asset: { select: { name: true, customer: { select: { name: true } } } } },
        orderBy: { nextDueAt: "asc" },
      })
    : [];

  return (
    <div className="space-y-6">
      <div>
        <div className="text-2xl font-extrabold tracking-tight text-gray-900">Genel Bakış</div>
        <div className="text-sm text-gray-500">Acil işler, geciken bakımlar ve riskli cihazlar tek ekranda.</div>
      </div>

      {(overdue > 0 || urgent > 0 || dueSoon > 0) && (
        <div className="space-y-3">
          {overdue > 0 && (
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <span className="mt-0.5 text-lg">⚠️</span>
              <div className="flex-1">
                <div className="text-sm font-bold text-red-800">{overdue} bakım planı gecikti!</div>
                <div className="mt-1 text-xs text-red-700">{overdueList.map((p, i) => <span key={p.id}>{i > 0 && " · "}{p.asset.name} ({p.asset.customer.name}) — {new Date(p.nextDueAt).toLocaleDateString("tr-TR")}</span>)}</div>
              </div>
              <Link href="/app/maintenance-plans" className="flex-shrink-0 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50">Görüntüle →</Link>
            </div>
          )}
          {urgent > 0 && (
            <div className="flex items-start gap-3 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3">
              <span className="mt-0.5 text-lg">🚨</span>
              <div className="flex-1"><div className="text-sm font-bold text-orange-800">{urgent} acil iş emri bekliyor</div></div>
              <Link href="/app/work-orders" className="flex-shrink-0 rounded-lg border border-orange-300 bg-white px-3 py-1.5 text-xs font-semibold text-orange-700 hover:bg-orange-50">Görüntüle →</Link>
            </div>
          )}
          {dueSoon > 0 && (
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <span className="mt-0.5 text-lg">🔔</span>
              <div className="flex-1"><div className="text-sm font-bold text-amber-800">{dueSoon} bakım bu hafta yapılmalı</div></div>
              <Link href="/app/maintenance-plans" className="flex-shrink-0 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-50">Görüntüle →</Link>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <StatCard title="Müşteri" value={customers} href="/app/customers" />
        <StatCard title="Asansör" value={assets} href="/app/assets" />
        <StatCard title="İş Emri" value={workOrders} href="/app/work-orders" />
        <StatCard title="Acil" value={urgent} tone="danger" href="/app/work-orders" />
        <StatCard title="Bu Hafta Bakım" value={dueSoon} tone={dueSoon > 0 ? "warn" : undefined} href="/app/maintenance-plans" />
        <StatCard title="Gecikmiş Bakım" value={overdue} tone={overdue > 0 ? "danger" : undefined} href="/app/maintenance-plans" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <StatCard title="Riskli Cihaz" value={risky} tone={risky > 0 ? "warn" : undefined} href="/app/assets" />
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
              ) : recentWOs.map((wo) => (
                <tr key={wo.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-5 py-3"><Link href={`/app/work-orders/${wo.id}`} className="font-mono text-xs font-semibold text-blue-600 hover:underline">{wo.code}</Link></td>
                  <td className="px-5 py-3 font-medium text-gray-800">{wo.customer.name}</td>
                  <td className="px-5 py-3 text-gray-600">{wo.asset?.name ?? "—"}</td>
                  <td className="px-5 py-3 text-gray-600">{wo.technician?.name ?? "—"}</td>
                  <td className="px-5 py-3"><StatusBadge status={wo.status} /></td>
                  <td className="px-5 py-3 text-gray-600">{TYPE_LABELS[wo.type] ?? wo.type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
