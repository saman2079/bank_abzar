export type UserFormState = { ok?: boolean; error?: string };

export type AddressView = {
  id: string;
  receiverName: string;
  receiverPhone: string;
  province: string;
  city: string;
  postalCode: string;
  street: string;
  plaque: string;
  unit: string | null;
  isDefault: boolean;
};
