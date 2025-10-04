import { auth } from "@/lib/auth";
import type { Session } from "next-auth";

/**
 * Obtener la sesión del servidor
 */
export async function getServerSession() {
  return await auth();
}

/**
 * Validar si el usuario tiene acceso a una tienda específica
 */
export function validateTenantAccess(
  session: Session | null,
  requiredStoreId: string
): boolean {
  if (!session?.user) {
    return false;
  }

  // Superadmin tiene acceso a todo
  if (session.user.role === "SUPERADMIN") {
    return true;
  }

  // Tendero solo tiene acceso a su tienda
  if (session.user.role === "STORE_OWNER") {
    return session.user.storeId === requiredStoreId;
  }

  return false;
}

/**
 * Validar si el usuario es superadmin
 */
export function isSuperadmin(session: Session | null): boolean {
  return session?.user?.role === "SUPERADMIN";
}

/**
 * Validar si el usuario es tendero
 */
export function isStoreOwner(session: Session | null): boolean {
  return session?.user?.role === "STORE_OWNER";
}

/**
 * Obtener el storeId de la sesión (si existe)
 */
export function getSessionStoreId(session: Session | null): string | null {
  return session?.user?.storeId ?? null;
}

/**
 * Obtener el storeSlug de la sesión (si existe)
 */
export function getSessionStoreSlug(session: Session | null): string | null {
  return session?.user?.storeSlug ?? null;
}
