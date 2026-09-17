import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { AppModule } from '../src/app.module';
import { seed } from '../prisma/seed';

process.env.DATABASE_URL = 'file:./test-e2e.db';

describe('All At Once API (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;

  beforeAll(async () => {
    const dbPath = path.join(__dirname, '../prisma/test-e2e.db');
    if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
    execSync('npx prisma db push --skip-generate', {
      cwd: path.join(__dirname, '..'),
      env: { ...process.env },
      stdio: 'ignore',
    });

    prisma = new PrismaClient();
    await seed(prisma);

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
    const dbPath = path.join(__dirname, '../prisma/test-e2e.db');
    if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
  });

  it('register + login', async () => {
    const reg = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'secret123',
      })
      .expect(201);
    expect(reg.body).toMatchObject({
      name: 'Test User',
      email: 'test@example.com',
      role: 'cliente',
    });

    // Registro duplicado → 409
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'secret123',
      })
      .expect(409);

    const login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'demo@allatonce.com', password: 'AllAtOnce#2026' })
      .expect(200);
    expect(login.body.access_token).toBeDefined();
    expect(login.body.user.role).toBe('cliente');

    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'demo@allatonce.com', password: 'mala' })
      .expect(401);
  });

  it('listado de productos (12, filtros y sort)', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/products')
      .expect(200);
    expect(res.body).toHaveLength(12);

    const ofertas = await request(app.getHttpServer())
      .get('/api/products?cat=ofertas')
      .expect(200);
    expect(ofertas.body.every((p: { deal: boolean }) => p.deal)).toBe(true);

    const tech = await request(app.getHttpServer())
      .get('/api/products?cat=Tech')
      .expect(200);
    expect(tech.body).toHaveLength(3);

    const sorted = await request(app.getHttpServer())
      .get('/api/products?sort=price-asc')
      .expect(200);
    const prices = sorted.body.map((p: { price: number }) => p.price);
    expect([...prices].sort((a, b) => a - b)).toEqual(prices);
  });

  it('validate cupón', async () => {
    const ok = await request(app.getHttpServer())
      .post('/api/coupons/validate')
      .send({ code: 'AAO10', subtotal: 179.98 })
      .expect(200);
    expect(ok.body).toMatchObject({ ok: true, code: 'AAO10', amount: 18 });

    const bad = await request(app.getHttpServer())
      .post('/api/coupons/validate')
      .send({ code: 'NOPE', subtotal: 100 })
      .expect(200);
    expect(bad.body).toEqual({ ok: false });
  });

  it('creación de pedido guest con totales en servidor', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/orders')
      .send({
        items: [{ id: 1, qty: 2 }],
        address: {
          nombre: 'Invitado Prueba',
          email: 'guest@example.com',
          telefono: '600000000',
          direccion: 'Calle Falsa 123',
          ciudad: 'Madrid',
          provincia: 'Madrid',
          cp: '28001',
          pais: 'España',
        },
        shippingId: 'estandar',
        paymentId: 'tarjeta',
        coupon: 'AAO10',
      })
      .expect(201);

    expect(res.body.subtotal).toBe(179.98);
    expect(res.body.descuento).toBe(18);
    expect(res.body.envio).toBe(0); // gratisDesde 75 ≤ 179.98
    expect(res.body.total).toBe(161.98);
    expect(res.body.cupon).toBe('AAO10');
    expect(res.body.iva).toBeCloseTo(34.02, 2);
    expect(res.body.estado).toBe('Pagado');
    expect(res.body.id).toMatch(/^AAO-[0-9A-Z]{6}$/);
    expect(res.body.tracking).toMatch(/^PK[A-Z0-9]{10}$/);
    expect(res.body.items).toHaveLength(1);
  });

  it('pedido con contra reembolso → Pendiente de pago', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/orders')
      .send({
        items: [{ id: 10, qty: 1 }],
        address: {
          nombre: 'Otro Guest',
          email: 'guest2@example.com',
          telefono: '600000001',
          direccion: 'Calle X 1',
          ciudad: 'Barcelona',
          provincia: 'Barcelona',
          cp: '08001',
          pais: 'España',
        },
        shippingId: 'express',
        paymentId: 'reembolso',
      })
      .expect(201);
    expect(res.body.estado).toBe('Pendiente de pago');
    expect(res.body.envio).toBe(9.99);
  });

  it('guards: cliente no puede listar /admin/stats (403), superadmin sí (200)', async () => {
    const cliente = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'demo@allatonce.com', password: 'AllAtOnce#2026' })
      .expect(200);

    await request(app.getHttpServer())
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${cliente.body.access_token}`)
      .expect(403);

    await request(app.getHttpServer()).get('/api/admin/stats').expect(401);

    const superadmin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'admin@allatonce.com', password: 'Admin2026!' })
      .expect(200);

    const stats = await request(app.getHttpServer())
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${superadmin.body.access_token}`)
      .expect(200);
    expect(stats.body).toHaveProperty('ventasHoy');
    expect(stats.body).toHaveProperty('last14');
    expect(stats.body.lowStock.length).toBeGreaterThan(0);
  });
});
