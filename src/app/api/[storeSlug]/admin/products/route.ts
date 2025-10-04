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

    const products = await prisma.storeProduct.findMany({
      where: {
        storeId: session.user.storeId!,
      },
      include: {
        masterProduct: {
          include: {
            category: {
              select: {
                name: true,
              },
            },
          },
        },
        prices: {
          where: {
            isActive: true,
          },
          include: {
            measurementUnit: true,
          },
          orderBy: {
            measurementUnit: {
              name: "asc",
            },
          },
        },
      },
      orderBy: {
        masterProduct: {
          name: "asc",
        },
      },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Error al obtener los productos" },
      { status: 500 }
    );
  }
}
