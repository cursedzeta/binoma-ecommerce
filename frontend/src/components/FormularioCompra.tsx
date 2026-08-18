import { useState } from "react";
import { Boton, Campo, entrada } from "./ui";
import { useCart } from "../context/CartContext";
import { ApiError, createOrder } from "../services/api";

type Formulario = {
  customerName: string;
  email: string;
  phone: string;
};

const vacio: Formulario = { customerName: "", email: "", phone: "" };

/**
 * Datos del comprador y salida hacia Mercado Pago.
 *
 * Vive dentro del carrito, no en una pantalla aparte: cada paso extra entre
 * "quiero esto" y "pagué" pierde compradores, y el resumen tiene que seguir a
 * la vista mientras se completan los datos.
 */
export default function FormularioCompra({
  onPedidoSinPago,
}: {
  onPedidoSinPago: (orderId: string) => void;
}) {
  const { items } = useCart();

  const [form, setForm] = useState<Formulario>(vacio);
  const [enviando, setEnviando] = useState(false);
  const [errores, setErrores] = useState<string[]>([]);

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
        // El carrito NO se vacía acá: el pago todavía puede fallar o
        // cancelarse. Se vacía cuando Mercado Pago confirma.
        window.location.href = checkoutUrl;
        return;
      }

      onPedidoSinPago(order.id);
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
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
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

      <div className="grid gap-5 sm:grid-cols-2">
        <Campo label="Email" ayuda="Te enviamos ahí la confirmación.">
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
      </div>

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

      <Boton type="submit" disabled={enviando} flecha={!enviando} className="w-full">
        {enviando ? "Redirigiendo a Mercado Pago..." : "Pagar con Mercado Pago"}
      </Boton>

      <p className="text-center text-xs text-tenue">
        Vas a completar el pago en el sitio de Mercado Pago. No guardamos datos de tu
        tarjeta.
      </p>
    </form>
  );
}
