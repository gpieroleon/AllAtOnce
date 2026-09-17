# All At Once — rama `dev` (migración Next.js + NestJS)

Migración full-stack de la demo estática, para comparar arquitecturas antes de
decidir si reemplaza a `main`.

## Arquitectura

```
├── api/         ← NestJS 10 + Prisma + SQLite  (http://localhost:3001/api)
└── storefront/  ← Next.js 14 App Router + Tailwind (http://localhost:3000)
```

Contrato de la API: [`docs/CONTRACT.md`](docs/CONTRACT.md). La demo vanilla
original sigue en la raíz del repo (funciona igual, datos en localStorage).

## Puesta en marcha

```bash
# 1. API
cd api
npm install
npx prisma migrate dev
npm run seed
npm run start:dev        # :3001

# 2. Storefront (en otra terminal)
cd storefront
npm install
npm run dev              # :3000  (o `npm run build && npm run start`)
```

## Verificación ya ejecutada

- API: `npm run build` OK · `npm run test:e2e` 6/6 · smoke real: 12 productos,
  login JWT, cupón AAO10 (−18 €), pedido guest 2×Nova X → total **161,98 €**
  calculado en servidor, guard de roles (cliente → 403 en `/admin/stats`).
- Storefront: `npm run build` OK (16 rutas) · `next lint` limpio · las 15 rutas
  responden 200 con la API real levantada.

## Credenciales (seed)

| Rol | Email | Contraseña |
|---|---|---|
| Cliente | `demo@allatonce.com` | `AllAtOnce#2026` |
| Admin | `equipo@allatonce.com` | `Equipo2026!` |
| Superadmin | `admin@allatonce.com` | `Admin2026!` |

Cupones: `AAO10` (-10%) · `FLASH20` (-20%).

## Diferencias con `main` (demo vanilla)

| | `main` (vanilla) | `dev` (Next + Nest) |
|---|---|---|
| Datos | localStorage del navegador | SQLite + API REST (Prisma) |
| Auth | base64 en localStorage | JWT + bcrypt + guards de roles |
| Totales de pedido | calculados en el navegador (manipulables) | calculados en el servidor |
| Páginas | 17 archivos HTML estáticos | 16 rutas App Router (React) |
| Estado | JS suelto por página | Contextos (Cart/Auth), tipado TS |
| Build | ninguno | `next build` + `nest build` |

## Pendiente de decisión

Ver informe comparativo en la conversación / issue antes de mergear a `main`.
No mergear sin revisión visual.
