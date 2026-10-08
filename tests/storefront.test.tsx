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
test("homepage shows categories first, opens only that category and returns home", async () => {
  render(<Storefront />);
  const category = await screen.findByRole("button", { name: /บ้าน & ไลฟ์สไตล์/ });
  expect(screen.queryByText("แก้วเซรามิกสำหรับเช้าที่สดใส")).not.toBeInTheDocument();
  expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
  fireEvent.click(category);
  expect(screen.getByText("แก้วเซรามิกสำหรับเช้าที่สดใส")).toBeInTheDocument();
  expect(screen.queryByText("กระเป๋าผ้าเพื่อนแมว")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /กลับไปหมวดหมู่/ }));
  expect(screen.getByRole("button", { name: /บ้าน & ไลฟ์สไตล์/ })).toBeInTheDocument();
  expect(screen.queryByText("แก้วเซรามิกสำหรับเช้าที่สดใส")).not.toBeInTheDocument();
});
test("category searches Thai and has no admin link", async () => {
  render(<Storefront />);
  fireEvent.click(await screen.findByRole("button", { name: /บ้าน & ไลฟ์สไตล์/ }));
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
test("product row shows description and recommendation and links directly to Shopee", async () => {
  render(<Storefront />);
  fireEvent.click(await screen.findByRole("button", { name: /บ้าน & ไลฟ์สไตล์/ }));
  expect(screen.getByText("ตัวอย่างสินค้า — แทนที่ด้วยสินค้าที่คุณแนะนำได้ในหน้าแอดมิน")).toBeInTheDocument();
  expect(screen.getByText("จิบกาแฟแล้วใจฟู สีละมุนเข้ากับทุกมุมบ้าน")).toBeInTheDocument();
  const link = screen.getByRole("link", { name: "ดูข้อมูลเพิ่มเติม: แก้วเซรามิกสำหรับเช้าที่สดใส" });
  expect(link).toHaveAttribute(
    "href",
    "https://s.shopee.co.th/test?tracking=one",
  );
  expect(link).toHaveAttribute("rel", "sponsored noopener noreferrer");
  expect(link).toHaveAttribute("target", "_blank");
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});
test("storefront displays the renamed brand", async () => {
  render(<Storefront />);
  expect(await screen.findByRole("link", { name: "แม่น้ำหวานลูก 4 หน้าหลัก" })).toBeInTheDocument();
});
test("category offers ascending and descending price and recommended sorting", async () => {
  render(<Storefront />);
  fireEvent.click(await screen.findByRole("button", { name: /^ของน่ารัก / }));
  const names = () => screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent);
  expect(names()).toEqual(["กระเป๋าผ้าเพื่อนแมว", "สมุดบันทึกเรื่องเล็ก ๆ"]);
  fireEvent.change(screen.getByRole("combobox", { name: "เรียงสินค้า" }), { target: { value: "price-asc" } });
  expect(names()).toEqual(["สมุดบันทึกเรื่องเล็ก ๆ", "กระเป๋าผ้าเพื่อนแมว"]);
  fireEvent.change(screen.getByRole("combobox", { name: "เรียงสินค้า" }), { target: { value: "price-desc" } });
  expect(names()).toEqual(["กระเป๋าผ้าเพื่อนแมว", "สมุดบันทึกเรื่องเล็ก ๆ"]);
});
