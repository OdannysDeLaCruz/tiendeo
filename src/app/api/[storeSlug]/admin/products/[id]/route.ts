import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ storeSlug: string; id: string }> }
) {
  try {
    const session = await auth();
    const { storeSlug, id } = await params;

    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener la tienda
    const store = await prisma.store.findUnique({
      where: { slug: storeSlug },
    });

    if (!store) {
      return NextResponse.json(
        { error: "Tienda no encontrada" },
        { status: 404 }
      );
    }

    // Verificar que el usuario pertenece a esta tienda
    if (session.user.role === "STORE_OWNER" && session.user.storeId !== store.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // Obtener el producto
    const product = await prisma.storeProduct.findUnique({
      where: { id },
      include: {
        masterProduct: {
          include: {
            category: true,
            productMeasurements: {
              include: {
                measurementUnit: true,
              },
              orderBy: {
                measurementUnit: {
                  name: "asc",
                },
              },
            },
          },
        },
        prices: {
          include: {
            measurementUnit: true,
          },
          orderBy: {
            measurementUnit: {
              name: "asc",
            },
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    // Verificar que el producto pertenece a esta tienda
    if (product.storeId !== store.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ storeSlug: string; id: string }> }
) {
  try {
    const session = await auth();
    const { storeSlug, id } = await params;
    const body = await request.json();

    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener la tienda
    const store = await prisma.store.findUnique({
      where: { slug: storeSlug },
    });

    if (!store) {
      return NextResponse.json(
        { error: "Tienda no encontrada" },
        { status: 404 }
      );
    }

    // Verificar que el usuario pertenece a esta tienda
    if (session.user.role === "STORE_OWNER" && session.user.storeId !== store.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // Verificar que el producto pertenece a esta tienda
    const product = await prisma.storeProduct.findUnique({
      where: { id },
    });

    if (!product || product.storeId !== store.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // Actualizar producto
    const updatedProduct = await prisma.storeProduct.update({
      where: { id },
      data: {
        isAvailable: body.isAvailable,
        price: body.price,
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ storeSlug: string; id: string }> }
) {
  try {
    const session = await auth();
    const { storeSlug, id } = await params;

    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener la tienda
    const store = await prisma.store.findUnique({
      where: { slug: storeSlug },
    });

    if (!store) {
      return NextResponse.json(
        { error: "Tienda no encontrada" },
        { status: 404 }
      );
    }

    // Verificar que el usuario pertenece a esta tienda
    if (session.user.role === "STORE_OWNER" && session.user.storeId !== store.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // Verificar que el producto pertenece a esta tienda
    const product = await prisma.storeProduct.findUnique({
      where: { id },
    });

    if (!product || product.storeId !== store.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // Eliminar producto (esto también eliminará los precios por CASCADE)
    await prisma.storeProduct.delete({
      where: { id },
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
