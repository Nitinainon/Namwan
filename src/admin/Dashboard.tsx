import { useEffect, useRef, useState } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Package,
  Tags,
  Settings,
  ExternalLink,
  LogOut,
  RotateCw,
  Heart,
} from "lucide-react";
import { CatMark } from "../components/CatMark";
import { Modal } from "../components/Modal";
import { StatusMessage } from "../components/StatusMessage";
import {
  loadAdminCatalog,
  deleteProduct,
  deleteCategory,
} from "../lib/catalog";
import { errorMessage } from "../lib/validation";
import type { Catalog, Product, Category } from "../lib/types";
import { ProductImage, priceLabel } from "../storefront/ProductCard";
import { ProductEditor } from "./ProductEditor";
import { CategoryEditor } from "./CategoryEditor";
import { SettingsEditor } from "./SettingsEditor";
import { applyReferenceCatalog } from "../lib/referenceCatalog";
type Editor =
  | { kind: "product"; product?: Product }
  | { kind: "category"; category?: Category }
  | null;
export default function Dashboard({
  onLogout,
}: {
  onLogout: () => Promise<void>;
}) {
  const [catalog, setCatalog] = useState<Catalog | null>(null),
    [loading, setLoading] = useState(true),
    [tab, setTab] = useState<"products" | "categories" | "settings">(
      "products",
    ),
    [query, setQuery] = useState(""),
    [editor, setEditor] = useState<Editor>(null),
    [deleting, setDeleting] = useState<{
      kind: "product" | "category";
      id: string;
      name: string;
    } | null>(null),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [error, setError] = useState(false);
  const lock = useRef(false);
  const [editorBusy, setEditorBusy] = useState(false);
  async function load() {
    setLoading(true);
    setMessage("");
    try {
      setCatalog(await loadAdminCatalog());
      setError(false);
    } catch (e) {
      setCatalog(null);
      setError(true);
      setMessage(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
  }, []);
  function savedProduct(p: Product) {
    setEditorBusy(false);
    setCatalog((c) =>
      c
        ? {
            ...c,
            products: [...c.products.filter((x) => x.id !== p.id), p].sort(
              (a, b) => a.sortOrder - b.sortOrder,
            ),
          }
        : c,
    );
    setEditor(null);
    setError(false);
    setMessage("บันทึกสินค้าแล้ว");
  }
  function savedCategory(cat: Category) {
    setEditorBusy(false);
    setCatalog((c) =>
      c
        ? {
            ...c,
            categories: [
              ...c.categories.filter((x) => x.id !== cat.id),
              cat,
            ].sort((a, b) => a.sortOrder - b.sortOrder),
          }
        : c,
    );
    setEditor(null);
    setError(false);
    setMessage("บันทึกหมวดหมู่แล้ว");
  }
  async function remove() {
    if (!deleting || lock.current) return;
    lock.current = true;
    setBusy(true);
    try {
      if (deleting.kind === "product") await deleteProduct(deleting.id);
      else await deleteCategory(deleting.id);
      setCatalog((c) =>
        c
          ? {
              ...c,
              products:
                deleting.kind === "product"
                  ? c.products.filter((p) => p.id !== deleting.id)
                  : c.products,
              categories:
                deleting.kind === "category"
                  ? c.categories.filter((x) => x.id !== deleting.id)
                  : c.categories,
            }
          : c,
      );
      setDeleting(null);
      setError(false);
      setMessage("ลบข้อมูลแล้ว");
    } catch (e) {
      setError(true);
      setMessage(errorMessage(e));
      setDeleting(null);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  const products = (catalog?.products || []).filter((p) =>
    `${p.name} ${p.recommendation}`
      .toLocaleLowerCase("th")
      .includes(query.trim().toLocaleLowerCase("th")),
  );
  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div className="brand">
          <CatMark />
          <span>
            {catalog?.settings.siteName || "แม่น้ำหวานลูก 4"}
            <small>พื้นที่จัดการร้าน · ADMIN ONLY</small>
          </span>
        </div>
        <div className="admin-actions">
          <a
            className="button secondary"
            href="/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink size={15} />
            <span>ดูหน้าร้าน</span>
          </a>
          <button
            className="button secondary"
            onClick={() =>
              void onLogout().catch((e) => {
                setError(true);
                setMessage(errorMessage(e));
              })
            }
          >
            <LogOut size={15} />
            <span>ออกจากระบบ</span>
          </button>
        </div>
      </header>
      <div className="admin-title">
        <span className="eyebrow">YOUR LITTLE SHOWROOM</span>
        <h1>จัดการของที่อยากบอกต่อ ♡</h1>
        <p>เพิ่มของใหม่ จัดหมวดหมู่ และทำหน้าร้านให้เป็นคุณ</p>
      </div>
      <div className="stats">
        {[
          {
            icon: Package,
            value: catalog?.products.length || 0,
            label: "สินค้าทั้งหมด",
          },
          {
            icon: Heart,
            value: catalog?.products.filter((p) => p.published).length || 0,
            label: "เผยแพร่แล้ว",
          },
          {
            icon: Tags,
            value: catalog?.categories.length || 0,
            label: "หมวดหมู่",
          },
        ].map(({ icon: Icon, value, label }) => (
          <div className="stat" key={label}>
            <Icon size={23} />
            <div>
              <strong>{value}</strong>
              <span>{label}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="admin-tabs" role="group" aria-label="เลือกหน้าจัดการ">
        {[
          { id: "products" as const, icon: Package, label: "สินค้า" },
          { id: "categories" as const, icon: Tags, label: "หมวดหมู่" },
          { id: "settings" as const, icon: Settings, label: "ข้อมูลหน้าร้าน" },
        ].map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            className={tab === id ? "active" : ""}
            aria-pressed={tab === id}
            onClick={() => setTab(id)}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>
      <StatusMessage message={message} error={error} />
      <div className="admin-refresh">
        <button className="button secondary" disabled={loading || busy} onClick={async () => {
          if (lock.current) return;
          lock.current = true; setBusy(true); setError(false);
          try { await applyReferenceCatalog(); await load(); setMessage("จัดหน้าร้านตามภาพแล้ว: 7 หมวดและ 9 สินค้า"); }
          catch (e) { setError(true); setMessage(errorMessage(e)); }
          finally { lock.current = false; setBusy(false); }
        }}>{busy ? "กำลังจัดหน้าร้าน…" : "ใช้แบบภาพอ้างอิง · 7 หมวด 9 สินค้า"}</button>
        <button
          className="text-button"
          disabled={loading}
          onClick={() => void load()}
        >
          <RotateCw size={14} /> โหลดข้อมูลล่าสุด
        </button>
      </div>
      {loading ? (
        <div className="center-state" role="status">
          กำลังโหลดข้อมูล…
        </div>
      ) : !catalog ? (
        <div className="error-state">
          <h3>ยังเปิดข้อมูลหลังบ้านไม่ได้</h3>
          <p>
            ตรวจการติดตั้งตารางและสิทธิ์แอดมินใน Supabase แล้วกดโหลดข้อมูลล่าสุด
          </p>
        </div>
      ) : tab === "products" ? (
        <>
          <div className="admin-toolbar">
            <div className="search-field">
              <Search size={17} />
              <input
                type="search"
                aria-label="ค้นหาสินค้าในแอดมิน"
                value={query}
                placeholder="ค้นหาสินค้าในร้าน…"
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <button
              className="button primary"
              onClick={() => setEditor({ kind: "product" })}
            >
              <Plus size={17} /> เพิ่มสินค้า
            </button>
          </div>
          <div className="admin-list">
            {products.map((p) => (
              <article className="admin-row" key={p.id}>
                <div className="admin-thumb">
                  <ProductImage product={p} />
                </div>
                <div className="admin-row-info">
                  <h3>{p.name}</h3>
                  <p>
                    {priceLabel(p.price)} ·{" "}
                    {catalog.categories.find((c) => c.id === p.categoryId)
                      ?.name || "ยังไม่จัดหมวด"}
                    <span className={`badge ${p.published ? "" : "draft"}`}>
                      {p.published ? "เผยแพร่" : "ฉบับร่าง"}
                    </span>
                    {p.featured && <span className="badge draft">แนะนำ</span>}
                  </p>
                </div>
                <div className="row-actions">
                  <button
                    aria-label={`แก้ไข ${p.name}`}
                    onClick={() => setEditor({ kind: "product", product: p })}
                  >
                    <Pencil size={14} />
                    <span>แก้ไข</span>
                  </button>
                  <button
                    className="danger"
                    aria-label={`ลบ ${p.name}`}
                    onClick={() =>
                      setDeleting({ kind: "product", id: p.id, name: p.name })
                    }
                  >
                    <Trash2 size={14} />
                    <span>ลบ</span>
                  </button>
                </div>
              </article>
            ))}
          </div>
          {!products.length && (
            <div className="center-state">
              <h3>
                {query ? "ไม่พบสินค้า" : "ร้านพร้อมแล้ว เพิ่มสินค้าแรกได้เลย"}
              </h3>
              <p>
                รูปสินค้าและลิงก์ affiliate ของคุณจะปรากฏในหน้าร้านเมื่อเผยแพร่
              </p>
            </div>
          )}
        </>
      ) : tab === "categories" ? (
        <>
          <div className="admin-toolbar">
            <h2 className="small-heading">หมวดหมู่สินค้า</h2>
            <button
              className="button primary"
              onClick={() => setEditor({ kind: "category" })}
            >
              <Plus size={17} /> เพิ่มหมวดหมู่
            </button>
          </div>
          <div className="admin-list">
            {catalog.categories.map((c) => (
              <article className="admin-row" key={c.id}>
                <Tags size={22} />
                <div className="admin-row-info">
                  <h3>{c.name}</h3>
                  <p>
                    {
                      catalog.products.filter((p) => p.categoryId === c.id)
                        .length
                    }{" "}
                    สินค้า · ลำดับ {c.sortOrder}
                  </p>
                </div>
                <div className="row-actions">
                  <button
                    aria-label={`แก้ไขหมวด ${c.name}`}
                    onClick={() => setEditor({ kind: "category", category: c })}
                  >
                    <Pencil size={14} />
                    <span>แก้ไข</span>
                  </button>
                  <button
                    className="danger"
                    aria-label={`ลบหมวด ${c.name}`}
                    onClick={() => {
                      if (catalog.products.some((p) => p.categoryId === c.id)) {
                        setError(true);
                        setMessage(
                          "หมวดหมู่นี้ยังมีสินค้า กรุณาย้ายสินค้าก่อนลบ",
                        );
                      } else
                        setDeleting({
                          kind: "category",
                          id: c.id,
                          name: c.name,
                        });
                    }}
                  >
                    <Trash2 size={14} />
                    <span>ลบ</span>
                  </button>
                </div>
              </article>
            ))}
          </div>
          {!catalog.categories.length && (
            <div className="center-state">
              เพิ่มหมวดหมู่แรกเพื่อจัดของที่แนะนำ
            </div>
          )}
        </>
      ) : (
        <SettingsEditor
          settings={catalog.settings}
          onSaved={(s) => setCatalog({ ...catalog, settings: s })}
        />
      )}
      {editor && catalog && (
        <Modal
          title={editor.kind === "product" ? "จัดการสินค้า" : "จัดการหมวดหมู่"}
          onClose={() => setEditor(null)}
          canClose={!editorBusy}
        >
          {editor.kind === "product" ? (
            <ProductEditor
              product={editor.product}
              categories={catalog.categories}
              onSaved={savedProduct}
              onCancel={() => setEditor(null)}
              onBusyChange={setEditorBusy}
            />
          ) : (
            <CategoryEditor
              category={editor.category}
              onSaved={savedCategory}
              onCancel={() => setEditor(null)}
              onBusyChange={setEditorBusy}
            />
          )}
        </Modal>
      )}
      {deleting && (
        <Modal
          title="ยืนยันการลบ"
          canClose={!busy}
          onClose={() => {
            if (!busy) setDeleting(null);
          }}
        >
          <div className="confirm-dialog">
            <h2>ลบรายการนี้ไหมคะ?</h2>
            <p>
              “{deleting.name}” จะถูกลบออกจากร้าน การลบนี้ไม่สามารถย้อนกลับได้
            </p>
            <div className="form-actions">
              <button
                className="button secondary"
                disabled={busy}
                onClick={() => setDeleting(null)}
              >
                ยกเลิก
              </button>
              <button
                className="button danger-button"
                disabled={busy}
                onClick={() => void remove()}
              >
                {busy ? "กำลังลบ…" : "ยืนยันลบ"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </main>
  );
}
