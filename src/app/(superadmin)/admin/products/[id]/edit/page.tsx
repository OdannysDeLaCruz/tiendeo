"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import ImageUpload from "@/components/ImageUpload";
import ProductMeasurementsConfig from "@/components/admin/ProductMeasurementsConfig";

interface Category {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  categoryId: string;
  imageUrl: string;
}

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [image, setImage] = useState<string | null | undefined>(undefined);
  const [currentImageUrl, setCurrentImageUrl] = useState<string>("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    try {
      // Cargar categorías y producto en paralelo
      const [categoriesRes, productRes] = await Promise.all([
        fetch("/api/admin/categories"),
        fetch(`/api/admin/products/${productId}`),
      ]);

      if (!categoriesRes.ok || !productRes.ok) {
        throw new Error("Error al cargar los datos");
      }

      const categoriesData = await categoriesRes.json();
      const productData: Product = await productRes.json();

      setCategories(categoriesData);
      setName(productData.name);
      setSlug(productData.slug);
      setDescription(productData.description || "");
      setCategoryId(productData.categoryId);
      setCurrentImageUrl(productData.imageUrl || "");
      setLoading(false);
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const payload: { [key: string]: string | number | boolean | null | undefined } = {
        name,
        slug,
        description,
        categoryId,
      };

      // Solo incluir imageUrl si el usuario cambió la imagen
      if (image !== undefined) {
        payload.imageUrl = image; // Puede ser null (eliminar) o string (actualizar)
      }

      const response = await fetch(`/api/admin/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al actualizar el producto");
      }

      router.push("/admin/products");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  };

  const handleImageChange = (newImage: string | null) => {
    setImage(newImage);
    if (newImage === null) {
      setCurrentImageUrl("");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-gray-600">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link
          href="/admin/products"
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          ← Volver a Productos
        </Link>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Editar Producto
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                Nombre del Producto *
              </label>
              <input
                type="text"
                id="name"
                required
                value={name}
                onChange={(e) => {
                  const value = e.target.value;
                  setName(value);
                  // Regenerar slug automáticamente
                  const autoSlug = value
                    .toLowerCase()
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "")
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/^-+|-+$/g, "");
                  setSlug(autoSlug);
                }}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="slug"
                className="block text-sm font-medium text-gray-700"
              >
                Slug (URL)
              </label>
              <input
                type="text"
                id="slug"
                value={slug}
                readOnly
                disabled
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 text-gray-500 cursor-not-allowed"
              />
              <p className="mt-1 text-sm text-gray-500">
                Generado automáticamente desde el nombre
              </p>
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700"
              >
                Descripción
              </label>
              <textarea
                id="description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="categoryId"
                className="block text-sm font-medium text-gray-700"
              >
                Categoría *
              </label>
              <select
                id="categoryId"
                required
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Selecciona una categoría</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Imagen del Producto
              </label>
              <ImageUpload
                currentImage={currentImageUrl || undefined}
                onImageChange={handleImageChange}
              />
            </div>

            {/* Configuración de Unidades de Medida */}
            <div className="border-t border-gray-200 pt-6">
              <ProductMeasurementsConfig productId={productId} />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <Link
                href="/admin/products"
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Guardando..." : "Guardar Cambios"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
