"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { diffFields, writeAudit } from "@/lib/audit";
import { CACHE_TAGS } from "@/lib/cache";
import { requireStaff } from "@/lib/dal";
import { db } from "@/lib/db";
import { isUniqueViolation } from "@/lib/db-errors";
import { formString, type ActionState } from "@/lib/form";
import { discountPercent } from "@/lib/format";
import { brandSchema, categorySchema, entityIdSchema, productCreateSchema, productUpdateSchema } from "./schemas";

function firstIssue(error: { issues: { message: string }[] }): string {
  return error.issues[0]?.message ?? "ورودی نامعتبر است.";
}

function invalidateProducts(...slugs: string[]) {
  updateTag(CACHE_TAGS.catalog);
  for (const slug of new Set(slugs)) updateTag(CACHE_TAGS.product(slug));
}

function productFormData(formData: FormData) {
  return {
    name: formString(formData, "name"),
    sku: formString(formData, "sku"),
    slug: formString(formData, "slug"),
    brandId: formString(formData, "brandId"),
    categoryId: formString(formData, "categoryId"),
    shortDescription: formString(formData, "shortDescription"),
    description: formString(formData, "description"),
    price: formString(formData, "price"),
    compareAtPrice: formString(formData, "compareAtPrice"),
    lowStockThreshold: formString(formData, "lowStockThreshold"),
    status: formString(formData, "status"),
    specs: formString(formData, "specs"),
    seoTitle: formString(formData, "seoTitle"),
    seoDescription: formString(formData, "seoDescription"),
  };
}

export async function createProductAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const staff = await requireStaff();

  const parsed = productCreateSchema.safeParse({
    ...productFormData(formData),
    initialStock: formString(formData, "initialStock"),
  });
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const { initialStock, compareAtPrice, ...fields } = parsed.data;

  let id: string;
  try {
    id = await db.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: {
          ...fields,
          compareAtPrice,
          discountPercent: discountPercent(fields.price, compareAtPrice ?? undefined),
          stock: initialStock,
        },
        select: { id: true },
      });

      if (initialStock > 0) {
        await tx.stockMovement.create({
          data: { productId: created.id, delta: initialStock, type: "INITIAL", userId: staff.id, note: "موجودی اولیه" },
        });
      }
      await writeAudit(
        {
          actor: staff,
          action: "product.create",
          entity: "product",
          entityId: created.id,
          diff: { name: fields.name, price: fields.price, status: fields.status, initialStock },
        },
        tx,
      );
      return created.id;
    });
  } catch (error) {
    if (isUniqueViolation(error)) return { error: "نامک یا کد کالا (SKU) تکراری است." };
    throw error;
  }

  invalidateProducts(fields.slug);
  redirect(`/admin/products/${id}`);
}

export async function updateProductAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const staff = await requireStaff();

  const id = entityIdSchema.safeParse(formString(formData, "id"));
  if (!id.success) return { error: "محصول نامعتبر است." };

  const parsed = productUpdateSchema.safeParse(productFormData(formData));
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const before = await db.product.findUnique({ where: { id: id.data } });
  if (!before) return { error: "محصول پیدا نشد." };

  const { compareAtPrice, ...fields } = parsed.data;
  const data = { ...fields, compareAtPrice, discountPercent: discountPercent(fields.price, compareAtPrice ?? undefined) };

  try {
    await db.$transaction(async (tx) => {
      await tx.product.update({ where: { id: before.id }, data });
      await writeAudit(
        {
          actor: staff,
          action: "product.update",
          entity: "product",
          entityId: before.id,
          diff: diffFields(before, data),
        },
        tx,
      );
    });
  } catch (error) {
    if (isUniqueViolation(error)) return { error: "نامک یا کد کالا (SKU) تکراری است." };
    throw error;
  }

  invalidateProducts(before.slug, fields.slug);
  return { ok: true };
}

export async function saveCategoryAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const staff = await requireStaff();

  const parsed = categorySchema.safeParse({
    name: formString(formData, "name"),
    slug: formString(formData, "slug"),
    parentId: formString(formData, "parentId"),
    description: formString(formData, "description"),
    sortOrder: formString(formData, "sortOrder") || "0",
    isActive: formData.get("isActive") === "on",
    seoTitle: formString(formData, "seoTitle"),
    seoDescription: formString(formData, "seoDescription"),
  });
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const id = formString(formData, "id");
  const data = parsed.data;

  // جلوگیری از حلقه در درخت: والد نباید خود دسته یا یکی از زیرمجموعه‌هایش باشد.
  if (id && data.parentId) {
    let cursor: string | null = data.parentId;
    for (let depth = 0; cursor && depth < 50; depth += 1) {
      if (cursor === id) return { error: "دسته نمی‌تواند والد خودش یا زیرمجموعه‌اش باشد." };
      const parent: { parentId: string | null } | null = await db.category.findUnique({
        where: { id: cursor },
        select: { parentId: true },
      });
      cursor = parent?.parentId ?? null;
    }
  }

  try {
    if (id) {
      const before = await db.category.findUnique({ where: { id } });
      if (!before) return { error: "دسته پیدا نشد." };

      await db.$transaction(async (tx) => {
        await tx.category.update({ where: { id }, data });
        await writeAudit(
          { actor: staff, action: "category.update", entity: "category", entityId: id, diff: diffFields(before, data) },
          tx,
        );
      });
    } else {
      const created = await db.$transaction(async (tx) => {
        const row = await tx.category.create({ data, select: { id: true } });
        await writeAudit(
          { actor: staff, action: "category.create", entity: "category", entityId: row.id, diff: { name: data.name } },
          tx,
        );
        return row;
      });
      updateTag(CACHE_TAGS.categories);
      updateTag(CACHE_TAGS.catalog);
      redirect(`/admin/categories/${created.id}`);
    }
  } catch (error) {
    if (isUniqueViolation(error)) return { error: "این نامک قبلاً استفاده شده است." };
    throw error;
  }

  updateTag(CACHE_TAGS.categories);
  updateTag(CACHE_TAGS.catalog);
  return { ok: true };
}

export async function deleteCategoryAction(formData: FormData): Promise<void> {
  const staff = await requireStaff();
  const id = entityIdSchema.safeParse(formString(formData, "id"));
  if (!id.success) return;

  // فقط دسته‌ی خالی (بدون محصول/زیردسته) حذف می‌شود؛ Restrict در DB هم محافظ است.
  const deleted = await db.category.deleteMany({
    where: { id: id.data, products: { none: {} }, children: { none: {} } },
  });
  if (deleted.count > 0) {
    await writeAudit({ actor: staff, action: "category.delete", entity: "category", entityId: id.data });
    updateTag(CACHE_TAGS.categories);
    updateTag(CACHE_TAGS.catalog);
  }
  redirect("/admin/categories");
}

export async function saveBrandAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const staff = await requireStaff();

  const parsed = brandSchema.safeParse({ name: formString(formData, "name"), slug: formString(formData, "slug") });
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const id = formString(formData, "id");

  try {
    if (id) {
      const before = await db.brand.findUnique({ where: { id } });
      if (!before) return { error: "برند پیدا نشد." };

      await db.$transaction(async (tx) => {
        await tx.brand.update({ where: { id }, data: parsed.data });
        await writeAudit(
          { actor: staff, action: "brand.update", entity: "brand", entityId: id, diff: diffFields(before, parsed.data) },
          tx,
        );
      });
    } else {
      const created = await db.$transaction(async (tx) => {
        const row = await tx.brand.create({ data: parsed.data, select: { id: true } });
        await writeAudit(
          { actor: staff, action: "brand.create", entity: "brand", entityId: row.id, diff: { name: parsed.data.name } },
          tx,
        );
        return row;
      });
      updateTag(CACHE_TAGS.brands);
      updateTag(CACHE_TAGS.catalog);
      redirect(`/admin/brands/${created.id}`);
    }
  } catch (error) {
    if (isUniqueViolation(error)) return { error: "نام یا نامک برند تکراری است." };
    throw error;
  }

  updateTag(CACHE_TAGS.brands);
  updateTag(CACHE_TAGS.catalog);
  return { ok: true };
}

export async function deleteBrandAction(formData: FormData): Promise<void> {
  const staff = await requireStaff();
  const id = entityIdSchema.safeParse(formString(formData, "id"));
  if (!id.success) return;

  const deleted = await db.brand.deleteMany({ where: { id: id.data, products: { none: {} } } });
  if (deleted.count > 0) {
    await writeAudit({ actor: staff, action: "brand.delete", entity: "brand", entityId: id.data });
    updateTag(CACHE_TAGS.brands);
    updateTag(CACHE_TAGS.catalog);
  }
  redirect("/admin/brands");
}
