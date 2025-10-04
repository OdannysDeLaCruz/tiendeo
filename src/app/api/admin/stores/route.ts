import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isSuperadmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const session = await auth();
    if (!session || !isSuperadmin(session)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const stores = await prisma.store.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
      },
    });

    return NextResponse.json(stores);
  } catch (error) {
    console.error("Error fetching stores:", error);
    return NextResponse.json(
      { error: "Error al obtener las tiendas" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await auth();
    if (!session || !isSuperadmin(session)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { name, slug, email, password } = body;

    // Validaciones
    if (!name || !slug) {
      return NextResponse.json(
        { error: "Nombre y slug son requeridos" },
        { status: 400 }
      );
    }

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email y contraseña son requeridos" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 6 caracteres" },
        { status: 400 }
      );
    }

    // Validar formato del slug
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json(
        {
          error:
            "El slug solo puede contener letras minúsculas, números y guiones",
        },
        { status: 400 }
      );
    }

    // Verificar que el slug no exista
    const existingStore = await prisma.store.findUnique({
      where: { slug },
    });

    if (existingStore) {
      return NextResponse.json(
        { error: "Ya existe una tienda con ese slug" },
        { status: 400 }
      );
    }

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear la tienda y el usuario en una transacción
    const result = await prisma.$transaction(async (tx) => {
      // Crear la tienda
      const store = await tx.store.create({
        data: {
          name,
          slug,
          isActive: true,
        },
      });

      // Crear el usuario administrador de la tienda
      const storeUser = await tx.storeUser.create({
        data: {
          storeId: store.id,
          email,
          password: hashedPassword,
          name: "Administrador",
          role: "OWNER",
          isActive: true,
        },
      });

      return { store, storeUser };
    });

    return NextResponse.json(
      {
        store: result.store,
        message: "Tienda creada exitosamente con usuario administrador",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating store:", error);
    return NextResponse.json(
      { error: "Error al crear la tienda" },
      { status: 500 }
    );
  }
}
