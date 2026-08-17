import { useState } from "react";
import { Link } from "react-router-dom";
import { Boton, BotonLink, Campo, Contenedor, Etiqueta, entrada } from "../components/ui";
import { useCart } from "../context/CartContext";
import { useProducts } from "../hooks/useProducts";
import { formatPrice } from "../lib/format";
import { ApiError, createOrder } from "../services/api";

type Formulario = {
  customerName: string;
  email: string;
  phone: string;
};

const vacio: Formulario = { customerName: "", email: "", phone: "" };

export default function Checkout() {
  const { items } = useCart();
  const { data: products, loading } = useProducts();

  const [form, setForm] = useState<Formulario>(vacio);
  const [enviando, setEnviando] = useState(false);
  const [errores, setErrores] = useState<string[]>([]);
  const [pedidoSinPago, setPedidoSinPago] = useState<string | null>(null);

  if (pedidoSinPago) {
    return (
      <Contenedor ancho="angosto" className="py-20">
        <h1 className="text-titulo text-tinta">Pedido registrado</h1>
        <p className="mt-4 text-tenue">
          Guardamos tu pedido, pero el cobro online no está disponible en este
          momento. Nos vamos a contactar para coordinar el pago.
        </p>
        <p className="mt-6 text-sm text-tenue">
          Número de pedido: <span className="text-tinta">{pedidoSinPago}</span>
        </p>
        <BotonLink to="/" className="mt-8">
          Volver al catálogo
        </BotonLink>
      </Contenedor>
    );
  }

  if (items.length === 0) {
    return (
      <Contenedor ancho="angosto" className="py-20">
        <h1 className="text-titulo text-tinta">Finalizar compra</h1>
        <p className="mt-4 text-tenue">Tu carrito está vacío.</p>
        <BotonLink to="/" className="mt-8">
          Ver el catálogo
        </BotonLink>
      </Contenedor>
    );
  }

  if (loading || !products) {
    return <Contenedor ancho="angosto" className="py-20 text-tenue">Cargando...</Contenedor>;
  }

  // El total que se muestra acá es solo informativo: el que vale es el que
  // calcula el backend leyendo los precios de la base.
  const lineas = items.flatMap((item) => {
    const product = products.find((p) => p.id === item.productId);
    return product ? [{ item, product }] : [];
  });

  const total = lineas.reduce((acc, l) => acc + l.product.price * l.item.quantity, 0);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrores([]);
    setEnviando(true);

    try {
      const { checkoutUrl, order } = await createOrder({
        ...form,
        // Solo ids y cantidades. Ningún precio sale del navegador.
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      });

      if (checkoutUrl) {
        // El carrito NO se vacía acá: el pago todavía puede fallar o cancelarse.
        // Se vacía cuando Mercado Pago confirma.
        window.location.href = checkoutUrl;
        return;
      }

      setPedidoSinPago(order.id);
      setEnviando(false);
    } catch (err) {
      if (err instanceof ApiError) {
        setErrores(err.detalles.length > 0 ? err.detalles : [err.message]);
      } else {
        setErrores(["No se pudo conectar con el servidor. Probá de nuevo."]);
      }
      setEnviando(false);
    }
  }

  return (
    <Contenedor ancho="angosto" className="py-10 sm:py-16">
      <Link to="/carrito" className="text-sm text-tenue transition hover:text-tinta">
        ← Volver al carrito
      </Link>

      <h1 className="mt-6 text-titulo text-tinta">Finalizar compra</h1>

      <section className="mt-8 rounded-pieza border border-borde bg-superficie p-5">
        <Etiqueta>Tu pedido</Etiqueta>
        <ul className="mt-3 flex flex-col gap-1.5">
          {lineas.map(({ item, product }) => (
            <li key={product.id} className="flex justify-between gap-4 text-sm">
              <span className="text-tenue">
                {product.name} × {item.quantity}
              </span>
              <span className="shrink-0 text-tinta tabular-nums">
                {formatPrice(product.price * item.quantity)}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex justify-between border-t border-borde pt-4">
          <span className="text-tenue">Total</span>
          <span className="font-display text-2xl text-tinta">{formatPrice(total)}</span>
        </div>
      </section>

      <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-5">
        <Campo label="Nombre y apellido">
          <input
            name="customerName"
            value={form.customerName}
            onChange={(e) => setForm({ ...form, customerName: e.target.value })}
            autoComplete="name"
            required
            className={entrada}
          />
        </Campo>

        <Campo label="Email" ayuda="Te enviamos ahí la confirmación de la compra.">
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            autoComplete="email"
            required
            className={entrada}
          />
        </Campo>

        <Campo label="Teléfono" ayuda="Para coordinar la entrega.">
          <input
            name="phone"
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            autoComplete="tel"
            required
            className={entrada}
          />
        </Campo>

        {errores.length > 0 && (
          <div role="alert" className="rounded-pieza border border-borde bg-superficie p-4">
            <p className="text-sm text-tinta">No se pudo continuar:</p>
            <ul className="mt-2 list-inside list-disc text-sm text-tenue">
              {errores.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </div>
        )}

        <Boton type="submit" disabled={enviando} className="w-full">
          {enviando ? "Redirigiendo a Mercado Pago..." : "Pagar con Mercado Pago"}
        </Boton>

        <p className="text-center text-xs text-tenue">
          Vas a completar el pago en el sitio de Mercado Pago. No guardamos datos de
          tu tarjeta.
        </p>
      </form>
    </Contenedor>
  );
}
