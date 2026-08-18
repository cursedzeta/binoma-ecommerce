import { ANCHOS, imagenOptimizada, srcSetOptimizado } from "../lib/imagen";

type Uso = keyof typeof ANCHOS;

/**
 * Foto de producto, con dos cuidados que se repetían en todas las pantallas.
 *
 * Encaje: la foto llena el marco con `object-cover`, recortando lo que sobra.
 * Se probó dejarla entera con `object-contain`, pero las bandas que quedaban a
 * los costados se leían como un marco alrededor de la imagen y ensuciaban la
 * pieza. Entre recortar y ese borde, se eligió recortar.
 *
 * Queda pendiente resolverlo mejor: lo natural sería normalizar el encuadre de
 * las fotos al cargarlas, no arreglarlo con una clase de CSS.
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
      className={`h-full w-full object-cover ${className}`}
    />
  );
}
