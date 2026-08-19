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

// Token del panel de administración. Lo setea AuthContext al iniciar sesión,
// y desde acá viaja solo en las peticiones que lo necesitan. Así ningún
// componente tiene que acordarse de adjuntarlo.
let tokenAdmin: string | null = null;

export function setTokenAdmin(token: string | null) {
  tokenAdmin = token;
}

type OpcionesRequest = RequestInit & { conAuth?: boolean };

async function request<T>(path: string, init?: OpcionesRequest): Promise<T> {
  const { conAuth, headers, ...resto } = init ?? {};

  const res = await fetch(`${BASE_URL}/api${path}`, {
    ...resto,
    headers: {
      ...headers,
      ...(conAuth && tokenAdmin ? { Authorization: `Bearer ${tokenAdmin}` } : {}),
    },
  });

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

// --- Panel de administración ---------------------------------------------

export async function login(email: string, password: string) {
  const { token } = await request<{ token: string }>("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  return token;
}

/** Verifica que el token guardado siga siendo válido. Tira si no lo es. */
export function getSesion() {
  return request<{ admin: { email: string } }>("/auth/me", { conAuth: true });
}

export function getPedidosAdmin(status?: string) {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  return request<Order[]>(`/admin/orders${query}`, { conAuth: true });
}

export type ResumenEstado = {
  status: string;
  cantidad: number;
  total: number;
};

export function getResumenPedidos() {
  return request<ResumenEstado[]>("/admin/orders/resumen", { conAuth: true });
}

export function cambiarEstadoPedido(id: string, status: string) {
  return request<Order>(`/admin/orders/${id}/estado`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
    conAuth: true,
  });
}

export type ResultadoReconciliacion = {
  estado: "confirmado" | "ya-confirmado" | "sin-pedido" | "sin-pago-aprobado";
  orderId: string;
  paymentId?: string;
};

/** El botón "Verificar pago": le pregunta a Mercado Pago si el pedido se pagó. */
export function reconciliarPedido(id: string) {
  return request<ResultadoReconciliacion>(`/admin/orders/${id}/reconciliar`, {
    method: "POST",
    conAuth: true,
  });
}

// --- Productos (panel) ---

/**
 * Producto tal como lo ve el panel: incluye el conteo de pedidos en los que
 * aparece, que es lo que determina si se puede borrar.
 */
export type ProductoAdmin = Product & {
  _count: { orderItems: number };
};

/**
 * Los datos que edita el formulario.
 *
 * El slug viaja desde el panel, pero el backend lo vuelve a normalizar y, si
 * choca con otro producto, le agrega -2. O sea que lo que se manda es una
 * propuesta, no la última palabra.
 */
export type DatosProducto = {
  slug: string;
  name: string;
  description: string;
  price: number;
  category: string;
  images: string[];
  stock: number;
};

export function getProductosAdmin() {
  return request<ProductoAdmin[]>("/admin/products", { conAuth: true });
}

export function getCategorias() {
  return request<{ category: string; cantidad: number }[]>("/admin/products/categorias", {
    conAuth: true,
  });
}

export function crearProducto(datos: DatosProducto) {
  return request<Product>("/admin/products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos),
    conAuth: true,
  });
}

export function editarProducto(id: string, datos: Partial<DatosProducto>) {
  return request<Product>(`/admin/products/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos),
    conAuth: true,
  });
}

export async function borrarProducto(id: string) {
  // Responde 204 sin cuerpo, así que no pasa por request(), que espera JSON.
  const res = await fetch(`${BASE_URL}/api/admin/products/${id}`, {
    method: "DELETE",
    headers: tokenAdmin ? { Authorization: `Bearer ${tokenAdmin}` } : {},
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as CuerpoError | null;
    throw new ApiError(body?.error ?? `Error ${res.status}`, res.status, body?.detalles ?? []);
  }
}
