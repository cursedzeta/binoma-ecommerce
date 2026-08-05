// Producto tal como lo devuelve la API publica.
export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  category: string;
  images: string[];
  stock: number;
  createdAt: string;
  updatedAt: string;
};
