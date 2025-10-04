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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    // Construir filtros
    const where: any = {
      storeId: session.user.storeId,
    };

    if (status && status !== "all") {
      where.status = status;
    }

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        customer: {
          select: {
            name: true,
            phone: true,
            address: true,
          },
        },
        items: {
          include: {
            storeProduct: {
              include: {
                masterProduct: {
                  select: {
                    name: true,
                    imageUrl: true,
                  },
                },
              },
            },
            measurementUnit: {
              select: {
                name: true,
                abbreviation: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Error al obtener los pedidos" },
      { status: 500 }
    );
  }
}
