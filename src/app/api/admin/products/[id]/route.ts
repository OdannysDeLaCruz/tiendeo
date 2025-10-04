import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isSuperadmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { uploadImage, deleteImage } from "@/lib/cloudinary";

// GET - Obtener un producto específico
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

    const product = await prisma.masterProduct.findUnique({
      where: { id },
      include: {
        category: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: "Error al obtener el producto" },
      { status: 500 }
    );
  }
}

// PATCH - Actualizar producto
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
    const { name, slug, description, categoryId, imageUrl } = body;

    // Validar que el producto existe
    const product = await prisma.masterProduct.findUnique({
      where: { id },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    // Si se está cambiando el nombre, verificar que no exista
    if (name && name !== product.name) {
      const existingByName = await prisma.masterProduct.findFirst({
        where: { name },
      });

      if (existingByName) {
        return NextResponse.json(
          { error: "Ya existe un producto con ese nombre" },
          { status: 400 }
        );
      }
    }

    // Si se está cambiando el slug, verificar que no exista
    if (slug && slug !== product.slug) {
      const existingBySlug = await prisma.masterProduct.findUnique({
        where: { slug },
      });

      if (existingBySlug) {
        return NextResponse.json(
          { error: "Ya existe un producto con ese slug" },
          { status: 400 }
        );
      }
    }

    // Si se está cambiando la categoría, verificar que existe
    if (categoryId && categoryId !== product.categoryId) {
      const category = await prisma.masterCategory.findUnique({
        where: { id: categoryId },
      });

      if (!category) {
        return NextResponse.json(
          { error: "La categoría no existe" },
          { status: 400 }
        );
      }
    }

    // Manejar cambio de imagen
    let uploadedImageUrl = product.imageUrl;
    if (imageUrl !== undefined) {
      if (imageUrl === null) {
        // Eliminar imagen actual
        if (product.imageUrl) {
          await deleteImage(product.imageUrl);
        }
        uploadedImageUrl = "";
      } else if (imageUrl.startsWith("data:")) {
        // Subir nueva imagen
        // Eliminar imagen anterior si existe
        if (product.imageUrl) {
          await deleteImage(product.imageUrl);
        }
        uploadedImageUrl = await uploadImage(imageUrl);
      }
      // Si imageUrl es una URL normal (no base64), mantenerla
    }

    // Actualizar producto
    const updatedProduct = await prisma.masterProduct.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(slug && { slug }),
        ...(description !== undefined && { description }),
        ...(categoryId && { categoryId }),
        ...(imageUrl !== undefined && { imageUrl: uploadedImageUrl }),
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { error: "Error al actualizar el producto" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar producto (soft delete con isActive)
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

    // Verificar que el producto existe y contar productos de tienda asociados
    const product = await prisma.masterProduct.findUnique({
      where: { id },
      include: {
        _count: {
          select: { storeProducts: true },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    // Verificar si el producto está siendo usado en alguna tienda
    if (product._count.storeProducts > 0) {
      return NextResponse.json(
        {
          error: `No se puede eliminar el producto porque está siendo usado en ${product._count.storeProducts} tienda(s)`,
        },
        { status: 400 }
      );
    }

    // Soft delete: cambiar isActive a false (solo si no está en uso)
    await prisma.masterProduct.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { error: "Error al eliminar el producto" },
      { status: 500 }
    );
  }
}
