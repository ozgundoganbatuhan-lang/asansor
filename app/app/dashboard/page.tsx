"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

/* ─── Types ─── */
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
type UpcomingPlan = {
  id: string;
  name: string | null;
  planType: string;
  nextDueAt: string;
  asset: {
    id: string; name: string; buildingName: string | null; elevatorIdNo: string | null;
    customer: { id: string; name: string; phone: string | null; address: string | null };
  };
};

/* ─── Google Calendar helpers ─── */
function toGCalDate(d: Date) {
  return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

function googleCalendarUrl(plan: UpcomingPlan): string {
  const start = new Date(plan.nextDueAt);
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000); // +2 saat
  const title = encodeURIComponent(
    `Asansör Bakım — ${plan.asset.customer.name} / ${plan.asset.name}`
  );
  const details = encodeURIComponent(
    [
      `Müşteri: ${plan.asset.customer.name}`,
      plan.asset.customer.phone ? `Telefon: ${plan.asset.customer.phone}` : "",
      `Asansör: ${plan.asset.name}`,
      plan.asset.buildingName ? `Bina: ${plan.asset.buildingName}` : "",
      plan.asset.elevatorIdNo ? `Kimlik No: ${plan.asset.elevatorIdNo}` : "",
      plan.name ? `Plan: ${plan.name}` : "",
    ].filter(Boolean).join("\n")
  );
  const location = encodeURIComponent(plan.asset.customer.address ?? "");
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${toGCalDate(start)}/${toGCalDate(end)}&details=${details}&location=${location}`;
}

/* ─── ICS bulk export ─── */
function buildIcs(plans: UpcomingPlan[]): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Asansor Servisim//TR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Asansör Bakım Planları",
    "X-WR-TIMEZONE:Europe/Istanbul",
  ];

  plans.forEach(p => {
    const start = new Date(p.nextDueAt);
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
    const summary = `Asansör Bakım — ${p.asset.customer.name} / ${p.asset.name}`;
    const desc = [
      `Müşteri: ${p.asset.customer.name}`,
      p.asset.customer.phone ? `Tel: ${p.asset.customer.phone}` : "",
      `Asansör: ${p.asset.name}`,
      p.asset.buildingName ? `Bina: ${p.asset.buildingName}` : "",
      p.asset.elevatorIdNo ? `Kimlik No: ${p.asset.elevatorIdNo}` : "",
    ].filter(Boolean).join("\\n");

    lines.push(
      "BEGIN:VEVENT",
      `UID:asansor-bakim-${p.id}@servisim`,
      `DTSTART:${toGCalDate(start)}`,
      `DTEND:${toGCalDate(end)}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:${desc}`,
      p.asset.customer.address ? `LOCATION:${p.asset.customer.address}` : "",
      `STATUS:CONFIRMED`,
      "END:VEVENT"
    );
  });
  lines.push("END:VCALENDAR");
  return lines.filter(l => l !== "").join("\r\n");
}

function downloadIcs(plans: UpcomingPlan[]) {
  const content = buildIcs(plans);
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "asansor-bakim-planlari.ics";
  a.click();
  URL.revokeObjectURL(url);
}

/* ─── Mini Calendar ─── */
function MiniCalendar({ plans }: { plans: UpcomingPlan[] }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  // Map: "YYYY-MM-DD" → plans[]
  const plansByDay = useMemo(() => {
    const map: Record<string, UpcomingPlan[]> = {};
    plans.forEach(p => {
      const d = new Date(p.nextDueAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      if (!map[key]) map[key] = [];
      map[key].push(p);
    });
    return map;
  }, [plans]);

  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = (firstDay + 6) % 7; // Mon=0
  const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;

  const MONTHS = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];
  const DAYS = ["Pt","Sa","Ça","Pe","Cu","Ct","Pz"];

  const selectedKey = selectedDay
    ? `${year}-${String(month + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`
    : null;
  const selectedPlans = selectedKey ? (plansByDay[selectedKey] ?? []) : [];

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
    setSelectedDay(null);
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
    setSelectedDay(null);
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <span className="text-base font-bold text-gray-900">📅 Bakım Takvimi</span>
          <span className="text-xs text-gray-400">(60 gün)</span>
        </div>
        <div className="flex items-center gap-2">
          {plans.length > 0 && (
            <>
              <button
                onClick={() => downloadIcs(plans)}
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                title="ICS dosyası indir — Outlook, Apple Calendar"
              >
                <span>📥</span> ICS İndir
              </button>
              <a
                href={`https://calendar.google.com/calendar/r`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
                title="Google Calendar'ı aç"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.5 3h-3V1.5h-9V3H4.5C3.12 3 2 4.12 2 5.5v15C2 21.88 3.12 23 4.5 23h15c1.38 0 2.5-1.12 2.5-2.5v-15C22 4.12 20.88 3 19.5 3zM12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6zm0-10c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z"/>
                </svg>
                Google Calendar
              </a>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row">
        {/* Calendar grid */}
        <div className="p-4 lg:w-72 flex-shrink-0">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-3">
            <button onClick={prevMonth} className="rounded-lg p-1.5 hover:bg-gray-100 text-gray-500 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <span className="text-sm font-bold text-gray-900">{MONTHS[month]} {year}</span>
            <button onClick={nextMonth} className="rounded-lg p-1.5 hover:bg-gray-100 text-gray-500 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAYS.map(d => (
              <div key={d} className="text-center text-[10px] font-bold text-gray-400 py-1">{d}</div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-0.5">
            {Array.from({ length: totalCells }).map((_, i) => {
              const dayNum = i - startOffset + 1;
              if (dayNum < 1 || dayNum > daysInMonth) return <div key={i} />;

              const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
              const dayPlans = plansByDay[key] ?? [];
              const isToday = dayNum === today.getDate() && month === today.getMonth() && year === today.getFullYear();
              const isSelected = dayNum === selectedDay;
              const hasPlans = dayPlans.length > 0;

              // Check if any plan is overdue
              const isOverdue = dayPlans.some(p => new Date(p.nextDueAt) < today);
              const isUrgent = dayPlans.some(p => {
                const days = Math.ceil((new Date(p.nextDueAt).getTime() - Date.now()) / 86400000);
                return days <= 3 && days >= 0;
              });

              return (
                <button
                  key={i}
                  onClick={() => setSelectedDay(hasPlans ? dayNum : null)}
                  className={`relative aspect-square flex flex-col items-center justify-center rounded-lg text-xs font-semibold transition-all
                    ${isSelected ? "bg-blue-600 text-white shadow-sm" : ""}
                    ${!isSelected && isToday ? "bg-blue-100 text-blue-800 font-bold" : ""}
                    ${!isSelected && !isToday && hasPlans ? "cursor-pointer hover:bg-gray-100" : ""}
                    ${!isSelected && !isToday && !hasPlans ? "text-gray-400" : ""}
                    ${!isSelected && !isToday ? "text-gray-700" : ""}
                  `}
                >
                  <span>{dayNum}</span>
                  {hasPlans && !isSelected && (
                    <div className="flex gap-0.5 mt-0.5">
                      {dayPlans.slice(0, 3).map((_, di) => (
                        <div
                          key={di}
                          className={`w-1 h-1 rounded-full ${
                            isOverdue ? "bg-red-500" :
                            isUrgent ? "bg-amber-500" :
                            "bg-blue-500"
                          }`}
                        />
                      ))}
                    </div>
                  )}
                  {hasPlans && isSelected && (
                    <div className="flex gap-0.5 mt-0.5">
                      {dayPlans.slice(0, 3).map((_, di) => (
                        <div key={di} className="w-1 h-1 rounded-full bg-white/70" />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-4 flex items-center gap-4 text-[10px] text-gray-400">
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"/><span>Planlı</span></div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500"/><span>Bu hafta</span></div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"/><span>Gecikmiş</span></div>
          </div>
        </div>

        {/* Right panel: selected day details OR upcoming list */}
        <div className="flex-1 border-t lg:border-t-0 lg:border-l border-gray-100 flex flex-col">
          {selectedDay && selectedPlans.length > 0 ? (
            /* Selected day plans */
            <div className="p-4 space-y-3">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                {selectedDay} {MONTHS[month]} {year}
              </div>
              {selectedPlans.map(p => {
                const daysLeft = Math.ceil((new Date(p.nextDueAt).getTime() - Date.now()) / 86400000);
                return (
                  <div key={p.id} className={`rounded-xl border p-3 ${daysLeft < 0 ? "border-red-200 bg-red-50" : daysLeft <= 3 ? "border-amber-200 bg-amber-50" : "border-gray-200 bg-gray-50"}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 text-sm truncate">{p.asset.customer.name}</p>
                        <p className="text-xs text-gray-600 truncate">{p.asset.name}{p.asset.buildingName ? ` — ${p.asset.buildingName}` : ""}</p>
                        {p.asset.customer.phone && (
                          <a href={`tel:${p.asset.customer.phone}`} className="text-xs text-blue-600 hover:underline">📞 {p.asset.customer.phone}</a>
                        )}
                        {p.name && <p className="text-xs text-gray-400 mt-0.5">{p.name}</p>}
                      </div>
                      <a
                        href={googleCalendarUrl(p)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-shrink-0 flex items-center gap-1 rounded-lg bg-white border border-blue-200 px-2 py-1 text-[10px] font-semibold text-blue-700 hover:bg-blue-50 transition-colors"
                        title="Google Calendar'a ekle"
                      >
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                        GCal
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Upcoming list */
            <div className="flex-1 overflow-y-auto">
              {plans.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-12 text-center px-4">
                  <div className="text-3xl mb-2">📅</div>
                  <p className="text-sm font-semibold text-gray-500">60 gün içinde planlı bakım yok</p>
                  <Link href="/app/maintenance-plans" className="mt-3 text-xs text-blue-600 hover:underline">Bakım planı oluştur →</Link>
                </div>
              ) : (
                <>
                  <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-2 flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Yaklaşan Bakımlar ({plans.length})</span>
                    {plans.length > 0 && (
                      <button onClick={() => downloadIcs(plans)} className="text-[10px] text-gray-400 hover:text-blue-600 font-semibold transition-colors">
                        Tümünü .ics ↓
                      </button>
                    )}
                  </div>
                  <div className="divide-y divide-gray-100">
                    {plans.map(p => {
                      const daysLeft = Math.ceil((new Date(p.nextDueAt).getTime() - Date.now()) / 86400000);
                      const dateStr = new Date(p.nextDueAt).toLocaleDateString("tr-TR", { day: "numeric", month: "short", weekday: "short" });

                      return (
                        <div key={p.id} className={`px-4 py-3 hover:bg-gray-50 transition-colors ${daysLeft < 0 ? "bg-red-50" : daysLeft <= 3 ? "bg-amber-50" : ""}`}>
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 min-w-0">
                              {/* Date badge */}
                              <div className={`flex-shrink-0 text-center rounded-xl px-2 py-1 min-w-[48px] ${
                                daysLeft < 0 ? "bg-red-100 text-red-800" :
                                daysLeft <= 3 ? "bg-amber-100 text-amber-800" :
                                daysLeft <= 7 ? "bg-yellow-100 text-yellow-800" :
                                "bg-blue-100 text-blue-800"
                              }`}>
                                <div className="text-[10px] font-bold leading-none">
                                  {new Date(p.nextDueAt).toLocaleDateString("tr-TR", { month: "short" }).toUpperCase()}
                                </div>
                                <div className="text-lg font-black leading-tight">
                                  {new Date(p.nextDueAt).getDate()}
                                </div>
                              </div>

                              <div className="min-w-0 flex-1">
                                <p className="font-bold text-gray-900 text-sm leading-tight truncate">{p.asset.customer.name}</p>
                                <p className="text-xs text-gray-600 truncate">{p.asset.name}{p.asset.buildingName ? ` · ${p.asset.buildingName}` : ""}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                                    daysLeft < 0 ? "bg-red-200 text-red-800" :
                                    daysLeft <= 3 ? "bg-amber-200 text-amber-800" :
                                    daysLeft <= 7 ? "bg-yellow-200 text-yellow-800" :
                                    "bg-blue-200 text-blue-800"
                                  }`}>
                                    {daysLeft < 0 ? `${Math.abs(daysLeft)} gün gecikti!` :
                                     daysLeft === 0 ? "Bugün!" :
                                     `${daysLeft} gün`}
                                  </span>
                                  {p.name && <span className="text-[10px] text-gray-400 truncate">{p.name}</span>}
                                </div>
                              </div>
                            </div>

                            {/* Google Calendar button */}
                            <a
                              href={googleCalendarUrl(p)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-shrink-0 flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-[10px] font-semibold text-gray-600 hover:border-blue-300 hover:text-blue-700 hover:bg-blue-50 transition-all"
                              title="Google Calendar'a ekle"
                            >
                              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                              </svg>
                              <span>GCal</span>
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Main Dashboard ─── */
export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentWOs, setRecentWOs] = useState<WO[]>([]);
  const [overdueList, setOverdueList] = useState<OverduePlan[]>([]);
  const [upcomingPlans, setUpcomingPlans] = useState<UpcomingPlan[]>([]);
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
        setUpcomingPlans(d.upcomingPlans ?? []);
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
      <div className="font-bold mb-1">Hata</div><div className="text-sm">{error}</div>
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
          { title: "Müşteri",        val: stats.customers,  href: "/app/customers",         tone: "" },
          { title: "Asansör",        val: stats.assets,     href: "/app/assets",            tone: "" },
          { title: "İş Emri",        val: stats.workOrders, href: "/app/work-orders",        tone: "" },
          { title: "Acil",           val: stats.urgent,     href: "/app/work-orders",        tone: stats.urgent > 0 ? "danger" : "" },
          { title: "Bu Hafta Bakım", val: stats.dueSoon,    href: "/app/maintenance-plans", tone: stats.dueSoon > 0 ? "warn" : "" },
          { title: "Gecikmiş Bakım", val: stats.overdue,    href: "/app/maintenance-plans", tone: stats.overdue > 0 ? "danger" : "" },
        ].map(k => (
          <Link key={k.title} href={k.href}
            className={`rounded-2xl border bg-white p-5 shadow-sm hover:shadow-md transition-shadow ${k.tone === "danger" ? "border-red-200" : k.tone === "warn" ? "border-amber-200" : "border-gray-200"}`}>
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">{k.title}</div>
            <div className={`mt-1 text-3xl font-extrabold tracking-tight ${k.tone === "danger" ? "text-red-600" : k.tone === "warn" ? "text-amber-700" : "text-gray-900"}`}>{k.val}</div>
          </Link>
        ))}
      </div>

      {/* Quick access + risky */}
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

      {/* ── CALENDAR WIDGET ── */}
      <MiniCalendar plans={upcomingPlans} />

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
