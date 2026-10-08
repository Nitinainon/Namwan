import { useEffect, useRef, useState } from "react";
import { Search, Heart, Sparkles, Home, Cat, Flower2, Gift, ChevronRight, ArrowLeft, RotateCw, PawPrint } from "lucide-react";
import { loadCatalog } from "../lib/catalog";
import { demoCatalog } from "../demo/catalog";
import { filterProducts, errorMessage, type ProductSort } from "../lib/validation";
import type { Catalog } from "../lib/types";
import { CatMark } from "../components/CatMark";
import { ProductCard } from "./ProductCard";

const icons = [Home, Flower2, Cat, Gift];
export function Storefront() {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [sort, setSort] = useState<ProductSort>("recommended");
  const heading = useRef<HTMLHeadingElement>(null);
  const previousCategory = useRef(category);
  async function load() {
    setLoading(true);
    setError("");
    try { setCatalog(await loadCatalog()); }
    catch (e) { setError(errorMessage(e)); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);
  const settings = catalog?.settings || demoCatalog.settings;
  const activeCategory = catalog?.categories.find(c => c.id === category);
  useEffect(() => {
    document.title = `${activeCategory?.name || settings.siteName} · ของน่ารักที่อยากบอกต่อ`;
  }, [settings.siteName, activeCategory?.name]);
  useEffect(() => {
    if (previousCategory.current !== category) heading.current?.focus();
    previousCategory.current = category;
  }, [category]);
  function chooseCategory(id: string | null) {
    setQuery("");
    setSort("recommended");
    setCategory(id);
  }
  const filtered = filterProducts(catalog?.products || [], query, category || "", sort);
  const categories = [...(catalog?.categories || [])].sort((a,b) => a.sortOrder - b.sortOrder);
  return (
    <div className="bio-store">
      <header className={`bio-header${category === null ? " bio-header-home" : ""}`}>
        <a className="brand" href="/" aria-label={`${settings.siteName} หน้าหลัก`}>
          <CatMark />
          <span>{settings.siteName}<small>คัดด้วยใจ พร้อมผู้ช่วยตัวน้อย ♡</small></span>
        </a>
        <span className="bio-header-heart" aria-hidden="true"><PawPrint size={21} /></span>
      </header>
      {category === null && <div className="cat-family-banner"><img src="/images/cat-family.jpg" alt="แม่แมวกับลูกแมวทั้งสี่ต้อนรับเข้าร้าน" fetchPriority="high" /><span className="family-caption"><Heart size={12} fill="currentColor" /> ของน่ารัก จากบ้านของเรา</span></div>}
      <main className="bio-main" id="collection">
        {category === null ? (
          <div className="bio-welcome">
            <span className="bio-kicker"><PawPrint size={14} /> คัดด้วยรัก จากแม่และผู้ช่วยทั้ง 4</span>
            <h1 ref={heading} tabIndex={-1}>เลือกหมวดที่ถูกใจ <span>♡</span></h1>
            <p>{settings.tagline}</p>
            {settings.bannerUrl && <img className="bio-banner" src={settings.bannerUrl} alt="แบนเนอร์ร้าน" />}
          </div>
        ) : (
          <div className="category-heading">
            <button className="category-back" onClick={() => chooseCategory(null)}><ArrowLeft size={17} /> กลับไปหมวดหมู่</button>
            <span className="bio-kicker"><Sparkles size={14} /> ของที่คัดให้คุณ</span>
            <h1 ref={heading} tabIndex={-1}>{activeCategory?.name || "สินค้าทั้งหมด"}</h1>
            <p>เลือกชิ้นที่ชอบ กดดูข้อมูลเพิ่มเติมที่ Shopee ได้เลยค่ะ</p>
          </div>
        )}
        {catalog?.demo && <p className="demo-notice" role="status">คุณกำลังดูสินค้าตัวอย่าง · สินค้าเหล่านี้ยังไม่มีลิงก์ซื้อ</p>}
        {loading ? <div className="center-state" role="status">กำลังคัดของน่ารักมาให้…</div> : error ? (
          <div className="error-state" role="alert">
            <CatMark /><h2>ยังเปิดคอลเลกชันไม่ได้</h2>
            <p>กำลังเตรียมร้านหรือการเชื่อมต่อมีปัญหา ลองใหม่อีกครั้งได้ค่ะ</p>
            <div className="button-row">
              <button className="button secondary" onClick={() => void load()}><RotateCw size={16} /> ลองอีกครั้ง</button>
              <button className="button primary" onClick={() => { setCatalog(demoCatalog); setError(""); }}>ดูตัวอย่างหน้าร้าน</button>
            </div>
          </div>
        ) : category === null ? (
          <section className="category-menu" aria-label="เลือกหมวดหมู่">
            <div className="category-menu-caption"><span><PawPrint size={17} /> หมวดหมู่ของเรา</span><span>{categories.length} หมวดหมู่</span></div>
            <div className="category-rows">
              {categories.map((c, i) => {
                const Icon = /แมว/.test(c.name) ? Cat : /สัตว์|หมา|สุนัข/.test(c.name) ? PawPrint : icons[i % icons.length];
                const count = catalog?.products.filter(p => p.published && p.categoryId === c.id).length || 0;
                return <button key={c.id} className={`category-row category-tone-${i % 3}`} onClick={() => chooseCategory(c.id)}>
                  <span className="category-row-icon"><img src="/images/category-kitten.jpg" alt="" loading="lazy" /><span className="category-icon-badge"><Icon size={16} strokeWidth={1.8} /></span></span>
                  <span className="category-row-copy"><strong>{c.name}</strong><small>{count} ชิ้นที่คัดให้ · แวะดูความน่ารัก</small></span>
                  <ChevronRight size={20} />
                </button>;
              })}
              {!categories.length && <div className="center-state"><CatMark /><h2>กำลังเตรียมหมวดน่ารัก ๆ</h2><p>แวะกลับมาใหม่ได้เร็ว ๆ นี้ค่ะ</p></div>}
            </div>
            <button className="browse-all" onClick={() => chooseCategory("")}><span className="browse-all-icon"><Sparkles size={23} /></span><span><strong>รวมของน่ารักที่แม่คัดให้</strong><small>ดูสินค้าทั้งหมด</small></span><ChevronRight size={20} /></button>
            <p className="category-menu-note"><Heart size={13} /> ของใช้ของคุณ และของรักของเจ้าตัวเล็ก</p>
          </section>
        ) : (
          <section aria-label="สินค้าในหมวดหมู่">
            <div className="bio-product-controls">
              <div className="search-field"><Search size={18} /><input type="search" aria-label="ค้นหาสินค้า" placeholder="ค้นหาสินค้าในหมวดนี้…" value={query} onChange={e => setQuery(e.target.value)} /></div>
              <div className="bio-sort-row"><span aria-live="polite">{filtered.length} สินค้า</span><label>เรียงตาม<select aria-label="เรียงสินค้า" value={sort} onChange={e => setSort(e.target.value as ProductSort)}><option value="recommended">แอดมินแนะนำก่อน</option><option value="price-asc">ราคา: ต่ำไปสูง</option><option value="price-desc">ราคา: สูงไปต่ำ</option></select></label></div>
            </div>
            {filtered.length ? <div className="product-grid">{filtered.map(p => <ProductCard key={p.id} product={p} category={catalog?.categories.find(c => c.id === p.categoryId)?.name} />)}</div> : <div className="center-state"><CatMark /><h2>{query ? "ไม่พบสินค้าที่ตรงกัน" : "กำลังคัดของดี ๆ มาให้"}</h2><p>{query ? "ลองเปลี่ยนคำค้น หรือกลับไปเลือกหมวดอื่นนะคะ" : "แวะกลับมาดูสินค้าใหม่ได้เร็ว ๆ นี้"}</p>{query && <button className="text-button" onClick={() => setQuery("")}>ล้างคำค้น</button>}</div>}
          </section>
        )}
      </main>
      <footer className="bio-footer"><CatMark /><p>{settings.introduction}</p><small>{settings.affiliateDisclosure}</small><span>© {new Date().getFullYear()} {settings.siteName} · Made with a little meow ♡</span></footer>
    </div>
  );
}
