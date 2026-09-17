import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
} from '@nestjs/common';
import { CouponsService } from './coupons.service';
import { CreateCouponDto, ValidateCouponDto } from './dto';
import { Roles } from '../common/roles.decorator';

@Controller('coupons')
export class CouponsController {
  constructor(private readonly coupons: CouponsService) {}

  @HttpCode(200)
  @Post('validate')
  validate(@Body() dto: ValidateCouponDto) {
    return this.coupons.validate(dto.code, dto.subtotal);
  }
}

@Controller('admin/coupons')
export class AdminCouponsController {
  constructor(private readonly coupons: CouponsService) {}

  @Roles('admin', 'superadmin')
  @Get()
  list() {
    return this.coupons.list();
  }

  @Roles('admin', 'superadmin')
  @Post()
  create(@Body() dto: CreateCouponDto) {
    return this.coupons.create(dto);
  }

  @Roles('admin', 'superadmin')
  @Delete(':code')
  remove(@Param('code') code: string) {
    return this.coupons.remove(code);
  }
}
