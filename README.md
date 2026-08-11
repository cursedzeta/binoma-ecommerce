# BINOMA E-commerce

Tienda online de **BINOMA** — muebles de diseño en fenólico. Córdoba, Argentina.

## Estructura

```
binoma-ecommerce/
├── backend/     API REST — Node + Express + Prisma + PostgreSQL (Neon)
└── frontend/    Tienda — React + Vite + TypeScript + Tailwind
```

Cada carpeta tiene su propio README con el detalle.

## Levantar el proyecto

Hacen falta **dos terminales**, una por servicio.

```bash
# Terminal 1 — API en http://localhost:3000
cd backend
npm install
cp .env.example .env      # completar DATABASE_URL con la connection string de Neon
npx prisma migrate deploy
npm run db:seed
npm run dev

# Terminal 2 — Tienda en http://localhost:5173
cd frontend
npm install
cp .env.example .env
npm run dev
```

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | React + Vite + TypeScript + Tailwind |
| Backend | Node.js + Express |
| Base de datos | PostgreSQL en Neon |
| ORM | Prisma |
| Pagos | Mercado Pago |
| Imágenes | Cloudinary |
| Hosting | Vercel (frontend) + Render (backend) |

## Panel de administración

En `/admin`. Credenciales en el `.env` del backend; el hash se genera con:

```bash
cd backend
npm run admin:hash -- "tu contraseña"
```

## Deploy

### Backend en Render

Servicio web con **Root Directory** `backend`. Los comandos y las variables
están en [backend/render.yaml](backend/render.yaml).

```
Build:  npm ci && npx prisma migrate deploy && npm run build
Start:  npm start
Health: /api/health
```

Las variables con secretos se cargan a mano en el panel de Render.

### Frontend en Vercel

Proyecto con **Root Directory** `frontend`. Vercel detecta Vite solo. Una única
variable de entorno:

```
VITE_API_URL = https://binoma-api.onrender.com
```

[frontend/vercel.json](frontend/vercel.json) redirige todas las rutas a
`index.html`: sin eso, recargar `/admin` o `/producto/algo` daría 404, porque
esos archivos no existen — las rutas las resuelve React en el navegador.

### Después de desplegar

1. En Render, `CORS_ORIGIN` con los dominios del frontend separados por coma
2. En Render, `PUBLIC_WEB_URL` y `PUBLIC_API_URL` con las URLs reales
3. En Mercado Pago, el webhook apuntando a `PUBLIC_API_URL/api/webhooks/mercadopago`
4. Recién ahí, credenciales productivas de Mercado Pago

> El plan gratuito de Render duerme el servicio a los 15 minutos sin uso y tarda
> cerca de un minuto en despertar. La primera visita después de un rato de calma
> va a esperar, y un webhook de Mercado Pago puede vencer (tiene 22 segundos de
> límite). No se pierde ninguna venta: la reconciliación confirma el pedido en la
> siguiente pasada.

## Ramas

`main` (producción) · `dev` (integración) · `feature/*` (trabajo en curso)

## Estado

| Sprint | Estado |
|---|---|
| 1. Setup y modelo de datos | ✅ |
| 2. Catálogo de productos | ✅ |
| 3. Carrito de compras | ✅ |
| 4. Checkout + Mercado Pago | ✅ |
| 5. Panel de administración | 🟡 pedidos sí; ABM de productos y Cloudinary pendientes |
| 6. Cross-promoción Zeta3 | ⬜ |
| 7. Deploy y pruebas finales | 🟡 configuración lista, falta desplegar |
