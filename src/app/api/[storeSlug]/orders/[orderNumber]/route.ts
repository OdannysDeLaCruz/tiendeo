import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ storeSlug: string; orderNumber: string }> }
) {
  try {
    const { storeSlug, orderNumber } = await params;

    // Obtener token de query params
    const { searchParams } = new URL(request.url);
    const accessToken = searchParams.get("token");

    if (!accessToken) {
      return NextResponse.json(
        { error: "Token de acceso requerido" },
        { status: 401 }
      );
    }

    // Validar que la tienda existe
    const store = await prisma.store.findUnique({
      where: { slug: storeSlug },
    });

    if (!store) {
      return NextResponse.json(
        { error: "Tienda no encontrada" },
        { status: 404 }
      );
    }

    // Buscar la orden validando también el token
    const order = await prisma.order.findFirst({
      where: {
        orderNumber,
        storeId: store.id,
        accessToken,
      },
      include: {
        customer: true,
        items: {
          include: {
            storeProduct: {
              include: {
                masterProduct: true,
              },
            },
            measurementUnit: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Pedido no encontrado o token inválido" },
        { status: 404 }
      );
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("Error fetching order:", error);
    return NextResponse.json(
      { error: "Error al obtener el pedido" },
      { status: 500 }
    );
  }
}
