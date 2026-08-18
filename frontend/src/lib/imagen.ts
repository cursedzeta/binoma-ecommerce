/**
 * Optimización de imágenes de Cloudinary.
 *
 * Cloudinary transforma por URL: metiendo instrucciones después de /upload/
 * devuelve la versión que le pidas, sin que haya que subir varias veces la
 * misma foto. La genera la primera vez que alguien la pide y después la
 * cachea.
 *
 * Sin esto, una foto de 4000px y 8 MB se descarga entera para mostrarse en una
 * miniatura de 80 píxeles del carrito.
 */

/** Detecta una URL de Cloudinary y separa lo que va antes y después de /upload/ */
const CLOUDINARY = /^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload)\/(.*)$/;

/**
 * Devuelve la URL pidiendo el ancho justo.
 *
 * - `c_limit` achica si la foto es más grande que el ancho pedido, pero NUNCA
 *   recorta ni deforma: es la diferencia con `c_fill`, que rellena el recuadro
 *   cortando lo que sobra.
 * - `q_auto` elige la compresión justa mirando la imagen.
 * - `f_auto` manda AVIF o WebP según lo que soporte el navegador, y JPG en los
 *   viejos.
 *
 * Si la URL no es de Cloudinary —un placeholder, una foto alojada en otro
 * lado— se devuelve tal cual. Nada se rompe por no usar Cloudinary.
 */
export function imagenOptimizada(url: string, ancho: number): string {
  const partes = CLOUDINARY.exec(url);
  if (!partes) return url;

  const [, base, resto] = partes;

  // Si ya trae transformaciones puestas a mano, no las pisamos: alguien las
  // escribió por algo.
  if (/^[a-z]_[^/]*\//.test(resto!)) return url;

  return `${base}/w_${ancho},c_limit,q_auto,f_auto/${resto}`;
}

/**
 * Genera el srcset para que el navegador elija según la pantalla.
 *
 * Una pantalla Retina necesita el doble de píxeles que su tamaño en CSS. Sin
 * srcset habría que servir siempre el doble, y quien mira desde un teléfono
 * común descargaría el cuádruple de lo que necesita.
 */
export function srcSetOptimizado(url: string, anchos: number[]): string | undefined {
  if (!CLOUDINARY.test(url)) return undefined;
  return anchos.map((a) => `${imagenOptimizada(url, a)} ${a}w`).join(", ");
}

/** Anchos de referencia según dónde se muestre la imagen. */
export const ANCHOS = {
  miniatura: [160, 320],
  tarjeta: [480, 960],
  bloque: [800, 1600],
  ficha: [1000, 2000],
} as const;
