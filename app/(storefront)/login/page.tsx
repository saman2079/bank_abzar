import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { Card } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/dal";
import { safeRedirectPath } from "@/modules/auth/redirect";

export const metadata: Metadata = {
  title: "ورود یا ثبت‌نام",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<{ next?: string | string[] }>;

async function LoginContent({ searchParams }: { searchParams: SearchParams }) {
  const [{ next }, user] = await Promise.all([searchParams, getCurrentUser()]);
  const target = safeRedirectPath(typeof next === "string" ? next : undefined);

  if (user) redirect(target);

  return (
    <Card className="space-y-6 p-6">
      <div className="space-y-1">
        <h1 className="text-xl font-extrabold">ورود یا ثبت‌نام</h1>
        <p className="text-muted text-sm">فقط با شماره موبایل؛ بدون نیاز به رمز عبور.</p>
      </div>
      <LoginForm next={target} />
    </Card>
  );
}

export default function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <div className="mx-auto max-w-md py-8">
      <Suspense fallback={<div className="bg-surface-2 rounded-card h-72 animate-pulse" />}>
        <LoginContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
