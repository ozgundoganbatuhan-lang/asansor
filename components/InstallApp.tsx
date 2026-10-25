"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

type PromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

const Icon = ({ d, size = 18 }: { d: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={d} />
  </svg>
);
const DOWNLOAD = "M12 3v12m0 0 4.5-4.5M12 15l-4.5-4.5M5 19h14";
const SHARE = "M12 3v12M8 7l4-4 4 4M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7";
const PLUS = "M12 8v8M8 12h8M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z";

/**
 * "Telefona yükle": installs Servisim on the home screen. Android Chrome gets the native prompt;
 * iPhone Safari cannot be prompted, so it shows the two Share-sheet steps; a computer gets the
 * address to open on the phone. Hidden once the app runs installed.
 */
export default function InstallApp({ className = "", label = "Telefona yükle" }: { className?: string; label?: string }) {
  const [prompt, setPrompt] = useState<PromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [help, setHelp] = useState<"ios" | "other" | null>(null);
  const standalone = useSyncExternalStore(
    () => () => {},
    () => matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true,
    () => false,
  );

  useEffect(() => {
    const onPrompt = (e: Event) => { e.preventDefault(); setPrompt(e as PromptEvent); };
    const onInstalled = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed || standalone) return null;

  const click = async () => {
    if (prompt) {
      await prompt.prompt();
      const { outcome } = await prompt.userChoice;
      if (outcome === "accepted") setInstalled(true);
      setPrompt(null);
      return;
    }
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    setHelp(ios ? "ios" : "other");
  };

  return (
    <>
      <button type="button" onClick={click} className={`install-btn ${className}`}>
        <Icon d={DOWNLOAD} /> {label}
      </button>
      {help && (
        <div role="dialog" aria-modal="true" aria-labelledby="install-title" className="install-backdrop" onClick={() => setHelp(null)}>
          <div className="install-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="install-head">
              <h2 id="install-title">Servisim&apos;i telefonunuza yükleyin</h2>
              <button type="button" onClick={() => setHelp(null)} aria-label="Kapat" className="install-close">✕</button>
            </div>
            {help === "ios" ? (
              <ol className="install-steps">
                <li><span><Icon d={SHARE} /></span><p>Safari&apos;de alttaki <b>Paylaş</b> düğmesine dokunun.</p></li>
                <li><span><Icon d={PLUS} /></span><p>Listeden <b>Ana Ekrana Ekle</b>&apos;yi seçip <b>Ekle</b>&apos;ye dokunun. Servisim ana ekranınıza uygulama olarak gelir.</p></li>
              </ol>
            ) : (
              <div className="install-steps">
                <p>Bu adresi telefonunuzda açın: <b>{typeof window !== "undefined" ? window.location.host : ""}</b></p>
                <p>Android&apos;de Chrome menüsünden (⋮) <b>Uygulamayı yükle</b>&apos;yi seçin. iPhone&apos;da Safari&apos;de <b>Paylaş</b>, sonra <b>Ana Ekrana Ekle</b>.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
