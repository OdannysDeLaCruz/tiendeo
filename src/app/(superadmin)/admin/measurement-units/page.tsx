"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface MeasurementUnit {
  id: string;
  name: string;
  abbreviation: string;
  type: string;
  baseUnit: string | null;
  conversionFactor: number | null;
  isActive: boolean;
}

export default function MeasurementUnitsPage() {
  const [units, setUnits] = useState<MeasurementUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<MeasurementUnit | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    abbreviation: "",
    type: "UNIT",
    baseUnit: "",
    conversionFactor: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchUnits();
  }, []);

  const fetchUnits = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/measurement-units");
      if (response.ok) {
        const data = await response.json();
        console.log("Units loaded:", data);
        setUnits(data);
      } else {
        const errorData = await response.json();
        console.error("Error response:", errorData);
        setError(errorData.error || "Error al cargar unidades");
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching units:", error);
      setError("Error al cargar unidades");
      setLoading(false);
    }
  };

  const handleOpenModal = (unit?: MeasurementUnit) => {
    if (unit) {
      setEditingUnit(unit);
      setFormData({
        name: unit.name,
        abbreviation: unit.abbreviation,
        type: unit.type,
        baseUnit: unit.baseUnit || "",
        conversionFactor: unit.conversionFactor?.toString() || "",
      });
    } else {
      setEditingUnit(null);
      setFormData({
        name: "",
        abbreviation: "",
        type: "UNIT",
        baseUnit: "",
        conversionFactor: "",
      });
    }
    setError("");
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUnit(null);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const url = editingUnit
        ? `/api/admin/measurement-units/${editingUnit.id}`
        : "/api/admin/measurement-units";

      const response = await fetch(url, {
        method: editingUnit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          abbreviation: formData.abbreviation,
          type: formData.type,
          baseUnit: formData.baseUnit || null,
          conversionFactor: formData.conversionFactor || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al guardar");
      }

      await fetchUnits();
      handleCloseModal();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (unit: MeasurementUnit) => {
    try {
      const response = await fetch(`/api/admin/measurement-units/${unit.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !unit.isActive }),
      });

      if (!response.ok) {
        throw new Error("Error al actualizar");
      }

      await fetchUnits();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleDelete = async (unit: MeasurementUnit) => {
    if (!confirm(`¿Eliminar la unidad "${unit.name}"?`)) return;

    try {
      const response = await fetch(`/api/admin/measurement-units/${unit.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al eliminar");
      }

      await fetchUnits();
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Unidades de Medida
          </h2>
          <p className="text-gray-600 mt-1">
            Gestiona las unidades disponibles en el sistema
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          + Nueva Unidad
        </button>
      </div>

      {error && !isModalOpen && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="text-gray-600">Cargando...</div>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Abreviación
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Factor Conversión
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Estado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {units.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-sm text-gray-500"
                  >
                    No hay unidades registradas
                  </td>
                </tr>
              ) : (
                units.map((unit) => (
                  <tr key={unit.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {unit.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {unit.abbreviation}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          unit.type === "WEIGHT"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {unit.type === "WEIGHT" ? "Peso" : "Unidad"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {unit.conversionFactor
                        ? `${unit.conversionFactor} ${unit.baseUnit || ""}`
                        : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          unit.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {unit.isActive ? "Activa" : "Inactiva"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-3">
                        <button
                          onClick={() => handleOpenModal(unit)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleToggleActive(unit)}
                          className="text-orange-600 hover:text-orange-900"
                        >
                          {unit.isActive ? "Desactivar" : "Activar"}
                        </button>
                        <button
                          onClick={() => handleDelete(unit)}
                          className="text-red-600 hover:text-red-900"
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
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
              onClick={handleCloseModal}
            />

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleSubmit}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    {editingUnit ? "Editar Unidad" : "Nueva Unidad"}
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Nombre *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                        placeholder="Kilogramo"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Abreviación *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.abbreviation}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            abbreviation: e.target.value,
                          })
                        }
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                        placeholder="kg"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Tipo *
                      </label>
                      <select
                        required
                        value={formData.type}
                        onChange={(e) =>
                          setFormData({ ...formData, type: e.target.value })
                        }
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="UNIT">Unidad</option>
                        <option value="WEIGHT">Peso</option>
                      </select>
                    </div>

                    {formData.type === "WEIGHT" && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Unidad Base
                          </label>
                          <input
                            type="text"
                            value={formData.baseUnit}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                baseUnit: e.target.value,
                              })
                            }
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                            placeholder="g (para gramos)"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Factor de Conversión
                          </label>
                          <input
                            type="number"
                            step="0.0001"
                            value={formData.conversionFactor}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                conversionFactor: e.target.value,
                              })
                            }
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                            placeholder="1000 (1kg = 1000g)"
                          />
                        </div>
                      </>
                    )}
                  </div>

                  {error && (
                    <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                      {error}
                    </div>
                  )}
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                  >
                    {saving ? "Guardando..." : "Guardar"}
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:w-auto sm:text-sm"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
