import { getSupabase } from "./supabase";
import { demoCatalog } from "../demo/catalog";
import { validateImage, validateProduct } from "./validation";
import type {
  Product,
  ProductInput,
  Category,
  CategoryInput,
  SiteSettings,
  Catalog,
} from "./types";
function db() {
  const client = getSupabase();
  if (!client)
    throw new Error(
      "ยังไม่ได้เชื่อมต่อ Supabase กรุณาตั้งค่าโปรเจกต์ก่อนบันทึก",
    );
  return client;
}
function fail(error: { code?: string; message?: string } | null) {
  if (!error) return;
  if (error.code === "40001")
    throw new Error("ข้อมูลเปลี่ยนจากอีกหน้าต่าง กรุณาโหลดข้อมูลล่าสุด");
  if (error.code === "23503")
    throw new Error("หมวดหมู่นี้ยังมีสินค้า กรุณาย้ายสินค้าก่อนลบ");
  if (error.code === "42501") throw new Error("บัญชีนี้ไม่มีสิทธิ์แอดมิน");
  throw new Error(error.message || "เชื่อมต่อไม่สำเร็จ กรุณาลองอีกครั้ง");
}
const product = (r: any): Product => ({
  id: r.id,
  categoryId: r.category_id,
  name: r.name,
  description: r.description,
  recommendation: r.recommendation,
  price: r.price === null ? null : Number(r.price),
  imageUrl: r.image_url,
  affiliateUrl: r.affiliate_url,
  featured: r.featured,
  published: r.published,
  sortOrder: r.sort_order,
  revision: r.revision,
});
const category = (r: any): Category => ({
  id: r.id,
  name: r.name,
  sortOrder: r.sort_order,
  revision: r.revision,
});
const settings = (r: any): SiteSettings => ({
  id: "main",
  siteName: r.site_name,
  tagline: r.tagline,
  introduction: r.introduction,
  bannerUrl: r.banner_url,
  affiliateDisclosure: r.affiliate_disclosure,
  revision: r.revision,
});
async function read(admin = false): Promise<Catalog> {
  const client = db();
  if (admin) {
    const check = await client.rpc("is_admin");
    fail(check.error);
    if (check.data !== true) throw new Error("บัญชีนี้ไม่มีสิทธิ์แอดมิน");
  }
  let query = client.from("products").select("*").order("sort_order");
  if (!admin) query = query.eq("published", true);
  const [p, c, s] = await Promise.all([
    query,
    client.from("categories").select("*").order("sort_order"),
    client.from("site_settings").select("*").eq("id", "main").single(),
  ]);
  for (const result of [p, c, s]) fail(result.error);
  return {
    products: (p.data || []).map(product),
    categories: (c.data || []).map(category),
    settings: settings(s.data),
  };
}
export async function loadCatalog(): Promise<Catalog> {
  return getSupabase() ? read() : demoCatalog;
}
export async function loadAdminCatalog(): Promise<Catalog> {
  return read(true);
}
export async function saveProduct(
  input: ProductInput,
  id?: string,
  expectedRevision?: number,
): Promise<Product> {
  const client = db();
  const errors = validateProduct(input);
  if (Object.keys(errors).length) throw new Error(Object.values(errors)[0]);
  const result = await client
    .rpc("save_product", {
      p_id: id || null,
      p_expected_revision: expectedRevision ?? null,
      p_data: input,
    })
    .single();
  fail(result.error);
  return product(result.data);
}
export async function deleteProduct(id: string): Promise<void> {
  const result = await db().from("products").delete().eq("id", id).select("id");
  fail(result.error);
  if (!result.data?.length)
    throw new Error("ไม่พบสินค้า หรือบัญชีนี้ไม่มีสิทธิ์ลบ");
}
export async function saveCategory(
  input: CategoryInput,
  id?: string,
  expectedRevision?: number,
): Promise<Category> {
  if (!input.name.trim() || input.name.trim().length > 100)
    throw new Error("กรอกชื่อหมวดหมู่ 1–100 ตัวอักษร");
  const result = await db()
    .rpc("save_category", {
      p_id: id || null,
      p_expected_revision: expectedRevision ?? null,
      p_data: input,
    })
    .single();
  fail(result.error);
  return category(result.data);
}
export async function deleteCategory(id: string): Promise<void> {
  const result = await db()
    .from("categories")
    .delete()
    .eq("id", id)
    .select("id");
  fail(result.error);
  if (!result.data?.length)
    throw new Error("ไม่พบหมวดหมู่ หรือบัญชีนี้ไม่มีสิทธิ์ลบ");
}
export async function saveSettings(input: SiteSettings): Promise<SiteSettings> {
  const result = await db()
    .rpc("save_settings", {
      p_expected_revision: input.revision,
      p_data: input,
    })
    .single();
  fail(result.error);
  return settings(result.data);
}
export async function uploadImage(file: File): Promise<string> {
  const error = validateImage(file);
  if (error) throw new Error(error);
  const bucket = db().storage.from("product-images");
  const extension = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  }[file.type];
  const path = `${crypto.randomUUID()}.${extension}`;
  const result = await bucket.upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  fail(result.error);
  return bucket.getPublicUrl(path).data.publicUrl;
}
