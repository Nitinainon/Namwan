import { expect, test } from "vitest";
import { demoCatalog } from "../src/demo/catalog";
import {
  isAffiliateUrl,
  validateProduct,
  validateImage,
  isImageUrl,
  filterProducts,
} from "../src/lib/validation";
test("affiliate URL requires exact trusted HTTPS host and preserves tracking", () => {
  expect(isAffiliateUrl("https://s.shopee.co.th/abc?utm_source=me")).toBe(true);
  expect(isAffiliateUrl("https://shopee.co.th/product/1/2")).toBe(true);
  for (const bad of [
    "http://shopee.co.th/test",
    "javascript:alert(1)",
    "https://shopee.co.th.evil.test",
    "https://user:pass@shopee.co.th/test",
    "https://example.com",
  ])
    expect(isAffiliateUrl(bad)).toBe(false);
});
test("editable starter products can omit a purchase link and retain bundled sample images", () => {
  expect(validateProduct({ name: "สินค้าตัวอย่าง", affiliateUrl: "", imageUrl: "/images/mug.svg" })).toEqual({});
  expect(isImageUrl("/images/notebook.svg")).toBe(true);
  expect(isImageUrl("//evil.test/image.png")).toBe(false);
  expect(isImageUrl("/images/../../admin")).toBe(false);
});
test("recommended items precede others while price sorting keeps unknown prices last", () => {
  const products = demoCatalog.products.slice(0, 4).map((p, i) => ({ ...p, featured: i === 1, price: [100, 300, 0, null][i], sortOrder: i }));
  expect(filterProducts(products, "", "").map(p => p.id)).toEqual(["demo-2", "demo-1", "demo-3", "demo-4"]);
  expect(filterProducts(products, "", "", "price-asc").map(p => p.id)).toEqual(["demo-3", "demo-1", "demo-2", "demo-4"]);
  expect(filterProducts(products, "", "", "price-desc").map(p => p.id)).toEqual(["demo-2", "demo-1", "demo-3", "demo-4"]);
});
test("product validation accepts price zero, rejects negative and missing names", () => {
  expect(
    validateProduct({
      name: "แมว",
      price: 0,
      affiliateUrl: "https://shopee.co.th/test",
    }),
  ).toEqual({});
  expect(
    validateProduct({
      name: " ",
      price: -1,
      affiliateUrl: "https://example.com",
    }),
  ).toHaveProperty("name");
  expect(
    validateProduct({
      name: "แมว",
      price: -1,
      affiliateUrl: "https://shopee.co.th/test",
    }),
  ).toHaveProperty("price");
});
test("upload rejects SVG and over-limit image files", () => {
  expect(
    validateImage(new File(["x"], "cat.webp", { type: "image/webp" })),
  ).toBe("");
  expect(
    validateImage(new File(["<svg/>"], "cat.svg", { type: "image/svg+xml" })),
  ).not.toBe("");
  expect(
    validateImage(
      new File([new Uint8Array(5242881)], "cat.png", { type: "image/png" }),
    ),
  ).not.toBe("");
});
test("search handles Thai recommendation and hides drafts", () => {
  const products = [
    {
      id: "1",
      name: "แก้ว",
      recommendation: "แมวน่ารัก",
      categoryId: "home",
      published: true,
    },
    {
      id: "2",
      name: "แมว",
      recommendation: "",
      categoryId: "home",
      published: false,
    },
  ] as any;
  expect(filterProducts(products, " แมว ", "home").map((p) => p.id)).toEqual([
    "1",
  ]);
  expect(filterProducts(products, "", "empty")).toEqual([]);
});
