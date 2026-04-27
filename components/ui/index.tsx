import { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "soft" | "muted";
type ButtonSize    = "sm" | "md" | "lg";

export function Button({
  variant = "primary",
  size    = "md",
  className = "",
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize; children: ReactNode }) {
  const variants: Record<ButtonVariant, string> = {
    primary:   "bg-[color:var(--primary)] text-white hover:brightness-110 active:brightness-90 shadow-sm",
    secondary: "bg-white text-[color:var(--foreground)] border border-[color:var(--border)] hover:bg-[color:var(--surface-soft-2)] hover:border-[color:var(--border-strong)]",
    ghost:     "bg-transparent text-[color:var(--muted)] hover:bg-white hover:text-[color:var(--foreground)]",
    danger:    "bg-[color:var(--danger)] text-white hover:brightness-110 shadow-sm",
    soft:      "bg-[color:var(--surface-soft)] text-[color:var(--primary)] border border-[color:var(--border-strong)] hover:bg-[#e0ecff]",
    muted:     "bg-[color:var(--surface-soft-2)] text-[color:var(--muted)] border border-[color:var(--border)] hover:bg-white",
  };
  const sizes: Record<ButtonSize, string> = {
    sm: "px-3.5 py-2 text-xs rounded-[14px]",
    md: "px-4 py-2.5 text-sm rounded-[16px]",
    lg: "px-5 py-3 text-sm rounded-[18px]",
  };
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 font-semibold transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--primary)] focus-visible:ring-offset-1 ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  );
}

export function Card({
  children, className = "", title, subtitle, action, tone = "default",
}: { children: ReactNode; className?: string; title?: string; subtitle?: string; action?: ReactNode; tone?: "default" | "soft" }) {
  const toneClass = tone === "soft" ? "panel-soft" : "panel";
  return (
    <section className={`${toneClass} overflow-hidden ${className}`}>
      {(title || subtitle || action) && (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[color:var(--border)] px-5 py-4 md:px-6 md:py-5">
          <div>
            {title    && <h2 className="text-base font-extrabold tracking-tight text-[color:var(--foreground)]">{title}</h2>}
            {subtitle && <p className="mt-1 max-w-2xl text-sm leading-6 text-[color:var(--muted)]">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      <div className="p-5 md:p-6">{children}</div>
    </section>
  );
}

function FieldLabel({ children, htmlFor }: { children?: ReactNode; htmlFor?: string }) {
  if (!children) return null;
  return (
    <label htmlFor={htmlFor} className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[color:var(--muted-2)]">
      {children}
    </label>
  );
}

const fieldBase = "focus-ring w-full rounded-[14px] border border-[color:var(--border)] bg-white px-4 py-2.5 text-sm text-[color:var(--foreground)] shadow-[var(--shadow-xs)] placeholder:text-[color:var(--muted-2)] transition-colors";

export function Input({
  label, id, className = "", ...props
}: InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  const htmlId = id ?? props.name ?? label?.toString().toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="flex flex-col gap-2">
      <FieldLabel htmlFor={htmlId}>{label}</FieldLabel>
      <input {...props} id={htmlId} className={`${fieldBase} ${className}`} />
    </div>
  );
}

export function Select({
  label, id, className = "", children, ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { label?: string; children: ReactNode }) {
  const htmlId = id ?? props.name ?? label?.toString().toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="flex flex-col gap-2">
      <FieldLabel htmlFor={htmlId}>{label}</FieldLabel>
      <select {...props} id={htmlId} className={`${fieldBase} pr-10 ${className}`}>
        {children}
      </select>
    </div>
  );
}

export function Textarea({
  label, id, className = "", ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
  const htmlId = id ?? props.name ?? label?.toString().toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="flex flex-col gap-2">
      <FieldLabel htmlFor={htmlId}>{label}</FieldLabel>
      <textarea
        {...props}
        id={htmlId}
        className={`focus-ring min-h-[130px] w-full rounded-[14px] border border-[color:var(--border)] bg-white px-4 py-3 text-sm text-[color:var(--foreground)] shadow-[var(--shadow-xs)] placeholder:text-[color:var(--muted-2)] transition-colors ${className}`}
      />
    </div>
  );
}

export function Pill({
  tone = "neutral", children, className = "",
}: { tone?: "neutral" | "green" | "amber" | "red" | "blue" | "gray" | "warning"; children: ReactNode; className?: string }) {
  const tones = {
    neutral: "bg-slate-100 text-slate-600 border border-slate-200",
    green:   "bg-emerald-50 text-emerald-700 border border-emerald-100",
    amber:   "bg-amber-50  text-amber-700   border border-amber-100",
    red:     "bg-red-50    text-red-700      border border-red-100",
    blue:    "bg-blue-50   text-blue-700     border border-blue-100",
    gray:    "bg-slate-100 text-slate-500    border border-slate-200",
    warning: "bg-amber-50  text-amber-700   border border-amber-100",
  } as const;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${tones[tone]} ${className}`}>
      {children}
    </span>
  );
}

export function PageHeader({
  title, subtitle, action, eyebrow = "Servisim Workspace",
}: { title: string; subtitle?: string; action?: ReactNode; eyebrow?: string }) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <div className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[color:var(--muted-2)]">{eyebrow}</div>
        <h1 className="mt-2 text-2xl font-black tracking-[-0.04em] text-[color:var(--foreground)] md:text-[2.4rem]">{title}</h1>
        {subtitle && <p className="mt-2 max-w-3xl text-sm leading-7 text-[color:var(--muted)] md:text-[14px]">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({
  icon, title, desc, action,
}: { icon: string; title: string; desc?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[28px] border border-dashed border-[color:var(--border)] bg-[linear-gradient(180deg,#fff,#f9fbff)] px-6 py-14 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-[20px] bg-[color:var(--surface-soft)] text-3xl">{icon}</div>
      <div className="text-base font-extrabold text-[color:var(--foreground)]">{title}</div>
      {desc   && <p className="mt-2 max-w-md text-sm leading-7 text-[color:var(--muted)]">{desc}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Spinner() {
  return (
    <div className="mx-auto h-9 w-9 animate-spin rounded-full border-[3px] border-[color:var(--surface-soft)] border-t-[color:var(--primary)]" />
  );
}

export function ErrorBanner({ msg }: { msg: string }) {
  return (
    <div className="flex items-center gap-3 rounded-[16px] border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
      <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      {msg}
    </div>
  );
}

export function MetricCard({
  label, value, note, href, action,
}: { label: string; value: string | number; note?: string; href?: string; action?: ReactNode }) {
  const content = (
    <div className="kpi-card panel-soft h-full rounded-[24px] p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-soft)] md:p-6">
      <div className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[color:var(--muted-2)]">{label}</div>
      <div className="metric-value mt-3 text-[2.2rem] font-black leading-none text-[color:var(--foreground)]">{value}</div>
      {note && <p className="mt-2.5 max-w-[18rem] text-xs leading-6 text-[color:var(--muted)]">{note}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
  if (!href) return content;
  return <a href={href} style={{ textDecoration: "none", display: "block" }}>{content}</a>;
}

export function StatLine({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[14px] bg-[color:var(--surface-soft-2)] px-4 py-3 text-sm">
      <span className="text-[color:var(--muted)]">{label}</span>
      <span className="font-bold text-[color:var(--foreground)]">{value}</span>
    </div>
  );
}
