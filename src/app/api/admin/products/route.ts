import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isSuperadmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { uploadImage } from "@/lib/cloudinary";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !isSuperadmin(session)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");
    const isActiveParam = searchParams.get("isActive");

    // Construir filtros dinámicos
    const where: { categoryId?: string; isActive?: boolean } = {};

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (isActiveParam !== null) {
      where.isActive = isActiveParam === "true";
    }

    const products = await prisma.masterProduct.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        category: true,
        productMeasurements: {
          include: {
            measurementUnit: true,
          },
        },
        _count: {
          select: {
            storeProducts: true,
          },
        },
      },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Error al obtener los productos" },
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
    const { name, slug, description, categoryId, imageUrl } =
      body;

    if (!name || !slug || !categoryId) {
      return NextResponse.json(
        { error: "Nombre, slug y categoría son requeridos" },
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

    // Verificar que la categoría existe
    const category = await prisma.masterCategory.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return NextResponse.json(
        { error: "La categoría no existe" },
        { status: 400 }
      );
    }

    // Verificar que el nombre no exista
    const existingByName = await prisma.masterProduct.findFirst({
      where: { name },
    });

    if (existingByName) {
      return NextResponse.json(
        { error: "Ya existe un producto con ese nombre" },
        { status: 400 }
      );
    }

    // Verificar que el slug no exista
    const existingBySlug = await prisma.masterProduct.findUnique({
      where: { slug },
    });

    if (existingBySlug) {
      return NextResponse.json(
        { error: "Ya existe un producto con ese slug" },
        { status: 400 }
      );
    }

    // Subir imagen a Cloudinary si existe
    let uploadedImageUrl = '';
    if (imageUrl && imageUrl.startsWith("data:")) {
      uploadedImageUrl = await uploadImage(imageUrl);
    }

    // Crear el producto
    const product = await prisma.masterProduct.create({
      data: {
        name,
        slug,
        description: description || null,
        categoryId,
        imageUrl: uploadedImageUrl,
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Error al crear el producto" },
      { status: 500 }
    );
  }
}
