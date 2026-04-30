"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type StepId = "welcome"|"customer"|"asset"|"maintenance"|"workorder"|"done";

const STEPS: { id: StepId; icon: string; title: string; desc: string; cta: string; href?: string; }[] = [
  {
    id:    "welcome",
    icon:  "👋",
    title: "Servisim'e Hoş Geldiniz!",
    desc:  "Bu sihirbaz sizi 5 adımda platforma tanıştıracak. İstediğiniz zaman atlayabilirsiniz.",
    cta:   "Başlayalım →",
  },
  {
    id:    "customer",
    icon:  "🏢",
    title: "1. İlk müşterinizi ekleyin",
    desc:  "Hizmet verdiğiniz bina veya firma bilgilerini girin. Müşteri kartına asansörler ve iş emirleri bağlanacak.",
    cta:   "Müşteri Ekle →",
    href:  "/app/customers/new",
  },
  {
    id:    "asset",
    icon:  "🛗",
    title: "2. Asansörü tanımlayın",
    desc:  "Müşteri kartından asansör ekleyin. Seri no, durak sayısı, taşıma kapasitesi ve kontrol markası gibi teknik bilgileri girin.",
    cta:   "Müşterilere Git →",
    href:  "/app/customers",
  },
  {
    id:    "maintenance",
    icon:  "📅",
    title: "3. Bakım planı oluşturun",
    desc:  "Asansör için aylık periyodik bakım takvimi kurun. Takip edilmesi gereken tarihler otomatik oluşturulur.",
    cta:   "Bakım Planlarına Git →",
    href:  "/app/maintenance-plans",
  },
  {
    id:    "workorder",
    icon:  "🔧",
    title: "4. İlk iş emrini açın",
    desc:  "Arıza çağrısı veya planlı bakım için iş emri açın. Teknisyen atayın ve durumu anlık izleyin.",
    cta:   "İş Emirlerine Git →",
    href:  "/app/work-orders",
  },
  {
    id:    "done",
    icon:  "🎉",
    title: "Kurulum Tamamlandı!",
    desc:  "Tebrikler! Platform kullanıma hazır. İstediğiniz zaman bu sihirbaza ayarlar menüsünden ulaşabilirsiniz.",
    cta:   "Panele Dön →",
    href:  "/app/dashboard",
  },
];

const TIPS = [
  { icon: "📊", title: "Raporlar",         desc: "Aylık bakım ve gecikme analizleri için Raporlar sekmesine göz atın." },
  { icon: "📄", title: "Sözleşmeler",      desc: "Müşteri sözleşmelerini dijital ortamda saklayın ve yenileme tarihlerini takip edin." },
  { icon: "🧾", title: "Fatura Oluşturma", desc: "İş emirlerinden tek tıkla PDF fatura oluşturabilirsiniz." },
  { icon: "👥", title: "Teknisyen Ekle",   desc: "Ekibinizdeki teknisyenleri tanımlayarak iş emirlerine atayın." },
  { icon: "📱", title: "Excel Yükleme",    desc: "Mevcut müşteri listelerinizi Excel dosyasıyla toplu içe aktarın." },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [current, setCurrent] = useState<StepId>("welcome");
  const stepIndex = STEPS.findIndex(s => s.id === current);
  const step = STEPS[stepIndex];
  const isLast = current === "done";
  const isFirst = current === "welcome";
  const progress = (stepIndex / (STEPS.length - 1)) * 100;

  function next() {
    if (stepIndex < STEPS.length - 1) setCurrent(STEPS[stepIndex + 1].id);
  }
  function prev() {
    if (stepIndex > 0) setCurrent(STEPS[stepIndex - 1].id);
  }
  function goTo(href: string) {
    // Navigate to target, then come back to next step
    if (stepIndex < STEPS.length - 1) setCurrent(STEPS[stepIndex + 1].id);
    router.push(href);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[#0f1623]">Başlangıç Sihirbazı</h1>
          <p className="text-sm text-[#64748b] mt-0.5">Platformu 5 adımda keşfedin</p>
        </div>
        <Link href="/app/dashboard" className="rounded-lg border border-[#e2e8f0] px-3 py-1.5 text-xs font-semibold text-[#64748b] hover:bg-[#f4f5f7] transition-colors">
          Atla →
        </Link>
      </div>

      {/* Progress bar */}
      <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-[0_1px_4px_rgba(15,22,35,.06)]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-[#94a3b8]">İlerleme</span>
          <span className="text-xs font-bold text-[#2563eb]">{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-[#f0f2f5] rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex justify-between mt-3">
          {STEPS.map((s, i) => (
            <button key={s.id} onClick={() => setCurrent(s.id)}
              className={`flex flex-col items-center gap-1 group ${i <= stepIndex ? "opacity-100" : "opacity-40"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm border-2 transition-all
                ${i < stepIndex ? "bg-blue-600 border-blue-600 text-white" :
                  i === stepIndex ? "bg-white border-blue-600 text-blue-600 font-bold shadow-sm" :
                  "bg-white border-[#e2e8f0] text-[#94a3b8]"}`}>
                {i < stepIndex ? "✓" : s.icon === "👋" ? "★" : i}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Current step card */}
      <div className="rounded-2xl border border-[#e2e8f0] bg-white shadow-[0_1px_4px_rgba(15,22,35,.06)] overflow-hidden">
        {/* Step content */}
        <div className="p-8 text-center">
          <div className="text-6xl mb-5">{step.icon}</div>
          <h2 className="text-2xl font-black text-[#0f1623] tracking-tight mb-3">{step.title}</h2>
          <p className="text-sm text-[#64748b] leading-relaxed max-w-sm mx-auto">{step.desc}</p>
        </div>

        {/* Actions */}
        <div className="px-8 pb-8 flex flex-col gap-3">
          {step.href ? (
            <button onClick={() => goTo(step.href!)}
              className="w-full rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700 shadow-sm transition-all hover:-translate-y-0.5">
              {step.cta}
            </button>
          ) : isLast ? (
            <Link href="/app/dashboard"
              className="block text-center w-full rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700 shadow-sm transition-all hover:-translate-y-0.5">
              {step.cta}
            </Link>
          ) : (
            <button onClick={next}
              className="w-full rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700 shadow-sm transition-all hover:-translate-y-0.5">
              {step.cta}
            </button>
          )}

          {step.href && (
            <button onClick={next}
              className="w-full rounded-xl border border-[#e2e8f0] bg-white px-5 py-2.5 text-sm font-semibold text-[#64748b] hover:bg-[#f4f5f7] transition-colors">
              Zaten yaptım, devam et →
            </button>
          )}

          {!isFirst && (
            <button onClick={prev} className="text-xs text-[#94a3b8] hover:text-[#64748b] transition-colors mt-1">
              ← Önceki adım
            </button>
          )}
        </div>
      </div>

      {/* Quick tips (only on done step) */}
      {isLast && (
        <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-[0_1px_4px_rgba(15,22,35,.06)]">
          <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#94a3b8] mb-4">💡 İpuçları</div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {TIPS.map(t => (
              <div key={t.title} className="flex gap-3 p-3 rounded-xl border border-[#f0f2f5] hover:border-blue-200 hover:bg-[#f0f7ff] transition-all">
                <span className="text-xl flex-shrink-0 mt-0.5">{t.icon}</span>
                <div>
                  <div className="text-xs font-bold text-[#0f1623] mb-0.5">{t.title}</div>
                  <div className="text-xs text-[#64748b] leading-relaxed">{t.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step list overview */}
      <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-[0_1px_4px_rgba(15,22,35,.06)]">
        <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#94a3b8] mb-3">Tüm Adımlar</div>
        <div className="space-y-2">
          {STEPS.filter(s => s.id !== "welcome").map((s, i) => {
            const actualIdx = STEPS.findIndex(x => x.id === s.id);
            const done = actualIdx < stepIndex;
            const active = s.id === current;
            return (
              <button key={s.id} onClick={() => setCurrent(s.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all
                  ${active ? "bg-[#eff6ff] border border-blue-200" : "hover:bg-[#f8f9fb] border border-transparent"}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                  ${done ? "bg-green-100 text-green-700" : active ? "bg-blue-600 text-white" : "bg-[#f0f2f5] text-[#94a3b8]"}`}>
                  {done ? "✓" : i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-semibold ${active ? "text-blue-700" : done ? "text-[#64748b]" : "text-[#0f1623]"}`}>{s.title}</div>
                </div>
                {s.href && (
                  <svg className={`w-4 h-4 flex-shrink-0 ${active ? "text-blue-400" : "text-[#c0c8d4]"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
