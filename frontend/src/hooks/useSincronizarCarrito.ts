import { useEffect } from "react";
import { useCart } from "../context/CartContext";
import type { Product } from "../types";

/**
 * Limpia del carrito los productos que ya no existen en el catálogo.
 *
 * Se llama desde cualquier pantalla que cargue el catálogo completo, así el
 * carrito se cura solo apenas el visitante entra a la tienda, sin esperar a
 * que abra el carrito y descubra que el contador miente.
 *
 * Solo actúa con el catálogo ya cargado: si `products` es null porque todavía
 * está en camino o porque la API falló, no toca nada. Vaciar el carrito de
 * alguien porque se cayó el servidor sería bastante peor que un contador
 * desactualizado.
 */
export function useSincronizarCarrito(products: Product[] | null) {
  const { sincronizarConCatalogo } = useCart();

  useEffect(() => {
    if (!products) return;
    sincronizarConCatalogo(products.map((p) => p.id));
  }, [products, sincronizarConCatalogo]);
}
