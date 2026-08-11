import {
  InvalidWebhookSignatureError,
  MercadoPagoConfig,
  MPNotFoundError,
  Payment,
  Preference,
  WebhookSignatureValidator,
} from "mercadopago";

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

// ---------------------------------------------------------------------------
// Webhooks
// ---------------------------------------------------------------------------

/**
 * Verifica que la notificacion venga realmente de Mercado Pago.
 *
 * /api/webhooks/mercadopago es una URL publica: cualquiera puede mandarle un
 * POST diciendo "el pedido de Ana esta pagado". Mercado Pago firma cada aviso
 * con una clave secreta que solo tenemos nosotros y ellos (HMAC-SHA256 sobre
 * data.id + x-request-id + timestamp), asi que una firma valida prueba el
 * origen.
 *
 * Devuelve false si no hay secreto configurado: sin clave no hay nada que
 * comparar, y dar por buena una notificacion sin verificar seria peor.
 */
export function firmaWebhookEsValida(datos: {
  xSignature: string | undefined;
  xRequestId: string | undefined;
  dataId: string | undefined;
}): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET;

  if (!secret) {
    console.error(
      "Falta MP_WEBHOOK_SECRET: se rechazan los webhooks porque no se pueden verificar. " +
        "La clave está en Tus integraciones > tu app > Webhooks > Configurar notificaciones.",
    );
    return false;
  }

  if (!datos.xSignature || !datos.dataId) return false;

  try {
    WebhookSignatureValidator.validate({
      xSignature: datos.xSignature,
      xRequestId: datos.xRequestId ?? "",
      dataId: datos.dataId,
      secret,
    });
    return true;
  } catch (err) {
    if (err instanceof InvalidWebhookSignatureError) return false;
    throw err;
  }
}

export type PagoMercadoPago = {
  id: string;
  /** "approved", "pending", "rejected", "refunded", ... */
  status: string;
  /** El id de nuestra Order, tal como se lo mandamos al crear la preferencia. */
  externalReference: string | null;
  /** Monto efectivamente aprobado, en pesos. */
  montoAprobado: number | null;
};

/**
 * Le pregunta a Mercado Pago por un pago.
 *
 * La notificacion solo dice "paso algo con el pago 123". Que ese pago exista,
 * sea nuestro y este aprobado se averigua aca, contra la API. Nunca se toma el
 * estado del cuerpo del webhook.
 *
 * Devuelve null si el pago no existe. El SDK lanza MPNotFoundError en ese caso,
 * y hay que atraparlo: si la excepcion sube, el webhook responde 500 y Mercado
 * Pago reintenta cada 15 minutos, para siempre, por un pago que no existe.
 */
export async function obtenerPago(paymentId: string): Promise<PagoMercadoPago | null> {
  const payment = new Payment(getCliente());

  let datos;

  try {
    datos = await payment.get({ id: paymentId });
  } catch (err) {
    const noExiste =
      err instanceof MPNotFoundError ||
      (typeof err === "object" && err !== null && "status" in err && err.status === 404);

    if (noExiste) return null;
    throw err;
  }

  if (!datos?.id) return null;

  return {
    id: String(datos.id),
    status: datos.status ?? "unknown",
    externalReference: datos.external_reference ?? null,
    montoAprobado: datos.transaction_details?.total_paid_amount ?? null,
  };
}

/**
 * Busca en Mercado Pago un pago aprobado para un pedido nuestro.
 *
 * Es el camino inverso al webhook: en vez de esperar a que nos avisen,
 * preguntamos. Alcanza con el id de la Order porque se lo mandamos a Mercado
 * Pago como external_reference al crear la preferencia.
 *
 * Devuelve null si no hay ningun pago aprobado todavia, que es el caso normal
 * de un pedido que el cliente abandono.
 */
export async function buscarPagoAprobadoDePedido(
  orderId: string,
): Promise<PagoMercadoPago | null> {
  const payment = new Payment(getCliente());

  // El SDK no tipa los filtros de busqueda, de ahi el cast.
  const respuesta = (await payment.search({
    options: { external_reference: orderId },
  } as never)) as { results?: unknown[] };

  const resultados = (respuesta.results ?? []) as {
    id?: number | string;
    status?: string;
    external_reference?: string;
    transaction_details?: { total_paid_amount?: number };
  }[];

  const aprobado = resultados.find((p) => p.status === "approved");

  if (!aprobado?.id) return null;

  return {
    id: String(aprobado.id),
    status: "approved",
    externalReference: aprobado.external_reference ?? null,
    montoAprobado: aprobado.transaction_details?.total_paid_amount ?? null,
  };
}
