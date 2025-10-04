"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import ProductCard from "../ProductCard";
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

export default function SearchPage() {
  const params = useParams();
  const router = useRouter();
  const storeSlug = params.storeSlug as string;
  const inputRef = useRef<HTMLInputElement>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<StoreProduct | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const loadRecentSearches = useCallback(() => {
    const saved = localStorage.getItem(`recent_searches_${storeSlug}`);
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (error) {
        console.error("Error loading recent searches:", error);
      }
    }
  }, [storeSlug]);

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
    loadRecentSearches();
    // Auto-focus en el input
    inputRef.current?.focus();
  }, [fetchProducts, loadRecentSearches]);

  const saveRecentSearch = (query: string) => {
    if (!query.trim()) return;

    const updated = [
      query,
      ...recentSearches.filter((s) => s.toLowerCase() !== query.toLowerCase()),
    ].slice(0, 5); // Mantener solo las últimas 5 búsquedas

    setRecentSearches(updated);
    localStorage.setItem(`recent_searches_${storeSlug}`, JSON.stringify(updated));
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem(`recent_searches_${storeSlug}`);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleSearchSubmit = (query: string) => {
    if (query.trim()) {
      saveRecentSearch(query.trim());
    }
  };



  // Obtener todos los productos
  const allProducts = categories.flatMap((cat) => cat.products);

  // Filtrar productos por búsqueda
  const filteredProducts = searchQuery
    ? allProducts.filter((product) =>
        product.masterProduct.name
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      )
    : [];

  // Productos recientes (últimos 8 agregados)
  const recentProducts = allProducts.slice(0, 8);

  return (
    <div className="max-w-4xl mx-auto pb-8 min-h-screen">
      {/* Buscador fijo */}
      <div className="sticky top-16 z-40 bg-white border-b border-gray-200 px-4 pt-4 pb-3">
        <div className="flex items-center gap-3">
          {/* Botón volver */}
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Volver"
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          {/* Input de búsqueda */}
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              placeholder="Buscar productos..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearchSubmit(searchQuery);
                }
              }}
              onBlur={() => handleSearchSubmit(searchQuery)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Resultados */}
      <div className="px-4 pt-6">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-gray-600">Cargando productos...</div>
          </div>
        ) : !searchQuery ? (
          <div className="space-y-8">
            {/* Búsquedas recientes */}
            {recentSearches.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Tus búsquedas recientes
                  </h2>
                  <button
                    onClick={clearRecentSearches}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    Limpiar
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((search, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setSearchQuery(search);
                        handleSearchSubmit(search);
                      }}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700 transition-colors flex items-center gap-2"
                    >
                      <svg
                        className="w-4 h-4 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      {search}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Productos recientes */}
            {recentProducts.length > 0 ? (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Productos recientes
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {recentProducts.map((product) => (
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
              </div>
            ) : (
              <div className="text-center py-12">
                <svg
                  className="mx-auto h-16 w-16 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <p className="mt-4 text-gray-600">
                  Escribe para buscar productos
                </p>
              </div>
            )}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">
              No se encontraron productos para &quot;{searchQuery}&quot;
            </p>
          </div>
        ) : (
          <div>
            <p className="text-sm text-gray-600 mb-4">
              {filteredProducts.length} resultado
              {filteredProducts.length !== 1 ? "s" : ""}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProducts.map((product) => (
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
