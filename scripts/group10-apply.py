from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]

def read(path):
    return (ROOT / path).read_text(encoding="utf-8")

def write(path, text):
    target = ROOT / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(text, encoding="utf-8")

def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly one match, found {count}")
    return text.replace(old, new, 1)

# 1) Server-derived shell access, including legacy owner session compatibility.
auth_path = "src/lib/admin-auth.ts"
auth = read(auth_path)
auth = replace_once(
    auth,
    'import { PARTNER_SESSION_COOKIE, readPartnerSession } from "@/lib/partner-auth";\n',
    'import { PARTNER_SESSION_COOKIE, readPartnerSession } from "@/lib/partner-auth";\nimport { ADMIN_PERMISSIONS } from "@/lib/admin-permissions";\n',
    "admin-auth import",
)
insert_after = '''export async function hasAdminSession(): Promise<boolean> {\n  const cookieStore = await cookies();\n  if (verifySessionToken(cookieStore.get(ADMIN_SESSION_COOKIE)?.value)) return true;\n\n  const unifiedSession = readPartnerSession(cookieStore.get(PARTNER_SESSION_COOKIE)?.value);\n  if (!unifiedSession) return false;\n\n  const user = await db.user.findUnique({\n    where: { id: unifiedSession.userId },\n    select: {\n      role: true,\n      isActive: true,\n      adminProfile: { select: { isActive: true } },\n    },\n  });\n\n  return Boolean(\n    user?.role === "ADMIN" &&\n      user.isActive &&\n      user.adminProfile?.isActive !== false,\n  );\n}\n'''
addition = insert_after + '''\nexport type AdminShellAccess = {\n  isOwner: boolean;\n  permissions: string[];\n};\n\nexport async function getAdminShellAccess(): Promise<AdminShellAccess | null> {\n  const cookieStore = await cookies();\n\n  // The legacy signed admin cookie represents the historical owner session.\n  if (verifySessionToken(cookieStore.get(ADMIN_SESSION_COOKIE)?.value)) {\n    return { isOwner: true, permissions: [...ADMIN_PERMISSIONS] };\n  }\n\n  const unifiedSession = readPartnerSession(cookieStore.get(PARTNER_SESSION_COOKIE)?.value);\n  if (!unifiedSession) return null;\n\n  const user = await db.user.findUnique({\n    where: { id: unifiedSession.userId },\n    select: {\n      role: true,\n      isActive: true,\n      adminProfile: {\n        select: { isOwner: true, isActive: true, permissions: true },\n      },\n    },\n  });\n\n  if (!user || user.role !== "ADMIN" || !user.isActive) return null;\n  if (user.adminProfile?.isActive === false) return null;\n  if (!user.adminProfile) return { isOwner: false, permissions: [] };\n\n  return {\n    isOwner: user.adminProfile.isOwner,\n    permissions: user.adminProfile.isOwner\n      ? [...ADMIN_PERMISSIONS]\n      : user.adminProfile.permissions.filter((permission) =>\n          ADMIN_PERMISSIONS.includes(permission as (typeof ADMIN_PERMISSIONS)[number]),\n        ),\n  };\n}\n\nexport async function requireAdminShellAccess(): Promise<AdminShellAccess> {\n  const access = await getAdminShellAccess();\n  if (!access) redirect("/login");\n  return access;\n}\n'''
auth = replace_once(auth, insert_after, addition, "admin shell access insertion")
write(auth_path, auth)

# 2) Client context so every AdminShell receives the same server-resolved access.
provider = '''"use client";\n\nimport { createContext, type ReactNode, useContext } from "react";\n\nexport type AdminShellAccess = {\n  isOwner: boolean;\n  permissions: string[];\n};\n\nconst AdminShellAccessContext = createContext<AdminShellAccess | null>(null);\n\nexport function AdminShellAccessProvider({ access, children }: { access: AdminShellAccess; children: ReactNode }) {\n  return <AdminShellAccessContext.Provider value={access}>{children}</AdminShellAccessContext.Provider>;\n}\n\nexport function useAdminShellAccess() {\n  const access = useContext(AdminShellAccessContext);\n  if (!access) throw new Error("AdminShellAccessProvider is required for AdminShell");\n  return access;\n}\n'''
write("src/components/admin/admin-shell-access.tsx", provider)

# 3) Resolve access once in the root admin layout and provide it to all shells.
layout_path = "src/app/admin/layout.tsx"
layout = read(layout_path)
layout = replace_once(
    layout,
    'import { AdminActionFeedback } from "@/components/admin/admin-action-feedback";\nimport { requireAdminSession } from "@/lib/admin-auth";\n',
    'import { AdminActionFeedback } from "@/components/admin/admin-action-feedback";\nimport { AdminShellAccessProvider } from "@/components/admin/admin-shell-access";\nimport { requireAdminShellAccess } from "@/lib/admin-auth";\n',
    "admin layout imports",
)
layout = replace_once(
    layout,
    '''export default async function AdminLayout({ children }: { children: ReactNode }) {\n  await requireAdminSession();\n\n  return (\n    <>\n''',
    '''export default async function AdminLayout({ children }: { children: ReactNode }) {\n  const access = await requireAdminShellAccess();\n\n  return (\n    <AdminShellAccessProvider access={access}>\n''',
    "admin layout provider start",
)
layout = replace_once(
    layout,
    '''      `}</style>\n    </>\n  );\n}\n''',
    '''      `}</style>\n    </AdminShellAccessProvider>\n  );\n}\n''',
    "admin layout provider end",
)
write(layout_path, layout)

# 4) Permission-aware canonical AdminShell.
shell_path = "src/components/admin/admin-shell.tsx"
shell = read(shell_path)
shell = replace_once(
    shell,
    'import { DashboardLanguageButton } from "@/components/dashboard-i18n-provider";\n',
    'import { DashboardLanguageButton } from "@/components/dashboard-i18n-provider";\nimport { useAdminShellAccess } from "@/components/admin/admin-shell-access";\n',
    "admin shell access import",
)
old_type = 'type AdminNavItem = { key: AdminNavKey; label: string; href: string; icon: typeof BarChart3 };\n\nconst items: AdminNavItem[] = [\n  { key: "overview", label: "نظرة عامة", href: "/admin/partners?section=overview", icon: BarChart3 },\n  { key: "clients", label: "العملاء", href: "/admin/clients", icon: UserRound },\n  { key: "projects", label: "المشاريع", href: "/admin/partners?section=projects", icon: FolderKanban },\n  { key: "invoices", label: "الفواتير", href: "/admin/invoices", icon: ReceiptText },\n  { key: "referrals", label: "الإحالات", href: "/admin/referrals", icon: CheckCircle2 },\n  { key: "partners", label: "الشركاء", href: "/admin/partners?section=partners", icon: UsersRound },\n  { key: "ambassadors", label: "السفراء", href: "/admin/ambassadors", icon: UsersRound },\n  { key: "account", label: "حساب الإدارة", href: "/admin/partners?section=account", icon: UserCog },\n  { key: "team", label: "إدارة الفريق والصلاحيات", href: "/admin/team", icon: ShieldCheck },\n  { key: "audit-log", label: "سجل النشاطات", href: "/admin/audit-log", icon: History },\n  { key: "smart-links", label: "الروابط الذكية", href: "/admin/smart-links", icon: Link2 },\n];\n'
new_type = '''type AdminNavItem = {\n  key: AdminNavKey;\n  label: string;\n  href: string;\n  icon: typeof BarChart3;\n  permission?: string;\n  permissionsAny?: string[];\n  ownerOnly?: boolean;\n};\n\nconst items: AdminNavItem[] = [\n  { key: "overview", label: "نظرة عامة", href: "/admin/partners?section=overview", icon: BarChart3, permission: "overview" },\n  { key: "clients", label: "العملاء", href: "/admin/clients", icon: UserRound, permission: "clients" },\n  { key: "projects", label: "المشاريع", href: "/admin/partners?section=projects", icon: FolderKanban, permission: "projects" },\n  { key: "invoices", label: "الفواتير", href: "/admin/invoices", icon: ReceiptText, permission: "invoices" },\n  { key: "referrals", label: "الإحالات", href: "/admin/referrals", icon: CheckCircle2, permission: "referrals" },\n  { key: "partners", label: "الشركاء", href: "/admin/partners?section=partners", icon: UsersRound, permission: "partners" },\n  { key: "ambassadors", label: "السفراء", href: "/admin/ambassadors", icon: UsersRound, permissionsAny: ["ambassadors", "rewards"] },\n  { key: "account", label: "حساب الإدارة", href: "/admin/partners?section=account", icon: UserCog },\n  { key: "team", label: "إدارة الفريق والصلاحيات", href: "/admin/team", icon: ShieldCheck, ownerOnly: true },\n  { key: "audit-log", label: "سجل النشاطات", href: "/admin/audit-log", icon: History, permission: "audit_log" },\n  { key: "smart-links", label: "الروابط الذكية", href: "/admin/smart-links", icon: Link2, permission: "smart_links" },\n];\n'''
shell = replace_once(shell, old_type, new_type, "admin nav metadata")
shell = replace_once(
    shell,
    '''  const router = useRouter();\n  const ambassadorSectionActive = active === "ambassadors" || active === "rewards";\n''',
    '''  const router = useRouter();\n  const { isOwner, permissions } = useAdminShellAccess();\n  const hasPermission = (permission: string) => isOwner || permissions.includes(permission);\n  const canManageAmbassadors = hasPermission("ambassadors");\n  const canManageRewards = hasPermission("rewards");\n  const ambassadorSectionActive = active === "ambassadors" || active === "rewards";\n  const visibleItems = items.filter((item) => {\n    if (item.ownerOnly) return isOwner;\n    if (item.permissionsAny) return item.permissionsAny.some(hasPermission);\n    return !item.permission || hasPermission(item.permission);\n  });\n''',
    "admin shell access usage",
)
shell = replace_once(shell, '{items.map((item) => {', '{visibleItems.map((item) => {', "visible admin items")
shell = replace_once(
    shell,
    '''              const Icon = item.icon;\n              const selected = item.key === "ambassadors" ? ambassadorSectionActive : item.key === active;\n              return (\n                <Link\n                  key={item.key}\n                  href={item.href}\n''',
    '''              const Icon = item.icon;\n              const selected = item.key === "ambassadors" ? ambassadorSectionActive : item.key === active;\n              const href = item.key === "ambassadors" && !canManageAmbassadors && canManageRewards\n                ? "/admin/rewards"\n                : item.href;\n              return (\n                <Link\n                  key={item.key}\n                  href={href}\n''',
    "ambassador hub fallback",
)
old_subnav = '''            {ambassadorSectionActive && (\n              <nav aria-label="مركز السفراء" className="mt-6 inline-flex flex-wrap gap-2 rounded-2xl border border-[#D8D2C4] bg-white p-2 shadow-sm dark:border-slate-700 dark:bg-slate-900">\n                <Link\n                  href="/admin/ambassadors"\n                  aria-current={active === "ambassadors" ? "page" : undefined}\n                  className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black transition ${active === "ambassadors" ? "bg-[#111827] text-white dark:bg-[#B89A5A] dark:text-[#111827]" : "text-slate-600 hover:bg-[#F7F3EB] dark:text-slate-300 dark:hover:bg-slate-800"}`}\n                >\n                  <UserRound className="h-4 w-4" />\n                  إدارة السفراء\n                </Link>\n                <Link\n                  href="/admin/rewards"\n                  aria-current={active === "rewards" ? "page" : undefined}\n                  className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black transition ${active === "rewards" ? "bg-[#111827] text-white dark:bg-[#B89A5A] dark:text-[#111827]" : "text-slate-600 hover:bg-[#F7F3EB] dark:text-slate-300 dark:hover:bg-slate-800"}`}\n                >\n                  <BadgeDollarSign className="h-4 w-4" />\n                  مكافآت السفراء\n                </Link>\n              </nav>\n            )}\n'''
new_subnav = '''            {ambassadorSectionActive && (canManageAmbassadors || canManageRewards) && (\n              <nav aria-label="مركز السفراء" className="mt-6 inline-flex flex-wrap gap-2 rounded-2xl border border-[#D8D2C4] bg-white p-2 shadow-sm dark:border-slate-700 dark:bg-slate-900">\n                {canManageAmbassadors && (\n                  <Link\n                    href="/admin/ambassadors"\n                    aria-current={active === "ambassadors" ? "page" : undefined}\n                    className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black transition ${active === "ambassadors" ? "bg-[#111827] text-white dark:bg-[#B89A5A] dark:text-[#111827]" : "text-slate-600 hover:bg-[#F7F3EB] dark:text-slate-300 dark:hover:bg-slate-800"}`}\n                  >\n                    <UserRound className="h-4 w-4" />\n                    إدارة السفراء\n                  </Link>\n                )}\n                {canManageRewards && (\n                  <Link\n                    href="/admin/rewards"\n                    aria-current={active === "rewards" ? "page" : undefined}\n                    className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black transition ${active === "rewards" ? "bg-[#111827] text-white dark:bg-[#B89A5A] dark:text-[#111827]" : "text-slate-600 hover:bg-[#F7F3EB] dark:text-slate-300 dark:hover:bg-slate-800"}`}\n                  >\n                    <BadgeDollarSign className="h-4 w-4" />\n                    مكافآت السفراء\n                  </Link>\n                )}\n              </nav>\n            )}\n'''
shell = replace_once(shell, old_subnav, new_subnav, "permission-aware ambassador subnav")
write(shell_path, shell)

# 5) Replace the legacy custom shell embedded in /admin/partners with canonical AdminShell.
partners_path = "src/app/admin/partners/page.tsx"
partners = read(partners_path)
partners = replace_once(
    partners,
    'import { AdminNotificationCenter } from "@/components/admin/admin-notification-center";\n',
    'import { AdminShell } from "@/components/admin/admin-shell";\n',
    "partners AdminShell import",
)
partners = partners.replace('import { Logo } from "@/components/brand/logo";\n', '')
partners = partners.replace('import { DashboardLanguageButton } from "@/components/dashboard-i18n-provider";\n', '')
logout_pattern = re.compile(r'\n  async function logout\(\) \{\n    await fetch\("/api/partner/logout", \{ method: "POST" \}\);\n    router\.replace\("/login"\);\n    router\.refresh\(\);\n  \}\n')
partners, logout_count = logout_pattern.subn('', partners, count=1)
if logout_count != 1:
    raise SystemExit(f"partners logout removal: expected 1, found {logout_count}")

start = partners.find('  if (loading && !admin) {')
content_marker = '          {message && (\n'
content = partners.find(content_marker, start)
if start < 0 or content < 0:
    raise SystemExit("partners legacy shell start/content markers not found")
new_prefix = '''  const shellTitle = section === "overview"\n    ? `مرحبًا ${admin?.name || "بك"}`\n    : section === "projects"\n      ? "إدارة المشاريع"\n      : section === "partners"\n        ? "إدارة الشركاء"\n        : "حساب الإدارة";\n  const shellDescription = section === "overview"\n    ? "ملخص تشغيلي موحد للعملاء والمشاريع والإحالات والشركاء والسفراء."\n    : section === "projects"\n      ? "إدارة مشاريع العملاء والإسناد التشغيلي للشركاء."\n      : section === "partners"\n        ? "إدارة طلبات الشركاء وحساباتهم وقدراتهم التشغيلية."\n        : "إدارة بيانات الدخول والملف الإداري.";\n\n  return (\n    <AdminShell active={section} eyebrow="مركز التحكم" title={shellTitle} description={shellDescription}>\n      {message && (\n'''
partners = partners[:start] + new_prefix + partners[content + len(content_marker):]

suffix_pattern = re.compile(r'''\n        </section>\n      </div>\n      <style jsx global>\{`\n        \.nav-link \{.*?        \.field \{\n          width: 100%;\n          border-radius: 0\.75rem;\n          border: 1px solid #d8d2c4;\n          padding: 0\.75rem 1rem;\n          background: white;\n        \}\n      `\}</style>\n    </main>''', re.S)
new_suffix = '''\n      <style jsx global>{`\n        .field {\n          width: 100%;\n          border-radius: 0.75rem;\n          border: 1px solid #d8d2c4;\n          padding: 0.75rem 1rem;\n          background: white;\n        }\n      `}</style>\n    </AdminShell>'''
partners, suffix_count = suffix_pattern.subn(new_suffix, partners, count=1)
if suffix_count != 1:
    raise SystemExit(f"partners legacy shell suffix replacement: expected 1, found {suffix_count}")

# Prune lucide icons that became unused after removing the duplicate shell.
lucide = re.search(r'import \{\n(?P<body>.*?)\n\} from "lucide-react";', partners, re.S)
if not lucide:
    raise SystemExit("partners lucide import block not found")
icon_names = [part.strip().rstrip(',') for part in lucide.group('body').splitlines() if part.strip()]
body_without_import = partners[:lucide.start()] + partners[lucide.end():]
used_icons = [name for name in icon_names if re.search(rf'\b{re.escape(name)}\b', body_without_import)]
rebuilt = 'import {\n' + ''.join(f'  {name},\n' for name in used_icons) + '} from "lucide-react";'
partners = partners[:lucide.start()] + rebuilt + partners[lucide.end():]
write(partners_path, partners)

# 6) Permanent structural regression tests.
test = '''import assert from "node:assert/strict";\nimport { readFileSync } from "node:fs";\nimport test from "node:test";\n\nconst read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");\n\ntest("Group 10 resolves admin shell access on the server and provides it once at the admin root", () => {\n  const layout = read("src/app/admin/layout.tsx");\n  const auth = read("src/lib/admin-auth.ts");\n  assert.match(layout, /requireAdminShellAccess/);\n  assert.match(layout, /AdminShellAccessProvider access=\{access\}/);\n  assert.match(auth, /getAdminShellAccess/);\n  assert.match(auth, /verifySessionToken\(cookieStore\.get\(ADMIN_SESSION_COOKIE\)/);\n  assert.match(auth, /return \{ isOwner: true, permissions: \[\.\.\.ADMIN_PERMISSIONS\] \}/);\n  assert.match(auth, /user\.adminProfile\.permissions\.filter/);\n});\n\ntest("Group 10 canonical shell filters navigation with server-resolved permissions", () => {\n  const shell = read("src/components/admin/admin-shell.tsx");\n  assert.match(shell, /useAdminShellAccess/);\n  assert.match(shell, /permission: "overview"/);\n  assert.match(shell, /permission: "clients"/);\n  assert.match(shell, /permission: "projects"/);\n  assert.match(shell, /permission: "invoices"/);\n  assert.match(shell, /permission: "referrals"/);\n  assert.match(shell, /permission: "partners"/);\n  assert.match(shell, /permission: "audit_log"/);\n  assert.match(shell, /permission: "smart_links"/);\n  assert.match(shell, /ownerOnly: true/);\n  assert.match(shell, /visibleItems = items\.filter/);\n  assert.match(shell, /\{visibleItems\.map/);\n});\n\ntest("Group 10 keeps ambassador and rewards navigation reachable only for granted capabilities", () => {\n  const shell = read("src/components/admin/admin-shell.tsx");\n  assert.match(shell, /permissionsAny: \["ambassadors", "rewards"\]/);\n  assert.match(shell, /!canManageAmbassadors && canManageRewards/);\n  assert.match(shell, /\{canManageAmbassadors && \(/);\n  assert.match(shell, /\{canManageRewards && \(/);\n});\n\ntest("Group 10 removes the duplicate partners shell and uses the canonical AdminShell", () => {\n  const partners = read("src/app/admin/partners/page.tsx");\n  assert.match(partners, /import \{ AdminShell \} from "@\/components\/admin\/admin-shell"/);\n  assert.match(partners, /<AdminShell active=\{section\}/);\n  assert.doesNotMatch(partners, /className="nav-link"/);\n  assert.doesNotMatch(partners, /data-admin-shell-root/);\n  assert.doesNotMatch(partners, /AdminNotificationCenter/);\n  assert.doesNotMatch(partners, /DashboardLanguageButton/);\n  assert.doesNotMatch(partners, /async function logout\(\)/);\n});\n\ntest("Group 10 keeps the account section reachable while team remains owner-only", () => {\n  const shell = read("src/components/admin/admin-shell.tsx");\n  assert.match(shell, /key: "account"[^\n]+href: "\/admin\/partners\?section=account"/);\n  assert.match(shell, /key: "team"[^\n]+ownerOnly: true/);\n});\n'''
write("tests/group-10-admin-shell-parity.test.mjs", test)

print("Group 10 deterministic patch applied")
