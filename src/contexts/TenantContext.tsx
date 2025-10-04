"use client";

import React, { createContext, useContext, ReactNode } from "react";

interface TenantContextType {
  storeId: string | null;
  storeSlug: string | null;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

interface TenantProviderProps {
  children: ReactNode;
  storeId: string | null;
  storeSlug: string | null;
}

export function TenantProvider({
  children,
  storeId,
  storeSlug,
}: TenantProviderProps) {
  return (
    <TenantContext.Provider value={{ storeId, storeSlug }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error("useTenant must be used within a TenantProvider");
  }
  return context;
}
