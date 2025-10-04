"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { formatPrice } from "@/lib/format";
import ProductImage from "@/components/ProductImage";

interface OrderItem {
  id: string;
  quantity: number | string;
  price: number | string;
  subtotal: number | string;
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
  id: string;
  orderNumber: string;
  status: string;
  total: number | string;
  deliveryType: string;
  notes: string | null;
  createdAt: string;
  customer: {
    name: string;
    phone: string;
    address: string | null;
  };
  items: OrderItem[];
}

export default function StoreOrdersPage() {
  const params = useParams();
  const storeSlug = params.storeSlug as string;

  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showCustomerInfo, setShowCustomerInfo] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      // Obtener todos los pedidos y filtrar en el cliente
      const response = await fetch(`/api/${storeSlug}/admin/orders`);
      if (response.ok) {
        const data = await response.json();
        // Solo mostrar PENDING, READY y DELIVERING
        const filteredOrders = data.filter((order: Order) =>
          ["PENDING", "READY", "DELIVERING"].includes(order.status)
        );
        setOrders(filteredOrders);

        // Actualizar la orden seleccionada si existe
        if (selectedOrder) {
          const updated = filteredOrders.find((o: Order) => o.id === selectedOrder.id);
          if (updated) {
            setSelectedOrder(updated);
          } else {
            // Si la orden ya no está en la lista (ej: fue completada), volver a la lista
            setSelectedOrder(null);
          }
        }
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching orders:", error);
      setLoading(false);
    }
  }, [storeSlug, selectedOrder]);

    useEffect(() => {
    fetchOrders();
    // Polling cada 10 segundos
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const handleItemStatusChange = async (itemId: string, newStatus: string) => {
    if (!selectedOrder) return;

    try {
      setUpdating(true);
      const response = await fetch(
        `/api/${storeSlug}/admin/orders/${selectedOrder.orderNumber}/items/${itemId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itemStatus: newStatus }),
        }
      );

      if (!response.ok) {
        throw new Error("Error al actualizar el item");
      }

      // Refrescar los pedidos
      await fetchOrders();
      setUpdating(false);
    } catch (error) {
      console.error("Error updating item:", error);
      alert("Error al actualizar el item");
      setUpdating(false);
    }
  };

  const handleCompleteOrder = async () => {
    if (!selectedOrder) return;

    // Verificar que todos los items tengan estado
    const allProcessed = selectedOrder.items.every(
      (item) => item.itemStatus === "READY" || item.itemStatus === "UNAVAILABLE"
    );

    if (!allProcessed) {
      alert("Debes marcar todos los productos como 'Listo' o 'No lo tengo' antes de completar el pedido");
      return;
    }

    try {
      setUpdating(true);
      const response = await fetch(
        `/api/${storeSlug}/admin/orders/${selectedOrder.orderNumber}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "READY" }),
        }
      );

      if (!response.ok) {
        throw new Error("Error al completar el pedido");
      }

      // Volver a la lista
      setSelectedOrder(null);
      await fetchOrders();
      setUpdating(false);
    } catch (error) {
      console.error("Error completing order:", error);
      alert("Error al completar el pedido");
      setUpdating(false);
    }
  };

  const pendingItems = selectedOrder?.items.filter((item) => item.itemStatus === "PENDING") || [];
  const readyItems = selectedOrder?.items.filter((item) => item.itemStatus === "READY") || [];
  const unavailableItems = selectedOrder?.items.filter((item) => item.itemStatus === "UNAVAILABLE") || [];

  // Debug
  if (selectedOrder) {
    console.log("Selected Order:", selectedOrder);
    console.log("Total items:", selectedOrder.items.length);
    console.log("Pending items:", pendingItems.length);
    console.log("Items detail:", selectedOrder.items.map(i => ({ id: i.id, status: i.itemStatus, name: i.storeProduct?.masterProduct?.name })));
  }

  if (loading && orders.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-gray-600 text-sm">Cargando pedidos...</div>
      </div>
    );
  }

  // Vista de detalle del pedido
  if (selectedOrder) {
    return (
      <div className="fixed inset-0 bg-gray-50 z-50 overflow-y-auto">
        {/* Header fijo */}
        <div className="bg-white border-b-2 border-gray-300 sticky top-0 z-10 shadow-sm">
          <div className="px-4 py-4">
            <button
              onClick={() => {
                setSelectedOrder(null);
                setShowCustomerInfo(false);
              }}
              className="text-blue-600 font-bold text-base mb-3"
            >
              ← Volver a pedidos
            </button>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900">
                  Pedido #{selectedOrder.orderNumber}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-base text-gray-700">{selectedOrder.customer.name}</p>
                  <button
                    onClick={() => setShowCustomerInfo(!showCustomerInfo)}
                    className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-semibold hover:bg-blue-200"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Ver cliente
                  </button>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">
                  {readyItems.length} de {selectedOrder.items.length}
                </div>
                <div className="text-sm text-gray-600">listos</div>
              </div>
            </div>
          </div>

          {/* Modal de información del cliente */}
          {showCustomerInfo && (
            <div className="border-t-2 border-gray-200 bg-blue-50 px-4 py-4">
              <div className="space-y-2 text-sm text-blue-900">
                <p><span className="font-semibold">Teléfono:</span> {selectedOrder.customer.phone}</p>
                <p><span className="font-semibold">Entrega:</span> {selectedOrder.deliveryType === "PICKUP" ? "Recoger en tienda" : "Domicilio"}</p>
                {selectedOrder.deliveryType === "DELIVERY" && selectedOrder.customer.address && (
                  <p><span className="font-semibold">Dirección:</span> {selectedOrder.customer.address}</p>
                )}
                {selectedOrder.notes && (
                  <p><span className="font-semibold">Notas:</span> {selectedOrder.notes}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Contador de listos - área de "cesta" */}
        {readyItems.length > 0 && (
          <div className="bg-green-50 border-b-2 border-green-300 px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <svg className="w-7 h-7 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                </svg>
                <span className="text-lg font-bold text-green-800">
                  {readyItems.length} producto{readyItems.length !== 1 ? "s" : ""} listo{readyItems.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Lista de productos pendientes */}
        <div className="px-4 py-4 space-y-3">
          {pendingItems.length === 0 && selectedOrder && selectedOrder.items.length > 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
              <p className="text-sm text-yellow-800">
                Todos los productos han sido empacados
              </p>
            </div>
          ) : null}

          {pendingItems.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-lg border-2 border-gray-300 p-4 shadow-md"
            >
              <div className="flex gap-4">
                <div className="w-20 h-20 relative flex-shrink-0 bg-gray-100 rounded overflow-hidden">
                  <ProductImage
                    src={item.storeProduct.masterProduct.imageUrl}
                    alt={item.storeProduct.masterProduct.name}
                    disableZoom
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-3xl font-bold text-green-600">
                    {formatPrice(item.subtotal)}
                  </p>
                  <h3 className="font-bold text-gray-900 text-2xl leading-tight mt-1">
                    {item.storeProduct.masterProduct.name}
                  </h3>
                  <p className="text-xl font-semibold text-gray-700 mt-1">
                    {item.quantity} {item.measurementUnit.abbreviation}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => handleItemStatusChange(item.id, "UNAVAILABLE")}
                  disabled={updating}
                  className="flex-1 px-2 py-2 bg-red-600 text-white rounded-lg font-bold text-lg hover:bg-red-700 active:scale-95 transition-all disabled:opacity-50"
                >
                  No lo tengo
                </button>
                <button
                  onClick={() => handleItemStatusChange(item.id, "READY")}
                  disabled={updating}
                  className="flex-1 px-2 py-2 bg-green-600 text-white rounded-lg font-bold text-lg hover:bg-green-700 active:scale-95 transition-all disabled:opacity-50"
                >
                  ✓ Listo
                </button>
              </div>
            </div>
          ))}

          {/* Productos no disponibles */}
          {unavailableItems.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-bold text-gray-600 uppercase mb-3">
                No disponibles
              </h3>
              {unavailableItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-red-50 rounded-lg border-2 border-red-200 p-3 mb-3 opacity-75"
                >
                  <div className="flex gap-3 items-center">
                    <div className="w-16 h-16 relative flex-shrink-0 bg-gray-100 rounded overflow-hidden">
                      <ProductImage
                        src={item.storeProduct.masterProduct.imageUrl}
                        alt={item.storeProduct.masterProduct.name}
                        disableZoom
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 text-base line-through">
                        {item.storeProduct.masterProduct.name}
                      </h3>
                      <p className="text-sm text-red-700 font-semibold mt-0.5">No disponible</p>
                    </div>
                    <button
                      onClick={() => handleItemStatusChange(item.id, "PENDING")}
                      disabled={updating}
                      className="text-sm text-blue-600 font-bold px-3 py-2 bg-white rounded border border-blue-300"
                    >
                      Deshacer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Espacio para el botón fijo */}
          <div className="h-32"></div>
        </div>

        {/* Botones de acción fijos al final - según estado y tipo de entrega */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-300 p-4 shadow-lg">
          {selectedOrder.status === "PENDING" && (
            <>
              {pendingItems.length > 0 ? (
                <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-3 mb-3 text-center">
                  <p className="text-sm font-bold text-yellow-800">
                    Marca todos los productos antes de continuar
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">
                    {pendingItems.length} producto{pendingItems.length !== 1 ? 's' : ''} pendiente{pendingItems.length !== 1 ? 's' : ''}
                  </p>
                </div>
              ) : null}
              <button
                onClick={handleCompleteOrder}
                disabled={updating || pendingItems.length > 0}
                className="w-full px-6 py-4 bg-blue-600 text-white rounded-lg font-bold text-xl hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updating ? "Procesando..." : "✓ Pedido Listo"}
              </button>
            </>
          )}

          {selectedOrder.status === "READY" && (
            <>
              {selectedOrder.deliveryType === "DELIVERY" ? (
                <>
                  <button
                    onClick={async () => {
                      try {
                        setUpdating(true);
                        const response = await fetch(
                          `/api/${storeSlug}/admin/orders/${selectedOrder.orderNumber}/status`,
                          {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ status: "DELIVERING" }),
                          }
                        );
                        if (response.ok) {
                          await fetchOrders();
                        }
                        setUpdating(false);
                      } catch (error) {
                        console.error("Error:", error);
                        setUpdating(false);
                      }
                    }}
                    disabled={updating}
                    className="w-full px-6 py-4 bg-purple-600 text-white rounded-lg font-bold text-xl hover:bg-purple-700 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {updating ? "Procesando..." : "🚚 Ya te lo envié"}
                  </button>
                </>
              ) : (
                <>
                  <div className="bg-green-50 border-2 border-green-300 rounded-lg p-3 mb-3 text-center">
                    <p className="text-sm font-bold text-green-800">Pedido listo para recoger</p>
                  </div>
                  <button
                    onClick={async () => {
                      try {
                        setUpdating(true);
                        const response = await fetch(
                          `/api/${storeSlug}/admin/orders/${selectedOrder.orderNumber}/status`,
                          {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ status: "COMPLETED" }),
                          }
                        );
                        if (response.ok) {
                          setSelectedOrder(null);
                          await fetchOrders();
                        }
                        setUpdating(false);
                      } catch (error) {
                        console.error("Error:", error);
                        setUpdating(false);
                      }
                    }}
                    disabled={updating}
                    className="w-full px-6 py-4 bg-green-600 text-white rounded-lg font-bold text-xl hover:bg-green-700 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {updating ? "Procesando..." : "✓ Cliente Recogió"}
                  </button>
                </>
              )}
            </>
          )}

          {selectedOrder.status === "DELIVERING" && (
            <>
              <div className="bg-purple-50 border-2 border-purple-300 rounded-lg p-3 mb-3 text-center">
                <p className="text-sm font-bold text-purple-800">Pedido en camino al cliente</p>
              </div>
              <button
                onClick={async () => {
                  try {
                    setUpdating(true);
                    const response = await fetch(
                      `/api/${storeSlug}/admin/orders/${selectedOrder.orderNumber}/status`,
                      {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ status: "COMPLETED" }),
                      }
                    );
                    if (response.ok) {
                      setSelectedOrder(null);
                      await fetchOrders();
                    }
                    setUpdating(false);
                  } catch (error) {
                    console.error("Error:", error);
                    setUpdating(false);
                  }
                }}
                disabled={updating}
                className="w-full px-6 py-4 bg-green-600 text-white rounded-lg font-bold text-xl hover:bg-green-700 active:scale-95 transition-all disabled:opacity-50"
              >
                {updating ? "Procesando..." : "Marcar como entregado"}
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // Vista de lista de pedidos
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-4 py-4">
        <h1 className="text-xl font-bold text-gray-900 mb-1">Pedidos Activos</h1>
        <p className="text-sm text-gray-600 mb-4">
          {orders.length} pedido{orders.length !== 1 ? "s" : ""} por atender
        </p>

        {orders.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <p className="text-gray-500 text-sm">No hay pedidos pendientes</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => {
              const totalItems = order.items.length;
              const readyCount = order.items.filter((i) => i.itemStatus === "READY").length;
              const progress = (readyCount / totalItems) * 100;

              return (
                <div
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className="bg-white rounded-lg border border-gray-200 p-4 active:bg-gray-50 cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-gray-900 text-base">
                        #{order.orderNumber}
                      </h3>
                      <p className="text-sm text-gray-600">{order.customer.name}</p>
                      <p className="text-xs text-gray-500">{order.customer.phone}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-bold text-gray-900">
                        {formatPrice(order.total)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(order.createdAt).toLocaleTimeString("es-CO", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Barra de progreso */}
                  <div className="mt-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-600">
                        {readyCount} de {totalItems} productos listos
                      </span>
                      <span className="text-xs font-semibold text-gray-700">
                        {Math.round(progress)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
