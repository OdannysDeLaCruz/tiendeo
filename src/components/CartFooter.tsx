"use client";

import { useCart } from "@/contexts/CartContext";
import { formatPrice } from "@/lib/format";
import { useRouter, usePathname } from "next/navigation";

interface CartFooterProps {
  storeSlug: string;
}

export default function CartFooter({ storeSlug }: CartFooterProps) {
  const { items, total, itemCount } = useCart();
  const router = useRouter();
  const pathname = usePathname();

  // No mostrar si el carrito está vacío
  if (items.length === 0) return null;

  // No mostrar en páginas de checkout u órdenes
  if (pathname.includes("/checkout") || pathname.includes("/orders")) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-blue-600 shadow-2xl z-40">
      <div className="max-w-4xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Información del carrito */}
          <div className="flex-1">
            <p className="text-sm text-gray-600">
              {itemCount} Producto{itemCount !== 1 ? "s" : ""}
            </p>
            <p className="text-2xl font-bold text-gray-900">
              {formatPrice(total)}
            </p>
          </div>

          {/* Botón ir a canasta */}
          <button
            onClick={() => router.push(`/${storeSlug}/cart`)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 active:scale-95 transition-all flex items-center gap-2"
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
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <span>Ver canasta</span>
          </button>
        </div>
      </div>
    </div>
  );
}
