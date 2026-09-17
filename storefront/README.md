# All At Once — Storefront

Storefront Next.js 14 (App Router) + TypeScript + Tailwind CSS que consume la API del
contrato (`/Users/gpieroleon/all-at-once/docs/CONTRACT.md`).

## Arranque

```bash
npm install
npm run build     # o npm run dev para desarrollo
NEXT_PUBLIC_API_URL=http://localhost:3001/api npm run start
```

`NEXT_PUBLIC_API_URL` por defecto: `http://localhost:3001/api`.

## Decisiones tomadas

- **Carrito (`localStorage "aao_cart"`)**: objeto JSON `{ [idProducto: string]: cantidad }`,
  p. ej. `{ "1": 2, "7": 1 }`. Se eligió objeto por búsqueda O(1) y serialización directa.
- **Wishlist**: `"aao_wishlist"`, array de ids numéricos.
- **Auth**: JWT en `"aao_token"`, usuario en `"aao_user"`. `AuthContext` valida el token con
  `GET /auth/me` al montar. Separación total de logins:
  - `/login` es **solo para clientes**: si la API devuelve `role !== "cliente"`, se revoca la
    sesión al instante y se muestra "Esta cuenta es del equipo. Usa el acceso de administración."
    sin salir de la página (la API solo revela el rol tras autenticar, así que el rechazo ocurre
    en el flujo email → contraseña).
  - `/admin/login` es el acceso del equipo (diseño `.adm-login` oscuro de la demo): acepta solo
    `admin`/`superadmin`; un cliente recibe "Credenciales de administrador no válidas." sin sesión.
  - `/admin` sin sesión de staff → redirect a `/admin/login` (también con sesión de cliente).
  - Con sesión de staff en `/login` → redirect a `/admin`.
- **Fetch server vs client**: todo el fetching de datos es **cliente** (páginas con
  `"use client"` + `fetch` en efectos). Las rutas dinámicas que dependen de params/buscan
  datos exportan `export const dynamic = "force-dynamic"` para evitar prerender estático roto.
- **Confirmación de pedido guest**: `GET /orders/:id` solo devuelve pedidos propios o de
  admin; el pedido recién creado se guarda en `sessionStorage "aao_last_order"` y se usa
  como fallback cuando la API no lo expone.
- **Cupón**: al validarse en `/carrito` se guarda en `"aao_coupon"` para que `/checkout`
  lo incluya en `POST /orders`.
- **Panel admin**: ruta única `/admin?sec=<sección>` con navegación por query param.
  Sidebar filtrada por rol: `admin` no ve Reportes/Envíos/Pagos/Configuración/Usuarios;
  cualquier 403 de la API muestra el aviso "Sin permiso".
- **Categorías del admin**: la API no expone CRUD de categorías en el contrato; el intento
  de escritura va a `/admin/categories` y si responde 404 se guarda en localStorage
  (`"aao_categories_custom"`) indicándolo en pantalla.
- **Estilos**: `src/app/globals.css` importa los CSS de la demo (`src/styles/demo/`,
  copia de referencia, no del raíz) + capa Tailwind; fuentes Space Grotesk e Inter vía
  `next/font/google`. Las imágenes de producto usan el componente `CoverImg`
  (`position:absolute; inset:0; object-fit:cover` + `onError` que las oculta para
  mostrar el degradado de fondo); el shelf de categorías fuerza celdas cuadradas con
  `aspect-ratio: 1/1`.

## Estructura

- `src/app/*` — rutas (home, login, recuperar, categoria/[cat], producto/[id], carrito,
  checkout, confirmacion, cuenta, favoritos, buscar, contacto, sobre-nosotros, politicas, admin).
- `src/components/*` — componentes por dominio (storefront + `admin/` con las secciones).
- `src/context/*` — `ToastContext`, `AuthContext`, `CartContext` (carrito + wishlist + badge),
  `Providers`.
- `src/lib/*` — `api.ts` (cliente HTTP), `types.ts` (contrato), `format.ts`, `storage.ts`.
