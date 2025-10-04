"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import ProductImage from "@/components/ProductImage";

interface Category {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  _count: {
    masterProducts: number;
  };
}

interface MeasurementUnit {
  id: string;
  name: string;
  abbreviation: string;
}

interface ProductMeasurement {
  id: string;
  measurementUnitId: string;
  measurementUnit: MeasurementUnit;
  isDefault: boolean;
}

interface MasterProduct {
  id: string;
  name: string;
  imageUrl: string;
  productMeasurements?: ProductMeasurement[];
}

interface SelectedProduct {
  id: string;
  name: string;
  imageUrl: string;
  productMeasurements: ProductMeasurement[];
  prices: Map<string, string>; // measurementUnitId -> price
}

type Step = "categories" | "products" | "prices";

export default function AddProductsPage() {
  const params = useParams();
  const router = useRouter();
  const storeSlug = params.storeSlug as string;

  const [step, setStep] = useState<Step>("categories");
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [products, setProducts] = useState<MasterProduct[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(
    new Set()
  );
  const [selectedProducts, setSelectedProducts] = useState<
    Map<string, SelectedProduct>
  >(new Map());
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      fetchProducts(selectedCategory);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/categories");
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching categories:", error);
      setLoading(false);
    }
  };

  const fetchProducts = async (categoryId: string) => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/${storeSlug}/admin/products/available?categoryId=${categoryId}`
      );
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching products:", error);
      setLoading(false);
    }
  };

  const handleSelectCategory = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setStep("products");
  };

  const handleToggleProduct = (product: MasterProduct) => {
    const newSet = new Set(selectedProductIds);
    const newMap = new Map(selectedProducts);

    if (newSet.has(product.id)) {
      newSet.delete(product.id);
      newMap.delete(product.id);
    } else {
      newSet.add(product.id);
      const prices = new Map<string, string>();
      // Inicializar con precio vacío para cada unidad de medida
      if (product.productMeasurements) {
        product.productMeasurements.forEach(pm => {
          prices.set(pm.measurementUnitId, "");
        });
      }
      newMap.set(product.id, {
        id: product.id,
        name: product.name,
        imageUrl: product.imageUrl,
        productMeasurements: product.productMeasurements || [],
        prices,
      });
    }

    setSelectedProductIds(newSet);
    setSelectedProducts(newMap);
  };

  const handleUpdatePrice = (productId: string, measurementUnitId: string, price: string) => {
    const newMap = new Map(selectedProducts);
    const product = newMap.get(productId);
    if (product) {
      product.prices.set(measurementUnitId, price);
      newMap.set(productId, product);
      setSelectedProducts(newMap);
    }
  };

  const handleGoToPrices = () => {
    if (selectedProductIds.size === 0) {
      alert("Selecciona al menos un producto");
      return;
    }
    setStep("prices");
  };

  const handleAddProducts = async () => {
    // Validar que todos los productos tengan al menos un precio configurado
    const productsToAdd = Array.from(selectedProducts.values());
    const invalidProducts = productsToAdd.filter(p => {
      // Verificar que al menos una unidad de medida tenga precio
      const hasPrices = Array.from(p.prices.values()).some(price => price && parseFloat(price) > 0);
      return !hasPrices;
    });

    if (invalidProducts.length > 0) {
      alert("Todos los productos deben tener al menos un precio configurado");
      return;
    }

    try {
      setAdding(true);

      for (const product of productsToAdd) {
        // Crear el producto en la tienda
        const response = await fetch(`/api/${storeSlug}/admin/products/add`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            masterProductId: product.id,
            prices: Array.from(product.prices.entries())
              .filter(([price]) => price && parseFloat(price) > 0)
              .map(([measurementUnitId, price]) => ({
                measurementUnitId,
                price: parseFloat(price),
              })),
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Error al agregar producto");
        }
      }

      alert(`${productsToAdd.length} productos agregados exitosamente`);
      router.push(`/${storeSlug}/admin/products`);
    } catch (error) {
      alert((error as Error).message);
      setAdding(false);
    }
  };

  const getCategoryImage = (category: Category) => {
    if (category.imageUrl) return category.imageUrl;
    // Default images por categoría
    const defaults: Record<string, string> = {
      verduras: "https://via.placeholder.com/200x150/10b981/ffffff?text=Verduras",
      frutas: "https://via.placeholder.com/200x150/f59e0b/ffffff?text=Frutas",
      abastos: "https://via.placeholder.com/200x150/3b82f6/ffffff?text=Abastos",
      lacteos: "https://via.placeholder.com/200x150/8b5cf6/ffffff?text=Lácteos",
      carnes: "https://via.placeholder.com/200x150/ef4444/ffffff?text=Carnes",
    };
    return defaults[category.slug] || "https://via.placeholder.com/200x150/6b7280/ffffff?text=Categoría";
  };

  if (loading && categories.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-gray-600">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Agregar Productos del Catálogo
          </h2>
          <p className="text-gray-600 mt-1">
            {step === "categories" && "Selecciona una categoría"}
            {step === "products" && "Selecciona los productos que deseas agregar"}
            {step === "prices" && "Asigna precios a los productos seleccionados"}
          </p>
        </div>
        {selectedProductIds.size > 0 && (
          <div className="bg-blue-50 px-4 py-2 rounded-lg">
            <span className="text-blue-900 font-medium">
              {selectedProductIds.size} producto{selectedProductIds.size !== 1 ? "s" : ""} seleccionado{selectedProductIds.size !== 1 ? "s" : ""}
            </span>
          </div>
        )}
      </div>

      <div className="flex gap-6">
        {/* Sidebar de Categorías */}
        {step !== "categories" && (
          <div className="w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Categorías
              </h3>
              <div className="space-y-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => {
                      setSelectedCategory(category.id);
                      setStep("products");
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      selectedCategory === category.id
                        ? "bg-blue-100 text-blue-900 font-medium"
                        : "hover:bg-gray-100 text-gray-700"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span>{category.name}</span>
                      <span className="text-xs text-gray-500">
                        {category._count.masterProducts}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Contenido Principal */}
        <div className="flex-1">
          {/* Vista de Categorías */}
          {step === "categories" && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleSelectCategory(category.id)}
                  className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden group"
                >
                  <div className="aspect-video relative overflow-hidden bg-gray-100">
                    <Image
                      src={getCategoryImage(category)}
                      alt={category.name}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {category.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {category._count.masterProducts} producto
                      {category._count.masterProducts !== 1 ? "s" : ""}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Vista de Productos */}
          {step === "products" && (
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">
                    {categories.find((c) => c.id === selectedCategory)?.name}
                  </h3>
                  <button
                    onClick={handleGoToPrices}
                    disabled={selectedProductIds.size === 0}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Continuar con Precios →
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="p-12 text-center text-gray-600">
                  Cargando productos...
                </div>
              ) : products.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  No hay productos disponibles en esta categoría
                </div>
              ) : (
                <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[600px] overflow-y-auto">
                  {products.map((product) => {
                    const isSelected = selectedProductIds.has(product.id);
                    return (
                      <div
                        key={product.id}
                        onClick={() => handleToggleProduct(product)}
                        className={`relative bg-white border-2 rounded-lg p-3 cursor-pointer transition-all ${
                          isSelected
                            ? "border-blue-500 shadow-md"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-2 right-2 z-10 bg-blue-600 text-white rounded-full p-1">
                            <svg
                              className="w-4 h-4"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                        )}
                        <div className="aspect-square relative mb-2 bg-gray-100 rounded overflow-hidden">
                          <ProductImage
                            src={product.imageUrl}
                            alt={product.name}
                          />
                        </div>
                        <p className="text-sm font-medium text-gray-900 text-center line-clamp-2">
                          {product.name}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Vista de Precios */}
          {step === "prices" && (
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">
                    Asignar Precios
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setStep("products")}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      ← Volver a Productos
                    </button>
                    <button
                      onClick={handleAddProducts}
                      disabled={adding}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      {adding ? "Agregando..." : "Agregar Productos"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-4 space-y-4 max-h-[600px] overflow-y-auto">
                {Array.from(selectedProducts.values()).map((product) => (
                  <div
                    key={product.id}
                    className="border border-gray-200 rounded-lg overflow-hidden"
                  >
                    {/* Header del producto */}
                    <div className="bg-gray-50 p-3 flex items-center gap-3 border-b border-gray-200">
                      <div className="w-12 h-12 relative flex-shrink-0 bg-gray-100 rounded overflow-hidden">
                        <ProductImage src={product.imageUrl} alt={product.name} />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{product.name}</p>
                        <p className="text-sm text-gray-500">
                          {product.productMeasurements.length} unidad(es) de medida disponible(s)
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          const newSet = new Set(selectedProductIds);
                          const newMap = new Map(selectedProducts);
                          newSet.delete(product.id);
                          newMap.delete(product.id);
                          setSelectedProductIds(newSet);
                          setSelectedProducts(newMap);
                        }}
                        className="text-red-600 hover:text-red-800"
                        title="Quitar producto"
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

                    {/* Precios por unidad de medida */}
                    <div className="p-3 space-y-2">
                      {product.productMeasurements.length === 0 ? (
                        <div className="text-sm text-gray-500 py-2 text-center">
                          Este producto no tiene unidades de medida configuradas.
                          <br />
                          Contacta al administrador para configurarlas.
                        </div>
                      ) : (
                        product.productMeasurements.map((pm) => (
                          <div
                            key={pm.id}
                            className="flex items-center gap-3 p-2 bg-white border border-gray-200 rounded"
                          >
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">
                                {pm.measurementUnit.name}
                                {pm.isDefault && (
                                  <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                                    Por defecto
                                  </span>
                                )}
                              </p>
                              <p className="text-xs text-gray-500">
                                {pm.measurementUnit.abbreviation}
                              </p>
                            </div>
                            <div className="w-32">
                              <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                  <span className="text-gray-500 text-sm">$</span>
                                </div>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={product.prices.get(pm.measurementUnitId) || ""}
                                  onChange={(e) =>
                                    handleUpdatePrice(
                                      product.id,
                                      pm.measurementUnitId,
                                      e.target.value
                                    )
                                  }
                                  placeholder="0.00"
                                  className="pl-7 block w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                />
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
