import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list() {
    const [cats, products] = await Promise.all([
      this.prisma.category.findMany({ orderBy: { name: 'asc' } }),
      this.prisma.product.findMany({
        where: { estado: { in: ['publicado', 'agotado'] } },
        select: { cat: true },
      }),
    ]);
    const counts = new Map<string, number>();
    for (const p of products) counts.set(p.cat, (counts.get(p.cat) ?? 0) + 1);
    return cats.map((c) => ({
      name: c.name,
      label: c.label,
      icon: c.icon,
      g: JSON.parse(c.g || '[]'),
      productCount: counts.get(c.name) ?? 0,
    }));
  }
}
