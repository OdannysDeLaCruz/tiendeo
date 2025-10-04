"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import ProductImage from "@/components/ProductImage";
import { useCart } from "@/contexts/CartContext";
import { formatPrice } from "@/lib/format";

export default function CartPage() {
  const params = useParams();
  const router = useRouter();
  const storeSlug = params.storeSlug as string;
  const { items, removeItem, updateQuantity, clearCart, total, itemCount } = useCart();

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
        <div className="text-center">
          <svg
            className="mx-auto h-24 w-24 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <h2 className="mt-4 text-2xl font-bold text-gray-900">
            Tu carrito está vacío
          </h2>
          <p className="mt-2 text-gray-600">
            Agrega productos para comenzar tu pedido
          </p>
          <Link
            href={`/${storeSlug}`}
            className="mt-6 inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Ver productos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-2 sm:px-6 py-8 pb-32">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        Carrito de Compras
      </h1>

      {/* Lista de items */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h2 className="font-medium text-gray-900">
            {itemCount} {itemCount === 1 ? "producto" : "productos"}
          </h2>
        </div>

        {/* lista de items */}
        <div className="divide-y divide-gray-200">
          {items.map((item) => (
            <div
              key={`${item.storeProductId}-${item.measurementUnitId}`}
              className="p-4"
            >
              <div className="flex gap-4">
                {/* Imagen */}
                <div className="w-16 h-16 md:w-20 md:h-20 relative flex-shrink-0 bg-gray-100 rounded overflow-hidden">
                  <ProductImage
                    src={item.productImage}
                    alt={item.productName}
                  />
                </div>

                {/* Información */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900">
                    {item.productName}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {item.unitName} ({item.unitAbbreviation})
                  </p>
                  <p className="text-sm font-medium text-gray-900 mt-2">
                    {formatPrice(item.price)} c/u
                  </p>

                  {/* Controles de cantidad */}
                  <div className="flex items-center gap-3 mt-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const minQty = item.minQuantity || 1;
                          const stepQty = item.stepQuantity || 1;
                          const newQty = Number((item.quantity - stepQty).toFixed(2));
                          updateQuantity(
                            item.storeProductId,
                            item.measurementUnitId,
                            Math.max(minQty, newQty)
                          );
                        }}
                        className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100 flex-shrink-0"
                      >
                        -
                      </button>
                      <div className="min-w-0 px-2 py-1 border border-gray-300 rounded text-center text-sm">
                        {Number(item.quantity.toFixed(2))} {item.unitAbbreviation}
                      </div>
                      <button
                        onClick={() => {
                          const stepQty = item.stepQuantity || 1;
                          const newQty = Number((item.quantity + stepQty).toFixed(2));
                          updateQuantity(
                            item.storeProductId,
                            item.measurementUnitId,
                            newQty
                          );
                        }}
                        className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100 flex-shrink-0"
                      >
                        +
                      </button>
                    </div>

                    <button
                      onClick={() =>
                        removeItem(item.storeProductId, item.measurementUnitId)
                      }
                      className="text-red-600 hover:text-red-800 p-1"
                      aria-label="Eliminar producto"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Subtotal */}
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-gray-900">
                    {formatPrice(Number(item.price) * item.quantity)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Botón vaciar canasta */}
      <div className="mt-4 text-center">
        <button
          onClick={() => {
            if (confirm("¿Estás seguro de que quieres vaciar el carrito?")) {
              clearCart();
            }
          }}
          className="text-red-600 hover:text-red-800 text-sm font-medium"
        >
          Vaciar canasta
        </button>
      </div>

      {/* Footer fijo */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Subtotal */}
            <div>
              <p className="text-sm text-gray-600">Subtotal</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatPrice(total)}
              </p>
            </div>

            {/* Botón Pedir */}
            <button
              onClick={() => router.push(`/${storeSlug}/checkout`)}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold text-lg hover:bg-blue-700 active:scale-95 transition-all"
            >
              Pedir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
