import { render, screen, fireEvent } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { demoCatalog } from "../src/demo/catalog";
vi.mock("../src/lib/catalog", () => ({
  loadCatalog: vi.fn(async () => ({
    ...demoCatalog,
    demo: false,
    products: demoCatalog.products.map((p) => ({
      ...p,
      affiliateUrl: "https://s.shopee.co.th/test?tracking=one",
    })),
  })),
}));
import { Storefront } from "../src/storefront/Storefront";
test("storefront searches Thai, filters categories and has no admin link", async () => {
  render(<Storefront />);
  await screen.findByText("แก้วเซรามิกสำหรับเช้าที่สดใส");
  expect(
    screen.queryByRole("link", { name: /แอดมิน/ }),
  ).not.toBeInTheDocument();
  fireEvent.change(screen.getByRole("searchbox"), {
    target: { value: "จิบกาแฟ" },
  });
  expect(screen.getByText("แก้วเซรามิกสำหรับเช้าที่สดใส")).toBeInTheDocument();
  expect(screen.queryByText("กระเป๋าผ้าเพื่อนแมว")).not.toBeInTheDocument();
  fireEvent.change(screen.getByRole("searchbox"), {
    target: { value: "ไม่มีสินค้านี้" },
  });
  expect(screen.getByText(/ไม่พบสินค้าที่ตรงกัน/)).toBeInTheDocument();
});
test("detail retains original affiliate URL and closes with Escape", async () => {
  render(<Storefront />);
  fireEvent.click(await screen.findByText("แก้วเซรามิกสำหรับเช้าที่สดใส"));
  const link = screen.getByRole("link", { name: /ดูสินค้าที่ Shopee/ });
  expect(link).toHaveAttribute(
    "href",
    "https://s.shopee.co.th/test?tracking=one",
  );
  expect(link).toHaveAttribute("rel", "sponsored noopener noreferrer");
  fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});
