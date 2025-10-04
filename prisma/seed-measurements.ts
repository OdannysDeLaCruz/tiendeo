import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seedMeasurements() {
  console.log("🌱 Seeding measurement units...");

  // Crear unidades de medida básicas
  const units = [
    {
      name: "Unidad",
      abbreviation: "un",
      type: "UNIT",
      baseUnit: null,
      conversionFactor: null,
    },
    {
      name: "Gramo",
      abbreviation: "g",
      type: "WEIGHT",
      baseUnit: "g",
      conversionFactor: 1,
    },
    {
      name: "Libra",
      abbreviation: "lb",
      type: "WEIGHT",
      baseUnit: "g",
      conversionFactor: 453.592, // 1 libra = 453.592 gramos
    },
    {
      name: "Kilogramo",
      abbreviation: "kg",
      type: "WEIGHT",
      baseUnit: "g",
      conversionFactor: 1000, // 1 kg = 1000 gramos
    },
    {
      name: "Onza",
      abbreviation: "oz",
      type: "WEIGHT",
      baseUnit: "g",
      conversionFactor: 28.3495, // 1 onza = 28.3495 gramos
    },
  ];

  for (const unit of units) {
    await prisma.measurementUnit.upsert({
      where: { abbreviation: unit.abbreviation },
      update: {},
      create: unit,
    });
    console.log(`  ✅ Created/Updated: ${unit.name} (${unit.abbreviation})`);
  }

  console.log("✅ Measurement units seeded!");
}

seedMeasurements()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
