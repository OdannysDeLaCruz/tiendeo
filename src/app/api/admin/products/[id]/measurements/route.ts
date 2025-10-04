import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isSuperadmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

// GET - Obtener medidas configuradas de un producto
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || !isSuperadmin(session)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;

    const measurements = await prisma.productMeasurement.findMany({
      where: { masterProductId: id },
      include: {
        measurementUnit: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(measurements);
  } catch (error) {
    console.error("Error fetching product measurements:", error);
    return NextResponse.json(
      { error: "Error al obtener las medidas del producto" },
      { status: 500 }
    );
  }
}

// POST - Agregar unidad de medida a producto
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || !isSuperadmin(session)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { measurementUnitId, isDefault, minQuantity, stepQuantity } = body;

    if (!measurementUnitId) {
      return NextResponse.json(
        { error: "Unidad de medida es requerida" },
        { status: 400 }
      );
    }

    // Verificar que el producto existe
    const product = await prisma.masterProduct.findUnique({
      where: { id },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    // Verificar que la unidad existe
    const unit = await prisma.measurementUnit.findUnique({
      where: { id: measurementUnitId },
    });

    if (!unit) {
      return NextResponse.json(
        { error: "Unidad de medida no encontrada" },
        { status: 404 }
      );
    }

    // Verificar que no existe ya
    const existing = await prisma.productMeasurement.findUnique({
      where: {
        masterProductId_measurementUnitId: {
          masterProductId: id,
          measurementUnitId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Esta unidad ya está agregada al producto" },
        { status: 400 }
      );
    }

    // Si es default, quitar default de las demás
    if (isDefault) {
      await prisma.productMeasurement.updateMany({
        where: { masterProductId: id, isDefault: true },
        data: { isDefault: false },
      });
    }

    // Crear medida
    const measurement = await prisma.productMeasurement.create({
      data: {
        masterProductId: id,
        measurementUnitId,
        isDefault: isDefault || false,
        minQuantity: minQuantity ? parseFloat(minQuantity) : null,
        stepQuantity: stepQuantity ? parseFloat(stepQuantity) : null,
      },
      include: {
        measurementUnit: true,
      },
    });

    return NextResponse.json(measurement, { status: 201 });
  } catch (error) {
    console.error("Error adding product measurement:", error);
    return NextResponse.json(
      { error: "Error al agregar la medida al producto" },
      { status: 500 }
    );
  }
}
