"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

export default function EditStorePage() {
  const router = useRouter();
  const params = useParams();
  const storeId = params.id as string;

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [currentEmail, setCurrentEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchStore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchStore = async () => {
    try {
      const response = await fetch(`/api/admin/stores/${storeId}`);
      if (!response.ok) throw new Error("Error al cargar la tienda");

      const data = await response.json();
      setName(data.name);
      setSlug(data.slug);
      setCurrentEmail(data.ownerEmail || "");
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
      const payload: { name: string; slug: string; email?: string; password?: string } = { name, slug };

      // Solo incluir credenciales si se proporcionan
      if (newEmail) {
        payload.email = newEmail;
      }
      if (newPassword) {
        if (newPassword.length < 6) {
          throw new Error("La contraseña debe tener al menos 6 caracteres");
        }
        payload.password = newPassword;
      }

      const response = await fetch(`/api/admin/stores/${storeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al actualizar la tienda");
      }

      router.push("/admin/stores");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
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
          href="/admin/stores"
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          ← Volver a Tiendas
        </Link>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Editar Tienda
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                Nombre de la Tienda *
              </label>
              <input
                type="text"
                id="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="slug"
                className="block text-sm font-medium text-gray-700"
              >
                Slug (URL) *
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                  https://tiendeo.com/
                </span>
                <input
                  type="text"
                  id="slug"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  pattern="[a-z0-9-]+"
                  className="flex-1 block w-full px-3 py-2 border border-gray-300 rounded-none rounded-r-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Solo letras minúsculas, números y guiones
              </p>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Credenciales del Administrador
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email Actual
                  </label>
                  <div className="mt-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-700">
                    {currentEmail || "No configurado"}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="newEmail"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Nuevo Email (opcional)
                  </label>
                  <input
                    type="email"
                    id="newEmail"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="nuevo@email.com"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Dejar vacío para mantener el email actual
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="newPassword"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Nueva Contraseña (opcional)
                  </label>
                  <input
                    type="password"
                    id="newPassword"
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Mínimo 6 caracteres"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Dejar vacío para mantener la contraseña actual
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <Link
                href="/admin/stores"
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
