"use client";

import { useEffect, useState } from "react";
import { Button, Card, Select, Input, Pill } from "@/components/ui";
import Link from "next/link";

type Org = { id: string; name: string; slug: string; vertical: "ELEVATOR" };
type Ent = { planTier: string; isTrial: boolean; isExpired: boolean; daysLeft: number; trialEndsAt: string };

export default function SettingsPage() {
  const [org, setOrg] = useState<Org | null>(null);
  const [ent, setEnt] = useState<Ent | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    const [orgRes, entRes] = await Promise.all([fetch("/api/org"), fetch("/api/entitlements")]);
    const orgJson = await orgRes.json();
    const entJson = await entRes.json();
    setOrg(orgJson.org);
    if (entRes.ok) setEnt(entJson.ent);
  }

  useEffect(() => {
    load().catch(() => setErr("Yüklenemedi"));
  }, []);

  async function save() {
    if (!org) return;
    setSaving(true);
    setErr(null);
    setSaved(false);
    try {
      const r = await fetch("/api/org", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: org.name, vertical: "ELEVATOR" }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || "Kaydedilemedi");
      setOrg(j.org);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      setErr(e.message || "Hata");
    } finally {
      setSaving(false);
    }
  }

  const planLabel = ent?.isTrial
    ? `Deneme — ${ent.daysLeft} gün kaldı`
    : ent?.planTier === "STARTER"
    ? "Başlangıç"
    : ent?.planTier === "PRO"
    ? "Pro"
    : ent?.planTier === "ENTERPRISE"
    ? "Kurumsal"
    : ent?.planTier ?? "—";

  const planTone: "blue" | "warning" | "neutral" | "green" =
    ent?.isExpired ? "warning" : ent?.isTrial ? "neutral" : "blue";

  // --- Kullanıcı Yönetimi state ---
  const [myRole, setMyRole] = useState<string | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [userForm, setUserForm] = useState({ role: "OFFICE", email: "", password: "", name: "", phone: "" });
  const [userErr, setUserErr] = useState<string | null>(null);
  const [userSuccess, setUserSuccess] = useState<string | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Load current session role and user list if permitted
  useEffect(() => {
    async function loadMe() {
      try {
        const res = await fetch("/api/me");
        if (!res.ok) return;
        const data = await res.json();
        setMyRole(data.session?.role ?? null);
      } catch {
        setMyRole(null);
      }
    }
    loadMe();
  }, []);

  useEffect(() => {
    if (myRole === "OWNER" || myRole === "ADMIN") {
      // fetch existing users
      async function loadUsers() {
        setLoadingUsers(true);
        try {
          const res = await fetch("/api/users");
          if (!res.ok) { setUsers([]); return; }
          const data = await res.json();
          setUsers(data.items ?? []);
        } finally {
          setLoadingUsers(false);
        }
      }
      loadUsers();
    }
  }, [myRole]);

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    setUserErr(null);
    setUserSuccess(null);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          role: userForm.role,
          email: userForm.email,
          password: userForm.password || undefined,
          name: userForm.name || undefined,
          phone: userForm.phone || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setUserErr(data.error ?? "Hata");
        return;
      }
      setUserSuccess(
        userForm.password
          ? "Kullanıcı oluşturuldu."
          : `Kullanıcı oluşturuldu. Geçici şifre: ${data.generatedPassword}`,
      );
      setUserForm({ role: "OFFICE", email: "", password: "", name: "", phone: "" });
      // reload users
      const updated = await fetch("/api/users").then((r) => r.json());
      setUsers(updated.items ?? []);
      setTimeout(() => setUserSuccess(null), 5000);
    } catch (err) {
      setUserErr((err as any)?.message ?? "Hata");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="text-2xl font-extrabold tracking-tight">Ayarlar</div>
        <div className="mt-1 text-sm text-gray-500">Şirket bilgileri ve hesap yönetimi</div>
      </div>

      {err && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>
      )}
      {saved && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          ✓ Değişiklikler kaydedildi.
        </div>
      )}

      <Card>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold">Organizasyon Bilgileri</div>
            <div className="mt-1 text-xs text-gray-400 font-mono">/{org?.slug ?? "..."}</div>
          </div>
          {ent && <Pill tone={planTone}>{planLabel}</Pill>}
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <Input
            label="Firma Adı"
            value={org?.name ?? ""}
            onChange={(e) => setOrg((o) => (o ? { ...o, name: e.target.value } : o))}
            placeholder="Örn. Güvenli Asansör Ltd."
          />
          <Input label="Sektör" value="Asansör Servisi" readOnly />
        </div>

        <div className="mt-4 flex items-center gap-3">
          <Button onClick={save} disabled={saving}>
            {saving ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
          </Button>
          <div className="text-xs text-gray-400">
            Yalnızca hesap sahibi (OWNER) ve yöneticiler (ADMIN) düzenleyebilir.
          </div>
        </div>
      </Card>

      {/* Kullanıcı yönetimi: sadece yönetici ve sahipler için görünür */}
      { (myRole === "OWNER" || myRole === "ADMIN") && (
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">Kullanıcı Yönetimi</div>
              <div className="mt-1 text-xs text-gray-500">Ofis ve teknisyen hesapları</div>
            </div>
          </div>
          <div className="mt-4 space-y-4">
            <form onSubmit={createUser} className="grid gap-3 sm:grid-cols-5">
              <div className="sm:col-span-1">
                <Select
                  label="Rol"
                  value={userForm.role}
                  onChange={(e: any) => setUserForm((f) => ({ ...f, role: e.target.value }))}
                >
                  <option value="OFFICE">Ofis</option>
                  <option value="TECHNICIAN">Teknisyen</option>
                </Select>
              </div>
              <Input
                label="E-posta"
                type="email"
                value={userForm.email}
                onChange={(e: any) => setUserForm((f) => ({ ...f, email: e.target.value }))}
                required
              />
              <Input
                label="Şifre"
                type="password"
                value={userForm.password}
                onChange={(e: any) => setUserForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="Boş bırakırsanız rastgele oluşturulur"
              />
              <Input
                label="İsim"
                value={userForm.name}
                onChange={(e: any) => setUserForm((f) => ({ ...f, name: e.target.value }))}
              />
              <Input
                label="Telefon"
                value={userForm.phone}
                onChange={(e: any) => setUserForm((f) => ({ ...f, phone: e.target.value }))}
              />
              <div className="sm:col-span-5 flex items-center justify-end gap-3">
                {userErr && <div className="text-sm text-red-600 flex-1">{userErr}</div>}
                {userSuccess && <div className="text-sm text-emerald-700 flex-1">{userSuccess}</div>}
                <Button type="submit" disabled={!userForm.email.trim()}>
                  Kullanıcı Ekle
                </Button>
              </div>
            </form>
            {/* User list */}
            <div className="rounded-xl border bg-white overflow-hidden">
              <div className="px-3 py-2 border-b text-sm text-gray-500 flex items-center justify-between">
                <div>{loadingUsers ? "Yükleniyor..." : `${users.length} kullanıcı`}</div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="px-3 py-2 text-left">E-posta</th>
                      <th className="px-3 py-2 text-left">İsim</th>
                      <th className="px-3 py-2 text-left">Telefon</th>
                      <th className="px-3 py-2 text-left">Rol</th>
                      <th className="px-3 py-2 text-left">Kayıt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-t hover:bg-gray-50">
                        <td className="px-3 py-2 break-all">{u.email}</td>
                        <td className="px-3 py-2">{u.name || "—"}</td>
                        <td className="px-3 py-2">{u.phone || "—"}</td>
                        <td className="px-3 py-2">{u.role === 'OFFICE' ? 'Ofis' : u.role === 'TECHNICIAN' ? 'Teknisyen' : u.role}</td>
                        <td className="px-3 py-2">{new Date(u.createdAt).toLocaleDateString('tr-TR')}</td>
                      </tr>
                    ))}
                    {!users.length && (
                      <tr>
                        <td className="px-3 py-4 text-gray-500" colSpan={5}>Kullanıcı yok.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Document templates section: provide download links for proposal and contract templates */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold">Belgeler ve Şablonlar</div>
            <div className="mt-1 text-xs text-gray-500">Teklif ve sözleşme şablonları</div>
          </div>
        </div>
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white px-4 py-3">
            <div>
              <div className="text-sm font-bold text-gray-800">Teklif Şablonu</div>
              <div className="text-xs text-gray-500">Bakım ve servis teklifleri için örnek PDF</div>
            </div>
            <div className="flex gap-2">
              {/* PDF dosyası statik bir belge olduğundan ve yeni pencerede açılacağından */}
              <a
                href="/docs/teklif-sablonu.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
              >
                İndir
              </a>
              <Link
                href="/app/docs/teklif"
                className="rounded-md border border-blue-600 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50"
              >
                Düzenle/Gönder
              </Link>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white px-4 py-3">
            <div>
              <div className="text-sm font-bold text-gray-800">Sözleşme Şablonu</div>
              <div className="text-xs text-gray-500">Asansör bakım sözleşmesi için örnek PDF</div>
            </div>
            <div className="flex gap-2">
              {/* PDF dosyası statik bir belge olduğundan ve yeni pencerede açılacağından */}
              <a
                href="/docs/sozlesme-sablonu.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
              >
                İndir
              </a>
              <Link
                href="/app/docs/sozlesme"
                className="rounded-md border border-blue-600 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50"
              >
                Düzenle/Gönder
              </Link>
            </div>
          </div>
          <div className="rounded-md border border-amber-100 bg-amber-50 p-3 text-xs text-amber-800">
            Bu PDF şablonlarını firmanızın bilgileriyle düzenleyip müşterilere gönderebilirsiniz. Düzenlenmiş belgeleri sözleşmeye ekleyerek hem iç sistemde hem de müşteri portalında erişilebilir kılın.
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold">Abonelik</div>
            <div className="mt-1 text-xs text-gray-500">
              Mevcut plan:{" "}
              <span className="font-semibold text-gray-700">{planLabel}</span>
            </div>
          </div>
          {ent?.isTrial && !ent.isExpired && (
            <Link
              href="/app/upgrade"
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              Planı Yükselt →
            </Link>
          )}
          {ent?.isExpired && (
            <Link
              href="/app/upgrade"
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600 transition-colors"
            >
              Yenile →
            </Link>
          )}
        </div>

        {ent?.isTrial && !ent.isExpired && (
          <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                </svg>
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-blue-900">
                  Deneme süreniz bitiyor — {ent.daysLeft} gün kaldı
                </div>
                <div className="mt-1 text-xs text-blue-700 leading-relaxed">
                  Süre sonunda sisteme yazma erişiminiz kısıtlanacak. Verileriniz korunmaya devam eder.
                  Planınızı yükseltmek için satış ekibimizle iletişime geçin.
                </div>
              </div>
            </div>
          </div>
        )}

        {ent?.isExpired && (
          <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-white">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-amber-900">Deneme süresi sona erdi</div>
                <div className="mt-1 text-xs text-amber-700 leading-relaxed">
                  Sisteminiz salt-okunur modda. Yeni kayıt oluşturmak ve düzenlemek için plan satın alın.
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border p-4">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">WhatsApp ile Ulaşın</div>
            <a
              href="https://wa.me/905551234567?text=Servisim%20plan%20hakk%C4%B1nda%20bilgi%20almak%20istiyorum"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:underline"
            >
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.555 4.117 1.529 5.845L0 24l6.335-1.509A11.946 11.946 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.885 0-3.65-.487-5.19-1.343l-.373-.213-3.762.896.952-3.672-.234-.386A9.956 9.956 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
              </svg>
              +90 555 123 45 67
            </a>
            <div className="mt-1 text-xs text-gray-400">Hafta içi 09:00 – 18:00</div>
          </div>
          <div className="rounded-xl border p-4">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">E-posta</div>
            <a
              href="mailto:satis@servisim.app?subject=Plan%20Bilgisi"
              className="mt-2 flex items-center gap-2 text-sm font-semibold text-blue-700 hover:underline"
            >
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
              </svg>
              satis@servisim.app
            </a>
            <div className="mt-1 text-xs text-gray-400">1 iş günü içinde dönüş</div>
          </div>
        </div>
      </Card>

      <Card>
        <div className="text-sm font-semibold">Güvenlik & Gizlilik</div>
        <div className="mt-3 flex flex-col gap-3">
          <div className="flex items-center justify-between rounded-lg border px-4 py-3">
            <div>
              <div className="text-sm font-medium text-gray-800">Şifre Değiştir</div>
              <div className="mt-0.5 text-xs text-gray-400">
                Güçlü bir şifre kullanmanızı öneririz (en az 12 karakter).
              </div>
            </div>
            <button
              disabled
              className="rounded-lg border px-3 py-1.5 text-xs font-semibold text-gray-400 cursor-not-allowed"
              title="Yakında aktif olacak"
            >
              Yakında
            </button>
          </div>
          <div className="flex items-center justify-between rounded-lg border px-4 py-3">
            <div>
              <div className="text-sm font-medium text-gray-800">KVKK & Gizlilik Politikası</div>
              <div className="mt-0.5 text-xs text-gray-400">
                Kişisel veri işleme politikası ve aydınlatma metni.
              </div>
            </div>
            <a
              href="/kvkk"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Görüntüle
            </a>
          </div>
        </div>
      </Card>
    </div>
  );
}
