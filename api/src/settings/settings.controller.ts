import { Body, Controller, Get, Put } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Roles } from '../common/roles.decorator';

@Controller()
export class SettingsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('settings')
  async getSettings() {
    const s = await this.prisma.setting.findFirstOrThrow();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...rest } = s;
    return rest;
  }

  @Get('shipping')
  async getShipping() {
    return this.prisma.shipMethod.findMany({
      where: { activo: true },
      orderBy: { id: 'asc' },
    });
  }

  @Get('payments')
  async getPayments() {
    return this.prisma.payMethod.findMany({
      where: { activo: true },
      orderBy: { id: 'asc' },
    });
  }

  @Roles('superadmin')
  @Put('settings')
  async putSettings(
    @Body()
    body: Partial<{
      tienda: string;
      iva: number;
      moneda: string;
      envioGratis: number;
      envioCoste: number;
    }>,
  ) {
    const current = await this.prisma.setting.findFirstOrThrow();
    const s = await this.prisma.setting.update({
      where: { id: current.id },
      data: body,
    });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...rest } = s;
    return rest;
  }

  @Roles('superadmin')
  @Put('shipping')
  async putShipping(@Body() body: { methods?: unknown[] } | unknown[]) {
    const methods = Array.isArray(body) ? body : (body?.methods ?? []);
    await this.prisma.shipMethod.deleteMany();
    await this.prisma.shipMethod.createMany({ data: methods as never[] });
    return this.prisma.shipMethod.findMany({ orderBy: { id: 'asc' } });
  }

  @Roles('superadmin')
  @Put('payments')
  async putPayments(@Body() body: { methods?: unknown[] } | unknown[]) {
    const methods = Array.isArray(body) ? body : (body?.methods ?? []);
    await this.prisma.payMethod.deleteMany();
    await this.prisma.payMethod.createMany({ data: methods as never[] });
    return this.prisma.payMethod.findMany({ orderBy: { id: 'asc' } });
  }
}
