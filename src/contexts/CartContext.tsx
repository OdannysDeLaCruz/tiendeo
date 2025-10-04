"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface CartItem {
  storeProductId: string;
  measurementUnitId: string;
  quantity: number;
  productName: string;
  productImage: string;
  unitName: string;
  unitAbbreviation: string;
  price: number;
  minQuantity?: number;
  stepQuantity?: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (storeProductId: string, measurementUnitId: string) => void;
  updateQuantity: (storeProductId: string, measurementUnitId: string, quantity: number) => void;
  clearCart: () => void;
  total: number;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({
  children,
  storeSlug,
}: {
  children: ReactNode;
  storeSlug: string;
}) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [mounted, setMounted] = useState(false);

  // Cargar carrito desde localStorage
  useEffect(() => {
    setMounted(true);
    const savedCart = localStorage.getItem(`cart_${storeSlug}`);
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (error) {
        console.error("Error loading cart:", error);
      }
    }
  }, [storeSlug]);

  // Guardar carrito en localStorage cuando cambie
  useEffect(() => {
    if (mounted) {
      localStorage.setItem(`cart_${storeSlug}`, JSON.stringify(items));
    }
  }, [items, storeSlug, mounted]);

  const addItem = (newItem: CartItem) => {
    setItems((prevItems) => {
      // Verificar si el item ya existe (mismo producto y unidad de medida)
      const existingItemIndex = prevItems.findIndex(
        (item) =>
          item.storeProductId === newItem.storeProductId &&
          item.measurementUnitId === newItem.measurementUnitId
      );

      if (existingItemIndex > -1) {
        // Si existe, incrementar cantidad
        const updated = [...prevItems];
        updated[existingItemIndex].quantity += newItem.quantity;
        return updated;
      }

      // Si no existe, agregar nuevo item
      return [...prevItems, newItem];
    });
  };

  const removeItem = (storeProductId: string, measurementUnitId: string) => {
    setItems((prevItems) =>
      prevItems.filter(
        (item) =>
          !(
            item.storeProductId === storeProductId &&
            item.measurementUnitId === measurementUnitId
          )
      )
    );
  };

  const updateQuantity = (
    storeProductId: string,
    measurementUnitId: string,
    quantity: number
  ) => {
    if (quantity <= 0) {
      removeItem(storeProductId, measurementUnitId);
      return;
    }

    setItems((prevItems) =>
      prevItems.map((item) =>
        item.storeProductId === storeProductId &&
        item.measurementUnitId === measurementUnitId
          ? { ...item, quantity }
          : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        total,
        itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
