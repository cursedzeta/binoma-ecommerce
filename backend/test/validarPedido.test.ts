import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { validarPedido } from "../src/lib/validarPedido.js";

// Tests unitarios: validarPedido es una funcion pura, no necesita servidor ni
// base de datos. Corren en milisegundos.

const pedidoValido = {
  customerName: "Ana Perez",
  email: "ana@mail.com",
  phone: "3511234567",
  items: [{ productId: "abc-123", quantity: 2 }],
};

describe("validarPedido", () => {
  it("acepta un pedido bien formado", () => {
    const r = validarPedido(pedidoValido);

    assert.equal(r.ok, true);
    assert.ok(r.ok);
    assert.equal(r.datos.customerName, "Ana Perez");
    assert.deepEqual(r.datos.items, [{ productId: "abc-123", quantity: 2 }]);
  });

  it("normaliza el email a minusculas y saca los espacios", () => {
    const r = validarPedido({
      ...pedidoValido,
      customerName: "  Ana Perez  ",
      email: "  ANA@MAIL.COM  ",
    });

    assert.ok(r.ok);
    assert.equal(r.datos.email, "ana@mail.com");
    assert.equal(r.datos.customerName, "Ana Perez");
  });

  it("ignora un total o un price que venga en el cuerpo", () => {
    const r = validarPedido({
      ...pedidoValido,
      total: 1,
      items: [{ productId: "abc-123", quantity: 2, price: 1 }],
    });

    assert.ok(r.ok);
    // Los datos validados solo tienen productId y quantity: no hay por donde
    // colar un precio hacia el controller.
    assert.deepEqual(Object.keys(r.datos.items[0]!).sort(), ["productId", "quantity"]);
    assert.ok(!("total" in r.datos));
  });

  it("rechaza el cuerpo vacio o que no sea un objeto", () => {
    for (const body of [null, undefined, "texto", 42, []]) {
      const r = validarPedido(body);
      assert.equal(r.ok, false, `deberia rechazar: ${JSON.stringify(body)}`);
    }
  });

  it("junta todos los errores en vez de cortar en el primero", () => {
    const r = validarPedido({
      customerName: "",
      email: "no-es-mail",
      phone: "",
      items: [],
    });

    assert.ok(!r.ok);
    assert.equal(r.errores.length, 4);
  });

  it("rechaza emails invalidos", () => {
    for (const email of ["", "sinarroba", "sin@dominio", "@mail.com", "a b@mail.com"]) {
      const r = validarPedido({ ...pedidoValido, email });
      assert.equal(r.ok, false, `deberia rechazar el email: "${email}"`);
    }
  });

  it("rechaza cantidades que no sean enteros positivos", () => {
    for (const quantity of [0, -1, 1.5, NaN, "2", null]) {
      const r = validarPedido({
        ...pedidoValido,
        items: [{ productId: "abc-123", quantity }],
      });
      assert.equal(r.ok, false, `deberia rechazar la cantidad: ${quantity}`);
    }
  });

  it("rechaza cantidades absurdas (tope de 50 por producto)", () => {
    const r = validarPedido({
      ...pedidoValido,
      items: [{ productId: "abc-123", quantity: 999 }],
    });

    assert.equal(r.ok, false);
  });

  it("rechaza el mismo producto repetido", () => {
    // Si pasara, el total se calcularia sobre una sola de las lineas.
    const r = validarPedido({
      ...pedidoValido,
      items: [
        { productId: "abc-123", quantity: 1 },
        { productId: "abc-123", quantity: 1 },
      ],
    });

    assert.ok(!r.ok);
    assert.match(r.errores.join(" "), /repetido/);
  });

  it("rechaza items sin identificador", () => {
    const r = validarPedido({
      ...pedidoValido,
      items: [{ quantity: 1 }],
    });

    assert.equal(r.ok, false);
  });
});
