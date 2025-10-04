"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCart } from "@/contexts/CartContext";
import { formatPrice } from "@/lib/format";
import ProductImage from "@/components/ProductImage";

type DeliveryType = "PICKUP" | "DELIVERY";

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const storeSlug = params.storeSlug as string;
  const { items, total, clearCart } = useCart();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [deliveryType, setDeliveryType] = useState<DeliveryType>("DELIVERY");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirigir si no hay items (pero no si estamos enviando la orden)
  useEffect(() => {
    if (items.length === 0 && !isSubmitting) {
      router.push(`/${storeSlug}`);
    }
  }, [items.length, router, storeSlug, isSubmitting]);

  if (items.length === 0) {
    return null;
  }

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!name.trim()) {
      newErrors.name = "El nombre es requerido";
    }

    if (!phone.trim()) {
      newErrors.phone = "El teléfono es requerido";
    } else if (!/^\d{10}$/.test(phone.replace(/\s/g, ""))) {
      newErrors.phone = "El teléfono debe tener 10 dígitos";
    }

    if (deliveryType === "DELIVERY" && !address.trim()) {
      newErrors.address = "La dirección es requerida para domicilio";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/${storeSlug}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customer: {
            name,
            phone,
            address: deliveryType === "DELIVERY" ? address : null,
          },
          deliveryType,
          notes,
          items: items.map((item) => ({
            storeProductId: item.storeProductId,
            measurementUnitId: item.measurementUnitId,
            quantity: item.quantity,
            price: item.price,
          })),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        clearCart();
        router.push(`/${storeSlug}/orders/${data.orderNumber}?token=${data.accessToken}`);
      } else {
        const error = await response.json();
        alert(error.error || "Error al crear el pedido");
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error("Error creating order:", error);
      alert("Error al crear el pedido");
      setIsSubmitting(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        Finalizar Pedido
      </h1>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulario */}
          <div className="lg:col-span-2 space-y-6">
            {/* Información del cliente */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Información de contacto
              </h2>

              <div className="space-y-4">
                {/* Nombre */}
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Nombre completo *
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.name ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Juan Pérez"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                  )}
                </div>

                {/* Teléfono */}
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Teléfono *
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.phone ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="3001234567"
                  />
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Tipo de entrega */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Tipo de entrega
              </h2>

              <div className="space-y-3">
                {/* Domicilio */}
                <label className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="deliveryType"
                    value="DELIVERY"
                    checked={deliveryType === "DELIVERY"}
                    onChange={(e) =>
                      setDeliveryType(e.target.value as DeliveryType)
                    }
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">Domicilio</div>
                    <div className="text-sm text-gray-600">
                      Recibirás tu pedido en la dirección indicada
                    </div>
                  </div>
                </label>

                {/* Recoger en tienda */}
                <label className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="deliveryType"
                    value="PICKUP"
                    checked={deliveryType === "PICKUP"}
                    onChange={(e) =>
                      setDeliveryType(e.target.value as DeliveryType)
                    }
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      Recoger en tienda
                    </div>
                    <div className="text-sm text-gray-600">
                      Pasarás a recoger tu pedido
                    </div>
                  </div>
                </label>
              </div>

              {/* Dirección (solo si es domicilio) */}
              {deliveryType === "DELIVERY" && (
                <div className="mt-4">
                  <label
                    htmlFor="address"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Dirección de entrega *
                  </label>
                  <textarea
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    rows={3}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.address ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Calle 123 #45-67, Barrio, Ciudad"
                  />
                  {errors.address && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.address}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Notas adicionales */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Notas adicionales (opcional)
              </h2>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Indicaciones especiales, preferencias, etc."
              />
            </div>
          </div>

          {/* Resumen del pedido */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 sticky top-20">
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Resumen del pedido
                </h2>

                {/* Items */}
                <div className="space-y-3 mb-6">
                  {items.map((item) => (
                    <div
                      key={`${item.storeProductId}-${item.measurementUnitId}`}
                      className="flex gap-3"
                    >
                      <div className="w-12 h-12 relative flex-shrink-0 bg-gray-100 rounded overflow-hidden">
                        <ProductImage
                          src={item.productImage}
                          alt={item.productName}
                          disableZoom
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {item.productName}
                        </p>
                        <p className="text-xs text-gray-600">
                          {item.quantity} {item.unitAbbreviation} × {formatPrice(item.price)}
                        </p>
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        {formatPrice(Number(item.price) * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="border-t border-gray-200 pt-4 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-900">
                      Total
                    </span>
                    <span className="text-2xl font-bold text-gray-900">
                      {formatPrice(total)}
                    </span>
                  </div>
                </div>

                {/* Botón confirmar */}
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full px-6 py-4 rounded-lg font-semibold text-lg transition-all ${
                    loading
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-700 active:scale-95"
                  }`}
                >
                  {loading ? "Procesando..." : "Confirmar pedido"}
                </button>

                <p className="mt-4 text-xs text-gray-600 text-center">
                  Al confirmar, el tendero recibirá tu pedido y se pondrá en
                  contacto contigo
                </p>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
