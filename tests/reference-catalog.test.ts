import { expect, test, vi } from "vitest";
import { demoCatalog } from "../src/demo/catalog";
const mocks = vi.hoisted(() => ({ read:vi.fn(), category:vi.fn(), product:vi.fn() }));
vi.mock("../src/lib/catalog", () => ({loadAdminCatalog:mocks.read,saveCategory:mocks.category,saveProduct:mocks.product}));
import { applyReferenceCatalog } from "../src/lib/referenceCatalog";
test("reference import creates seven categories and nine editable products without losing the existing affiliate link", async () => {
  mocks.read.mockResolvedValue({...demoCatalog, categories:[], products:[{...demoCatalog.products[0],id:"bbbbbbbb-bbbb-4bbb-8bbb-000000000001",affiliateUrl:"https://s.shopee.co.th/existing"}]});
  mocks.category.mockImplementation(async data => ({...data,id:`category-${data.sortOrder}`,revision:1}));
  mocks.product.mockResolvedValue({});
  await applyReferenceCatalog();
  expect(mocks.category).toHaveBeenCalledTimes(7);
  expect(mocks.product).toHaveBeenCalledTimes(9);
  expect(mocks.product.mock.calls[0][0]).toMatchObject({name:"แก้วเซรามิกลายแมว",affiliateUrl:"https://s.shopee.co.th/existing",categoryId:"category-0"});
  expect(mocks.product.mock.calls[1][0].affiliateUrl).toBe("");
});
