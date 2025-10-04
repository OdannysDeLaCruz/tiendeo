"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import ProductImage from "@/components/ProductImage";

interface MeasurementUnit {
  id: string;
  name: string;
  abbreviation: string;
}

interface StoreProductPrice {
  id: string;
  measurementUnitId: string;
  price: number;
  isActive: boolean;
  measurementUnit: MeasurementUnit;
}

interface StoreProduct {
  id: string;
  price: number;
  isAvailable: boolean;
  prices: StoreProductPrice[];
  masterProduct: {
    id: string;
    name: string;
    imageUrl: string;
    category: {
      name: string;
    };
  };
}

interface Category {
  id: string;
  name: string;
}

export default function StoreProductsPage() {
  const params = useParams();
  const storeSlug = params.storeSlug as string;

  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<StoreProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [availabilityFilter, setAvailabilityFilter] = useState<string>("all");
  const [editingPrice, setEditingPrice] = useState<string | null>(null);
  const [newPrice, setNewPrice] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchTerm, selectedCategory, availabilityFilter]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/${storeSlug}/admin/products`);
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

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/admin/categories");
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const filterProducts = () => {
    let filtered = [...products];

    // Filtrar por búsqueda
    if (searchTerm) {
      filtered = filtered.filter((product) =>
        product.masterProduct.name
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      );
    }

    // Filtrar por categoría
    if (selectedCategory) {
      filtered = filtered.filter(
        (product) => product.masterProduct.category.name === selectedCategory
      );
    }

    // Filtrar por disponibilidad
    if (availabilityFilter === "available") {
      filtered = filtered.filter((product) => product.isAvailable);
    } else if (availabilityFilter === "unavailable") {
      filtered = filtered.filter((product) => !product.isAvailable);
    }

    setFilteredProducts(filtered);
  };

  const handleToggleAvailability = async (
    productId: string,
    currentAvailability: boolean
  ) => {
    if (
      !confirm(
        `¿${currentAvailability ? "Desactivar" : "Activar"} este producto?`
      )
    ) {
      return;
    }

    try {
      setUpdating(true);
      const response = await fetch(
        `/api/${storeSlug}/admin/products/${productId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isAvailable: !currentAvailability }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al actualizar el producto");
      }

      await fetchProducts();
      setUpdating(false);
    } catch (error: any) {
      alert(error.message);
      setUpdating(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("¿Estás seguro de eliminar este producto de tu tienda?")) {
      return;
    }

    try {
      setUpdating(true);
      const response = await fetch(
        `/api/${storeSlug}/admin/products/${productId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al eliminar el producto");
      }

      await fetchProducts();
      setUpdating(false);
    } catch (error: any) {
      alert(error.message);
      setUpdating(false);
    }
  };

  const handleStartEditPrice = (productId: string, currentPrice: number) => {
    setEditingPrice(productId);
    setNewPrice(currentPrice.toString());
  };

  const handleCancelEditPrice = () => {
    setEditingPrice(null);
    setNewPrice("");
  };

  const handleSavePrice = async (productId: string) => {
    const price = parseFloat(newPrice);

    if (isNaN(price) || price <= 0) {
      alert("El precio debe ser un número mayor a 0");
      return;
    }

    try {
      setUpdating(true);
      const response = await fetch(
        `/api/${storeSlug}/admin/products/${productId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ price }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al actualizar el precio");
      }

      await fetchProducts();
      setEditingPrice(null);
      setNewPrice("");
      setUpdating(false);
    } catch (error: any) {
      alert(error.message);
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Productos de tu Tienda
          </h2>
          <p className="text-gray-600 mt-1">
            Gestiona los precios y disponibilidad de tus productos
          </p>
        </div>
        <Link
          href={`/${storeSlug}/admin/products/add`}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg
            className="mr-2 h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Agregar Productos
        </Link>
      </div>

      {/* Filtros */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Búsqueda */}
          <div>
            <label
              htmlFor="search"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Buscar producto
            </label>
            <input
              type="text"
              id="search"
              placeholder="Buscar por nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Filtro por Categoría */}
          <div>
            <label
              htmlFor="category"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Categoría
            </label>
            <select
              id="category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todas las categorías</option>
              {categories.map((category) => (
                <option key={category.id} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por Disponibilidad */}
          <div>
            <label
              htmlFor="availability"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Disponibilidad
            </label>
            <select
              id="availability"
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Todos</option>
              <option value="available">Disponibles</option>
              <option value="unavailable">No disponibles</option>
            </select>
          </div>
        </div>

        {/* Contador de resultados */}
        {(searchTerm || selectedCategory || availabilityFilter !== "all") && (
          <div className="mt-3 text-sm text-gray-600">
            Mostrando {filteredProducts.length} de {products.length} productos
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="text-gray-600">Cargando productos...</div>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Imagen
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Producto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Precios por Unidad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Disponibilidad
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-sm text-gray-500"
                    >
                      No tienes productos en tu tienda.{" "}
                      <Link
                        href={`/${storeSlug}/admin/products/add`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Agrega productos del catálogo maestro
                      </Link>
                    </td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-sm text-gray-500"
                    >
                      No se encontraron productos con los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-16 w-16 relative rounded-md overflow-hidden bg-gray-100">
                          <ProductImage
                            src={product.masterProduct.imageUrl}
                            alt={product.masterProduct.name}
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {product.masterProduct.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {product.masterProduct.category.name}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {product.prices && product.prices.length > 0 ? (
                          <div className="space-y-1">
                            {product.prices.map((priceItem) => (
                              <div
                                key={priceItem.id}
                                className="flex items-center justify-between text-sm"
                              >
                                <span className="text-gray-700">
                                  {priceItem.measurementUnit.name} ({priceItem.measurementUnit.abbreviation}):
                                </span>
                                <span className="font-medium text-gray-900 ml-2">
                                  ${Number(priceItem.price).toFixed(2)}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500 italic">
                            Sin precios configurados
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {product.isAvailable ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Disponible
                          </span>
                        ) : (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                            No Disponible
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-3">
                          <Link
                            href={`/${storeSlug}/admin/products/${product.id}/edit`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Editar
                          </Link>
                          <button
                            onClick={() =>
                              handleToggleAvailability(
                                product.id,
                                product.isAvailable
                              )
                            }
                            disabled={updating}
                            className={`${
                              product.isAvailable
                                ? "text-orange-600 hover:text-orange-900"
                                : "text-green-600 hover:text-green-900"
                            } disabled:opacity-50`}
                          >
                            {product.isAvailable ? "Desactivar" : "Activar"}
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            disabled={updating}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
