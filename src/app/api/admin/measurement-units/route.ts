import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isSuperadmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

// GET - Listar todas las unidades de medida
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !isSuperadmin(session)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const units = await prisma.measurementUnit.findMany({
      orderBy: [{ type: "asc" }, { name: "asc" }],
    });

    return NextResponse.json(units);
  } catch (error) {
    console.error("Error fetching measurement units:", error);
    return NextResponse.json(
      { error: "Error al obtener las unidades de medida" },
      { status: 500 }
    );
  }
}

// POST - Crear nueva unidad de medida
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !isSuperadmin(session)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { name, abbreviation, type, baseUnit, conversionFactor } = body;

    // Validaciones
    if (!name || !abbreviation || !type) {
      return NextResponse.json(
        { error: "Nombre, abreviación y tipo son requeridos" },
        { status: 400 }
      );
    }

    if (!["UNIT", "WEIGHT"].includes(type)) {
      return NextResponse.json(
        { error: "Tipo debe ser UNIT o WEIGHT" },
        { status: 400 }
      );
    }

    // Verificar que no exista
    const existingByName = await prisma.measurementUnit.findUnique({
      where: { name },
    });

    if (existingByName) {
      return NextResponse.json(
        { error: "Ya existe una unidad con ese nombre" },
        { status: 400 }
      );
    }

    const existingByAbbr = await prisma.measurementUnit.findUnique({
      where: { abbreviation },
    });

    if (existingByAbbr) {
      return NextResponse.json(
        { error: "Ya existe una unidad con esa abreviación" },
        { status: 400 }
      );
    }

    // Crear unidad
    const unit = await prisma.measurementUnit.create({
      data: {
        name,
        abbreviation,
        type,
        baseUnit: baseUnit || null,
        conversionFactor: conversionFactor ? parseFloat(conversionFactor) : null,
      },
    });

    return NextResponse.json(unit, { status: 201 });
  } catch (error) {
    console.error("Error creating measurement unit:", error);
    return NextResponse.json(
      { error: "Error al crear la unidad de medida" },
      { status: 500 }
    );
  }
}
