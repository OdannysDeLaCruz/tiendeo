"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import ProductImage from "@/components/ProductImage";
import { formatPrice } from "@/lib/format";

type TabType = "products" | "details";

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  subtotal: number;
  itemStatus: string;
  storeProduct: {
    masterProduct: {
      name: string;
      imageUrl: string;
    };
  };
  measurementUnit: {
    name: string;
    abbreviation: string;
  };
}

interface Order {
  orderNumber: string;
  status: string;
  deliveryType: string;
  notes: string | null;
  total: number;
  createdAt: string;
  customer: {
    name: string;
    phone: string;
    address: string | null;
  };
  items: OrderItem[];
}

export default function OrderConfirmationPage() {
  const params = useParams();
  const router = useRouter();
  const storeSlug = params.storeSlug as string;
  const orderNumber = params.orderNumber as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("products");

  const fetchOrder = useCallback(async (initialLoad: boolean, token: string) => {
    try {
      if (initialLoad) {
        setLoading(true);
      }

      const response = await fetch(`/api/${storeSlug}/orders/${orderNumber}?token=${token}`);
      if (response.ok) {
        const data = await response.json();
        setOrder(data);
      } else if (initialLoad) {
        router.push(`/${storeSlug}`);
      }
    } catch (error) {
      console.error("Error fetching order:", error);
      if (initialLoad) {
        router.push(`/${storeSlug}`);
      }
    } finally {
      if (initialLoad) {
        setLoading(false);
      }
    }
  }, [storeSlug, orderNumber, router]);

  useEffect(() => {
    // Obtener el token de la URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");

    if (!token) {
      router.push(`/${storeSlug}`);
      return;
    }

    fetchOrder(true, token);

    // Polling cada 10 segundos para actualizar el estado
    const interval = setInterval(() => {
      fetchOrder(false, token);
    }, 10000);

    return () => clearInterval(interval);
  }, [storeSlug, router, fetchOrder]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-gray-600">Cargando pedido...</div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  const statusLabels: { [key: string]: string } = {
    PENDING: "Pendiente",
    CONFIRMED: "Confirmado",
    PREPARING: "Preparando",
    READY: "Listo",
    DELIVERING: "En camino",
    COMPLETED: "Completado",
    CANCELLED: "Cancelado",
  };

  const deliveryLabels: { [key: string]: string } = {
    DELIVERY: "Domicilio",
    PICKUP: "Recoger en tienda",
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      PENDING: "bg-yellow-100 text-yellow-800 border-yellow-300",
      READY: "bg-indigo-100 text-indigo-800 border-indigo-300",
      DELIVERING: "bg-purple-100 text-purple-800 border-purple-300",
      COMPLETED: "bg-green-100 text-green-800 border-green-300",
      CANCELLED: "bg-red-100 text-red-800 border-red-300",
    };
    return colors[status] || colors.PENDING;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <Image
            src="/assets/icons/pending.gif"
            alt="Pendiente"
            width={64}
            height={64}
            className="w-16 h-16"
          />
        );
      case "READY":
        return (
          <Image
            src="/assets/icons/ready.gif"
            alt="Listo"
            width={64}
            height={64}
            className="w-16 h-16"
          />
        );
      case "DELIVERING":
        return (
          <Image
            src="/assets/icons/delivering.gif"
            alt="En camino"
            width={64}
            height={64}
            className="w-16 h-16"
          />
        );
      case "COMPLETED":
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case "CANCELLED":
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getStatusMessage = (status: string, deliveryType: string) => {
    if (deliveryType === "PICKUP") {
      switch (status) {
        case "PENDING":
          return "La tienda está procesando tu pedido. Espera aquí hasta que esté listo.";
        case "READY":
          return "¡Tu pedido está listo! Puedes pasar a recogerlo cuando quieras.";
        case "COMPLETED":
          return "Pedido recogido exitosamente. ¡Gracias por tu compra!";
        case "CANCELLED":
          return "Este pedido ha sido cancelado.";
        default:
          return "";
      }
    } else {
      switch (status) {
        case "PENDING":
          return "La tienda está procesando tu pedido. Espera aquí hasta que esté listo.";
        case "READY":
          return "¡Tu pedido está listo! Pronto lo enviaremos.";
        case "DELIVERING":
          return "¡Tu pedido va en camino! Recibirás una llamada cuando el repartidor esté cerca.";
        case "COMPLETED":
          return "Pedido entregado exitosamente. ¡Gracias por tu compra!";
        case "CANCELLED":
          return "Este pedido ha sido cancelado.";
        default:
          return "";
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
      {/* Estado del pedido compacto */}
      <div className={`rounded-lg border-2 p-4 mb-4 ${getStatusColor(order.status)}`}>
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">
            {getStatusIcon(order.status)}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold mb-1">
              {statusLabels[order.status] || order.status}
            </h1>
            <p className="text-xs mb-1">
              {getStatusMessage(order.status, order.deliveryType)}
            </p>
            <p className="text-xs font-semibold">
              Pedido #{order.orderNumber}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-4">
        <button
          onClick={() => setActiveTab("products")}
          className={`flex-1 py-3 text-sm font-semibold transition-colors ${
            activeTab === "products"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Productos
        </button>
        <button
          onClick={() => setActiveTab("details")}
          className={`flex-1 py-3 text-sm font-semibold transition-colors ${
            activeTab === "details"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Detalles
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "products" && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
          <div className="p-4">
            <div className="space-y-3">
              {order.items.map((item) => {
                const getItemStatusBadge = () => {
                  if (item.itemStatus === "READY") {
                    return (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs font-medium">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Listo
                      </span>
                    );
                  }
                  if (item.itemStatus === "UNAVAILABLE") {
                    return (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-800 rounded text-xs font-medium">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        No hay
                      </span>
                    );
                  }
                  if (order.status === "PENDING") {
                    return (
                      <span className="inline-flex items-center px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">
                        Preparando...
                      </span>
                    );
                  }
                  return null;
                };

                return (
                  <div
                    key={item.id}
                    className={`flex gap-3 pb-3 border-b border-gray-100 last:border-b-0 last:pb-0 ${
                      item.itemStatus === "UNAVAILABLE" ? "opacity-60" : ""
                    }`}
                  >
                    <div className="w-14 h-14 relative flex-shrink-0 bg-gray-100 rounded overflow-hidden">
                      <ProductImage
                        src={item.storeProduct.masterProduct.imageUrl}
                        alt={item.storeProduct.masterProduct.name}
                        disableZoom
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium text-gray-900 text-sm ${item.itemStatus === "UNAVAILABLE" ? "line-through" : ""}`}>
                        {item.storeProduct.masterProduct.name}
                      </p>
                      <p className="text-xs text-gray-600">
                        {item.quantity} {item.measurementUnit.abbreviation} × {formatPrice(item.price)}
                      </p>
                      <div className="mt-1">{getItemStatusBadge()}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`font-semibold text-gray-900 text-sm ${item.itemStatus === "UNAVAILABLE" ? "line-through" : ""}`}>
                        {formatPrice(item.subtotal)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total */}
            <div className="border-t-2 border-gray-300 mt-4 pt-3">
              <div className="flex justify-between items-center">
                <span className="text-base font-bold text-gray-900">Total</span>
                <span className="text-xl font-bold text-gray-900">
                  {formatPrice(order.total)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "details" && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-base font-bold text-gray-900 mb-3">
              Detalles del pedido
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Tipo de entrega</span>
                <span className="font-semibold text-gray-900 text-sm">
                  {deliveryLabels[order.deliveryType] || order.deliveryType}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Fecha</span>
                <span className="font-semibold text-gray-900 text-sm">
                  {new Date(order.createdAt).toLocaleDateString("es-CO", {
                    day: "numeric",
                    month: "long",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-2 text-sm">
              Información de contacto
            </h3>
            <div className="space-y-1">
              <p className="text-gray-700 text-sm">
                <span className="font-medium">Nombre:</span> {order.customer.name}
              </p>
              <p className="text-gray-700 text-sm">
                <span className="font-medium">Teléfono:</span> {order.customer.phone}
              </p>
              {order.deliveryType === "DELIVERY" && order.customer.address && (
                <p className="text-gray-700 text-sm">
                  <span className="font-medium">Dirección:</span> {order.customer.address}
                </p>
              )}
            </div>
          </div>

          {order.notes && (
            <div className="p-4 bg-gray-50">
              <h3 className="font-semibold text-gray-900 mb-2 text-sm">
                Notas adicionales
              </h3>
              <p className="text-gray-700 text-sm">{order.notes}</p>
            </div>
          )}
        </div>
      )}

      {/* Siguiente paso - Solo si está pendiente */}
      {order.status === "PENDING" && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <h3 className="font-semibold text-blue-900 mb-1 text-sm">¿Qué sigue?</h3>
          <p className="text-blue-800 text-xs">
            El tendero está procesando tu pedido. Te mantendremos actualizado sobre el estado.
            Mantén esta página abierta para ver actualizaciones en tiempo real.
          </p>
        </div>
      )}

      {/* Botón volver */}
      <div className="text-center">
        <Link
          href={`/${storeSlug}`}
          className="inline-block px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
        >
          Volver a la tienda
        </Link>
      </div>
    </div>
  );
}
