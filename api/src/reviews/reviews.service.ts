import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { allReviewsFor, type GeneratedReview } from '../../prisma/seed-data';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  private async hiddenFor(productId: number): Promise<number[]> {
    const row = await this.prisma.reviewHidden.findUnique({
      where: { productId },
    });
    if (!row) return [];
    try {
      return JSON.parse(row.indexes) as number[];
    } catch {
      return [];
    }
  }

  /** Reseñas públicas: deterministas menos las ocultas por moderación. */
  async forProduct(
    productId: number,
  ): Promise<{ avg: number; total: number; list: GeneratedReview[] }> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) throw new NotFoundException('Producto no encontrado');

    const hidden = new Set(await this.hiddenFor(productId));
    const list = allReviewsFor(product).filter((_, i) => !hidden.has(i));
    const avg = list.length
      ? Math.round(
          (list.reduce((s, r) => s + r.rating, 0) / list.length) * 10,
        ) / 10
      : 0;
    return { avg, total: list.length, list };
  }

  /** Vista admin: todas las generadas + índices ocultos. */
  async adminList(
    productId: number,
  ): Promise<{ list: GeneratedReview[]; hidden: number[] }> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) throw new NotFoundException('Producto no encontrado');
    return {
      list: allReviewsFor(product),
      hidden: await this.hiddenFor(productId),
    };
  }

  async setHidden(
    productId: number,
    indexes: number[],
  ): Promise<{ hidden: number[] }> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) throw new NotFoundException('Producto no encontrado');
    await this.prisma.reviewHidden.upsert({
      where: { productId },
      update: { indexes: JSON.stringify(indexes) },
      create: { productId, indexes: JSON.stringify(indexes) },
    });
    return { hidden: indexes };
  }
}
