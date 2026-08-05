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
| Hosting | Vercel (frontend) + Railway (backend) |

## Ramas

`main` (producción) · `dev` (integración) · `feature/*` (trabajo en curso)

## Estado

| Sprint | Estado |
|---|---|
| 1. Setup y modelo de datos | ✅ |
| 2. Catálogo de productos | ✅ |
| 3. Carrito de compras | ⬜ |
| 4. Checkout + Mercado Pago | ⬜ |
| 5. Panel de administración | ⬜ |
| 6. Cross-promoción Zeta3 | ⬜ |
| 7. Deploy y pruebas finales | ⬜ |
