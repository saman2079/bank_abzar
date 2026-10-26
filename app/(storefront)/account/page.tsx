import type { Metadata } from "next";
import { ProfileForm } from "@/components/account/profile-form";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/dal";

export const metadata: Metadata = { title: "پروفایل" };

export default async function ProfilePage() {
  const user = await requireUser("/account");

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-extrabold">پروفایل</h1>
      <Card className="max-w-xl p-5 md:p-6">
        <ProfileForm phone={user.phone} name={user.name} email={user.email} />
      </Card>
    </div>
  );
}
