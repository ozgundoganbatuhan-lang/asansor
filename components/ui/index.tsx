import { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes, forwardRef } from "react";

/* ── Icon helper ── */
export function Icon({ d, size = 16, color = "currentColor" }: { d: string; size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d={d} />
    </svg>
  );
}

/* ── Button ── */
type BtnVariant = "primary" | "secondary" | "ghost" | "danger" | "soft";
type BtnSize    = "sm" | "md" | "lg" | "icon";
export function Button({
  variant = "primary", size = "md", className = "", children, loading, ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: BtnVariant; size?: BtnSize; children?: ReactNode; loading?: boolean;
}) {
  const cls = `btn btn-${variant} btn-${size} ${className}`;
  return (
    <button {...props} disabled={props.disabled || loading} className={cls}>
      {loading && <span className="spinner" style={{ width: 13, height: 13, borderWidth: 1.5 }} />}
      {children}
    </button>
  );
}

/* ── Card ── */
export function Card({ children, className = "", title, subtitle, action }: {
  children: ReactNode; className?: string; title?: string; subtitle?: string; action?: ReactNode;
}) {
  return (
    <div className={`card ${className}`}>
      {(title || action) && (
        <div className="card-header">
          <div>
            {title && <h2 className="card-title">{title}</h2>}
            {subtitle && <p className="card-subtitle">{subtitle}</p>}
          </div>
          {action && <div style={{ flexShrink: 0 }}>{action}</div>}
        </div>
      )}
      <div className="card-body">{children}</div>
    </div>
  );
}

/* ── Form controls ── */
function FieldLabel({ children, htmlFor }: { children?: ReactNode; htmlFor?: string }) {
  if (!children) return null;
  return <label htmlFor={htmlFor} className="field-label">{children}</label>;
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { label?: string }>(
  function Input({ label, id, className = "", ...props }, ref) {
    const htmlId = id ?? (label?.toString().toLowerCase().replace(/\s+/g, "-"));
    return (
      <div className="field">
        <FieldLabel htmlFor={htmlId}>{label}</FieldLabel>
        <input ref={ref} {...props} id={htmlId} className={`field-input ${className}`} />
      </div>
    );
  }
);

export function Select({ label, id, className = "", children, ...props }: SelectHTMLAttributes<HTMLSelectElement> & { label?: string; children: ReactNode }) {
  const htmlId = id ?? (label?.toString().toLowerCase().replace(/\s+/g, "-"));
  return (
    <div className="field">
      <FieldLabel htmlFor={htmlId}>{label}</FieldLabel>
      <select {...props} id={htmlId} className={`field-input field-select ${className}`}>{children}</select>
    </div>
  );
}

export function Textarea({ label, id, className = "", ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
  const htmlId = id ?? (label?.toString().toLowerCase().replace(/\s+/g, "-"));
  return (
    <div className="field">
      <FieldLabel htmlFor={htmlId}>{label}</FieldLabel>
      <textarea {...props} id={htmlId} className={`field-input field-textarea ${className}`} />
    </div>
  );
}

/* ── Badge / Pill ── */
type BadgeTone = "gray" | "blue" | "green" | "amber" | "red" | "neutral" | "warning";
export function Pill({ tone = "gray", children, className = "" }: { tone?: BadgeTone; children: ReactNode; className?: string }) {
  const map: Record<BadgeTone, string> = {
    gray: "badge badge-gray", blue: "badge badge-blue", green: "badge badge-green",
    amber: "badge badge-amber", red: "badge badge-red",
    neutral: "badge badge-gray", warning: "badge badge-amber",
  };
  return <span className={`${map[tone]} ${className}`}>{children}</span>;
}

/* ── Page header ── */
export function PageHeader({ title, subtitle, action, eyebrow }: {
  title: string; subtitle?: string; action?: ReactNode; eyebrow?: string;
}) {
  return (
    <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
      <div>
        {eyebrow && <div className="page-eyebrow">{eyebrow}</div>}
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {action && <div style={{ flexShrink: 0 }}>{action}</div>}
    </div>
  );
}

/* ── Empty state ── */
export function EmptyState({ icon, title, desc, action }: {
  icon: string; title: string; desc?: string; action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <div className="empty-title">{title}</div>
      {desc && <p className="empty-desc">{desc}</p>}
      {action && <div>{action}</div>}
    </div>
  );
}

/* ── Spinner ── */
export function Spinner({ size = 32 }: { size?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 0" }}>
      <div className="spinner" style={{ width: size, height: size, borderWidth: size / 10 }} />
    </div>
  );
}

/* ── Error banner ── */
export function ErrorBanner({ msg }: { msg: string }) {
  return (
    <div className="banner banner-error">
      <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      {msg}
    </div>
  );
}

/* ── Metric card ── */
export function MetricCard({ label, value, note, href, icon, trend }: {
  label: string; value: string | number; note?: string; href?: string; icon?: string; trend?: "up" | "down" | "flat";
}) {
  const trendIcon = trend === "up" ? "↑" : trend === "down" ? "↓" : "";
  const trendColor = trend === "up" ? "var(--success)" : trend === "down" ? "var(--danger)" : "var(--muted)";
  const content = (
    <div className="metric-card" style={{ transition: "all 0.15s", cursor: href ? "pointer" : "default" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div className="metric-label">{label}</div>
        {icon && (
          <div style={{ width: 32, height: 32, borderRadius: "var(--r-md)", background: "var(--primary-soft)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary)", fontSize: 14 }}>
            {icon}
          </div>
        )}
      </div>
      <div className="metric-value">{value}</div>
      {(note || trend) && (
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {trend && <span style={{ fontSize: 12, fontWeight: 700, color: trendColor }}>{trendIcon}</span>}
          {note && <span className="metric-note">{note}</span>}
        </div>
      )}
    </div>
  );
  if (!href) return content;
  return <a href={href} style={{ textDecoration: "none", display: "block" }}
    onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"}
    onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = "none"}>{content}</a>;
}

/* ── Stat line ── */
export function StatLine({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="stat-row">
      <span style={{ color: "var(--muted)", fontSize: 12 }}>{label}</span>
      <span style={{ fontWeight: 600, fontSize: 13 }}>{value}</span>
    </div>
  );
}
