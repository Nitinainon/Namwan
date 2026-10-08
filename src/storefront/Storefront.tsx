import { useEffect, useRef, useState } from "react";
import { Search, Heart, Sparkles, ChevronRight, ArrowLeft, RotateCw, PawPrint, Star, ShoppingBag } from "lucide-react";
import { loadCatalog } from "../lib/catalog";
import { demoCatalog } from "../demo/catalog";
import { filterProducts, errorMessage, type ProductSort } from "../lib/validation";
import type { Catalog } from "../lib/types";
import { CatMark } from "../components/CatMark";
import { ProductCard } from "./ProductCard";

const SAVED_KEY = "namwan-saved-products";
function readSaved(fallback: string[] = []): string[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(SAVED_KEY) || "[]");
    return Array.isArray(value) ? [...new Set(value.filter((id): id is string => typeof id === "string"))] : [];
  } catch { return fallback; }
}
function categoryImage(name: string, index: number) {
  if (/อาหาร|ขนม/.test(name)) return "category-food.jpg";
  if (/ดูแล|บิวตี้|แฟชั่น/.test(name)) return "category-grooming.jpg";
  if (/เล่น|น่ารัก/.test(name)) return "category-play.jpg";
  return ["category-kitten.jpg", "category-grooming.jpg", "category-food.jpg", "category-play.jpg"][index % 4];
}
export function Storefront() {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState<ProductSort>("recommended");
  const [saved, setSaved] = useState<string[]>(() => readSaved());
  const [savedOnly, setSavedOnly] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  async function load() {
    setLoading(true); setError("");
    try { setCatalog(await loadCatalog()); }
    catch (e) { setError(errorMessage(e)); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);
  useEffect(() => {
    const synchronize = (event: StorageEvent) => {
      if (event.key === SAVED_KEY || event.key === null) setSaved(readSaved());
    };
    window.addEventListener("storage", synchronize);
    return () => window.removeEventListener("storage", synchronize);
  }, []);
  const settings = catalog?.settings || demoCatalog.settings;
  const activeCategory = catalog?.categories.find(c => c.id === category);
  useEffect(() => {
    document.title = `${activeCategory?.name || settings.siteName} · ของน่ารักที่อยากบอกต่อ`;
  }, [settings.siteName, activeCategory?.name]);
  function chooseCategory(id: string) {
    setQuery(""); setSort("recommended"); setSavedOnly(false); setCategory(id);
  }
  function toggleSaved(id: string) {
    const latest = readSaved(saved);
    const next = latest.includes(id) ? latest.filter(item => item !== id) : [...latest, id];
    setSaved(next);
    try { localStorage.setItem(SAVED_KEY, JSON.stringify(next)); } catch { /* Saving in this tab still works when storage is unavailable. */ }
  }
  function showAllProducts() {
    chooseCategory(""); heading.current?.focus();
  }
  const filtered = filterProducts(catalog?.products || [], query, category, sort).filter(p => !savedOnly || saved.includes(p.id));
  const categories = [...(catalog?.categories || [])].sort((a,b) => a.sortOrder - b.sortOrder);
  const savedCount = catalog?.products.filter(p => p.published && saved.includes(p.id)).length || 0;
  return (
    <div className="boutique-store">
      <header className="boutique-hero">
        <img className="boutique-hero-art" src="/images/boutique-hero.jpg" alt="แม่แมวกับลูกแมวทั้งสี่ต้อนรับเข้าร้าน" fetchPriority="high" />
        <div className="boutique-header">
          <a className="boutique-brand" href="/" aria-label={`${settings.siteName} หน้าหลัก`}>
            <img src="/images/category-kitten.jpg" alt="" />
            <span><h1>{settings.siteName}</h1><small>คัดด้วยใจ พร้อมผู้ช่วยตัวน้อย ♡</small></span>
          </a>
          <button className={`saved-toggle${savedOnly ? " active" : ""}`} aria-label={`ดูสินค้าที่บันทึก ${savedCount} ชิ้น`} aria-pressed={savedOnly} onClick={() => { setSavedOnly(!savedOnly); setCategory(""); setQuery(""); heading.current?.focus(); }}><Heart fill={savedOnly ? "currentColor" : "none"} />{savedCount > 0 && <span>{savedCount}</span>}</button>
        </div>
      </header>
      <main className="boutique-main" id="collection">
        <div className="boutique-search-row">
          <div className="boutique-search"><Search /><input type="search" aria-label="ค้นหาสินค้า" placeholder="ค้นหาสินค้าในร้านนี้..." value={query} onChange={e => setQuery(e.target.value)} />{query && <button onClick={() => setQuery("")} aria-label="ล้างคำค้น">×</button>}</div>
          <span className="search-paw" aria-hidden="true"><PawPrint fill="currentColor" /></span>
        </div>
        {catalog?.demo && <p className="demo-notice" role="status">คุณกำลังดูสินค้าตัวอย่าง · สินค้าเหล่านี้ยังไม่มีลิงก์ซื้อ</p>}
        {loading ? <div className="center-state" role="status">กำลังคัดของน่ารักมาให้…</div> : error ? (
          <div className="error-state" role="alert"><CatMark /><h2>ยังเปิดคอลเลกชันไม่ได้</h2><p>กำลังเตรียมร้านหรือการเชื่อมต่อมีปัญหา ลองใหม่อีกครั้งได้ค่ะ</p><div className="button-row"><button className="button secondary" onClick={() => void load()}><RotateCw size={16} /> ลองอีกครั้ง</button><button className="button primary" onClick={() => { setCatalog(demoCatalog); setError(""); }}>ดูตัวอย่างหน้าร้าน</button></div></div>
        ) : <>
          <section className="boutique-categories" aria-label="เลือกหมวดหมู่">
            <div className="boutique-section-heading"><h2><PawPrint fill="currentColor" /> เลือกหมวดหมู่</h2><button onClick={showAllProducts}>ดูทั้งหมด <ChevronRight size={17} /></button></div>
            <div className="category-rail">
              {categories.map((c, i) => <button key={c.id} className={`category-tile tone-${i % 4}${category === c.id ? " selected" : ""}`} aria-pressed={category === c.id} onClick={() => chooseCategory(c.id)}>
                <img src={`/images/${categoryImage(c.name, i)}`} alt="" loading="lazy" /><strong>{c.name}</strong><small>{catalog?.products.filter(p => p.published && p.categoryId === c.id).length || 0} ชิ้นที่คัดให้</small>
              </button>)}
            </div>
            {!categories.length && <p className="category-empty">กำลังเตรียมหมวดน่ารัก ๆ แวะกลับมาใหม่ได้เร็ว ๆ นี้ค่ะ</p>}
          </section>
          {settings.bannerUrl ? <img className="custom-shop-banner" src={settings.bannerUrl} alt="แบนเนอร์ร้าน" /> : <button className="story-banner" onClick={showAllProducts}>
            <span className="story-bag"><ShoppingBag /><b>S</b></span><span className="story-copy"><strong>พิกัดสินค้าใน <em>Shop <Sparkles /></em></strong><small>{settings.tagline}</small></span><img src="/images/category-kitten.jpg" alt="" /><span className="story-action">ดูทั้งหมด <ChevronRight /></span>
          </button>}
          <section className="boutique-products" aria-label="สินค้าในหมวดหมู่">
            {(category || savedOnly) && <button className="boutique-back" onClick={() => chooseCategory("")}><ArrowLeft size={16} /> กลับไปหมวดหมู่</button>}
            <div className="boutique-section-heading product-section-heading"><h2 ref={heading} tabIndex={-1}><Star fill="currentColor" /> {savedOnly ? "สินค้าที่บันทึก" : activeCategory?.name || "สินค้าแนะนำ"}</h2><label><span>เรียงตาม</span><select aria-label="เรียงสินค้า" value={sort} onChange={e => setSort(e.target.value as ProductSort)}><option value="recommended">แอดมินแนะนำก่อน</option><option value="price-asc">ราคา: ต่ำไปสูง</option><option value="price-desc">ราคา: สูงไปต่ำ</option></select></label></div>
            <p className="boutique-result-count" aria-live="polite">{filtered.length} สินค้า{query ? ` · ผลการค้นหา “${query}”` : ""}</p>
            {filtered.length ? <div className="boutique-product-grid">{filtered.map(p => <ProductCard key={p.id} product={p} category={catalog?.categories.find(c => c.id === p.categoryId)?.name} saved={saved.includes(p.id)} onToggleSaved={() => toggleSaved(p.id)} />)}</div> : <div className="center-state"><CatMark /><h2>{query ? "ไม่พบสินค้าที่ตรงกัน" : savedOnly ? "ยังไม่มีสินค้าที่บันทึก" : "กำลังคัดของดี ๆ มาให้"}</h2><p>{query ? "ลองเปลี่ยนคำค้น หรือกลับไปเลือกหมวดอื่นนะคะ" : savedOnly ? "กดหัวใจบนสินค้าที่ชอบ เพื่อเก็บไว้ดูในอุปกรณ์นี้" : "แวะกลับมาดูสินค้าใหม่ได้เร็ว ๆ นี้"}</p>{query && <button className="text-button" onClick={() => setQuery("")}>ล้างคำค้น</button>}</div>}
          </section>
        </>}
      </main>
      <footer className="boutique-footer"><CatMark /><p>{settings.introduction}</p><small>{settings.affiliateDisclosure}</small><span>© {new Date().getFullYear()} {settings.siteName} · Made with a little meow ♡</span></footer>
    </div>
  );
}
