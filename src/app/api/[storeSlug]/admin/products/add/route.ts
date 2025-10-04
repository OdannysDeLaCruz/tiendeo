import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isStoreOwner } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export async function POST(
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

    const body = await request.json();
    const { masterProductId, prices } = body;

    if (!masterProductId || !prices || !Array.isArray(prices)) {
      return NextResponse.json(
        { error: "Producto y precios son requeridos" },
        { status: 400 }
      );
    }

    // Validar que haya al menos un precio
    if (prices.length === 0) {
      return NextResponse.json(
        { error: "Debe especificar al menos un precio" },
        { status: 400 }
      );
    }

    // Validar todos los precios
    for (const priceItem of prices) {
      if (!priceItem.measurementUnitId || !priceItem.price) {
        return NextResponse.json(
          { error: "Todos los precios deben tener unidad de medida y valor" },
          { status: 400 }
        );
      }

      const numPrice = parseFloat(priceItem.price);
      if (isNaN(numPrice) || numPrice <= 0) {
        return NextResponse.json(
          { error: "Todos los precios deben ser mayores a 0" },
          { status: 400 }
        );
      }
    }

    // Verificar que el producto maestro existe
    const masterProduct = await prisma.masterProduct.findUnique({
      where: { id: masterProductId },
    });

    if (!masterProduct) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    // Verificar que el producto no esté ya en la tienda
    const existingProduct = await prisma.storeProduct.findFirst({
      where: {
        storeId: session.user.storeId!,
        masterProductId: masterProductId,
      },
    });

    if (existingProduct) {
      return NextResponse.json(
        { error: "Este producto ya está en tu tienda" },
        { status: 400 }
      );
    }

    // Crear el StoreProduct junto con los precios en una transacción
    const result = await prisma.$transaction(async (tx) => {
      // Crear el StoreProduct
      const storeProduct = await tx.storeProduct.create({
        data: {
          storeId: session.user.storeId!,
          masterProductId: masterProductId,
          price: parseFloat(prices[0].price), // Guardar el primer precio como legacy
          isAvailable: true,
        },
      });

      // Crear todos los precios por unidad de medida
      await tx.storeProductPrice.createMany({
        data: prices.map((priceItem: { measurementUnitId: string; price: number }) => ({
          storeProductId: storeProduct.id,
          measurementUnitId: priceItem.measurementUnitId,
          price: parseFloat(priceItem.price.toString()),
          isActive: true,
        })),
      });

      // Obtener el producto completo con todas las relaciones
      return await tx.storeProduct.findUnique({
        where: { id: storeProduct.id },
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
            include: {
              measurementUnit: true,
            },
          },
        },
      });
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error adding product:", error);
    return NextResponse.json(
      { error: "Error al agregar el producto" },
      { status: 500 }
    );
  }
}
