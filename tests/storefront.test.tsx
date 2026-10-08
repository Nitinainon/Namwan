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
test("homepage shows categories and products, filters a category and returns to all products", async () => {
  render(<Storefront />);
  const category = await screen.findByRole("button", { name: /บ้าน & ไลฟ์สไตล์/ });
  expect(screen.getByText("แก้วเซรามิกสำหรับเช้าที่สดใส")).toBeInTheDocument();
  expect(screen.getByRole("searchbox")).toBeInTheDocument();
  fireEvent.click(category);
  expect(screen.getByRole("heading", { level: 1, name: /บ้าน & ไลฟ์สไตล์/ })).toBeInTheDocument();
  expect(screen.getByRole("searchbox")).toHaveAttribute("placeholder", "ค้นหาสินค้าในหมวดนี้...");
  expect(screen.getByText("แก้วเซรามิกสำหรับเช้าที่สดใส")).toBeInTheDocument();
  expect(screen.queryByText("กระเป๋าผ้าเพื่อนแมว")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /กลับไปหมวดหมู่/ }));
  expect(screen.getByRole("button", { name: /บ้าน & ไลฟ์สไตล์/ })).toBeInTheDocument();
  expect(screen.getByText("กระเป๋าผ้าเพื่อนแมว")).toBeInTheDocument();
});

test("favorite hearts persist and the header filters saved products", async () => {
  localStorage.clear();
  const first = render(<Storefront />);
  fireEvent.click(await screen.findByRole("button", { name: "บันทึกสินค้า: แก้วเซรามิกสำหรับเช้าที่สดใส" }));
  first.unmount();
  render(<Storefront />);
  await screen.findByText("แก้วเซรามิกสำหรับเช้าที่สดใส");
  fireEvent.click(screen.getByRole("button", { name: /ดูสินค้าที่บันทึก/ }));
  expect(screen.getByText("แก้วเซรามิกสำหรับเช้าที่สดใส")).toBeInTheDocument();
  expect(screen.queryByText("กระเป๋าผ้าเพื่อนแมว")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "เลิกบันทึกสินค้า: แก้วเซรามิกสำหรับเช้าที่สดใส" }));
  expect(screen.getByText("ยังไม่มีสินค้าที่บันทึก")).toBeInTheDocument();
  localStorage.clear();
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

test("favorites preserve changes from another tab and synchronize removals", async () => {
  localStorage.clear();
  render(<Storefront />);
  await screen.findByText("แก้วเซรามิกสำหรับเช้าที่สดใส");
  const otherProduct = demoCatalog.products.find(p => p.name === "กระเป๋าผ้าเพื่อนแมว")!;
  localStorage.setItem("namwan-saved-products", JSON.stringify([otherProduct.id]));
  fireEvent.click(screen.getByRole("button", { name: "บันทึกสินค้า: แก้วเซรามิกสำหรับเช้าที่สดใส" }));
  fireEvent.click(screen.getByRole("button", { name: /ดูสินค้าที่บันทึก/ }));
  expect(screen.getByText("กระเป๋าผ้าเพื่อนแมว")).toBeInTheDocument();
  expect(screen.getByText("แก้วเซรามิกสำหรับเช้าที่สดใส")).toBeInTheDocument();
  localStorage.removeItem("namwan-saved-products");
  fireEvent(window, new StorageEvent("storage", { key: "namwan-saved-products" }));
  expect(screen.getByText("ยังไม่มีสินค้าที่บันทึก")).toBeInTheDocument();
});
test("product row shows description and recommendation and links directly to Shopee", async () => {
  render(<Storefront />);
  fireEvent.click(await screen.findByRole("button", { name: /บ้าน & ไลฟ์สไตล์/ }));
  expect(screen.getByText("ตัวอย่างสินค้า — แทนที่ด้วยสินค้าที่คุณแนะนำได้ในหน้าแอดมิน")).toBeInTheDocument();
  expect(screen.getByText("จิบกาแฟแล้วใจฟู สีละมุนเข้ากับทุกมุมบ้าน")).toBeInTheDocument();
  const link = screen.getByRole("link", { name: "ดูใน Shopee — ดูข้อมูลเพิ่มเติม: แก้วเซรามิกสำหรับเช้าที่สดใส" });
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
