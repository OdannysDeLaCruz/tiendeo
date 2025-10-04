import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isStoreOwner } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ storeSlug: string; orderNumber: string; itemId: string }> }
) {
  try {
    const session = await auth();
    if (!session || !isStoreOwner(session)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { storeSlug, orderNumber, itemId } = await params;

    // Verificar que el usuario pertenece a esta tienda
    if (session.user.storeSlug !== storeSlug) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { itemStatus } = await request.json();

    // Validar el estado
    if (!["PENDING", "READY", "UNAVAILABLE"].includes(itemStatus)) {
      return NextResponse.json(
        { error: "Estado inválido" },
        { status: 400 }
      );
    }

    // Verificar que el item pertenece a un pedido de esta tienda
    if (!session.user.storeId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const item = await prisma.orderItem.findFirst({
      where: {
        id: itemId,
        order: {
          storeId: session.user.storeId,
          orderNumber: orderNumber,
        },
      },
    });

    if (!item) {
      return NextResponse.json(
        { error: "Item no encontrado" },
        { status: 404 }
      );
    }

    // Actualizar el estado del item
    const updatedItem = await prisma.orderItem.update({
      where: { id: itemId },
      data: { itemStatus },
      include: {
        storeProduct: {
          include: {
            masterProduct: {
              select: {
                name: true,
                imageUrl: true,
              },
            },
          },
        },
        measurementUnit: {
          select: {
            name: true,
            abbreviation: true,
          },
        },
      },
    });

    // Recalcular el total del pedido
    const order = await prisma.order.findUnique({
      where: { id: item.orderId },
      include: {
        items: true,
      },
    });

    if (order) {
      // Sumar solo los items que NO están marcados como UNAVAILABLE
      const newTotal = order.items
        .filter((i) => i.itemStatus !== "UNAVAILABLE")
        .reduce((sum, i) => sum + Number(i.subtotal), 0);

      // Actualizar el total
      await prisma.order.update({
        where: { id: order.id },
        data: { total: newTotal },
      });
    }

    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error("Error updating item status:", error);
    return NextResponse.json(
      { error: "Error al actualizar el estado del item" },
      { status: 500 }
    );
  }
}
