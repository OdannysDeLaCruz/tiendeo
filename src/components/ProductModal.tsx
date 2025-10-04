"use client";

import { useState, useEffect } from "react";
import ProductImage from "@/components/ProductImage";
import { useCart } from "@/contexts/CartContext";
import { ProductModalData } from "@/types/product";

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: ProductModalData | null;
}

export default function ProductModal({
  isOpen,
  onClose,
  product,
}: ProductModalProps) {
  const { addItem } = useCart();
  const [selectedPriceId, setSelectedPriceId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);

  // Resetear estado cuando se abre el modal
  useEffect(() => {
    if (isOpen && product) {
      const firstPrice = product.prices.length > 0 ? product.prices[0] : null;
      setSelectedPriceId(firstPrice?.id || "");
      setQuantity(firstPrice ? Number(firstPrice.minQuantity) : 1);
      setAdding(false);
      // Deshabilitar scroll del body
      document.body.style.overflow = "hidden";
    } else {
      // Rehabilitar scroll del body
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen, product]);

  if (!isOpen || !product) return null;

  const selectedPrice = product.prices.find((p) => p.id === selectedPriceId);

  const handleAddToCart = () => {
    if (!selectedPrice) return;

    setAdding(true);

    addItem({
      storeProductId: product.storeProductId,
      measurementUnitId: selectedPrice.measurementUnitId,
      quantity,
      productName: product.name,
      productImage: product.imageUrl,
      unitName: selectedPrice.measurementUnit.name,
      unitAbbreviation: selectedPrice.measurementUnit.abbreviation,
      price: selectedPrice.price,
      minQuantity: Number(selectedPrice.minQuantity),
      stepQuantity: Number(selectedPrice.stepQuantity),
    });

    // Feedback visual y cerrar modal
    setTimeout(() => {
      setAdding(false);
      onClose();
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 transition-opacity"
        onClick={onClose}
      />

      {/* Modal desde abajo */}
      <div className="relative w-full max-w-2xl animate-slide-up">
        <div className="bg-white rounded-t-3xl h-[95vh] flex flex-col shadow-2xl">
          {/* Botón cerrar flotante */}
          <button
            onClick={onClose}
            className="absolute top-4 left-4 z-10 p-2 bg-white/90 backdrop-blur-sm hover:bg-white rounded-full transition-colors shadow-lg"
          >
            <svg
              className="w-6 h-6 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          {/* Contenido scrolleable */}
          <div className="flex-1 overflow-y-auto">
            {/* Imagen */}
            <div className="relative h-72 bg-gray-100">
              <ProductImage
                src={product.imageUrl}
                alt={product.name}
                className="object-contain"
                disableZoom
              />
            </div>

            {/* Contenido */}
            <div className="p-6 space-y-4">
              {/* Nombre del producto */}
              <h3 className="text-2xl font-bold text-gray-900">
                {product.name}
              </h3>

              {product.prices.length > 0 && selectedPrice ? (
                <>
                  {/* Precio */}
                  <div className="text-3xl font-bold text-blue-600">
                    ${Number(selectedPrice.price).toLocaleString()}
                  </div>

                  {/* Unidad de medida */}
                  <div>
                    <p className="text-sm text-gray-600">
                      Desde {Number(selectedPrice.minQuantity)}{" "}
                      {selectedPrice.measurementUnit.abbreviation}
                    </p>
                  </div>

                  {/* Descripción */}
                  {product.description && (
                    <div>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {product.description}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  {product.description && (
                    <p className="text-sm text-gray-600 mb-4">
                      {product.description}
                    </p>
                  )}
                  <p className="text-gray-500">
                    No hay precios configurados para este producto
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Footer fijo */}
          {selectedPrice && (
            <div className="border-t border-gray-200 p-4 bg-white">
              <div className="grid grid-cols-5 gap-3">
                {/* Control de cantidad - 3/5 */}
                <div className="col-span-3 flex items-center gap-2">
                  <button
                    onClick={() => {
                      const newQty = Number((quantity - Number(selectedPrice.stepQuantity)).toFixed(2));
                      setQuantity(Math.max(Number(selectedPrice.minQuantity), newQty));
                    }}
                    className="w-10 h-10 flex items-center justify-center border-2 border-gray-300 rounded-lg hover:bg-gray-100 transition-colors text-lg font-semibold flex-shrink-0"
                  >
                    -
                  </button>
                  <div className="flex-1 min-w-0 px-2 py-2 border-2 border-gray-300 rounded-lg text-center">
                    <div className="text-lg font-medium">
                      {Number(quantity.toFixed(2))} {selectedPrice.measurementUnit.abbreviation}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const newQty = Number((quantity + Number(selectedPrice.stepQuantity)).toFixed(2));
                      setQuantity(newQty);
                    }}
                    className="w-10 h-10 flex items-center justify-center border-2 border-gray-300 rounded-lg hover:bg-gray-100 transition-colors text-lg font-semibold flex-shrink-0"
                  >
                    +
                  </button>
                </div>

                {/* Botón agregar - 2/5 */}
                <button
                  onClick={handleAddToCart}
                  disabled={adding}
                  className={`col-span-2 px-4 py-2 rounded-full text-base font-semibold transition-all ${
                    adding
                      ? "bg-green-600 text-white"
                      : "bg-blue-600 text-white hover:bg-blue-700 active:scale-95"
                  }`}
                >
                  {adding ? "✓" : `$${(Number(selectedPrice.price) * quantity).toLocaleString()}`}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
