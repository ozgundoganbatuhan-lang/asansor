import Link from "next/link";
import { getAllBlogPosts } from "@/lib/blog";
import type { Metadata } from "next";
import { FeaturedPostCard, BlogPostCard } from "@/components/BlogCards";

export const metadata: Metadata = {
  title: "Blog | Servisim – Asansör Servis Operasyon Rehberleri",
  description: "Asansör servis firmaları için bakım takibi, QR etiket, iş emri yönetimi ve operasyon tasarımı hakkında pratik rehberler.",
  keywords: ["asansör servis yazılımı","asansör bakım takibi","servis iş emri"],
  alternates: { canonical: "/blog" },
  openGraph: { title: "Servisim Blog", description: "Asansör servis firmaları için pratik operasyon rehberleri.", type: "website" },
};
const WA = "https://wa.me/4915566196266?text=Servisim%20hakk%C4%B1nda%20bilgi%20almak%20istiyorum";

export default function BlogIndexPage() {
  const posts = getAllBlogPosts();
  const featured = posts[0];
  const rest = posts.slice(1);
  const S = { fontFamily: "'Inter',-apple-system,system-ui,sans-serif", color: "#111827" } as React.CSSProperties;
  return (
    <div style={{ background: "#fff", minHeight: "100vh", ...S }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');`}</style>
      <header style={{ borderBottom: "1px solid #e5e7eb", background: "#fff", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", height: 54, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: "linear-gradient(135deg,#2563eb,#1d4ed8)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10"/></svg>
            </div>
            <span style={{ fontSize: 13, fontWeight: 800, color: "#111827", letterSpacing: "-0.03em" }}>Servisim</span>
          </Link>
          <div style={{ display: "flex", gap: 10 }}>
            <Link href="/" style={{ fontSize: 12, fontWeight: 500, color: "#6b7280", textDecoration: "none" }}>← Ana sayfa</Link>
            <Link href="/auth/register" style={{ background: "#2563eb", color: "#fff", fontSize: 12, fontWeight: 700, padding: "6px 14px", borderRadius: 7, textDecoration: "none" }}>Ücretsiz başla</Link>
          </div>
        </div>
      </header>

      <section style={{ background: "linear-gradient(180deg,#f9fafb 0%,#fff 100%)", borderBottom: "1px solid #e5e7eb", padding: "48px 24px 40px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 999, padding: "4px 12px", fontSize: 10, fontWeight: 700, color: "#2563eb", marginBottom: 14, letterSpacing: "0.06em" }}>SEO İÇERİK MERKEZİ</div>
          <h1 style={{ fontSize: "clamp(26px,4vw,44px)", fontWeight: 900, letterSpacing: "-0.05em", lineHeight: 1.05, color: "#111827", margin: "0 0 10px", maxWidth: 640 }}>Asansör servis operasyon blogu</h1>
          <p style={{ fontSize: 15, lineHeight: 1.7, color: "#6b7280", maxWidth: 480, margin: 0 }}>Bakım takibi, QR etiket, iş emri yönetimi ve saha deneyimi hakkında ürün odaklı içerikler.</p>
        </div>
      </section>

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "44px 24px 68px" }}>
        {featured && (
          <div style={{ marginBottom: 44 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.1em", textTransform: "uppercase" as const, marginBottom: 12 }}>Öne çıkan yazı</div>
            <FeaturedPostCard post={featured} />
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }} className="blog-grid">
          {rest.map(post => (
            <BlogPostCard key={post.slug} post={post} />
          ))}
        </div>
      </main>

      <section style={{ background: "#111827", padding: "48px 24px" }}>
        <div style={{ maxWidth: 560, margin: "0 auto", textAlign: "center" as const }}>
          <h2 style={{ fontSize: "clamp(20px,3.5vw,30px)", fontWeight: 900, letterSpacing: "-0.04em", color: "#fff", margin: "0 0 10px" }}>Servisim&apos;i 14 gün ücretsiz deneyin.</h2>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.48)", margin: "0 0 22px" }}>Kredi kartı gerekmez. Kurulum yok. Türkçe destek.</p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" as const }}>
            <Link href="/auth/register" style={{ background: "#fff", color: "#111827", fontSize: 13, fontWeight: 800, padding: "10px 20px", borderRadius: 8, textDecoration: "none" }}>Ücretsiz başla →</Link>
            <a href={WA} target="_blank" rel="noopener noreferrer" style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff", fontSize: 13, fontWeight: 600, padding: "10px 20px", borderRadius: 8, textDecoration: "none" }}>WhatsApp ile görüş</a>
          </div>
        </div>
      </section>
      <footer style={{ background: "#111827", borderTop: "1px solid rgba(255,255,255,0.05)", padding: "20px", textAlign: "center" as const }}>
        <Link href="/privacy" style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", textDecoration: "none" }}>Gizlilik</Link>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.15)", margin: "0 8px" }}>·</span>
        <Link href="/terms" style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", textDecoration: "none" }}>Koşullar</Link>
      </footer>
      <style>{`@media(max-width:900px){.blog-grid{grid-template-columns:1fr 1fr!important}.feat-link{grid-template-columns:1fr!important}}@media(max-width:520px){.blog-grid{grid-template-columns:1fr!important}}`}</style>
    </div>
  );
}
