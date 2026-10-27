import { describe, expect, it } from "vitest";
import { isCodEligible } from "@/modules/orders/cod";

describe("isCodEligible", () => {
  it.each([
    [{ province: "تهران", city: "تهران" }, true],
    [{ province: "تهران", city: " تهران " }, true],
    [{ province: "تهران", city: "تهران" }, true],
    [{ province: "تهران", city: "ري" }, false],
    [{ province: "تهران", city: "اسلامشهر" }, false],
    [{ province: "البرز", city: "کرج" }, false],
    [{ province: "اصفهان", city: "تهران" }, false],
    [{ province: "تهران", city: "تهران‌پارس" }, false],
  ])("%j → %s", (address, expected) => {
    expect(isCodEligible(address)).toBe(expected);
  });
});
