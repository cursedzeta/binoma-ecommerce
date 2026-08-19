/**
 * La dirección web del producto, generada a partir de su nombre.
 *
 *   "Banqueta FenoMilo Ñandú"  ->  "banqueta-fenomilo-nandu"
 *
 * Es una copia de `generarSlug` del backend, y la copia es a propósito: acá
 * sirve para mostrar en vivo cómo va a quedar la dirección mientras se escribe.
 * El backend vuelve a normalizar lo que le llegue, así que **manda él**: si
 * alguien escribe el slug con acentos, o llama a la API sin pasar por el panel,
 * igual queda limpio.
 *
 * Las dos tienen que dar el mismo resultado. Si se cambia una, se cambia la
 * otra: `backend/src/lib/validarProducto.ts`.
 */

/** Lo común a las dos: sin acentos, en minúsculas, y guiones en vez de símbolos. */
function normalizar(texto: string): string {
  return (
    texto
      // Separa la letra de su acento: "ó" pasa a ser "o" + tilde, "ñ" a "n" + ~
      .normalize("NFD")
      // Y descarta las marcas. Se usa la propiedad unicode Diacritic en vez de
      // un rango de caracteres: un rango escrito con acentos literales se
      // interpreta mal y termina borrando letras normales.
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase()
      // Todo lo que no sea letra sin acento o número pasa a ser un guion: los
      // espacios, pero también comas, paréntesis y símbolos.
      .replace(/[^a-z0-9]+/g, "-")
      .slice(0, 80)
  );
}

/** El slug definitivo, sin guiones sueltos en las puntas. */
export function generarSlug(texto: string): string {
  return normalizar(texto).replace(/^-+|-+$/g, "");
}

/**
 * El slug mientras alguien lo escribe a mano.
 *
 * Igual al anterior pero conservando el guion del final, que es la diferencia
 * entre poder escribir y no poder. Con `generarSlug`, al teclear "banco " el
 * espacio se convierte en guion y el guion se borra por estar al final: la
 * siguiente letra se pega y sale "bancohexagonal".
 *
 * El guion suelto se limpia al salir del campo.
 */
export function slugEnProgreso(texto: string): string {
  return normalizar(texto).replace(/^-+/, "");
}
