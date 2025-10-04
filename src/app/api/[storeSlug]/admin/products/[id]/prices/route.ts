import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ storeSlug: string; id: string }> }
) {
  try {
    const session = await auth();
    const { storeSlug, id } = await params;
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

    // Validar datos
    if (!body.measurementUnitId || !body.price || body.price <= 0) {
      return NextResponse.json(
        { error: "Datos inválidos" },
        { status: 400 }
      );
    }

    // Verificar que no exista ya un precio para esta unidad
    const existingPrice = await prisma.storeProductPrice.findUnique({
      where: {
        storeProductId_measurementUnitId: {
          storeProductId: id,
          measurementUnitId: body.measurementUnitId,
        },
      },
    });

    if (existingPrice) {
      return NextResponse.json(
        { error: "Ya existe un precio para esta unidad de medida" },
        { status: 400 }
      );
    }

    // Crear nuevo precio
    const newPrice = await prisma.storeProductPrice.create({
      data: {
        storeProductId: id,
        measurementUnitId: body.measurementUnitId,
        price: body.price,
        isActive: true,
      },
      include: {
        measurementUnit: true,
      },
    });

    return NextResponse.json(newPrice);
  } catch (error) {
    console.error("Error creating price:", error);
    return NextResponse.json(
      { error: "Error al crear el precio" },
      { status: 500 }
    );
  }
}
