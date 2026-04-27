"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type WorkOrder = {
  id: string; code: string; status: string; type: string;
  scheduledAt?: string | null;
  customer: { name: string };
  technician?: { name: string; initials?: string | null } | null;
  asset?: { name: string } | null;
};

const TYPE_LABELS: Record<string, string> = {
  FAULT: "Arıza", PERIODIC_MAINTENANCE: "Periyodik", ANNUAL_INSPECTION: "Muayene",
  REVISION: "Revizyon", INSTALLATION: "Kurulum",
};
const STATUS_CLS: Record<string, string> = {
  URGENT:      "bg-red-500",
  IN_PROGRESS: "bg-amber-400",
  DONE:        "bg-emerald-500",
  PENDING:     "bg-blue-400",
  CANCELED:    "bg-gray-300",
};
const STATUS_LABEL: Record<string, string> = {
  URGENT: "Acil", IN_PROGRESS: "Devam", DONE: "Bitti", PENDING: "Planlı", CANCELED: "İptal",
};

const DAYS_TR = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
const MONTHS_TR = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];

function startOfMonth(y: number, m: number) { return new Date(y, m, 1); }
function daysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate(); }
// Monday-first: Sun=6, Mon=0
function dayOfWeekMon(d: Date) { return (d.getDay() + 6) % 7; }

export default function CalendarPage() {
  const today = new Date();
  const [year, setYear]  = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [view, setView]  = useState<"month" | "week">("month");
  const [items, setItems] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<string | null>(null); // YYYY-MM-DD
  const [weekStart, setWeekStart] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() - dayOfWeekMon(d));
    d.setHours(0,0,0,0);
    return d;
  });

  useEffect(() => {
    fetch("/api/work-orders")
      .then(r => r.json())
      .then(d => setItems((d.items ?? []).filter((x: WorkOrder) => x.scheduledAt)))
      .finally(() => setLoading(false));
  }, []);

  // Group by date string YYYY-MM-DD
  const byDate = useMemo(() => {
    const map: Record<string, WorkOrder[]> = {};
    items.forEach(w => {
      if (!w.scheduledAt) return;
      const key = w.scheduledAt.slice(0, 10);
      if (!map[key]) map[key] = [];
      map[key].push(w);
    });
    return map;
  }, [items]);

  function prevMonth() { if (month === 0) { setYear(y => y-1); setMonth(11); } else setMonth(m => m-1); }
  function nextMonth() { if (month === 11) { setYear(y => y+1); setMonth(0); } else setMonth(m => m+1); }
  function prevWeek() { setWeekStart(d => { const n = new Date(d); n.setDate(n.getDate()-7); return n; }); }
  function nextWeek() { setWeekStart(d => { const n = new Date(d); n.setDate(n.getDate()+7); return n; }); }

  const toKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;

  // Month grid
  const monthGrid = useMemo(() => {
    const firstDay = startOfMonth(year, month);
    const offset = dayOfWeekMon(firstDay);
    const total = daysInMonth(year, month);
    const cells: (number | null)[] = [];
    for (let i = 0; i < offset; i++) cells.push(null);
    for (let d = 1; d <= total; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [year, month]);

  // Week days
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [weekStart]);

  const todayKey = toKey(today);

  const selectedWOs = selectedDay ? (byDate[selectedDay] ?? []) : [];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Takvim</h1>
          <p className="text-sm text-gray-500">Planlanan iş emirleri ve bakım takvimi</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl border border-gray-200 bg-white overflow-hidden text-sm font-semibold">
            <button onClick={() => setView("month")} className={`px-4 py-2 transition-colors ${view==="month" ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-50"}`}>Aylık</button>
            <button onClick={() => setView("week")} className={`px-4 py-2 transition-colors ${view==="week" ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-50"}`}>Haftalık</button>
          </div>
          <Link href="/app/work-orders" className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm">
            + İş Emri
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Calendar */}
        <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          {/* Nav */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <button onClick={view==="month" ? prevMonth : prevWeek}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600">‹</button>
            <div className="font-bold text-gray-900">
              {view === "month"
                ? `${MONTHS_TR[month]} ${year}`
                : `${weekDays[0].getDate()} ${MONTHS_TR[weekDays[0].getMonth()]} – ${weekDays[6].getDate()} ${MONTHS_TR[weekDays[6].getMonth()]} ${weekDays[6].getFullYear()}`
              }
            </div>
            <button onClick={view==="month" ? nextMonth : nextWeek}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600">›</button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-gray-100">
            {DAYS_TR.map(d => (
              <div key={d} className="py-2 text-center text-xs font-semibold uppercase tracking-wide text-gray-400">{d}</div>
            ))}
          </div>

          {/* Month view */}
          {view === "month" && (
            <div className="grid grid-cols-7">
              {monthGrid.map((day, idx) => {
                if (!day) return <div key={`e${idx}`} className="border-b border-r border-gray-50 min-h-[80px]" />;
                const key = `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
                const wos = byDate[key] ?? [];
                const isToday = key === todayKey;
                const isSelected = key === selectedDay;
                return (
                  <button key={key} onClick={() => setSelectedDay(isSelected ? null : key)}
                    className={`border-b border-r border-gray-100 min-h-[80px] p-1.5 text-left transition-colors ${isSelected ? "bg-blue-50" : "hover:bg-gray-50"}`}>
                    <div className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${isToday ? "bg-blue-600 text-white" : "text-gray-700"}`}>
                      {day}
                    </div>
                    <div className="mt-1 space-y-0.5">
                      {wos.slice(0, 3).map(w => (
                        <div key={w.id} className={`flex items-center gap-1 rounded px-1 py-0.5 ${STATUS_CLS[w.status] ?? "bg-gray-300"} bg-opacity-20`}>
                          <div className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${STATUS_CLS[w.status] ?? "bg-gray-400"}`} />
                          <span className="text-xs font-medium text-gray-700 truncate">{w.customer.name}</span>
                        </div>
                      ))}
                      {wos.length > 3 && <div className="text-xs text-gray-400 pl-1">+{wos.length-3}</div>}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Week view */}
          {view === "week" && (
            <div className="grid grid-cols-7">
              {weekDays.map(d => {
                const key = toKey(d);
                const wos = byDate[key] ?? [];
                const isToday = key === todayKey;
                const isSelected = key === selectedDay;
                return (
                  <button key={key} onClick={() => setSelectedDay(isSelected ? null : key)}
                    className={`border-r border-gray-100 min-h-[200px] p-2 text-left transition-colors ${isSelected ? "bg-blue-50" : "hover:bg-gray-50"}`}>
                    <div className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold mb-2 ${isToday ? "bg-blue-600 text-white" : "text-gray-700"}`}>
                      {d.getDate()}
                    </div>
                    <div className="space-y-1">
                      {wos.map(w => (
                        <div key={w.id} className={`rounded-lg px-2 py-1.5 border-l-2 ${STATUS_CLS[w.status]?.replace("bg-","border-") ?? "border-gray-300"} bg-white border border-gray-100 shadow-sm`}>
                          <div className="text-xs font-bold text-gray-800 truncate">{w.customer.name}</div>
                          <div className="text-xs text-gray-500 truncate">{TYPE_LABELS[w.type] ?? w.type}</div>
                          {w.scheduledAt && (
                            <div className="text-xs text-gray-400">{new Date(w.scheduledAt).toLocaleTimeString("tr-TR", { hour:"2-digit", minute:"2-digit" })}</div>
                          )}
                        </div>
                      ))}
                      {wos.length === 0 && <div className="text-xs text-gray-300 text-center pt-4">—</div>}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: selected day OR upcoming */}
        <div className="space-y-4">
          {/* Selected day detail */}
          {selectedDay && (
            <div className="rounded-2xl border border-blue-200 bg-blue-50 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-blue-100">
                <div className="text-sm font-bold text-blue-900">
                  {new Date(selectedDay).toLocaleDateString("tr-TR", { weekday:"long", day:"numeric", month:"long" })}
                </div>
                <button onClick={() => setSelectedDay(null)} className="text-blue-400 hover:text-blue-600 text-xs font-bold">✕</button>
              </div>
              {selectedWOs.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-blue-400">Bu gün için planlı iş yok.</div>
              ) : (
                <div className="divide-y divide-blue-100">
                  {selectedWOs.map(w => (
                    <div key={w.id} className="px-4 py-3">
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`h-2 w-2 rounded-full ${STATUS_CLS[w.status] ?? "bg-gray-400"}`} />
                        <Link href={`/app/work-orders/${w.id}`} className="font-mono text-xs font-bold text-blue-700 hover:underline">{w.code}</Link>
                        <span className="text-xs text-blue-500">{STATUS_LABEL[w.status]}</span>
                      </div>
                      <div className="text-sm font-semibold text-gray-900">{w.customer.name}</div>
                      {w.asset && <div className="text-xs text-gray-500">{w.asset.name}</div>}
                      <div className="mt-1 flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-gray-500">{TYPE_LABELS[w.type] ?? w.type}</span>
                        {w.technician && <span className="text-xs text-gray-500">· {w.technician.name}</span>}
                        {w.scheduledAt && <span className="text-xs text-gray-400">{new Date(w.scheduledAt).toLocaleTimeString("tr-TR", { hour:"2-digit", minute:"2-digit" })}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Upcoming */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="text-sm font-bold text-gray-900">Yaklaşan İşler</div>
              <div className="text-xs text-gray-400 mt-0.5">Sonraki 14 gün</div>
            </div>
            {loading ? (
              <div className="flex justify-center py-6"><div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" /></div>
            ) : (() => {
              const now = Date.now();
              const in14 = now + 14 * 24 * 60 * 60 * 1000;
              const upcoming = items
                .filter(w => w.scheduledAt && new Date(w.scheduledAt).getTime() >= now && new Date(w.scheduledAt).getTime() <= in14)
                .sort((a, b) => new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime());
              if (upcoming.length === 0) return <div className="px-4 py-6 text-center text-sm text-gray-400">14 günde planlı iş yok.</div>;
              return (
                <div className="divide-y divide-gray-100">
                  {upcoming.map(w => (
                    <div key={w.id} className="px-4 py-3 flex items-start gap-3">
                      <div className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${STATUS_CLS[w.status] ?? "bg-gray-400"}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-gray-500">{new Date(w.scheduledAt!).toLocaleDateString("tr-TR", { day:"numeric", month:"short" })}</span>
                          <span className="text-xs text-gray-400">{new Date(w.scheduledAt!).toLocaleTimeString("tr-TR", { hour:"2-digit", minute:"2-digit" })}</span>
                        </div>
                        <div className="text-sm font-semibold text-gray-800 truncate">{w.customer.name}</div>
                        <div className="text-xs text-gray-500">{TYPE_LABELS[w.type]} {w.technician ? `· ${w.technician.name}` : ""}</div>
                      </div>
                      <Link href={`/app/work-orders/${w.id}`} className="text-xs text-blue-500 hover:underline flex-shrink-0">→</Link>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>

          {/* Stats */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">Bu Ay</div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Toplam", val: items.filter(w => { const d = w.scheduledAt ? new Date(w.scheduledAt) : null; return d && d.getMonth()===month && d.getFullYear()===year; }).length },
                { label: "Bitti",  val: items.filter(w => { const d = w.scheduledAt ? new Date(w.scheduledAt) : null; return d && d.getMonth()===month && d.getFullYear()===year && w.status==="DONE"; }).length },
                { label: "Acil",   val: items.filter(w => { const d = w.scheduledAt ? new Date(w.scheduledAt) : null; return d && d.getMonth()===month && d.getFullYear()===year && w.status==="URGENT"; }).length },
                { label: "Bekleyen",val: items.filter(w => { const d = w.scheduledAt ? new Date(w.scheduledAt) : null; return d && d.getMonth()===month && d.getFullYear()===year && w.status==="PENDING"; }).length },
              ].map(s => (
                <div key={s.label} className="text-center">
                  <div className="text-2xl font-extrabold text-gray-900">{s.val}</div>
                  <div className="text-xs text-gray-400">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
