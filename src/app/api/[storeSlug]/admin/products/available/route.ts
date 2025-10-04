import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isStoreOwner } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ storeSlug: string }> }
) {
  try {
    const session = await auth();
    if (!session || !isStoreOwner(session)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { storeSlug } = await params;

    // Verificar que el usuario pertenece a esta tienda
    if (session.user.storeSlug !== storeSlug) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // Obtener parámetro de categoría si existe
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");

    // Obtener IDs de productos que ya están en la tienda
    const storeProducts = await prisma.storeProduct.findMany({
      where: {
        storeId: session.user.storeId!,
      },
      select: {
        masterProductId: true,
      },
    });

    const existingProductIds = storeProducts.map((p) => p.masterProductId);

    // Obtener productos maestros que NO están en la tienda
    const availableProducts = await prisma.masterProduct.findMany({
      where: {
        id: {
          notIn: existingProductIds,
        },
        isActive: true,
        ...(categoryId && { categoryId }),
      },
      select: {
        id: true,
        name: true,
        imageUrl: true,
        productMeasurements: {
          where: {
            measurementUnit: {
              isActive: true,
            },
          },
          include: {
            measurementUnit: true,
          },
          orderBy: {
            isDefault: "desc", // Los default primero
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(availableProducts);
  } catch (error) {
    console.error("Error fetching available products:", error);
    return NextResponse.json(
      { error: "Error al obtener los productos disponibles" },
      { status: 500 }
    );
  }
}
