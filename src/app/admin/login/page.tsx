import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isOwnerSession } from "@/lib/admin-auth";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "دخول المالك",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  if (await isOwnerSession()) {
    redirect("/admin/smart-links");
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="cw-container flex min-h-screen items-center justify-center py-16">
        <Card className="w-full max-w-md">
          <CardHeader className="border-b text-center">
            <Link href="/" aria-label="CyberWeel" className="mx-auto">
              <span className="grid size-20 place-items-center rounded-2xl border border-border bg-floral p-3 shadow-sm">
                <Image
                  src="/cyberweel-logo-20260720.svg"
                  alt=""
                  width={64}
                  height={64}
                  className="h-full w-full object-contain"
                  priority
                />
              </span>
            </Link>
            <CardTitle className="mt-4 font-display text-3xl text-ink">
              دخول المالك
            </CardTitle>
            <p className="mt-2 text-sm text-muted-foreground">
              هذه الصفحة مخصصة لمالك الموقع فقط.
            </p>
          </CardHeader>
          <CardContent className="pt-6">
            <LoginForm />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
