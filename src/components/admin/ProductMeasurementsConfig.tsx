"use client";

import { useState, useEffect } from "react";

interface MeasurementUnit {
  id: string;
  name: string;
  abbreviation: string;
  type: string;
  isActive: boolean;
}

interface ProductMeasurement {
  id?: string;
  measurementUnitId: string;
  measurementUnit?: MeasurementUnit;
  isDefault: boolean;
  minQuantity: string;
  stepQuantity: string;
}

interface ProductMeasurementsConfigProps {
  productId?: string; // Si existe, estamos editando
  onMeasurementsChange?: (measurements: ProductMeasurement[]) => void;
}

export default function ProductMeasurementsConfig({
  productId,
  onMeasurementsChange,
}: ProductMeasurementsConfigProps) {
  const [availableUnits, setAvailableUnits] = useState<MeasurementUnit[]>([]);
  const [selectedMeasurements, setSelectedMeasurements] = useState<
    ProductMeasurement[]
  >([]);
  const [isAddingUnit, setIsAddingUnit] = useState(false);
  const [newMeasurement, setNewMeasurement] = useState<ProductMeasurement>({
    measurementUnitId: "",
    isDefault: false,
    minQuantity: "",
    stepQuantity: "",
  });

  useEffect(() => {
    fetchAvailableUnits();
    if (productId) {
      fetchProductMeasurements();
    }
  }, [productId]);

  useEffect(() => {
    if (onMeasurementsChange) {
      onMeasurementsChange(selectedMeasurements);
    }
  }, [selectedMeasurements]);

  const fetchAvailableUnits = async () => {
    try {
      const response = await fetch("/api/admin/measurement-units");
      if (response.ok) {
        const data = await response.json();
        setAvailableUnits(data.filter((u: MeasurementUnit) => u.isActive));
      }
    } catch (error) {
      console.error("Error fetching units:", error);
    }
  };

  const fetchProductMeasurements = async () => {
    if (!productId) return;

    try {
      const response = await fetch(
        `/api/admin/products/${productId}/measurements`
      );
      if (response.ok) {
        const data = await response.json();
        setSelectedMeasurements(
          data.map((m: ProductMeasurement) => ({
            id: m.id,
            measurementUnitId: m.measurementUnitId,
            measurementUnit: m.measurementUnit,
            isDefault: m.isDefault,
            minQuantity: m.minQuantity?.toString() || "",
            stepQuantity: m.stepQuantity?.toString() || "",
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching measurements:", error);
    }
  };

  const handleAddMeasurement = async () => {
    if (!newMeasurement.measurementUnitId) {
      alert("Selecciona una unidad de medida");
      return;
    }

    // Si estamos editando un producto existente, guardar en BD
    if (productId) {
      try {
        const response = await fetch(
          `/api/admin/products/${productId}/measurements`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              measurementUnitId: newMeasurement.measurementUnitId,
              isDefault: newMeasurement.isDefault,
              minQuantity: newMeasurement.minQuantity || null,
              stepQuantity: newMeasurement.stepQuantity || null,
            }),
          }
        );

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error);
        }

        await fetchProductMeasurements();
      } catch (error) {
        alert(error instanceof Error ? error.message : "Error desconocido");
        return;
      }
    } else {
      // Producto nuevo, solo agregar a la lista local
      const unit = availableUnits.find(
        (u) => u.id === newMeasurement.measurementUnitId
      );
      if (!unit) return;

      // Si es default, quitar default de los demás
      const updatedMeasurements = newMeasurement.isDefault
        ? selectedMeasurements.map((m) => ({ ...m, isDefault: false }))
        : selectedMeasurements;

      setSelectedMeasurements([
        ...updatedMeasurements,
        {
          ...newMeasurement,
          measurementUnit: unit,
        },
      ]);
    }

    // Reset form
    setNewMeasurement({
      measurementUnitId: "",
      isDefault: false,
      minQuantity: "",
      stepQuantity: "",
    });
    setIsAddingUnit(false);
  };

  const handleRemoveMeasurement = async (measurement: ProductMeasurement) => {
    if (productId && measurement.id) {
      // Producto existente, eliminar de BD
      if (!confirm("¿Eliminar esta unidad de medida?")) return;

      try {
        const response = await fetch(
          `/api/admin/products/${productId}/measurements/${measurement.id}`,
          { method: "DELETE" }
        );

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error);
        }

        await fetchProductMeasurements();
      } catch (error) {
        alert(error instanceof Error ? error.message : "Error desconocido");
      }
    } else {
      // Producto nuevo, solo quitar de la lista
      setSelectedMeasurements(
        selectedMeasurements.filter(
          (m) => m.measurementUnitId !== measurement.measurementUnitId
        )
      );
    }
  };

  const handleToggleDefault = async (measurement: ProductMeasurement) => {
    if (productId && measurement.id) {
      // Producto existente, actualizar en BD
      try {
        const response = await fetch(
          `/api/admin/products/${productId}/measurements/${measurement.id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isDefault: !measurement.isDefault }),
          }
        );

        if (!response.ok) throw new Error("Error al actualizar");

        await fetchProductMeasurements();
      } catch (error) {
        alert(error instanceof Error ? error.message : "Error desconocido");
      }
    } else {
      // Producto nuevo, actualizar lista local
      setSelectedMeasurements(
        selectedMeasurements.map((m) =>
          m.measurementUnitId === measurement.measurementUnitId
            ? { ...m, isDefault: true }
            : { ...m, isDefault: false }
        )
      );
    }
  };

  const getAvailableUnitsForSelect = () => {
    const usedUnitIds = selectedMeasurements.map((m) => m.measurementUnitId);
    return availableUnits.filter((u) => !usedUnitIds.includes(u.id));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">
          Unidades de Medida
        </h3>
        {!isAddingUnit && (
          <button
            type="button"
            onClick={() => setIsAddingUnit(true)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            + Agregar Unidad
          </button>
        )}
      </div>

      {/* Agregar nueva unidad */}
      {isAddingUnit && (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unidad *
              </label>
              <select
                value={newMeasurement.measurementUnitId}
                onChange={(e) =>
                  setNewMeasurement({
                    ...newMeasurement,
                    measurementUnitId: e.target.value,
                  })
                }
                className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">Seleccionar...</option>
                {getAvailableUnitsForSelect().map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.name} ({unit.abbreviation})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cantidad Mínima
              </label>
              <input
                type="number"
                step="0.01"
                value={newMeasurement.minQuantity}
                onChange={(e) =>
                  setNewMeasurement({
                    ...newMeasurement,
                    minQuantity: e.target.value,
                  })
                }
                placeholder="0.25"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Incremento
              </label>
              <input
                type="number"
                step="0.01"
                value={newMeasurement.stepQuantity}
                onChange={(e) =>
                  setNewMeasurement({
                    ...newMeasurement,
                    stepQuantity: e.target.value,
                  })
                }
                placeholder="0.25"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>

            <div className="flex items-end">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={newMeasurement.isDefault}
                  onChange={(e) =>
                    setNewMeasurement({
                      ...newMeasurement,
                      isDefault: e.target.checked,
                    })
                  }
                  className="h-4 w-4 text-blue-600 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Por defecto</span>
              </label>
            </div>
          </div>

          <div className="mt-3 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => {
                setIsAddingUnit(false);
                setNewMeasurement({
                  measurementUnitId: "",
                  isDefault: false,
                  minQuantity: "",
                  stepQuantity: "",
                });
              }}
              className="px-3 py-1 text-sm text-gray-700 hover:text-gray-900"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleAddMeasurement}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Agregar
            </button>
          </div>
        </div>
      )}

      {/* Lista de unidades configuradas */}
      {selectedMeasurements.length === 0 ? (
        <div className="text-sm text-gray-500 py-4 text-center bg-gray-50 rounded-lg border border-gray-200">
          No hay unidades de medida configuradas.
          <br />
          Agrega al menos una unidad para que este producto pueda ser vendido.
        </div>
      ) : (
        <div className="space-y-2">
          {selectedMeasurements.map((measurement) => (
            <div
              key={
                measurement.id ||
                `new-${measurement.measurementUnitId}`
              }
              className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg"
            >
              <div className="flex items-center space-x-4">
                <div>
                  <div className="font-medium text-gray-900">
                    {measurement.measurementUnit?.name ||
                      availableUnits.find(
                        (u) => u.id === measurement.measurementUnitId
                      )?.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {measurement.minQuantity && (
                      <span>Mín: {measurement.minQuantity} </span>
                    )}
                    {measurement.stepQuantity && (
                      <span>| Paso: {measurement.stepQuantity}</span>
                    )}
                  </div>
                </div>
                {measurement.isDefault && (
                  <span className="px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded">
                    Por defecto
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-3">
                {!measurement.isDefault && (
                  <button
                    type="button"
                    onClick={() => handleToggleDefault(measurement)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Marcar como default
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleRemoveMeasurement(measurement)}
                  className="text-red-600 hover:text-red-800"
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
