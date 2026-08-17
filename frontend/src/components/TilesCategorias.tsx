import { Link } from "react-router-dom";
import type { Product } from "../types";

/**
 * Fila de categorías, al estilo del "¿Qué estás buscando?" de las tiendas
 * grandes: una imagen alta por categoría con el nombre debajo.
 *
 * La imagen de cada tile es la de un producto de esa categoría, elegido entre
 * los que tienen stock. Así la fila se arma sola: cargás una categoría nueva
 * desde el panel y aparece acá sin tocar código.
 */
export default function TilesCategorias({ products }: { products: Product[] }) {
  const categorias = agruparPorCategoria(products);

  if (categorias.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
      {categorias.map(({ categoria, portada, cantidad }) => (
        <Link
          key={categoria}
          to={`/catalogo?categoria=${encodeURIComponent(categoria)}`}
          className="group block"
        >
          <div className="aspect-3/4 overflow-hidden rounded-pieza bg-superficie-2">
            {portada && (
              <img
                src={portada}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
              />
            )}
          </div>
          <div className="mt-3 flex items-baseline justify-between gap-2 border-b border-borde pb-3 transition group-hover:border-marca">
            <span className="text-subtitulo capitalize text-tinta">{categoria}</span>
            <span className="text-xs text-tenue">{cantidad}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}

function agruparPorCategoria(products: Product[]) {
  const mapa = new Map<string, { portada: string | null; cantidad: number }>();

  for (const p of products) {
    const actual = mapa.get(p.category) ?? { portada: null, cantidad: 0 };

    // La portada la pone el primer producto con stock e imagen; si ninguno
    // tiene stock, sirve igual la primera imagen que aparezca.
    const mejorPortada =
      actual.portada && p.stock === 0 ? actual.portada : (p.images[0] ?? actual.portada);

    mapa.set(p.category, { portada: mejorPortada, cantidad: actual.cantidad + 1 });
  }

  return [...mapa.entries()]
    .map(([categoria, datos]) => ({ categoria, ...datos }))
    .sort((a, b) => a.categoria.localeCompare(b.categoria));
}
