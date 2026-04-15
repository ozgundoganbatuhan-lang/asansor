import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getAllBlogPosts, getBlogPost, getRelatedPosts } from
"@/lib/blog";
export async function generateStaticParams() {
return getAllBlogPosts().map(p => ({ slug: p.slug }));
}
export async function generateMetadata({ params }: { params: Promise<{
slug: string }> }): Promise<Metadata> {
const { slug } = await params;
const post = getBlogPost(slug);
if (!post) return {};
return {
title: `${post.title} | Servisim Blog`,
description: post.description,
keywords: post.keywords,
alternates: { canonical: `/blog/${post.slug}` },
openGraph: { title: post.title, description: post.description, type:
"article", publishedTime: post.publishedAt },
twitter: { card: "summary_large_image", title: post.title, description:
post.description },
};
}
const WA =
"https://wa.me/4915566196266?text=Servisim%20hakk%C4%B1nda%20bilgi%20almak%20istiyorum";
export default async function BlogDetailPage({ params }: { params:
Promise<{ slug: string }> }) {
const { slug } = await params;
const post = getBlogPost(slug);
if (!post) notFound();
const related = getRelatedPosts(slug, 3);
const publishDate = new
Date(post.publishedAt).toLocaleDateString("tr-TR", { day:"numeric",
month:"long", year:"numeric" });
const articleSchema = { "@context":"https://schema.org",
"@type":"Article", headline:post.title, description:post.description,
keywords:post.keywords.join(", "), datePublished:post.publishedAt,
author:{"@type":"Organization",name:"Servisim"},
publisher:{"@type":"Organization",name:"Servisim"} };
const faqSchema = post.faq?.length ? { "@context":"https://schema.org",
"@type":"FAQPage", mainEntity:post.faq.map(item=>({ "@type":"Question",
name:item.question, acceptedAnswer:{"@type":"Answer",text:item.answer}
})) } : null;
const S = { fontFamily:"'Inter',-apple-system,system-ui,sans-serif",
color:"#111827" } as React.CSSProperties;
return (
<div style={{ background:"#fff", minHeight:"100vh", ...S }}>
<script type="application/ld+json" dangerouslySetInnerHTML={{ __html:
JSON.stringify(articleSchema) }} />
{faqSchema && <script type="application/ld+json"
dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />}
<style>{`@import
url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');`}</style>
<header style={{ borderBottom:"1px solid #e5e7eb", background:"#fff",
position:"sticky", top:0, zIndex:50 }}>
<div style={{ maxWidth:1200, margin:"0 auto", padding:"0 24px",
height:54, display:"flex", alignItems:"center",
justifyContent:"space-between" }}>
<Link href="/" style={{ display:"flex", alignItems:"center", gap:8,
textDecoration:"none" }}>
<div style={{ width:28, height:28, borderRadius:7,
background:"linear-gradient(135deg,#2563eb,#1d4ed8)", display:"flex",
alignItems:"center", justifyContent:"center" }}>
<svg width={12} height={12} viewBox="0 0 24 24" fill="none"
stroke="#fff" strokeWidth={2.2} strokeLinecap="round"
strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0
01-2-2z M9 22V12h6v10"/></svg>
</div>
<span style={{ fontSize:13, fontWeight:800, color:"#111827",
letterSpacing:"-0.03em" }}>Servisim</span>
</Link>
<div style={{ display:"flex", gap:10 }}>
<Link href="/blog" style={{ fontSize:12, fontWeight:500,
color:"#6b7280", textDecoration:"none" }}>← Blog</Link>
<Link href="/auth/register" style={{ background:"#2563eb", color:"#fff",
fontSize:12, fontWeight:700, padding:"6px 14px", borderRadius:7,
textDecoration:"none" }}>Ücretsiz başla</Link>
</div>
</div>
</header>
<div style={{ background:"linear-gradient(180deg,#f9fafb 0%,#fff 100%)",
borderBottom:"1px solid #e5e7eb", padding:"44px 24px 36px" }}>
<div style={{ maxWidth:740, margin:"0 auto" }}>
<nav style={{ fontSize:11, color:"#9ca3af", marginBottom:14,
display:"flex", gap:5, alignItems:"center", flexWrap:"wrap" as const }}>
<Link href="/" style={{ color:"#9ca3af", textDecoration:"none" }}>Ana
sayfa</Link><span>›</span>
<Link href="/blog" style={{ color:"#9ca3af", textDecoration:"none"
}}>Blog</Link><span>›</span>
<span style={{ color:"#6b7280" }}>{post.title}</span>
</nav>
<div style={{ display:"flex", gap:7, marginBottom:14, flexWrap:"wrap" as
const, alignItems:"center" }}>
<span style={{ fontSize:10, fontWeight:700, color:"#2563eb",
background:"#eff6ff", padding:"2px 8px", borderRadius:5 }}>Rehber</span>
<span style={{ fontSize:11, color:"#9ca3af" }}>{post.readingMinutes} dk
okuma · {publishDate}</span>
</div>
<h1 style={{ fontSize:"clamp(22px,4vw,38px)", fontWeight:900,
letterSpacing:"-0.04em", lineHeight:1.1, color:"#111827", margin:"0 0
10px" }}>{post.title}</h1>
<p style={{ fontSize:15, lineHeight:1.7, color:"#6b7280", margin:"0 0
16px" }}>{post.excerpt}</p>
<div style={{ display:"flex", flexWrap:"wrap" as const, gap:5 }}>
{post.keywords.map(k=><span key={k} style={{ fontSize:10,
color:"#6b7280", background:"#f9fafb", border:"1px solid #e5e7eb",
padding:"2px 8px", borderRadius:5 }}>{k}</span>)}
</div>
</div>
</div>
<article style={{ maxWidth:740, margin:"0 auto", padding:"44px 24px" }}>
{post.body.map((section, si)=>(
<section key={si} style={{ marginBottom:40 }}>
<h2 style={{ fontSize:"clamp(17px,2.2vw,22px)", fontWeight:800,
letterSpacing:"-0.03em", color:"#111827", margin:"0 0 12px",
lineHeight:1.25 }}>{section.heading}</h2>
{section.paragraphs.map((p,pi)=><p key={pi} style={{ fontSize:15,
lineHeight:1.8, color:"#374151", margin:"0 0 13px" }}>{p}</p>)}
{section.bullets && (
<ul style={{ margin:"12px 0 0", padding:0, listStyle:"none",
display:"flex", flexDirection:"column" as const, gap:8 }}>
{section.bullets.map((b,bi)=>(
<li key={bi} style={{ display:"flex", alignItems:"flex-start", gap:9,
fontSize:14, color:"#374151" }}>
<span style={{ width:18, height:18, borderRadius:"50%",
background:"#eff6ff", border:"1px solid #bfdbfe", display:"flex",
alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:2
}}>
<svg width={8} height={8} viewBox="0 0 12 12" fill="none"><path d="M2
6l3 3 5-5" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round"
strokeLinejoin="round"/></svg>
</span>
{b}
</li>
))}
</ul>
)}
</section>
))}
{post.faq && post.faq.length > 0 && (
<section style={{ marginBottom:40, background:"#f9fafb",
borderRadius:13, padding:"22px", border:"1px solid #e5e7eb" }}>
<h2 style={{ fontSize:19, fontWeight:800, letterSpacing:"-0.03em",
color:"#111827", margin:"0 0 18px" }}>Sık sorulan sorular</h2>
<div style={{ display:"flex", flexDirection:"column" as const, gap:13
}}>
{post.faq.map((item,idx)=>(
<div key={idx} style={{ borderBottom:idx<post.faq!.length-1?"1px solid
#e5e7eb":"none", paddingBottom:idx<post.faq!.length-1?13:0 }}>
<h3 style={{ fontSize:13.5, fontWeight:700, color:"#111827", margin:"0 0
5px", letterSpacing:"-0.02em" }}>{item.question}</h3>
<p style={{ fontSize:13, lineHeight:1.7, color:"#6b7280", margin:0
}}>{item.answer}</p>
</div>
))}
</div>
</section>
)}
<div style={{ background:"linear-gradient(135deg,#111827,#1e3a8a)",
borderRadius:13, padding:"22px 26px", marginBottom:40 }}>
<div style={{ fontSize:16, fontWeight:800, color:"#fff",
letterSpacing:"-0.03em", marginBottom:5 }}>Servisim&apos;i 14 gün
ücretsiz deneyin.</div>
<p style={{ fontSize:13, color:"rgba(255,255,255,0.52)", margin:"0 0
16px" }}>Kurulum yok, kredi kartı gerekmez. Türkçe destek ile hemen
başlayın.</p>
<div style={{ display:"flex", gap:8, flexWrap:"wrap" as const }}>
<Link href="/auth/register" style={{ background:"#fff", color:"#111827",
fontSize:12, fontWeight:800, padding:"8px 16px", borderRadius:7,
textDecoration:"none" }}>Ücretsiz başla →</Link>
<a href={WA} target="_blank" rel="noopener noreferrer" style={{
background:"rgba(255,255,255,0.09)", border:"1px solid
rgba(255,255,255,0.14)", color:"#fff", fontSize:12, fontWeight:600,
padding:"8px 16px", borderRadius:7, textDecoration:"none" }}>WhatsApp
ile görüş</a>
</div>
</div>
</article>
{related.length > 0 && (
<section style={{ background:"#f9fafb", borderTop:"1px solid #e5e7eb",
padding:"44px 24px" }}>
<div style={{ maxWidth:1200, margin:"0 auto" }}>
<div style={{ fontSize:10, fontWeight:700, color:"#9ca3af",
letterSpacing:"0.1em", textTransform:"uppercase" as const,
marginBottom:18 }}>İlgili yazılar</div>
<div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)",
gap:14 }} className="related-grid">
{related.map(p=>(
<Link key={p.slug} href={`/blog/${p.slug}`} style={{ background:"#fff",
borderRadius:12, border:"1px solid #e5e7eb", padding:"17px",
textDecoration:"none", display:"block", transition:"all 0.14s" }}
onMouseEnter={e=>(e.currentTarget as HTMLElement).style.boxShadow="0 6px
18px rgba(0,0,0,0.07)"}
onMouseLeave={e=>(e.currentTarget as
HTMLElement).style.boxShadow="none"}>
<div style={{ fontSize:9.5, fontWeight:700, color:"#2563eb",
textTransform:"uppercase" as const, letterSpacing:"0.08em",
marginBottom:5 }}>{p.readingMinutes} dk</div>
<h3 style={{ fontSize:13, fontWeight:700, color:"#111827",
letterSpacing:"-0.02em", lineHeight:1.35, margin:"0 0 5px"
}}>{p.title}</h3>
<p style={{ fontSize:11.5, lineHeight:1.55, color:"#6b7280", margin:"0 0
9px" }}>{p.excerpt}</p>
<span style={{ fontSize:12, fontWeight:700, color:"#2563eb" }}>Oku
→</span>
</Link>
))}
</div>
</div>
</section>
)}
<footer style={{ background:"#111827", padding:"20px",
textAlign:"center" as const }}>
<Link href="/blog" style={{ fontSize:11, color:"rgba(255,255,255,0.28)",
textDecoration:"none" }}>← Tüm yazılar</Link>
<span style={{ fontSize:11, color:"rgba(255,255,255,0.12)", margin:"0
8px" }}>·</span>
<Link href="/" style={{ fontSize:11, color:"rgba(255,255,255,0.28)",
textDecoration:"none" }}>Servisim</Link>
</footer>
<style>{`@media(max-width:640px){.related-grid{grid-template-columns:1fr!important}}`}</style>
</div>
);
}
