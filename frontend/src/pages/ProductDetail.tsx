import { Link, useParams } from "react-router-dom";
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
        <Link to="/" className="mt-4 block text-marca-texto underline">
          Volver al catálogo
        </Link>
      </Estado>
    );
  }

  const sinStock = product.stock === 0;
  const enCarrito = quantityOf(product.id);
  const topeAlcanzado = enCarrito >= product.stock;

  return (
    <Contenedor className="py-10 sm:py-16">
      <Link to="/" className="text-sm text-tenue transition hover:text-tinta">
        ← Volver al catálogo
      </Link>

      <div className="mt-8 grid gap-10 lg:grid-cols-2 lg:gap-14">
        <div className="flex flex-col gap-4">
          {product.images.length === 0 && (
            <div className="aspect-4/3 rounded-pieza bg-superficie-2" />
          )}
          {product.images.map((src, i) => (
            <div
              key={src}
              className="aspect-4/3 overflow-hidden rounded-pieza border border-borde bg-superficie-2"
            >
              <img
                src={src}
                alt={`${product.name} — imagen ${i + 1}`}
                className="h-full w-full object-cover"
                loading={i === 0 ? "eager" : "lazy"}
              />
            </div>
          ))}
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <Etiqueta>{product.category}</Etiqueta>
          <h1 className="mt-2 text-titulo text-tinta">{product.name}</h1>

          <p className="mt-5 font-display text-3xl text-tinta">
            {formatPrice(product.price)}
          </p>

          <p className="mt-6 leading-relaxed text-tenue">{product.description}</p>

          <p className="mt-8 text-sm text-tenue">
            {sinStock ? "Sin stock por el momento" : `${product.stock} disponibles`}
          </p>

          <Boton
            onClick={() => addItem(product.id, product.stock)}
            disabled={sinStock || topeAlcanzado}
            className="mt-3 w-full"
          >
            {sinStock
              ? "Sin stock"
              : topeAlcanzado
                ? "Ya tenés todo el stock en el carrito"
                : "Agregar al carrito"}
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
  );
}

function Estado({ children }: { children: React.ReactNode }) {
  return (
    <Contenedor className="py-20 text-tenue">
      <div className="max-w-md">{children}</div>
    </Contenedor>
  );
}
