"use client";

import { useEffect, useState } from "react";
import { ChevronDown, LayoutDashboard, LogIn, LogOut, Menu, Settings } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { NAV_ITEMS, type ViewId } from "@/lib/site-data";
import { useNav } from "@/components/site/nav-context";
import { useI18n } from "@/components/site/i18n";
import { LanguageSwitcher } from "@/components/site/language-switcher";
import { ThemeToggle } from "@/components/site/theme-toggle";

const HEADER_ITEMS = NAV_ITEMS.filter((item) => item.id !== "share-challenge");

type SignedInAccount = {
  name: string;
  identifier: string;
  role: "ADMIN" | "PARTNER" | "AMBASSADOR" | "CLIENT";
  dashboardUrl: string;
  dashboardLinks: Array<{ capability: string; label: string; url: string }>;
  settingsUrl: string;
};

const dashboardCapabilityEnglish: Record<string, string> = {
  ADMIN: "Admin",
  CLIENT: "Client",
  PARTNER: "Execution Partner",
  AMBASSADOR: "Ambassador",
};

function Wordmark({ compact = false, isArabic }: { compact?: boolean; isArabic: boolean }) {
  return (
    <span className="flex items-center gap-3">
      <Logo size={compact ? 42 : 54} />
      <span className="flex flex-col">
        <span aria-label="CyberWeel" className={cn("block bg-ink", compact ? "h-[31px] w-[116px]" : "h-[40px] w-[148px]")} style={{ WebkitMaskImage: "url('/cyberweel-wordmark.svg')", maskImage: "url('/cyberweel-wordmark.svg')", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat", WebkitMaskPosition: "center", maskPosition: "center", WebkitMaskSize: "contain", maskSize: "contain" }} />
        {!compact && (
          <span className="mt-1 text-[11px] font-bold tracking-[0.18em] text-muted-foreground">
            {isArabic ? "شريكك للتقدّم" : "YOUR PARTNER IN PROGRESS"}
          </span>
        )}
      </span>
    </span>
  );
}

export function SiteHeaderRefined() {
  const { view, navigate } = useNav();
  const { t, dir } = useI18n();
  const isArabic = dir === "rtl";
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [account, setAccount] = useState<SignedInAccount | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/account/session", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => {
        if (active && data.authenticated && data.account) setAccount(data.account);
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);

  const go = (id: ViewId) => { navigate(id); setMobileOpen(false); };
  const navLabel = (id: ViewId) => {
    if (isArabic && id === "how-we-help") return "كيف نساعدك";
    if (isArabic && id === "partner") return "انضم إلينا";
    if (!isArabic && id === "partner") return "Work with us";
    return t.nav[id];
  };
  const menuLabel = isArabic ? "فتح القائمة" : "Open navigation menu";
  const loginLabel = isArabic ? "تسجيل الدخول" : "Sign in";
  const accountInitial = account?.name.trim().charAt(0).toUpperCase() || "C";

  async function logout() {
    await fetch("/api/partner/logout", { method: "POST" });
    setAccount(null);
    setAccountOpen(false);
    setMobileOpen(false);
    window.location.assign("/");
  }

  const renderAccountLinks = (mobile = false) => account ? (
    <>
      {(account.dashboardLinks?.length ? account.dashboardLinks : [{ capability: account.role, label: "", url: account.dashboardUrl }]).map((dashboard) => (
        <a key={dashboard.capability} href={dashboard.url} onClick={() => { setAccountOpen(false); setMobileOpen(false); }} className={cn("focus-ring flex items-center gap-3 font-semibold text-ink transition hover:bg-muted", mobile ? "rounded-md px-4 py-3" : "rounded-lg px-3 py-2.5 text-sm")}>
          <LayoutDashboard className="h-4 w-4 text-accent" />
          {dashboard.label
            ? (isArabic
                ? `لوحة ${dashboard.label}`
                : `${dashboardCapabilityEnglish[dashboard.capability] || dashboard.label} Dashboard`)
            : (isArabic ? "لوحة التحكم" : "Dashboard")}
        </a>
      ))}
      <a href={account.settingsUrl} onClick={() => { setAccountOpen(false); setMobileOpen(false); }} className={cn("focus-ring flex items-center gap-3 font-semibold text-ink transition hover:bg-muted", mobile ? "rounded-md px-4 py-3" : "rounded-lg px-3 py-2.5 text-sm")}>
        <Settings className="h-4 w-4 text-accent" />
        {isArabic ? "إعدادات الحساب" : "Account settings"}
      </a>
      <button type="button" onClick={logout} className={cn("focus-ring flex w-full items-center gap-3 font-semibold text-red-700 transition hover:bg-red-50", mobile ? "rounded-md px-4 py-3" : "rounded-lg px-3 py-2.5 text-sm")}>
        <LogOut className="h-4 w-4" />
        {isArabic ? "تسجيل الخروج" : "Sign out"}
      </button>
    </>
  ) : null;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/70 bg-background/90 backdrop-blur-md">
      <div className="cw-container flex h-24 items-center justify-between">
        <button type="button" onClick={() => go("home")} className="focus-ring rounded-md" aria-label={`CyberWeel — ${t.nav.home}`}><span className="sm:hidden"><Logo size={42} /></span><span className="hidden sm:inline-flex"><Wordmark isArabic={isArabic} /></span></button>
        <nav className="hidden items-center gap-1 lg:flex" aria-label={isArabic ? "التنقل الرئيسي" : "Primary navigation"}>
          {HEADER_ITEMS.map((item) => {
            const active = view === item.id;
            return <button key={item.id} type="button" onClick={() => go(item.id)} className={cn("focus-ring group relative rounded-md px-3 py-2 text-sm font-medium transition-colors", active ? "text-ink" : "text-muted-foreground hover:text-ink")} aria-current={active ? "page" : undefined}>{navLabel(item.id)}<span className={cn("absolute inset-x-3 -bottom-[1px] h-[2px] bg-accent transition-transform duration-300", isArabic ? "origin-right" : "origin-left", active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100")} aria-hidden /></button>;
          })}
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LanguageSwitcher />
          {account ? (
            <div className="relative hidden sm:block">
              <button type="button" onClick={() => setAccountOpen((value) => !value)} className="focus-ring flex items-center gap-2 rounded-full border border-border bg-white py-1.5 pe-3 ps-1.5 text-sm font-bold text-ink shadow-sm transition hover:border-camel">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-ink text-sm font-black text-floral">{accountInitial}</span>
                <span className="max-w-28 truncate">{account.name}</span>
                <ChevronDown className={cn("h-4 w-4 transition-transform", accountOpen && "rotate-180")} />
              </button>
              {accountOpen && (
                <div className="absolute end-0 top-[calc(100%+10px)] w-64 rounded-2xl border border-border bg-white p-2 shadow-xl">
                  <div className="border-b border-border px-3 py-3">
                    <p className="truncate font-black text-ink">{account.name}</p>
                    <p dir="ltr" className="mt-1 truncate text-xs text-muted-foreground">{account.identifier}</p>
                  </div>
                  <div className="mt-1 grid gap-1">{renderAccountLinks()}</div>
                </div>
              )}
            </div>
          ) : (
            <a href="/login" className="focus-ring hidden items-center gap-2 rounded-md bg-ink px-5 py-2.5 text-sm font-semibold text-floral transition-colors hover:bg-ink/90 sm:inline-flex"><LogIn className="h-4 w-4" />{loginLabel}</a>
          )}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild><button type="button" className="focus-ring inline-flex h-11 w-11 items-center justify-center rounded-md text-ink lg:hidden" aria-label={menuLabel}><Menu className="h-6 w-6" /></button></SheetTrigger>
            <SheetContent side={isArabic ? "left" : "right"} className="flex w-full max-w-sm flex-col border-border bg-background p-0">
              <SheetHeader className="border-b border-border px-6 py-5 text-start"><SheetTitle className="text-start"><Wordmark compact isArabic={isArabic} /></SheetTitle></SheetHeader>
              <nav className="flex flex-col px-3 py-4" aria-label={isArabic ? "تنقل الهاتف" : "Mobile navigation"}>
                {HEADER_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const active = view === item.id;
                  return <button key={item.id} type="button" onClick={() => go(item.id)} className={cn("focus-ring flex items-center justify-between rounded-md px-4 py-4 text-start text-base transition-colors", active ? "bg-muted text-ink" : "text-muted-foreground hover:bg-muted/60 hover:text-ink")} aria-current={active ? "page" : undefined}><span className="flex items-center gap-3"><Icon className="h-5 w-5 text-accent" /><span className="font-medium">{navLabel(item.id)}</span></span>{active && <span className="h-1.5 w-1.5 rounded-full bg-accent" />}</button>;
                })}
              </nav>
              <div className="mt-auto space-y-3 border-t border-border px-6 py-6">
                <button type="button" onClick={() => go("share-challenge")} className="focus-ring flex w-full items-center justify-center rounded-md border border-border px-5 py-3 text-sm font-semibold text-ink transition-colors hover:bg-muted">{isArabic ? "شاركنا مشكلتك" : "Share your challenge"}</button>
                {account ? (
                  <div className="rounded-2xl border border-border bg-white p-2">
                    <div className="flex items-center gap-3 border-b border-border px-3 py-3">
                      <span className="grid h-10 w-10 place-items-center rounded-full bg-ink font-black text-floral">{accountInitial}</span>
                      <div className="min-w-0"><p className="truncate font-black text-ink">{account.name}</p><p dir="ltr" className="truncate text-xs text-muted-foreground">{account.identifier}</p></div>
                    </div>
                    <div className="mt-1 grid gap-1">{renderAccountLinks(true)}</div>
                  </div>
                ) : (
                  <a href="/login" className="focus-ring flex w-full items-center justify-center gap-2 rounded-md bg-ink px-5 py-3 text-sm font-semibold text-floral transition-colors hover:bg-ink/90"><LogIn className="h-4 w-4" />{loginLabel}</a>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
