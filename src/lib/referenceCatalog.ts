import { loadAdminCatalog, saveCategory, saveProduct } from "./catalog";

export const referenceCategoryNames = ["บ้านแมว", "อาหาร & ขนม", "ของเล่นแมว", "ดูแลตัวเอง", "ของน่ารัก", "ท่องเที่ยว & เดินทาง", "เสื้อผ้า & แฟชั่น"];
export const referenceProducts = [
  ["แก้วเซรามิกลายแมว", "น่ารัก ใช้ได้ทุกวัน", "mug", 1],
  ["บ้านแมวทรงโดม", "นุ่มสบาย ระบายอากาศดี", "bed", 2],
  ["โคมไฟแมวตั้งโต๊ะ", "แสงไฟอบอุ่น เหมาะกับห้องนอน", "lamp", 5],
  ["คอนโดแมว พร้อมที่ลับเล็บ", "แข็งแรง ทนทาน ใช้งานได้นาน", "tower", 4],
  ["ชามอาหารแมว เซรามิก", "ปลอดภัย ใช้งานสะดวก", "bowl", 3],
  ["ของเล่นแมว แคทนิป", "เสริมพัฒนาการ ลดความเครียด", "toy", 6],
  ["กระบะทรายแมว แบบมีฝา", "ลดกลิ่น ไม่เลอะเทอะ", "litter", 7],
  ["หวีแปรงขนแมว", "ลดขนร่วง หวีง่าย ขนนุ่มสวย", "brush", 8],
  ["กระเป๋าเดินทางแมว", "สะดวก ปลอดภัย พกพาง่าย", "carrier", 9],
] as const;

// Only runs after an authenticated admin explicitly chooses the template.
// Existing starter IDs and affiliate URLs are retained; rerunning is idempotent.
export async function applyReferenceCatalog() {
  const catalog = await loadAdminCatalog();
  const previousCategory = [1, 3, 5, 2, 4, 6, 7];
  const categories = [];
  for (const [index, name] of referenceCategoryNames.entries()) {
    const old = catalog.categories.find(c => c.name === name) || catalog.categories.find(c => c.id === `aaaaaaaa-aaaa-4aaa-8aaa-${String(previousCategory[index]).padStart(12, "0")}`);
    categories.push(await saveCategory({ name, sortOrder: index }, old?.id, old?.revision));
  }
  for (const [index, [name, recommendation, artwork, starter]] of referenceProducts.entries()) {
    const imageUrl = `https://numwan.netlify.app/images/reference-${artwork}.svg`;
    const old = catalog.products.find(p => p.imageUrl === imageUrl) || catalog.products.find(p => p.id === `bbbbbbbb-bbbb-4bbb-8bbb-${String(starter).padStart(12, "0")}`);
    await saveProduct({ name, recommendation, description: "สินค้าตัวอย่างตามแบบหน้าร้าน แอดมินแก้ไขรูป ข้อมูล และลิงก์ Shopee ได้", imageUrl,
      categoryId: categories[0].id, affiliateUrl: old?.affiliateUrl || "", price: old?.price ?? null,
      featured: index < 2, published: true, sortOrder: index,
    }, old?.id, old?.revision);
  }
}
