// Tipos del contrato API — docs/CONTRACT.md

export type Role = "cliente" | "admin" | "superadmin";

export interface User {
  id: number | string;
  name: string;
  email: string;
  role: Role;
  phone?: string;
  reg?: string;
}

export interface Category {
  name: string;
  label: string;
  productCount: number;
}

export interface Variant {
  talla?: string;
  color?: string;
  stock: number;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  sku?: string;
  descCorta?: string;
  descLarga?: string;
  cat: string;
  cats: string[];
  etiquetas: string[];
  price: number;
  old: number;
  costo?: number;
  stock: number;
  variantes: Variant[];
  imagenes: string[];
  img: string;
  peso?: number;
  rating: number;
  reviews: number;
  badge: "flash" | "new" | "top" | null;
  prime: boolean;
  deal: boolean;
  estado: "publicado" | "borrador" | "agotado";
  specs: Record<string, string>;
  feats: string[];
  metaTitulo?: string;
  metaDescripcion?: string;
}

export interface OrderItem {
  id: number;
  nombre: string;
  qty: number;
  precio: number;
  img: string;
}

export interface Address {
  nombre: string;
  email: string;
  telefono: string;
  direccion: string;
  ciudad: string;
  provincia: string;
  cp: string;
  pais: string;
}

export interface Order {
  id: string;
  fecha: string;
  cliente: string | null;
  nombreCliente: string;
  items: OrderItem[];
  subtotal: number;
  descuento: number;
  cupon: string | null;
  envio: number;
  total: number;
  direccion: Address;
  pago: string;
  estado: string;
  tracking: string;
}

export interface Coupon {
  code: string;
  tipo: "pct" | "fijo";
  valor: number;
  descripcion: string;
}

export interface Settings {
  tienda: string;
  iva: number;
  moneda: string;
  envioGratis: number;
  envioCoste: number;
}

export interface ShipMethod {
  id: string;
  nombre: string;
  desc: string;
  precio: number;
  gratisDesde: number | null;
  extra: number;
  dias: number;
  activo: boolean;
}

export interface PayMethod {
  id: string;
  nombre: string;
  desc: string;
  activo: boolean;
}

export interface Review {
  name: string;
  rating: number;
  title: string;
  text: string;
  date: string;
  verified: boolean;
}

export interface ReviewsResponse {
  avg: number;
  total: number;
  list: Review[];
}

export interface AdminStats {
  ventasHoy: number;
  ventasSemana: number;
  ventasMes: number;
  sales: number;
  pending: number;
  lowStock: Product[];
  newClients: number;
  top: { product: string; qty: number }[];
  last14: { label: string; total: number }[];
  byCat: Record<string, number>;
  ticket: number;
  validCount?: number;
}

export interface AdminClient {
  email: string;
  name: string;
  reg: string;
  orders: number;
  spent: number;
}

export interface ClientNote {
  text: string;
  fecha: string;
}

export interface AdminReviews {
  list: Review[];
  hidden: number[];
}

export interface CouponValidation {
  ok: boolean;
  code?: string;
  label?: string;
  amount?: number;
}
