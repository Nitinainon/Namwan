import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import { test, expect, vi, beforeEach } from "vitest";
import { demoCatalog } from "../src/demo/catalog";
const { api } = vi.hoisted(() => ({
  api: {
    saveProduct: vi.fn(),
    uploadImage: vi.fn(),
    saveSettings: vi.fn(),
    deleteProduct: vi.fn(),
    loadAdminCatalog: vi.fn(),
  },
}));
vi.mock("../src/lib/catalog", () => ({
  ...api,
  saveCategory: vi.fn(),
  deleteCategory: vi.fn(),
}));
vi.mock("../src/lib/auth", () => ({ changePassword: vi.fn() }));
import { ProductEditor } from "../src/admin/ProductEditor";
import { SettingsEditor } from "../src/admin/SettingsEditor";
import Dashboard from "../src/admin/Dashboard";
beforeEach(() => {
  vi.clearAllMocks();
  api.loadAdminCatalog.mockResolvedValue({ ...demoCatalog, demo: false });
});
test("starter product image paths do not block the admin from saving edits", () => {
  render(<ProductEditor product={demoCatalog.products[0]} categories={demoCatalog.categories} onSaved={() => {}} onCancel={() => {}} />);
  const image = screen.getByLabelText("ลิงก์รูปภาพ") as HTMLInputElement;
  expect(image.checkValidity()).toBe(true);
});
test("failed product save keeps form and submits original revision", async () => {
  const original = {
    ...demoCatalog.products[0],
    imageUrl: "https://example.com/mug.webp",
    affiliateUrl: "https://s.shopee.co.th/test?track=1",
  };
  api.saveProduct.mockRejectedValue(new Error("ข้อมูลเปลี่ยนจากอีกหน้าต่าง"));
  render(
    <ProductEditor
      product={original}
      categories={demoCatalog.categories}
      onSaved={() => {}}
      onCancel={() => {}}
    />,
  );
  fireEvent.change(screen.getByLabelText("ชื่อสินค้า"), {
    target: { value: "ชื่อใหม่" },
  });
  fireEvent.click(screen.getByRole("button", { name: "บันทึกสินค้า" }));
  await screen.findByText("ข้อมูลเปลี่ยนจากอีกหน้าต่าง");
  expect(screen.getByLabelText("ชื่อสินค้า")).toHaveValue("ชื่อใหม่");
  expect(api.saveProduct).toHaveBeenCalledWith(
    expect.objectContaining({
      name: "ชื่อใหม่",
      affiliateUrl: "https://s.shopee.co.th/test?track=1",
    }),
    "demo-1",
    1,
  );
});
test("invalid URL does not send write and duplicate submits are locked", async () => {
  api.saveProduct.mockImplementation(() => new Promise(() => {}));
  render(
    <ProductEditor categories={[]} onSaved={() => {}} onCancel={() => {}} />,
  );
  fireEvent.change(screen.getByLabelText("ชื่อสินค้า"), {
    target: { value: "สินค้า" },
  });
  fireEvent.change(screen.getByLabelText("ลิงก์ affiliate Shopee"), {
    target: { value: "https://evil.test" },
  });
  fireEvent.submit(
    screen.getByRole("button", { name: "บันทึกสินค้า" }).closest("form")!,
  );
  expect(api.saveProduct).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText("ลิงก์ affiliate Shopee"), {
    target: { value: "https://shopee.co.th/test" },
  });
  const form = screen
    .getByRole("button", { name: "บันทึกสินค้า" })
    .closest("form")!;
  fireEvent.submit(form);
  fireEvent.submit(form);
  await waitFor(() => expect(api.saveProduct).toHaveBeenCalledTimes(1));
});
test("failed upload retains previous image", async () => {
  api.uploadImage.mockRejectedValue(new Error("อัปโหลดไม่ได้"));
  render(
    <ProductEditor
      product={demoCatalog.products[0]}
      categories={[]}
      onSaved={() => {}}
      onCancel={() => {}}
    />,
  );
  fireEvent.change(screen.getByLabelText("อัปโหลดรูปสินค้า"), {
    target: { files: [new File(["x"], "a.webp", { type: "image/webp" })] },
  });
  await screen.findByText("อัปโหลดไม่ได้");
  expect(screen.getByLabelText("ลิงก์รูปภาพ")).toHaveValue("/images/mug.svg");
});
test("settings save sends edited name and original revision", async () => {
  api.saveSettings.mockResolvedValue({
    ...demoCatalog.settings,
    siteName: "ร้านใหม่",
    revision: 2,
  });
  render(<SettingsEditor settings={demoCatalog.settings} onSaved={() => {}} />);
  fireEvent.change(screen.getByLabelText("ชื่อเว็บ"), {
    target: { value: "ร้านใหม่" },
  });
  fireEvent.click(screen.getByRole("button", { name: "บันทึกข้อมูลหน้าร้าน" }));
  await screen.findByText("บันทึกข้อมูลหน้าร้านแล้ว");
  expect(api.saveSettings).toHaveBeenCalledWith(
    expect.objectContaining({ siteName: "ร้านใหม่", revision: 1 }),
  );
});
test("cancel delete does not remove product", async () => {
  render(<Dashboard onLogout={async () => {}} />);
  await screen.findByText("แก้วเซรามิกสำหรับเช้าที่สดใส");
  fireEvent.click(
    screen.getByRole("button", { name: "ลบ แก้วเซรามิกสำหรับเช้าที่สดใส" }),
  );
  fireEvent.click(screen.getByRole("button", { name: "ยกเลิก" }));
  expect(api.deleteProduct).not.toHaveBeenCalled();
  expect(screen.getByText("แก้วเซรามิกสำหรับเช้าที่สดใส")).toBeInTheDocument();
});

test.each(["save", "upload"])(
  "pending %s cannot dismiss editor through X Escape or backdrop",
  async (operation) => {
    let rejectPending!: (reason: Error) => void;
    const pending = new Promise((_, reject) => {
      rejectPending = reject;
    });
    api.saveProduct.mockImplementation(() => pending);
    api.uploadImage.mockImplementation(() => pending);
    render(<Dashboard onLogout={async () => {}} />);
    await screen.findByText("แก้วเซรามิกสำหรับเช้าที่สดใส");
    fireEvent.click(screen.getByRole("button", { name: "เพิ่มสินค้า" }));
    fireEvent.change(screen.getByLabelText("ชื่อสินค้า"), {
      target: { value: "ข้อมูลที่ต้องเก็บไว้" },
    });
    fireEvent.change(screen.getByLabelText("ลิงก์ affiliate Shopee"), {
      target: { value: "https://shopee.co.th/test" },
    });
    if (operation === "save")
      fireEvent.click(screen.getByRole("button", { name: "บันทึกสินค้า" }));
    else
      fireEvent.change(screen.getByLabelText("อัปโหลดรูปสินค้า"), {
        target: { files: [new File(["x"], "a.webp", { type: "image/webp" })] },
      });
    fireEvent.click(screen.getByRole("button", { name: "ปิดหน้าต่าง" }));
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    fireEvent.mouseDown(screen.getByRole("dialog").parentElement!);
    expect(screen.getByLabelText("ชื่อสินค้า")).toHaveValue(
      "ข้อมูลที่ต้องเก็บไว้",
    );
    await act(async () => {
      rejectPending(new Error("เชื่อมต่อไม่ได้"));
    });
    await screen.findByText("เชื่อมต่อไม่ได้");
    expect(screen.getByLabelText("ชื่อสินค้า")).toHaveValue(
      "ข้อมูลที่ต้องเก็บไว้",
    );
  },
);
