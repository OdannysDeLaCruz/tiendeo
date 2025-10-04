import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');

  // 1. Crear Superadmin
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const superadmin = await prisma.user.upsert({
    where: { email: 'admin@tiendeo.com' },
    update: {},
    create: {
      email: 'admin@tiendeo.com',
      password: hashedPassword,
      name: 'Super Admin',
      role: 'SUPERADMIN',
    },
  });
  console.log('✅ Superadmin creado:', superadmin.email);

  // 2. Crear Categorías Maestras
  const categories = [
    { name: 'Frutas', slug: 'frutas', displayOrder: 1 },
    { name: 'Verduras', slug: 'verduras', displayOrder: 2 },
    { name: 'Carnes', slug: 'carnes', displayOrder: 3 },
    { name: 'Lácteos', slug: 'lacteos', displayOrder: 4 },
    { name: 'Postres', slug: 'postres', displayOrder: 5 },
    { name: 'Bebidas', slug: 'bebidas', displayOrder: 6 },
    { name: 'Otros', slug: 'otros', displayOrder: 7 },
  ];

  for (const cat of categories) {
    await prisma.masterCategory.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }
  console.log('✅ Categorías maestras creadas');

  // Obtener IDs de categorías
  const frutasCategory = await prisma.masterCategory.findUnique({ where: { slug: 'frutas' } });
  const verdurasCategory = await prisma.masterCategory.findUnique({ where: { slug: 'verduras' } });
  const carnesCategory = await prisma.masterCategory.findUnique({ where: { slug: 'carnes' } });
  const lacteosCategory = await prisma.masterCategory.findUnique({ where: { slug: 'lacteos' } });
  const bebidasCategory = await prisma.masterCategory.findUnique({ where: { slug: 'bebidas' } });

  // 3. Crear Productos Maestros
  const masterProducts = [
    // Frutas
    {
      name: 'Manzana Roja',
      slug: 'manzana-roja',
      description: 'Manzanas rojas frescas por kilo',
      imageUrl: 'https://res.cloudinary.com/demo/image/upload/v1/products/apple.jpg',
      categoryId: frutasCategory!.id,
    },
    {
      name: 'Plátano',
      slug: 'platano',
      description: 'Plátanos frescos por kilo',
      imageUrl: 'https://res.cloudinary.com/demo/image/upload/v1/products/banana.jpg',
      categoryId: frutasCategory!.id,
    },
    {
      name: 'Naranja',
      slug: 'naranja',
      description: 'Naranjas jugosas por kilo',
      imageUrl: 'https://res.cloudinary.com/demo/image/upload/v1/products/orange.jpg',
      categoryId: frutasCategory!.id,
    },
    // Verduras
    {
      name: 'Tomate',
      slug: 'tomate',
      description: 'Tomates frescos por kilo',
      imageUrl: 'https://res.cloudinary.com/demo/image/upload/v1/products/tomato.jpg',
      categoryId: verdurasCategory!.id,
    },
    {
      name: 'Lechuga',
      slug: 'lechuga',
      description: 'Lechuga fresca por unidad',
      imageUrl: 'https://res.cloudinary.com/demo/image/upload/v1/products/lettuce.jpg',
      categoryId: verdurasCategory!.id,
    },
    {
      name: 'Cebolla',
      slug: 'cebolla',
      description: 'Cebollas frescas por kilo',
      imageUrl: 'https://res.cloudinary.com/demo/image/upload/v1/products/onion.jpg',
      categoryId: verdurasCategory!.id,
    },
    // Carnes
    {
      name: 'Pollo',
      slug: 'pollo',
      description: 'Pechuga de pollo fresca por kilo',
      imageUrl: 'https://res.cloudinary.com/demo/image/upload/v1/products/chicken.jpg',
      categoryId: carnesCategory!.id,
    },
    {
      name: 'Carne de Res',
      slug: 'carne-de-res',
      description: 'Carne de res premium por kilo',
      imageUrl: 'https://res.cloudinary.com/demo/image/upload/v1/products/beef.jpg',
      categoryId: carnesCategory!.id,
    },
    // Lácteos
    {
      name: 'Leche Entera',
      slug: 'leche-entera',
      description: 'Leche entera 1 litro',
      imageUrl: 'https://res.cloudinary.com/demo/image/upload/v1/products/milk.jpg',
      categoryId: lacteosCategory!.id,
    },
    {
      name: 'Queso',
      slug: 'queso',
      description: 'Queso fresco por kilo',
      imageUrl: 'https://res.cloudinary.com/demo/image/upload/v1/products/cheese.jpg',
      categoryId: lacteosCategory!.id,
    },
    // Bebidas
    {
      name: 'Coca Cola 2L',
      slug: 'coca-cola-2l',
      description: 'Coca Cola 2 litros',
      imageUrl: 'https://res.cloudinary.com/demo/image/upload/v1/products/coke.jpg',
      categoryId: bebidasCategory!.id,
    },
    {
      name: 'Agua Mineral',
      slug: 'agua-mineral',
      description: 'Agua mineral 1.5 litros',
      imageUrl: 'https://res.cloudinary.com/demo/image/upload/v1/products/water.jpg',
      categoryId: bebidasCategory!.id,
    },
  ];

  for (const product of masterProducts) {
    await prisma.masterProduct.create({
      data: product,
    });
  }
  console.log('✅ Productos maestros creados');

  // 4. Crear Tienda de Prueba
  const store = await prisma.store.upsert({
    where: { slug: 'tienda-prueba' },
    update: {},
    create: {
      slug: 'tienda-prueba',
      name: 'Tienda de Prueba',
      isActive: true,
    },
  });
  console.log('✅ Tienda de prueba creada:', store.slug);

  // 5. Crear Tendero para la tienda
  const tenderoPassword = await bcrypt.hash('tendero123', 10);
  const tendero = await prisma.storeUser.upsert({
    where: {
      storeId_email: {
        storeId: store.id,
        email: 'tendero@tienda-prueba.com',
      },
    },
    update: {},
    create: {
      storeId: store.id,
      email: 'tendero@tienda-prueba.com',
      password: tenderoPassword,
      name: 'Juan Tendero',
      role: 'OWNER',
    },
  });
  console.log('✅ Tendero creado:', tendero.email);

  // 6. Agregar algunos productos a la tienda de prueba
  const allMasterProducts = await prisma.masterProduct.findMany({ take: 6 });

  for (const masterProduct of allMasterProducts) {
    await prisma.storeProduct.create({
      data: {
        storeId: store.id,
        masterProductId: masterProduct.id,
        price: Math.floor(Math.random() * 5000) + 1000, // Precio aleatorio entre 1000 y 6000
        stock: Math.floor(Math.random() * 50) + 10,
        isAvailable: true,
      },
    });
  }
  console.log('✅ Productos agregados a la tienda de prueba');

  console.log('\n🎉 Seed completado exitosamente!');
  console.log('\n📝 Credenciales de acceso:');
  console.log('─────────────────────────────────────');
  console.log('Superadmin:');
  console.log('  Email: admin@tiendeo.com');
  console.log('  Password: admin123');
  console.log('\nTendero (Tienda Prueba):');
  console.log('  Email: tendero@tienda-prueba.com');
  console.log('  Password: tendero123');
  console.log('  URL: /tienda-prueba/admin');
  console.log('─────────────────────────────────────\n');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
