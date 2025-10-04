import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isSuperadmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

// GET - Obtener una unidad específica
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

    const unit = await prisma.measurementUnit.findUnique({
      where: { id },
    });

    if (!unit) {
      return NextResponse.json(
        { error: "Unidad de medida no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(unit);
  } catch (error) {
    console.error("Error fetching measurement unit:", error);
    return NextResponse.json(
      { error: "Error al obtener la unidad de medida" },
      { status: 500 }
    );
  }
}

// PATCH - Actualizar unidad de medida
export async function PATCH(
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
    const { name, abbreviation, type, baseUnit, conversionFactor, isActive } =
      body;

    // Verificar que existe
    const unit = await prisma.measurementUnit.findUnique({
      where: { id },
    });

    if (!unit) {
      return NextResponse.json(
        { error: "Unidad de medida no encontrada" },
        { status: 404 }
      );
    }

    // Validar tipo si se está cambiando
    if (type && !["UNIT", "WEIGHT"].includes(type)) {
      return NextResponse.json(
        { error: "Tipo debe ser UNIT o WEIGHT" },
        { status: 400 }
      );
    }

    // Verificar unicidad de nombre si se está cambiando
    if (name && name !== unit.name) {
      const existingByName = await prisma.measurementUnit.findUnique({
        where: { name },
      });

      if (existingByName) {
        return NextResponse.json(
          { error: "Ya existe una unidad con ese nombre" },
          { status: 400 }
        );
      }
    }

    // Verificar unicidad de abreviación si se está cambiando
    if (abbreviation && abbreviation !== unit.abbreviation) {
      const existingByAbbr = await prisma.measurementUnit.findUnique({
        where: { abbreviation },
      });

      if (existingByAbbr) {
        return NextResponse.json(
          { error: "Ya existe una unidad con esa abreviación" },
          { status: 400 }
        );
      }
    }

    // Actualizar unidad
    const updatedUnit = await prisma.measurementUnit.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(abbreviation && { abbreviation }),
        ...(type && { type }),
        ...(baseUnit !== undefined && { baseUnit: baseUnit || null }),
        ...(conversionFactor !== undefined && {
          conversionFactor: conversionFactor ? parseFloat(conversionFactor) : null,
        }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json(updatedUnit);
  } catch (error) {
    console.error("Error updating measurement unit:", error);
    return NextResponse.json(
      { error: "Error al actualizar la unidad de medida" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar unidad de medida
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || !isSuperadmin(session)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;

    // Verificar si está en uso
    const inUse = await prisma.productMeasurement.findFirst({
      where: { measurementUnitId: id },
    });

    if (inUse) {
      return NextResponse.json(
        {
          error:
            "No se puede eliminar la unidad porque está siendo usada en productos",
        },
        { status: 400 }
      );
    }

    // Eliminar unidad
    await prisma.measurementUnit.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting measurement unit:", error);
    return NextResponse.json(
      { error: "Error al eliminar la unidad de medida" },
      { status: 500 }
    );
  }
}
