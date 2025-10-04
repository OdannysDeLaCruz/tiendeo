import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isSuperadmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !isSuperadmin(session)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get("storeId");

    // Construir filtros dinámicos
    const where: any = {};

    if (storeId) {
      where.storeId = storeId;
    }

    // Obtener estadísticas
    const [totalOrders, orders, pendingOrders, completedOrders] =
      await Promise.all([
        prisma.order.count({ where }),
        prisma.order.findMany({
          where,
          select: {
            total: true,
          },
        }),
        prisma.order.count({
          where: {
            ...where,
            status: { in: ["PENDING", "CONFIRMED", "PREPARING"] },
          },
        }),
        prisma.order.count({
          where: {
            ...where,
            status: "COMPLETED",
          },
        }),
      ]);

    // Calcular ingresos totales
    const totalRevenue = orders.reduce(
      (sum, order) => sum + Number(order.total),
      0
    );

    const stats = {
      totalOrders,
      totalRevenue,
      pendingOrders,
      completedOrders,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching order stats:", error);
    return NextResponse.json(
      { error: "Error al obtener las estadísticas" },
      { status: 500 }
    );
  }
}
