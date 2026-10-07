import { ArrowUpRight, Heart, ImageOff } from "lucide-react";
import type { Product } from "../lib/types";
import { isAffiliateUrl } from "../lib/validation";
import { useState } from "react";
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
}: {
  product: Product;
  category?: string;
}) {
  return (
    <article className="product-card">
      <div className="product-row-layout">
        <div className="product-image">
          <ProductImage product={product} />
        </div>
        <div className="product-copy">
          <span className="product-category">{category || "ของที่คัดให้"}</span>
          {product.featured && <span className="row-recommended"><Heart size={10} fill="currentColor" /> แม่แนะนำ</span>}
          <h3>{product.name}</h3>
          {product.description && <p className="row-description">{product.description}</p>}
          {product.recommendation && <div className="row-review"><span><Heart size={11} /> คำแนะนำ / รีวิวสั้น</span><p>{product.recommendation}</p></div>}
          <div className="product-price">
            <strong>{priceLabel(product.price)}</strong>
            {isAffiliateUrl(product.affiliateUrl) ? <a className="product-shop-link" href={product.affiliateUrl} target="_blank" rel="sponsored noopener noreferrer" aria-label={`ดูข้อมูลเพิ่มเติม: ${product.name}`}>ดูข้อมูลเพิ่มเติม <ArrowUpRight size={14} /></a> : <div className="product-unavailable"><button className="product-shop-link" disabled>ดูข้อมูลเพิ่มเติม <ArrowUpRight size={14} /></button><small>สินค้าตัวอย่าง · ยังไม่มีลิงก์ซื้อ</small></div>}
          </div>
        </div>
      </div>
    </article>
  );
}
