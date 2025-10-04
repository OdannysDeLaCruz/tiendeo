import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isSuperadmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

// PATCH - Actualizar configuración de medida
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; measurementId: string }> }
) {
  try {
    const session = await auth();
    if (!session || !isSuperadmin(session)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id, measurementId } = await params;
    const body = await request.json();
    const { isDefault, minQuantity, stepQuantity } = body;

    // Verificar que existe
    const measurement = await prisma.productMeasurement.findUnique({
      where: { id: measurementId },
    });

    if (!measurement) {
      return NextResponse.json(
        { error: "Configuración no encontrada" },
        { status: 404 }
      );
    }

    // Si es default, quitar default de las demás
    if (isDefault) {
      await prisma.productMeasurement.updateMany({
        where: {
          masterProductId: id,
          isDefault: true,
          id: { not: measurementId },
        },
        data: { isDefault: false },
      });
    }

    // Actualizar
    const updated = await prisma.productMeasurement.update({
      where: { id: measurementId },
      data: {
        ...(isDefault !== undefined && { isDefault }),
        ...(minQuantity !== undefined && {
          minQuantity: minQuantity ? parseFloat(minQuantity) : null,
        }),
        ...(stepQuantity !== undefined && {
          stepQuantity: stepQuantity ? parseFloat(stepQuantity) : null,
        }),
      },
      include: {
        measurementUnit: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating product measurement:", error);
    return NextResponse.json(
      { error: "Error al actualizar la configuración" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar unidad de medida de producto
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; measurementId: string }> }
) {
  try {
    const session = await auth();
    if (!session || !isSuperadmin(session)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id, measurementId } = await params;

    // Verificar que existe
    const measurement = await prisma.productMeasurement.findUnique({
      where: { id: measurementId },
      include: {
        masterProduct: true,
      },
    });

    if (!measurement) {
      return NextResponse.json(
        { error: "Configuración no encontrada" },
        { status: 404 }
      );
    }

    // Verificar si está en uso en tiendas activas para este producto específico
    const activeStoreProductsWithThisMeasurement = await prisma.storeProduct.findMany({
      where: {
        masterProductId: id,
      },
      include: {
        prices: {
          where: {
            measurementUnitId: measurement.measurementUnitId,
          },
        },
        store: true,
      },
    });

    // Filtrar solo las tiendas que tienen el producto activo
    const activeStoresUsingIt = activeStoreProductsWithThisMeasurement.filter(
      (sp) => sp.prices.length > 0
    );

    if (activeStoresUsingIt.length > 0) {
      // Contar cuántos precios hay en total
      const totalPrices = activeStoresUsingIt.reduce(
        (acc, sp) => acc + sp.prices.length,
        0
      );

      // Listar las tiendas
      const storeNames = activeStoresUsingIt
        .map((sp) => sp.store.name)
        .join(", ");

      return NextResponse.json(
        {
          error: `No se puede eliminar porque ${activeStoresUsingIt.length} tienda(s) tienen este producto con precios configurados para esta unidad de medida. Tiendas: ${storeNames}. Total de precios: ${totalPrices}. El tendero debe eliminar primero el producto de su tienda.`,
        },
        { status: 400 }
      );
    }

    // Si no hay productos activos usando esta medida, eliminar el ProductMeasurement
    // Esto también limpiará cualquier precio huérfano que pueda existir
    await prisma.productMeasurement.delete({
      where: { id: measurementId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting product measurement:", error);
    return NextResponse.json(
      { error: "Error al eliminar la configuración" },
      { status: 500 }
    );
  }
}
