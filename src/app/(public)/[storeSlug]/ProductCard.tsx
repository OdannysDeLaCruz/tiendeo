"use client";

import ProductImage from "@/components/ProductImage";

interface MeasurementUnit {
  id: string;
  name: string;
  abbreviation: string;
}

interface StoreProductPrice {
  id: string;
  price: number;
  measurementUnitId: string;
  measurementUnit: MeasurementUnit;
}

interface ProductCardProps {
  storeProductId: string;
  name: string;
  description: string | null;
  imageUrl: string;
  prices: StoreProductPrice[];
  onOpenModal: () => void;
}

export default function ProductCard({
  storeProductId,
  name,
  description,
  imageUrl,
  prices,
  onOpenModal,
}: ProductCardProps) {

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col relative group">
      {/* Imagen */}
      <div
        className="relative h-48 bg-gray-100 overflow-hidden cursor-pointer"
        onClick={onOpenModal}
      >
        <ProductImage src={imageUrl} alt={name} className="object-contain" />
      </div>

      {/* Información */}
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-medium text-gray-900 mb-1">{name}</h3>
        {prices.length > 0 && (
          <div className="mt-auto">
            <div className="flex items-baseline gap-1">
              <p className="text-lg font-bold text-blue-600">
                ${Number(prices[0].price).toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">
                / {prices[0].measurementUnit.abbreviation}
              </p>
            </div>
            {prices.length > 1 && (
              <p className="text-xs text-gray-500">
                +{prices.length - 1} precio{prices.length > 2 ? "s" : ""} más
              </p>
            )}
          </div>
        )}
      </div>

      {/* Botón flotante (+) */}
      <button
        onClick={onOpenModal}
        className="absolute bottom-3 right-3 w-10 h-10 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center"
        aria-label="Agregar al carrito"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M12 4v16m8-8H4"
          />
        </svg>
      </button>
    </div>
  );
}
