import type { Order, Product } from "../types";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

/**
 * Error de la API que conserva la lista de detalles del backend.
 *
 * El backend devuelve { error, detalles: [...] } cuando hay varios problemas a
 * la vez ("falta el nombre", "el email no es válido"). Si los aplastáramos en
 * un solo string, el formulario no podría mostrarlos uno por uno.
 */
export class ApiError extends Error {
  status: number;
  detalles: string[];

  constructor(message: string, status: number, detalles: string[] = []) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detalles = detalles;
  }
}

type CuerpoError = {
  error?: string;
  detalles?: string[];
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}/api${path}`, init);

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as CuerpoError | null;
    throw new ApiError(
      body?.error ?? `Error ${res.status} al consultar la API`,
      res.status,
      body?.detalles ?? [],
    );
  }

  return res.json() as Promise<T>;
}

export function getProducts(category?: string) {
  const query = category ? `?category=${encodeURIComponent(category)}` : "";
  return request<Product[]>(`/products${query}`);
}

export function getProductBySlug(slug: string) {
  return request<Product>(`/products/${slug}`);
}

export type NuevoPedido = {
  customerName: string;
  email: string;
  phone: string;
  items: { productId: string; quantity: number }[];
};

export type PedidoCreado = {
  order: Order;
  /** URL de Mercado Pago. Es null si el backend no tiene credenciales. */
  checkoutUrl: string | null;
};

// Ojo con lo que NO se manda: ni precios ni total. El backend los calcula.
export function createOrder(datos: NuevoPedido) {
  return request<PedidoCreado>("/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos),
  });
}

export function getOrderById(id: string) {
  return request<Order>(`/orders/${id}`);
}
