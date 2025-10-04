import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function StoreAuthLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;

  // Verificar que la tienda existe y está activa
  const store = await prisma.store.findUnique({
    where: { slug: storeSlug },
    select: { id: true, isActive: true },
  });

  if (!store || !store.isActive) {
    notFound();
  }

  return <>{children}</>;
}
