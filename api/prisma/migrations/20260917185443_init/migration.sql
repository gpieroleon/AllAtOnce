-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'cliente',
    "phone" TEXT,
    "reg" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Product" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "sku" TEXT,
    "descCorta" TEXT,
    "descLarga" TEXT,
    "cat" TEXT NOT NULL,
    "cats" TEXT NOT NULL DEFAULT '[]',
    "etiquetas" TEXT NOT NULL DEFAULT '[]',
    "price" REAL NOT NULL,
    "old" REAL NOT NULL,
    "costo" REAL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "variantes" TEXT NOT NULL DEFAULT '[]',
    "imagenes" TEXT NOT NULL DEFAULT '[]',
    "peso" REAL,
    "rating" REAL NOT NULL DEFAULT 0,
    "reviews" INTEGER NOT NULL DEFAULT 0,
    "badge" TEXT,
    "prime" BOOLEAN NOT NULL DEFAULT false,
    "deal" BOOLEAN NOT NULL DEFAULT false,
    "estado" TEXT NOT NULL DEFAULT 'publicado',
    "specs" TEXT NOT NULL DEFAULT '{}',
    "feats" TEXT NOT NULL DEFAULT '[]',
    "metaTitulo" TEXT,
    "metaDescripcion" TEXT,
    "icon" TEXT,
    "g" TEXT NOT NULL DEFAULT '[]'
);

-- CreateTable
CREATE TABLE "Category" (
    "name" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT NOT NULL,
    "icon" TEXT,
    "g" TEXT NOT NULL DEFAULT '[]'
);

-- CreateTable
CREATE TABLE "Coupon" (
    "code" TEXT NOT NULL PRIMARY KEY,
    "tipo" TEXT NOT NULL,
    "valor" REAL NOT NULL,
    "descripcion" TEXT
);

-- CreateTable
CREATE TABLE "ShipMethod" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "desc" TEXT NOT NULL,
    "precio" REAL NOT NULL,
    "gratisDesde" REAL,
    "extra" REAL NOT NULL DEFAULT 0,
    "dias" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "PayMethod" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "desc" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "Setting" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tienda" TEXT NOT NULL,
    "iva" REAL NOT NULL,
    "moneda" TEXT NOT NULL,
    "envioGratis" REAL NOT NULL,
    "envioCoste" REAL NOT NULL
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fecha" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clienteEmail" TEXT,
    "nombreCliente" TEXT NOT NULL,
    "items" TEXT NOT NULL,
    "subtotal" REAL NOT NULL,
    "descuento" REAL NOT NULL,
    "cupon" TEXT,
    "envio" REAL NOT NULL,
    "total" REAL NOT NULL,
    "iva" REAL NOT NULL,
    "direccion" TEXT NOT NULL,
    "pago" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "tracking" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "ReviewHidden" (
    "productId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "indexes" TEXT NOT NULL DEFAULT '[]'
);

-- CreateTable
CREATE TABLE "ClientNote" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "fecha" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");
