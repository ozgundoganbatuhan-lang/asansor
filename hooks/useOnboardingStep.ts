import { useEffect, useState } from "react";

const KEY = "servisim_wizard_v2";

export type WizardData = { step: number; completed: boolean };

export function getWizardData(): WizardData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { step: -1, completed: false };
    return JSON.parse(raw);
  } catch { return { step: -1, completed: false }; }
}

export function setWizardStep(step: number, completed = false) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ step, completed }));
    window.dispatchEvent(new Event("wizard-update"));
  } catch {}
}

export function useOnboardingStep() {
  const [data, setData] = useState<WizardData>({ step: -1, completed: false });
  useEffect(() => {
    function refresh() { setData(getWizardData()); }
    refresh();
    window.addEventListener("wizard-update", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("wizard-update", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);
  return data;
}
