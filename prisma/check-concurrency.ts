/**
 * تست همزمانی انبار روی DB واقعی (بدون Vitest):  npm run check:concurrency
 * سناریو: محصول با موجودی ۱ و دو کاربر که همزمان سفارش می‌دهند → دقیقاً یک موفقیت.
 * سپس لغو: موجودی برمی‌گردد و لغو تکراری موجودی را دوبار برنمی‌گرداند.
 * همه‌ی داده‌های موقت در پایان پاک می‌شوند.
 */
import { db } from "@/lib/db";
import { cancelPendingOrder, placeOrder } from "@/modules/orders/service";

const tag = Date.now().toString(36);
let failures = 0;

function check(name: string, condition: boolean) {
  process.stdout.write(`${condition ? "PASS" : "FAIL"}  ${name}\n`);
  if (!condition) failures += 1;
}

async function main() {
  const category = await db.category.create({ data: { name: `tmp-${tag}`, slug: `tmp-${tag}` } });
  const brand = await db.brand.create({ data: { name: `tmp-${tag}`, slug: `tmp-${tag}` } });
  const product = await db.product.create({
    data: {
      sku: `TMP-${tag}`,
      name: "محصول آزمایشی",
      slug: `tmp-${tag}`,
      brandId: brand.id,
      categoryId: category.id,
      shortDescription: "-",
      description: "-",
      price: 1000,
      stock: 1,
      status: "ACTIVE",
    },
  });
  await db.stockMovement.create({ data: { productId: product.id, delta: 1, type: "INITIAL" } });

  const users = await Promise.all(
    [0, 1].map((index) =>
      db.user.create({
        data: {
          phone: `0900${tag.slice(-5).padStart(5, "0")}${index}0`.slice(0, 11),
          addresses: {
            create: {
              receiverName: "تست",
              receiverPhone: "09120000000",
              province: "تهران",
              city: "تهران",
              postalCode: "1234567890",
              street: "خیابان آزمایش",
              plaque: "1",
            },
          },
          cartItems: { create: { productId: product.id, quantity: 1 } },
        },
        include: { addresses: true },
      }),
    ),
  );

  try {
    const results = await Promise.all(
      users.map((user) => placeOrder(user.id, { addressId: user.addresses[0]?.id ?? "", note: null, paymentMethod: "ONLINE" })),
    );
    const winners = results.filter((result) => result.ok);
    check("دقیقاً یک سفارش موفق شد", winners.length === 1);

    let current = await db.product.findUniqueOrThrow({ where: { id: product.id }, select: { stock: true } });
    check("موجودی صفر شد (نه منفی)", current.stock === 0);

    const winner = winners[0];
    if (winner?.ok) {
      const canceled = await cancelPendingOrder(winner.orderId, { actorId: null, note: "test" });
      const again = await cancelPendingOrder(winner.orderId, { actorId: null, note: "test" });
      check("لغو اول موفق و لغو دوم رد شد", canceled && !again);

      current = await db.product.findUniqueOrThrow({ where: { id: product.id }, select: { stock: true } });
      check("موجودی فقط یک‌بار برگشت", current.stock === 1);
    }

    const ledger = await db.stockMovement.aggregate({ where: { productId: product.id }, _sum: { delta: true } });
    current = await db.product.findUniqueOrThrow({ where: { id: product.id }, select: { stock: true } });
    check("مجموع دفتر کل = موجودی محصول", ledger._sum.delta === current.stock);
  } finally {
    await db.order.deleteMany({ where: { userId: { in: users.map((user) => user.id) } } });
    await db.stockMovement.deleteMany({ where: { productId: product.id } });
    await db.product.delete({ where: { id: product.id } });
    await db.user.deleteMany({ where: { id: { in: users.map((user) => user.id) } } });
    await db.brand.delete({ where: { id: brand.id } });
    await db.category.delete({ where: { id: category.id } });
    await db.$disconnect();
  }
}

main()
  .then(() => process.exit(failures === 0 ? 0 : 1))
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
