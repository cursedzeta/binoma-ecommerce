// Los precios llegan como enteros en pesos argentinos, sin centavos.
const formatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export function formatPrice(pesos: number) {
  return formatter.format(pesos);
}
