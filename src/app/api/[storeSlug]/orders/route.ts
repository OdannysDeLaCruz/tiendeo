import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ storeSlug: string }> }
) {
  try {
    const { storeSlug } = await params;
    const body = await request.json();

    const { customer, deliveryType, notes, items } = body;

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

    // Validar que hay items
    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: "El pedido debe tener al menos un producto" },
        { status: 400 }
      );
    }

    // Buscar o crear el cliente por teléfono
    let customerRecord = await prisma.customer.findFirst({
      where: {
        phone: customer.phone,
        storeId: store.id,
      },
    });

    if (!customerRecord) {
      customerRecord = await prisma.customer.create({
        data: {
          name: customer.name,
          phone: customer.phone,
          address: customer.address,
          storeId: store.id,
        },
      });
    } else {
      // Actualizar información del cliente si ha cambiado
      customerRecord = await prisma.customer.update({
        where: { id: customerRecord.id },
        data: {
          name: customer.name,
          address: customer.address || customerRecord.address,
        },
      });
    }

    // Generar número de orden único
    const lastOrder = await prisma.order.findFirst({
      where: { storeId: store.id },
      orderBy: { orderNumber: "desc" },
    });

    const orderNumber = lastOrder
      ? String(Number(lastOrder.orderNumber) + 1).padStart(6, "0")
      : "000001";

    // Calcular el total
    const total = items.reduce(
      (sum: number, item: any) => sum + Number(item.price) * item.quantity,
      0
    );

    // Crear la orden con sus items
    const order = await prisma.order.create({
      data: {
        orderNumber,
        storeId: store.id,
        customerId: customerRecord.id,
        status: "PENDING",
        deliveryType,
        notes,
        total,
        items: {
          create: items.map((item: any) => ({
            storeProductId: item.storeProductId,
            measurementUnitId: item.measurementUnitId,
            quantity: item.quantity,
            price: item.price,
            subtotal: Number(item.price) * item.quantity,
          })),
        },
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

    return NextResponse.json({
      orderNumber: order.orderNumber,
      accessToken: order.accessToken,
      total: order.total,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { error: "Error al crear el pedido" },
      { status: 500 }
    );
  }
}
