# All At Once

E-commerce de demostración — tecnología, moda, hogar, belleza y accesorios con ofertas flash, envío exprés y panel de administración.

## Rama `main` — Demo estática (vanilla)

Sitio completo en **HTML + CSS + JavaScript** sin frameworks ni build. Los datos viven en `localStorage` (usuarios, pedidos, carrito, cupones).

### Ejecutar

```bash
python3 -m http.server 8000
# http://localhost:8000
```

### Credenciales de demo

| Rol | Email | Contraseña | Entrada |
|---|---|---|---|
| Cliente | `demo@allatonce.com` | `AllAtOnce#2026` | `/login.html` |
| Admin | `equipo@allatonce.com` | `Equipo2026!` | `/admin.html` |
| Superadmin | `admin@allatonce.com` | `Admin2026!` | `/admin.html` |

Cupones: `AAO10` (-10%), `FLASH20` (-20%).

### Estructura

```
├── index.html          ← home (carrusel, shelf, ofertas, grid)
├── categoria.html      ← secciones: ofertas y 5 categorías (?cat=)
├── producto.html       ← ficha (galería, variantes, reviews, comprados juntos)
├── carrito.html · checkout.html · confirmacion.html
├── cuenta.html         ← panel del cliente (pedidos, direcciones, datos)
├── login.html · recuperar.html · favoritos.html · buscar.html
├── contacto.html · sobre-nosotros.html · politicas.html
├── admin.html          ← panel admin (13 secciones, roles admin/superadmin)
├── css/                ← styles, auth, producto, paginas, admin
└── js/                 ← catalog, main, auth, login, admin, categoria,
                          producto, carrito, checkout, cuenta, favoritos, buscar
```

## Rama `dev` — Migración a Next.js + NestJS

Arquitectura full-stack en desarrollo para comparar con la demo estática:

- **Next.js** (storefront + panel admin) en `storefront/`
- **NestJS** (API REST + Prisma/SQLite) en `api/`

Ver `README.md` de la rama `dev` para instrucciones.
