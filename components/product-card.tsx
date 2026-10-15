import Link from "next/link";
import { formatToman, type DemoProduct } from "@/lib/demo-products";
import AddToCartButton from "@/components/add-to-cart-button";

export default function ProductCard({ product }: { product: DemoProduct }) {
  return (
    <article className="product-card lift">
      <Link href={`/products/${product.slug}`} className="product-image-wrap" aria-label={product.name}>
        <span className={`product-art tone-${product.tone}`} aria-hidden="true">{product.icon}</span>
        <span className="product-category">{product.category}</span>
        {product.oldPriceToman ? <span className="product-discount">پیشنهاد ویژه</span> : null}
      </Link>
      <div className="product-card-body">
        <span className="product-brand">{product.brand}</span>
        <h3><Link href={`/products/${product.slug}`}>{product.name}</Link></h3>
        <div className="product-stock"><span className="stock-dot" /> موجودی نمایشی: {product.stock} عدد</div>
        <div className="product-price-row">
          <div className="product-price">
            {product.oldPriceToman ? <del>{formatToman(product.oldPriceToman)}</del> : null}
            <strong>{formatToman(product.priceToman)}</strong>
          </div>
        </div>
        <AddToCartButton productId={product.id} disabled={product.stock < 1} />
      </div>
    </article>
  );
}
