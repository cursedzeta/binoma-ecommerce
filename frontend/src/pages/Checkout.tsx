import { useState } from "react";
import { Link } from "react-router-dom";
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
      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-2xl text-neutral-900">Pedido registrado</h1>
        <p className="mt-4 text-neutral-700">
          Guardamos tu pedido, pero el cobro online no está disponible en este
          momento. Nos vamos a contactar para coordinar el pago.
        </p>
        <p className="mt-4 text-sm text-neutral-500">
          Número de pedido: <span className="text-neutral-900">{pedidoSinPago}</span>
        </p>
        <Link to="/" className="mt-6 inline-block underline">
          Volver al catálogo
        </Link>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-2xl text-neutral-900">Checkout</h1>
        <p className="mt-4 text-neutral-600">Tu carrito está vacío.</p>
        <Link to="/" className="mt-4 inline-block underline">
          Ver el catálogo
        </Link>
      </main>
    );
  }

  if (loading || !products) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-12 text-neutral-600">
        Cargando...
      </main>
    );
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
        // Se vacía cuando Mercado Pago confirma (paso 4).
        window.location.href = checkoutUrl;
        return;
      }

      // El backend no tiene credenciales de Mercado Pago configuradas. El
      // pedido quedó guardado igual, así que mostramos su número.
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
    <main className="mx-auto max-w-3xl px-6 py-12">
      <Link to="/carrito" className="text-sm text-neutral-600 underline">
        Volver al carrito
      </Link>

      <h1 className="mt-6 text-2xl text-neutral-900">Finalizar compra</h1>

      <section className="mt-8 border-y border-neutral-300 py-4">
        <h2 className="text-sm uppercase tracking-wide text-neutral-500">Tu pedido</h2>
        <ul className="mt-3 space-y-1">
          {lineas.map(({ item, product }) => (
            <li key={product.id} className="flex justify-between text-sm">
              <span className="text-neutral-700">
                {product.name} × {item.quantity}
              </span>
              <span className="text-neutral-900">
                {formatPrice(product.price * item.quantity)}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex justify-between border-t border-neutral-300 pt-3">
          <span className="text-neutral-700">Total</span>
          <span className="text-lg text-neutral-900">{formatPrice(total)}</span>
        </div>
      </section>

      <form onSubmit={onSubmit} className="mt-8 space-y-5">
        <Campo
          id="customerName"
          label="Nombre y apellido"
          value={form.customerName}
          onChange={(v) => setForm({ ...form, customerName: v })}
          autoComplete="name"
        />

        <Campo
          id="email"
          label="Email"
          type="email"
          value={form.email}
          onChange={(v) => setForm({ ...form, email: v })}
          autoComplete="email"
          ayuda="Te enviamos ahí la confirmación de la compra."
        />

        <Campo
          id="phone"
          label="Teléfono"
          type="tel"
          value={form.phone}
          onChange={(v) => setForm({ ...form, phone: v })}
          autoComplete="tel"
          ayuda="Para coordinar la entrega."
        />

        {errores.length > 0 && (
          <div role="alert" className="border border-neutral-500 p-4">
            <p className="text-sm text-neutral-900">No se pudo continuar:</p>
            <ul className="mt-2 list-inside list-disc text-sm text-neutral-700">
              {errores.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </div>
        )}

        <button
          type="submit"
          disabled={enviando}
          className="w-full border border-neutral-900 px-6 py-3 text-neutral-900 disabled:border-neutral-300 disabled:text-neutral-400"
        >
          {enviando ? "Redirigiendo a Mercado Pago..." : "Pagar con Mercado Pago"}
        </button>

        <p className="text-center text-xs text-neutral-500">
          Vas a completar el pago en el sitio de Mercado Pago. No guardamos datos de
          tu tarjeta.
        </p>
      </form>
    </main>
  );
}

function Campo({
  id,
  label,
  value,
  onChange,
  type = "text",
  autoComplete,
  ayuda,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (valor: string) => void;
  type?: string;
  autoComplete?: string;
  ayuda?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm text-neutral-700">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        required
        className="mt-1 w-full border border-neutral-300 px-3 py-2 text-neutral-900 focus:border-neutral-900 focus:outline-none"
      />
      {ayuda && <p className="mt-1 text-xs text-neutral-500">{ayuda}</p>}
    </div>
  );
}
