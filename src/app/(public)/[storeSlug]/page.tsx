"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import ProductCard from "./ProductCard";
import ProductModal from "@/components/ProductModal";
import { StoreProductPrice } from "@/types/product";

interface StoreProduct {
  id: string;
  isAvailable: boolean;
  prices: StoreProductPrice[];
  masterProduct: {
    id: string;
    name: string;
    description: string | null;
    imageUrl: string;
    category: {
      id: string;
      name: string;
    };
  };
}

interface Category {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  products: StoreProduct[];
}

export default function StorePage() {
  const params = useParams();
  const storeSlug = params.storeSlug as string;
  const categoryRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<StoreProduct | null>(null);
  const [showModal, setShowModal] = useState(false);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/${storeSlug}/products`);
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching products:", error);
      setLoading(false);
    }
  }, [storeSlug]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);


  const scrollToCategory = (categoryId: string | null) => {
    if (!scrollContainerRef.current) return;

    const buttonElement = categoryRefs.current[categoryId || "all"];
    if (buttonElement) {
      const container = scrollContainerRef.current;
      const buttonLeft = buttonElement.offsetLeft;
      const buttonWidth = buttonElement.offsetWidth;
      const containerWidth = container.offsetWidth;

      // Calcular la posición para centrar el botón
      const scrollPosition = buttonLeft - containerWidth / 2 + buttonWidth / 2;

      container.scrollTo({
        left: scrollPosition,
        behavior: "smooth",
      });
    }
  };

  const handleCategorySelect = (categoryId: string | null) => {
    setSelectedCategory(categoryId);
    scrollToCategory(categoryId);
  };

  // Filtrar por categoría
  const filteredCategories = categories
    .filter((cat) => (selectedCategory ? cat.id === selectedCategory : true))
    .filter((cat) => cat.products.length > 0);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-gray-600">Cargando productos...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-8">
      {/* Filtro por categoría */}
      <div className="sticky top-16 z-40 bg-white border-b border-gray-200 mb-6 py-3">
        <div ref={scrollContainerRef} className="overflow-x-auto px-4 scrollbar-hide">
          <div className="flex gap-2 flex-nowrap">
            {/* Botón "Todos" */}
            <button
              ref={(el) => { categoryRefs.current["all"] = el; }}
              onClick={() => handleCategorySelect(null)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all flex-shrink-0 ${
                selectedCategory === null
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <div className="w-6 h-6 rounded-full flex items-center justify-center">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                  />
                </svg>
              </div>
              <span className="text-sm font-medium">Todos</span>
            </button>

            {/* Categorías */}
            {categories.map((category) => (
              <button
                key={category.id}
                ref={(el) => { categoryRefs.current[category.id] = el; }}
                onClick={() => handleCategorySelect(category.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all flex-shrink-0 ${
                  selectedCategory === category.id
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <div className="w-6 h-6 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 relative">
                  {category.imageUrl ? (
                    <Image
                      src={category.imageUrl}
                      alt={category.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                      <span className="text-xs font-bold text-gray-600">
                        {category.name.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
                <span className="text-sm font-medium whitespace-nowrap">
                  {category.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Productos */}
      <div className="px-4">
        {filteredCategories.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No hay productos disponibles</p>
          </div>
        ) : (
          <div className="space-y-12">
            {filteredCategories.map((category) => (
              <div key={category.id}>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  {category.name}
                </h2>

                {category.products.length === 0 ? (
                  <p className="text-gray-500">
                    No hay productos en esta categoría
                  </p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {category.products.map((product) => (
                      <ProductCard
                        key={product.id}
                        storeProductId={product.id}
                        name={product.masterProduct.name}
                        description={product.masterProduct.description}
                        imageUrl={product.masterProduct.imageUrl}
                        prices={product.prices}
                        onOpenModal={() => {
                          setSelectedProduct(product);
                          setShowModal(true);
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal único */}
      <ProductModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedProduct(null);
        }}
        product={
          selectedProduct
            ? {
                storeProductId: selectedProduct.id,
                name: selectedProduct.masterProduct.name,
                description: selectedProduct.masterProduct.description,
                imageUrl: selectedProduct.masterProduct.imageUrl,
                prices: selectedProduct.prices,
              }
            : null
        }
      />
    </div>
  );
}
