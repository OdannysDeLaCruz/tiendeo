import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ storeSlug: string; id: string; priceId: string }> }
) {
  try {
    const session = await auth();
    const { storeSlug, id, priceId } = await params;
    const body = await request.json();

    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener la tienda
    const store = await prisma.store.findUnique({
      where: { slug: storeSlug },
    });

    if (!store) {
      return NextResponse.json(
        { error: "Tienda no encontrada" },
        { status: 404 }
      );
    }

    // Verificar que el usuario pertenece a esta tienda
    if (session.user.role === "STORE_OWNER" && session.user.storeId !== store.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // Verificar que el producto pertenece a esta tienda
    const storeProduct = await prisma.storeProduct.findUnique({
      where: { id },
    });

    if (!storeProduct || storeProduct.storeId !== store.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // Verificar que el precio pertenece a este producto
    const priceItem = await prisma.storeProductPrice.findUnique({
      where: { id: priceId },
    });

    if (!priceItem || priceItem.storeProductId !== id) {
      return NextResponse.json({ error: "Precio no encontrado" }, { status: 404 });
    }

    // Validar precio
    if (!body.price || body.price <= 0) {
      return NextResponse.json(
        { error: "El precio debe ser mayor a 0" },
        { status: 400 }
      );
    }

    // Actualizar precio
    const updatedPrice = await prisma.storeProductPrice.update({
      where: { id: priceId },
      data: {
        price: body.price,
      },
    });

    return NextResponse.json(updatedPrice);
  } catch (error) {
    console.error("Error updating price:", error);
    return NextResponse.json(
      { error: "Error al actualizar el precio" },
      { status: 500 }
    );
  }
}
