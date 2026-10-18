import type { Metadata } from "next";
import { AddressCard } from "@/components/account/address-card";
import { AddressForm } from "@/components/account/address-form";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/dal";
import { MAX_ADDRESSES } from "@/modules/users/constants";
import { listAddresses } from "@/modules/users/queries";

export const metadata: Metadata = { title: "آدرس‌ها" };

export default async function AddressesPage() {
  const user = await requireUser("/account/addresses");
  const addresses = await listAddresses(user.id);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-extrabold">آدرس‌ها</h1>

      {addresses.length === 0 ? (
        <p className="text-muted text-sm">هنوز آدرسی ثبت نکرده‌اید. آدرس هنگام ثبت سفارش هم قابل ثبت است.</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {addresses.map((address) => (
            <AddressCard key={address.id} address={address} />
          ))}
        </div>
      )}

      {addresses.length < MAX_ADDRESSES ? (
        <Card className="space-y-4 p-5">
          <h2 className="font-bold">افزودن آدرس جدید</h2>
          <AddressForm idPrefix="new" />
        </Card>
      ) : null}
    </div>
  );
}
