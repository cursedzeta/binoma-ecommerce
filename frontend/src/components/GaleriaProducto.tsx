import { useState } from "react";
import FotoProducto from "./FotoProducto";

/**
 * Galería de la ficha: una foto grande y la lista de miniaturas al costado.
 *
 * Antes las fotos iban apiladas una debajo de otra, y para ver la tercera
 * había que scrollear la ficha entera, perdiendo de vista el precio y el botón
 * de comprar. Con la lista al costado se cambia de foto sin moverse.
 *
 * En mobile la lista pasa abajo y en horizontal: al costado se comería el
 * ancho, que es justo lo que la foto necesita.
 */
export default function GaleriaProducto({
  imagenes,
  nombre,
}: {
  imagenes: string[];
  nombre: string;
}) {
  const [activa, setActiva] = useState(0);

  // Si el producto no tiene fotos, igual mostramos el marco con la textura:
  // un hueco vacío se lee como que la página se rompió.
  if (imagenes.length === 0) {
    return (
      <div className="aspect-4/3 overflow-hidden rounded-pieza bg-superficie-2">
        <FotoProducto alt="" uso="ficha" />
      </div>
    );
  }

  const hayVarias = imagenes.length > 1;

  return (
    <div className="flex flex-col gap-4 sm:flex-row-reverse">
      {/* row-reverse en el marcado: la foto grande va primero en el orden de
          lectura, que es lo que importa para un lector de pantalla, pero se
          dibuja a la derecha de las miniaturas. */}
      <div className="flex-1 overflow-hidden rounded-pieza bg-superficie-2">
        <div className="aspect-4/3">
          <FotoProducto
            src={imagenes[activa]}
            alt={`${nombre} — imagen ${activa + 1} de ${imagenes.length}`}
            uso="ficha"
            prioridad
          />
        </div>
      </div>

      {hayVarias && (
        <div
          role="tablist"
          aria-label={`Fotos de ${nombre}`}
          className="flex shrink-0 gap-3 overflow-x-auto sm:flex-col sm:overflow-visible"
        >
          {imagenes.map((src, i) => (
            <button
              key={src}
              type="button"
              role="tab"
              aria-selected={i === activa}
              aria-label={`Ver imagen ${i + 1}`}
              onClick={() => setActiva(i)}
              className={`h-16 w-16 shrink-0 overflow-hidden rounded-pieza border bg-superficie-2 transition sm:h-20 sm:w-20 ${
                i === activa
                  ? "border-marca"
                  : "border-borde opacity-70 hover:opacity-100"
              }`}
            >
              <FotoProducto src={src} alt="" uso="miniatura" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
