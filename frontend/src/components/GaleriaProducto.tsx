import FotoProducto from "./FotoProducto";

/**
 * Las fotos de la ficha, apiladas una debajo de la otra.
 *
 * Acá la foto manda: es la pantalla donde alguien decide si gasta $170.000, y
 * para eso tiene que ver la pieza entera, no un recorte. Por eso cada imagen
 * va con su proporción real y es el marco el que se adapta a ella —al revés
 * que en la home o el catálogo, donde la grilla necesita recuadros parejos y
 * el recorte es el precio a pagar por eso.
 *
 * Que el marco se adapte es lo que evita las dos cosas malas a la vez: no hay
 * recorte, y tampoco quedan las bandas de relleno que aparecen cuando se mete
 * una foto vertical en un recuadro horizontal.
 *
 * La columna de la derecha queda fija mientras se recorre esta pila, así el
 * precio y el botón de comprar nunca se van de la pantalla.
 */
export default function GaleriaProducto({
  imagenes,
  nombre,
}: {
  imagenes: string[];
  nombre: string;
}) {
  // Sin fotos igual mostramos un marco con la textura: un hueco vacío se lee
  // como que la página se rompió.
  if (imagenes.length === 0) {
    return (
      <div className="aspect-4/3 overflow-hidden rounded-pieza bg-superficie-2">
        <FotoProducto alt="" uso="ficha" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {imagenes.map((src, i) => (
        <figure key={src} className="overflow-hidden rounded-pieza bg-superficie-2">
          <FotoProducto
            src={src}
            alt={i === 0 ? nombre : `${nombre}, vista ${i + 1}`}
            uso="ficha"
            completa
            // Solo la primera se carga de entrada: es la única que se ve sin
            // scrollear. Las demás esperan a que alguien baje.
            prioridad={i === 0}
          />
        </figure>
      ))}
    </div>
  );
}
