import { MercadoPagoConfig, Preference } from "mercadopago";

// Este servicio no sabe nada de Express: no recibe req ni devuelve res. Recibe
// datos y devuelve datos, asi se puede probar sin levantar un servidor.

export type ItemPreferencia = {
  id: string;
  title: string;
  quantity: number;
  /** Precio unitario en pesos enteros, tal como lo guardamos en la base. */
  unitPrice: number;
};

export type DatosPreferencia = {
  /** Id de nuestra Order. Viaja a MP como external_reference. */
  orderId: string;
  items: ItemPreferencia[];
  comprador: { nombre: string; email: string };
};

export type PreferenciaCreada = {
  preferenceId: string;
  checkoutUrl: string;
};

// Mercado Pago rechaza localhost en back_urls y notification_url. En desarrollo
// se resuelve con ngrok; si no hay una URL publica configurada, omitimos esos
// campos en vez de mandar algo invalido y que falle la preferencia entera.
function urlPublica(valor: string | undefined): string | null {
  if (!valor) return null;
  const limpia = valor.trim().replace(/\/$/, "");
  return limpia.startsWith("https://") ? limpia : null;
}

let cliente: MercadoPagoConfig | null = null;

function getCliente() {
  const accessToken = process.env.MP_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error(
      "Falta MP_ACCESS_TOKEN en el .env. Se saca de Tus integraciones > Credenciales.",
    );
  }

  // Se crea una sola vez y se reusa, como el cliente de Prisma.
  if (!cliente) {
    cliente = new MercadoPagoConfig({ accessToken });
  }

  return cliente;
}

export function estaConfigurado() {
  return Boolean(process.env.MP_ACCESS_TOKEN);
}

/**
 * Crea la preferencia de Checkout Pro y devuelve la URL a la que hay que
 * redirigir al comprador.
 *
 * Los precios que se mandan acá ya vienen calculados por el controller desde la
 * base. Este servicio no consulta precios ni confia en nada del browser.
 */
export async function crearPreferencia(
  datos: DatosPreferencia,
): Promise<PreferenciaCreada> {
  const preference = new Preference(getCliente());

  const web = urlPublica(process.env.PUBLIC_WEB_URL);
  const api = urlPublica(process.env.PUBLIC_API_URL);

  const respuesta = await preference.create({
    body: {
      items: datos.items.map((item) => ({
        id: item.id,
        title: item.title,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        currency_id: "ARS",
      })),

      payer: {
        name: datos.comprador.nombre,
        email: datos.comprador.email,
      },

      // El hilo que une el pago de Mercado Pago con nuestro pedido. Sin esto,
      // cuando llegue el webhook no sabriamos que Order actualizar.
      external_reference: datos.orderId,

      // A donde vuelve el comprador. Es cosmetico: no confirma ningun pago.
      ...(web && {
        back_urls: {
          success: `${web}/compra/exitosa`,
          failure: `${web}/compra/fallida`,
          pending: `${web}/compra/pendiente`,
        },
        auto_return: "approved",
      }),

      // Acá es donde Mercado Pago nos avisa de verdad.
      ...(api && { notification_url: `${api}/api/webhooks/mercadopago` }),

      statement_descriptor: "BINOMA",
    },
  });

  if (!respuesta.id || !respuesta.init_point) {
    throw new Error("Mercado Pago no devolvió una preferencia válida");
  }

  return {
    preferenceId: respuesta.id,
    checkoutUrl: respuesta.init_point,
  };
}
