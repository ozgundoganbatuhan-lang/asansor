"use client";

import { useEffect } from "react";

export default function PWARegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    const register = async () => {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();

        for (const reg of registrations) {
          const script =
            reg.active?.scriptURL ||
            reg.waiting?.scriptURL ||
            reg.installing?.scriptURL ||
            "";

          if (script.includes("/sw.js")) {
            await reg.unregister();
          }
        }

        await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      } catch {
        // no-op
      }
    };

    void register();
  }, []);

  return null;
}
