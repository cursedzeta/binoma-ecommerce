-- BINOMA no maneja precio mayorista: queda un unico precio de venta.
--
-- Escrita a mano a proposito. Prisma habria generado DROP + ADD, que borra
-- los precios existentes. RENAME conserva los datos de la columna.

ALTER TABLE "Product" RENAME COLUMN "priceDirect" TO "price";

ALTER TABLE "Product" DROP COLUMN "priceRetail";
