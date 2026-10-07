import { ArrowUpRight, Heart, ImageOff } from "lucide-react";
import type { Product } from "../lib/types";
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
  onSelect,
}: {
  product: Product;
  category?: string;
  onSelect: () => void;
}) {
  return (
    <article className="product-card">
      <button
        className="product-open"
        onClick={onSelect}
        aria-label={`ดูรายละเอียด ${product.name}`}
      >
        <div className="product-image">
          <ProductImage product={product} />
          {product.featured && (
            <span className="picked-label">
              <Heart size={12} fill="currentColor" /> น้ำหวานแนะนำ
            </span>
          )}
          <span className="product-arrow">
            <ArrowUpRight size={18} />
          </span>
        </div>
        <div className="product-copy">
          <span className="product-category">{category || "ของที่คัดให้"}</span>
          <h3>{product.name}</h3>
          <p>{product.recommendation || "อีกหนึ่งชิ้นที่อยากแนะนำให้คุณ"}</p>
          <div className="product-price">
            <strong>{priceLabel(product.price)}</strong>
            <span>
              ดูรายละเอียด <ArrowUpRight size={14} />
            </span>
          </div>
        </div>
      </button>
    </article>
  );
}
