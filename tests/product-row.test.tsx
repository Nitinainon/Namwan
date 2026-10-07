import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { ProductCard } from "../src/storefront/ProductCard";
import { demoCatalog } from "../src/demo/catalog";

test("demo and invalid affiliate URLs show an unavailable action instead of an outgoing link", () => {
  const { rerender } = render(<ProductCard product={demoCatalog.products[0]} />);
  expect(screen.queryByRole("link")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: /ดูข้อมูลเพิ่มเติม/ })).toBeDisabled();
  expect(screen.getByText("สินค้าตัวอย่าง · ยังไม่มีลิงก์ซื้อ")).toBeInTheDocument();
  rerender(<ProductCard product={{ ...demoCatalog.products[0], affiliateUrl: "https://example.com" }} />);
  expect(screen.queryByRole("link")).not.toBeInTheDocument();
});
