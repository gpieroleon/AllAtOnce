import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import {
  PRODUCTS,
  CATEGORIES,
  DESCRIPTIONS,
  SPECS,
  featuresFor,
  slugify,
  DEFAULT_SETTINGS,
  BASE_COUPONS,
  DEFAULT_SHIPPING,
  DEFAULT_PAYMENTS,
} from './seed-data';

export const SEED_USERS = [
  {
    name: 'Cliente Demo',
    email: 'demo@allatonce.com',
    password: 'AllAtOnce#2026',
    role: 'cliente',
  },
  {
    name: 'Equipo AAO',
    email: 'equipo@allatonce.com',
    password: 'Equipo2026!',
    role: 'admin',
  },
  {
    name: 'Admin AAO',
    email: 'admin@allatonce.com',
    password: 'Admin2026!',
    role: 'superadmin',
  },
];

export async function seed(prisma: PrismaClient): Promise<void> {
  for (const u of SEED_USERS) {
    const password = await bcrypt.hash(u.password, 10);
    await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role, password },
      create: { name: u.name, email: u.email, role: u.role, password },
    });
  }

  for (const c of CATEGORIES) {
    await prisma.category.upsert({
      where: { name: c.name },
      update: { label: c.label, icon: c.icon, g: JSON.stringify(c.g) },
      create: {
        name: c.name,
        label: c.label,
        icon: c.icon,
        g: JSON.stringify(c.g),
      },
    });
  }

  for (const p of PRODUCTS) {
    const data = {
      name: p.name,
      slug: slugify(p.name),
      cat: p.cat,
      cats: JSON.stringify([p.cat]),
      etiquetas: JSON.stringify([p.cat.toLowerCase()]),
      price: p.price,
      old: p.old,
      stock: p.stock,
      rating: p.rating,
      reviews: p.reviews,
      badge: p.badge,
      prime: p.prime,
      deal: p.deal,
      estado: 'publicado',
      descLarga: DESCRIPTIONS[p.id] ?? null,
      descCorta: DESCRIPTIONS[p.id]
        ? DESCRIPTIONS[p.id].split('.')[0] + '.'
        : null,
      specs: JSON.stringify(SPECS[p.id] ?? {}),
      feats: JSON.stringify(featuresFor(p)),
      imagenes: JSON.stringify([p.img]),
      icon: p.icon,
      g: JSON.stringify(p.g),
    };
    await prisma.product.upsert({
      where: { id: p.id },
      update: data,
      create: { id: p.id, ...data },
    });
  }

  for (const c of BASE_COUPONS) {
    await prisma.coupon.upsert({
      where: { code: c.code },
      update: { tipo: c.tipo, valor: c.valor, descripcion: c.descripcion },
      create: c,
    });
  }

  for (const s of DEFAULT_SHIPPING) {
    await prisma.shipMethod.upsert({
      where: { id: s.id },
      update: s,
      create: s,
    });
  }
  for (const p of DEFAULT_PAYMENTS) {
    await prisma.payMethod.upsert({
      where: { id: p.id },
      update: p,
      create: p,
    });
  }

  await prisma.setting.upsert({
    where: { id: 1 },
    update: DEFAULT_SETTINGS,
    create: { id: 1, ...DEFAULT_SETTINGS },
  });
}

const prisma = new PrismaClient();

async function main(): Promise<void> {
  await seed(prisma);
  console.log(
    'Seed completado: usuarios, 12 productos, 5 categorías, cupones, métodos y settings.',
  );
}

if (require.main === module) {
  main()
    .catch(async (e) => {
      console.error(e);
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
