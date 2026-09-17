import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto';
import { Roles } from '../common/roles.decorator';

interface RequestLike {
  headers: Record<string, string | undefined>;
}

@Controller('orders')
export class OrdersController {
  constructor(
    private readonly orders: OrdersService,
    private readonly jwtService: JwtService,
  ) {}

  @Post()
  create(@Body() dto: CreateOrderDto, @Req() req: RequestLike) {
    const auth = req.headers['authorization'] ?? '';
    let email: string | null = null;
    if (auth.startsWith('Bearer ')) {
      try {
        email = this.jwtService.verify<{ sub: string }>(auth.slice(7)).sub;
      } catch {
        email = null; // token inválido → se trata como guest
      }
    }
    return this.orders.create(dto, email);
  }

  @Roles('cliente', 'admin', 'superadmin')
  @Get('mine')
  mine(@Req() req: { user: { sub: string } }) {
    return this.orders.mine(req.user.sub);
  }

  @Roles('cliente', 'admin', 'superadmin')
  @Get(':id')
  findOne(
    @Param('id') id: string,
    @Req() req: { user: { sub: string; role: string } },
  ) {
    const isAdmin = req.user.role === 'admin' || req.user.role === 'superadmin';
    return this.orders.findOne(id, req.user.sub, isAdmin);
  }
}
