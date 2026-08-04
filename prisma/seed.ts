import { prisma } from "../src/lib/prisma.js";

// Productos de prueba. Las imágenes son placeholders hasta que carguemos
// la fotografía real de producto en Cloudinary (sprint 5).
const products = [
  {
    slug: "banco-fenolico-natural",
    name: "Banco Fenólico Natural",
    description:
      "Banco de líneas puras en fenólico de 18mm con canto visto y sellado. Estructura autoportante, sin herrajes a la vista. Ideal como asiento de entrada o mesa auxiliar.",
    priceDirect: 95000,
    priceRetail: 71000,
    category: "banco",
    images: ["https://placehold.co/1200x900/e8e4dd/1a1a1a?text=Banco+Natural"],
    stock: 8,
  },
  {
    slug: "mesa-comedor-binoma-180",
    name: "Mesa Comedor BINOMA 180",
    description:
      "Mesa de comedor de 180x90cm en fenólico con terminación al agua. Tapa de una sola pieza sobre bases trapezoidales. Para seis a ocho comensales.",
    priceDirect: 320000,
    priceRetail: 245000,
    category: "mesa",
    images: ["https://placehold.co/1200x900/e8e4dd/1a1a1a?text=Mesa+180"],
    stock: 3,
  },
  {
    slug: "silla-fenolico-curva",
    name: "Silla Fenólico Curva",
    description:
      "Silla de respaldo curvo laminado en fenólico. Ensamble a caja y espiga, sin tornillería visible. Apilable y liviana.",
    priceDirect: 145000,
    priceRetail: 110000,
    category: "silla",
    images: ["https://placehold.co/1200x900/e8e4dd/1a1a1a?text=Silla+Curva"],
    stock: 12,
  },
  {
    slug: "mesa-auxiliar-nido",
    name: "Mesa Auxiliar Nido",
    description:
      "Juego de dos mesas auxiliares apilables en fenólico. Se guardan una dentro de la otra ocupando el espacio de una sola.",
    priceDirect: 128000,
    priceRetail: 96000,
    category: "mesa",
    images: ["https://placehold.co/1200x900/e8e4dd/1a1a1a?text=Mesa+Nido"],
    stock: 0, // sin stock a propósito, para probar ese estado en el frontend
  },
];

async function main() {
  for (const product of products) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: product,
      create: product,
    });
  }
  console.log(`Seed listo: ${products.length} productos.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
