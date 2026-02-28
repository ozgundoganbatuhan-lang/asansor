"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";

type Step = {
  id: string;
  title: string;
  description: string;
  path: string;
  icon: string;
  action?: string;
  actionPath?: string;
  tip?: string;
};

const STEPS: Step[] = [
  {
    id: "welcome",
    title: "Servisim'e Hoş Geldiniz 🎉",
    description: "Asansör bakım operasyonunuzu dijitale taşıyalım. Kurulum 5 adım, toplam 10 dakika sürer.",
    path: "/app/dashboard",
    icon: "🏠",
    tip: "Bu turu istediğiniz zaman sağ alt köşedeki '?' butonundan yeniden başlatabilirsiniz.",
  },
  {
    id: "customer",
    title: "1. Müşteri Ekleyin",
    description: "Her şey bir müşteriyle başlar. Bina sahibi, site yönetimi veya işyeri — kim olursa olsun önce müşteri kartı oluşturun.",
    path: "/app/customers",
    icon: "👥",
    action: "Müşteri Ekle →",
    actionPath: "/app/customers/new",
    tip: "Vergi No, muhasebe entegrasyonu için önemli. Sonra da ekleyebilirsiniz.",
  },
  {
    id: "asset",
    title: "2. Asansör Tanımlayın",
    description: "Müşteri eklendikten sonra o müşteriye ait asansörleri tanımlayın. Bir müşterinin birden fazla asansörü olabilir.",
    path: "/app/assets",
    icon: "🛗",
    action: "Asansör Ekle →",
    actionPath: "/app/assets",
    tip: "Asansör Kimlik Numarası yasal zorunluluktur — yönetmelik gereği sözleşmede bulunması gerekir.",
  },
  {
    id: "contract",
    title: "3. Sözleşme Oluşturun",
    description: "Yasal uyumlu bakım sözleşmesini dijital olarak kaydedin. Teknik sorumlu beyanı ve şifreleme bildirimi yönetmelik gereği zorunludur.",
    path: "/app/contracts",
    icon: "📄",
    action: "Sözleşme Oluştur →",
    actionPath: "/app/contracts",
    tip: "Otomatik yenileme açıksa, sözleşme bitmeden 30 gün önce uyarı alırsınız.",
  },
  {
    id: "plan",
    title: "4. Bakım Planı Kurun",
    description: "Asansöre periyodik bakım planı ekleyin. Aylık mı, 3 aylık mı, özel mi — siz belirleyin. Bir asansöre birden fazla plan eklenebilir.",
    path: "/app/maintenance-plans",
    icon: "📅",
    action: "Plan Oluştur →",
    actionPath: "/app/maintenance-plans",
    tip: "Türk hukuku gereği periyodik bakım en az ayda bir yapılmalıdır.",
  },
  {
    id: "workorder",
    title: "5. İş Emri Açın",
    description: "Arıza mı geldi? Planlı bakım zamanı mı? İş emri açın, teknisyen atayın, takip başlasın.",
    path: "/app/work-orders",
    icon: "🔧",
    action: "İş Emri Oluştur →",
    actionPath: "/app/work-orders",
    tip: "İş emri tamamlandığında tek tıkla faturaya dönüştürebilirsiniz.",
  },
  {
    id: "done",
    title: "Kurulum Tamamlandı! 🚀",
    description: "Harika! Artık sistemi aktif olarak kullanmaya hazırsınız. Takvim, fatura, muhasebe entegrasyonu ve daha fazlası sizi bekliyor.",
    path: "/app/dashboard",
    icon: "✅",
    tip: "Sorularınız için destek: destek@servisim.com",
  },
];

const STORAGE_KEY = "servisim_onboarding_v1";

export default function OnboardingTour() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isDismissed, setIsDismissed] = useState(true); // start hidden, check storage
  const [isMinimized, setIsMinimized] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      // First visit — auto-open after 1 second
      setTimeout(() => {
        setIsDismissed(false);
        setIsOpen(true);
      }, 800);
    } else {
      const data = JSON.parse(stored);
      if (!data.completed && !data.dismissed) {
        setIsDismissed(false);
        setCurrentStep(data.step ?? 0);
      } else if (data.dismissed) {
        setIsDismissed(true);
      }
    }
  }, []);

  const save = useCallback((step: number, completed = false, dismissed = false) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ step, completed, dismissed }));
  }, []);

  const next = () => {
    const nextStep = currentStep + 1;
    if (nextStep >= STEPS.length) {
      save(0, true);
      setIsOpen(false);
      setIsDismissed(true);
      return;
    }
    setCurrentStep(nextStep);
    save(nextStep);
    if (STEPS[nextStep].path !== pathname) {
      router.push(STEPS[nextStep].path);
    }
  };

  const prev = () => {
    const prevStep = Math.max(0, currentStep - 1);
    setCurrentStep(prevStep);
    save(prevStep);
  };

  const goToStep = (i: number) => {
    setCurrentStep(i);
    save(i);
    if (STEPS[i].path !== pathname) {
      router.push(STEPS[i].path);
    }
  };

  const dismiss = () => {
    save(currentStep, false, true);
    setIsOpen(false);
    setIsDismissed(true);
  };

  const restart = () => {
    save(0, false, false);
    setCurrentStep(0);
    setIsDismissed(false);
    setIsOpen(true);
    router.push(STEPS[0].path);
  };

  const step = STEPS[currentStep];
  const progress = Math.round((currentStep / (STEPS.length - 1)) * 100);
  const isLast = currentStep === STEPS.length - 1;

  return (
    <>
      {/* Floating restart button — always visible */}
      {isDismissed && (
        <button
          onClick={restart}
          className="fixed bottom-6 right-6 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition-all hover:scale-110"
          title="Kurulum turunu başlat"
        >
          <span className="text-lg">?</span>
        </button>
      )}

      {/* Tour panel */}
      {!isDismissed && isOpen && (
        <div
          className="fixed bottom-6 right-6 z-50 w-[360px] rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden"
          style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)" }}
        >
          {/* Header */}
          <div className="relative bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-4">
            {/* Progress bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-800/30">
              <div
                className="h-full bg-white/70 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white/15 text-xl">
                  {step.icon}
                </div>
                <div>
                  <div className="text-xs font-semibold text-blue-200 uppercase tracking-wide">
                    {currentStep === 0 ? "Başlangıç" : currentStep === STEPS.length - 1 ? "Tamamlandı" : `Adım ${currentStep} / ${STEPS.length - 2}`}
                  </div>
                  <div className="text-sm font-bold text-white leading-tight mt-0.5">{step.title}</div>
                </div>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-blue-200 hover:bg-white/10 hover:text-white text-xs"
                >
                  {isMinimized ? "▲" : "▼"}
                </button>
                <button
                  onClick={dismiss}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-blue-200 hover:bg-white/10 hover:text-white text-sm"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>

          {/* Body */}
          {!isMinimized && (
            <>
              <div className="px-5 py-4 space-y-4">
                <p className="text-sm text-gray-700 leading-relaxed">{step.description}</p>

                {step.tip && (
                  <div className="flex gap-2 rounded-xl bg-amber-50 border border-amber-100 px-3 py-2.5">
                    <span className="flex-shrink-0 text-sm">💡</span>
                    <p className="text-xs text-amber-800 leading-relaxed">{step.tip}</p>
                  </div>
                )}

                {/* Step dots */}
                <div className="flex items-center justify-center gap-1.5">
                  {STEPS.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => goToStep(i)}
                      className={`rounded-full transition-all ${
                        i === currentStep
                          ? "w-5 h-2 bg-blue-600"
                          : i < currentStep
                          ? "w-2 h-2 bg-blue-300"
                          : "w-2 h-2 bg-gray-200"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="border-t border-gray-100 px-5 py-3 flex items-center gap-2">
                {currentStep > 0 && !isLast && (
                  <button
                    onClick={prev}
                    className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                  >
                    ← Geri
                  </button>
                )}

                {step.action && step.actionPath && !isLast && (
                  <button
                    onClick={() => { router.push(step.actionPath!); }}
                    className="flex-1 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100 transition-colors"
                  >
                    {step.action}
                  </button>
                )}

                <button
                  onClick={next}
                  className={`rounded-xl px-4 py-2 text-xs font-bold text-white shadow-sm transition-colors ${
                    isLast ? "flex-1 bg-emerald-600 hover:bg-emerald-700" : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {isLast ? "🚀 Başlayalım!" : currentStep === 0 ? "Başla →" : "Sonraki →"}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
