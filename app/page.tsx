import { readFileSync } from "fs";
import { join } from "path";
import type { Metadata } from "next";
import LandingClient from "./marketing/LandingClient";

export const metadata: Metadata = {
  title: "Servisim — Asansör Servis Operasyon Platformu",
  description: "WhatsApp kaosunu, Excel tablolarını ve telefon trafiğini bitirin. Arıza yönetiminden bakım takibine — tek platform, sıfır dağınıklık.",
};

export default function HomePage() {
  const html = readFileSync(join(process.cwd(), "public", "landing.html"), "utf-8");

  // Extract <style>…</style> blocks and body content
  const styleMatch = html.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
  const bodyMatch  = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const scriptMatch = html.match(/<script[^>]*>([\s\S]*?)<\/script>/i);

  const css    = styleMatch  ? styleMatch[1]  : "";
  const body   = bodyMatch   ? bodyMatch[1]   : "";
  const script = scriptMatch ? scriptMatch[1] : "";

  return <LandingClient css={css} html={body} script={script} />;
}
