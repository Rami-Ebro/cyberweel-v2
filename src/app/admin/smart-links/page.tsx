import Image from "next/image";
import Link from "next/link";
import { Activity, Link2, MousePointerClick, Power } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireOwner } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { toggleSmartLink } from "./actions";
import { LogoutButton } from "./logout-button";
import { CreateSmartLinkForm, EditDestinationForm } from "./smart-link-forms";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "إدارة الروابط الذكية",
  robots: { index: false, follow: false },
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("ar", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default async function SmartLinksAdminPage() {
  await requireOwner();

  const smartLinks = await db.smartLink.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { scans: true } } },
  });

  const activeLinks = smartLinks.filter((link) => link.isActive).length;
  const totalVisits = smartLinks.reduce((sum, link) => sum + link._count.scans, 0);

  return (
    <main className="min-h-screen bg-background pb-16 text-foreground">
      <header className="border-b border-border bg-ink text-floral">
        <div className="cw-container flex min-h-24 items-center justify-between gap-5 py-4">
          <Link href="/" className="flex items-center gap-3" aria-label="CyberWeel">
            <Image
              src="/logo-transparent.png"
              alt=""
              width={52}
              height={52}
              className="object-contain"
              priority
            />
            <span>
              <span className="block font-display text-2xl font-bold">CyberWeel</span>
              <span className="mt-1 block text-xs font-bold tracking-[0.12em] text-bone/80">
                لوحة الإدارة
              </span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Button asChild variant="outline" className="border-bone/40 bg-transparent text-floral hover:bg-floral hover:text-ink">
              <Link href="/">العودة إلى الموقع</Link>
            </Button>
            <LogoutButton />
          </div>
        </div>
      </header>

      <div className="cw-container py-10">
        <div className="mb-8 max-w-3xl">
          <p className="eyebrow-camel">Smart Links</p>
          <h1 className="mt-3 font-display text-4xl font-bold text-ink sm:text-5xl">
            إدارة الروابط الذكية
          </h1>
          <p className="mt-4 leading-8 text-muted-foreground">
            أنشئ الروابط المختصرة، غيّر وجهاتها، وتابع الزيارات من مكان واحد.
          </p>
        </div>

        <section aria-label="ملخص الروابط" className="grid gap-4 sm:grid-cols-3">
          <SummaryCard icon={Link2} label="إجمالي الروابط" value={smartLinks.length} />
          <SummaryCard icon={Activity} label="الروابط النشطة" value={activeLinks} />
          <SummaryCard icon={MousePointerClick} label="إجمالي الزيارات" value={totalVisits} />
        </section>

        <Card className="mt-8">
          <CardHeader className="border-b">
            <CardTitle className="font-display text-2xl text-ink">إنشاء رابط جديد</CardTitle>
          </CardHeader>
          <CardContent>
            <CreateSmartLinkForm />
          </CardContent>
        </Card>

        <Card className="mt-8 overflow-hidden">
          <CardHeader className="border-b">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle className="font-display text-2xl text-ink">الروابط الحالية</CardTitle>
              <span className="text-sm font-semibold text-muted-foreground">
                {smartLinks.length} رابط
              </span>
            </div>
          </CardHeader>
          <CardContent className="px-0">
            {smartLinks.length === 0 ? (
              <div className="px-6 py-14 text-center">
                <Link2 className="mx-auto size-10 text-camel" />
                <p className="mt-4 font-bold text-ink">لا توجد روابط بعد</p>
                <p className="mt-2 text-sm text-muted-foreground">أنشئ أول رابط من النموذج أعلاه.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>الرابط</TableHead>
                      <TableHead>الوجهة</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>الزيارات</TableHead>
                      <TableHead>تاريخ الإنشاء</TableHead>
                      <TableHead className="text-left">الإجراء</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {smartLinks.map((smartLink) => (
                      <TableRow key={smartLink.id}>
                        <TableCell className="min-w-48 align-top">
                          <p className="font-bold text-ink">{smartLink.title}</p>
                          <span
                            className="mt-1 inline-flex text-sm font-semibold text-camel"
                            dir="ltr"
                          >
                            /r/{smartLink.slug}
                          </span>
                        </TableCell>
                        <TableCell className="align-top">
                          <EditDestinationForm
                            id={smartLink.id}
                            destinationUrl={smartLink.destinationUrl}
                          />
                        </TableCell>
                        <TableCell className="align-top">
                          <Badge
                            variant="outline"
                            className={
                              smartLink.isActive
                                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                                : "border-border bg-muted text-muted-foreground"
                            }
                          >
                            {smartLink.isActive ? "نشط" : "متوقف"}
                          </Badge>
                        </TableCell>
                        <TableCell className="align-top text-lg font-bold text-ink">
                          {smartLink._count.scans.toLocaleString("ar")}
                        </TableCell>
                        <TableCell className="whitespace-nowrap align-top text-sm text-muted-foreground">
                          {formatDate(smartLink.createdAt)}
                        </TableCell>
                        <TableCell className="align-top text-left">
                          <form action={toggleSmartLink}>
                            <input type="hidden" name="id" value={smartLink.id} />
                            <input
                              type="hidden"
                              name="nextState"
                              value={String(!smartLink.isActive)}
                            />
                            <Button
                              type="submit"
                              size="sm"
                              variant={smartLink.isActive ? "outline" : "default"}
                            >
                              <Power />
                              {smartLink.isActive ? "تعطيل" : "تفعيل"}
                            </Button>
                          </form>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Link2;
  label: string;
  value: number;
}) {
  return (
    <Card className="gap-3 py-5">
      <CardContent className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-bold text-ink">{value.toLocaleString("ar")}</p>
        </div>
        <span className="grid size-12 place-items-center rounded-full bg-camel/15 text-camel">
          <Icon className="size-5" />
        </span>
      </CardContent>
    </Card>
  );
}
