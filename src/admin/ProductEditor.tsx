import { useRef, useState, useEffect, type FormEvent } from "react";
import { Save } from "lucide-react";
import type { Product, ProductInput, Category } from "../lib/types";
import { saveProduct, uploadImage } from "../lib/catalog";
import { validateProduct, errorMessage } from "../lib/validation";
import { StatusMessage } from "../components/StatusMessage";
const blank: ProductInput = {
  name: "",
  categoryId: null,
  description: "",
  recommendation: "",
  price: null,
  imageUrl: "",
  affiliateUrl: "",
  featured: false,
  published: true,
  sortOrder: 0,
};
export function ProductEditor({
  product,
  defaultCategoryId,
  categories,
  onSaved,
  onCancel,
  onBusyChange,
}: {
  product?: Product;
  defaultCategoryId?: string;
  categories: Category[];
  onSaved: (p: Product) => void;
  onCancel: () => void;
  onBusyChange?: (busy: boolean) => void;
}) {
  const [form, setForm] = useState<ProductInput>(product || {...blank,categoryId:defaultCategoryId || null}),
    [busy, setBusy] = useState(false),
    [uploading, setUploading] = useState(false),
    [error, setError] = useState(""),
    [errors, setErrors] = useState<Record<string, string>>({});
  const lock = useRef(false),
    uploadLock = useRef(false);
  useEffect(() => {
    onBusyChange?.(busy || uploading);
  }, [busy, uploading, onBusyChange]);
  function set<K extends keyof ProductInput>(field: K, value: ProductInput[K]) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: "" }));
  }
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (lock.current || uploadLock.current) return;
    const validation = validateProduct(form);
    setErrors(validation);
    if (Object.keys(validation).length) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      onSaved(await saveProduct(form, product?.id, product?.revision));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  async function upload(file?: File) {
    if (!file || uploadLock.current) return;
    uploadLock.current = true;
    setUploading(true);
    setError("");
    try {
      set("imageUrl", await uploadImage(file));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      uploadLock.current = false;
      setUploading(false);
    }
  }
  const fieldError = (key: string) =>
    errors[key] ? <span className="field-error">{errors[key]}</span> : null;
  return (
    <form className="editor" onSubmit={submit} noValidate>
      <h2>{product ? "แก้ไขสินค้า" : "เพิ่มของน่ารักชิ้นใหม่"}</h2>
      <p>ใส่เรื่องราวและลิงก์ที่อยากส่งต่อให้ทุกคน</p>
      <fieldset disabled={busy || uploading} className="form-fieldset">
        <div className="editor-image">
          {form.imageUrl && <img src={form.imageUrl} alt="ตัวอย่างรูปสินค้า" />}
          <label>
            อัปโหลดรูปสินค้า
            <input
              aria-label="อัปโหลดรูปสินค้า"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => {
                void upload(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            <small>
              {uploading ? "กำลังอัปโหลด…" : "JPG, PNG, WebP · ไม่เกิน 5 MB"}
            </small>
          </label>
        </div>
        <div className="form-grid">
          <label className="full">
            ชื่อสินค้า
            <input
              aria-label="ชื่อสินค้า"
              value={form.name}
              maxLength={200}
              onChange={(e) => set("name", e.target.value)}
            />
            {fieldError("name")}
          </label>
          <label>
            หมวดหมู่
            <select
              value={form.categoryId || ""}
              onChange={(e) => set("categoryId", e.target.value || null)}
            >
              <option value="">ยังไม่จัดหมวดหมู่</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            ราคาโดยประมาณ (บาท)
            <input
              aria-label="ราคาโดยประมาณ (บาท)"
              type="number"
              min="0"
              step="0.01"
              value={form.price ?? ""}
              onChange={(e) =>
                set(
                  "price",
                  e.target.value === "" ? null : Number(e.target.value),
                )
              }
            />
            {fieldError("price")}
          </label>
          <label className="full">
            ลิงก์ affiliate Shopee (เพิ่มภายหลังได้)
            <input
              aria-label="ลิงก์ affiliate Shopee"
              type="url"
              value={form.affiliateUrl}
              placeholder="https://s.shopee.co.th/…"
              onChange={(e) => set("affiliateUrl", e.target.value)}
            />
            {fieldError("affiliateUrl")}
          </label>
          <label className="full">
            ลิงก์รูปภาพ
            <input
              aria-label="ลิงก์รูปภาพ"
              type="text"
              value={form.imageUrl}
              placeholder="https://… หรืออัปโหลดรูปด้านบน"
              onChange={(e) => set("imageUrl", e.target.value)}
            />
            {fieldError("imageUrl")}
          </label>
          <label className="full">
            ทำไมถึงแนะนำ
            <textarea
              aria-label="ทำไมถึงแนะนำ"
              rows={2}
              maxLength={2000}
              value={form.recommendation}
              onChange={(e) => set("recommendation", e.target.value)}
            />
            {fieldError("recommendation")}
          </label>
          <label className="full">
            รายละเอียดสินค้า
            <textarea
              aria-label="รายละเอียดสินค้า"
              rows={3}
              maxLength={5000}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
            />
            {fieldError("description")}
          </label>
          <label>
            ลำดับแสดงผล
            <input
              aria-label="ลำดับแสดงผล"
              type="number"
              step="1"
              value={form.sortOrder}
              onChange={(e) => set("sortOrder", Number(e.target.value))}
            />
            {fieldError("sortOrder")}
          </label>
          <div>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={form.published}
                onChange={(e) => set("published", e.target.checked)}
              />{" "}
              เผยแพร่ในหน้าร้าน
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => set("featured", e.target.checked)}
              />{" "}
              น้ำหวานแนะนำ
            </label>
          </div>
        </div>
      </fieldset>
      <StatusMessage message={error} error />
      {error.includes("ข้อมูลเปลี่ยน") && (
        <p className="editor-hint">
          คัดลอกข้อมูลที่แก้ไขไว้ก่อน แล้วปิดหน้าต่างและกด “โหลดข้อมูลล่าสุด”
          เพื่อเปิดแก้ไขใหม่
        </p>
      )}
      <div className="form-actions">
        <button
          type="button"
          className="button secondary"
          onClick={onCancel}
          disabled={busy || uploading}
        >
          ยกเลิก
        </button>
        <button className="button primary" disabled={busy || uploading}>
          <Save size={16} />
          {busy ? "กำลังบันทึก…" : "บันทึกสินค้า"}
        </button>
      </div>
    </form>
  );
}
