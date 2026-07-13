import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logoutOwner } from "@/app/admin/login/actions";

export function LogoutButton() {
  return (
    <form action={logoutOwner}>
      <Button
        type="submit"
        variant="outline"
        className="border-bone/40 bg-transparent text-floral hover:bg-floral hover:text-ink"
      >
        <LogOut />
        تسجيل الخروج
      </Button>
    </form>
  );
}
