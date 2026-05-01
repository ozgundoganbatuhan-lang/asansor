import { readFileSync } from "fs";
import { join } from "path";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Servisim — Asansör Servis Operasyon Platformu",
  description: "WhatsApp kaosunu, Excel tablolarını ve telefon trafiğini bitirin.",
};

export const dynamic = "force-dynamic";

// Bu fonksiyon NORMALDE çalışmamalı çünkü vercel.json + next.config.mjs rewrite "/" -> "/landing.html"
// Eğer rewrite başarısız olursa burası fallback olarak landing.html'i okur ve raw HTML döner
export default function HomePage() {
  try {
    const html = readFileSync(join(process.cwd(), "public", "landing.html"), "utf-8");
    // Strip outer <html><body> tags and dump raw content
    const styleMatch  = html.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
    const bodyMatch   = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    const scriptMatch = html.match(/<script[^>]*>([\s\S]*?)<\/script>/i);
    const css    = styleMatch  ? styleMatch[1]  : "";
    const body   = bodyMatch   ? bodyMatch[1]   : "<p>Landing yüklenemedi.</p>";
    const script = scriptMatch ? scriptMatch[1] : "";

    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: css }} />
        <div dangerouslySetInnerHTML={{ __html: body }} />
        {script && <script dangerouslySetInnerHTML={{ __html: script }} />}
      </>
    );
  } catch {
    return <div style={{ padding: 40 }}>Sayfa yüklenemedi.</div>;
  }
}
