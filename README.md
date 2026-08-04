# binoma-web

Tienda online de **BINOMA** — muebles de diseño en fenólico. Córdoba, Argentina.

## Stack

React 19 + Vite + TypeScript · Tailwind CSS v4 · React Router

## Puesta en marcha

Necesita el backend ([binoma-api](https://github.com/cursedzeta/binoma-api)) corriendo en el puerto 3000.

```bash
npm install
cp .env.example .env   # VITE_API_URL apunta al backend
npm run dev            # http://localhost:5173
```

## Rutas

| Ruta | Página |
|---|---|
| `/` | Catálogo con grilla y filtro por categoría |
| `/producto/:slug` | Detalle de producto |

## Estado del diseño

**Wireframe funcional.** Grises neutros y tipografía del sistema, a propósito: la
identidad visual de BINOMA se define más adelante, una vez que el flujo de compra
funcione de punta a punta.

## Convenciones

- Los precios llegan de la API como enteros en pesos argentinos y se formatean con
  `Intl.NumberFormat("es-AR")` en [src/lib/format.ts](src/lib/format.ts).
- La API pública no expone `priceRetail` (lista mayorista).
- Los productos se identifican por `slug` en las URLs, no por id.

## Ramas

`main` (producción) · `dev` (integración) · `feature/*` (trabajo en curso)
