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
 * Avisa al arrancar si el token mueve plata real.
 *
 * No alcanza con mirar el prefijo: Mercado Pago entrega las credenciales de
 * prueba a traves de una cuenta de vendedor de prueba, y esas tambien empiezan
 * con APP_USR-. La unica forma confiable de saberlo es preguntarle a Mercado
 * Pago de quien es el token: las cuentas de prueba vienen con el tag
 * "test_user".
 *
 * No bloquea el arranque: si la consulta falla (sin internet, por ejemplo) el
 * servidor tiene que levantar igual.
 */
export async function advertirSiElTokenEsDeProduccion() {
  const token = process.env.MP_ACCESS_TOKEN;

  if (!token || process.env.NODE_ENV === "production") return;

  try {
    const res = await fetch("https://api.mercadopago.com/users/me", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      console.warn(
        `Mercado Pago: no se pudo validar el token (HTTP ${res.status}). Revisá MP_ACCESS_TOKEN.`,
      );
      return;
    }

    const cuenta = (await res.json()) as { nickname?: string; tags?: string[] };

    if (cuenta.tags?.includes("test_user")) {
      console.log(`Mercado Pago: cuenta de PRUEBA (${cuenta.nickname}). Sin plata real.`);
      return;
    }

    console.warn(
      [
        "",
        "  ############################################################",
        "  #  ATENCION: el token es de una cuenta REAL                #",
        `  #  Cuenta: ${(cuenta.nickname ?? "desconocida").padEnd(45)}#`,
        "  #                                                          #",
        "  #  Cada pago que se complete cobra DINERO REAL.            #",
        "  #  Para probar, usá las credenciales de prueba:            #",
        "  #  Tus integraciones > tu app > Credenciales de prueba     #",
        "  ############################################################",
        "",
      ].join("\n"),
    );
  } catch (err) {
    console.warn("Mercado Pago: no se pudo verificar el tipo de cuenta.", err);
  }
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
