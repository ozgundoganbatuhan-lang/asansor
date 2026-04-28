"use client";
import { useEffect, useRef } from "react";

export default function LandingClient({ css, html, script }: { css: string; html: string; script: string }) {
  const scriptRan = useRef(false);

  useEffect(() => {
    if (scriptRan.current) return;
    scriptRan.current = true;
    try {
      // Run the embedded script once after hydration
      const fn = new Function(script);
      fn();
    } catch (err) {
      console.error("[Landing] inline script error:", err);
    }
  }, [script]);

  return (
    <>
      {/* Load Plus Jakarta Sans — already in <head> via layout, but keep as fallback */}
      <style
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: `@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400&display=swap');\n${css}` }}
      />
      <div
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </>
  );
}
