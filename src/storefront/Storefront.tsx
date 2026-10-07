import { useEffect, useState } from "react";
import {
  Search,
  ArrowDown,
  Heart,
  Sparkles,
  Home,
  Cat,
  Flower2,
  Gift,
  ArrowRight,
  RotateCw,
  SlidersHorizontal,
} from "lucide-react";
import { loadCatalog } from "../lib/catalog";
import { demoCatalog } from "../demo/catalog";
import { filterProducts, errorMessage } from "../lib/validation";
import type { Catalog, Product } from "../lib/types";
import { CatMark } from "../components/CatMark";
import { ProductCard } from "./ProductCard";
import { ProductDetails } from "./ProductDetails";
const icons = [Home, Flower2, Cat, Gift];
export function Storefront() {
  const [catalog, setCatalog] = useState<Catalog | null>(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [query, setQuery] = useState(""),
    [category, setCategory] = useState(""),
    [featured, setFeatured] = useState(false),
    [selected, setSelected] = useState<Product | null>(null);
  async function load() {
    setLoading(true);
    setError("");
    try {
      setCatalog(await loadCatalog());
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
  }, []);
  const settings = catalog?.settings || demoCatalog.settings;
  useEffect(() => {
    document.title = `${settings.siteName} · ของน่ารักที่อยากบอกต่อ`;
  }, [settings.siteName]);
  const filtered = filterProducts(
    catalog?.products || [],
    query,
    category,
  ).filter((p) => !featured || p.featured);
  return (
    <>
      <div className="announcement">
        <Heart size={13} /> คัดด้วยใจ ส่งต่อความน่ารักให้ทุกวัน <span>♡</span>
      </div>
      <header className="site-header">
        <a
          className="brand"
          href="/"
          aria-label={`${settings.siteName} หน้าหลัก`}
        >
          <CatMark />
          <span>
            {settings.siteName}
            <small>A LITTLE JOY, JUST FOR YOU</small>
          </span>
        </a>
        <nav aria-label="เมนูหลัก">
          <a href="#collection">ของที่คัดให้</a>
          <a href="#about">รู้จักน้ำหวาน</a>
        </nav>
        <a className="header-pill" href="#collection">
          <Sparkles size={15} />
          <span>แวะมาหาของน่ารัก</span>
        </a>
      </header>
      <main>
        <section className="hero">
          <div className="hero-copy">
            <span className="eyebrow">
              <span className="little-line" /> NAMWAN'S LITTLE FINDS
            </span>
            <h1>
              ของน่ารัก
              <br />
              ที่อยาก
              <span className="handwritten">
                บอกต่อ
                <svg viewBox="0 0 230 16" aria-hidden="true">
                  <path
                    d="M3 10Q110-4 227 8"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="5"
                    strokeLinecap="round"
                  />
                </svg>
              </span>{" "}
              <span className="hero-heart">♡</span>
            </h1>
            <p>
              {settings.tagline}
              <br />
              <span>{settings.introduction}</span>
            </p>
            <a className="button primary" href="#collection">
              ดูของที่น้ำหวานคัดให้ <ArrowDown size={17} />
            </a>
            <div className="hero-note">
              <Heart size={15} />
              <span>เลือกเอง ชอบเอง อยากให้คุณได้ลอง</span>
            </div>
          </div>
          <div className="hero-art">
            {settings.bannerUrl ? (
              <img
                className="hero-banner"
                src={settings.bannerUrl}
                alt="แบนเนอร์ร้าน"
              />
            ) : (
              <CatMark hero />
            )}
            <span className="art-caption">little things, big happiness</span>
          </div>
        </section>
        <div className="values-strip">
          <span>
            <Heart size={17} /> คัดด้วยความชอบ
          </span>
          <span>
            <Sparkles size={17} /> น่ารัก & ใช้ได้จริง
          </span>
          <span>
            <Cat size={17} /> มีน้องแมวเป็นผู้ช่วย
          </span>
        </div>
        <section className="collection section-wrap" id="collection">
          <div className="section-heading">
            <div>
              <span className="eyebrow">THE CURATED COLLECTION</span>
              <h2>
                ของที่คัดมาให้คุณ <span>✿</span>
              </h2>
              <p>เลือกหมวดที่ชอบ แล้วเจอของที่ใช่ได้เลย</p>
            </div>
            <span className="item-count">
              {catalog?.products.filter((p) => p.published).length || 0}{" "}
              ของน่ารักที่เลือกมา
            </span>
          </div>
          {catalog?.demo && (
            <p className="demo-notice" role="status">
              คุณกำลังดูสินค้าตัวอย่าง · สินค้าเหล่านี้ยังไม่มีลิงก์ซื้อ
            </p>
          )}
          <div className="collection-controls">
            <div className="search-field">
              <Search size={19} />
              <input
                type="search"
                aria-label="ค้นหาสินค้า"
                placeholder="ลองค้นหาของที่ทำให้ใจฟู…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <button
              className={`filter-button ${featured ? "active" : ""}`}
              aria-pressed={featured}
              onClick={() => setFeatured(!featured)}
            >
              <SlidersHorizontal size={17} /> น้ำหวานแนะนำ
            </button>
          </div>
          <div className="categories" role="group" aria-label="เลือกหมวดหมู่">
            <button
              className={!category ? "active" : ""}
              onClick={() => setCategory("")}
              aria-pressed={!category}
            >
              <Sparkles size={16} /> ทั้งหมด
            </button>
            {catalog?.categories.map((c, i) => {
              const Icon = icons[i % icons.length];
              return (
                <button
                  key={c.id}
                  className={category === c.id ? "active" : ""}
                  aria-pressed={category === c.id}
                  onClick={() => setCategory(c.id)}
                >
                  <Icon size={16} />
                  {c.name}
                </button>
              );
            })}
          </div>
          {loading ? (
            <div className="center-state" role="status">
              กำลังคัดของน่ารักมาให้…
            </div>
          ) : error ? (
            <div className="error-state" role="alert">
              <CatMark />
              <h3>ยังเปิดคอลเลกชันไม่ได้</h3>
              <p>
                กำลังเตรียมร้านหรือการเชื่อมต่อมีปัญหา ลองใหม่อีกครั้งได้ค่ะ
              </p>
              <div className="button-row">
                <button
                  className="button secondary"
                  onClick={() => void load()}
                >
                  <RotateCw size={16} /> ลองอีกครั้ง
                </button>
                <button
                  className="button primary"
                  onClick={() => {
                    setCatalog(demoCatalog);
                    setError("");
                  }}
                >
                  ดูตัวอย่างหน้าร้าน
                </button>
              </div>
            </div>
          ) : filtered.length ? (
            <div className="product-grid">
              {filtered.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  category={
                    catalog?.categories.find((c) => c.id === p.categoryId)?.name
                  }
                  onSelect={() => setSelected(p)}
                />
              ))}
            </div>
          ) : (
            <div className="center-state">
              <CatMark />
              <h3>
                {query || category || featured
                  ? "ไม่พบสินค้าที่ตรงกัน"
                  : "กำลังคัดของดี ๆ มาให้"}
              </h3>
              <p>
                {query || category || featured
                  ? "ลองเปลี่ยนคำค้นหรือเลือกหมวดหมู่อื่นนะคะ"
                  : "แวะกลับมาดูสินค้าใหม่ได้เร็ว ๆ นี้"}
              </p>
              {(query || category || featured) && (
                <button
                  className="text-button"
                  onClick={() => {
                    setQuery("");
                    setCategory("");
                    setFeatured(false);
                  }}
                >
                  ดูสินค้าทั้งหมด <ArrowRight size={16} />
                </button>
              )}
            </div>
          )}
        </section>
        <section className="about-card section-wrap" id="about">
          <div className="about-cat">
            <CatMark />
          </div>
          <div>
            <span className="eyebrow">A NOTE FROM NAMWAN</span>
            <h2>พื้นที่เล็ก ๆ ของคนชอบของน่ารัก</h2>
            <p>{settings.introduction}</p>
          </div>
          <span className="about-flower" aria-hidden="true">
            ✿
          </span>
        </section>
      </main>
      <footer className="site-footer section-wrap">
        <div className="footer-top">
          <div className="brand">
            <CatMark />
            <span>
              {settings.siteName}
              <small>คัดด้วยใจ แนะนำด้วยความชอบ</small>
            </span>
          </div>
          <span>ขอบคุณที่แวะมานะคะ ♡</span>
        </div>
        <p>{settings.affiliateDisclosure}</p>
        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} {settings.siteName}
          </span>
          <span>Made with love & a little meow.</span>
        </div>
      </footer>
      {selected && (
        <ProductDetails product={selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
}
