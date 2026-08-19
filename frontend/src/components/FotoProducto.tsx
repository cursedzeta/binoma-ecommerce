import { ANCHOS, imagenOptimizada, srcSetOptimizado } from "../lib/imagen";

type Uso = keyof typeof ANCHOS;

/**
 * Foto de producto, con dos cuidados que se repetían en todas las pantallas.
 *
 * Encaje: hay dos modos, y la diferencia es quién manda, si el marco o la foto.
 *
 * Por defecto manda el marco: la foto lo llena con `object-cover` y se recorta
 * lo que sobra. Es lo que necesitan la home y el catálogo, donde los recuadros
 * tienen que quedar parejos entre sí.
 *
 * Con `completa`, manda la foto: se dibuja con su proporción real y el marco
 * toma su alto. No hay recorte y tampoco quedan las bandas de relleno que deja
 * `object-contain`. Es para la ficha del producto, donde no hay ninguna grilla
 * que respetar y ver la pieza entera es lo único que importa.
 *
 * Foco: cuando hay recorte, decide qué parte de la foto sobrevive. Por defecto
 * el centro, que es lo que hace `object-cover` solo. Pero si el mueble está
 * fotografiado con aire arriba, centrar conserva ese aire y corta las patas: en
 * ese caso conviene correr el recorte hacia abajo.
 *
 * Peso: si la URL es de Cloudinary, se pide el tamaño justo para dónde se va a
 * mostrar. Si no lo es, se usa tal cual.
 */
export default function FotoProducto({
  src,
  alt,
  uso,
  prioridad = false,
  completa = false,
  foco = "object-center",
  className = "",
}: {
  src?: string;
  alt: string;
  uso: Uso;
  /** true solo para la imagen principal de la pantalla: no se difiere. */
  prioridad?: boolean;
  /** La foto define su propio alto en vez de encajar en el marco. */
  completa?: boolean;
  /** Qué parte se conserva al recortar. Clase `object-*` de Tailwind. */
  foco?: string;
  className?: string;
}) {
  if (!src) {
    // Sin fotografía, la textura de láminas del fenólico evita el rectángulo
    // gris vacío. Desaparece sola en cuanto se carga una imagen.
    return (
      <div
        aria-hidden="true"
        className={`w-full opacity-60 ${completa ? "aspect-4/3" : "h-full"} ${className}`}
        style={{
          backgroundImage:
            "repeating-linear-gradient(180deg, var(--color-borde) 0px, var(--color-borde) 3px, transparent 3px, transparent 12px)",
        }}
      />
    );
  }

  const anchos = ANCHOS[uso];

  return (
    <img
      src={imagenOptimizada(src, anchos[anchos.length - 1]!)}
      srcSet={srcSetOptimizado(src, [...anchos])}
      sizes={uso === "miniatura" ? "160px" : "(max-width: 640px) 100vw, 50vw"}
      alt={alt}
      loading={prioridad ? "eager" : "lazy"}
      className={`block w-full ${
        completa ? "h-auto" : `h-full object-cover ${foco}`
      } ${className}`}
    />
  );
}
