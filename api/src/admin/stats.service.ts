import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { serializeProduct } from '../products/products.service';

const DAY = 24 * 60 * 60 * 1000;
const startOfDay = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate());

export interface AdminStats {
  ventasHoy: number;
  ventasSemana: number;
  ventasMes: number;
  sales: number;
  pending: number;
  lowStock: ReturnType<typeof serializeProduct>[];
  newClients: number;
  top: { product: string; qty: number }[];
  last14: { label: string; total: number }[];
  byCat: Record<string, number>;
  ticket: number;
  validCount: number;
}

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(): Promise<AdminStats> {
    const [orders, products, clients] = await Promise.all([
      this.prisma.order.findMany(),
      this.prisma.product.findMany({ orderBy: { id: 'asc' } }),
      this.prisma.user.findMany({ where: { role: 'cliente' } }),
    ]);

    const now = new Date();
    const today = startOfDay(now).getTime();
    const weekAgo = today - 6 * DAY;
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    const inRange = (o: { fecha: Date }, from: number, to: number) => {
      const t = o.fecha.getTime();
      return t >= from && t < to;
    };
    const sum = (list: { total: number }[]) =>
      Math.round(list.reduce((s, o) => s + o.total, 0) * 100) / 100;

    const ventasHoy = sum(orders.filter((o) => inRange(o, today, today + DAY)));
    const ventasSemana = sum(
      orders.filter((o) => inRange(o, weekAgo, today + DAY)),
    );
    const ventasMes = sum(
      orders.filter((o) => inRange(o, monthStart, today + DAY)),
    );
    const sales = sum(orders);
    const pending = orders.filter(
      (o) => o.estado === 'Pendiente de pago',
    ).length;
    const lowStock = products.filter((p) => p.stock < 60).map(serializeProduct);
    const newClients = clients.filter(
      (c) => now.getTime() - c.reg.getTime() <= 7 * DAY,
    ).length;

    // Top productos por unidades vendidas
    const qtyByProduct = new Map<string, number>();
    for (const o of orders) {
      for (const item of JSON.parse(o.items) as {
        nombre: string;
        qty: number;
      }[]) {
        qtyByProduct.set(
          item.nombre,
          (qtyByProduct.get(item.nombre) ?? 0) + item.qty,
        );
      }
    }
    const top = [...qtyByProduct.entries()]
      .map(([product, qty]) => ({ product, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    // Últimos 14 días
    const last14: { label: string; total: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const dayStart = today - i * DAY;
      const total = sum(
        orders.filter((o) => inRange(o, dayStart, dayStart + DAY)),
      );
      last14.push({
        label: new Date(dayStart).toISOString().slice(5, 10),
        total,
      });
    }

    // Ingresos por categoría
    const catById = new Map(products.map((p) => [p.id, p.cat]));
    const byCat: Record<string, number> = {};
    for (const o of orders) {
      for (const item of JSON.parse(o.items) as {
        id: number;
        qty: number;
        precio: number;
      }[]) {
        const cat = catById.get(item.id) ?? 'Otros';
        byCat[cat] =
          Math.round(((byCat[cat] ?? 0) + item.precio * item.qty) * 100) / 100;
      }
    }

    const ticket = orders.length
      ? Math.round((sales / orders.length) * 100) / 100
      : 0;

    return {
      ventasHoy,
      ventasSemana,
      ventasMes,
      sales,
      pending,
      lowStock,
      newClients,
      top,
      last14,
      byCat,
      ticket,
      validCount: orders.length,
    };
  }
}
