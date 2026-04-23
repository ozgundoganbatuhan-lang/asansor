"use client";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import OnboardingBeacon from "@/components/OnboardingBeacon";
import {
  Button, Card, EmptyState, ErrorBanner, Input, MetricCard,
  PageHeader, Pill, Select, Spinner, Textarea,
} from "@/components/ui";

export default function WorkOrdersPageWrapper() {
  return <Suspense><WorkOrdersPage /></Suspense>;
}

/* ── Types ── */
type WorkOrder = {
  id: string; code: string; status: string; type: string; priority?: string | null;
  createdAt: string;
  customer: { id: string; name: string };
  technician?: { id: string; name: string } | null;
  asset?: { id: string; name: string } | null;
};
type Customer    = { id: string; name: string };
type Technician  = { id: string; name: string };
type Asset       = { id: string; name: string; customerId: string };

/* ── Constants ── */
const humanType: Record<string, string> = {
  FAULT:                "Arıza",
  PERIODIC_MAINTENANCE: "Periyodik bakım",
  ANNUAL_INSPECTION:    "Yıllık kontrol",
  REVISION:             "Revizyon",
  INSTALLATION:         "Kurulum",
};

const STATUS_CFG: Record<string, { label: string; tone: "red" | "amber" | "green" | "gray" }> = {
  URGENT:      { label: "Acil",           tone: "red"   },
  IN_PROGRESS: { label: "Devam ediyor",   tone: "amber" },
  DONE:        { label: "Tamamlandı",     tone: "green" },
  PENDING:     { label: "Planlandı",      tone: "gray"  },
  CANCELED:    { label: "İptal",          tone: "gray"  },
};

const FILTERS      = ["ALL", "URGENT", "IN_PROGRESS", "PENDING", "DONE", "CANCELED"];
const FILTER_LABEL: Record<string, string> = {
  ALL: "Tümü", URGENT: "Acil", IN_PROGRESS: "Devam",
  PENDING: "Planlı", DONE: "Bitti", CANCELED: "İptal",
};

/* ── Main page ── */
function WorkOrdersPage() {
  const sp           = useSearchParams();
  const preCustomerId = sp.get("customerId") ?? "";
  const preAssetId    = sp.get("assetId") ?? "";

  const [orders,      setOrders]     = useState<WorkOrder[]>([]);
  const [customers,   setCustomers]  = useState<Customer[]>([]);
  const [technicians, setTech]       = useState<Technician[]>([]);
  const [assets,      setAssets]     = useState<Asset[]>([]);
  const [loading,     setLoading]    = useState(true);
  const [err,         setErr]        = useState<string | null>(null);

  const [filterStatus, setFS]          = useState("ALL");
  const [q,            setQ]           = useState("");
  const [showForm,     setShowForm]    = useState(!!preCustomerId);

  // Form fields
  const [customerId,   setCustomerId]   = useState(preCustomerId);
  const [technicianId, setTechnicianId] = useState("");
  const [assetId,      setAssetId]      = useState(preAssetId);
  const [type,         setType]         = useState("FAULT");
  const [status,       setStatus]       = useState("PENDING");
  const [priority,     setPriority]     = useState("Normal");
  const [note,         setNote]         = useState("");
  const [scheduledAt,  setScheduledAt]  = useState("");

  async function load() {
    setLoading(true);
    setErr(null);
    const [wR, cR, tR, aR] = await Promise.all([
      fetch("/api/work-orders"),
      fetch("/api/customers"),
      fetch("/api/technicians"),
      fetch("/api/assets"),
    ]);
    if (!wR.ok) { setErr("İş emirleri yüklenemedi"); setLoading(false); return; }
    const [w, c, t, a] = await Promise.all([wR.json(), cR.json(), tR.json(), aR.json()]);
    setOrders(w.items ?? []);
    setCustomers(c.items ?? []);
    setTech(t.items ?? []);
    setAssets(a.items ?? []);
    if (!customerId && !preCustomerId && c.items?.[0]) setCustomerId(c.items[0].id);
    setLoading(false);
  }

  useEffect(() => { void load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredAssets = useMemo(
    () => assets.filter(a => !customerId || a.customerId === customerId),
    [assets, customerId]
  );

  const counts = useMemo(() => {
    const m: Record<string, number> = { ALL: orders.length };
    FILTERS.slice(1).forEach(s => { m[s] = orders.filter(o => o.status === s).length; });
    return m;
  }, [orders]);

  const rows = useMemo(() => {
    let result = filterStatus === "ALL" ? orders : orders.filter(o => o.status === filterStatus);
    const s = q.trim().toLowerCase();
    if (s) result = result.filter(o =>
      [o.code, o.customer?.name, o.asset?.name ?? "", o.technician?.name ?? ""]
        .join(" ").toLowerCase().includes(s)
    );
    return result;
  }, [orders, filterStatus, q]);

  const urgentCount     = rows.filter(r => r.status === "URGENT").length;
  const inProgressCount = rows.filter(r => r.status === "IN_PROGRESS").length;

  async function createOrder(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!customerId) { setErr("Lütfen bir müşteri seçin."); return; }
    const res = await fetch("/api/work-orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerId,
        technicianId: technicianId || undefined,
        assetId:      assetId      || undefined,
        type, status, priority,
        note:        note        || undefined,
        scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return setErr(data?.error ?? "Oluşturma başarısız");
    setNote(""); setScheduledAt(""); setShowForm(false);
    await load();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="İş emirleri"
        subtitle="Planla, ata, saha akışını görünür kıl. Liste sadece kayıt göstermesin, operasyon ritmini de anlatsın."
        action={
          <OnboardingBeacon forStep={5} label="👆 İş emri açın">
            <Button
              data-tour="new-wo-btn"
              onClick={() => setShowForm(v => !v)}
              variant={showForm ? "secondary" : "primary"}
            >
              {showForm ? "Kapat" : "Yeni iş emri"}
            </Button>
          </OnboardingBeacon>
        }
      />

      {/* Metrics */}
      <section className="grid gap-4 lg:grid-cols-3">
        <MetricCard label="Gösterilen iş emri"  value={rows.length}       note="Filtreye göre listelenen toplam iş kaydı" />
        <MetricCard label="Acil müdahale"        value={urgentCount}       note="Önce ele alınması gereken kayıtlar" />
        <MetricCard label="Sahada devam eden"    value={inProgressCount}   note="Ekibin şu an üzerinde çalıştığı işler" />
      </section>

      {/* New work order form */}
      {showForm && (
        <Card title="Yeni iş emri" subtitle="Form sade tutuldu. Önce işi aç, detayları süreç içinde derinleştir.">
          <form onSubmit={createOrder} className="grid gap-4 lg:grid-cols-3">
            <Select label="Müşteri *" value={customerId} onChange={e => { setCustomerId(e.target.value); setAssetId(""); }} required>
              <option value="">Seçin</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
            <Select label="Asansör" value={assetId} onChange={e => setAssetId(e.target.value)}>
              <option value="">Seçilmedi</option>
              {filteredAssets.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </Select>
            <Select label="Teknisyen" value={technicianId} onChange={e => setTechnicianId(e.target.value)}>
              <option value="">Atanmadı</option>
              {technicians.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </Select>
            <Select label="Tür" value={type} onChange={e => setType(e.target.value)}>
              {Object.entries(humanType).map(([key, val]) => <option key={key} value={key}>{val}</option>)}
            </Select>
            <Select label="Durum" value={status} onChange={e => setStatus(e.target.value)}>
              {Object.entries(STATUS_CFG).map(([key, val]) => <option key={key} value={key}>{val.label}</option>)}
            </Select>
            <Select label="Öncelik" value={priority} onChange={e => setPriority(e.target.value)}>
              {["Normal", "Yüksek", "Kritik"].map(p => <option key={p}>{p}</option>)}
            </Select>
            <Input label="Planlanan tarih" type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} />
            <div className="lg:col-span-2">
              <Textarea label="Not / açıklama" rows={4} value={note} onChange={e => setNote(e.target.value)}
                placeholder="Arıza detayı, yapılacaklar, bina erişim notu..." />
            </div>
            {customerId && filteredAssets.length === 0 && (
              <div className="lg:col-span-3 rounded-[18px] bg-amber-50 px-4 py-3 text-sm text-amber-700">
                Bu müşteriye ait asansör görünmüyor.{" "}
                <Link href={`/app/customers/${customerId}`} className="font-bold underline">Detaya gidip kayıt ekleyin.</Link>
              </div>
            )}
            {err && <div className="lg:col-span-3"><ErrorBanner msg={err} /></div>}
            <div className="lg:col-span-3 flex flex-wrap gap-3">
              <Button type="submit">İş emrini oluştur</Button>
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>İptal</Button>
            </div>
          </form>
        </Card>
      )}

      {/* Work order list */}
      <Card title="İş listesi" subtitle="Durum filtreleri ve arama ile listeyi hızlıca daraltın.">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {FILTERS.map(filter => (
              <button
                key={filter}
                onClick={() => setFS(filter)}
                className={`rounded-[16px] border px-3 py-2 text-xs font-bold transition ${
                  filterStatus === filter
                    ? "border-transparent bg-[color:var(--primary)] text-white shadow-[var(--shadow-xs)]"
                    : "border-[color:var(--border)] bg-white text-[color:var(--muted)] hover:bg-[color:var(--surface-soft-2)]"
                }`}
              >
                {FILTER_LABEL[filter]}
                {counts[filter] > 0 && <span className="ml-1 opacity-70">({counts[filter]})</span>}
              </button>
            ))}
          </div>
          <div className="w-full max-w-md">
            <Input label="Ara" placeholder="Kod, müşteri, asansör veya teknisyen" value={q} onChange={e => setQ(e.target.value)} />
          </div>
        </div>

        {loading ? (
          <Spinner />
        ) : rows.length === 0 ? (
          <EmptyState
            icon="📋"
            title={q || filterStatus !== "ALL" ? "Eşleşen iş emri bulunamadı" : "Henüz iş emri yok"}
            desc={q || filterStatus !== "ALL" ? "Farklı filtre ya da arama deneyin." : "İlk iş emrini oluşturarak saha operasyon akışını başlatın."}
            action={!q && filterStatus === "ALL" ? <Button onClick={() => setShowForm(true)}>İlk iş emrini oluştur</Button> : undefined}
          />
        ) : (
          <div className="table-wrap">
            <table className="app-table">
              <thead>
                <tr>
                  <th>Kod</th><th>Müşteri</th><th>Asansör</th>
                  <th>Teknisyen</th><th>Durum</th><th>Tür</th><th>Tarih</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(order => {
                  const sc = STATUS_CFG[order.status] ?? STATUS_CFG.PENDING;
                  return (
                    <tr key={order.id}>
                      <td>
                        <Link href={`/app/work-orders/${order.id}`} className="font-mono text-xs font-bold text-[color:var(--primary)] hover:underline">
                          {order.code}
                        </Link>
                      </td>
                      <td>
                        <Link href={`/app/customers/${order.customer.id}`} className="font-bold text-[color:var(--foreground)] hover:text-[color:var(--primary)]">
                          {order.customer.name}
                        </Link>
                      </td>
                      <td className="text-[color:var(--muted)]">{order.asset?.name || "—"}</td>
                      <td className="text-[color:var(--muted)]">{order.technician?.name || "—"}</td>
                      <td><Pill tone={sc.tone}>{sc.label}</Pill></td>
                      <td className="text-[color:var(--muted)]">{humanType[order.type] ?? order.type}</td>
                      <td className="text-[color:var(--muted-2)]">{new Date(order.createdAt).toLocaleDateString("tr-TR")}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
