// Producto tal como lo devuelve la API publica.
// Nota: priceRetail (lista mayorista) no viaja al browser a proposito.
export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  priceDirect: number;
  category: string;
  images: string[];
  stock: number;
  createdAt: string;
  updatedAt: string;
};
