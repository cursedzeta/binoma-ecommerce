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

// Una linea del pedido. price es el precio unitario congelado al comprar:
// no cambia aunque despues se actualice la lista.
export type OrderItem = {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  product: { slug: string; name: string; images: string[] };
};

export type OrderStatus = "pendiente" | "pagado" | "enviado";

export type Order = {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  total: number;
  status: OrderStatus;
  mpPreferenceId: string | null;
  mpPaymentId: string | null;
  createdAt: string;
  items: OrderItem[];
};
