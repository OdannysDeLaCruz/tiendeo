"use client";

import Image from "next/image";
import { useState } from "react";

interface ProductImageProps {
  src: string;
  alt: string;
  className?: string;
  disableZoom?: boolean;
}

export default function ProductImage({ src, alt, className, disableZoom = false }: ProductImageProps) {
  const [error, setError] = useState(false);

  // Imagen por defecto
  const defaultImage = "/images/product-image-default.webp";

  return (
    <Image
      src={error ? defaultImage : src}
      alt={alt}
      fill
      className={`${className || "object-cover"} ${!disableZoom ? "transition-transform duration-300 hover:scale-110" : ""}`}
      onError={() => setError(true)}
    />
  );
}
