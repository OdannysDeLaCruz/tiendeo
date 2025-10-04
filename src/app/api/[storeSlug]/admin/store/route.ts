import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isStoreOwner } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export async function GET(
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

    const store = await prisma.store.findUnique({
      where: { id: session.user.storeId! },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });

    if (!store) {
      return NextResponse.json(
        { error: "Tienda no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(store);
  } catch (error) {
    console.error("Error fetching store:", error);
    return NextResponse.json(
      { error: "Error al obtener la tienda" },
      { status: 500 }
    );
  }
}

export async function PATCH(
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
    const { name } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "El nombre es requerido" },
        { status: 400 }
      );
    }

    // Actualizar el nombre de la tienda
    const updatedStore = await prisma.store.update({
      where: { id: session.user.storeId! },
      data: { name: name.trim() },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });

    return NextResponse.json(updatedStore);
  } catch (error) {
    console.error("Error updating store:", error);
    return NextResponse.json(
      { error: "Error al actualizar la tienda" },
      { status: 500 }
    );
  }
}
