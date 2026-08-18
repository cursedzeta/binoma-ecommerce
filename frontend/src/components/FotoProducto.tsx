import { ANCHOS, imagenOptimizada, srcSetOptimizado } from "../lib/imagen";

type Uso = keyof typeof ANCHOS;

/**
 * Foto de producto, con dos cuidados que se repetían en todas las pantallas.
 *
 * Encaje: la imagen entra completa, sin recortarse. Un mueble fotografiado
 * vertical dentro de un recuadro horizontal quedaba cortado por la mitad. Con
 * `object-contain` sobre un fondo neutro se ve entero, y las bandas laterales
 * leen como el fondo del estudio, no como un error.
 *
 * Peso: si la URL es de Cloudinary, se pide el tamaño justo para dónde se va a
 * mostrar. Si no lo es, se usa tal cual.
 */
export default function FotoProducto({
  src,
  alt,
  uso,
  prioridad = false,
  className = "",
}: {
  src?: string;
  alt: string;
  uso: Uso;
  /** true solo para la imagen principal de la pantalla: no se difiere. */
  prioridad?: boolean;
  className?: string;
}) {
  if (!src) {
    // Sin fotografía, la textura de láminas del fenólico evita el rectángulo
    // gris vacío. Desaparece sola en cuanto se carga una imagen.
    return (
      <div
        aria-hidden="true"
        className={`h-full w-full opacity-60 ${className}`}
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
      className={`h-full w-full object-contain ${className}`}
    />
  );
}
