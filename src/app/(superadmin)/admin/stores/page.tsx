import { prisma } from "@/lib/prisma";
import Link from "next/link";
import StoresTable from "@/components/admin/StoresTable";

export default async function StoresPage() {
  const stores = await prisma.store.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          storeUsers: true,
          storeProducts: true,
          orders: true,
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Gestión de Tiendas
          </h2>
          <p className="text-gray-600 mt-1">
            Administra las tiendas del sistema
          </p>
        </div>
        <Link
          href="/admin/stores/new"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg
            className="mr-2 h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Nueva Tienda
        </Link>
      </div>

      <StoresTable stores={stores} />
    </div>
  );
}
