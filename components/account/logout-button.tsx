import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/modules/auth/actions";

export function LogoutButton({ className }: { className?: string }) {
  return (
    <form action={logoutAction}>
      <Button type="submit" variant="outline" size="sm" className={className}>
        <LogOut className="size-4" aria-hidden />
        خروج
      </Button>
    </form>
  );
}
