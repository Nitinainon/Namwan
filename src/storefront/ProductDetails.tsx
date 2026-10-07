import { ExternalLink, Heart } from "lucide-react";
import { Modal } from "../components/Modal";
import { ProductImage, priceLabel } from "./ProductCard";
import { isAffiliateUrl } from "../lib/validation";
import type { Product } from "../lib/types";
export function ProductDetails({
  product,
  onClose,
}: {
  product: Product;
  onClose: () => void;
}) {
  return (
    <Modal title={product.name} onClose={onClose}>
      <div className="detail-image">
        <ProductImage product={product} />
      </div>
      <div className="detail-copy">
        <span className="eyebrow">A LITTLE FIND FOR YOU</span>
        <h2>{product.name}</h2>
        <strong className="detail-price">{priceLabel(product.price)}</strong>
        {product.recommendation && (
          <p className="recommendation">
            <Heart size={17} />
            {product.recommendation}
          </p>
        )}
        <p className="description">{product.description}</p>
        {isAffiliateUrl(product.affiliateUrl) ? (
          <a
            className="button primary wide"
            href={product.affiliateUrl}
            target="_blank"
            rel="sponsored noopener noreferrer"
          >
            ดูสินค้าที่ Shopee <ExternalLink size={18} />
          </a>
        ) : (
          <p className="status">สินค้าตัวอย่าง ยังไม่มีลิงก์สำหรับซื้อ</p>
        )}
        <small>
          ราคาโดยประมาณ · ตรวจสอบราคาและรายละเอียดล่าสุดที่ Shopee
          <br />
          ลิงก์นี้อาจเป็นลิงก์ affiliate
        </small>
      </div>
    </Modal>
  );
}
