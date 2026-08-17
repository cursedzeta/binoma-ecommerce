// Validacion de productos para el panel de administracion.
//
// A diferencia de validarPedido, aca el que manda los datos es el dueño del
// negocio, no un desconocido. Igual se valida todo: un precio en cero o un slug
// repetido rompen la tienda para los clientes, y el error se descubre tarde.

export type DatosProducto = {
  slug: string;
  name: string;
  description: string;
  price: number;
  category: string;
  images: string[];
  stock: number;
};

export type ResultadoValidacion =
  | { ok: true; datos: DatosProducto }
  | { ok: false; errores: string[] };

const MAX_PRECIO = 100_000_000; // cien millones de pesos
const MAX_STOCK = 10_000;
const MAX_IMAGENES = 8;

/**
 * Convierte "Mesa Ratona Fenólico" en "mesa-ratona-fenolico".
 *
 * El slug va en la URL del producto, asi que no puede tener acentos, espacios
 * ni simbolos. Se genera del nombre para que el dueño no tenga que pensarlo.
 */
export function generarSlug(texto: string): string {
  return texto
    .normalize("NFD") // separa la letra de su acento: "ó" pasa a ser "o" + tilde
    // Y descarta las marcas diacriticas. Usamos la propiedad unicode Diacritic
    // en vez de un rango de caracteres: un rango escrito con acentos literales
    // se interpreta mal y termina borrando letras normales.
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function textoNoVacio(valor: unknown): valor is string {
  return typeof valor === "string" && valor.trim().length > 0;
}

function esEnteroEntre(valor: unknown, min: number, max: number): valor is number {
  return typeof valor === "number" && Number.isInteger(valor) && valor >= min && valor <= max;
}

// Aceptamos solo http(s). Sin esto, una URL con javascript: se guardaria en la
// base y terminaria dentro de un atributo src del catalogo publico.
function esUrlDeImagen(valor: unknown): valor is string {
  if (typeof valor !== "string" || !valor.trim()) return false;

  try {
    const url = new URL(valor.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function validarProducto(body: unknown): ResultadoValidacion {
  const errores: string[] = [];

  if (typeof body !== "object" || body === null) {
    return { ok: false, errores: ["El cuerpo tiene que ser un objeto"] };
  }

  const { name, description, price, category, images, stock, slug } = body as Record<
    string,
    unknown
  >;

  if (!textoNoVacio(name)) {
    errores.push("El nombre es obligatorio");
  }

  if (!textoNoVacio(description)) {
    errores.push("La descripción es obligatoria");
  }

  if (!esEnteroEntre(price, 1, MAX_PRECIO)) {
    errores.push("El precio tiene que ser un número entero de pesos, sin centavos");
  }

  if (!textoNoVacio(category)) {
    errores.push("La categoría es obligatoria");
  }

  if (!esEnteroEntre(stock, 0, MAX_STOCK)) {
    errores.push(`El stock tiene que ser un número entero entre 0 y ${MAX_STOCK}`);
  }

  let imagenes: string[] = [];

  if (images !== undefined) {
    if (!Array.isArray(images)) {
      errores.push("Las imágenes tienen que ser una lista");
    } else if (images.length > MAX_IMAGENES) {
      errores.push(`No se pueden cargar más de ${MAX_IMAGENES} imágenes`);
    } else {
      const invalidas = images.filter((i) => !esUrlDeImagen(i));
      if (invalidas.length > 0) {
        errores.push("Hay imágenes cuya dirección no es válida");
      }
      imagenes = images.filter(esUrlDeImagen).map((i) => i.trim());
    }
  }

  // El slug se puede mandar a mano, pero lo normal es que salga del nombre.
  const slugFinal = textoNoVacio(slug)
    ? generarSlug(slug)
    : textoNoVacio(name)
      ? generarSlug(name)
      : "";

  if (!slugFinal) {
    errores.push("No se pudo generar una dirección web a partir del nombre");
  }

  if (errores.length > 0) {
    return { ok: false, errores };
  }

  return {
    ok: true,
    datos: {
      slug: slugFinal,
      name: (name as string).trim(),
      description: (description as string).trim(),
      price: price as number,
      category: generarSlug(category as string),
      images: imagenes,
      stock: stock as number,
    },
  };
}
