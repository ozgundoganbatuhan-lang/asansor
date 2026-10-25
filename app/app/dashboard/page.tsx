"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type WO = { id:string; code:string; type:string; status:string; createdAt:string;
  customer:{name:string}; technician?:{name:string}|null; asset?:{name:string}|null };
type OD = { id:string; nextDueAt:string; asset:{name:string;customer:{name:string}} };
type LS = { id:string; name:string; stock:number; minStock:number };
type Resp = {
  stats: { customers:number; assets:number; workOrders:number; urgent:number; dueSoon:number; overdue:number; risky:number };
  recentWOs: WO[];
  overdueList: OD[];
  lowStockParts: LS[];
  invoiceSummary: { thisMonthTotal:number; thisMonthCount:number; trend:Array<{month:string;total:number}> };
};

const fmt = (v:number) => new Intl.NumberFormat("tr-TR",{style:"currency",currency:"TRY",maximumFractionDigits:0}).format((v??0)/100);
const TYPE_L:Record<string,string> = { FAULT:"Arıza", PERIODIC_MAINTENANCE:"Aylık bakım", ANNUAL_INSPECTION:"Yıllık kontrol", REVISION:"Revizyon", INSTALLATION:"Kurulum" };
const STATUS:Record<string,{label:string;bg:string;color:string;dot:string}> = {
  URGENT:     {label:"Acil",       bg:"#FCECE8",color:"#A8301A",dot:"#C0311A"},
  IN_PROGRESS:{label:"Sahada",     bg:"#FFF3DC",color:"#8A5500",dot:"#C87800"},
  PENDING:    {label:"Planlı",     bg:"#E4EFF9",color:"#1A4F80",dot:"#1A5C96"},
  DONE:       {label:"Tamamlandı", bg:"#E8F5EE",color:"#226440",dot:"#2E7D4F"},
  CANCELED:   {label:"İptal",      bg:"#F0EDE6",color:"#6E6455",dot:"#9C9080"},
};
const MONTHS = ["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"];
const Ic = ({d,size=16}:{d:string;size?:number}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={d}/></svg>
);
const I = {
  alert:"M12 9v4M12 17h.01M10.3 3.9L2.4 18a2 2 0 001.7 3h15.8a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z",
  clock:"M12 7v5l3 2M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  cal:"M8 2v4M16 2v4M3 10h18M5 6h14a2 2 0 012 2v11a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z",
  shield:"M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6zM12 9v4M12 16h.01",
  plus:"M12 5v14M5 12h14",
  check:"M5 12l5 5L20 7",
  arrow:"M5 12h14M13 6l6 6-6 6",
  box:"M21 8l-9-5-9 5 9 5 9-5zM3 8v8l9 5 9-5V8",
};

export default function DashboardPage() {
  const [data, setData] = useState<Resp|null>(null);
  const [techCount, setTechCount] = useState<number|null>(null);
  const [error, setError] = useState<string|null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [r, t] = await Promise.all([fetch("/api/dashboard"), fetch("/api/technicians")]);
        const j = await r.json();
        if (!r.ok) setError(j.error ?? "Özet yüklenemedi. Sayfayı yenileyin."); else setData(j);
        if (t.ok) { const tj = await t.json(); setTechCount((tj.items ?? []).length); }
      } catch { setError("Bağlantı kurulamadı. İnternetinizi kontrol edip sayfayı yenileyin."); }
    })();
  }, []);

  const trend = useMemo(() => data?.invoiceSummary.trend ?? [], [data]);
  const trendMax = Math.max(1, ...trend.map(t => t.total));
  const today = new Date().toLocaleDateString("tr-TR",{day:"numeric",month:"long",weekday:"long"});
  const hour = new Date().getHours();
  const greet = hour < 11 ? "Günaydın" : hour < 18 ? "İyi günler" : "İyi akşamlar";

  if (error) return <div className="alert" role="alert">{error}</div>;
  if (!data) return (
    <div className="pg">
      <div className="skel" style={{height:52,maxWidth:320}}/>
      <div className="kpis">{[0,1,2,3].map(i=><div key={i} className="skel" style={{height:68}}/>)}</div>
      <div className="skel" style={{height:260}}/>
    </div>
  );

  const s = data.stats;
  const open = data.recentWOs.filter(w => w.status !== "DONE" && w.status !== "CANCELED");
  const steps = [
    { done: s.customers > 0, label: "İlk müşterinizi (bina/site) ekleyin", href: "/app/customers/new", hint: "Excel listeniz varsa toplu aktarın." },
    { done: s.assets > 0, label: "Asansörleri kaydedin", href: "/app/assets", hint: "Her asansöre QR etiket otomatik oluşur." },
    { done: (techCount ?? 0) > 0, label: "Teknisyenlerinizi davet edin", href: "/app/technicians", hint: "Telefonlarına Servisim'i yüklesinler." },
    { done: s.workOrders > 0, label: "İlk iş emrini oluşturun", href: "/app/work-orders", hint: "Arıza ya da bakım; teknisyen anında görür." },
  ];
  const doneCount = steps.filter(x => x.done).length;
  const alerts = [
    { n: s.urgent, label: "Acil arıza", sub: "Teknisyen bekliyor", icon: I.alert, tone: "red", href: "/app/work-orders" },
    { n: s.overdue, label: "Geciken bakım", sub: "Bakım günü geçti", icon: I.clock, tone: "red", href: "/app/maintenance-plans" },
    { n: s.dueSoon, label: "Bu hafta bakım", sub: "Önümüzdeki 7 gün", icon: I.cal, tone: "amber", href: "/app/maintenance-plans" },
    { n: s.risky, label: "Etiketli asansör", sub: "Kırmızı / sarı", icon: I.shield, tone: "amber", href: "/app/inspections" },
  ];

  return (
    <div className="pg db">
      <style>{DB_CSS}</style>
      <div className="ph">
        <div>
          <div className="ph-eyebrow">{today}</div>
          <h1 className="ph-title">{greet}</h1>
          <p className="ph-sub">{s.urgent + s.overdue > 0 ? `Bugün ilgilenmeniz gereken ${s.urgent + s.overdue} iş var.` : "Acil iş yok. Bakım planı yolunda."}</p>
        </div>
        <div className="ph-actions">
          <Link href="/app/work-orders" className="b b-ink"><Ic d={I.plus} size={14}/>Yeni iş emri</Link>
        </div>
      </div>

      {doneCount < steps.length && (
        <section className="card2 db-setup reveal" aria-labelledby="setup-t">
          <div className="db-setup-head">
            <div>
              <h2 id="setup-t">Kurulum adımları</h2>
              <p>{doneCount}/{steps.length} tamamlandı · Takıldığınız yerde 0545 169 63 88'i arayın, birlikte kuralım.</p>
            </div>
            <div className="db-ring" style={{["--p" as string]: `${(doneCount/steps.length)*100}%`}}><span>{doneCount}/{steps.length}</span></div>
          </div>
          <ol className="db-steps">
            {steps.map((st, i) => (
              <li key={i} className={st.done ? "done" : ""}>
                <span className="db-check">{st.done ? <Ic d={I.check} size={12}/> : i + 1}</span>
                <div><b>{st.label}</b><small>{st.hint}</small></div>
                {!st.done && <Link href={st.href} className="b b-sm b-line">Başla</Link>}
              </li>
            ))}
          </ol>
        </section>
      )}

      <div className="db-alerts stagger">
        {alerts.map(a => (
          <Link key={a.label} href={a.href} className={`db-alert lift press ${a.n > 0 ? a.tone : "calm"}`}>
            <span className="db-alert-ic"><Ic d={a.icon} size={16}/></span>
            <b>{a.n}</b>
            <span className="db-alert-t">{a.label}<small>{a.sub}</small></span>
          </Link>
        ))}
      </div>

      <div className="db-grid">
        <section className="card2 db-card" aria-labelledby="wo-t">
          <header><h2 id="wo-t">Açık iş emirleri</h2><Link href="/app/work-orders">Tümü <Ic d={I.arrow} size={13}/></Link></header>
          {open.length === 0 ? (
            <div className="db-empty">Açık iş emri yok.</div>
          ) : open.slice(0, 6).map(w => {
            const st = STATUS[w.status] ?? STATUS.PENDING;
            return (
              <Link key={w.id} href={`/app/work-orders/${w.id}`} className="db-row">
                <span className="sdot" style={{background: st.dot}}/>
                <div className="lt-main"><b>{w.asset?.name ?? "Asansör seçilmedi"}</b><small>{w.customer.name} · {TYPE_L[w.type] ?? w.type} · {w.technician?.name ?? "Atanmadı"}</small></div>
                <span className="st" style={{background: st.bg, color: st.color}}>{st.label}</span>
              </Link>
            );
          })}
        </section>

        <div className="db-side">
          <section className="card2 db-card" aria-labelledby="od-t">
            <header><h2 id="od-t">Geciken bakımlar</h2><Link href="/app/maintenance-plans">Plan <Ic d={I.arrow} size={13}/></Link></header>
            {data.overdueList.length === 0 ? <div className="db-empty">Geciken bakım yok.</div> :
              data.overdueList.slice(0, 5).map(o => {
                const days = Math.max(1, Math.round((Date.now() - new Date(o.nextDueAt).getTime()) / 864e5));
                return (
                  <div key={o.id} className="db-row">
                    <div className="lt-main"><b>{o.asset.name}</b><small>{o.asset.customer.name}</small></div>
                    <span className="st" style={{background:"#FCECE8",color:"#A8301A"}}>{days} gün</span>
                  </div>
                );
              })}
          </section>

          <section className="card2 db-card" aria-labelledby="rev-t">
            <header><h2 id="rev-t">Bu ay fatura</h2><Link href="/app/invoices">Faturalar <Ic d={I.arrow} size={13}/></Link></header>
            <div className="db-rev"><b>{fmt(data.invoiceSummary.thisMonthTotal)}</b><span>{data.invoiceSummary.thisMonthCount} fatura</span></div>
            {trend.length > 1 && (
              <div className="db-bars" role="img" aria-label="Son aylara göre fatura toplamı">
                {trend.map((t, i) => {
                  const m = Number(t.month.slice(5, 7)) - 1;
                  return (
                    <div key={t.month} className="db-bar">
                      <i style={{height: `${Math.max(4, (t.total / trendMax) * 100)}%`, animationDelay: `${i * 60}ms`}} title={fmt(t.total)}/>
                      <span>{MONTHS[m] ?? t.month}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {data.lowStockParts.length > 0 && (
            <section className="card2 db-card" aria-labelledby="ls-t">
              <header><h2 id="ls-t">Azalan parçalar</h2><Link href="/app/stock">Stok <Ic d={I.arrow} size={13}/></Link></header>
              {data.lowStockParts.slice(0, 4).map(p => (
                <div key={p.id} className="db-row">
                  <span style={{color:"var(--warning)"}}><Ic d={I.box} size={15}/></span>
                  <div className="lt-main"><b>{p.name}</b><small>En az {p.minStock} olmalı</small></div>
                  <span className="st" style={{background:"#FFF3DC",color:"#8A5500"}}>{p.stock} adet</span>
                </div>
              ))}
            </section>
          )}
        </div>
      </div>

      <div className="db-foot">
        <span>{s.customers} müşteri</span><span>{s.assets} asansör</span><span>{s.workOrders} iş emri</span>
      </div>
    </div>
  );
}

const DB_CSS = `
.db-setup{padding:16px 18px;display:grid;gap:12px;background:linear-gradient(180deg,#fff, #FBF9F4)}
.db-setup-head{display:flex;justify-content:space-between;gap:16px;align-items:center}
.db-setup h2{margin:0;font-size:15px;font-weight:750;letter-spacing:-.02em}
.db-setup p{margin:3px 0 0;font-size:12.5px;color:var(--muted)}
.db-ring{width:46px;height:46px;border-radius:50%;flex-shrink:0;display:grid;place-items:center;background:conic-gradient(var(--sidebar-accent) var(--p),var(--surface-3) 0)}
.db-ring span{width:36px;height:36px;border-radius:50%;background:#fff;display:grid;place-items:center;font-size:11px;font-weight:800}
.db-steps{list-style:none;margin:0;padding:0;display:grid;gap:6px}
.db-steps li{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:10px;background:var(--surface);box-shadow:inset 0 0 0 1px var(--border)}
.db-steps li>div{flex:1;min-width:0}
.db-steps b{display:block;font-size:13px;font-weight:650}
.db-steps small{display:block;font-size:12px;color:var(--muted)}
.db-steps li.done{opacity:.6}
.db-steps li.done b{text-decoration:line-through}
.db-check{width:22px;height:22px;border-radius:50%;display:grid;place-items:center;flex-shrink:0;font-size:11px;font-weight:800;background:var(--surface-2);color:var(--muted)}
.done .db-check{background:var(--success);color:#fff}
.db-alerts{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}
.db-alert{display:grid;grid-template-columns:auto 1fr;grid-template-rows:auto auto;column-gap:10px;align-items:center;padding:12px 14px;border-radius:12px;background:var(--surface);border:1px solid var(--border);color:inherit}
.db-alert-ic{grid-row:span 2;width:32px;height:32px;border-radius:9px;display:grid;place-items:center;background:var(--surface-2);color:var(--muted)}
.db-alert b{font-size:22px;font-weight:800;letter-spacing:-.04em;line-height:1;font-variant-numeric:tabular-nums}
.db-alert-t{font-size:12px;font-weight:650;color:var(--foreground-2)}
.db-alert-t small{display:block;font-size:11px;font-weight:500;color:var(--muted-2)}
.db-alert.red{border-color:var(--danger-border);background:#FFF8F6}.db-alert.red .db-alert-ic{background:var(--danger-soft);color:var(--danger)}.db-alert.red b{color:var(--danger)}
.db-alert.amber{border-color:var(--warning-border);background:#FFFBF2}.db-alert.amber .db-alert-ic{background:var(--warning-soft);color:var(--warning)}.db-alert.amber b{color:var(--warning)}
.db-alert.calm .db-alert-ic{background:var(--success-soft);color:var(--success)}
.db-grid{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(0,1fr);gap:12px;align-items:start}
.db-side{display:grid;gap:12px}
.db-card{overflow:hidden}
.db-card header{display:flex;justify-content:space-between;align-items:center;padding:12px 16px;border-bottom:1px solid var(--surface-3)}
.db-card h2{margin:0;font-size:13.5px;font-weight:750;letter-spacing:-.01em}
.db-card header a{display:inline-flex;align-items:center;gap:4px;font-size:12px;font-weight:650;color:var(--muted)}
.db-card header a:hover{color:var(--foreground)}
.db-row{display:flex;align-items:center;gap:10px;padding:10px 16px;border-top:1px solid var(--surface-3);color:inherit;transition:background .12s}
.db-row:first-of-type{border-top:0}
a.db-row:hover{background:#FAF8F4}
.db-row .lt-main{flex:1}
.db-empty{padding:22px 16px;font-size:13px;color:var(--muted);text-align:center}
.db-rev{display:flex;align-items:baseline;gap:10px;padding:14px 16px 6px}
.db-rev b{font-size:26px;font-weight:800;letter-spacing:-.04em;font-variant-numeric:tabular-nums}
.db-rev span{font-size:12px;color:var(--muted)}
.db-bars{display:flex;align-items:flex-end;gap:8px;height:110px;padding:8px 16px 14px}
.db-bar{flex:1;height:100%;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;gap:6px}
.db-bar i{display:block;width:100%;max-width:28px;border-radius:6px 6px 3px 3px;background:var(--sidebar-accent);transform-origin:bottom;animation:grow .7s var(--ease-out) both}
.db-bar:last-child i{background:var(--primary)}
.db-bar span{font-size:10.5px;color:var(--muted-2)}
@keyframes grow{from{transform:scaleY(0)}}
.db-foot{display:flex;gap:16px;flex-wrap:wrap;font-size:12px;color:var(--muted-2)}
@media(max-width:900px){.db-grid{grid-template-columns:minmax(0,1fr)}}
@media(max-width:760px){.db-alerts{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.db-alert{padding:10px 12px}.db-alert b{font-size:19px}}
`;
