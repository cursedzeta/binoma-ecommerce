import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { generarSlug, validarProducto } from "../src/lib/validarProducto.js";

const productoValido = {
  name: "Mesa Ratona Fenólico",
  description: "Mesa baja de living en fenólico de 18mm.",
  price: 170000,
  category: "mesa",
  images: ["https://res.cloudinary.com/demo/mesa.jpg"],
  stock: 5,
};

describe("generarSlug", () => {
  it("saca los acentos sin comerse las letras", () => {
    // Este es el caso que nos rompió: un rango de caracteres mal escrito
    // borraba la n, la u y la o junto con sus tildes.
    assert.equal(generarSlug("Banquito Ñandú Fenólico"), "banquito-nandu-fenolico");
    assert.equal(generarSlug("Mesa Ratona Fenólico"), "mesa-ratona-fenolico");
  });

  it("junta los espacios y recorta los guiones de los extremos", () => {
    assert.equal(generarSlug("  Espacios   raros  "), "espacios-raros");
    assert.equal(generarSlug("--Mesa--"), "mesa");
  });

  it("conserva los números", () => {
    assert.equal(generarSlug("Mesa Comedor BINOMA 180"), "mesa-comedor-binoma-180");
  });

  it("descarta los símbolos", () => {
    assert.equal(generarSlug("Silla «Curva» 100% fenólico"), "silla-curva-100-fenolico");
  });
});

describe("validarProducto", () => {
  it("acepta un producto bien formado y le genera el slug", () => {
    const r = validarProducto(productoValido);

    assert.ok(r.ok);
    assert.equal(r.datos.slug, "mesa-ratona-fenolico");
    assert.equal(r.datos.price, 170000);
  });

  it("usa el slug que le manden, si viene", () => {
    const r = validarProducto({ ...productoValido, slug: "Otro Slug Distinto" });

    assert.ok(r.ok);
    assert.equal(r.datos.slug, "otro-slug-distinto");
  });

  it("normaliza la categoría", () => {
    // Sin esto, "Mesa" y "mesa" serían dos categorías distintas en los filtros.
    const r = validarProducto({ ...productoValido, category: "Mesas Ratonas" });

    assert.ok(r.ok);
    assert.equal(r.datos.category, "mesas-ratonas");
  });

  it("rechaza precios que no sean enteros positivos", () => {
    for (const price of [0, -100, 1500.5, "1000", null]) {
      const r = validarProducto({ ...productoValido, price });
      assert.equal(r.ok, false, `debería rechazar el precio: ${price}`);
    }
  });

  it("acepta stock 0 pero rechaza stock negativo", () => {
    // Stock 0 es válido: es como se saca un producto de la tienda sin borrarlo.
    assert.ok(validarProducto({ ...productoValido, stock: 0 }).ok);
    assert.equal(validarProducto({ ...productoValido, stock: -1 }).ok, false);
  });

  it("rechaza direcciones de imagen que no sean http o https", () => {
    // javascript: dentro de un src del catálogo público sería ejecutable.
    for (const url of ["javascript:alert(1)", "data:text/html,<script>", "no-es-una-url"]) {
      const r = validarProducto({ ...productoValido, images: [url] });
      assert.equal(r.ok, false, `debería rechazar: ${url}`);
    }
  });

  it("acepta que no vengan imágenes", () => {
    const r = validarProducto({ ...productoValido, images: undefined });

    assert.ok(r.ok);
    assert.deepEqual(r.datos.images, []);
  });

  it("junta todos los errores en vez de cortar en el primero", () => {
    const r = validarProducto({
      name: "",
      description: "",
      price: 0,
      category: "",
      stock: -1,
    });

    assert.ok(!r.ok);

    // Se listan los cinco campos, más el slug: sin nombre tampoco hay dirección
    // web posible. Comprobamos que estén todos en vez de contar, para que el
    // test no se rompa cada vez que se agregue un campo.
    const juntos = r.errores.join(" | ");
    for (const esperado of ["nombre", "descripción", "precio", "categoría", "stock"]) {
      assert.match(juntos, new RegExp(esperado, "i"), `falta el error de ${esperado}`);
    }
  });

  it("rechaza un nombre del que no sale ningún slug", () => {
    // "«»" no deja ninguna letra ni número: sin slug no hay URL posible.
    const r = validarProducto({ ...productoValido, name: "«»" });

    assert.equal(r.ok, false);
  });
});
