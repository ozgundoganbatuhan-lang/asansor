"use client";

import { useEffect, useLayoutEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

/* ─── Step definitions ────────────────────────────────────────────────────── */

type SetupStep = {
  phase: "setup";
  id: string; emoji: string; color: string; bg: string;
  title: string; desc: string; tip?: string;
  href: string | null;
  beaconSelector?: string;
  beaconLabel?: string;
  pageGuideTitle?: string;
  pageGuideDesc?: string;
};
type DashStep = {
  phase: "dashboard";
  id: string; emoji: string; color: string;
  title: string; desc: string;
  selector: string;
  placement: "above" | "below" | "left" | "right";
};

const SETUP: SetupStep[] = [
  { phase:"setup", id:"welcome", emoji:"🎉", color:"#1B1F2B", bg:"#E4EFF9",
    title:"Servisim'e Hoş Geldiniz!",
    desc:"Asansör bakım operasyonunuzu birkaç dakikada dijitale taşıyalım. Kısa bir kurulum turu ile her şeyi hazır hale getirelim.",
    href:null },
  { phase:"setup", id:"customer", emoji:"👥", color:"#0ea5e9", bg:"#f0f9ff",
    title:"Adım 1 — Müşteri Ekleyin",
    desc:"Bina sahibi, site yönetimi veya kurumsal firmayı müşteri olarak kaydedin. Her asansör ve sözleşme bu müşteriye bağlanacak.",
    tip:"Bir müşteriye birden fazla asansör tanımlayabilirsiniz.",
    href:"/app/customers",
    beaconSelector:"[data-tour='new-customer-btn']",
    beaconLabel:"👆 Yeni müşteri ekleyin",
    pageGuideTitle:"İlk müşteriyi ekleyin",
    pageGuideDesc:"Sağ üstteki + Yeni Müşteri butonuna tıklayın." },
  { phase:"setup", id:"asset", emoji:"🛗", color:"#7c3aed", bg:"#f5f3ff",
    title:"Adım 2 — Asansör Ekleyin",
    desc:"Müşteriye ait asansörleri sisteme tanımlayın. Asansör Kimlik Numarası (AKN) yasal zorunluluktur — plak üzerinde bulunur.",
    tip:"Marka, kapasite ve hız bilgileri muayene raporlarında gereklidir.",
    href:"/app/assets",
    beaconSelector:"[data-tour='new-asset-btn']",
    beaconLabel:"👆 Yeni asansör ekleyin",
    pageGuideTitle:"Asansör kaydedin",
    pageGuideDesc:"+ Yeni Asansör ile AKN ve teknik bilgileri girin." },
  { phase:"setup", id:"contract", emoji:"📄", color:"#059669", bg:"#ecfdf5",
    title:"Adım 3 — Sözleşme Oluşturun",
    desc:"Asansör Bakım Yönetmeliği gereği yazılı sözleşme zorunludur. Teknik sorumlu beyanını eklemeyi unutmayın.",
    tip:"Otomatik yenileme açıksa sözleşme bitişinden 30 gün önce uyarı alırsınız.",
    href:"/app/contracts",
    beaconSelector:"[data-tour='new-contract-btn']",
    beaconLabel:"👆 Yeni sözleşme oluşturun",
    pageGuideTitle:"Bakım sözleşmesi ekleyin",
    pageGuideDesc:"+ Yeni Sözleşme ile yasal sözleşmeyi dijitale taşıyın." },
  { phase:"setup", id:"plan", emoji:"📅", color:"#d97706", bg:"#FFF3DC",
    title:"Adım 4 — Bakım Planı Kurun",
    desc:"Türk hukuku gereği asansörlerin en az ayda bir bakımı zorunludur. Periyot ve asansörü seçip plan oluşturun.",
    tip:"Bir asansöre birden fazla plan eklenebilir (periyodik + yıllık muayene).",
    href:"/app/maintenance-plans",
    beaconSelector:"[data-tour='new-plan-btn']",
    beaconLabel:"👆 Bakım planı oluşturun",
    pageGuideTitle:"Periyodik bakım planı kurun",
    pageGuideDesc:"+ Yeni Bakım Planı ile hangi asansörün ne sıklıkla bakılacağını ayarlayın." },
  { phase:"setup", id:"workorder", emoji:"🔧", color:"#dc2626", bg:"#fff5f5",
    title:"Adım 5 — İş Emri Açın",
    desc:"Arıza bildirimi geldi mi? İş emri açın, teknisyen atayın, tamamlandığında faturaya dönüştürün.",
    tip:"Bakım planından 'İş Emri Oluştur →' ile tek tıkla da açabilirsiniz.",
    href:"/app/work-orders",
    beaconSelector:"[data-tour='new-wo-btn']",
    beaconLabel:"👆 İş emri açın",
    pageGuideTitle:"İlk iş emrini açın",
    pageGuideDesc:"+ Yeni İş Emri ile kayıt oluşturun ve teknisyen atayın." },
];

const DASH: DashStep[] = [
  { phase:"dashboard", id:"stats", emoji:"📊", color:"#1B1F2B",
    title:"Özet Kartlar",
    desc:"Müşteri, asansör, iş emri, acil ve gecikmiş sayılarınızı anlık görün. Her karta tıklayarak ilgili listeye gidebilirsiniz.",
    selector:"stat-cards", placement:"below" },
  { phase:"dashboard", id:"calendar", emoji:"📅", color:"#7c3aed",
    title:"Bakım Takvimi",
    desc:"Yaklaşan bakımlarınızı günlük takvimde görün. Tarihe tıklayarak Google Calendar'a ekleyebilir, toplu ICS olarak dışa aktarabilirsiniz.",
    selector:"mini-calendar", placement:"right" },
  { phase:"dashboard", id:"recent-wo", emoji:"🔧", color:"#0ea5e9",
    title:"Son İş Emirleri",
    desc:"Durumlar renkli etiketlerle: kırmızı = acil, sarı = devam ediyor, yeşil = tamamlandı. Tümü → ile tam listeye geçin.",
    selector:"recent-wo", placement:"left" },
  { phase:"dashboard", id:"low-stock", emoji:"📦", color:"#ea580c",
    title:"Azalan Stoklar",
    desc:"Minimum stok limitine yaklaşan parçalar burada görünür. Doluluk barı: kırmızı = tükendi, turuncu = kritik, sarı = düşük.",
    selector:"low-stock", placement:"above" },
  { phase:"dashboard", id:"invoices", emoji:"💰", color:"#16a34a",
    title:"Aylık Fatura Özeti",
    desc:"Bu ayın toplam fatura tutarı ve 6 aylık trend grafik. Koyu yeşil çubuk bu ayı, açık çubuklar geçmiş ayları gösterir.",
    selector:"invoice-summary", placement:"above" },
];

const KEY = "servisim_onboarding_v3";
type S = { phase:"setup"|"dashboard"|"done"; si:number; di:number };
const load = (): S => { try { const r=localStorage.getItem(KEY); return r?JSON.parse(r):{phase:"setup",si:0,di:0}; } catch { return {phase:"setup",si:0,di:0}; } };
const save = (s:S) => { try { localStorage.setItem(KEY,JSON.stringify(s)); } catch {} };

/* ─── Component ───────────────────────────────────────────────────────────── */
export default function OnboardingTour() {
  const router   = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted]   = useState(false);
  const [st, setSt]             = useState<S>({phase:"setup",si:0,di:0});
  const [open, setOpen]         = useState(false);
  const [rect, setRect]         = useState<DOMRect|null>(null);
  const raf = useRef<number>(0);

  const searchParams = useSearchParams();

  useEffect(() => {
    setMounted(true);
    const isFirstEver = !localStorage.getItem(KEY);
    const isWelcomeParam = searchParams?.get("welcome") === "1";
    const s = load();
    setSt(s);
    if (s.phase === "done") return; // already completed — never show again
    if (isFirstEver || isWelcomeParam) {
      // First visit OR fresh registration redirect → auto-open
      save({ phase: "setup", si: 0, di: 0 }); // reset to step 0 for ?welcome=1
      setTimeout(() => setOpen(true), 700);
    }
    // Otherwise: FAB is shown, user clicks to reopen
  }, [searchParams]);

  const upd = useCallback((s:S) => { setSt(s); save(s); }, []);

  useLayoutEffect(() => {
    if (!mounted || st.phase !== "dashboard" || !open) { setRect(null); return; }
    const ds = DASH[st.di]; if (!ds) return;
    const measure = () => {
      const el = document.querySelector(`[data-tour="${ds.selector}"]`);
      if (el) setRect(el.getBoundingClientRect());
    };
    measure();
    raf.current = requestAnimationFrame(measure);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => { cancelAnimationFrame(raf.current); window.removeEventListener("resize",measure); window.removeEventListener("scroll",measure,true); };
  }, [mounted, st.phase, st.di, open]);

  if (!mounted || st.phase === "done") return null;

  const cs  = SETUP[st.si];
  const cd  = DASH[st.di];
  const onSetupPage = st.phase==="setup" && st.si>0 && cs?.href && pathname===cs.href;
  const onDash      = pathname==="/app/dashboard";
  const setupPct    = Math.round((st.si/(SETUP.length-1))*100);

  function advSetup() {
    const ni = st.si+1;
    if (ni>=SETUP.length) { upd({phase:"dashboard",si:st.si,di:0}); router.push("/app/dashboard"); setOpen(false); }
    else { upd({...st,si:ni}); const ns=SETUP[ni]; if(ns.href) router.push(ns.href); setOpen(false); }
  }
  function advDash() {
    const ni = st.di+1;
    if (ni>=DASH.length) upd({phase:"done",si:st.si,di:st.di});
    else upd({...st,di:ni});
  }
  function back() {
    if (st.phase==="dashboard" && st.di>0) upd({...st,di:st.di-1});
    else if (st.phase==="setup" && st.si>0) upd({...st,si:st.si-1});
  }
  function skip() { upd({phase:"done",si:st.si,di:st.di}); setOpen(false); }

  /* ── Dashboard spotlight ────────────────────────────────────────────────── */
  if (st.phase==="dashboard" && onDash && open && cd && rect) {
    const PAD=14, CW=340, CH=190, vw=window.innerWidth, vh=window.innerHeight;
    const cx=rect.left+rect.width/2, cy=rect.top+rect.height/2;
    let ct=0, cl=0;
    if (cd.placement==="below")      { ct=Math.min(rect.bottom+16,vh-CH-16); cl=Math.min(Math.max(cx-CW/2,12),vw-CW-12); }
    else if (cd.placement==="above") { ct=Math.max(rect.top-CH-16,16);       cl=Math.min(Math.max(cx-CW/2,12),vw-CW-12); }
    else if (cd.placement==="right") { ct=Math.min(Math.max(cy-CH/2,16),vh-CH-16); cl=Math.min(rect.right+16,vw-CW-12); }
    else                             { ct=Math.min(Math.max(cy-CH/2,16),vh-CH-16); cl=Math.max(rect.left-CW-16,12); }
    const isLast=st.di===DASH.length-1;
    return (
      <>
        <style>{CSS}</style>
        {/* dim overlay with mask hole */}
        <div style={{position:"fixed",inset:0,zIndex:9990,pointerEvents:"none",
          background:"rgba(5,10,20,0.55)",
          WebkitMaskImage:`radial-gradient(ellipse ${rect.width+PAD*2}px ${rect.height+PAD*2}px at ${cx}px ${cy}px,transparent 100%,black 100%)`,
          maskImage:`radial-gradient(ellipse ${rect.width+PAD*2}px ${rect.height+PAD*2}px at ${cx}px ${cy}px,transparent 100%,black 100%)`}}/>
        {/* highlight ring */}
        <div style={{position:"fixed",top:rect.top-PAD,left:rect.left-PAD,width:rect.width+PAD*2,height:rect.height+PAD*2,
          borderRadius:16,border:`2px solid ${cd.color}`,
          boxShadow:`0 0 0 4px ${cd.color}22,0 0 28px ${cd.color}44`,
          zIndex:9991,pointerEvents:"none",animation:"tourRing 2s ease-in-out infinite"}}/>
        {/* callout card */}
        <div style={{position:"fixed",top:ct,left:cl,width:CW,zIndex:9995,animation:"otSlideUp .3s cubic-bezier(.16,1,.3,1)",fontFamily:"'Plus Jakarta Sans',system-ui,sans-serif"}}>
          <div style={{background:"#fff",borderRadius:16,overflow:"hidden",boxShadow:"0 20px 60px rgba(5,10,20,.25),0 0 0 1px rgba(5,10,20,.07)"}}>
            <div style={{height:3,background:cd.color}}/>
            <div style={{padding:"14px 16px 12px"}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                <div style={{width:34,height:34,borderRadius:10,background:`${cd.color}14`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>{cd.emoji}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:9.5,fontWeight:800,textTransform:"uppercase" as const,letterSpacing:"0.09em",color:cd.color}}>{st.di+1}/{DASH.length} — Panel Turu</div>
                  <h3 style={{margin:0,fontSize:13.5,fontWeight:900,color:"#0f1623",letterSpacing:"-0.02em"}}>{cd.title}</h3>
                </div>
                <button onClick={skip} style={{background:"none",border:"none",cursor:"pointer",color:"#d0d7e2",fontSize:18,lineHeight:1,padding:2,flexShrink:0}}>×</button>
              </div>
              <p style={{margin:"0 0 12px",fontSize:12.5,color:"#4b5a6e",lineHeight:1.7}}>{cd.desc}</p>
              <div style={{display:"flex",gap:7,justifyContent:"space-between",alignItems:"center"}}>
                <div style={{display:"flex",gap:4}}>
                  {DASH.map((_,i)=><div key={i} style={{height:3,width:i===st.di?16:5,borderRadius:10,background:i<=st.di?cd.color:"#D6D0C4",transition:"all .3s"}}/>)}
                </div>
                <div style={{display:"flex",gap:7}}>
                  {st.di>0 && <button onClick={back} className="otour-btn-ghost" style={{fontSize:11.5,padding:"6px 11px"}}>← Geri</button>}
                  <button onClick={advDash} className="otour-btn-primary" style={{background:cd.color,fontSize:12,padding:"7px 14px"}}>
                    {isLast?"🚀 Tamamla!":"İleri →"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  /* ── Dashboard on-page FAB (tour in progress, modal closed) ────────────── */
  if (st.phase==="dashboard" && onDash && !open) {
    return (
      <>
        <style>{CSS}</style>
        <button onClick={()=>setOpen(true)} className="otour-fab otour-fab-pulse" title="Panel turuna devam et">
          <div className="otour-fab-ring" style={{"--pct":`${Math.round((st.di/(DASH.length-1))*100)}%`} as React.CSSProperties}/>
          <div className="otour-fab-inner"><span style={{fontSize:18}}>{cd?.emoji??"📊"}</span><span style={{fontSize:9,fontWeight:800,color:"#fff"}}>{st.di+1}/{DASH.length}</span></div>
        </button>
      </>
    );
  }

  /* ── Navigate to dashboard for tour ──────────────────────────────────────── */
  if (st.phase==="dashboard" && !onDash) {
    router.push("/app/dashboard");
    return null;
  }

  /* ── On-page guide bar + beacon (setup phase, on target page) ──────────── */
  if (onSetupPage && !open && cs) {
    return (
      <>
        <style>{CSS}</style>
        <div className="otour-guide-bar">
          <div style={{display:"flex",alignItems:"center",gap:12,flex:1,minWidth:0}}>
            <div style={{width:36,height:36,borderRadius:10,background:cs.bg,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>{cs.emoji}</div>
            <div style={{minWidth:0}}>
              <div style={{fontSize:10.5,fontWeight:800,color:cs.color,letterSpacing:"0.07em",textTransform:"uppercase" as const,marginBottom:1}}>Adım {st.si}/{SETUP.length-1}</div>
              <div style={{fontSize:12.5,fontWeight:700,color:"#0f1623",whiteSpace:"nowrap" as const,overflow:"hidden",textOverflow:"ellipsis"}}>{cs.pageGuideTitle??cs.title}</div>
              <div style={{fontSize:11.5,color:"#6E6455",whiteSpace:"nowrap" as const,overflow:"hidden",textOverflow:"ellipsis"}}>{cs.pageGuideDesc??cs.desc}</div>
            </div>
          </div>
          <div style={{display:"flex",gap:8,flexShrink:0}}>
            <button onClick={()=>setOpen(true)} className="otour-btn-ghost" style={{fontSize:11.5,padding:"6px 10px"}}>?</button>
            <button onClick={advSetup} className="otour-btn-primary" style={{background:cs.color,fontSize:12,padding:"8px 16px"}}>✓ Tamamladım</button>
          </div>
        </div>
        {cs.beaconSelector && <BeaconStyle selector={cs.beaconSelector} color={cs.color} label={cs.beaconLabel??"👆 Buraya tıklayın"}/>}
      </>
    );
  }

  /* ── FAB (modal closed, setup phase) ───────────────────────────────────── */
  if (!open) {
    return (
      <>
        <style>{CSS}</style>
        <button onClick={()=>setOpen(true)} className="otour-fab" title="Kurulum sihirbazı">
          <div className="otour-fab-ring" style={{"--pct":`${setupPct}%`} as React.CSSProperties}/>
          <div className="otour-fab-inner">
            <span style={{fontSize:18,lineHeight:1}}>{cs?.emoji??"🎉"}</span>
            <span style={{fontSize:9,fontWeight:800,color:"#fff"}}>{st.si}/{SETUP.length-1}</span>
          </div>
        </button>
      </>
    );
  }

  /* ── Setup modal ────────────────────────────────────────────────────────── */
  if (!cs) return null;
  const isFirst = st.si===0;
  return (
    <>
      <style>{CSS}</style>
      <div className="otour-overlay" onClick={()=>setOpen(false)}>
        <div className="otour-modal" onClick={e=>e.stopPropagation()}>
          <div style={{height:4,background:`linear-gradient(90deg,${cs.color},${cs.color}80)`}}/>
          <div style={{display:"flex",justifyContent:"center",gap:5,padding:"13px 24px 0"}}>
            {SETUP.map((_,i)=><div key={i} style={{height:3,borderRadius:10,transition:"all .35s cubic-bezier(.16,1,.3,1)",background:i<=st.si?cs.color:"#D6D0C4",width:i===st.si?22:6}}/>)}
          </div>
          <div style={{padding:"18px 24px 0",display:"flex",alignItems:"flex-start",gap:14}}>
            <div style={{width:52,height:52,borderRadius:14,background:cs.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,flexShrink:0}}>
              {/* Display Servisim avatar for the first step; fallback to emoji for subsequent steps */}
              {isFirst ? (
                <Image src="/images/mascot.png" alt="Servisim avatar" width={52} height={52} style={{ borderRadius:14 }} />
              ) : (
                <>{cs.emoji}</>
              )}
            </div>
            <div style={{flex:1,paddingTop:2}}>
              <div style={{fontSize:10,fontWeight:800,textTransform:"uppercase" as const,letterSpacing:"0.09em",color:cs.color,marginBottom:4}}>
                {isFirst?"Kurulum Sihirbazı":`Adım ${st.si} / ${SETUP.length-1}`}
              </div>
              <h2 style={{margin:0,fontSize:17,fontWeight:900,color:"#0f1623",letterSpacing:"-0.03em",lineHeight:1.2}}>{cs.title}</h2>
            </div>
            <button onClick={()=>setOpen(false)} style={{background:"none",border:"none",cursor:"pointer",color:"#d0d7e2",fontSize:20,lineHeight:1,padding:4,flexShrink:0,marginTop:-2}}>×</button>
          </div>
          <div style={{padding:"14px 24px 0"}}>
            <p style={{margin:0,fontSize:13.5,color:"#4b5a6e",lineHeight:1.75}}>{cs.desc}</p>
            {cs.tip && (
              <div style={{marginTop:12,display:"flex",gap:9,background:"#FFF3DC",border:"1px solid #fde68a",borderRadius:10,padding:"9px 13px"}}>
                <span style={{fontSize:14,flexShrink:0}}>💡</span>
                <p style={{margin:0,fontSize:12,color:"#92400e",lineHeight:1.65}}>{cs.tip}</p>
              </div>
            )}
          </div>
          <div style={{padding:"18px 24px 22px",display:"flex",alignItems:"center",gap:8}}>
            {st.si>0 && <button onClick={back} className="otour-btn-ghost">← Geri</button>}
            <div style={{flex:1}}/>
            {!isFirst && <button onClick={skip} className="otour-btn-ghost" style={{fontSize:11.5,color:"#c0c8d4",border:"none"}}>Geç</button>}
            <button onClick={advSetup} className="otour-btn-primary" style={{background:cs.color}}>
              {isFirst?"Başla →":cs.href?`Sayfaya Git →`:"İleri →"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

/* ─── Beacon injector ─────────────────────────────────────────────────────── */
function BeaconStyle({ selector, color, label }: { selector:string; color:string; label:string }) {
  useEffect(() => {
    const style = document.createElement("style");
    style.id = "otour-beacon-style";
    const escaped = label.replace(/'/g,"\\'");
    style.textContent = `
      ${selector} { outline:2.5px solid ${color}!important; outline-offset:3px!important; animation:beaconPulse 1.8s ease-out infinite!important; position:relative!important; }
      ${selector}::after { content:'${escaped}'; position:absolute; bottom:calc(100% + 10px); left:50%; transform:translateX(-50%); background:${color}; color:#fff; font-size:11px; font-weight:700; white-space:nowrap; padding:5px 10px; border-radius:7px; box-shadow:0 4px 12px ${color}44; pointer-events:none; font-family:'Plus Jakarta Sans',system-ui,sans-serif; z-index:1000; }
      ${selector}::before { content:''; position:absolute; bottom:calc(100% + 5px); left:50%; transform:translateX(-50%); width:0; height:0; border-left:5px solid transparent; border-right:5px solid transparent; border-top:5px solid ${color}; pointer-events:none; z-index:1000; }
      @keyframes beaconPulse { 0%{box-shadow:0 0 0 0 ${color}55} 60%{box-shadow:0 0 0 10px ${color}00} 100%{box-shadow:0 0 0 0 ${color}00} }
    `;
    document.head.appendChild(style);
    return () => { document.getElementById("otour-beacon-style")?.remove(); };
  }, [selector, color, label]);
  return null;
}

/* ─── CSS ─────────────────────────────────────────────────────────────────── */
const CSS = `
  .otour-overlay { position:fixed;inset:0;z-index:9998;background:rgba(5,10,20,.52);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:20px;animation:otFadeIn .2s ease;font-family:'Plus Jakarta Sans',system-ui,sans-serif; }
  .otour-modal { background:#fff;border-radius:18px;width:100%;max-width:460px;box-shadow:0 32px 80px rgba(5,10,20,.22),0 0 0 1px rgba(5,10,20,.05);overflow:hidden;animation:otSlideUp .35s cubic-bezier(.16,1,.3,1); }
  .otour-guide-bar { position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:9000;background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:11px 14px;display:flex;align-items:center;gap:12px;box-shadow:0 12px 40px rgba(5,10,20,.13),0 0 0 1px rgba(5,10,20,.04);min-width:360px;max-width:560px;font-family:'Plus Jakarta Sans',system-ui,sans-serif;animation:otSlideUp .3s cubic-bezier(.16,1,.3,1); }
  .otour-fab { position:fixed;bottom:24px;right:24px;z-index:9000;width:58px;height:58px;border:none;background:transparent;cursor:pointer;padding:0; }
  .otour-fab-ring { position:absolute;inset:0;border-radius:50%;background:conic-gradient(#2563eb var(--pct,0%),#e2e8f0 0%);transition:background .5s; }
  .otour-fab-inner { position:absolute;inset:4px;border-radius:50%;background:#1d4ed8;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;box-shadow:0 4px 16px rgba(37,99,235,.45);transition:transform .15s; }
  .otour-fab:hover .otour-fab-inner { transform:scale(1.07); }
  .otour-fab-pulse .otour-fab-inner { animation:fabPulse 2.5s ease-in-out infinite; }
  .otour-btn-ghost { padding:8px 14px;border-radius:10px;border:1px solid #e2e8f0;background:#fff;font-size:12.5px;font-weight:600;color:#64748b;cursor:pointer;transition:all .1s;white-space:nowrap;font-family:'Plus Jakarta Sans',system-ui,sans-serif; }
  .otour-btn-ghost:hover { background:#f4f5f7; }
  .otour-btn-primary { padding:9px 20px;border-radius:10px;border:none;color:#fff;font-size:13px;font-weight:800;cursor:pointer;white-space:nowrap;box-shadow:0 3px 12px rgba(0,0,0,.18);transition:all .15s;font-family:'Plus Jakarta Sans',system-ui,sans-serif;letter-spacing:-0.01em; }
  .otour-btn-primary:hover { opacity:.9;transform:translateY(-1px); }
  @keyframes otFadeIn { from{opacity:0}to{opacity:1} }
  @keyframes otSlideUp { from{opacity:0;transform:translateY(22px) scale(.97)}to{opacity:1;transform:none} }
  @keyframes tourRing { 0%,100%{opacity:1}50%{opacity:.45} }
  @keyframes fabPulse { 0%,100%{box-shadow:0 4px 16px rgba(37,99,235,.45)}50%{box-shadow:0 4px 28px rgba(37,99,235,.75)} }
`;
