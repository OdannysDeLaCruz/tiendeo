import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isSuperadmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { uploadImage } from "@/lib/cloudinary";

// GET - Obtener una categoría específica
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

    const category = await prisma.masterCategory.findUnique({
      where: { id },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Categoría no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error("Error fetching category:", error);
    return NextResponse.json(
      { error: "Error al obtener la categoría" },
      { status: 500 }
    );
  }
}

// PATCH - Actualizar categoría
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
    const { name, slug, imageUrl, displayOrder } = body;

    // Validar que la categoría existe
    const category = await prisma.masterCategory.findUnique({
      where: { id },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Categoría no encontrada" },
        { status: 404 }
      );
    }

    // Si se está cambiando el nombre, verificar que no exista
    if (name && name !== category.name) {
      const existingByName = await prisma.masterCategory.findUnique({
        where: { name },
      });

      if (existingByName) {
        return NextResponse.json(
          { error: "Ya existe una categoría con ese nombre" },
          { status: 400 }
        );
      }
    }

    // Si se está cambiando el slug, verificar que no exista
    if (slug && slug !== category.slug) {
      const existingBySlug = await prisma.masterCategory.findUnique({
        where: { slug },
      });

      if (existingBySlug) {
        return NextResponse.json(
          { error: "Ya existe una categoría con ese slug" },
          { status: 400 }
        );
      }
    }

    // Subir imagen a Cloudinary si es base64
    let finalImageUrl: string | undefined = undefined;
    if (imageUrl !== undefined) {
      if (imageUrl && imageUrl.startsWith("data:")) {
        finalImageUrl = await uploadImage(imageUrl);
      } else if (imageUrl) {
        finalImageUrl = imageUrl;
      } else {
        finalImageUrl = "";
      }
    }

    // Actualizar categoría
    const updatedCategory = await prisma.masterCategory.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(slug && { slug }),
        ...(finalImageUrl !== undefined && { imageUrl: finalImageUrl }),
        ...(displayOrder !== undefined && { displayOrder }),
      },
    });

    return NextResponse.json(updatedCategory);
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json(
      { error: "Error al actualizar la categoría" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar categoría
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

    // Verificar si tiene productos asociados
    const category = await prisma.masterCategory.findUnique({
      where: { id },
      include: {
        _count: {
          select: { masterProducts: true },
        },
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Categoría no encontrada" },
        { status: 404 }
      );
    }

    if (category._count.masterProducts > 0) {
      return NextResponse.json(
        {
          error: `No se puede eliminar la categoría porque tiene ${category._count.masterProducts} producto(s) asociado(s)`,
        },
        { status: 400 }
      );
    }

    // Eliminar categoría
    await prisma.masterCategory.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json(
      { error: "Error al eliminar la categoría" },
      { status: 500 }
    );
  }
}
