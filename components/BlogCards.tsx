"use client";

import Link from "next/link";

interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  readingMinutes: number;
  keywords: string[];
}

export function FeaturedPostCard({ post }: { post: BlogPost }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      style={{
        textDecoration: "none",
        display: "grid",
        gridTemplateColumns: "1fr 1.1fr",
        background: "#fff",
        borderRadius: 16,
        border: "1px solid #e5e7eb",
        overflow: "hidden",
        boxShadow: "0 3px 16px rgba(0,0,0,0.06)",
        transition: "box-shadow 0.2s",
      }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = "0 12px 44px rgba(37,99,235,0.12)"}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = "0 3px 16px rgba(0,0,0,0.06)"}
      className="feat-link"
    >
      <div style={{ background: "linear-gradient(135deg,#111827,#1e3a8a)", display: "flex", alignItems: "center", justifyContent: "center", minHeight: 220, fontSize: 60 }}>📋</div>
      <div style={{ padding: "28px 32px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ display: "flex", gap: 7, marginBottom: 10, alignItems: "center" }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: "#2563eb", background: "#eff6ff", padding: "2px 8px", borderRadius: 5 }}>Rehber</span>
          <span style={{ fontSize: 11, color: "#9ca3af" }}>{post.readingMinutes} dk okuma</span>
        </div>
        <h2 style={{ fontSize: "clamp(16px,2vw,24px)", fontWeight: 800, color: "#111827", letterSpacing: "-0.03em", lineHeight: 1.2, margin: "0 0 9px" }}>{post.title}</h2>
        <p style={{ fontSize: 13, lineHeight: 1.7, color: "#6b7280", margin: "0 0 16px" }}>{post.excerpt}</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 16 }}>
          {post.keywords.slice(0, 3).map(k => (
            <span key={k} style={{ fontSize: 10, color: "#6b7280", background: "#f9fafb", border: "1px solid #e5e7eb", padding: "2px 8px", borderRadius: 5 }}>{k}</span>
          ))}
        </div>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#2563eb" }}>Yazıyı oku →</span>
      </div>
    </Link>
  );
}

export function BlogPostCard({ post }: { post: BlogPost }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      style={{
        textDecoration: "none",
        background: "#fff",
        borderRadius: 13,
        border: "1px solid #e5e7eb",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        transition: "all 0.14s",
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = "0 10px 30px rgba(0,0,0,0.08)";
        (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = "none";
        (e.currentTarget as HTMLElement).style.transform = "none";
      }}
    >
      <div style={{ height: 106, background: "linear-gradient(135deg,#eff6ff,#dbeafe)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 34 }}>📋</div>
      <div style={{ padding: "15px 17px", flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", gap: 5, marginBottom: 7 }}>
          <span style={{ fontSize: 9.5, fontWeight: 700, color: "#2563eb", background: "#eff6ff", padding: "2px 7px", borderRadius: 5 }}>Rehber</span>
          <span style={{ fontSize: 9.5, color: "#9ca3af" }}>{post.readingMinutes} dk</span>
        </div>
        <h2 style={{ fontSize: 13, fontWeight: 700, color: "#111827", letterSpacing: "-0.02em", lineHeight: 1.35, margin: "0 0 6px" }}>{post.title}</h2>
        <p style={{ fontSize: 11.5, lineHeight: 1.6, color: "#6b7280", margin: "0 0 10px", flex: 1 }}>{post.excerpt}</p>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#2563eb" }}>Devamını oku →</span>
      </div>
    </Link>
  );
}
