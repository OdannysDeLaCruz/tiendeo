import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ storeSlug: string }> }
) {
  try {
    const { storeSlug } = await params;

    // Obtener la tienda
    const store = await prisma.store.findUnique({
      where: { slug: storeSlug },
    });

    if (!store || !store.isActive) {
      return NextResponse.json(
        { error: "Tienda no encontrada" },
        { status: 404 }
      );
    }

    // Obtener todas las categorías con sus productos disponibles
    const categories = await prisma.masterCategory.findMany({
      include: {
        masterProducts: {
          where: {
            isActive: true,
            storeProducts: {
              some: {
                storeId: store.id,
                isAvailable: true,
              },
            },
          },
          include: {
            category: {
              select: {
                id: true,
                name: true,
              },
            },
            productMeasurements: {
              include: {
                measurementUnit: true,
              },
            },
            storeProducts: {
              where: {
                storeId: store.id,
                isAvailable: true,
              },
              include: {
                prices: {
                  where: {
                    isActive: true,
                  },
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
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    // Transformar los datos para facilitar el uso en el frontend
    const categoriesWithProducts = categories
      .map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        imageUrl: category.imageUrl,
        products: category.masterProducts
          .filter((product) => product.storeProducts.length > 0)
          .map((product) => {
            const storeProduct = product.storeProducts[0];

            // Enriquecer los precios con información de ProductMeasurement
            const enrichedPrices = storeProduct.prices.map((price) => {
              const measurement = product.productMeasurements.find(
                (pm) => pm.measurementUnitId === price.measurementUnitId
              );
              return {
                ...price,
                minQuantity: measurement?.minQuantity || 1,
                stepQuantity: measurement?.stepQuantity || 1,
              };
            });

            return {
              id: storeProduct.id,
              isAvailable: storeProduct.isAvailable,
              prices: enrichedPrices,
              masterProduct: {
                id: product.id,
                name: product.name,
                description: product.description,
                imageUrl: product.imageUrl,
                category: product.category,
              },
            };
          }),
      }))
      .filter((category) => category.products.length > 0); // Solo categorías con productos

    return NextResponse.json(categoriesWithProducts);
  } catch (error) {
    console.error("Error fetching store products:", error);
    return NextResponse.json(
      { error: "Error al obtener los productos" },
      { status: 500 }
    );
  }
}
