import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { prisma } from "../src/lib/prisma.js";

// Tests de integracion: le pegan a la API de verdad, contra la base de verdad.
// Requieren el backend levantado (npm run dev en otra terminal).
//
// Los pedidos que se crean acá se borran al final, en el bloque after().

const API = process.env.TEST_API_URL ?? "http://localhost:3000";

type ProductoApi = { id: string; name: string; price: number; stock: number };

type Pedido = {
  id: string;
  total: number;
  status: string;
  mpPreferenceId: string | null;
  items: { price: number; quantity: number }[];
};

// En el camino feliz la API devuelve { order, checkoutUrl }; ante un error,
// { error, detalles }.
type RespuestaPedido = {
  order?: Pedido;
  checkoutUrl?: string | null;
  error?: string;
  detalles?: string[];
  orderId?: string;
};

const pedidosCreados: string[] = [];

async function post(body: unknown) {
  const res = await fetch(`${API}/api/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const json = (await res.json()) as RespuestaPedido;

  // Guardamos el id para limpiar despues, venga por donde venga: si Mercado
  // Pago falla, el pedido igual quedo creado y hay que borrarlo.
  const id = json.order?.id ?? json.orderId;
  if (typeof id === "string") {
    pedidosCreados.push(id);
  }

  return { status: res.status, json };
}

// El producto de prueba sale del catalogo real: asi los tests no dependen de
// ids fijos que cambian con cada seed.
let producto: ProductoApi;

describe("POST /api/orders", () => {
  before(async () => {
    const res = await fetch(`${API}/api/products`).catch(() => null);

    if (!res?.ok) {
      throw new Error(
        `No hay backend escuchando en ${API}. Levantalo con "npm run dev" en otra terminal.`,
      );
    }

    const catalogo = (await res.json()) as ProductoApi[];

    // El producto de prueba tiene que tener id valido (Prisma Studio permite
    // guardar productos con id vacio si se toca el campo al crearlos) y un
    // stock que deje pedir una unidad de mas sin pasar el tope de 50.
    const usable = catalogo.find(
      (p) => typeof p.id === "string" && p.id.length > 0 && p.stock > 1 && p.stock < 50,
    );

    if (!usable) {
      throw new Error(
        "No hay ningun producto usable para probar: hace falta uno con id valido y stock entre 2 y 49.",
      );
    }

    producto = usable;
  });

  after(async () => {
    if (pedidosCreados.length > 0) {
      await prisma.order.deleteMany({ where: { id: { in: pedidosCreados } } });
    }
    await prisma.$disconnect();
  });

  it("crea el pedido y calcula el total desde la base", async () => {
    const { status, json } = await post({
      customerName: "Ana Perez",
      email: "ana@mail.com",
      phone: "3511234567",
      items: [{ productId: producto.id, quantity: 2 }],
    });

    assert.equal(status, 201);
    assert.equal(json.order?.total, producto.price * 2);
    assert.equal(json.order?.status, "pendiente");
    assert.equal(json.order?.items.length, 1);
    assert.equal(json.order?.items[0]?.price, producto.price);
  });

  // El test que mas importa de todo el archivo.
  it("ignora el total y el price que mande el cliente", async () => {
    const { status, json } = await post({
      customerName: "Atacante",
      email: "malo@mail.com",
      phone: "351",
      total: 1,
      items: [{ productId: producto.id, quantity: 2, price: 1 }],
    });

    assert.equal(status, 201);
    assert.equal(
      json.order?.total,
      producto.price * 2,
      "el total tiene que salir de la base",
    );
    assert.equal(
      json.order?.items[0]?.price,
      producto.price,
      "el precio unitario tambien",
    );
  });

  it("congela el precio unitario en el pedido", async () => {
    const { json } = await post({
      customerName: "Ana",
      email: "ana@mail.com",
      phone: "351",
      items: [{ productId: producto.id, quantity: 1 }],
    });

    // El OrderItem guarda su propia copia del precio: si manana cambia la lista,
    // este pedido no se entera.
    const guardado = await prisma.orderItem.findFirst({
      where: { orderId: json.order?.id },
    });
    assert.equal(guardado?.price, producto.price);
  });

  it("no descuenta stock: el pedido queda pendiente", async () => {
    const antes = await prisma.product.findUnique({ where: { id: producto.id } });

    await post({
      customerName: "Ana",
      email: "ana@mail.com",
      phone: "351",
      items: [{ productId: producto.id, quantity: 1 }],
    });

    const despues = await prisma.product.findUnique({ where: { id: producto.id } });
    assert.equal(despues?.stock, antes?.stock, "el stock se descuenta recien al pagar");
  });

  it("responde 400 si faltan datos del cliente", async () => {
    const { status, json } = await post({
      customerName: "",
      email: "no-es-mail",
      phone: "",
      items: [],
    });

    assert.equal(status, 400);
    assert.ok(Array.isArray(json.detalles));
  });

  it("responde 409 si se pide mas stock del disponible", async () => {
    const { status, json } = await post({
      customerName: "Ana",
      email: "ana@mail.com",
      phone: "351",
      items: [{ productId: producto.id, quantity: producto.stock + 1 }],
    });

    assert.equal(status, 409);
    assert.match(json.detalles?.join(" ") ?? "", /quedan|sin stock/);
  });

  it("responde 409 si el producto no existe", async () => {
    const { status } = await post({
      customerName: "Ana",
      email: "ana@mail.com",
      phone: "351",
      items: [{ productId: "00000000-0000-0000-0000-000000000000", quantity: 1 }],
    });

    assert.equal(status, 409);
  });
});

describe("GET /api/orders/:id", () => {
  it("devuelve 404 con un id inexistente", async () => {
    const res = await fetch(`${API}/api/orders/00000000-0000-0000-0000-000000000000`);
    assert.equal(res.status, 404);
  });
});
