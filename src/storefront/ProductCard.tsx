import { ChevronRight, Heart, ImageOff, Star } from "lucide-react";
import type { Product } from "../lib/types";
import { isAffiliateUrl } from "../lib/validation";
import { useState } from "react";
import { ReferenceArt } from "../components/ReferenceArt";
const sampleArtwork: Record<string, readonly [number, number, number, number]> = {
  "/images/mug.svg": [43, 979, 242, 128],
  "/images/lamp.svg": [570, 978, 235, 130],
  "/images/bowl.svg": [305, 1277, 240, 118],
};
const referenceArtwork: Record<string, readonly [number, number, number, number]> = {
  mug:[43,979,242,128], bed:[307,979,236,128], lamp:[570,978,235,130],
  tower:[42,1275,241,121], bowl:[305,1277,240,118], toy:[570,1274,235,124],
  litter:[43,1549,239,144], brush:[306,1549,239,144], carrier:[570,1549,236,144],
};
export function ProductImage({ product }: { product: Product }) {
  const [failed, setFailed] = useState(false);
  const referenceKey = product.imageUrl.match(/^https:\/\/numwan\.netlify\.app\/images\/reference-(\w+)\.svg$/)?.[1];
  if (referenceKey && referenceArtwork[referenceKey]) return <ReferenceArt region={referenceArtwork[referenceKey]} label={product.name} />;
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
export function ShopeeBag() {
  return <svg className="shopee-bag-icon" viewBox="0 0 28 32" aria-hidden="true"><path fill="currentColor" d="M3 9h22l-1.5 21h-19Z" /><path d="M8 10V7a6 6 0 0 1 12 0v3" fill="none" stroke="currentColor" strokeWidth="2" /><text x="14" y="25" textAnchor="middle" fill="#ff511e" fontFamily="Arial, sans-serif" fontSize="19">S</text></svg>;
}
export function ProductCard({
  product,
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
          {product.imageUrl.includes("/images/reference-") && product.recommendation && <p className="row-description">{product.recommendation}</p>}
          <div className="product-price">
            {isAffiliateUrl(product.affiliateUrl) ? <a className="product-shop-link" href={product.affiliateUrl} target="_blank" rel="sponsored noopener noreferrer" aria-label={`ดูใน Shopee — ดูข้อมูลเพิ่มเติม: ${product.name}`}><ShopeeBag /> <span>ดูใน Shopee</span> <ChevronRight size={22} /></a> : <div className="product-unavailable"><button className="product-shop-link" disabled title="ยังไม่มีลิงก์ซื้อ" aria-label="ดูใน Shopee — ดูข้อมูลเพิ่มเติม (ยังไม่มีลิงก์ซื้อ)"><ShopeeBag /> <span>ดูใน Shopee</span> <ChevronRight size={22} /></button><small>สินค้าตัวอย่าง · ยังไม่มีลิงก์ซื้อ</small></div>}
          </div>
        </div>
      </div>
    </article>
  );
}
