import { Link, useParams } from "react-router-dom";
import GaleriaProducto from "../components/GaleriaProducto";
import { Boton, Contenedor, Etiqueta } from "../components/ui";
import { useCart } from "../context/CartContext";
import { useProduct } from "../hooks/useProducts";
import { formatPrice } from "../lib/format";

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { data: product, loading, error } = useProduct(slug ?? "");
  const { addItem, quantityOf } = useCart();

  if (loading) {
    return <Estado>Cargando pieza...</Estado>;
  }

  if (error || !product) {
    return (
      <Estado>
        {error ?? "No encontramos esta pieza"}
        <Link to="/catalogo" className="mt-4 block text-marca-texto underline">
          Volver al catálogo
        </Link>
      </Estado>
    );
  }

  const sinStock = product.stock === 0;
  const enCarrito = quantityOf(product.id);
  const topeAlcanzado = enCarrito >= product.stock;
  const bloqueado = sinStock || topeAlcanzado;

  const textoBoton = sinStock
    ? "Sin stock"
    : topeAlcanzado
      ? "Ya tenés todo el stock en el carrito"
      : "Agregar al carrito";

  return (
    <>
      {/* pb-24 en mobile deja lugar para la barra fija de abajo. */}
      <Contenedor className="py-8 pb-24 sm:py-14 sm:pb-14">
        <Link
          to="/catalogo"
          className="text-sm text-tenue transition hover:text-tinta"
        >
          ← Volver al catálogo
        </Link>

        <div className="mt-6 grid gap-10 lg:grid-cols-2 lg:gap-14">
          <GaleriaProducto imagenes={product.images} nombre={product.name} />

          {/* Fija mientras se recorre la pila de fotos. El tope de alto es
              un seguro: si una descripción larga la hiciera más alta que la
              pantalla, quedaría clavada arriba y el botón de comprar caería
              fuera de la vista, sin forma de llegar. */}
          <div className="lg:sticky lg:top-24 lg:max-h-[calc(100dvh-7rem)] lg:self-start lg:overflow-y-auto">
            <Etiqueta>{product.category}</Etiqueta>
            <h1 className="mt-2 text-titulo text-tinta">{product.name}</h1>

            <p className="mt-6 text-3xl font-semibold text-tinta">
              {formatPrice(product.price)}
            </p>

            {/* Línea de atributos, al estilo de las tiendas grandes: le dice al
                comprador de qué está hecho antes de que tenga que leer todo. */}
            <p className="mt-2 text-sm text-tenue">
              Fenólico 18mm · Terminación al agua · Hecho en Córdoba
            </p>

            <div className="mt-8 border-t border-borde pt-6">
              <p className="leading-relaxed text-tenue">{product.description}</p>
            </div>

            <p className="mt-8 text-sm text-tenue">
              {sinStock ? "Sin stock por el momento" : `${product.stock} disponibles`}
            </p>

            {/* En escritorio el botón vive acá; en mobile lo reemplaza la barra
                fija de abajo, para que esté siempre a mano sin scrollear. */}
            <Boton
              onClick={() => addItem(product.id, product.stock)}
              disabled={bloqueado}
              flecha={!bloqueado}
              className="mt-3 hidden w-full sm:inline-flex"
            >
              {textoBoton}
            </Boton>

            {enCarrito > 0 && (
              <p className="mt-3 text-sm text-tenue">
                {enCarrito} en el carrito.{" "}
                <Link to="/carrito" className="text-marca-texto underline">
                  Ver carrito
                </Link>
              </p>
            )}
          </div>
        </div>
      </Contenedor>

      <BarraCompraMobile
        precio={product.price}
        texto={textoBoton}
        bloqueado={bloqueado}
        onAgregar={() => addItem(product.id, product.stock)}
      />
    </>
  );
}

/**
 * Barra fija al pie, solo en mobile.
 *
 * En una ficha larga el botón de comprar queda arriba de todo y hay que
 * volver a buscarlo. Dejarlo fijo con el precio a la vista es el patrón de
 * cualquier tienda seria en teléfono.
 */
function BarraCompraMobile({
  precio,
  texto,
  bloqueado,
  onAgregar,
}: {
  precio: number;
  texto: string;
  bloqueado: boolean;
  onAgregar: () => void;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-borde bg-fondo/95 backdrop-blur sm:hidden">
      <div className="flex items-center gap-3 px-5 py-3">
        <div className="min-w-0">
          <p className="text-lg font-semibold text-tinta">{formatPrice(precio)}</p>
        </div>
        <Boton onClick={onAgregar} disabled={bloqueado} className="ml-auto shrink-0">
          {bloqueado ? texto : "Agregar"}
        </Boton>
      </div>
    </div>
  );
}

function Estado({ children }: { children: React.ReactNode }) {
  return (
    <Contenedor className="py-20 text-tenue">
      <div className="max-w-md">{children}</div>
    </Contenedor>
  );
}
