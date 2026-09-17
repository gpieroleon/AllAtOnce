import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Order as PrismaOrder } from '@prisma/client';
import { randomInt } from 'crypto';
import { PrismaService } from '../prisma.service';
import { CouponsService } from '../coupons/coupons.service';
import { CreateOrderDto } from './dto';

export interface OrderShape {
  id: string;
  fecha: string;
  cliente: string | null;
  nombreCliente: string;
  items: {
    id: number;
    nombre: string;
    qty: number;
    precio: number;
    img: string;
  }[];
  subtotal: number;
  descuento: number;
  cupon: string | null;
  envio: number;
  total: number;
  iva: number;
  direccion: Record<string, string>;
  pago: string;
  estado: string;
  tracking: string;
}

export function serializeOrder(o: PrismaOrder): OrderShape {
  return {
    id: o.id,
    fecha: o.fecha.toISOString(),
    cliente: o.clienteEmail,
    nombreCliente: o.nombreCliente,
    items: JSON.parse(o.items),
    subtotal: o.subtotal,
    descuento: o.descuento,
    cupon: o.cupon,
    envio: o.envio,
    total: o.total,
    iva: o.iva,
    direccion: JSON.parse(o.direccion),
    pago: o.pago,
    estado: o.estado,
    tracking: o.tracking,
  };
}

const r2 = (n: number) => Math.round(n * 100) / 100;

const genId = (): string => {
  let out = '';
  do {
    out =
      'AAO-' +
      randomInt(0, 36 ** 6)
        .toString(36)
        .toUpperCase()
        .padStart(6, '0');
  } while (out.length !== 10);
  return out;
};

const genTracking = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = 'PK';
  for (let i = 0; i < 10; i++) s += chars[randomInt(0, chars.length)];
  return s;
};

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly coupons: CouponsService,
  ) {}

  async create(
    dto: CreateOrderDto,
    userEmail: string | null,
  ): Promise<OrderShape> {
    const ids = dto.items.map((i) => i.id);
    const products = await this.prisma.product.findMany({
      where: { id: { in: ids } },
    });
    const byId = new Map(products.map((p) => [p.id, p]));

    const items: OrderShape['items'] = [];
    let subtotal = 0;
    for (const item of dto.items) {
      const p = byId.get(item.id);
      if (!p) throw new BadRequestException(`Producto ${item.id} no existe`);
      if (p.estado === 'borrador')
        throw new BadRequestException(`Producto ${item.id} no disponible`);
      const precio = p.price;
      subtotal = r2(subtotal + precio * item.qty);
      items.push({
        id: p.id,
        nombre: p.name,
        qty: item.qty,
        precio,
        img: JSON.parse(p.imagenes)[0] ?? '',
      });
    }

    // Cupón (validación en servidor, igual que el endpoint público)
    let descuento = 0;
    let cupon: string | null = null;
    if (dto.coupon) {
      const result = await this.coupons.validate(dto.coupon, subtotal);
      if (!result.ok) throw new BadRequestException('Cupón no válido');
      descuento = r2(result.amount);
      cupon = result.code;
    }

    // Envío según método y umbral de envío gratis
    const ship = await this.prisma.shipMethod.findUnique({
      where: { id: dto.shippingId },
    });
    if (!ship || !ship.activo)
      throw new BadRequestException('Método de envío no válido');
    const envio =
      ship.gratisDesde !== null && subtotal >= ship.gratisDesde
        ? r2(ship.extra)
        : r2(ship.precio + ship.extra);

    const pay = await this.prisma.payMethod.findUnique({
      where: { id: dto.paymentId },
    });
    if (!pay || !pay.activo)
      throw new BadRequestException('Método de pago no válido');

    const total = r2(subtotal - descuento + envio);
    const settings = await this.prisma.setting.findFirst();
    const ivaPct = settings?.iva ?? 21;
    const iva = r2((total * ivaPct) / 100);

    const email = userEmail ?? dto.address.email.toLowerCase();
    const row = await this.prisma.order.create({
      data: {
        id: genId(),
        clienteEmail: email,
        nombreCliente: dto.address.nombre,
        items: JSON.stringify(items),
        subtotal,
        descuento,
        cupon,
        envio,
        total,
        iva,
        direccion: JSON.stringify(dto.address),
        pago: pay.nombre,
        estado:
          pay.nombre === 'Contra reembolso' ? 'Pendiente de pago' : 'Pagado',
        tracking: genTracking(),
      },
    });
    return serializeOrder(row);
  }

  async mine(email: string): Promise<OrderShape[]> {
    const rows = await this.prisma.order.findMany({
      where: { clienteEmail: email },
      orderBy: { fecha: 'desc' },
    });
    return rows.map(serializeOrder);
  }

  async findOne(
    id: string,
    userEmail?: string,
    isAdmin = false,
  ): Promise<OrderShape> {
    const row = await this.prisma.order.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Pedido no encontrado');
    if (!isAdmin && row.clienteEmail !== userEmail) {
      throw new ForbiddenException('No puedes ver este pedido');
    }
    return serializeOrder(row);
  }

  async adminList(query: {
    estado?: string;
    desde?: string;
    hasta?: string;
    q?: string;
  }) {
    const where: Record<string, unknown> = {};
    if (query.estado) where.estado = query.estado;
    if (query.desde || query.hasta) {
      const fecha: Record<string, Date> = {};
      if (query.desde) fecha.gte = new Date(query.desde);
      if (query.hasta)
        fecha.lte = new Date(new Date(query.hasta).getTime() + 86399999);
      where.fecha = fecha;
    }
    if (query.q) {
      where.OR = [
        { id: { contains: query.q } },
        { nombreCliente: { contains: query.q } },
        { clienteEmail: { contains: query.q } },
      ];
    }
    const rows = await this.prisma.order.findMany({
      where,
      orderBy: { fecha: 'desc' },
    });
    return rows.map(serializeOrder);
  }

  async adminUpdate(
    id: string,
    patch: { estado?: string; tracking?: string },
  ): Promise<OrderShape> {
    const existing = await this.prisma.order.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Pedido no encontrado');
    const row = await this.prisma.order.update({
      where: { id },
      data: {
        ...(patch.estado !== undefined ? { estado: patch.estado } : {}),
        ...(patch.tracking !== undefined ? { tracking: patch.tracking } : {}),
      },
    });
    return serializeOrder(row);
  }
}
