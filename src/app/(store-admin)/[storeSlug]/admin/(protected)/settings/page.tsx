"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

interface Store {
  id: string;
  name: string;
  slug: string;
}

export default function StoreSettingsPage() {
  const params = useParams();
  const storeSlug = params.storeSlug as string;

  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Store name editing
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState("");

  // Password change
  const [changingPassword, setChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    fetchStore();
  });

  const fetchStore = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/${storeSlug}/admin/store`);
      if (response.ok) {
        const data = await response.json();
        setStore(data);
        setNewName(data.name);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching store:", error);
      setLoading(false);
    }
  };

  const handleStartEditName = () => {
    setEditingName(true);
    setNewName(store?.name || "");
  };

  const handleCancelEditName = () => {
    setEditingName(false);
    setNewName(store?.name || "");
  };

  const handleSaveName = async () => {
    if (!newName.trim()) {
      alert("El nombre no puede estar vacío");
      return;
    }

    try {
      setUpdating(true);
      const response = await fetch(`/api/${storeSlug}/admin/store`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al actualizar el nombre");
      }

      await fetchStore();
      setEditingName(false);
      alert("Nombre actualizado exitosamente");
      setUpdating(false);
    } catch (error) {
      alert((error as Error).message);
      setUpdating(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      alert("Todos los campos son requeridos");
      return;
    }

    if (newPassword.length < 6) {
      alert("La nueva contraseña debe tener al menos 6 caracteres");
      return;
    }

    if (newPassword !== confirmPassword) {
      alert("Las contraseñas no coinciden");
      return;
    }

    try {
      setUpdating(true);
      const response = await fetch(`/api/${storeSlug}/admin/password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al cambiar la contraseña");
      }

      alert("Contraseña actualizada exitosamente");
      setChangingPassword(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setUpdating(false);
    } catch (error) {
      alert((error as Error).message);
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-gray-600">Cargando configuración...</div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-gray-600">No se pudo cargar la configuración</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          Configuración de la Tienda
        </h2>
        <p className="text-gray-600 mt-1">
          Gestiona la información y configuración de tu tienda
        </p>
      </div>

      <div className="bg-white shadow rounded-lg divide-y divide-gray-200">
        {/* Nombre de la Tienda */}
        <div className="px-6 py-5">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Información de la Tienda
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de la Tienda
              </label>
              {editingName ? (
                <div className="flex items-center space-x-3">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    disabled={updating}
                  />
                  <button
                    onClick={handleSaveName}
                    disabled={updating}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                  >
                    Guardar
                  </button>
                  <button
                    onClick={handleCancelEditName}
                    disabled={updating}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-900">{store.name}</span>
                  <button
                    onClick={handleStartEditName}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Editar
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL de tu Tienda
              </label>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">
                    {typeof window !== "undefined"
                      ? window.location.origin
                      : "https://tenderos.app"}
                    /
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {store.slug}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Esta es la URL única de tu tienda. Compártela con tus
                  clientes para que puedan hacer pedidos.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Cambiar Contraseña */}
        <div className="px-6 py-5">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Seguridad</h3>

          {!changingPassword ? (
            <button
              onClick={() => setChangingPassword(true)}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cambiar Contraseña
            </button>
          ) : (
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="currentPassword"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Contraseña Actual *
                </label>
                <input
                  type="password"
                  id="currentPassword"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  disabled={updating}
                />
              </div>

              <div>
                <label
                  htmlFor="newPassword"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Nueva Contraseña *
                </label>
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  disabled={updating}
                />
                <p className="mt-1 text-sm text-gray-500">
                  Mínimo 6 caracteres
                </p>
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Confirmar Nueva Contraseña *
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  disabled={updating}
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  onClick={handleChangePassword}
                  disabled={updating}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  {updating ? "Guardando..." : "Guardar Contraseña"}
                </button>
                <button
                  onClick={() => {
                    setChangingPassword(false);
                    setCurrentPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                  }}
                  disabled={updating}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
