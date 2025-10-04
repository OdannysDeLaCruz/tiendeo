import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { CartProvider } from "@/contexts/CartContext";
import CartIcon from "./CartIcon";
import CartFooter from "@/components/CartFooter";

interface StoreLayoutProps {
  children: React.ReactNode;
  params: Promise<{ storeSlug: string }>;
}

export default async function StoreLayout({
  children,
  params,
}: StoreLayoutProps) {
  const { storeSlug } = await params;

  // Obtener información de la tienda
  const store = await prisma.store.findUnique({
    where: { slug: storeSlug },
    select: {
      id: true,
      name: true,
      slug: true,
      address: true,
      phone: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  // Si la tienda no existe o no está activa, mostrar 404
  if (!store || !store.isActive) {
    notFound();
  }

  return (
    <CartProvider storeSlug={storeSlug}>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="flex justify-between items-center h-16">
              {/* Logo/Nombre de la tienda */}
              <Link href={`/${storeSlug}`} className="flex items-center">
                <h1 className="text-xl font-bold text-gray-900">
                  {store.name}
                </h1>
              </Link>

              {/* Navegación */}
              <nav className="flex items-center space-x-4">
                <Link
                  href={`/${storeSlug}`}
                  className="text-gray-700 hover:text-gray-900"
                >
                  Inicio
                </Link>
                <Link
                  href={`/${storeSlug}/search`}
                  className="p-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
                  aria-label="Buscar"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </Link>
                <CartIcon storeSlug={storeSlug} />
              </nav>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 pb-24">
          {children}
        </main>

        {/* Cart Footer flotante */}
        <CartFooter storeSlug={storeSlug} />

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 mt-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
            <div className="text-center text-sm text-gray-600">
              <p>{store.name}</p>
              {store.address && <p className="mt-1">{store.address}</p>}
              {store.phone && (
                <p className="mt-1">
                  Tel: <a href={`tel:${store.phone}`} className="text-blue-600 hover:text-blue-800">{store.phone}</a>
                </p>
              )}
            </div>
          </div>
        </footer>
      </div>
    </CartProvider>
  );
}
