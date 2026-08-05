import type { Product } from "../types";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

async function request<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}/api${path}`);

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? `Error ${res.status} al consultar la API`);
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
