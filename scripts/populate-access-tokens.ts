import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const orders = await prisma.order.findMany({
    where: {
      accessToken: "",
    },
  });

  console.log(`Encontrados ${orders.length} pedidos sin accessToken`);

  for (const order of orders) {
    const accessToken = `${order.id}-${Date.now()}`; // Generar token único
    await prisma.order.update({
      where: { id: order.id },
      data: { accessToken },
    });
    console.log(`Actualizado pedido #${order.orderNumber} con token`);
  }

  console.log("¡Todos los tokens han sido generados!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
