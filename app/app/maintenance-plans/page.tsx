"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Card, Input, Select, Pill, Textarea } from "@/components/ui";

type Asset = { id: string; name: string; buildingName?: string | null; customer: { name: string } };
type Plan = {
  id: string;
  periodMonths: number;
  nextDueAt: string;
  lastDoneAt?: string | null;
  notes?: string | null;
  asset: { id: string; name: string; buildingName?: string | null; customer: { id: string; name: string } };
};

function planStatus(nextDueAt: string): { label: string; tone: "red" | "amber" | "green" | "gray" } {
  const now = new Date();
  const due = new Date(nextDueAt);
  const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { label: `${Math.abs(diffDays)} gün gecikti`, tone: "red" };
  if (diffDays <= 7) return { label: `${diffDays} gün kaldı`, tone: "amber" };
  return { label: `${diffDays} gün kaldı`, tone: "green" };
}

export default function MaintenancePlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const [assetId, setAssetId] = useState("");
  const [periodMonths, setPeriodMonths] = useState("1");
  const [nextDueAt, setNextDueAt] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [notes, setNotes] = useState("");

  async function load() {
    setLoading(true);
    const [pRes, aRes] = await Promise.all([
      fetch("/api/maintenance-plans"),
      fetch("/api/assets"),
    ]);
    const pData = await pRes.json();
    const aData = await aRes.json();
    setPlans(pData.items ?? []);
    setAssets(aData.items ?? []);
    if (!assetId && aData.items?.[0]) setAssetId(aData.items[0].id);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return plans;
    return plans.filter((p) =>
      [p.asset.name, p.asset.buildingName ?? "", p.asset.customer.name].join(" ").toLowerCase().includes(s)
    );
  }, [plans, q]);

  const overdue = plans.filter((p) => new Date(p.nextDueAt) < new Date());
  const dueSoon = plans.filter((p) => {
    const diff = (new Date(p.nextDueAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 7;
  });

  async function create() {
    if (!assetId) return;
    setSaving(true);
    setErr(null);
    const res = await fetch("/api/maintenance-plans", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        assetId,
        periodMonths: parseInt(periodMonths) || 1,
        nextDueAt: new Date(nextDueAt).toISOString(),
        notes: notes || undefined,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setErr(data.error ?? "Hata"); return; }
    setNotes("");
    await load();
  }

  async function markDone(id: string) {
    const res = await fetch(`/api/maintenance-plans/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ markDone: true }),
    });
    if (!res.ok) { const d = await res.json(); setErr(d.error ?? "Güncellenemedi"); return; }
    await load();
  }

  async function deletePlan(id: string) {
    if (!confirm("Bu bakım planını silmek istediğinize emin misiniz?")) return;
    await fetch(`/api/maintenance-plans/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Bakım Planları</h1>
        <p className="mt-1 text-sm text-gray-500">Periyodik bakım takibi, gecikme uyarıları ve tamamlama kaydı.</p>
      </div>

      {/* Alert banners */}
      {overdue.length > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <span className="mt-0.5 text-red-500">⚠️</span>
          <div>
            <div className="text-sm font-bold text-red-800">{overdue.length} bakım gecikti!</div>
            <div className="mt-0.5 text-xs text-red-700">
              {overdue.map(p => `${p.asset.name} (${p.asset.customer.name})`).join(" · ")}
            </div>
          </div>
        </div>
      )}
      {dueSoon.length > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <span className="mt-0.5 text-amber-500">🔔</span>
          <div>
            <div className="text-sm font-bold text-amber-800">{dueSoon.length} bakım bu hafta yapılmalı</div>
            <div className="mt-0.5 text-xs text-amber-700">
              {dueSoon.map(p => `${p.asset.name}`).join(" · ")}
            </div>
          </div>
        </div>
      )}

      {/* KPI */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">Toplam Plan</div>
          <div className="mt-1 text-3xl font-extrabold text-gray-900">{plans.length}</div>
        </div>
        <div className={`rounded-2xl border bg-white p-4 shadow-sm ${overdue.length > 0 ? "border-red-200" : "border-gray-200"}`}>
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">Gecikmiş</div>
          <div className={`mt-1 text-3xl font-extrabold ${overdue.length > 0 ? "text-red-600" : "text-gray-900"}`}>{overdue.length}</div>
        </div>
        <div className={`rounded-2xl border bg-white p-4 shadow-sm ${dueSoon.length > 0 ? "border-amber-200" : "border-gray-200"}`}>
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">Bu Hafta</div>
          <div className={`mt-1 text-3xl font-extrabold ${dueSoon.length > 0 ? "text-amber-600" : "text-gray-900"}`}>{dueSoon.length}</div>
        </div>
        <div className="rounded-2xl border border-green-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">Zamanında</div>
          <div className="mt-1 text-3xl font-extrabold text-green-600">
            {plans.length - overdue.length - dueSoon.length}
          </div>
        </div>
      </div>

      {/* New plan form */}
      <Card title="Yeni Bakım Planı">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <Select
              label="Asansör"
              value={assetId}
              onChange={(e) => setAssetId(e.target.value)}
            >
              <option value="">— Seç —</option>
              {assets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} — {(a as any).customer?.name ?? ""}
                </option>
              ))}
            </Select>
          </div>
          <Select
            label="Periyot"
            value={periodMonths}
            onChange={(e) => setPeriodMonths(e.target.value)}
          >
            <option value="1">Aylık</option>
            <option value="3">3 Aylık</option>
            <option value="6">6 Aylık</option>
            <option value="12">Yıllık</option>
          </Select>
          <Input
            label="İlk Bakım Tarihi"
            type="date"
            value={nextDueAt}
            onChange={(e) => setNextDueAt(e.target.value)}
          />
          <div className="sm:col-span-2 lg:col-span-4">
            <Input
              label="Not (opsiyonel)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Özel talimat, dikkat edilecekler…"
            />
          </div>
        </div>
        {err && <div className="mt-3 text-sm text-red-600">{err}</div>}
        <div className="mt-4">
          <Button onClick={create} disabled={saving || !assetId}>
            {saving ? "Kaydediliyor…" : "Plan Oluştur"}
          </Button>
        </div>
      </Card>

      {/* List */}
      <Card>
        <div className="mb-4 flex items-center gap-3">
          <Input
            placeholder="Cihaz / müşteri / bina ara…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <Pill tone="gray">{filtered.length} plan</Pill>
        </div>

        {loading ? (
          <div className="py-8 text-center text-sm text-gray-400">Yükleniyor…</div>
        ) : filtered.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-400">Plan bulunamadı.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                  <th className="pb-3">Asansör</th>
                  <th className="pb-3">Müşteri</th>
                  <th className="pb-3">Periyot</th>
                  <th className="pb-3">Son Bakım</th>
                  <th className="pb-3">Sonraki Bakım</th>
                  <th className="pb-3">Durum</th>
                  <th className="pb-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const st = planStatus(p.nextDueAt);
                  return (
                    <tr key={p.id} className="border-t">
                      <td className="py-3 font-semibold text-gray-900">{p.asset.name}</td>
                      <td className="py-3 text-gray-700">{p.asset.customer.name}</td>
                      <td className="py-3 text-gray-600">
                        {p.periodMonths === 1 ? "Aylık" :
                         p.periodMonths === 3 ? "3 Aylık" :
                         p.periodMonths === 6 ? "6 Aylık" :
                         p.periodMonths === 12 ? "Yıllık" : `${p.periodMonths} ay`}
                      </td>
                      <td className="py-3 text-gray-600">
                        {p.lastDoneAt ? new Date(p.lastDoneAt).toLocaleDateString("tr-TR") : "—"}
                      </td>
                      <td className="py-3 font-medium text-gray-900">
                        {new Date(p.nextDueAt).toLocaleDateString("tr-TR")}
                      </td>
                      <td className="py-3">
                        <Pill tone={st.tone}>{st.label}</Pill>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="muted"
                            onClick={() => markDone(p.id)}
                          >
                            ✓ Yapıldı
                          </Button>
                          <button
                            onClick={() => deletePlan(p.id)}
                            className="rounded p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                          >
                            🗑
                          </button>
                        </div>
                      </td>
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
