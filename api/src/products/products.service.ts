import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Product as PrismaProduct } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { slugify } from '../../prisma/seed-data';

export interface ProductShape {
  id: number;
  name: string;
  slug: string;
  sku?: string | null;
  descCorta?: string | null;
  descLarga?: string | null;
  cat: string;
  cats: string[];
  etiquetas: string[];
  price: number;
  old: number;
  costo?: number | null;
  stock: number;
  variantes: { talla?: string; color?: string; stock: number }[];
  imagenes: string[];
  img: string;
  peso?: number | null;
  rating: number;
  reviews: number;
  badge: 'flash' | 'new' | 'top' | null;
  prime: boolean;
  deal: boolean;
  estado: string;
  specs: Record<string, string>;
  feats: string[];
  metaTitulo?: string | null;
  metaDescripcion?: string | null;
}

const parse = <T>(json: string, fallback: T): T => {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
};

export function serializeProduct(p: PrismaProduct): ProductShape {
  const imagenes = parse<string[]>(p.imagenes, []);
  return {
    ...p,
    cats: parse<string[]>(p.cats, []),
    etiquetas: parse<string[]>(p.etiquetas, []),
    imagenes,
    img: imagenes[0] ?? '',
    variantes: parse(p.variantes, []),
    specs: parse<Record<string, string>>(p.specs, {}),
    feats: parse<string[]>(p.feats, []),
    badge: (p.badge as ProductShape['badge']) ?? null,
  };
}

const SORTS: Record<string, (a: PrismaProduct, b: PrismaProduct) => number> = {
  featured: (a, b) => {
    const prio = (p: PrismaProduct) =>
      p.badge === 'flash'
        ? 0
        : p.badge === 'top'
          ? 1
          : p.badge === 'new'
            ? 2
            : 3;
    return prio(a) - prio(b) || b.rating - a.rating;
  },
  rating: (a, b) => b.rating - a.rating,
  'price-asc': (a, b) => a.price - b.price,
  'price-desc': (a, b) => b.price - a.price,
  discount: (a, b) =>
    1 - b.price / (b.old || b.price) - (1 - a.price / (a.old || a.price)),
};

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async listPublic(query: {
    cat?: string;
    q?: string;
    sort?: string;
  }): Promise<ProductShape[]> {
    const where: Prisma.ProductWhereInput = {
      estado: { in: ['publicado', 'agotado'] },
    };
    if (query.cat && query.cat !== 'all') {
      if (query.cat === 'ofertas') where.deal = true;
      else where.cat = query.cat;
    }
    if (query.q) {
      where.OR = [
        { name: { contains: query.q } },
        { descCorta: { contains: query.q } },
        { descLarga: { contains: query.q } },
      ];
    }
    const rows = await this.prisma.product.findMany({ where });
    const sort = SORTS[query.sort ?? 'featured'] ?? SORTS.featured;
    return rows.sort(sort).map(serializeProduct);
  }

  async listAll(): Promise<ProductShape[]> {
    const rows = await this.prisma.product.findMany({ orderBy: { id: 'asc' } });
    return rows.map(serializeProduct);
  }

  async findOne(idOrSlug: string): Promise<ProductShape> {
    const isNumeric = /^\d+$/.test(idOrSlug);
    const row = await this.prisma.product.findFirst({
      where: isNumeric ? { id: Number(idOrSlug) } : { slug: idOrSlug },
    });
    if (!row) throw new NotFoundException('Producto no encontrado');
    return serializeProduct(row);
  }

  private dtoToData(
    dto: Record<string, unknown>,
    existing?: PrismaProduct,
  ): Prisma.ProductUpdateInput {
    const data: Record<string, unknown> = { ...dto };
    for (const key of [
      'cats',
      'etiquetas',
      'variantes',
      'imagenes',
      'specs',
      'feats',
      'g',
    ]) {
      if (data[key] !== undefined) data[key] = JSON.stringify(data[key]);
    }
    if (data.name !== undefined && !data.slug && existing) {
      data.slug = slugify(String(data.name));
    }
    return data as Prisma.ProductUpdateInput;
  }

  async create(
    dto: Record<string, unknown> & { name: string; cat: string },
  ): Promise<ProductShape> {
    const data = this.dtoToData({ ...dto });
    if (!data.slug) data.slug = slugify(dto.name);
    if (!data.old) data.old = dto.price;
    if (data.estado === undefined) data.estado = 'publicado';
    const row = await this.prisma.product.create({
      data: data as Prisma.ProductCreateInput,
    });
    return serializeProduct(row);
  }

  async update(
    id: number,
    dto: Record<string, unknown>,
  ): Promise<ProductShape> {
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Producto no encontrado');
    const row = await this.prisma.product.update({
      where: { id },
      data: this.dtoToData(dto, existing),
    });
    return serializeProduct(row);
  }

  async bulk(
    ids: number[],
    patch: Record<string, unknown>,
  ): Promise<{ updated: number }> {
    await this.prisma.product.updateMany({
      where: { id: { in: ids } },
      data: this.dtoToData(patch),
    });
    return { updated: ids.length };
  }

  async setStock(id: number, stock: number): Promise<ProductShape> {
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Producto no encontrado');
    const row = await this.prisma.product.update({
      where: { id },
      data: { stock },
    });
    return serializeProduct(row);
  }

  async remove(id: number): Promise<{ deleted: boolean }> {
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Producto no encontrado');
    await this.prisma.product.delete({ where: { id } });
    return { deleted: true };
  }
}
