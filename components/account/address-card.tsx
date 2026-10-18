import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { deleteAddressAction, setDefaultAddressAction } from "@/modules/users/actions";
import type { AddressView } from "@/modules/users/types";
import { AddressForm } from "./address-form";

export function AddressCard({ address }: { address: AddressView }) {
  return (
    <Card className="space-y-3 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-bold">{address.receiverName}</h3>
        {address.isDefault ? <Badge tone="primary">پیش‌فرض</Badge> : null}
      </div>
      <p className="text-muted text-sm leading-7">
        {address.province}، {address.city}، {address.street}، پلاک {address.plaque}
        {address.unit ? `، واحد ${address.unit}` : ""} — کدپستی <bdi dir="ltr">{address.postalCode}</bdi>
      </p>

      <div className="flex flex-wrap gap-2">
        {address.isDefault ? null : (
          <form action={setDefaultAddressAction}>
            <input type="hidden" name="id" value={address.id} />
            <Button type="submit" variant="outline" size="sm">
              پیش‌فرض کن
            </Button>
          </form>
        )}
        <form action={deleteAddressAction}>
          <input type="hidden" name="id" value={address.id} />
          <Button type="submit" variant="ghost" size="sm" className="text-danger">
            حذف
          </Button>
        </form>
      </div>

      <details className="border-border border-t pt-3">
        <summary className="text-primary cursor-pointer text-sm font-bold">ویرایش</summary>
        <div className="pt-4">
          <AddressForm address={address} idPrefix={`edit-${address.id}`} />
        </div>
      </details>
    </Card>
  );
}
