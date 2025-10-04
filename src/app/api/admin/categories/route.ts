import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isSuperadmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { uploadImage } from "@/lib/cloudinary";

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const categories = await prisma.masterCategory.findMany({
      orderBy: { displayOrder: "asc" },
      include: {
        _count: {
          select: {
            masterProducts: true,
          },
        },
      },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Error al obtener las categorías" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !isSuperadmin(session)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { name, slug, imageUrl, displayOrder } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { error: "Nombre y slug son requeridos" },
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

    // Verificar que el nombre no exista
    const existingByName = await prisma.masterCategory.findUnique({
      where: { name },
    });

    if (existingByName) {
      return NextResponse.json(
        { error: "Ya existe una categoría con ese nombre" },
        { status: 400 }
      );
    }

    // Verificar que el slug no exista
    const existingBySlug = await prisma.masterCategory.findUnique({
      where: { slug },
    });

    if (existingBySlug) {
      return NextResponse.json(
        { error: "Ya existe una categoría con ese slug" },
        { status: 400 }
      );
    }

    // Subir imagen a Cloudinary si existe
    let uploadedImageUrl = "";
    if (imageUrl && imageUrl.startsWith("data:")) {
      uploadedImageUrl = await uploadImage(imageUrl);
    }

    // Crear la categoría
    const category = await prisma.masterCategory.create({
      data: {
        name,
        slug,
        imageUrl: uploadedImageUrl,
        displayOrder: displayOrder || 0,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { error: "Error al crear la categoría" },
      { status: 500 }
    );
  }
}
