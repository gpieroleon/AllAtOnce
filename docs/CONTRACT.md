# Contrato API — All At Once (dev)

API REST en **http://localhost:3001** con prefijo global `/api`.
Auth por **JWT Bearer**. Roles: `cliente | admin | superadmin`.
Todas las respuestas en JSON. Errores: `{ "statusCode": n, "message": "..." }`.

Usuarios sembrados (mismas credenciales que la demo):

| Rol | Email | Password |
|---|---|---|
| cliente | demo@allatonce.com | AllAtOnce#2026 |
| admin | equipo@allatonce.com | Equipo2026! |
| superadmin | admin@allatonce.com | Admin2026! |

## Modelos (shape JSON)

```ts
User { id, name, email, role, phone?, reg }
Category { name, label, productCount }
Variant { talla?, color?, stock }
Product {
  id, name, slug, sku?, descCorta?, descLarga?,
  cat: string, cats: string[], etiquetas: string[],
  price, old, costo?, stock, variantes: Variant[], imagenes: string[],
  img: string,           // imagenes[0] o ""
  peso?, rating, reviews, badge: "flash"|"new"|"top"|null,
  prime: bool, deal: bool, estado: "publicado"|"borrador"|"agotado",
  specs: Record<string,string>, feats: string[],   // ficha técnica y bullets
  metaTitulo?, metaDescripcion?
}
Order {
  id: string,            // "AAO-XXXXXX"
  fecha: ISO,
  cliente: email|null, nombreCliente,
  items: [{ id, nombre, qty, precio, img }],
  subtotal, descuento, cupon: string|null, envio, total,
  direccion: { nombre, email, telefono, direccion, ciudad, provincia, cp, pais },
  pago: string, estado: string, tracking
}
Coupon { code, tipo: "pct"|"fijo", valor, descripcion }
Settings { tienda, iva, moneda, envioGratis, envioCoste }
ShipMethod { id, nombre, desc, precio, gratisDesde: number|null, extra, dias, activo }
PayMethod { id, nombre, desc, activo }
Review { name, rating, title, text, date, verified }
```

## Endpoints públicos

- `POST /api/auth/register` — `{name,email,password}` → 201 `{id,name,email,role:"cliente"}` (409 si existe)
- `POST /api/auth/login` — `{email,password}` → `{access_token, user}` (401 si mal)
- `GET  /api/auth/me` — (Bearer) → `User`
- `GET  /api/products` — query: `cat` (incl. `ofertas` = deal=true, `all`), `q`, `sort` (featured|rating|price-asc|price-desc|discount) → `Product[]` (solo publicados/agotados)
- `GET  /api/products/:idOrSlug` → `Product` (404 si no)
- `GET  /api/products/:id/reviews` → `{ avg, total, list: Review[] }`
- `GET  /api/categories` → `Category[]` (con productCount)
- `POST /api/coupons/validate` — `{code, subtotal}` → `{ok:true, code, label, amount}` o `{ok:false}`
- `GET  /api/settings` → `Settings`
- `GET  /api/shipping` → `ShipMethod[]` (activos)
- `GET  /api/payments` → `PayMethod[]` (activos)
- `POST /api/orders` — **guest o Bearer** `{ items:[{id,qty}], address:{...}, shippingId, paymentId, coupon? }` → `Order` (totales calculados en servidor: cupón, envío según método, IVA informativo). Estado: `Pendiente de pago` si pago="Contra reembolso" else `Pagado`. Genera `id` y `tracking`.

## Endpoints autenticados (cliente)

- `GET /api/orders/mine` → `Order[]` del usuario
- `GET /api/orders/:id` → `Order` (propio, o admin)

## Endpoints admin (`admin` o `superadmin`)

- `GET   /api/admin/stats` → métricas dashboard:
  `{ ventasHoy, ventasSemana, ventasMes, sales, pending, lowStock: Product[], newClients, top: [{product,qty}], last14: [{label,total}], byCat: Record<string,number>, ticket, validCount }`
- `GET   /api/admin/orders` — query `estado, desde, hasta, q` → `Order[]`
- `PATCH /api/admin/orders/:id` — `{estado?, tracking?}` → `Order`
- `GET   /api/admin/clients` → `[{ email, name, reg, orders, spent }]`
- `GET/POST /api/admin/clients/:email/notes` → notas internas `[{text,fecha}]`
- Productos CRUD: `POST /api/products`, `PATCH /api/products/:id`, `DELETE /api/products/:id` (altas/borran del todo; borrador oculta del público). Bulk: `PATCH /api/products/bulk {ids, patch}`.
- `PATCH /api/admin/products/:id/stock` — `{stock}` (inventario)
- Cupones: `GET/POST/DELETE /api/admin/coupons(/:code)`
- Reseñas: `GET /api/admin/reviews?productId=` → `{ list, hidden }`; `PUT /api/admin/reviews/hide {productId, indexes}`

## Endpoints superadmin

- `PATCH /api/admin/users/:email/role` — `{role}`
- `POST  /api/admin/users` — `{name,email,role,password}`
- `DELETE /api/admin/users/:email` (no auto-borrado; nunca dejar 0 superadmins)
- `PUT   /api/settings` / `PUT /api/shipping` / `PUT /api/payments`
- Regla: no se puede degradar/eliminar al último superadmin.

## Semilla (seed)

12 productos (catálogo de la demo), 5 categorías, cupones `AAO10` (pct 10) y `FLASH20` (pct 20), métodos de envío/pago por defecto, settings por defecto (iva 21, envío gratis ≥ 75, estándar 4.99), reviews generadas deterministas por producto (mismo algoritmo que la demo) + tabla de moderación.

## Stack y comandos

- NestJS 10 + TypeScript, Prisma + SQLite (`api/prisma/dev.db`), class-validator, JWT, bcryptjs, helmet, CORS abierto a `http://localhost:3000`.
- Comandos: `npm install` → `npx prisma migrate dev` → `npm run seed` → `npm run start:dev` (puerto 3001).
- Debe incluir tests e2e mínimos (auth + flujo de pedido) ejecutables con `npm run test:e2e`.
