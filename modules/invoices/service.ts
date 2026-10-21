import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { writeAudit } from "@/lib/audit";
import { db } from "@/lib/db";
import type { SessionUser } from "@/lib/session";
import { calcInvoiceTotals } from "./constants";
import type { InvoiceFormInput } from "./schemas";

type Tx = Prisma.TransactionClient;

class InvoiceError extends Error {}

export type InvoiceResult =
  | { ok: true; invoiceId: string; /** slug کالاهای تغییرکرده برای بی‌اعتبارسازی کش */ slugs: string[] }
  | { ok: false; error: string };

type StockLine = { productId: string; quantity: number };

const DAY_MS = 86_400_000;

/** جمع تعداد هر کالا (ردیف‌های تکراری یک کالا ممکن است قیمت متفاوت داشته باشند) با ترتیب ثابت productId. */
function aggregateByProduct(lines: readonly StockLine[]): [string, number][] {
  const merged = new Map<string, number>();
  for (const line of lines) merged.set(line.productId, (merged.get(line.productId) ?? 0) + line.quantity);
  return [...merged.entries()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
}

async function slugsOf(tx: Tx, productIds: string[]): Promise<string[]> {
  const rows = await tx.product.findMany({ where: { id: { in: productIds } }, select: { slug: true } });
  return rows.map((row) => row.slug);
}

/**
 * کسر اتمیک موجودی برای فاکتور قطعی: `UPDATE ... WHERE stock >= n` (همان الگوی سفارش آنلاین)،
 * قفل‌ها به ترتیب productId تا deadlock نشود. اگر یک کالا کم بیاید خطا می‌دهد و کل تراکنش برمی‌گردد.
 */
async function deductStock(tx: Tx, actor: SessionUser, invoice: { id: string; number: number }, lines: readonly StockLine[]): Promise<string[]> {
  const merged = aggregateByProduct(lines);

  for (const [productId, quantity] of merged) {
    const updated = await tx.product.updateMany({
      where: { id: productId, stock: { gte: quantity } },
      data: { stock: { decrement: quantity } },
    });
    if (updated.count === 0) {
      const product = await tx.product.findUnique({ where: { id: productId }, select: { name: true, stock: true } });
      throw new InvoiceError(
        product ? `موجودی «${product.name}» کافی نیست (موجودی فعلی: ${product.stock}، درخواستی: ${quantity}).` : "یکی از کالاها پیدا نشد.",
      );
    }
  }

  await tx.stockMovement.createMany({
    data: merged.map(([productId, quantity]) => ({
      productId,
      delta: -quantity,
      type: "SALE" as const,
      invoiceId: invoice.id,
      userId: actor.id,
      note: `فاکتور ${1000 + invoice.number}`,
    })),
  });

  return slugsOf(tx, merged.map(([productId]) => productId));
}

/** بازگرداندن موجودی هنگام ابطال فاکتور قطعی. */
async function restoreStock(tx: Tx, actor: SessionUser, invoice: { id: string; number: number }, lines: readonly StockLine[], reason: string): Promise<string[]> {
  const merged = aggregateByProduct(lines);

  for (const [productId, quantity] of merged) {
    await tx.product.update({ where: { id: productId }, data: { stock: { increment: quantity } } });
  }
  await tx.stockMovement.createMany({
    data: merged.map(([productId, quantity]) => ({
      productId,
      delta: quantity,
      type: "RETURN" as const,
      invoiceId: invoice.id,
      userId: actor.id,
      note: `ابطال فاکتور ${1000 + invoice.number} — ${reason}`,
    })),
  });

  return slugsOf(tx, merged.map(([productId]) => productId));
}

/** کالاهای فرم را می‌خواند و snapshot نام/کد برای ردیف‌ها می‌سازد. قیمت واحد همان قیمت توافقی ورودی است. */
async function buildItems(tx: Tx, input: InvoiceFormInput) {
  const ids = [...new Set(input.lines.map((line) => line.productId))];
  const products = await tx.product.findMany({ where: { id: { in: ids } }, select: { id: true, name: true, sku: true } });
  const byId = new Map(products.map((product) => [product.id, product]));

  const items = input.lines.map((line) => {
    const product = byId.get(line.productId);
    if (!product) throw new InvoiceError("یکی از کالاها پیدا نشد.");
    const gross = line.unitPrice * line.quantity;
    if (line.discount > gross) throw new InvoiceError(`تخفیف ردیف «${product.name}» از مبلغ آن بیشتر است.`);
    return {
      productId: line.productId,
      nameSnapshot: product.name,
      skuSnapshot: product.sku,
      unitPrice: line.unitPrice,
      quantity: line.quantity,
      discount: line.discount,
    };
  });

  const totals = calcInvoiceTotals(items, { discount: input.discount, taxPercent: input.taxPercent, shippingCost: input.shippingCost });
  if (input.discount > totals.subtotal) throw new InvoiceError("تخفیف کل از جمع ردیف‌ها بیشتر است.");

  return { items, totals };
}

function scalarFields(input: InvoiceFormInput, totals: ReturnType<typeof calcInvoiceTotals>, base: Date) {
  return {
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    customerAddress: input.customerAddress,
    subtotal: totals.subtotal,
    discount: totals.discount,
    taxPercent: input.taxPercent,
    taxAmount: totals.taxAmount,
    shippingCost: input.shippingCost,
    total: totals.total,
    note: input.note,
    validUntil: input.validDays ? new Date(base.getTime() + input.validDays * DAY_MS) : null,
  };
}

/**
 * صدور پیش‌فاکتور (بدون اثر روی انبار) یا فاکتور قطعی (`mode: "final"`، کسر اتمیک موجودی همان لحظه).
 * با `invoiceId` یک پیش‌فاکتور موجود ویرایش می‌شود (و در صورت `final` همان لحظه قطعی می‌شود).
 */
export async function saveInvoice(actor: SessionUser, input: InvoiceFormInput): Promise<InvoiceResult> {
  const isFinal = input.mode === "final";

  try {
    return await db.$transaction(async (tx) => {
      const { items, totals } = await buildItems(tx, input);
      const now = new Date();
      const finalFields = isFinal ? { status: "FINAL" as const, finalizedAt: now, finalizedById: actor.id, paymentNote: input.paymentNote } : {};

      let invoice: { id: string; number: number };

      if (input.invoiceId) {
        const existing = await tx.invoice.findUnique({ where: { id: input.invoiceId }, select: { id: true, number: true, createdAt: true } });
        if (!existing) throw new InvoiceError("فاکتور پیدا نشد.");

        // فقط پیش‌فاکتور ویرایش‌پذیر است؛ شرط status در همان UPDATE تا همزمانی امن باشد.
        const guarded = await tx.invoice.updateMany({
          where: { id: existing.id, status: "PROFORMA" },
          data: { ...scalarFields(input, totals, existing.createdAt), ...finalFields },
        });
        if (guarded.count === 0) throw new InvoiceError("فقط پیش‌فاکتور قابل ویرایش است (وضعیت فاکتور تغییر کرده).");

        await tx.invoiceItem.deleteMany({ where: { invoiceId: existing.id } });
        await tx.invoiceItem.createMany({ data: items.map((item) => ({ ...item, invoiceId: existing.id })) });
        invoice = existing;
      } else {
        invoice = await tx.invoice.create({
          data: {
            ...scalarFields(input, totals, now),
            ...(isFinal ? finalFields : { status: "PROFORMA" as const }),
            createdById: actor.id,
            items: { create: items },
          },
          select: { id: true, number: true },
        });
      }

      const slugs = isFinal ? await deductStock(tx, actor, invoice, items) : [];

      await writeAudit(
        {
          actor,
          action: input.invoiceId ? (isFinal ? "invoice.update_finalize" : "invoice.update") : isFinal ? "invoice.create_final" : "invoice.create_proforma",
          entity: "invoice",
          entityId: invoice.id,
          diff: { number: 1000 + invoice.number, customer: input.customerName, total: totals.total, lines: items.length },
        },
        tx,
      );

      return { ok: true, invoiceId: invoice.id, slugs } as const;
    });
  } catch (error) {
    if (error instanceof InvoiceError) return { ok: false, error: error.message };
    throw error;
  }
}

/** تبدیل پیش‌فاکتور تأییدشده توسط مشتری به فاکتور قطعی + کسر اتمیک موجودی. */
export async function finalizeInvoice(actor: SessionUser, input: { invoiceId: string; paymentNote: string | null }): Promise<InvoiceResult> {
  try {
    return await db.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUnique({
        where: { id: input.invoiceId },
        select: { id: true, number: true, items: { select: { productId: true, quantity: true } } },
      });
      if (!invoice) throw new InvoiceError("فاکتور پیدا نشد.");

      const moved = await tx.invoice.updateMany({
        where: { id: invoice.id, status: "PROFORMA" },
        data: { status: "FINAL", finalizedAt: new Date(), finalizedById: actor.id, paymentNote: input.paymentNote },
      });
      if (moved.count === 0) throw new InvoiceError("این فاکتور پیش‌فاکتور نیست (قبلاً قطعی یا باطل شده).");

      const slugs = await deductStock(tx, actor, invoice, invoice.items);

      await writeAudit({ actor, action: "invoice.finalize", entity: "invoice", entityId: invoice.id, diff: { number: 1000 + invoice.number } }, tx);
      return { ok: true, invoiceId: invoice.id, slugs } as const;
    });
  } catch (error) {
    if (error instanceof InvoiceError) return { ok: false, error: error.message };
    throw error;
  }
}

/** ابطال: پیش‌فاکتور بدون اثر انبار؛ فاکتور قطعی با برگشت موجودی. دلیل اجباری است. */
export async function cancelInvoice(actor: SessionUser, input: { invoiceId: string; reason: string }): Promise<InvoiceResult> {
  try {
    return await db.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUnique({
        where: { id: input.invoiceId },
        select: { id: true, number: true, status: true, items: { select: { productId: true, quantity: true } } },
      });
      if (!invoice) throw new InvoiceError("فاکتور پیدا نشد.");
      if (invoice.status === "CANCELED") throw new InvoiceError("این فاکتور قبلاً باطل شده است.");

      const moved = await tx.invoice.updateMany({
        where: { id: invoice.id, status: invoice.status },
        data: { status: "CANCELED", canceledAt: new Date(), canceledById: actor.id, cancelReason: input.reason },
      });
      if (moved.count === 0) throw new InvoiceError("وضعیت فاکتور همزمان تغییر کرد؛ صفحه را تازه کنید.");

      const slugs = invoice.status === "FINAL" ? await restoreStock(tx, actor, invoice, invoice.items, input.reason) : [];

      await writeAudit(
        {
          actor,
          action: "invoice.cancel",
          entity: "invoice",
          entityId: invoice.id,
          diff: { number: 1000 + invoice.number, from: invoice.status, reason: input.reason, restocked: invoice.status === "FINAL" },
        },
        tx,
      );
      return { ok: true, invoiceId: invoice.id, slugs } as const;
    });
  } catch (error) {
    if (error instanceof InvoiceError) return { ok: false, error: error.message };
    throw error;
  }
}
