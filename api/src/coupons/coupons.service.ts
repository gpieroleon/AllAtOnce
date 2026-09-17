import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class CouponsService {
  constructor(private readonly prisma: PrismaService) {}

  async validate(code: string, subtotal: number) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { code: (code || '').toUpperCase().trim() },
    });
    if (!coupon) return { ok: false as const };

    if (coupon.tipo === 'pct') {
      return {
        ok: true as const,
        code: coupon.code,
        label: `-${coupon.valor}%`,
        amount: Math.round(subtotal * (coupon.valor / 100) * 100) / 100,
        descripcion: coupon.descripcion,
      };
    }
    return {
      ok: true as const,
      code: coupon.code,
      label: `-${coupon.valor.toFixed(2)}€`,
      amount: Math.min(coupon.valor, subtotal),
      descripcion: coupon.descripcion,
    };
  }

  list() {
    return this.prisma.coupon.findMany({ orderBy: { code: 'asc' } });
  }

  create(data: {
    code: string;
    tipo: 'pct' | 'fijo';
    valor: number;
    descripcion?: string;
  }) {
    return this.prisma.coupon.upsert({
      where: { code: data.code.toUpperCase().trim() },
      update: {
        tipo: data.tipo,
        valor: data.valor,
        descripcion: data.descripcion,
      },
      create: { ...data, code: data.code.toUpperCase().trim() },
    });
  }

  async remove(code: string) {
    await this.prisma.coupon.delete({
      where: { code: code.toUpperCase().trim() },
    });
    return { deleted: true };
  }
}
