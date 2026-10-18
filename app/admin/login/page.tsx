import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AdminLoginForm } from "@/components/auth/admin-login-form";
import { Card } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/dal";
import { isStaffRole } from "@/modules/auth/constants";

export const metadata: Metadata = { title: "ورود مدیریت" };

async function AdminLoginContent() {
  const user = await getCurrentUser();
  if (user && isStaffRole(user.role)) redirect("/admin");

  return (
    <Card className="space-y-6 p-6">
      <h1 className="text-xl font-extrabold">ورود به پنل مدیریت</h1>
      <AdminLoginForm />
    </Card>
  );
}

export default function AdminLoginPage() {
  return (
    <main className="mx-auto grid min-h-screen max-w-sm place-items-center px-4">
      <div className="w-full">
        <Suspense fallback={<div className="bg-surface-2 rounded-card h-72 animate-pulse" />}>
          <AdminLoginContent />
        </Suspense>
      </div>
    </main>
  );
}
