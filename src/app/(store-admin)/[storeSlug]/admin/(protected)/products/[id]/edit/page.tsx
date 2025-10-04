"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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

interface ProductMeasurement {
  id: string;
  measurementUnitId: string;
  measurementUnit: MeasurementUnit;
}

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
      name: string;
    };
    productMeasurements: ProductMeasurement[];
  };
}

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const storeSlug = params.storeSlug as string;
  const productId = params.id as string;

  const [product, setProduct] = useState<StoreProduct | null>(null);
  const [prices, setPrices] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProduct();
  }, []);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/${storeSlug}/admin/products/${productId}`);
      if (response.ok) {
        const data = await response.json();
        setProduct(data);

        // Inicializar precios
        const initialPrices: { [key: string]: string } = {};
        data.prices.forEach((p: StoreProductPrice) => {
          initialPrices[p.id] = p.price.toString();
        });
        setPrices(initialPrices);
      } else {
        alert("Error al cargar el producto");
        router.push(`/${storeSlug}/admin/products`);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching product:", error);
      alert("Error al cargar el producto");
      router.push(`/${storeSlug}/admin/products`);
      setLoading(false);
    }
  };

  const handlePriceChange = (priceId: string, value: string) => {
    setPrices({ ...prices, [priceId]: value });
  };

  const handleSave = async () => {
    // Validar precios
    for (const [key, value] of Object.entries(prices)) {
      if (value) {
        const price = parseFloat(value);
        if (isNaN(price) || price <= 0) {
          alert("Todos los precios deben ser números mayores a 0");
          return;
        }
      }
    }

    try {
      setSaving(true);

      const updates = [];

      // Actualizar o crear precios
      for (const [key, value] of Object.entries(prices)) {
        if (!value) continue; // Saltar si no hay valor

        const price = parseFloat(value);

        // Verificar si es un precio existente o uno nuevo
        const existingPrice = product?.prices.find(p => p.id === key);

        if (existingPrice) {
          // Actualizar precio existente
          updates.push(
            fetch(`/api/${storeSlug}/admin/products/${productId}/prices/${key}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ price }),
            })
          );
        } else {
          // Crear nuevo precio (key es measurementUnitId)
          updates.push(
            fetch(`/api/${storeSlug}/admin/products/${productId}/prices`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                measurementUnitId: key,
                price
              }),
            })
          );
        }
      }

      const responses = await Promise.all(updates);

      // Verificar si todas las respuestas fueron exitosas
      const allOk = responses.every(r => r.ok);
      if (!allOk) {
        throw new Error("Error al actualizar algunos precios");
      }

      alert("Precios actualizados correctamente");
      router.push(`/${storeSlug}/admin/products`);
    } catch (error) {
      console.error("Error saving prices:", error);
      alert("Error al guardar los precios");
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-gray-600">Cargando producto...</div>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Editar Producto</h2>
          <p className="text-gray-600 mt-1">
            Actualiza los precios por unidad de medida
          </p>
        </div>
        <Link
          href={`/${storeSlug}/admin/products`}
          className="text-gray-600 hover:text-gray-900"
        >
          Volver
        </Link>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        {/* Información del producto */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-start space-x-6">
            <div className="h-32 w-32 relative rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
              <ProductImage
                src={product.masterProduct.imageUrl}
                alt={product.masterProduct.name}
              />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-gray-900">
                {product.masterProduct.name}
              </h3>
              {product.masterProduct.description && (
                <p className="text-gray-600 mt-2">
                  {product.masterProduct.description}
                </p>
              )}
              <div className="mt-3">
                <span className="px-3 py-1 inline-flex text-sm font-semibold rounded-full bg-blue-100 text-blue-800">
                  {product.masterProduct.category.name}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Edición de precios */}
        <div className="p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">
            Precios por Unidad de Medida
          </h4>

          {product.masterProduct.productMeasurements.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No hay unidades de medida configuradas para este producto.
              <br />
              <span className="text-sm">
                El superadmin debe configurarlas primero desde el panel de
                administración.
              </span>
            </div>
          ) : (
            <div className="space-y-4">
              {product.masterProduct.productMeasurements.map((measurement) => {
                // Buscar si ya existe un precio para esta unidad
                const existingPrice = product.prices.find(
                  (p) => p.measurementUnitId === measurement.measurementUnitId
                );
                const key = existingPrice
                  ? existingPrice.id
                  : measurement.measurementUnitId;

                return (
                  <div
                    key={measurement.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700">
                        {measurement.measurementUnit.name} (
                        {measurement.measurementUnit.abbreviation})
                      </label>
                      {!existingPrice && (
                        <span className="text-xs text-gray-500">
                          Nuevo - Asigna un precio
                        </span>
                      )}
                    </div>
                    <div className="w-40">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                          $
                        </span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={prices[key] || ""}
                          onChange={(e) => handlePriceChange(key, e.target.value)}
                          placeholder="0.00"
                          className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Acciones */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
          <Link
            href={`/${storeSlug}/admin/products`}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancelar
          </Link>
          <button
            onClick={handleSave}
            disabled={saving || product.masterProduct.productMeasurements.length === 0}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Guardando..." : "Guardar Cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}
