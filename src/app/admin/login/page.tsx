import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "تسجيل الدخول إلى CyberWeel",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  redirect("/login");
}
