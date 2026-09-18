import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  Req,
} from '@nestjs/common';
import {
  IsArray,
  IsEmail,
  IsIn,
  IsInt,
  IsString,
  ArrayNotEmpty,
} from 'class-validator';
import { StatsService } from './stats.service';
import { UsersAdminService } from './users-admin.service';
import { OrdersService } from '../orders/orders.service';
import { ReviewsService } from '../reviews/reviews.service';
import { PrismaService } from '../prisma.service';
import { Roles } from '../common/roles.decorator';
import { UpdateOrderDto } from '../orders/dto';

class UpdateRoleDto {
  @IsIn(['cliente', 'admin', 'superadmin'])
  role: string;
}

class CreateUserDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsIn(['cliente', 'admin', 'superadmin'])
  role: string;

  @IsString()
  password: string;
}

class HideReviewsDto {
  @IsInt()
  productId: number;

  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  indexes: number[];
}

class CreateNoteDto {
  @IsString()
  text: string;
}

@Controller('admin')
export class AdminController {
  constructor(
    private readonly stats: StatsService,
    private readonly usersAdmin: UsersAdminService,
    private readonly orders: OrdersService,
    private readonly reviews: ReviewsService,
    private readonly prisma: PrismaService,
  ) {}

  /* ── Dashboard ── */
  @Roles('admin', 'superadmin')
  @Get('stats')
  getStats() {
    return this.stats.getStats();
  }

  /* ── Pedidos ── */
  @Roles('admin', 'superadmin')
  @Get('orders')
  adminOrders(
    @Query()
    query: {
      estado?: string;
      desde?: string;
      hasta?: string;
      q?: string;
    },
  ) {
    return this.orders.adminList(query);
  }

  @Roles('admin', 'superadmin')
  @Patch('orders/:id')
  adminUpdateOrder(@Param('id') id: string, @Body() dto: UpdateOrderDto) {
    return this.orders.adminUpdate(id, dto);
  }

  /* ── Clientes ── */
  @Roles('admin', 'superadmin')
  @Get('clients')
  async clients() {
    const [users, orders] = await Promise.all([
      // Solo clientes: el equipo no aparece en la sección de clientes
      this.prisma.user.findMany({ where: { role: 'cliente' }, orderBy: { id: 'asc' } }),
      this.prisma.order.findMany(),
    ]);
    return users.map((u) => {
      const mine = orders.filter((o) => o.clienteEmail === u.email);
      return {
        email: u.email,
        name: u.name,
        reg: u.reg.toISOString(),
        orders: mine.length,
        spent: Math.round(mine.reduce((s, o) => s + o.total, 0) * 100) / 100,
      };
    });
  }

  @Roles('admin', 'superadmin')
  @Get('clients/:email/notes')
  async notes(@Param('email') email: string) {
    const rows = await this.prisma.clientNote.findMany({
      where: { email: email.toLowerCase() },
      orderBy: { fecha: 'desc' },
    });
    return rows.map((n) => ({ text: n.text, fecha: n.fecha.toISOString() }));
  }

  @Roles('admin', 'superadmin')
  @Post('clients/:email/notes')
  async addNote(@Param('email') email: string, @Body() dto: CreateNoteDto) {
    const target = email.toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: target },
    });
    if (!user) throw new NotFoundException('Cliente no encontrado');
    await this.prisma.clientNote.create({
      data: { email: target, text: dto.text },
    });
    const rows = await this.prisma.clientNote.findMany({
      where: { email: target },
      orderBy: { fecha: 'desc' },
    });
    return rows.map((n) => ({ text: n.text, fecha: n.fecha.toISOString() }));
  }

  /* ── Reseñas ── */
  @Roles('admin', 'superadmin')
  @Get('reviews')
  adminReviews(@Query('productId', ParseIntPipe) productId: number) {
    return this.reviews.adminList(productId);
  }

  @Roles('admin', 'superadmin')
  @Put('reviews/hide')
  hideReviews(@Body() dto: HideReviewsDto) {
    return this.reviews.setHidden(dto.productId, dto.indexes);
  }

  /* ── Usuarios (superadmin) ── */
  @Roles('superadmin')
  @Get('users')
  users() {
    return this.usersAdmin.list();
  }

  @Roles('superadmin')
  @Post('users')
  createUser(@Body() dto: CreateUserDto) {
    return this.usersAdmin.create(dto);
  }

  @Roles('superadmin')
  @Patch('users/:email/role')
  updateRole(
    @Param('email') email: string,
    @Body() dto: UpdateRoleDto,
    @Req() req: { user: { sub: string } },
  ) {
    return this.usersAdmin.updateRole(email, dto.role, req.user.sub);
  }

  @Roles('superadmin')
  @Delete('users/:email')
  removeUser(
    @Param('email') email: string,
    @Req() req: { user: { sub: string } },
  ) {
    return this.usersAdmin.remove(email, req.user.sub);
  }
}
