import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isSuperadmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// GET - Obtener una tienda específica
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

    const store = await prisma.store.findUnique({
      where: { id },
      include: {
        storeUsers: {
          where: { role: "OWNER" },
          select: { email: true },
          take: 1,
        },
      },
    });

    if (!store) {
      return NextResponse.json(
        { error: "Tienda no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...store,
      ownerEmail: store.storeUsers[0]?.email || null,
    });
  } catch (error) {
    console.error("Error fetching store:", error);
    return NextResponse.json(
      { error: "Error al obtener la tienda" },
      { status: 500 }
    );
  }
}

// PATCH - Actualizar tienda (activar/desactivar o editar)
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
    const { isActive, name, slug, email, password } = body;

    // Validar que la tienda existe
    const store = await prisma.store.findUnique({
      where: { id },
    });

    if (!store) {
      return NextResponse.json(
        { error: "Tienda no encontrada" },
        { status: 404 }
      );
    }

    // Si se está cambiando el slug, verificar que no exista
    if (slug && slug !== store.slug) {
      const existingStore = await prisma.store.findUnique({
        where: { slug },
      });

      if (existingStore) {
        return NextResponse.json(
          { error: "Ya existe una tienda con ese slug" },
          { status: 400 }
        );
      }
    }

    // Validar contraseña si se proporciona
    if (password && password.length < 6) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 6 caracteres" },
        { status: 400 }
      );
    }

    // Actualizar tienda y credenciales en una transacción
    const result = await prisma.$transaction(async (tx) => {
      // Actualizar tienda
      const updatedStore = await tx.store.update({
        where: { id },
        data: {
          ...(isActive !== undefined && { isActive }),
          ...(name && { name }),
          ...(slug && { slug }),
        },
      });

      // Actualizar credenciales si se proporcionan
      if (email || password) {
        // Buscar el usuario OWNER de la tienda
        const owner = await tx.storeUser.findFirst({
          where: {
            storeId: id,
            role: "OWNER",
          },
        });

        if (owner) {
          const updateData: any = {};
          if (email) {
            updateData.email = email;
          }
          if (password) {
            updateData.password = await bcrypt.hash(password, 10);
          }

          await tx.storeUser.update({
            where: { id: owner.id },
            data: updateData,
          });
        }
      }

      return updatedStore;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error updating store:", error);
    return NextResponse.json(
      { error: "Error al actualizar la tienda" },
      { status: 500 }
    );
  }
}
