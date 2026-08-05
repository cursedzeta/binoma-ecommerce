// Validacion del cuerpo de POST /api/orders.
//
// Todo lo que llega del browser es sospechoso: puede venir incompleto, con
// tipos raros o directamente manipulado. Esta capa se asegura de que lo que
// pase al controller tenga la forma esperada.
//
// Ojo con lo que NO validamos: los precios. No los validamos porque no los
// aceptamos. Si el cliente manda un total, se ignora; el precio sale de la base.

export type ItemPedido = {
  productId: string;
  quantity: number;
};

export type DatosPedido = {
  customerName: string;
  email: string;
  phone: string;
  items: ItemPedido[];
};

export type ResultadoValidacion =
  | { ok: true; datos: DatosPedido }
  | { ok: false; errores: string[] };

const MAX_UNIDADES_POR_PRODUCTO = 50;

function textoNoVacio(valor: unknown): valor is string {
  return typeof valor === "string" && valor.trim().length > 0;
}

// Chequeo deliberadamente laxo: "algo@algo.algo". Validar emails con una regex
// estricta es una trampa clasica, hay direcciones validas rarisimas. Que el
// email exista de verdad solo se sabe mandandole un correo.
function pareceEmail(valor: unknown): valor is string {
  return typeof valor === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor.trim());
}

export function validarPedido(body: unknown): ResultadoValidacion {
  const errores: string[] = [];

  if (typeof body !== "object" || body === null) {
    return { ok: false, errores: ["El cuerpo del pedido tiene que ser un objeto"] };
  }

  const { customerName, email, phone, items } = body as Record<string, unknown>;

  if (!textoNoVacio(customerName)) {
    errores.push("El nombre es obligatorio");
  }

  if (!pareceEmail(email)) {
    errores.push("El email no es válido");
  }

  if (!textoNoVacio(phone)) {
    errores.push("El teléfono es obligatorio");
  }

  if (!Array.isArray(items) || items.length === 0) {
    errores.push("El pedido tiene que tener al menos un producto");
    return { ok: false, errores };
  }

  const itemsValidados: ItemPedido[] = [];
  const idsVistos = new Set<string>();

  for (const [i, item] of items.entries()) {
    const posicion = `Producto ${i + 1}`;

    if (typeof item !== "object" || item === null) {
      errores.push(`${posicion}: formato inválido`);
      continue;
    }

    const { productId, quantity } = item as Record<string, unknown>;

    if (!textoNoVacio(productId)) {
      errores.push(`${posicion}: falta el identificador`);
      continue;
    }

    // Si el mismo producto viene repetido, el total se calcularia mal.
    if (idsVistos.has(productId)) {
      errores.push(`${posicion}: está repetido en el pedido`);
      continue;
    }

    if (
      typeof quantity !== "number" ||
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > MAX_UNIDADES_POR_PRODUCTO
    ) {
      errores.push(
        `${posicion}: la cantidad tiene que ser un número entero entre 1 y ${MAX_UNIDADES_POR_PRODUCTO}`,
      );
      continue;
    }

    idsVistos.add(productId);
    itemsValidados.push({ productId, quantity });
  }

  if (errores.length > 0) {
    return { ok: false, errores };
  }

  return {
    ok: true,
    datos: {
      customerName: (customerName as string).trim(),
      email: (email as string).trim().toLowerCase(),
      phone: (phone as string).trim(),
      items: itemsValidados,
    },
  };
}
