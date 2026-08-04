# binoma-api

API REST del e-commerce de **BINOMA** — muebles de diseño en fenólico, Córdoba, Argentina.

## Stack

Node.js + Express 5 + TypeScript · PostgreSQL (Neon) · Prisma 7 · Mercado Pago (pendiente) · Cloudinary (pendiente)

## Puesta en marcha

```bash
npm install
cp .env.example .env      # completar DATABASE_URL con la connection string de Neon
npm run db:migrate        # crea las tablas
npm run db:seed           # carga productos de prueba
npm run dev               # http://localhost:3000
```

## Scripts

| Script | Qué hace |
|---|---|
| `npm run dev` | Servidor en modo watch con tsx |
| `npm run build` | `prisma generate` + compilación a `dist/` |
| `npm start` | Corre el build (producción) |
| `npm run db:migrate` | Aplica migraciones de Prisma |
| `npm run db:seed` | Carga los productos de prueba |
| `npm run db:studio` | Explorador visual de la base |
| `npm run typecheck` | TypeScript sin emitir |

## Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/health` | Chequeo de estado |
| `GET` | `/api/products` | Lista de productos. Filtro opcional `?category=banco` |
| `GET` | `/api/products/:slug` | Detalle por slug |

## Convenciones

- **Precios**: enteros en pesos argentinos, sin centavos. `185000` = $185.000.
- **Slugs**: identifican el producto en las URLs públicas (`/producto/banco-fenolico-natural`).
- **Prisma 7**: la conexión va por driver adapter (`@prisma/adapter-pg`), no por la URL del schema. El cliente se genera en `src/generated/prisma` y no se commitea.

## Ramas

`main` (producción) · `dev` (integración) · `feature/*` (trabajo en curso)
