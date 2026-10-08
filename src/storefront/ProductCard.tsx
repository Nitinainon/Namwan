import { ArrowUpRight, Heart, ImageOff, ShoppingBag, Star } from "lucide-react";
import type { Product } from "../lib/types";
import { isAffiliateUrl } from "../lib/validation";
import { useState } from "react";
import { ReferenceArt } from "../components/ReferenceArt";
const sampleArtwork: Record<string, readonly [number, number, number, number]> = {
  "/images/mug.svg": [43, 979, 242, 128],
  "/images/lamp.svg": [570, 978, 235, 130],
  "/images/bowl.svg": [305, 1277, 240, 118],
};
export function ProductImage({ product }: { product: Product }) {
  const [failed, setFailed] = useState(false);
  return product.imageUrl && !failed ? (
    <img
      src={product.imageUrl}
      alt={product.name}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  ) : (
    <div className="image-placeholder">
      <ImageOff size={32} />
      <span>รอรูปน่ารัก ๆ</span>
    </div>
  );
}
export const priceLabel = (price: number | null) =>
  price === null
    ? "ดูราคาที่ Shopee"
    : `฿${new Intl.NumberFormat("th-TH", { maximumFractionDigits: 2 }).format(price)}`;
export function ProductCard({
  product,
  category,
  saved,
  onToggleSaved,
}: {
  product: Product;
  category?: string;
  saved?: boolean;
  onToggleSaved?: () => void;
}) {
  return (
    <article className="product-card">
      <div className="product-row-layout">
        <div className="product-image">
          {sampleArtwork[product.imageUrl] ? <ReferenceArt region={sampleArtwork[product.imageUrl]} label={product.name} /> : <ProductImage product={product} />}
          {product.featured && <span className="card-featured"><Star size={15} fill="currentColor" /> แม่แนะนำ</span>}
          {onToggleSaved && <button className={`card-heart${saved ? " saved" : ""}`} aria-label={`${saved ? "เลิกบันทึกสินค้า" : "บันทึกสินค้า"}: ${product.name}`} aria-pressed={saved} onClick={onToggleSaved}><Heart size={22} fill={saved ? "currentColor" : "none"} /></button>}
        </div>
        <div className="product-copy">
          <h3>{product.name}</h3>
          {(product.recommendation || product.description) && <p className="row-description">{product.recommendation || product.description}</p>}
          <details className="card-more"><summary>{priceLabel(product.price)} · อ่านเพิ่มเติม</summary><span>{category || "ของที่คัดให้"}</span>{product.description && <p>{product.description}</p>}</details>
          <div className="product-price">
            {isAffiliateUrl(product.affiliateUrl) ? <a className="product-shop-link" href={product.affiliateUrl} target="_blank" rel="sponsored noopener noreferrer" aria-label={`ดูใน Shopee — ดูข้อมูลเพิ่มเติม: ${product.name}`}><ShoppingBag size={19} /> ดูใน Shopee <ArrowUpRight size={18} /></a> : <div className="product-unavailable"><button className="product-shop-link" disabled aria-label="ดูใน Shopee — ดูข้อมูลเพิ่มเติม"><ShoppingBag size={19} /> ดูใน Shopee <ArrowUpRight size={18} /></button><small>สินค้าตัวอย่าง · ยังไม่มีลิงก์ซื้อ</small></div>}
          </div>
        </div>
      </div>
    </article>
  );
}
