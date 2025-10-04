"use client";

import Link from "next/link";
import ProductImage from "@/components/ProductImage";

interface Product {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string;
  isActive: boolean;
  category: {
    name: string;
  };
  productMeasurements: {
    measurementUnit: {
      name: string;
      abbreviation: string;
    };
  }[];
  _count: {
    storeProducts: number;
  };
}

interface ProductsTableProps {
  products: Product[];
}

export default function ProductsTable({ products }: ProductsTableProps) {
  const handleToggleStatus = async (productId: string, isActive: boolean) => {
    if (
      !confirm(
        `¿Estás seguro de ${isActive ? "desactivar" : "activar"} este producto?`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: isActive ? "DELETE" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: isActive ? undefined : JSON.stringify({ isActive: true }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al actualizar el producto");
      }

      // Recargar la página para ver los cambios
      window.location.reload();
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Imagen
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nombre
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Categoría
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Unidades de Medida
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                En Tiendas
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
                  colSpan={7}
                  className="px-6 py-12 text-center text-sm text-gray-500"
                >
                  No hay productos registrados
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="h-16 w-16 relative rounded-md overflow-hidden bg-gray-100">
                      <ProductImage
                        src={product.imageUrl}
                        alt={product.name}
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {product.name}
                    </div>
                    {product.description && (
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {product.description}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {product.category.name}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {product.productMeasurements && product.productMeasurements.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {product.productMeasurements.map((pm, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-700"
                          >
                            {pm.measurementUnit.abbreviation}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400 italic">
                        Sin unidades
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {product.isActive ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Activo
                      </span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                        Inactivo
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product._count.storeProducts}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <Link
                        href={`/admin/products/${product.id}/edit`}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Editar
                      </Link>
                      <button
                        className="text-red-600 hover:text-red-900"
                        onClick={() =>
                          handleToggleStatus(product.id, product.isActive)
                        }
                      >
                        {product.isActive ? "Desactivar" : "Activar"}
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
  );
}
