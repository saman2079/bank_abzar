import Image from "next/image";
import { Drill } from "lucide-react";
import type { ProductImageRef } from "@/modules/catalog/types";

type ProductImageProps = { image?: ProductImageRef; sizes?: string; priority?: boolean };

/** تصویر محصول با next/image (والد باید `relative` و دارای اندازه باشد)؛ بدون تصویر → آیکن placeholder. */
export function ProductImage({ image, sizes = "100vw", priority = false }: ProductImageProps) {
  if (!image) {
    return (
      <div className="text-muted grid size-full place-items-center" aria-hidden>
        <Drill className="size-1/3" strokeWidth={1.25} />
      </div>
    );
  }

  return <Image src={image.url} alt={image.alt} fill sizes={sizes} priority={priority} className="object-cover" />;
}
