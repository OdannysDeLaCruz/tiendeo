import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

// Rutas que NO requieren tenant resolution
const EXCLUDED_PATHS = [
  "/api/auth",
  "/_next",
  "/favicon.ico",
  "/admin", // Rutas de superadmin
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Excluir rutas que no necesitan tenant
  if (EXCLUDED_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Excluir archivos estáticos
  if (pathname.includes(".")) {
    return NextResponse.next();
  }

  // Extraer el slug de la tienda desde la URL: /{storeSlug}/...
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) {
    // Ruta raíz sin tenant
    return NextResponse.next();
  }

  const storeSlug = segments[0];

  // Si el slug es "admin", es ruta de superadmin
  if (storeSlug === "admin") {
    return NextResponse.next();
  }

  try {
    // Verificar que la tienda existe y está activa
    const store = await prisma.store.findUnique({
      where: { slug: storeSlug },
      select: { id: true, slug: true, isActive: true },
    });

    if (!store) {
      // Tienda no encontrada
      return NextResponse.redirect(new URL("/404", request.url));
    }

    if (!store.isActive) {
      // Tienda inactiva
      return NextResponse.redirect(new URL("/store-inactive", request.url));
    }

    // Establecer headers con información del tenant
    const response = NextResponse.next();
    response.headers.set("x-store-id", store.id);
    response.headers.set("x-store-slug", store.slug);

    return response;
  } catch (error) {
    console.error("Error en middleware de tenant:", error);
    return NextResponse.redirect(new URL("/error", request.url));
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
